// js/picturePosts.js
import { api } from "./api.js";
import { el } from "./utils.js";

export async function initPicturePosts(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading posts…</p>";

  try {
    let posts = await api.get("/picture-posts");
    posts = posts.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

    container.innerHTML = "";
    if (!posts.length) {
      container.innerHTML = "<p>No posts yet.</p>";
      return;
    }

    const cards = [];

    posts.forEach(post => {
      const card = el("div", "picture-card");

      if (post.image_url) {
        const img = el("img", "picture-img");
        img.src = post.image_url;
        img.alt = post.caption || "Post";
        card.appendChild(img);
      }

      if (post.caption) {
        const caption = el("p", "picture-caption");
        caption.textContent = post.caption;
        card.appendChild(caption);
      }

      const actions = el("div", "picture-actions");

      const likeBtn = el("button", "like-btn", "❤️ Like");
      const likeCount = el("span", "like-count", "0 Likes");

      const commentBtn = el("button", "comment-btn", "💬 Comment");
      const commentCount = el("span", "comment-count", "0 Comments");

      actions.append(likeBtn, likeCount, commentBtn, commentCount);
      card.appendChild(actions);

      const commentsBox = el("div", "comments-box");
      card.appendChild(commentsBox);

      container.appendChild(card);
      cards.push(card);

      // --- Likes ---
      async function updateLikeCount() {
        try {
          const res = await api.get(`/likes/count/${post.id}?type=post`);
          likeCount.textContent = `${res.count || 0} Likes`;
        } catch { likeCount.textContent = "0 Likes"; }
      }
      likeBtn.addEventListener("click", async () => {
        await api.post("/likes", { post_id: post.id });
        updateLikeCount();
      });
      updateLikeCount();

      // --- Comments ---
      async function loadComments() {
        commentsBox.innerHTML = "<p>Loading comments…</p>";
        try {
          const comments = await api.get(`/comments/post/${post.id}`);
          commentsBox.innerHTML = "";

          const list = el("div", "comment-list");
          if (!comments.length) list.innerHTML = `<p class="no-comments">No comments yet.</p>`;
          else comments.forEach(c => {
            const commentEl = el("div", "comment");
            commentEl.innerHTML = `<b>${c.name || "Guest"}:</b> ${c.content}`;
            list.appendChild(commentEl);
          });

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
            await api.post("/comments", { post_id: post.id, name, content });
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
      commentBtn.addEventListener("click", loadComments);
    });

    // --- Mobile swipe scroll ---
    if (window.innerWidth < 768) {
      let currentIndex = 0;
      let startY = 0;
      const total = cards.length;

      function showCard(index) {
        cards.forEach((c, i) => c.style.display = i === index ? "block" : "none");
      }
      showCard(currentIndex);

      container.addEventListener("touchstart", e => {
        startY = e.touches[0].clientY;
      });

      container.addEventListener("touchend", e => {
        const endY = e.changedTouches[0].clientY;
        const diff = startY - endY;

        if (Math.abs(diff) > 50) { // swipe threshold
          if (diff > 0) {
            currentIndex = (currentIndex + 1) % total; // swipe up → next
          } else {
            currentIndex = (currentIndex - 1 + total) % total; // swipe down → prev
          }
          showCard(currentIndex);
        }
      });
    }

  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load posts.</p>`;
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("picture-feed");
  initPicturePosts(container);
});
