// js/sermons.js
import { api } from "./api.js";
import { el } from "./utils.js";
import { fetchSermonComments, postSermonComment } from "./commentsPublic.js";

/** 🧩 Helper: Update OpenGraph/Twitter meta tags for sharing */
function setOpenGraphMeta({ title, description, image, url }) {
  const head = document.head;
  function setMeta(property, content, isName = false) {
    const selector = isName
      ? `meta[name="${property}"]`
      : `meta[property="${property}"]`;
    let meta = head.querySelector(selector);
    if (!meta) {
      meta = document.createElement("meta");
      if (isName) meta.setAttribute("name", property);
      else meta.setAttribute("property", property);
      head.appendChild(meta);
    }
    meta.setAttribute("content", content);
  }

  setMeta("og:title", title);
  setMeta("og:description", description);
  setMeta("og:image", image);
  setMeta("og:url", url);
  setMeta("twitter:card", "summary_large_image", true);
  setMeta("twitter:title", title, true);
  setMeta("twitter:description", description, true);
  setMeta("twitter:image", image, true);
}

/** 🎥 Initialise sermons feed */
export async function initSermons(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading sermons…</p>";

  try {
    const sermons = await api.get("/sermons");
    if (!Array.isArray(sermons) || sermons.length === 0) {
      container.innerHTML = "<p>No sermons available.</p>";
      return;
    }

    // Sort newest first
    sermons.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    container.innerHTML = "";

    for (const sermon of sermons) {
      const card = el("div", "sermon-card");
      card.dataset.id = sermon.id;

      /** 🎬 Video Setup */
      const videoWrapper = el("div", "video-wrapper");
      const video = el("video");
      video.playsInline = true;
      video.controls = true;
      video.preload = "metadata";
      video.poster = sermon.thumbnail_url || "";
      video.style.backgroundColor = "#000";

      const spinner = el("div", "video-spinner");
      spinner.innerHTML = `<div class="loader"></div>`;
      spinner.style.display = "none";

      videoWrapper.append(video, spinner);
      card.appendChild(videoWrapper);

      /** Lazy-load video source */
      const hlsSource = sermon.hls_url;
      const mp4Source = sermon.video_url;

      const setupVideo = () => {
        spinner.style.display = "flex";
        if (hlsSource && window.Hls && window.Hls.isSupported()) {
          const hls = new window.Hls({ startLevel: -1, maxBufferLength: 30 });
          hls.loadSource(hlsSource);
          hls.attachMedia(video);
          video.addEventListener("loadeddata", () => (spinner.style.display = "none"));
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = hlsSource || mp4Source;
          video.addEventListener("loadeddata", () => (spinner.style.display = "none"));
        } else {
          video.src = mp4Source;
          video.addEventListener("loadeddata", () => (spinner.style.display = "none"));
        }
      };

      const lazyObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setupVideo();
              lazyObserver.unobserve(video);
            }
          });
        },
        { threshold: 0.25 }
      );
      lazyObserver.observe(video);

      /** Hover preview */
      let previewTimeout;
      videoWrapper.addEventListener("mouseenter", () => {
        if (video.readyState >= 2) {
          video.muted = true;
          video.currentTime = 0;
          video.play().catch(() => {});
          previewTimeout = setTimeout(() => video.pause(), 3000);
        }
      });
      videoWrapper.addEventListener("mouseleave", () => {
        clearTimeout(previewTimeout);
        video.pause();
        video.currentTime = 0;
      });

      /** Info overlay */
      const overlay = el("div", "sermon-overlay");
      overlay.innerHTML = `
        <div class="sermon-title">${sermon.title || "Untitled Sermon"}</div>
        <div class="sermon-desc">${sermon.description || ""}</div>
      `;
      card.appendChild(overlay);

      /** Actions (Like, Comment, Share) */
      const actions = el("div", "sermon-actions");
      actions.innerHTML = `
        <button class="like-btn">❤️</button>
        <span class="like-count">0 Likes</span>
        <button class="comment-btn">💬</button>
        <span class="comment-count">0 Comments</span>
        <button class="share-btn">🔗 Share</button>
      `;
      card.appendChild(actions);

      const likeBtn = actions.querySelector(".like-btn");
      const likeCountEl = actions.querySelector(".like-count");
      const commentBtn = actions.querySelector(".comment-btn");
      const commentCountEl = actions.querySelector(".comment-count");
      const shareBtn = actions.querySelector(".share-btn");

      /** ❤️ Likes */
      async function refreshLikes() {
        try {
          const res = await api.get(`/likes/count?type=sermon&sermon_id=${sermon.id}`);
          likeCountEl.textContent = `${res.count || 0} Likes`;
        } catch {
          likeCountEl.textContent = "0 Likes";
        }
      }

      likeBtn.addEventListener("click", async () => {
        try {
          await api.post("/likes", { sermon_id: sermon.id });
          refreshLikes();
        } catch (err) {
          console.error("Failed to like sermon:", err);
        }
      });
      refreshLikes();

      /** 💬 Comments */
      const commentsBox = el("div", "comments-box");
      commentsBox.style.display = "none";
      card.appendChild(commentsBox);

      /** Refresh comments safely */
      async function refreshComments() {
        try {
          const sermonId = String(sermon.id);
          let comments = await fetchSermonComments(sermonId);
          if (!Array.isArray(comments)) comments = [];

          commentCountEl.textContent = `${comments.length} Comment${comments.length !== 1 ? "s" : ""}`;

          let commentList = commentsBox.querySelector(".comment-list");
          if (!commentList) {
            commentsBox.innerHTML = `
              <div class="comments-header">
                <strong>${comments.length} Comment${comments.length !== 1 ? "s" : ""}</strong>
                <button class="close-btn">✖</button>
              </div>
              <div class="comment-list"></div>
              <form class="comment-form">
                <input type="text" class="comment-name" placeholder="Your name (optional)" />
                <textarea class="comment-content" placeholder="Write your comment..." required></textarea>
                <button type="submit" class="comment-submit">Post Comment</button>
              </form>
            `;
            commentList = commentsBox.querySelector(".comment-list");

            // Close button
            commentsBox.querySelector(".close-btn").onclick = () => {
              commentsBox.style.display = "none";
              video.play().catch(() => {});
            };

            // Form submit handler
            const form = commentsBox.querySelector(".comment-form");
            form.onsubmit = async (e) => {
              e.preventDefault();
              const name = form.querySelector(".comment-name").value.trim() || "Guest";
              const content = form.querySelector(".comment-content").value.trim();
              if (!content) return;

              try {
                const newComment = await postSermonComment({ sermon_id: sermon.id, name, content });
                commentList.insertAdjacentHTML(
                  "afterbegin",
                  `<div class="comment">
                     <b>${newComment.name || "Guest"}:</b>
                     <span>${newComment.content}</span>
                     <div class="comment-time">${new Date(newComment.created_at).toLocaleString()}</div>
                  </div>`
                );
                form.reset();
                commentCountEl.textContent = `${commentList.children.length} Comment${commentList.children.length !== 1 ? "s" : ""}`;
              } catch (err) {
                console.error("Failed to post comment:", err);
              }
            };
          }

          // Update comment list
          commentList.innerHTML = comments.length
            ? comments
                .map(
                  (c) => `<div class="comment">
                            <b>${c.name || "Guest"}:</b>
                            <span>${c.content}</span>
                            <div class="comment-time">${new Date(c.created_at).toLocaleString()}</div>
                          </div>`
                )
                .join("")
            : `<p class="no-comments">No comments yet. Be the first to share your thoughts!</p>`;
        } catch (err) {
          console.error("Failed to load comments:", err);
        }
      }

      // Toggle comment box
      commentBtn.addEventListener("click", () => {
        const hidden = commentsBox.style.display === "none";
        if (hidden) {
          video.pause();
          commentsBox.style.display = "block";
          refreshComments();
        } else {
          commentsBox.style.display = "none";
          video.play().catch(() => {});
        }
      });

      /** 🔗 Share */
      shareBtn.addEventListener("click", async () => {
        const shareUrl = `${window.location.origin}/?sermon=${sermon.id}`;
        setOpenGraphMeta({
          title: sermon.title,
          description: sermon.description || "Watch our latest sermon!",
          image: sermon.thumbnail_url || "",
          url: shareUrl,
        });

        const shareData = {
          title: sermon.title,
          text: sermon.description || "Watch our latest sermon!",
          url: shareUrl,
        };

        if (navigator.share) {
          try { await navigator.share(shareData); } catch {}
        } else {
          navigator.clipboard.writeText(shareUrl).then(() => alert("Link copied to clipboard!"));
        }
      });

      container.appendChild(card);
    }

    /** Auto-play videos when visible */
    const videos = container.querySelectorAll("video");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const vid = entry.target;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.7) vid.play().catch(() => {});
          else vid.pause();
        });
      },
      { threshold: 0.7 }
    );
    videos.forEach((v) => observer.observe(v));

  } catch (err) {
    console.error("Failed to load sermons:", err);
    container.innerHTML = `<p style="color:red;">Failed to load sermons</p>`;
  }
}
