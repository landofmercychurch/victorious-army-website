// src/sermons.js
import { api } from "./api.js";
import { el } from "./utils.js";
import { fetchSermonComments, postSermonComment } from "./commentsPublic.js";

/** 🧩 OpenGraph/Twitter meta */
function setOpenGraphMeta({ title, description, image, url }) {
  const head = document.head;
  function setMeta(property, content, isName = false) {
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

  setMeta("og:title", title);
  setMeta("og:description", description);
  setMeta("og:image", image);
  setMeta("og:url", url);
  setMeta("twitter:card", "summary_large_image", true);
  setMeta("twitter:title", title, true);
  setMeta("twitter:description", description, true);
  setMeta("twitter:image", image, true);
}

/** 🎥 Sermons Feed Init */
export async function initSermons(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading sermons…</p>";

  try {
    const sermons = await api.get("/sermons");
    if (!Array.isArray(sermons) || sermons.length === 0) {
      container.innerHTML = "<p>No sermons available.</p>";
      return;
    }

    // Show latest first
    sermons.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    container.innerHTML = "";

    /** Scroll hint */
    const scrollIndicator = el("div", "scroll-indicator");
    scrollIndicator.textContent = "⬆️⬇️ Swipe up/down to see more sermons ⬆️⬇️";
    container.appendChild(scrollIndicator);

    const videos = [];

    for (const sermon of sermons) {
      const card = el("div", "sermon-card");
      card.dataset.id = sermon.id;

      /** 🎞 Video wrapper */
      const videoWrapper = el("div", "video-wrapper");
      const video = el("video");
      video.playsInline = true;
      video.controls = true;
      video.preload = "metadata";
      video.poster = sermon.thumbnail_url || "";
      video.style.backgroundColor = "#000";
      videoWrapper.appendChild(video);
      card.appendChild(videoWrapper);

      videos.push({ video, sermon });

      /** Lazy-load HLS or fallback */
      const setupVideo = () => {
        const urls = sermon.urls || {};
        if (urls.hls_url && window.Hls && Hls.isSupported()) {
          const hls = new Hls({ startLevel: -1, maxBufferLength: 30 });
          hls.loadSource(urls.hls_url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
        } else if (urls.hls_url && video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = urls.hls_url;
        } else {
          video.src = urls.mp4_url || urls.webm_url || sermon.video_url || "";
        }
      };

      const lazyObserver = new IntersectionObserver(
        entries => {
          entries.forEach(e => {
            if (e.isIntersecting) {
              setupVideo();
              lazyObserver.unobserve(video);
            }
          });
        },
        { threshold: 0.25, root: container }
      );
      lazyObserver.observe(video);

      /** Overlay details */
      const overlay = el("div", "sermon-overlay");
      overlay.innerHTML = `
        <div class="sermon-title">${sermon.title || "Untitled Sermon"}</div>
        <div class="sermon-desc">${sermon.description || ""}</div>
      `;
      card.appendChild(overlay);

      /** Buttons (like, comment, share) */
      const actions = el("div", "sermon-actions");
      actions.innerHTML = `
        <button class="like-btn">❤️</button>
        <span class="like-count">0 Likes</span>
        <button class="comment-btn">💬</button>
        <span class="comment-count">0 Comments</span>
        <button class="share-btn">🔗 Share</button>
      `;
      card.appendChild(actions);

      /** YouTube button */
      if (sermon.youtube_url) {
        const ytBtn = el("a", "youtube-btn");
        ytBtn.href = sermon.youtube_url;
        ytBtn.target = "_blank";
        ytBtn.rel = "noopener noreferrer";
        ytBtn.innerHTML = "📺 Full Sermon";
        card.appendChild(ytBtn);
      }

      /** ❤️ Likes */
      const likeBtn = actions.querySelector(".like-btn");
      const likeCountEl = actions.querySelector(".like-count");
      async function refreshLikes() {
        try {
          const res = await api.get(`/likes/count?type=sermon&sermon_id=${sermon.id}`);
          likeCountEl.textContent = `${res.count || 0} Likes`;
        } catch {
          likeCountEl.textContent = "0 Likes";
        }
      }
      likeBtn.addEventListener("click", async () => {
        await api.post("/likes", { sermon_id: sermon.id });
        refreshLikes();
      });
      refreshLikes();

      /** 💬 Comments */
      const commentBtn = actions.querySelector(".comment-btn");
      const commentCountEl = actions.querySelector(".comment-count");
      const commentsBox = el("div", "comments-box");
      commentsBox.style.display = "none";
      card.appendChild(commentsBox);

      async function refreshComments() {
        try {
          let comments = await fetchSermonComments(String(sermon.id));
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
                <button type="submit">Post Comment</button>
              </form>
            `;
            commentList = commentsBox.querySelector(".comment-list");

            commentsBox.querySelector(".close-btn").onclick = () => {
              commentsBox.style.display = "none";
              video.play().catch(() => {});
            };

            commentsBox.querySelector(".comment-form").onsubmit = async e => {
              e.preventDefault();
              const name = commentsBox.querySelector(".comment-name").value.trim() || "Guest";
              const content = commentsBox.querySelector(".comment-content").value.trim();
              if (!content) return;
              const newComment = await postSermonComment({ sermon_id: sermon.id, name, content });
              commentList.insertAdjacentHTML(
                "afterbegin",
                `<div class="comment"><b>${newComment.name || "Guest"}:</b> <span>${newComment.content}</span><div class="comment-time">${new Date(
                  newComment.created_at
                ).toLocaleString()}</div></div>`
              );
              e.target.reset();
              commentCountEl.textContent = `${commentList.children.length} Comment${commentList.children.length !== 1 ? "s" : ""}`;
            };
          }

          commentList.innerHTML = comments.length
            ? comments
                .map(
                  c =>
                    `<div class="comment"><b>${c.name || "Guest"}:</b> <span>${c.content}</span><div class="comment-time">${new Date(
                      c.created_at
                    ).toLocaleString()}</div></div>`
                )
                .join("")
            : `<p class="no-comments">No comments yet. Be the first!</p>`;
        } catch (err) {
          console.error("Failed to load comments", err);
        }
      }

      commentBtn.addEventListener("click", () => {
        const hidden = commentsBox.style.display === "none";
        commentsBox.style.display = hidden ? "block" : "none";
        if (hidden) {
          video.pause();
          refreshComments();
        } else {
          video.play().catch(() => {});
        }
      });

      container.appendChild(card);
    }

    /** 🎬 Autoplay videos when visible */
    const autoPlayObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const vid = entry.target;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.7)
            vid.play().catch(() => {});
          else vid.pause();
        });
      },
      { threshold: 0.7, root: container }
    );
    videos.forEach(vObj => autoPlayObserver.observe(vObj.video));

    /** 🔀 TikTok-style random next autoplay */
    function playNextRandom(currentVideo) {
      if (videos.length <= 1) return;
      const others = videos.filter(v => v.video !== currentVideo);
      const next = others[Math.floor(Math.random() * others.length)];
      next.video.scrollIntoView({ behavior: "smooth", block: "center" });
      next.video.play().catch(() => {});
    }

    videos.forEach(vObj => {
      vObj.video.addEventListener("ended", () => playNextRandom(vObj.video));
    });

    /** Handle deep link */
    const sermonId = new URLSearchParams(window.location.search).get("sermon");
    if (sermonId) {
      const targetCard = container.querySelector(`.sermon-card[data-id="${sermonId}"]`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
        const video = targetCard.querySelector("video");
        if (video) video.play().catch(() => {});
      }
    }

  } catch (err) {
    console.error("Failed to load sermons:", err);
    container.innerHTML = `<p style="color:red;">Failed to load sermons</p>`;
  }
}
