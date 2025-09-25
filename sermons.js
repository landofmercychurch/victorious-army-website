// /sermons.js
import { api } from "/api.js";
import { el } from "/utils.js";
async function loadSermons() {
  try {
    const sermons = await api.get("/sermons");
    const container = document.getElementById("sermon-feed");

    container.innerHTML = sermons.map(sermon => `
      <div class="sermon-card">
        <video src="${sermon.video_url}" controls playsinline></video>
        <div class="sermon-overlay">
          <div class="sermon-title">${sermon.title}</div>
          <div class="sermon-desc">${sermon.description || ""}</div>
        </div>
        <div class="sermon-actions">
          <button class="like-btn">❤️</button>
          <span>0</span>
          <button class="comment-btn">💬</button>
          <span>0</span>
        </div>
      </div>
    `).join("");
  } catch (err) {
    console.error("Failed to load sermons:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadSermons);
