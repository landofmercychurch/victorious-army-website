// sermons.js
import { api } from "./api.js";
import { el, openWhatsAppShare, universalShare, copyToClipboard } from "./utils.js";
import { showNotification } from "./config.js";

export async function initSermons(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading sermons…</p>";
  try {
    const sermons = await api.get("/sermons");
    container.innerHTML = "";
    if (!sermons.length) {
      container.innerHTML = "<p>No sermons yet.</p>";
      return;
    }
    sermons.forEach(renderSermon);
  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load sermons</p>`;
    console.error(err);
  }

  function renderSermon(s) {
    const card = el("div", "card sermon");

    // Video (YouTube, Cloudinary, direct mp4)
    if (s.video_url) {
      if (s.video_url.includes("youtube.com") || s.video_url.includes("youtu.be")) {
        // embed YouTube
        const iframe = el("iframe", "sermon-video", {
          src: s.video_url.replace("watch?v=", "embed/"),
          allowfullscreen: true
        });
        card.appendChild(iframe);
      } else {
        const video = el("video", "sermon-video", { src: s.video_url, controls: true });
        card.appendChild(video);
      }
    }

    // Title + description
    card.appendChild(el("h3", "sermon-title", { text: s.title }));
    if (s.description) {
      card.appendChild(el("p", "sermon-desc", { text: s.description }));
    }

    // Actions row
    const actions = el("div", "actions");

    // Likes
    const likeBtn = el("button", "btn like-btn", { text: `👍 ${s.likes_count || 0}` });
    likeBtn.onclick = async () => {
      try {
        await api.post(`/sermons/${s.id}/like`, {});
        s.likes_count = (s.likes_count || 0) + 1;
        likeBtn.textContent = `👍 ${s.likes_count}`;
      } catch (e) {
        console.error(e);
        showNotification("Failed to like");
      }
    };

    // Share
    const shareBtn = el("button", "btn", { text: "Share" });
    shareBtn.onclick = async () => {
      const url = `${location.origin}/sermons/${s.id}`;
      const shared = await universalShare(s.title || "", url);
      if (!shared) {
        await copyToClipboard(url);
        showNotification("Link copied");
      }
    };

    // WhatsApp
    const waBtn = el("button", "btn", { text: "WhatsApp" });
    waBtn.onclick = () =>
      openWhatsAppShare(s.title || "", `${location.origin}/sermons/${s.id}`);

    actions.append(likeBtn, shareBtn, waBtn);
    card.appendChild(actions);

    // Comments section
    const commentsBox = el("div", "comments-box");
    const commentsList = el("div", "comments-list", { text: "Loading comments…" });
    commentsBox.appendChild(commentsList);

    // Load comments
    loadComments(s.id, commentsList);

    // Comment form
    const form = el("form", "comment-form");
    const nameInput = el("input", null, { type: "text", placeholder: "Your name", required: true });
    const contentInput = el("textarea", null, { placeholder: "Write a comment…", required: true });
    const submitBtn = el("button", "btn", { type: "submit", text: "Post" });
    form.append(nameInput, contentInput, submitBtn);
    form.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const body = { name: nameInput.value, content: contentInput.value };
        await api.post(`/sermons/${s.id}/comments`, body);
        nameInput.value = "";
        contentInput.value = "";
        loadComments(s.id, commentsList);
      } catch (err) {
        console.error(err);
        showNotification("Failed to post comment");
      }
    };
    commentsBox.appendChild(form);

    card.appendChild(commentsBox);

    container.appendChild(card);
  }

  async function loadComments(sermonId, container) {
    try {
      const comments = await api.get(`/sermons/${sermonId}/comments`);
      container.innerHTML = "";
      if (!comments.length) {
        container.innerHTML = "<p>No comments yet.</p>";
        return;
      }
      comments.forEach((c) => {
        const div = el("div", "comment");
        div.appendChild(el("strong", null, { text: c.name || "Guest" }));
        div.appendChild(el("p", null, { text: c.content }));
        container.appendChild(div);
      });
    } catch (err) {
      container.innerHTML = `<p style="color:red">Failed to load comments</p>`;
      console.error(err);
    }
  }
}
