// js/picturePosts.js
import { api } from "./api.js";
import { el } from "./utils.js";

export async function initPicturePosts(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading posts…</p>";

  try {
    let posts = await api.get("/picture-posts");
    posts = posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    container.innerHTML = "";
    if (!posts.length) {
      container.innerHTML = "<p>No posts yet.</p>";
      return;
    }

    const cards = [];
    let autoScrollPaused = false;

    posts.forEach(post => {
      const card = el("div", "picture-card", { "data-id": post.id });

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
      const likeBtn = el("button", "like-btn");
      likeBtn.textContent = "❤️";
      const likeCount = el("span", "like-count", "0 Likes");

      async function updateLikeCount() {
        try {
          const res = await api.get(`/likes/count/${post.id}?type=post`);
          likeCount.textContent = `${res.count || 0} Likes`;
        } catch {
          likeCount.textContent = "0 Likes";
        }
      }
      likeBtn.addEventListener("click", async () => {
        try {
          await api.post("/likes", { post_id: post.id });
          updateLikeCount();
        } catch (err) {
          console.error("Failed to like post:", err);
        }
      });
      updateLikeCount();

      const commentBtn = el("button", "comment-btn");
      commentBtn.textContent = "💬";
      const commentCount = el("span", "comment-count", "0 Comments");

      actions.append(likeBtn, likeCount, commentBtn, commentCount);
      card.appendChild(actions);

      // Comments box
      const commentsBox = el("div", "comments-box");
      card.appendChild(commentsBox);

      container.appendChild(card);
      cards.push(card);

      // --- Load / Toggle Comments ---
      async function loadComments() {
        commentsBox.innerHTML = "<p>Loading comments…</p>";
        try {
          const comments = await api.get(`/comments/post/${post.id}`);
          const list = el("div", "comment-list");

          if (!comments.length) {
            list.innerHTML = `<p class="no-comments">No comments yet. Be the first!</p>`;
          } else {
            comments.forEach(c => {
              const commentEl = el("div", "comment");
              commentEl.innerHTML = `<b>${c.name || "Guest"}:</b> ${c.content}`;
              list.appendChild(commentEl);
            });
          }

          // Comment form
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

          // Close button
          const closeBtn = el("button", "close-btn");
          closeBtn.textContent = "×";
          closeBtn.addEventListener("click", () => {
            commentsBox.classList.remove("open");
            autoScrollPaused = false;
          });

          commentsBox.innerHTML = "";
          commentsBox.append(closeBtn, list, form);
          commentsBox.classList.add("open");

          commentCount.textContent = `${comments.length || 0} Comments`;
          autoScrollPaused = true;
        } catch (err) {
          commentsBox.innerHTML = "<p style='color:red'>Failed to load comments.</p>";
        }
      }

      commentBtn.addEventListener("click", () => {
        if (commentsBox.classList.contains("open")) {
          commentsBox.classList.remove("open");
          autoScrollPaused = false;
        } else {
          loadComments();
        }
      });

      // Pause auto-scroll on hover
      card.addEventListener("mouseenter", () => (autoScrollPaused = true));
      card.addEventListener("mouseleave", () => (autoScrollPaused = false));
    });

    // --- TikTok-style vertical scrolling ---
    let currentIndex = 0;

    function showCard(index) {
      cards.forEach((card, i) => {
        card.style.display = i === index ? "block" : "none";
      });
    }
    showCard(currentIndex);

    function nextCard() {
      if (!autoScrollPaused && cards.length) {
        currentIndex = (currentIndex + 1) % cards.length;
        showCard(currentIndex);
      }
    }

    setInterval(nextCard, 4000);

  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load posts.</p>`;
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("picturePostsContainer");
  initPicturePosts(container);
});
