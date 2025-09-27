// js/sermons.js
import { api } from "./api.js";
import { el } from "./utils.js";
import { fetchSermonComments, postSermonComment } from "./commentsPublic.js";

/**
 * Dynamically set Open Graph and Twitter meta tags for sharing
 */
function setOpenGraphMeta({ title, description, image, url }) {
  const head = document.head;

  function createOrUpdate(property, content, isName = false) {
    let selector = isName ? `meta[name="${property}"]` : `meta[property="${property}"]`;
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
  createOrUpdate("twitter:card", "summary_large_image", true);
  createOrUpdate("twitter:title", title, true);
  createOrUpdate("twitter:description", description, true);
  createOrUpdate("twitter:image", image, true);
}

async function loadSermons() {
  try {
    let sermons = await api.get("/sermons");
    sermons = sermons.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const container = document.getElementById("sermon-feed");

    container.innerHTML = sermons.map(sermon => `
      <div class="sermon-card" data-id="${sermon.id}">
        <video src="${sermon.video_url}" playsinline poster="${sermon.thumbnail_url || ""}"></video>
        <div class="sermon-overlay">
          <div class="sermon-title">${sermon.title}</div>
          <div class="sermon-desc">${sermon.description || ""}</div>
        </div>
        <div class="sermon-actions">
          <button class="like-btn">❤️</button>
          <span class="like-count">0 Likes</span>
          <button class="comment-btn">💬</button>
          <span class="comment-count">0 Comments</span>
          <button class="share-btn">🔗 Share</button>
        </div>
        <div class="comments-box" style="display:none"></div>
      </div>
    `).join("");

    // --- Update OG tags if direct link has ?sermon=ID ---
    const params = new URLSearchParams(window.location.search);
    const sermonId = params.get("sermon");
    if (sermonId) {
      const sermon = sermons.find(s => s.id === sermonId);
      if (sermon) {
        setOpenGraphMeta({
          title: sermon.title,
          description: sermon.description || "Watch our latest sermon!",
          image: sermon.thumbnail_url || "",
          url: `${window.location.origin}/?sermon=${sermon.id}`
        });
      }
    }

    sermons.forEach(sermon => {
      const card = container.querySelector(`.sermon-card[data-id="${sermon.id}"]`);
      const likeBtn = card.querySelector(".like-btn");
      const likeCountEl = card.querySelector(".like-count");
      const commentBtn = card.querySelector(".comment-btn");
      const commentCountEl = card.querySelector(".comment-count");
      const commentsBox = card.querySelector(".comments-box");
      const shareBtn = card.querySelector(".share-btn");
      const videoEl = card.querySelector("video");

      // --- Likes ---
      async function refreshLikes() {
        try {
          const res = await api.get(`/likes/count?type=sermon&sermon_id=${sermon.id}`);
          likeCountEl.textContent = (res.count || 0) + " Likes";
        } catch {
          likeCountEl.textContent = "0 Likes";
        }
      }

      likeBtn.addEventListener("click", async () => {
        try {
          await api.post("/likes", { sermon_id: sermon.id });
          refreshLikes();
        } catch (err) {
          console.error("Failed to like:", err);
        }
      });

      refreshLikes();

      // --- Comments ---
      async function refreshComments() {
        try {
          let comments = await fetchSermonComments(sermon.id);
          if (!Array.isArray(comments)) comments = [];

          commentCountEl.textContent = comments.length + " Comments";

          commentsBox.innerHTML = `
            <button class="close-btn">✖</button>
            <div class="comment-list">
              ${
                comments.length > 0
                  ? comments.map(c => `<div class="comment"><b>${c.name || "Guest"}:</b> ${c.content}</div>`).join("")
                  : `<p class="no-comments">No comments yet. Be the first!</p>`
              }
            </div>
            <form class="comment-form">
              <input type="text" class="comment-name" placeholder="Your name (optional)" />
              <input type="text" class="comment-content" placeholder="Write a comment…" required />
              <button type="submit">Post</button>
            </form>
          `;

          // Close button
          const closeBtn = commentsBox.querySelector(".close-btn");
          closeBtn.addEventListener("click", () => commentsBox.style.display = "none");

          const form = commentsBox.querySelector(".comment-form");
          form.onsubmit = async e => {
            e.preventDefault();
            const nameInput = form.querySelector(".comment-name");
            const contentInput = form.querySelector(".comment-content");
            const name = nameInput.value.trim() || "Guest";
            const content = contentInput.value.trim();
            if (!content) return;

            try {
              await postSermonComment({ sermon_id: sermon.id, name, content });
              nameInput.value = "";
              contentInput.value = "";
              refreshComments();
            } catch (err) {
              console.error("Failed to post comment:", err);
            }
          };
        } catch (err) {
          console.error("Failed to load comments:", err);
          commentsBox.innerHTML = `<p style="color:red">Error loading comments</p>`;
        }
      }

      commentBtn.addEventListener("click", () => {
        commentsBox.style.display = commentsBox.style.display === "none" ? "block" : "none";
        if (commentsBox.style.display === "block") refreshComments();
      });

      refreshComments();

      // --- Share with OG tags and social links ---
      shareBtn.addEventListener("click", async () => {
        const shareUrl = `${window.location.origin}/?sermon=${sermon.id}`;
        const shareData = {
          title: sermon.title,
          text: sermon.description || "Watch our latest sermon!",
          url: shareUrl,
        };

        // Set Open Graph meta tags dynamically
        setOpenGraphMeta({
          title: sermon.title,
          description: sermon.description || "Watch our latest sermon!",
          image: sermon.thumbnail_url || "",
          url: shareUrl
        });

        // Native share
        if (navigator.share) {
          try { await navigator.share(shareData); } 
          catch (err) { console.warn("Share canceled:", err); }
        } else {
          // Clipboard fallback
          navigator.clipboard.writeText(shareUrl).then(() => alert("Link copied to clipboard!"));

          // Optional: WhatsApp / Facebook share links
          const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(sermon.title + " - " + shareUrl)}`;
          const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
          const choice = confirm("Open WhatsApp share? Click Cancel for Facebook share.");
          if (choice) window.open(whatsappUrl, "_blank");
          else window.open(facebookUrl, "_blank");
        }
      });
    });

    // --- TikTok-style autoplay for videos ---
    const videos = document.querySelectorAll(".sermon-card video");
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.7 });

    videos.forEach(video => observer.observe(video));

  } catch (err) {
    console.error("Failed to load sermons:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadSermons);
