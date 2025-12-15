import { api } from "../../api.js";
import { el } from "../../utils.js";
import { fetchSermonComments, postSermonComment } from "../../commentsPublic.js";

/* ===========================
   SEO META
=========================== */
function setOpenGraphMeta({ title, description, image, url }) {
  const head = document.head;

  function setMeta(property, content, isName = false) {
    const selector = isName
      ? `meta[name="${property}"]`
      : `meta[property="${property}"]`;

    let meta = head.querySelector(selector);
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute(isName ? "name" : "property", property);
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

/* ===========================
   MAIN INIT
=========================== */
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
  feed.style.scrollBehavior = "smooth"; // smooth scrolling
  container.appendChild(feed);

  const videos = [];

  /* ===========================
     GLOBAL COMMENTS BOX
  =========================== */
  const globalCommentsBox = el("div", "comments-box");
  globalCommentsBox.style.display = "none";
  document.body.appendChild(globalCommentsBox);

  /* ===========================
     GLOBAL FIXED YOUTUBE BUTTON
  =========================== */
  const floatingYT = el("a", "youtube-btn");
  floatingYT.textContent = "📺 Full Sermon";
  floatingYT.target = "_blank";
  floatingYT.rel = "noopener noreferrer";
  floatingYT.style.display = "none";
  document.body.appendChild(floatingYT);

  /* ===========================
     BUILD FEED
  =========================== */
  for (const sermon of sermons) {
    const card = el("div", "tiktok-video");
    card.dataset.id = sermon.id;

    /* VIDEO */
    const videoWrapper = el("div", "video-wrapper");
    const video = document.createElement("video");
    video.muted = true; // muted by default to allow autoplay
    video.playsInline = true;
    video.preload = "metadata";
    video.poster = sermon.thumbnail_url || "";
    video.setAttribute("webkit-playsinline", "true");
    video.style.objectFit = "cover";
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

    /* PLAY / PAUSE BUTTON */
    const playBtn = el("div", "play-btn");
    playBtn.textContent = "▶";
    videoWrapper.appendChild(playBtn);

    // Clicking anywhere on video toggles mute & play/pause
    videoWrapper.onclick = e => {
      e.stopPropagation();
      if (video.paused) {
        videos.forEach(v => v.video !== video && v.video.pause());
        video.muted = false; // unmute on first user interaction
        video.play().catch(() => {});
        playBtn.style.display = "none";
      } else {
        video.pause();
        playBtn.style.display = "block";
      }
    };

    /* OVERLAY */
    const overlay = el("div", "sermon-overlay");
    overlay.innerHTML = `
      <div class="sermon-title">${sermon.title || "Untitled Sermon"}</div>
      <div class="sermon-desc">${sermon.description || ""}</div>
    `;

    /* ACTIONS */
    const actions = el("div", "sermon-actions");
    actions.innerHTML = `
      <button class="like-btn">❤️</button>
      <span class="like-count">0</span>
      <button class="comment-btn">💬</button>
      <span class="comment-count">0</span>
      <button class="share-btn">🔗</button>
    `;

    // Likes
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
    likeBtn.onclick = async e => {
      e.stopPropagation();
      await api.post("/likes", { sermon_id: sermon.id });
      refreshLikes();
    };
    refreshLikes();

    // Comments
    const commentBtn = actions.querySelector(".comment-btn");
    const commentCountEl = actions.querySelector(".comment-count");
    async function openComments() {
      globalCommentsBox.innerHTML = `
        <div class="comments-header">
          <strong>${commentCountEl.textContent} Comments</strong>
          <button class="close-btn">✖</button>
        </div>
        <div class="comment-list"></div>
        <form class="comment-form">
          <input placeholder="Your name (optional)" />
          <textarea placeholder="Write a comment..." required></textarea>
          <button type="submit">Post</button>
        </form>
      `;
      globalCommentsBox.style.display = "block";
      video.pause();

      let comments = await fetchSermonComments(String(sermon.id));
      if (!Array.isArray(comments)) comments = [];
      commentCountEl.textContent = comments.length;

      const list = globalCommentsBox.querySelector(".comment-list");
      list.innerHTML = comments.length
        ? comments.map(c =>
            `<div class="comment"><b>${c.name || "Guest"}:</b> ${c.content}</div>`
          ).join("")
        : "<p>No comments yet.</p>";

      globalCommentsBox.querySelector(".close-btn").onclick = () => {
        globalCommentsBox.style.display = "none";
        video.play().catch(() => {});
        playBtn.style.display = "none";
      };

      globalCommentsBox.querySelector(".comment-form").onsubmit = async e => {
        e.preventDefault();
        const name = e.target.querySelector("input").value || "Guest";
        const content = e.target.querySelector("textarea").value.trim();
        if (!content) return;

        await postSermonComment({ sermon_id: sermon.id, name, content });
        e.target.reset();
        openComments();
      };
    }
    commentBtn.onclick = e => { e.stopPropagation(); openComments(); };

    // Share
    actions.querySelector(".share-btn").onclick = e => {
      e.stopPropagation();
      const shareData = {
        title: sermon.title,
        text: sermon.description,
        url: `${location.origin}?sermon=${sermon.id}`
      };
      navigator.share
        ? navigator.share(shareData)
        : navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
    };

    card.append(videoWrapper, overlay, actions);
    feed.appendChild(card);
    videos.push({ video, card });

    setOpenGraphMeta({
      title: sermon.title || "Untitled Sermon",
      description: sermon.description || "",
      image: sermon.thumbnail_url || "",
      url: `${location.origin}?sermon=${sermon.id}`
    });
  }

  /* ===========================
     AUTOPLAY + NEXT VIDEO + YT BUTTON
  =========================== */
  let currentVideoIndex = 0;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const card = entry.target;
      const video = card.querySelector("video");
      const playBtn = card.querySelector(".play-btn");
      const sermon = sermons.find(s => s.id == card.dataset.id);

      if (entry.isIntersecting && entry.intersectionRatio >= 0.75) {
        videos.forEach(v => v.video !== video && v.video.pause());
        video.play().catch(() => {});
        playBtn.style.display = "none";
        currentVideoIndex = videos.findIndex(v => v.video === video);

        if (sermon?.youtube_url) {
          floatingYT.href = sermon.youtube_url;
          floatingYT.style.display = "flex";
        } else {
          floatingYT.style.display = "none";
        }
      } else {
        video.pause();
        playBtn.style.display = "block";
      }
    });
  }, { threshold: 0.75 });

  videos.forEach(v => observer.observe(v.card));

  // Auto-play next video when current ends
  videos.forEach((v, i) => {
    v.video.onended = () => {
      const nextIndex = (i + 1) % videos.length;
      const nextVideo = videos[nextIndex].video;
      nextVideo.scrollIntoView({ behavior: "smooth" });
      nextVideo.play().catch(() => {});
      const nextPlayBtn = videos[nextIndex].card.querySelector(".play-btn");
      if (nextPlayBtn) nextPlayBtn.style.display = "none";
    };
  });
}