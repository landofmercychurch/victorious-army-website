// js/sermons.js
import { api } from "./api.js";
import { el } from "./utils.js";
import { fetchSermonComments, postSermonComment } from "./commentsPublic.js";

async function loadSermons() {
  try {
    const sermons = await api.get("/sermons"); // ✅ no .data
    const container = document.getElementById("sermon-feed");

    container.innerHTML = sermons.map(sermon => `
      <div class="sermon-card" data-id="${sermon.id}">
        <video src="${sermon.video_url}" controls playsinline poster="${sermon.thumbnail_url || ""}"></video>
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

    // attach event listeners for each sermon
    sermons.forEach(sermon => {
      const card = container.querySelector(`.sermon-card[data-id="${sermon.id}"]`);
      const likeBtn = card.querySelector(".like-btn");
      const likeCountEl = card.querySelector(".like-count");
      const commentBtn = card.querySelector(".comment-btn");
      const commentCountEl = card.querySelector(".comment-count");
      const commentsBox = card.querySelector(".comments-box");
      const shareBtn = card.querySelector(".share-btn");

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

          // ✅ ensure comments is always an array
          if (!Array.isArray(comments)) comments = [];

          commentCountEl.textContent = comments.length + " Comments";

          commentsBox.innerHTML = `
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

          const form = commentsBox.querySelector(".comment-form");
          form.onsubmit = async e => {
            e.preventDefault();
            const nameInput = form.querySelector(".comment-name");
            const contentInput = form.querySelector(".comment-content");

            const name = nameInput.value.trim() || "Guest";
            const content = contentInput.value.trim();

            if (!content) return;
            try {
              await postSermonComment({
                sermon_id: sermon.id,
                name,
                content,
              });
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
        commentsBox.style.display =
          commentsBox.style.display === "none" ? "block" : "none";
        if (commentsBox.style.display === "block") refreshComments();
      });

      refreshComments();

      // --- Share ---
      shareBtn.addEventListener("click", async () => {
        const shareUrl = `${window.location.origin}/?sermon=${sermon.id}`;
        const shareData = {
          title: sermon.title,
          text: sermon.description || "Watch our latest sermon!",
          url: shareUrl,
        };

        if (navigator.share) {
          try {
            await navigator.share(shareData);
          } catch (err) {
            console.warn("Share canceled:", err);
          }
        } else {
          navigator.clipboard.writeText(shareUrl).then(() => {
            alert("Link copied to clipboard!");
          });
        }
      });

      // --- 🔄 Live Updates (polling) ---
      setInterval(() => {
        refreshLikes();
        refreshComments();
      }, 10000); // every 10s
    });
  } catch (err) {
    console.error("Failed to load sermons:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadSermons);
