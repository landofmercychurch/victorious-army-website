// src/picturePosts.js
import { api } from "./api.js";
import { el } from "./utils.js";
import { refreshPostLikes, handlePostLike } from "./likes.js";
import { fetchPictureComments, postPictureComment } from "./commentsPublic.js";

/**
 * Picture posts UI:
 * - Moderately-sized featured post on page
 * - "View All Posts" opens fullscreen gallery modal (responsive grid)
 * - Selecting a thumbnail replaces featured post and closes modal
 * - Likes & comments wired to your existing endpoints
 */

/* ---------- Helpers ---------- */

const STORAGE_KEY = "featuredPostId";

function lockBodyScroll(lock = true) {
  document.body.style.overflow = lock ? "hidden" : "";
}

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

/* ---------- Main init ---------- */

export async function initPicturePosts(container) {
  console.log("🚀 initPicturePosts:", container);
  if (!container) return;

  container.innerHTML = "<p>Loading posts…</p>";

  try {
    let posts = await api.get("/posts");
    if (!Array.isArray(posts)) posts = posts.data || [];

    console.log("📸 Posts fetched:", posts.length, "items");
    if (!posts.length) {
      container.innerHTML = "<p>No posts yet.</p>";
      return;
    }

    // sort newest first
    posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Determine selected/featured post (localStorage -> URL param -> newest)
    const urlPostId = new URLSearchParams(window.location.search).get("post");
    const storedId = localStorage.getItem(STORAGE_KEY);
    let featuredId = urlPostId || storedId || posts[0].id;
    let featured = posts.find(p => String(p.id) === String(featuredId)) || posts[0];

    // build UI shell
    container.innerHTML = "";
    container.classList.add("picture-feed");

    const featuredWrapper = el("div", "featured-wrapper");
    container.appendChild(featuredWrapper);

    const controlsWrapper = el("div", "picture-controls");
    const viewAllBtn = el("button", "view-all-btn");
    viewAllBtn.textContent = "📸 View All Posts";
    controlsWrapper.appendChild(viewAllBtn);
    container.appendChild(controlsWrapper);

    // build the initial featured card
    function renderFeatured(post) {
      console.log("🟢 Rendering featured post:", post.id);
      featuredWrapper.innerHTML = ""; // clear
      const card = buildLargeCard(post, { openCommentsInModal: true });
      featuredWrapper.appendChild(card);
      // persist selection
      try { localStorage.setItem(STORAGE_KEY, String(post.id)); } catch (e) { /* ignore */ }
      featured = post;
    }
    renderFeatured(featured);

    // Prepare gallery modal (hidden)
    const galleryModal = createGalleryModal(posts, (selectedPost) => {
      // on select: update featured and close modal
      renderFeatured(selectedPost);
      closeGalleryModal();
    });

    document.body.appendChild(galleryModal); // appended but initially hidden

    function openGalleryModal() {
      console.log("🖼️ Opening gallery modal");
      galleryModal.classList.add("show");
      lockBodyScroll(true);
    }
    function closeGalleryModal() {
      galleryModal.classList.remove("show");
      lockBodyScroll(false);
    }

    viewAllBtn.addEventListener("click", openGalleryModal);

    // close when clicking the gallery close button
    galleryModal.querySelector(".gallery-close")?.addEventListener("click", closeGalleryModal);

    // If URL had ?post=ID and that post is not the initial featured, open post modal
    if (urlPostId) {
      const target = posts.find(p => String(p.id) === String(urlPostId));
      if (target) {
        // show featured as requested, and open its post modal
        renderFeatured(target);
        openPostModal(target, { openComments: false });
      }
    }
  } catch (err) {
    console.error("❌ Failed to load posts:", err);
    container.innerHTML = "<p style='color:red;'>Failed to load posts.</p>";
  }
}

/* ---------- Build featured (large) card ---------- */
/**
 * options:
 *   - openCommentsInModal (bool) : whether clicking comment button opens modal comments
 */
function buildLargeCard(post, options = {}) {
  const card = el("div", "picture-card");
  card.dataset.id = post.id;

  // Title
  if (post.title) {
    const title = el("h3", "picture-title");
    title.textContent = post.title;
    card.appendChild(title);
  }

  // Moderately-sized image (responsive)
  if (post.image_url) {
    const img = el("img", "picture-img", { src: post.image_url, alt: post.title || "Image" });
    img.loading = "lazy";
    img.onerror = () => console.error("🚫 Image failed to load:", post.image_url, post.id);
    card.appendChild(img);
  } else {
    const placeholder = el("div", "picture-img placeholder");
    placeholder.textContent = "No image";
    card.appendChild(placeholder);
  }

  // Description (trimmed)
  if (post.description) {
    const desc = el("p", "picture-description");
    const full = String(post.description || "");
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

  // Actions row
  const actions = el("div", "picture-actions");
  const likeBtn = el("button", "like-btn");
  likeBtn.innerHTML = "❤️ <span class='label'>Like</span>";
  const likeCount = el("span", "like-count");
  likeCount.textContent = "0 Likes";

  const commentBtn = el("button", "comment-btn");
  commentBtn.innerHTML = "💬 <span class='label'>Comment</span>";

  const shareBtn = el("button", "share-btn");
  shareBtn.innerHTML = "🔗 <span class='label'>Share</span>";

  actions.append(likeBtn, likeCount, commentBtn, shareBtn);
  card.appendChild(actions);

  // wire likes
  (async () => {
    try {
      await refreshPostLikes(post.id, likeCount);
    } catch (e) {
      console.warn("⚠️ refreshPostLikes error", e);
      likeCount.textContent = "0 Likes";
    }
  })();

  likeBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await handlePostLike(post.id, likeCount);
      // small visual feedback
      likeBtn.animate([{ transform: "scale(1.05)" }, { transform: "scale(1)" }], { duration: 120 });
    } catch (err) {
      console.error("Failed to like:", err);
    }
  });

  // comment button opens the post modal with comments focused
  commentBtn.addEventListener("click", () => openPostModal(post, { openComments: true }));

  // share
  shareBtn.addEventListener("click", async () => {
    const postUrl = `${window.location.origin}/?post=${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title || "Check this post",
          text: post.description?.slice(0, 120) || "",
          url: postUrl,
        });
      } else {
        await navigator.clipboard.writeText(postUrl);
        alert("Post link copied to clipboard!");
      }
    } catch (e) {
      console.error("Share failed:", e);
    }
  });

  // clicking image opens post modal (non-comments)
  card.querySelector(".picture-img")?.addEventListener("click", () => openPostModal(post, { openComments: false }));

  return card;
}

/* ---------- Gallery modal (fullscreen) ---------- */
function createGalleryModal(posts, onSelect) {
  const modal = el("div", "gallery-modal");
  modal.innerHTML = `
    <div class="gallery-backdrop"></div>
    <div class="gallery-inner">
      <button class="gallery-close" aria-label="Close gallery">✖ Close Gallery</button>
      <div class="gallery-indicator">🖼️ Click a thumbnail to set as featured</div>
      <div class="gallery-grid"></div>
    </div>
  `;
  // hide by default; CSS should manage .show to display
  const grid = modal.querySelector(".gallery-grid");

  // populate grid
  posts.forEach((p) => {
    const item = el("div", "gallery-item");
    const img = el("img", "gallery-thumb", { src: p.image_url || "", alt: p.title || "Post" });
    img.loading = "lazy";
    img.onerror = () => img.classList.add("thumb-error");
    const label = el("div", "gallery-label");
    label.textContent = p.title || "";
    item.append(img, label);
    item.addEventListener("click", () => {
  console.log("🎯 Gallery select (open full modal):", p.id);
  openPostModal(p, { openComments: false }); // open full post modal
  closeGalleryModal(); // hide gallery after selecting
});

    grid.appendChild(item);
  });

  // clicking backdrop closes
  modal.querySelector(".gallery-backdrop").addEventListener("click", () => {
    modal.classList.remove("show");
    lockBodyScroll(false);
  });

  return modal;
}

/* ---------- Post modal (single post with comments & likes) ---------- */
function openPostModal(post, { openComments = false } = {}) {
  console.log("🪟 openPostModal:", post.id, "openComments:", openComments);
  createMetaFallback(post);

  let modal = document.querySelector(".post-modal-overlay");
  if (!modal) {
    modal = el("div", "post-modal-overlay");
    modal.innerHTML = `
      <div class="post-modal-content">
        <button class="post-modal-close" aria-label="Close post">✖</button>
        <div class="post-modal-body"></div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector(".post-modal-close").addEventListener("click", () => {
      modal.classList.remove("show");
      lockBodyScroll(false);
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("show");
        lockBodyScroll(false);
      }
    });
  }

  const body = modal.querySelector(".post-modal-body");
  body.innerHTML = `
    <img class="modal-image" src="${post.image_url || ""}" alt="${post.title || ""}" />
    <h2 class="modal-title">${post.title || ""}</h2>
    <p class="modal-desc">${post.description || ""}</p>
    <div class="modal-actions">
      <button class="modal-like">❤️ Like</button>
      <span class="modal-like-count">0 Likes</span>
      <button class="modal-comment">💬 Comment</button>
      <button class="modal-share">🔗 Share</button>
    </div>
    <div class="modal-comments-area"></div>
  `;

  const likeBtn = body.querySelector(".modal-like");
  const likeCountEl = body.querySelector(".modal-like-count");
  refreshPostLikes(post.id, likeCountEl);

  likeBtn.addEventListener("click", async () => {
    try {
      await api.post("/likes", { post_id: post.id });
      await refreshPostLikes(post.id, likeCountEl);
    } catch (err) {
      console.error("modal like error:", err);
    }
  });

  const commentsArea = body.querySelector(".modal-comments-area");
  async function loadComments() {
    commentsArea.innerHTML = "<p>Loading comments…</p>";
    try {
      let comments = await fetchPictureComments(post.id);
      if (!Array.isArray(comments)) comments = [];
      commentsArea.innerHTML = `
        <div class="comments-header"><strong>${comments.length} Comments</strong></div>
        <div class="comment-list">
          ${comments.map(c => `<div class="comment"><b>${escapeHtml(c.name || "Guest")}:</b> ${escapeHtml(c.content)}</div>`).join("")}
        </div>
        <form class="comment-form">
          <input name="name" placeholder="Your name (optional)" />
          <textarea name="content" required placeholder="Write your comment..."></textarea>
          <button type="submit">Post Comment</button>
        </form>
      `;
      const form = commentsArea.querySelector(".comment-form");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = form.querySelector('input[name="name"]').value.trim() || "Guest";
        const content = form.querySelector('textarea[name="content"]').value.trim();
        if (!content) return;
        await postPictureComment({ post_id: post.id, name, content });
        await loadComments(); // refresh
      });
    } catch (err) {
      commentsArea.innerHTML = "<p style='color:red;'>Failed to load comments.</p>";
      console.error("comments load error", err);
    }
  }

  // comment button shows comments area
  const commentBtn = body.querySelector(".modal-comment");
  commentBtn.addEventListener("click", () => {
    // if already loaded/shown, scroll to it; otherwise load
    if (commentsArea.querySelector(".comment-list")) {
      commentsArea.scrollIntoView({ behavior: "smooth" });
    } else {
      loadComments().then(() => commentsArea.scrollIntoView({ behavior: "smooth" }));
    }
  });

  // share
  const shareBtn = body.querySelector(".modal-share");
  shareBtn.addEventListener("click", async () => {
    const postUrl = `${window.location.origin}/?post=${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title || "Check this post",
          text: post.description?.slice(0, 120) || "",
          url: postUrl,
        });
      } else {
        await navigator.clipboard.writeText(postUrl);
        alert("Post link copied to clipboard!");
      }
    } catch (e) {
      console.error("Share failed:", e);
    }
  });

  // If caller asked to open comments immediately, load and scroll
  if (openComments) {
    loadComments().then(() => {
      commentsArea.scrollIntoView({ behavior: "smooth" });
    });
  }

  modal.classList.add("show");
  lockBodyScroll(true);
}

/* ---------- Utils ---------- */
function escapeHtml(str = "") {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
