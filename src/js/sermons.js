// src/js/sermons.js
import { api } from "../../api.js";

/**
 * TikTok-style Sermon Feed (Vertical, Autoplay Safe)
 */
export async function initSermonTikTokFeed(container) {
  if (!container) return;

  container.innerHTML = "";

  let sermons;
  try {
    sermons = await api.get("/sermons");
  } catch (err) {
    container.innerHTML = "<p style='text-align:center'>Failed to load sermons</p>";
    return;
  }

  if (!Array.isArray(sermons) || sermons.length === 0) {
    container.innerHTML = "<p style='text-align:center'>No sermons available</p>";
    return;
  }

  // Latest first
  sermons.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const feed = document.createElement("div");
  feed.className = "sermon-videos";
  container.appendChild(feed);

  const videos = [];

  sermons.forEach((sermon) => {
    /* CARD */
    const card = document.createElement("div");
    card.className = "tiktok-video";
    card.dataset.id = sermon.id;

    /* VIDEO */
    const video = document.createElement("video");
    video.playsInline = true;
    video.muted = true;               // Required for autoplay
    video.loop = true;
    video.preload = "metadata";
    video.poster = sermon.thumbnail_url || "";
    video.setAttribute("webkit-playsinline", "true");

    /* SOURCE */
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

    /* TITLE OVERLAY */
    const title = document.createElement("div");
    title.className = "sermon-title";
    title.textContent = sermon.title || "Untitled Sermon";

    card.appendChild(video);
    card.appendChild(title);
    feed.appendChild(card);

    videos.push(video);

    /* TAP TO PLAY / PAUSE */
    card.addEventListener("click", () => {
      if (video.paused) {
        videos.forEach(v => v !== video && v.pause());
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  });

  /* AUTOPLAY WHEN IN VIEW */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.75) {
          videos.forEach(v => v !== video && v.pause());
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    {
      threshold: 0.75,
      root: null // viewport (IMPORTANT)
    }
  );

  videos.forEach(video => observer.observe(video));
}