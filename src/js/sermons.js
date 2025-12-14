// src/js/sermons.js — STABLE, FAST, NO SCROLL INDICATORS
import { api } from "../../api.js";
import { el } from "../../utils.js";
import { fetchSermonComments } from "../../commentsPublic.js";

/**
 * Initialize TikTok-style sermon feed
 */
export async function initSermonTikTokFeed(container) {
  if (!container) return;

  container.innerHTML = '';
  container.className = 'tiktok-feed';

  container.innerHTML = `
    <div class="sermon-videos" id="sermonVideosContainer"></div>

    <div class="loading-indicator" id="loadingIndicator">
      <div class="spinner"></div>
      <p>Loading sermons...</p>
    </div>

    <button class="search-btn" id="openSearch">🔍 Search</button>

    <div class="feed-controls">
      <button id="refreshFeed">🔄 Refresh</button>
      <button id="toggleShuffle">🔀 Shuffle: ON</button>
    </div>
  `;

  const videosContainer = document.getElementById('sermonVideosContainer');
  const loadingIndicator = document.getElementById('loadingIndicator');

  let sermons = [];
  let videos = [];
  let currentIndex = 0;
  let shuffleMode = true;
  let isLoading = false;
  let currentVideo = null;

  /* ------------------------------------------------------------------ */
  /* LOAD SERMONS */
  /* ------------------------------------------------------------------ */
  async function loadSermons() {
    if (isLoading) return;
    isLoading = true;
    loadingIndicator.style.display = 'block';

    try {
      const response = await api.get('/sermons');
      const list = Array.isArray(response) ? response : response.data || [];

      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      sermons = list;

      videosContainer.innerHTML = '';
      videos = [];

      sermons.forEach((sermon, index) => createCard(sermon, index));

      setupAutoplayObserver();

    } catch (e) {
      console.error(e);
      videosContainer.innerHTML = `<p style="text-align:center;color:red">Failed to load sermons</p>`;
    } finally {
      isLoading = false;
      loadingIndicator.style.display = 'none';
    }
  }

  /* ------------------------------------------------------------------ */
  /* CREATE VIDEO CARD */
  /* ------------------------------------------------------------------ */
  function createCard(sermon, index) {
    const card = el('div', 'tiktok-video');
    card.dataset.index = index;

    const video = el('video');
    video.playsInline = true;
    video.muted = true; // REQUIRED for autoplay
    video.preload = 'metadata';

    const source =
      sermon.hls_url ||
      sermon.mp4_url ||
      sermon.video_url ||
      sermon.original_url;

    if (!source) return;

    if (source.endsWith('.m3u8') && window.Hls?.isSupported()) {
      const hls = new Hls();
      hls.loadSource(source);
      hls.attachMedia(video);
    } else {
      video.src = source;
    }

    const thumb = el('div', 'video-thumbnail');
    thumb.style.backgroundImage = `url('${sermon.thumbnail_url || ''}')`;

    const playBtn = el('div', 'play-overlay');
    playBtn.textContent = '▶';

    const title = el('h2', 'sermon-title');
    title.textContent = sermon.title || 'Untitled Sermon';

    card.append(thumb, playBtn, video, title);
    videosContainer.appendChild(card);

    videos.push({ card, video });

    /* USER INTERACTION — REQUIRED FOR MOBILE */
    const startPlayback = () => {
      if (currentVideo && currentVideo !== video) {
        currentVideo.pause();
      }
      currentVideo = video;
      thumb.style.display = 'none';
      playBtn.style.display = 'none';
      video.style.display = 'block';
      video.play().catch(() => {});
    };

    playBtn.onclick = startPlayback;
    thumb.onclick = startPlayback;

    video.onclick = () => {
      if (video.paused) video.play();
      else video.pause();
    };
  }

  /* ------------------------------------------------------------------ */
  /* AUTOPLAY OBSERVER — FIXED */
  /* ------------------------------------------------------------------ */
  function setupAutoplayObserver() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting && entry.intersectionRatio > 0.75) {
          if (currentVideo && currentVideo !== video) {
            currentVideo.pause();
          }
          currentVideo = video;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.75 });

    videos.forEach(v => observer.observe(v.video));
  }

  /* ------------------------------------------------------------------ */
  /* SCROLL / TOUCH NAVIGATION (KEPT) */
  /* ------------------------------------------------------------------ */
  videosContainer.addEventListener('wheel', e => {
    e.preventDefault();
    navigate(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  let touchStartY = 0;
  videosContainer.addEventListener('touchstart', e => {
    touchStartY = e.touches[0].clientY;
  });

  videosContainer.addEventListener('touchend', e => {
    const delta = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(delta) > 50) navigate(delta > 0 ? 1 : -1);
  });

  function navigate(direction) {
    if (!videos.length) return;

    if (shuffleMode && direction === 1) {
      currentIndex = Math.floor(Math.random() * videos.length);
    } else {
      currentIndex = Math.max(0, Math.min(videos.length - 1, currentIndex + direction));
    }

    videos[currentIndex].card.scrollIntoView({ behavior: 'smooth' });
  }

  /* ------------------------------------------------------------------ */
  /* CONTROLS */
  /* ------------------------------------------------------------------ */
  document.getElementById('refreshFeed').onclick = loadSermons;
  document.getElementById('toggleShuffle').onclick = e => {
    shuffleMode = !shuffleMode;
    e.target.textContent = shuffleMode ? '🔀 Shuffle: ON' : '🔀 Shuffle: OFF';
  };

  /* ------------------------------------------------------------------ */
  /* INIT */
  /* ------------------------------------------------------------------ */
  await loadSermons();
}