import { api } from "../../api.js";
import { el } from "../../utils.js";
import { fetchSermonComments, postSermonComment } from "../../commentsPublic.js";

/** 🎯 Set OpenGraph / Twitter meta for SEO */
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

export async function initSermonTikTokFeed(container) {
  if (!container) return;
  container.innerHTML = "";

  let sermons;
  try {
    sermons = await api.get("/sermons");
  } catch {
    container.innerHTML = "<p style='text-align:center'>Failed to load sermons</p>";
    return;
  }

  if (!Array.isArray(sermons) || sermons.length === 0) {
    container.innerHTML = "<p style='text-align:center'>No sermons available</p>";
    return;
  }

  sermons.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const feed = el("div", "sermon-videos");
  container.appendChild(feed);

  const videos = [];

  for (const sermon of sermons) {
    const card = el("div", "tiktok-video");
    card.dataset.id = sermon.id;

    /** ================= VIDEO ================= */
    const videoWrapper = el("div", "video-wrapper");
    const video = document.createElement("video");
    video.playsInline = true;
    video.muted = true; // Required for autoplay
    video.loop = false;
    video.preload = "metadata";
    video.poster = sermon.thumbnail_url || "";
    video.setAttribute("webkit-playsinline", "true");
    video.style.objectFit = "cover"; // consistent aspect ratio
    videoWrapper.appendChild(video);

    const urls = sermon.urls || {};
    if (urls.hls_url && window.Hls && Hls.isSupported()) {
      const hls = new Hls({ startLevel: -1 });
      hls.loadSource(urls.hls_url);
      hls.attachMedia(video);
    } else if (urls.hls_url && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = urls.hls_url;
    } else {
      video.src = urls.mp4_url || sermon.video_url || "";
    }

    /** ================= PLAY BUTTON ================= */
    const playBtn = el("div", "play-btn");
    playBtn.textContent = "▶";
    playBtn.onclick = (e) => {
      e.stopPropagation();
      if (video.paused) {
        videos.forEach(v => v.video !== video && v.video.pause());
        video.play().catch(() => {});
        playBtn.style.display = "none";
      } else {
        video.pause();
        playBtn.style.display = "block";
      }
    };
    videoWrapper.appendChild(playBtn);

    /** ================= OVERLAY ================= */
    const overlay = el("div", "sermon-overlay");
    overlay.innerHTML = `
      <div class="sermon-title">${sermon.title || "Untitled Sermon"}</div>
      <div class="sermon-desc">${sermon.description || ""}</div>
    `;

    /** ================= ACTIONS ================= */
    const actions = el("div", "sermon-actions");
    actions.innerHTML = `
      <button class="like-btn">❤️</button>
      <span class="like-count">0</span>
      <button class="comment-btn">💬</button>
      <span class="comment-count">0</span>
      <button class="share-btn">🔗</button>
    `;

    /** ================= YOUTUBE ================= */
    if (sermon.youtube_url) {
      const yt = el("a", "youtube-btn");
      yt.href = sermon.youtube_url;
      yt.target = "_blank";
      yt.rel = "noopener noreferrer";
      yt.textContent = "📺 Full Sermon";
      card.appendChild(yt);
    }

    /** ================= COMMENTS BOX ================= */
    const commentsBox = el("div", "comments-box");
    commentsBox.style.display = "none";
    card.appendChild(commentsBox);

    /** ================= EVENTS ================= */
    card.addEventListener("click", () => {
      if (video.paused) {
        videos.forEach(v => v.video !== video && v.video.pause());
        video.play().catch(() => {});
        playBtn.style.display = "none";
      } else {
        video.pause();
        playBtn.style.display = "block";
      }
    });

    /** ❤️ Likes */
    const likeBtn = actions.querySelector(".like-btn");
    const likeCountEl = actions.querySelector(".like-count");

    async function refreshLikes() {
      try {
        const res = await api.get(`/likes/count?type=sermon&sermon_id=${sermon.id}`);
        likeCountEl.textContent = res.count || 0;
      } catch {
        likeCountEl.textContent = 0;
      }
    }

    likeBtn.onclick = async (e) => {
      e.stopPropagation();
      await api.post("/likes", { sermon_id: sermon.id });
      refreshLikes();
    };
    refreshLikes();

    /** 💬 Comments */
    const commentBtn = actions.querySelector(".comment-btn");
    const commentCountEl = actions.querySelector(".comment-count");

    async function refreshComments() {
      let comments = await fetchSermonComments(String(sermon.id));
      if (!Array.isArray(comments)) comments = [];

      commentCountEl.textContent = comments.length;

      commentsBox.innerHTML = `
        <div class="comments-header">
          <strong>${comments.length} Comments</strong>
          <button class="close-btn">✖</button>
        </div>
        <div class="comment-list">
          ${
            comments.length
              ? comments.map(
                  c => `<div class="comment"><b>${c.name || "Guest"}:</b> <span>${c.content}</span></div>`
                ).join("")
              : "<p>No comments yet.</p>"
          }
        </div>
        <form class="comment-form">
          <input placeholder="Your name (optional)" />
          <textarea placeholder="Write a comment..." required></textarea>
          <button type="submit">Post</button>
        </form>
      `;

      commentsBox.querySelector(".close-btn").onclick = () => {
        commentsBox.style.display = "none";
        video.play().catch(() => {});
        playBtn.style.display = "none";
      };

      commentsBox.querySelector(".comment-form").onsubmit = async (e) => {
        e.preventDefault();
        const name = e.target.querySelector("input").value || "Guest";
        const content = e.target.querySelector("textarea").value.trim();
        if (!content) return;
        await postSermonComment({ sermon_id: sermon.id, name, content });
        refreshComments();
        e.target.reset();
      };
    }

    commentBtn.onclick = (e) => {
      e.stopPropagation();
      const open = commentsBox.style.display === "block";
      commentsBox.style.display = open ? "none" : "block";
      if (open) video.play().catch(() => {});
      else video.pause(), refreshComments();
    };

    /** 🔗 Share */
    actions.querySelector(".share-btn").onclick = (e) => {
      e.stopPropagation();
      const url = `${location.origin}?sermon=${sermon.id}`;
      navigator.share
        ? navigator.share({ title: sermon.title, url })
        : navigator.clipboard.writeText(url);
    };

    card.append(videoWrapper, overlay, actions);
    feed.appendChild(card);
    videos.push({ video, card });

    /** SEO meta for each sermon */
    setOpenGraphMeta({
      title: sermon.title || "Untitled Sermon",
      description: sermon.description || "",
      image: sermon.thumbnail_url || "",
      url: `${location.origin}?sermon=${sermon.id}`
    });
  }

  /** ================= AUTOPLAY OBSERVER ================= */
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        const video = entry.target.querySelector("video");
        const playBtn = entry.target.querySelector(".play-btn");
        if (entry.isIntersecting && entry.intersectionRatio >= 0.75) {
          videos.forEach(v => v.video !== video && v.video.pause());
          video.play().catch(() => {});
          if (playBtn) playBtn.style.display = "none";
        } else {
          video.pause();
          if (playBtn) playBtn.style.display = "block";
        }
      });
    },
    { threshold: 0.75 }
  );

  videos.forEach(v => observer.observe(v.card));
}