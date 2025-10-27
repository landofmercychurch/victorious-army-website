import { api } from "./api.js";
import { el } from "./utils.js";
import { fetchSermonComments, postSermonComment } from "./commentsPublic.js";

export async function initSermons(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading sermons…</p>";

  try {
    const sermons = await api.get("/sermons");
    if (!Array.isArray(sermons) || sermons.length === 0) {
      container.innerHTML = "<p>No sermons available.</p>";
      return;
    }

    sermons.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    container.innerHTML = "";

    const scrollIndicator = el("div", "scroll-indicator");
    scrollIndicator.textContent = "⬆️⬇️ Swipe up/down to see more sermons ⬆️⬇️";
    container.appendChild(scrollIndicator);

    const videos = [];

    for (const sermon of sermons) {
      const card = el("div", "sermon-card");
      card.dataset.id = sermon.id;

      /** Video wrapper */
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

      /** Lazy-load + HLS + fallback to MP4/MOV/WebM */
      const setupVideo = () => {
        if (sermon.hls_url && window.Hls && Hls.isSupported()) {
          const hls = new Hls({ startLevel:-1, maxBufferLength:30 });
          hls.loadSource(sermon.hls_url);
          hls.attachMedia(video);
        } else if (sermon.hls_url && video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = sermon.hls_url;
        } else if (sermon.urls) {
          // Fallback order: MP4 -> MOV -> WebM
          video.src = sermon.urls.mp4_url || sermon.urls.mov_url || sermon.urls.webm_url || "";
        } else if (sermon.video_url) {
          video.src = sermon.video_url;
        }
      };

      const lazyObserver = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            setupVideo();
            lazyObserver.unobserve(video);
          }
        });
      }, { threshold: 0.25, root: container });
      lazyObserver.observe(video);

      /** Overlay + actions + comments (keep your previous logic here) */
      // e.g. card.appendChild(overlay), like/comment/share logic

      container.appendChild(card);
    }

    /** Auto-play visible videos only, pause others */
    const autoPlayObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const vid = entry.target;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) vid.play().catch(()=>{});
        else vid.pause();
      });
    }, { threshold: 0.7, root: container });

    videos.forEach(vObj => autoPlayObserver.observe(vObj.video));

  } catch (err) {
    console.error("Failed to load sermons:", err);
    container.innerHTML = `<p style="color:red;">Failed to load sermons</p>`;
  }
}
