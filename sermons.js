// js/sermons.js
import { api } from "./api.js";
import { el } from "./utils.js";
import { fetchSermonComments, postSermonComment } from "./commentsPublic.js";


/** Set Open Graph / Twitter meta tags for sharing */
function setOpenGraphMeta({ title, description, image, url }) {
  const head = document.head;

  function createOrUpdate(property, content, isName = false) {
    const selector = isName
      ? `meta[name="${property}"]`
      : `meta[property="${property}"]`;
    let meta = head.querySelector(selector);
    if (!meta) {
      meta = document.createElement("meta");
      isName
        ? meta.setAttribute("name", property)
        : meta.setAttribute("property", property);
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

/** Initialise sermons feed */
export async function initSermons(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading sermons…</p>";

  try {
    let sermons = await api.get("/sermons");
    if (!Array.isArray(sermons) || sermons.length === 0) {
      container.innerHTML = "<p>No sermons available.</p>";
      return;
    }

    // Sort newest first
    sermons.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    container.innerHTML = "";

    sermons.forEach((sermon) => {
      const card = el("div", "sermon-card");
      card.dataset.id = sermon.id;

      // --- Video wrapper ---
      const videoWrapper = el("div", "video-wrapper");
      const video = el("video");
      video.playsInline = true;
      video.controls = true;
      video.preload = "metadata";
      video.poster = sermon.thumbnail_url || "";
      video.style.backgroundColor = "#000";

      // Spinner while video loads
      const spinner = el("div", "video-spinner");
      spinner.innerHTML = `<div class="loader"></div>`;
      spinner.style.display = "none";
      videoWrapper.appendChild(video);
      videoWrapper.appendChild(spinner);
      card.appendChild(videoWrapper);

      // --- Setup lazy HLS loading ---
      const hlsSource = sermon.hls_url;
      const mp4Source = sermon.video_url;

      const setupVideo = () => {
        spinner.style.display = "flex";
        if (hlsSource && Hls.isSupported()) {
          const hls = new Hls({ startLevel: -1, maxBufferLength: 30 });
          hls.loadSource(hlsSource);
          hls.attachMedia(video);
          video.addEventListener("loadeddata", () => (spinner.style.display = "none"));
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          // Safari support
          video.src = hlsSource || mp4Source;
          video.addEventListener("loadeddata", () => (spinner.style.display = "none"));
        } else {
          video.src = mp4Source;
          video.addEventListener("loadeddata", () => (spinner.style.display = "none"));
        }
      };

      // Lazy-load when in viewport
      const lazyObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setupVideo();
              lazyObserver.unobserve(video);
            }
          });
        },
        { threshold: 0.2 }
      );
      lazyObserver.observe(video);

      // Preview-on-hover (3s)
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

      // --- Overlay info ---
      const overlay = el("div", "sermon-overlay");
      overlay.innerHTML = `
        <div class="sermon-title">${sermon.title || "Untitled Sermon"}</div>
        <div class="sermon-desc">${sermon.description || ""}</div>
      `;
      card.appendChild(overlay);

      // --- Actions ---
      const actions = el("div", "sermon-actions");
      actions.innerHTML = `
        <button class="like-btn">❤️</button>
        <span class="like-count">0 Likes</span>
        <button class="comment-btn">💬</button>
        <span class="comment-count">0 Comments</span>
        <button class="share-btn">🔗 Share</button>
      `;
      card.appendChild(actions);

      // --- Comments box ---
      const commentsBox = el("div", "comments-box");
      commentsBox.style.display = "none";
      card.appendChild(commentsBox);

      container.appendChild(card);

      const likeBtn = actions.querySelector(".like-btn");
      const likeCountEl = actions.querySelector(".like-count");
      const commentBtn = actions.querySelector(".comment-btn");
      const commentCountEl = actions.querySelector(".comment-count");
      const shareBtn = actions.querySelector(".share-btn");

      /** Likes **/
      async function refreshLikes() {
        try {
          const res = await api.get(
            `/likes/count?type=sermon&sermon_id=${sermon.id}`
          );
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

      /** Comments **/
      async function refreshComments() {
        try {
          let comments = await fetchSermonComments(sermon.id);
          if (!Array.isArray(comments)) comments = [];
          commentCountEl.textContent = `${comments.length} Comments`;

          commentsBox.innerHTML = `
            <button class="close-btn">✖</button>
            <div class="comment-list">
              ${
                comments.length
                  ? comments
                      .map(
                        (c) =>
                          `<div class="comment"><b>${c.name || "Guest"}:</b> ${
                            c.content
                          }</div>`
                      )
                      .join("")
                  : `<p class="no-comments">No comments yet. Be the first!</p>`
              }
            </div>
            <form class="comment-form">
              <input type="text" class="comment-name" placeholder="Your name (optional)" />
              <input type="text" class="comment-content" placeholder="Write a comment…" required />
              <button type="submit">Post</button>
            </form>
          `;

          commentsBox
            .querySelector(".close-btn")
            .addEventListener("click", () => (commentsBox.style.display = "none"));

          const form = commentsBox.querySelector(".comment-form");
          form.onsubmit = async (e) => {
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
        commentsBox.style.display =
          commentsBox.style.display === "none" ? "block" : "none";
        if (commentsBox.style.display === "block") refreshComments();
      });
      refreshComments();

      /** Share **/
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
          try {
            await navigator.share(shareData);
          } catch {}
        } else {
          navigator.clipboard
            .writeText(shareUrl)
            .then(() => alert("Link copied to clipboard!"));
        }
      });
    });

    // --- Autoplay visible videos ---
    const videos = container.querySelectorAll("video");
    const autoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.7)
            video.play().catch(() => {});
          else video.pause();
        });
      },
      { threshold: 0.7 }
    );
    videos.forEach((video) => autoObserver.observe(video));
  } catch (err) {
    console.error("Failed to load sermons:", err);
    container.innerHTML = `<p style="color:red">Failed to load sermons</p>`;
  }
}
