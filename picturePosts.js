// src/picturePosts.js
import { api } from "./api.js";
import { el } from "./utils.js";
import { refreshPostLikes, handlePostLike } from "./likes.js";
import { fetchPictureComments, postPictureComment } from "./commentsPublic.js";

/**
 * Picture Posts UI:
 * - Shows latest post prominently
 * - "View All Posts" → inline grid of thumbnails
 * - Click thumb → modal with full post, likes, and comments
 */

export async function initPicturePosts(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading posts…</p>";

  try {
    // ✅ Try picture-posts, fallback to /posts if empty or missing
    let posts = await api.get("/picture-posts");
    if (!Array.isArray(posts) || posts.length === 0) {
      posts = await api.get("/posts");
    }
    if (!Array.isArray(posts)) posts = posts.data || [];

    console.log("📸 Posts fetched:", posts);

    if (!posts.length) {
      container.innerHTML = "<p>No posts yet.</p>";
      return;
    }

    // Sort newest first
    posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    container.innerHTML = "";
    container.classList.add("picture-feed");

    // === Latest Post ===
    const latest = posts[0];
    const latestCard = buildLargeCard(latest);
    container.appendChild(latestCard);

    // === View All Button ===
    const viewAllBtn = el("button", "view-all-btn", "📸 View All Posts");
    container.appendChild(viewAllBtn);

    // === All Posts Grid ===
    const gridWrapper = el("div", "all-posts-grid hidden");
    const gridControls = el("div", "grid-controls");
    const closeBtn = el("button", "close-all-btn", "✖ Close");
    const indicator = el("p", "grid-indicator", "🖼️ Click a thumbnail to open post");
    gridControls.append(closeBtn, indicator);
    gridWrapper.appendChild(gridControls);

    const thumbGrid = el("div", "thumb-grid");
    gridWrapper.appendChild(thumbGrid);

    posts.forEach(post => {
      const thumb = el("div", "post-thumb");
      const img = el("img");
      img.src = post.image_url || ""; // ✅ correct field
      img.alt = post.title || "Post image";
      img.loading = "lazy";
      thumb.appendChild(img);
      thumb.addEventListener("click", () => openPostModal(post));
      thumbGrid.appendChild(thumb);
    });

    container.appendChild(gridWrapper);

    // === Handlers ===
    viewAllBtn.onclick = () => {
      gridWrapper.classList.remove("hidden");
      viewAllBtn.classList.add("hidden");
    };
    closeBtn.onclick = () => {
      gridWrapper.classList.add("hidden");
      viewAllBtn.classList.remove("hidden");
    };

  } catch (err) {
    console.error("❌ Failed to load posts:", err);
    container.innerHTML = `<p style="color:red;">Failed to load posts.</p>`;
  }
}

/* --- Build the main card --- */
function buildLargeCard(post) {
  const card = el("div", "picture-card");

  if (post.title) {
    const title = el("h3", "picture-title");
    title.textContent = post.title;
    card.appendChild(title);
  }

  if (post.image_url) {
    const img = el("img", "picture-img", { src: post.image_url, alt: post.title || "Image" });
    img.loading = "lazy";
    img.addEventListener("click", () => openPostModal(post));
    card.appendChild(img);
  }

  if (post.description) {
    const desc = el("p", "picture-description");
    const full = post.description.trim();
    const short = full.length > 240 ? full.slice(0, 240) + "..." : full;
    desc.textContent = short;
    card.appendChild(desc);

    if (full.length > 240) {
      const readMore = el("button", "read-more-btn", "Read more");
      readMore.addEventListener("click", () => {
        if (desc.textContent === short) {
          desc.textContent = full;
          readMore.textContent = "Show less";
        } else {
          desc.textContent = short;
          readMore.textContent = "Read more";
        }
      });
      card.appendChild(readMore);
    }
  }

  // --- Actions ---
  const actions = el("div", "picture-actions");
  const likeBtn = el("button", "like-btn", "❤️ Like");
  const likeCount = el("span", "like-count", "0 Likes");
  const commentBtn = el("button", "comment-btn", "💬 Comment");
  const shareBtn = el("button", "share-btn", "🔗 Share");
  actions.append(likeBtn, likeCount, commentBtn, shareBtn);
  card.appendChild(actions);

  refreshPostLikes(post.id, likeCount);
  likeBtn.addEventListener("click", () => handlePostLike(post.id, likeCount));
  commentBtn.addEventListener("click", () => openPostModal(post));
  shareBtn.addEventListener("click", () => sharePost(post));

  return card;
}

/* --- Modal --- */
function openPostModal(post) {
  let modal = document.querySelector(".post-modal");
  if (!modal) {
    modal = el("div", "post-modal");
    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close">✖</button>
        <div class="modal-body"></div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector(".modal-close").addEventListener("click", () => modal.classList.remove("show"));
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("show"); });
  }

  const body = modal.querySelector(".modal-body");
  body.innerHTML = `
    <img src="${post.image_url || ""}" alt="${post.title || ""}" class="modal-image" />
    <h2>${post.title || ""}</h2>
    <p>${post.description || ""}</p>
    <div class="modal-actions">
      <button class="modal-like">❤️ Like</button>
      <span class="modal-like-count">0 Likes</span>
      <button class="modal-comment">💬 Comment</button>
      <button class="modal-share">🔗 Share</button>
    </div>
    <div class="modal-comments"><p>Loading comments…</p></div>
  `;

  const likeBtn = body.querySelector(".modal-like");
  const likeCountEl = body.querySelector(".modal-like-count");
  refreshPostLikes(post.id, likeCountEl);
  likeBtn.addEventListener("click", () => handlePostLike(post.id, likeCountEl));

  const commentsBox = body.querySelector(".modal-comments");
  fetchAndRenderComments(post, commentsBox);

  const shareBtn = body.querySelector(".modal-share");
  shareBtn.addEventListener("click", () => sharePost(post));

  modal.classList.add("show");
}

async function fetchAndRenderComments(post, container) {
  try {
    const comments = await fetchPictureComments(post.id);
    container.innerHTML = `
      <strong>${comments.length} Comments</strong>
      <div class="comment-list">
        ${comments.map(c => `<div class="comment"><b>${c.name || "Guest"}:</b> ${escapeHtml(c.content)}</div>`).join("")}
      </div>
      <form class="comment-form">
        <input name="name" placeholder="Your name (optional)" />
        <textarea name="content" required placeholder="Write a comment..."></textarea>
        <button type="submit">Post</button>
      </form>
    `;
    const form = container.querySelector(".comment-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = form.name.value.trim() || "Guest";
      const content = form.content.value.trim();
      if (!content) return;
      await postPictureComment({ post_id: post.id, name, content });
      fetchAndRenderComments(post, container);
    });
  } catch (err) {
    console.error("comments load error", err);
    container.innerHTML = "<p style='color:red;'>Failed to load comments.</p>";
  }
}

/* --- Share helper --- */
async function sharePost(post) {
  const url = `${window.location.origin}/?post=${post.id}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: post.title, text: post.description?.slice(0, 120), url });
    } catch {}
  } else {
    try {
      await navigator.clipboard.writeText(url);
      alert("Post link copied to clipboard!");
    } catch {
      window.open(url, "_blank");
    }
  }
}

/* --- Escape HTML --- */
function escapeHtml(str = "") {
  return String(str).replace(/[&<>]/g, s => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[s]));
}

/* --- Init on load --- */
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("picture-feed");
  initPicturePosts(container);
});
