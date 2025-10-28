// picturePosts.js
// src/picturePosts.js
import { api } from "./api.js";
import { el } from "./utils.js";
import { fetchPictureComments, postPictureComment } from "./commentsPublic.js";

export async function initPicturePosts(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading posts...</p>";

  try {
    const posts = await api.get("/picture-posts");
    if (!Array.isArray(posts) || posts.length === 0) {
      container.innerHTML = "<p>No posts yet.</p>";
      return;
    }

    // Sort by latest
    posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // show only latest post first
    const latest = posts[0];
    container.innerHTML = "";

    const latestCard = createPostCard(latest, true);
    container.appendChild(latestCard);

    // View all button
    const viewAllBtn = el("button", "view-all-btn");
    viewAllBtn.textContent = "📸 View All Posts";
    container.appendChild(viewAllBtn);

    // Inline grid for all posts
    const allPostsGrid = el("div", "all-posts-grid hidden");
    const closeAllBtn = el("button", "close-all-btn");
    closeAllBtn.textContent = "✖ Close All Posts";

    const indicator = el("p", "grid-indicator");
    indicator.textContent = "🖼️ Click a post to view details";

    allPostsGrid.appendChild(closeAllBtn);
    allPostsGrid.appendChild(indicator);

    posts.forEach(post => {
      const thumb = el("div", "post-thumb");
      const img = el("img");
      img.src = post.image_url;
      img.alt = post.title;
      thumb.appendChild(img);
      thumb.onclick = () => openModal(post);
      allPostsGrid.appendChild(thumb);
    });

    container.appendChild(allPostsGrid);

    viewAllBtn.onclick = () => {
      allPostsGrid.classList.remove("hidden");
      viewAllBtn.classList.add("hidden");
    };
    closeAllBtn.onclick = () => {
      allPostsGrid.classList.add("hidden");
      viewAllBtn.classList.remove("hidden");
    };

  } catch (err) {
    console.error("Failed to load posts:", err);
    container.innerHTML = "<p style='color:red;'>Failed to load posts.</p>";
  }
}

/* Create single post card for homepage */
function createPostCard(post, showFull = false) {
  const card = el("div", "picture-card");
  const img = el("img");
  img.src = post.image_url;
  img.alt = post.title;

  const title = el("h3", "picture-title");
  title.textContent = post.title;

  const desc = el("p", "picture-desc");
  const fullDesc = post.description || "";
  const shortDesc = fullDesc.length > 120 ? fullDesc.slice(0, 120) + "..." : fullDesc;

  desc.textContent = shortDesc;

  const readMoreBtn = el("button", "read-more-btn");
  readMoreBtn.textContent = fullDesc.length > 120 ? "Read more" : "";
  readMoreBtn.onclick = () => {
    if (desc.textContent === shortDesc) {
      desc.textContent = fullDesc;
      readMoreBtn.textContent = "Show less";
    } else {
      desc.textContent = shortDesc;
      readMoreBtn.textContent = "Read more";
    }
  };

  const actions = el("div", "picture-actions");
  const likeBtn = el("button", "like-btn");
  likeBtn.textContent = "❤️ Like";
  const likeCount = el("span", "like-count");
  const commentBtn = el("button", "comment-btn");
  commentBtn.textContent = "💬 Comment";

  actions.appendChild(likeBtn);
  actions.appendChild(likeCount);
  actions.appendChild(commentBtn);

  likeBtn.onclick = async () => {
    await api.post("/likes", { post_id: post.id });
    refreshLikes();
  };

  async function refreshLikes() {
    try {
      const res = await api.get(`/likes/count?type=post&post_id=${post.id}`);
      likeCount.textContent = `${res.count || 0} Likes`;
    } catch {
      likeCount.textContent = "0 Likes";
    }
  }
  refreshLikes();

  commentBtn.onclick = () => openModal(post);

  card.append(img, title, desc, readMoreBtn, actions);
  return card;
}

/* Popup modal for viewing post details */
function openModal(post) {
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
    modal.querySelector(".modal-close").onclick = () => modal.classList.remove("show");
    modal.onclick = e => {
      if (e.target === modal) modal.classList.remove("show");
    };
  }

  const body = modal.querySelector(".modal-body");
  body.innerHTML = `
    <img src="${post.image_url}" alt="${post.title}" class="modal-image">
    <h2>${post.title}</h2>
    <p>${post.description}</p>
    <div class="picture-actions">
      <button class="like-btn">❤️ Like</button>
      <span class="like-count">0 Likes</span>
      <button class="comment-btn">💬 Comment</button>
    </div>
    <div class="comments-box"></div>
  `;

  // Likes
  const likeBtn = body.querySelector(".like-btn");
  const likeCountEl = body.querySelector(".like-count");
  async function refreshLikes() {
    try {
      const res = await api.get(`/likes/count?type=post&post_id=${post.id}`);
      likeCountEl.textContent = `${res.count || 0} Likes`;
    } catch {
      likeCountEl.textContent = "0 Likes";
    }
  }
  likeBtn.onclick = async () => {
    await api.post("/likes", { post_id: post.id });
    refreshLikes();
  };
  refreshLikes();

  // Comments
  const commentsBox = body.querySelector(".comments-box");
  loadComments(commentsBox, post);

  modal.classList.add("show");
}

async function loadComments(container, post) {
  container.innerHTML = "<p>Loading comments...</p>";
  try {
    let comments = await fetchPostComments(String(post.id));
    if (!Array.isArray(comments)) comments = [];

    container.innerHTML = `
      <div class="comments-header"><strong>${comments.length} Comments</strong></div>
      <div class="comment-list">
        ${comments.map(c => `<div class="comment"><b>${c.name || "Guest"}:</b> ${c.content}</div>`).join("")}
      </div>
      <form class="comment-form">
        <input type="text" placeholder="Your name (optional)">
        <textarea placeholder="Write your comment..." required></textarea>
        <button type="submit">Post</button>
      </form>
    `;

    const form = container.querySelector(".comment-form");
    form.onsubmit = async e => {
      e.preventDefault();
      const name = form.querySelector("input").value.trim() || "Guest";
      const content = form.querySelector("textarea").value.trim();
      if (!content) return;
      const newC = await postPostComment({ post_id: post.id, name, content });
      container.querySelector(".comment-list").insertAdjacentHTML(
        "afterbegin",
        `<div class="comment"><b>${newC.name}:</b> ${newC.content}</div>`
      );
      form.reset();
    };
  } catch (err) {
    container.innerHTML = "<p style='color:red;'>Failed to load comments.</p>";
  }
}


