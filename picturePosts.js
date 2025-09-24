// js/picturePosts.js
import { api } from "./api.js";
import { el } from "./utils.js";

export async function initPicturePosts(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading posts…</p>";

  try {
    const posts = await api.get("/picture-posts");
    container.innerHTML = "";

    if (!posts.length) {
      container.innerHTML = "<p>No posts yet.</p>";
      return;
    }

    posts.forEach(post => {
      const card = el("div", "picture-card");

      // Image
      if (post.image_url) {
        const img = el("img", "picture-img");
        img.src = post.image_url;
        img.alt = post.caption || "Post";
        card.appendChild(img);
      }

      // Caption
      if (post.caption) {
        const caption = el("p", "picture-caption");
        caption.textContent = post.caption;
        card.appendChild(caption);
      }

      // Actions
      const actions = el("div", "picture-actions");

      // Like button
      const likeBtn = el("button", "like-btn", "❤️ Like");
      likeBtn.onclick = async () => {
        await api.post("/likes", { post_id: post.id });
        updateLikeCount();
      };

      const likeCount = el("span", "like-count", "0 Likes");

      async function updateLikeCount() {
        const result = await api.get(`/likes/count/${post.id}`);
        likeCount.textContent = `${result.count} Likes`;
      }
      updateLikeCount();

      // Comment button
      const commentBtn = el("button", "comment-btn", "💬 Comment");
      commentBtn.onclick = () => toggleComments(post.id, commentsBox);

      actions.append(likeBtn, likeCount, commentBtn);
      card.appendChild(actions);

      // Comments
      const commentsBox = el("div", "comments-box");
      card.appendChild(commentsBox);

      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load posts.</p>`;
    console.error(err);
  }
}

// --- Toggle Comments ---
async function toggleComments(postId, box) {
  if (box.dataset.loaded === "true") {
    box.classList.toggle("open");
    return;
  }

  box.innerHTML = "<p>Loading comments…</p>";

  try {
    const comments = await api.get(`/comments/post/${postId}`);
    box.innerHTML = "";

    const list = document.createElement("div");
    list.className = "comment-list";

    comments.forEach(c => {
      const item = document.createElement("div");
      item.className = "comment";
      item.textContent = c.text;
      list.appendChild(item);
    });

    // New comment form
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
      await api.post("/comments", { post_id: postId, text });
      input.value = "";
      toggleComments(postId, box); // reload
    };

    box.append(list, form);
    box.dataset.loaded = "true";
    box.classList.add("open");
  } catch (err) {
    box.innerHTML = "<p style='color:red'>Failed to load comments.</p>";
  }
}
