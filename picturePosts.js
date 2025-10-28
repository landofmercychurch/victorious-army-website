import { api } from "./api.js";
import { el } from "./utils.js";
import { refreshPostLikes, handlePostLike } from "./likes.js";
import { fetchPictureComments, postPictureComment } from "./commentsPublic.js";

/**
 * Picture posts UI:
 * - show latest post prominently
 * - "View All Posts" shows grid of thumbnails
 * - click thumb opens modal (full post, likes, comments)
 */

function createMetaFallback(post) {
  const head = document.head;
  const set = (prop, value, isName = false) => {
    const selector = isName ? `meta[name="${prop}"]` : `meta[property="${prop}"]`;
    let m = head.querySelector(selector);
    if (!m) {
      m = document.createElement("meta");
      if (isName) m.setAttribute("name", prop);
      else m.setAttribute("property", prop);
      head.appendChild(m);
    }
    m.setAttribute("content", value || "");
  };

  set("og:title", post.title || "Post");
  set("og:description", post.description?.slice(0, 120) || "");
  set("og:image", post.image_url || "");
  set("og:url", `${window.location.origin}/posts/preview/${post.id}`);
  set("twitter:card", "summary_large_image", true);
  set("twitter:title", post.title || "Post", true);
  set("twitter:description", post.description?.slice(0, 120) || "", true);
  set("twitter:image", post.image_url || "", true);
}

export async function initPicturePosts(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading posts…</p>";

  try {
    // ✅ Fetch from the correct route
    let posts = await api.get("/posts");
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

    // === Latest post (prominent) ===
    const latest = posts[0];
    const latestCard = buildLargeCard(latest);
    container.appendChild(latestCard);

    // === View All button ===
    const viewAllBtn = el("button", "view-all-btn");
    viewAllBtn.textContent = "📸 View All Posts";
    container.appendChild(viewAllBtn);

    // === Inline grid ===
    const gridWrapper = el("div", "all-posts-grid hidden");
    const gridControls = el("div", "grid-controls");
    const closeBtn = el("button", "close-all-btn");
    closeBtn.textContent = "✖ Close";
    const indicator = el("p", "grid-indicator");
    indicator.textContent = "🖼️ Click a thumbnail to open post";
    gridControls.append(closeBtn, indicator);
    gridWrapper.appendChild(gridControls);

    const thumbGrid = el("div", "thumb-grid");
    gridWrapper.appendChild(thumbGrid);

    // === Build thumbnails ===
    posts.forEach((post) => {
      const thumb = el("div", "post-thumb");
      const img = el("img");
      img.src = post.image_url || "";
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
      setTimeout(() => thumbGrid.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
    };

    closeBtn.onclick = () => {
      gridWrapper.classList.add("hidden");
      viewAllBtn.classList.remove("hidden");
    };

    // Auto-open if ?post=id in URL
    const urlPostId = new URLSearchParams(window.location.search).get("post");
    if (urlPostId) {
      const target = posts.find((p) => String(p.id) === String(urlPostId));
      if (target) {
        if (target.id !== latest.id) {
          gridWrapper.classList.remove("hidden");
          viewAllBtn.classList.add("hidden");
        }
        openPostModal(target);
      }
    }
  } catch (err) {
    console.error("❌ Failed to load posts:", err);
    container.innerHTML = "<p style='color:red;'>Failed to load posts.</p>";
  }
}

/* --- helpers --- */

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
    card.appendChild(img);
  }

  if (post.description) {
    const desc = el("p", "picture-description");
    const full = post.description;
    const short = full.length > 240 ? full.slice(0, 240) + "..." : full;
    desc.textContent = short;
    card.appendChild(desc);

    if (full.length > 240) {
      const readMore = el("button", "read-more-btn");
      readMore.textContent = "Read more";
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

  // Actions
  const actions = el("div", "picture-actions");
  const likeBtn = el("button", "like-btn", "❤️ Like");
  const likeCount = el("span", "like-count", "0 Likes");
  const commentBtn = el("button", "comment-btn", "💬 Comment");
  const shareBtn = el("button", "share-btn", "🔗 Share");
  actions.append(likeBtn, likeCount, commentBtn, el("span", "spacer"), shareBtn);
  card.appendChild(actions);

  refreshPostLikes(post.id, likeCount);
  likeBtn.addEventListener("click", () => handlePostLike(post.id, likeCount));

  commentBtn.addEventListener("click", () => openPostModal(post));

  shareBtn.addEventListener("click", async () => {
    const postUrl = `${window.location.origin}/?post=${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title || "Check this post",
          text: post.description?.slice(0, 120) || "",
          url: postUrl,
        });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(postUrl);
        alert("Post link copied to clipboard!");
      } catch {
        window.open(postUrl, "_blank");
      }
    }
  });

  card.querySelector(".picture-img")?.addEventListener("click", () => openPostModal(post));

  return card;
}

/* --- Modal --- */
function openPostModal(post) {
  createMetaFallback(post);
  let modal = document.querySelector(".post-modal");
  if (!modal) {
    modal = el("div", "post-modal");
    modal.innerHTML = `
      <div class="modal-inner">
        <button class="modal-close" aria-label="Close">✖</button>
        <div class="modal-body"></div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector(".modal-close").addEventListener("click", () => modal.classList.remove("show"));
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("show");
    });
  }

  const body = modal.querySelector(".modal-body");
  body.innerHTML = `
    <img src="${post.image_url || ""}" alt="${post.title || ""}" class="modal-image" />
    <h2 class="modal-title">${post.title || ""}</h2>
    <p class="modal-desc">${post.description || ""}</p>
    <div class="modal-actions">
      <button class="modal-like">❤️ Like</button>
      <span class="modal-like-count">0 Likes</span>
      <button class="modal-comment">💬 Comment</button>
      <button class="modal-share">🔗 Share</button>
    </div>
    <div class="modal-comments"></div>
  `;

  const likeBtn = body.querySelector(".modal-like");
  const likeCountEl = body.querySelector(".modal-like-count");
  refreshPostLikes(post.id, likeCountEl);
  likeBtn.addEventListener("click", async () => {
    await api.post("/likes", { post_id: post.id });
    refreshPostLikes(post.id, likeCountEl);
  });

  const commentsContainer = body.querySelector(".modal-comments");
  commentsContainer.innerHTML = "<p>Loading comments…</p>";

  async function loadComments() {
    try {
      const comments = await fetchPictureComments(post.id);
      commentsContainer.innerHTML = `
        <div class="comments-header"><strong>${comments.length} Comments</strong></div>
        <div class="comment-list">
          ${comments
            .map((c) => `<div class="comment"><b>${c.name || "Guest"}:</b> ${escapeHtml(c.content)}</div>`)
            .join("")}
        </div>
        <form class="comment-form">
          <input name="name" placeholder="Your name (optional)" />
          <textarea name="content" required placeholder="Write your comment..."></textarea>
          <button type="submit">Post Comment</button>
        </form>
      `;
      const form = commentsContainer.querySelector(".comment-form");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = form.querySelector('input[name="name"]').value.trim() || "Guest";
        const content = form.querySelector('textarea[name="content"]').value.trim();
        if (!content) return;
        await postPictureComment({ post_id: post.id, name, content });
        await loadComments();
      });
    } catch (err) {
      commentsContainer.innerHTML = "<p style='color:red;'>Failed to load comments.</p>";
      console.error("comments load error", err);
    }
  }
  loadComments();

  const shareBtn = body.querySelector(".modal-share");
  shareBtn.addEventListener("click", async () => {
    const postUrl = `${window.location.origin}/?post=${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title || "Check this post",
          text: post.description?.slice(0, 120) || "",
          url: postUrl,
        });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(postUrl);
        alert("Post link copied to clipboard!");
      } catch {
        window.open(postUrl, "_blank");
      }
    }
  });

  modal.classList.add("show");
}

/* --- HTML escape --- */
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
