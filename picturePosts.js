// picturePosts.js
import { api } from "./api.js";
import { el } from "./utils.js";
import { refreshPostLikes, handlePostLike } from "./likes.js";
import { fetchPictureComments, postPictureComment } from "./commentsPublic.js";

function setOpenGraphMeta({ title, description, image, url }) {
  const head = document.head;

  function createOrUpdate(property, content, isName = false) {
    const selector = isName ? `meta[name="${property}"]` : `meta[property="${property}"]`;
    let meta = head.querySelector(selector);
    if (!meta) {
      meta = document.createElement("meta");
      if (isName) meta.setAttribute("name", property);
      else meta.setAttribute("property", property);
      head.appendChild(meta);
    }
    meta.setAttribute("content", content);
  }

  createOrUpdate("og:title", title);
  createOrUpdate("og:description", description);
  createOrUpdate("og:image", image);
  createOrUpdate("og:url", url);
  createOrUpdate("og:type", "article");
  createOrUpdate("twitter:card", "summary_large_image", true);
  createOrUpdate("twitter:title", title, true);
  createOrUpdate("twitter:description", description, true);
  createOrUpdate("twitter:image", image, true);
}

export async function initPicturePosts(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading posts…</p>";

  try {
    let posts = await api.get("/posts");
    posts = posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    container.innerHTML = "";
    if (!posts.length) {
      container.innerHTML = "<p>No posts yet.</p>";
      return;
    }

    container.classList.add("picture-feed");

    // --- Create 1 latest post ---
    const latestPost = posts[0];
    const allPosts = posts.slice(1);

    const latestCard = createPictureCard(latestPost);
    container.appendChild(latestCard);

    // --- Add "View All Posts" button ---
    const viewAllBtn = el("button", "view-all-btn", "View All Posts");
    container.appendChild(viewAllBtn);

    // --- When clicked, show all posts inline ---
    viewAllBtn.addEventListener("click", () => {
      allPosts.forEach(post => {
        const card = createPictureCard(post);
        container.appendChild(card);
      });
      viewAllBtn.remove(); // hide button after expansion
    });
  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load posts.</p>`;
    console.error(err);
  }
}

function createPictureCard(post) {
  const card = el("div", "picture-card");

  if (post.title) {
    const titleEl = el("h3", "picture-title");
    titleEl.textContent = post.title;
    card.appendChild(titleEl);
  }

  if (post.image_url) {
    const img = el("img", "picture-img", {
      src: post.image_url,
      alt: post.title || "Image",
    });
    img.loading = "lazy";
    card.appendChild(img);
  }

  if (post.description) {
    const descEl = el("p", "picture-description");
    const maxLength = 150;
    const text = post.description.trim();
    if (text.length > maxLength) {
      const shortText = text.slice(0, maxLength) + "... ";
      descEl.textContent = shortText;

      const readMoreBtn = el("button", "read-more-btn", "Read more");
      readMoreBtn.addEventListener("click", () => {
        descEl.textContent = text;
      });
      descEl.appendChild(readMoreBtn);
    } else {
      descEl.textContent = text;
    }
    card.appendChild(descEl);
  }

  // --- Actions ---
  const actions = el("div", "picture-actions");
  const likeBtn = el("button", "like-btn", "❤️");
  const likeCount = el("span", "like-count", "0 Likes");
  const commentBtn = el("button", "comment-btn", "💬");
  const commentCount = el("span", "comment-count", "0 Comments");
  const shareBtn = el("button", "share-btn", "🔗 Share");
  actions.append(likeBtn, likeCount, commentBtn, commentCount, shareBtn);
  card.appendChild(actions);

  // --- Comments box ---
  const commentsBox = el("div", "comments-box");
  card.appendChild(commentsBox);

  // --- Likes & Comments ---
  refreshPostLikes(post.id, likeCount);
  likeBtn.addEventListener("click", () => handlePostLike(post.id, likeCount));

  async function loadComments() {
    commentsBox.innerHTML = "<p>Loading comments…</p>";
    try {
      const comments = await fetchPictureComments(post.id);
      commentsBox.innerHTML = "";

      const closeBtn = el("button", "close-comments", "Close");
      closeBtn.addEventListener("click", () => commentsBox.classList.remove("open"));
      commentsBox.appendChild(closeBtn);

      const list = el("div", "comment-list");
      if (!comments.length) list.innerHTML = `<p class="no-comments">No comments yet.</p>`;
      else {
        comments.forEach(c => {
          const commentEl = el("div", "comment");
          commentEl.innerHTML = `<b>${c.name || "Guest"}:</b> ${c.content}`;
          list.appendChild(commentEl);
        });
      }

      const form = el("form", "comment-form");
      form.innerHTML = `
        <input type="text" class="comment-name" placeholder="Your name (optional)" />
        <input type="text" class="comment-content" placeholder="Write a comment…" required />
        <button type="submit">Post</button>
      `;
      form.onsubmit = async e => {
        e.preventDefault();
        const name = form.querySelector(".comment-name").value.trim() || "Guest";
        const content = form.querySelector(".comment-content").value.trim();
        if (!content) return;

        await postPictureComment({ post_id: post.id, name, content });
        form.querySelector(".comment-content").value = "";
        loadComments();
      };

      commentsBox.append(list, form);
      commentsBox.classList.add("open");
      commentCount.textContent = `${comments.length || 0} Comments`;
    } catch {
      commentsBox.innerHTML = "<p style='color:red'>Failed to load comments.</p>";
    }
  }

  commentBtn.addEventListener("click", () => {
    commentsBox.classList.toggle("open");
    if (commentsBox.classList.contains("open")) loadComments();
  });

  shareBtn.addEventListener("click", () => {
    const postUrl = `${window.location.origin}/posts/preview/${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: post.title || "Check out this post",
        text: post.description?.slice(0, 100) || "",
        url: postUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(postUrl).then(() => {
        alert("Post link copied to clipboard!");
      });
    }
  });

  return card;
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("picture-feed");
  initPicturePosts(container);
});

