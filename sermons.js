// js/sermons.js
import { api } from "./api.js";
import { el } from "./utils.js";

export async function initSermons(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading sermons…</p>";

  try {
    const sermons = await api.get("/sermons");
    container.innerHTML = "";

    if (!sermons.length) {
      container.innerHTML = "<p>No sermons uploaded yet.</p>";
      return;
    }

    // Latest sermon (first one since backend sorts DESC)
    renderSermon(sermons[0], container, true);

    // Older sermons
    if (sermons.length > 1) {
      const older = el("div", "older-sermons");
      const title = el("h3", null, "📚 Older Sermons");
      older.appendChild(title);

      sermons.slice(1).forEach(s => renderSermon(s, older, false));
      container.appendChild(older);
    }
  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load sermons.</p>`;
    console.error(err);
  }
}

function renderSermon(s, container, latest = false) {
  const card = el("div", latest ? "sermon-card latest" : "sermon-card");

  // Video
  if (s.video_url) {
    const video = document.createElement("video");
    video.className = "sermon-video";
    video.src = s.video_url;
    video.controls = true;
    if (latest) video.autoplay = false;
    card.appendChild(video);
  }

  // Title + description
  const info = el("div", "sermon-info");
  const title = el("h4", null, s.title || "Untitled Sermon");
  const desc = el("p", null, s.description || "");
  const date = el("span", "sermon-date", new Date(s.created_at).toLocaleString());
  info.append(title, desc, date);
  card.appendChild(info);

  // Actions
  const actions = el("div", "sermon-actions");
  const likeBtn = el("button", "like-btn", "❤️ Like");
  const likeCount = el("span", "like-count", "0 Likes");

  likeBtn.onclick = async () => {
    await api.post("/likes", { sermon_id: s.id });
    updateLikeCount();
  };

  async function updateLikeCount() {
    const result = await api.get(`/likes/count/${s.id}?type=sermon`);
    likeCount.textContent = `${result.count} Likes`;
  }
  updateLikeCount();

  const commentBtn = el("button", "comment-btn", "💬 Comments");
  const commentsBox = el("div", "comments-box");
  commentBtn.onclick = () => toggleComments(s.id, commentsBox);

  actions.append(likeBtn, likeCount, commentBtn);
  card.appendChild(actions);
  card.appendChild(commentsBox);

  container.appendChild(card);
}

// --- Comments ---
async function toggleComments(sermonId, box) {
  if (box.dataset.loaded === "true") {
    box.classList.toggle("open");
    return;
  }

  box.innerHTML = "<p>Loading comments…</p>";

  try {
    const comments = await api.get(`/comments/sermon/${sermonId}`);
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
      await api.post("/comments", { sermon_id: sermonId, text });
      input.value = "";
      toggleComments(sermonId, box);
    };

    box.append(list, form);
    box.dataset.loaded = "true";
    box.classList.add("open");
  } catch (err) {
    box.innerHTML = "<p style='color:red'>Failed to load comments.</p>";
  }
}
