// js/sermons.js
import { api } from "./api.js";
import { el } from "./utils.js";

async function loadSermons() {
  try {
    const sermons = await api.get("/sermons");
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
          <span class="like-count">0</span>
          <button class="comment-btn">💬</button>
          <span class="comment-count">0</span>
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
          const res = await api.get(`/likes/count/${sermon.id}`);
          likeCountEl.textContent = res.count + " Likes";
        } catch {
          likeCountEl.textContent = "0 Likes";
        }
      }

      likeBtn.addEventListener("click", async () => {
        try {
          await api.post("/likes", { postId: sermon.id, type: "sermon" });
          refreshLikes();
        } catch (err) {
          console.error("Failed to like:", err);
        }
      });

      refreshLikes();

      // --- Comments ---
      async function refreshComments() {
        try {
          const comments = await api.get(`/comments/post/${sermon.id}`);
          commentCountEl.textContent = comments.length + " Comments";

          commentsBox.innerHTML = `
            <div class="comment-list">
              ${comments.map(c => `<div class="comment"><b>${c.name || "Anon"}:</b> ${c.content}</div>`).join("")}
            </div>
            <form class="comment-form">
              <input type="text" placeholder="Write a comment…" required />
              <button type="submit">Post</button>
            </form>
          `;

          const form = commentsBox.querySelector(".comment-form");
          form.onsubmit = async e => {
            e.preventDefault();
            const input = form.querySelector("input");
            const content = input.value.trim();
            if (!content) return;
            try {
              await api.post("/comments", {
                name: "Guest",
                content,
                target_type: "sermon",
                target_id: sermon.id,
              });
              input.value = "";
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
          // fallback: copy to clipboard
          navigator.clipboard.writeText(shareUrl).then(() => {
            alert("Link copied to clipboard!");
          });
        }
      });
    });
  } catch (err) {
    console.error("Failed to load sermons:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadSermons);
);
  }
}

document.addEventListener("DOMContentLoaded", loadSermons);
