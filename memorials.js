// js/memorials.js
import { api } from "./api.js";
import { el } from "./utils.js";

export async function initMemorials(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading memorials…</p>";

  try {
    const memorials = await api.get("/memorials");
    container.innerHTML = "";

    if (!memorials.length) {
      container.innerHTML = "<p>No memorials yet.</p>";
      return;
    }

    // Carousel container
    const carousel = el("div", "memorial-carousel");
    memorials.slice(0, 10).forEach(m => {
      const item = renderMemorial(m);
      carousel.appendChild(item);
    });
    container.appendChild(carousel);

    // Older memorials
    if (memorials.length > 10) {
      const older = el("div", "older-memorials");
      const title = el("h3", null, "🕊️ Older Memorials");
      older.appendChild(title);
      memorials.slice(10).forEach(m => older.appendChild(renderMemorial(m, true)));
      container.appendChild(older);
    }
  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load memorials.</p>`;
    console.error(err);
  }
}

function renderMemorial(m, fullWidth = false) {
  const card = el("div", fullWidth ? "memorial-card full" : "memorial-card");

  // Image
  const img = document.createElement("img");
  img.src = m.image_url;
  img.alt = m.title || "Memorial Image";
  img.className = "memorial-image";
  img.onclick = () => openPreview(m);
  card.appendChild(img);

  // Info
  const info = el("div", "memorial-info");
  const title = el("h4", null, m.title || "Memorial");
  const date = el("span", "memorial-date", new Date(m.created_at).toLocaleString());
  info.append(title, date);
  card.appendChild(info);

  // Actions
  const actions = el("div", "memorial-actions");
  const likeBtn = el("button", "like-btn", "❤️ Like");
  const likeCount = el("span", "like-count", "0 Likes");

  likeBtn.onclick = async () => {
    await api.post("/likes", { memorial_id: m.id });
    updateLikeCount();
  };

  async function updateLikeCount() {
    const result = await api.get(`/likes/count/${m.id}?type=memorial`);
    likeCount.textContent = `${result.count} Likes`;
  }
  updateLikeCount();

  const commentBtn = el("button", "comment-btn", "💬 Comments");
  const commentsBox = el("div", "comments-box");
  commentBtn.onclick = () => toggleComments(m.id, commentsBox);

  actions.append(likeBtn, likeCount, commentBtn);
  card.appendChild(actions);
  card.appendChild(commentsBox);

  return card;
}

// --- Fullscreen Preview ---
function openPreview(m) {
  const overlay = el("div", "memorial-overlay");
  overlay.innerHTML = `
    <div class="memorial-preview">
      <span class="close-btn">&times;</span>
      <img src="${m.image_url}" alt="${m.title}" />
      <h4>${m.title || "Memorial"}</h4>
      <p>${new Date(m.created_at).toLocaleString()}</p>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector(".close-btn").onclick = () => overlay.remove();
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
}

// --- Comments ---
async function toggleComments(memorialId, box) {
  if (box.dataset.loaded === "true") {
    box.classList.toggle("open");
    return;
  }

  box.innerHTML = "<p>Loading comments…</p>";

  try {
    const comments = await api.get(`/comments/memorial/${memorialId}`);
    box.innerHTML = "";

    const list = document.createElement("div");
    list.className = "comment-list";

    comments.forEach(c => {
      const item = document.createElement("div");
      item.className = "comment";
      item.textContent = c.text;
      list.appendChild(item);
    });

    const form = document.createElement("form");
    form.className = "comment-form";
    form.innerHTML = `
      <input type="text" placeholder="Write a comment…" required />
      <button type="submit">Post</button>
    `;
    form.onsubmit = async e => {
      e.preventDefault();
      const input = form.querySelector("input");
      const text = input.value.trim();
      if (!text) return;
      await api.post("/comments", { memorial_id: memorialId, text });
      input.value = "";
      toggleComments(memorialId, box);
    };

    box.append(list, form);
    box.dataset.loaded = "true";
    box.classList.add("open");
  } catch (err) {
    box.innerHTML = "<p style='color:red'>Failed to load comments.</p>";
  }
}
