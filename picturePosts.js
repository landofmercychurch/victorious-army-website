import { api } from "./api.js";
import { el } from "./utils.js";
import { refreshPostLikes, handlePostLike } from "./likes.js";
import { fetchPictureComments, postPictureComment } from "./commentsPublic.js";

/**
 * Dynamically set Open Graph and Twitter meta tags (for in-page updates)
 * Note: WhatsApp and social media scrapers use server-rendered OG meta.
 */
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

    const params = new URLSearchParams(window.location.search);
    const postId = params.get("post");
    if (postId) {
      const post = posts.find(p => p.id === postId);
      if (post) {
        setOpenGraphMeta({
          title: post.title || "Check out this post",
          description: post.description?.slice(0, 100) || "See this image!",
          image: post.image_url || "",
          url: `${window.location.origin}/posts/${post.id}`
        });
      }
    }

    const cards = [];
    let autoplayInterval;
    let currentIndex = 0;
    const isMobile = window.innerWidth < 768;
    let startY = 0;

    function showCard(index) {
      cards.forEach((card, i) => {
        if (!isMobile) {
          card.style.display = "block";
          card.classList.remove("active");
        } else {
          const offset = ((i - index + cards.length) % cards.length) * 100;
          card.style.transform = `translateY(${offset}%)`;
          card.classList.toggle("active", i === index);
        }
      });
      if (isMobile && cards[index]) container.style.height = `${cards[index].scrollHeight}px`;
    }

    function startAutoplay() {
      stopAutoplay();
      autoplayInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % cards.length;
        showCard(currentIndex);
      }, 5000);
    }

    function stopAutoplay() {
      if (autoplayInterval) clearInterval(autoplayInterval);
    }

    // --- Build post cards ---
    for (const post of posts) {
      const card = el("div", "picture-card");

      if (post.title) {
        const titleEl = el("h3", "picture-title");
        titleEl.textContent = post.title;
        card.appendChild(titleEl);
      }

      if (post.image_url) {
        const img = el("img", "picture-img", {
          src: post.image_url,
          alt: post.title || "Image description",
        });
        img.loading = "lazy";
        card.appendChild(img);
      }

      if (post.description) {
        const descEl = el("p", "picture-description");
        const maxLength = 200;
        const setDescription = (text) => {
          if (text.length > maxLength) {
            descEl.textContent = text.slice(0, maxLength) + "... ";
            const readMoreBtn = el("button", "load-more-btn", "Read more");
            readMoreBtn.addEventListener("click", () => { descEl.textContent = text; });
            descEl.appendChild(readMoreBtn);
          } else descEl.textContent = text;
        };
        setDescription(post.description);
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

      const commentsBox = el("div", "comments-box");
      card.appendChild(commentsBox);

      container.appendChild(card);
      cards.push(card);

      // --- Likes & Comments ---
      refreshPostLikes(post.id, likeCount);
      likeBtn.addEventListener("click", () => handlePostLike(post.id, likeCount));

      async function loadComments() {
        commentsBox.innerHTML = "<p>Loading comments…</p>";
        try {
          const comments = await fetchPictureComments(post.id);
          commentsBox.innerHTML = "";

          const closeBtn = el("button", "close-comments", "Close");
          closeBtn.addEventListener("click", () => {
            commentsBox.classList.remove("open");
            startAutoplay();
          });
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
        const isOpen = commentsBox.classList.toggle("open");
        if (isOpen) stopAutoplay(); else startAutoplay();
        if (isOpen) loadComments();
      });

      // --- Share button now points to server-rendered preview page ---
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
    }

    // --- Mobile swipe support ---
    if (isMobile) {
      container.style.overflow = "hidden";
      container.style.position = "relative";
      showCard(currentIndex);

      cards.forEach((card, i) => {
        card.style.position = "absolute";
        card.style.top = "0";
        card.style.left = "0";
        card.style.width = "100%";
        card.style.transition = "transform 0.3s ease, height 0.3s ease";
        card.style.transform = i === currentIndex ? "translateY(0)" : `translateY(100%)`;
      });

      container.addEventListener("touchstart", e => {
        startY = e.touches[0].clientY;
        stopAutoplay();
      });

      container.addEventListener("touchend", e => {
        const diff = startY - e.changedTouches[0].clientY;
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
