// js/picturePosts.js
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

    container.classList.add("picture-feed");
    const cards = [];

    let autoplayInterval;
    let currentIndex = 0;
    const isMobile = window.innerWidth < 768;
    let startY = 0;

    // --- Show card function ---
    function showCard(index) {
      cards.forEach((card, i) => {
        if (!isMobile) {
          card.style.display = "block";
          card.classList.remove("active");
        } else {
          const offset = ((i - index + cards.length) % cards.length) * 100;
          card.style.transform = `translateY(${offset}%)`;
          card.classList.toggle("active", i === index); // for progress bar
        }
      });
    }

    // --- Autoplay functions ---
    function startAutoplay() {
      stopAutoplay();
      autoplayInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % cards.length;
        showCard(currentIndex);
      }, 4000);
    }

    function stopAutoplay() {
      if (autoplayInterval) clearInterval(autoplayInterval);
    }

    // --- Build cards ---
    posts.forEach(post => {
      const card = el("div", "picture-card");

      // Image
      if (post.image_url) {
        const img = el("img", "picture-img", { src: post.image_url, alt: post.caption || "Image description" });
        img.loading = "lazy";
        card.appendChild(img);
      }

      // Caption
      if (post.caption) {
        const description = el("p", "picture-caption");
        description.textContent = post.caption;
        card.appendChild(description);
      }

      // Actions
      const actions = el("div", "picture-actions");
      const likeBtn = el("button", "like-btn", "❤️");
      const likeCount = el("span", "like-count", "0 Likes");
      const commentBtn = el("button", "comment-btn", "💬");
      const commentCount = el("span", "comment-count", "0 Comments");
      actions.append(likeBtn, likeCount, commentBtn, commentCount);
      card.appendChild(actions);

      // Comments box
      const commentsBox = el("div", "comments-box");
      card.appendChild(commentsBox);

      container.appendChild(card);
      cards.push(card);

      // --- Likes ---
      async function updateLikeCount() {
        try {
          const res = await api.get(`/likes/count/${post.id}?type=post`);
          likeCount.textContent = `${res.count || 0} Likes`;
        } catch {
          likeCount.textContent = "0 Likes";
        }
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

      commentBtn.addEventListener("click", () => {
        const isOpen = commentsBox.classList.toggle("open");
        if (isOpen) stopAutoplay(); // pause autoplay while reading comments
        else startAutoplay();
        if (isOpen) loadComments();
      });
    });

    // --- Mobile swipe setup ---
    if (isMobile) {
      container.style.overflow = "hidden";
      container.style.position = "relative";
      container.style.height = `${cards[0].offsetHeight}px`;

      cards.forEach((card, i) => {
        card.style.position = "absolute";
        card.style.top = "0";
        card.style.left = "0";
        card.style.width = "100%";
        card.style.transition = "transform 0.3s ease-in-out";
        card.style.transform = i === currentIndex ? "translateY(0)" : "translateY(100%)";
      });

      showCard(currentIndex);

      container.addEventListener("touchstart", e => {
        startY = e.touches[0].clientY;
        stopAutoplay();
      });

      container.addEventListener("touchend", e => {
        const endY = e.changedTouches[0].clientY;
        const diff = startY - endY;
        if (Math.abs(diff) > 50) {
          currentIndex = diff > 0
            ? (currentIndex + 1) % cards.length
            : (currentIndex - 1 + cards.length) % cards.length;
          showCard(currentIndex);
        }
        startAutoplay();
      });

      startAutoplay();
    } else {
      // Desktop: display all cards in grid with readable sizes
      cards.forEach(card => {
        card.style.display = "block";
        card.style.position = "relative";
        card.style.width = "100%";
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
