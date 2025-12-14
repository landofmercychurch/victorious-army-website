// src/js/sermons.js
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

/** ================================================
 * 1️⃣ MAIN PAGE: Thumbnails Only (Fast Loading)
 * ================================================ */
export async function initSermonThumbnails(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading sermons…</p>";

  try {
    const sermons = await api.get("/sermons");
    if (!Array.isArray(sermons) || sermons.length === 0) {
      container.innerHTML = "<p>No sermons available.</p>";
      return;
    }

    // 🕒 Latest-first order
    sermons.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    container.innerHTML = "";

    for (const sermon of sermons) {
      const card = el("div", "sermon-thumbnail-card");
      card.dataset.id = sermon.id;
      card.style.cssText = `
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 20px;
        background: white;
        transition: transform 0.3s ease;
      `;
      
      card.onmouseenter = () => {
        card.style.transform = "translateY(-5px)";
      };
      card.onmouseleave = () => {
        card.style.transform = "translateY(0)";
      };

      // Thumbnail image (click goes to detail page)
      const thumbnailLink = el("a", "sermon-thumbnail-link");
      thumbnailLink.href = `sermon-detail.html?id=${sermon.id}`;
      thumbnailLink.style.cssText = `
        display: block;
        position: relative;
        text-decoration: none;
      `;
      
      const thumbnailImg = el("img", "thumbnail-img");
      thumbnailImg.src = sermon.thumbnail_url || "default-thumb.jpg";
      thumbnailImg.alt = sermon.title;
      thumbnailImg.loading = "lazy";
      thumbnailImg.style.cssText = `
        width: 100%;
        height: 200px;
        object-fit: cover;
        display: block;
      `;
      
      // Play overlay
      const playOverlay = el("div", "play-overlay");
      playOverlay.innerHTML = "▶️";
      playOverlay.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.7);
        color: white;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      
      thumbnailLink.onmouseenter = () => {
        playOverlay.style.opacity = "1";
      };
      thumbnailLink.onmouseleave = () => {
        playOverlay.style.opacity = "0";
      };
      
      thumbnailLink.appendChild(thumbnailImg);
      thumbnailLink.appendChild(playOverlay);
      card.appendChild(thumbnailLink);
      
      // Content
      const content = el("div", "thumbnail-content");
      content.style.cssText = `
        padding: 15px;
      `;
      
      // Title
      const titleLink = el("a", "title-link");
      titleLink.href = `sermon-detail.html?id=${sermon.id}`;
      titleLink.innerHTML = `<h3 style="margin: 0 0 8px 0; color: #333;">${sermon.title || "Untitled Sermon"}</h3>`;
      titleLink.style.cssText = `
        text-decoration: none;
        display: block;
      `;
      content.appendChild(titleLink);
      
      // Meta
      const meta = el("div", "thumbnail-meta");
      meta.style.cssText = `
        display: flex;
        gap: 10px;
        color: #666;
        font-size: 14px;
        margin-bottom: 8px;
      `;
      meta.innerHTML = `
        <span>📅 ${new Date(sermon.created_at).toLocaleDateString()}</span>
        ${sermon.speaker ? `<span>👤 ${sermon.speaker}</span>` : ''}
      `;
      content.appendChild(meta);
      
      // Description
      if (sermon.description) {
        const desc = el("p", "thumbnail-desc");
        desc.textContent = sermon.description.substring(0, 100) + "...";
        desc.style.cssText = `
          margin: 0;
          color: #444;
          font-size: 14px;
          line-height: 1.4;
        `;
        content.appendChild(desc);
      }
      
      // Watch button
      const watchBtn = el("a", "watch-btn");
      watchBtn.href = `sermon-detail.html?id=${sermon.id}`;
      watchBtn.textContent = "Watch Sermon →";
      watchBtn.style.cssText = `
        display: inline-block;
        margin-top: 10px;
        padding: 8px 15px;
        background: #4CAF50;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-weight: bold;
        font-size: 14px;
      `;
      content.appendChild(watchBtn);
      
      card.appendChild(content);
      container.appendChild(card);
    }
    
  } catch (err) {
    console.error("Failed to load sermons:", err);
    container.innerHTML = `<p style="color:red; padding: 20px; text-align: center;">Failed to load sermons.</p>`;
  }
}

/** ================================================
 * 2️⃣ SERMON LISTING PAGE: YouTube-style with Videos
 * ================================================ */
export async function initSermonListing(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading sermons…</p>";

  try {
    const sermons = await api.get("/sermons");
    if (!Array.isArray(sermons) || sermons.length === 0) {
      container.innerHTML = "<p>No sermons available.</p>";
      return;
    }

    // 🕒 Latest-first order
    sermons.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    container.innerHTML = "";

    const videos = [];

    for (const sermon of sermons) {
      const card = el("div", "sermon-listing-card");
      card.dataset.id = sermon.id;
      card.style.cssText = `
        margin-bottom: 30px;
        border-radius: 8px;
        overflow: hidden;
        background: white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      `;

      // Video Container
      const videoContainer = el("div", "video-container");
      videoContainer.style.cssText = `
        position: relative;
        background: #000;
        cursor: pointer;
      `;

      // Video Element
      const video = el("video");
      video.playsInline = true;
      video.controls = false; // We'll add custom controls
      video.preload = "metadata";
      video.poster = sermon.thumbnail_url || "";
      video.style.cssText = `
        width: 100%;
        height: auto;
        max-height: 400px;
        display: block;
      `;
      
      // Video Overlay (shows thumbnail when not playing)
      const videoOverlay = el("div", "video-overlay");
      videoOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-size: cover;
        background-position: center;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.3s ease;
      `;
      
      if (sermon.thumbnail_url) {
        videoOverlay.style.backgroundImage = `url('${sermon.thumbnail_url}')`;
      } else {
        videoOverlay.style.backgroundColor = "#222";
      }
      
      // Play Button on Overlay
      const overlayPlayBtn = el("div", "overlay-play-btn");
      overlayPlayBtn.innerHTML = "▶️";
      overlayPlayBtn.style.cssText = `
        background: rgba(0,0,0,0.7);
        color: white;
        width: 70px;
        height: 70px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
        transition: transform 0.3s ease;
      `;
      
      overlayPlayBtn.onmouseenter = () => {
        overlayPlayBtn.style.transform = "scale(1.1)";
      };
      overlayPlayBtn.onmouseleave = () => {
        overlayPlayBtn.style.transform = "scale(1)";
      };
      
      videoOverlay.appendChild(overlayPlayBtn);
      
      // Custom Video Controls
      const customControls = el("div", "custom-controls");
      customControls.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0,0,0,0.8));
        padding: 10px;
        display: none;
        align-items: center;
        gap: 10px;
      `;
      
      const playPauseBtn = el("button", "control-btn");
      playPauseBtn.innerHTML = "⏸️";
      playPauseBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
      `;
      
      const progressBar = el("div", "progress-bar");
      progressBar.style.cssText = `
        flex: 1;
        height: 4px;
        background: rgba(255,255,255,0.3);
        border-radius: 2px;
        overflow: hidden;
      `;
      
      const progressFill = el("div", "progress-fill");
      progressFill.style.cssText = `
        width: 0%;
        height: 100%;
        background: #4CAF50;
        transition: width 0.1s;
      `;
      progressBar.appendChild(progressFill);
      
      const timeDisplay = el("span", "time-display");
      timeDisplay.textContent = "0:00 / 0:00";
      timeDisplay.style.cssText = `
        color: white;
        font-size: 12px;
        min-width: 100px;
      `;
      
      const fullscreenBtn = el("button", "control-btn");
      fullscreenBtn.innerHTML = "🔲";
      fullscreenBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 16px;
        cursor: pointer;
      `;
      
      customControls.appendChild(playPauseBtn);
      customControls.appendChild(progressBar);
      customControls.appendChild(timeDisplay);
      customControls.appendChild(fullscreenBtn);
      
      videoContainer.appendChild(video);
      videoContainer.appendChild(videoOverlay);
      videoContainer.appendChild(customControls);
      card.appendChild(videoContainer);
      
      // Video Info
      const videoInfo = el("div", "video-info");
      videoInfo.style.cssText = `
        padding: 15px;
      `;
      
      // Title with link to detail page
      const titleLink = el("a", "video-title-link");
      titleLink.href = `sermon-detail.html?id=${sermon.id}`;
      titleLink.innerHTML = `<h3 style="margin: 0 0 8px 0; color: #333;">${sermon.title || "Untitled Sermon"}</h3>`;
      titleLink.style.cssText = `
        text-decoration: none;
        display: block;
      `;
      videoInfo.appendChild(titleLink);
      
      // Meta info
      const metaInfo = el("div", "video-meta");
      metaInfo.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        color: #666;
        font-size: 14px;
      `;
      
      const leftMeta = el("div", "left-meta");
      leftMeta.innerHTML = `
        <span>📅 ${new Date(sermon.created_at).toLocaleDateString()}</span>
        ${sermon.speaker ? `<span style="margin-left: 10px;">👤 ${sermon.speaker}</span>` : ''}
      `;
      
      const viewCount = el("span", "view-count");
      viewCount.textContent = "👁️ 0 views";
      viewCount.style.marginLeft = "10px";
      
      metaInfo.appendChild(leftMeta);
      metaInfo.appendChild(viewCount);
      videoInfo.appendChild(metaInfo);
      
      // Description
      if (sermon.description) {
        const desc = el("p", "video-desc");
        desc.textContent = sermon.description;
        desc.style.cssText = `
          margin: 0 0 15px 0;
          color: #444;
          font-size: 14px;
          line-height: 1.5;
        `;
        videoInfo.appendChild(desc);
      }
      
      // Action buttons
      const actionButtons = el("div", "action-buttons");
      actionButtons.style.cssText = `
        display: flex;
        gap: 10px;
        margin-top: 15px;
      `;
      
      const likeBtn = el("button", "action-btn");
      likeBtn.innerHTML = "❤️ Like";
      likeBtn.style.cssText = `
        padding: 8px 15px;
        background: #f0f0f0;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 5px;
      `;
      
      const commentBtn = el("button", "action-btn");
      commentBtn.innerHTML = "💬 Comment";
      commentBtn.style.cssText = likeBtn.style.cssText;
      
      const shareBtn = el("button", "action-btn");
      shareBtn.innerHTML = "🔗 Share";
      shareBtn.style.cssText = likeBtn.style.cssText;
      
      const watchFullBtn = el("a", "watch-full-btn");
      watchFullBtn.href = `sermon-detail.html?id=${sermon.id}`;
      watchFullBtn.textContent = "Watch Full →";
      watchFullBtn.style.cssText = `
        padding: 8px 15px;
        background: #4CAF50;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-weight: bold;
        margin-left: auto;
      `;
      
      actionButtons.appendChild(likeBtn);
      actionButtons.appendChild(commentBtn);
      actionButtons.appendChild(shareBtn);
      actionButtons.appendChild(watchFullBtn);
      videoInfo.appendChild(actionButtons);
      
      card.appendChild(videoInfo);
      container.appendChild(card);
      
      // Store video reference for lazy loading
      videos.push({ 
        video, 
        sermon, 
        overlay: videoOverlay, 
        controls: customControls,
        progressFill,
        timeDisplay,
        playPauseBtn,
        videoContainer
      });
    }
    
    // Setup video lazy loading and controls
    setupYouTubeStyleVideos(videos);
    
  } catch (err) {
    console.error("Failed to load sermons:", err);
    container.innerHTML = `<p style="color:red; padding: 20px; text-align: center;">Failed to load sermons.</p>`;
  }
}

/** ================================================
 * 3️⃣ ORIGINAL FUNCTION: Full TikTok-style (Preserved)
 * ================================================ */
export async function initSermons(container) {
  // YOUR EXISTING initSermons CODE HERE (UNCHANGED)
  // Keep all your original TikTok-style functionality
  // ... [Your existing initSermons code]
}

/** ================================================
 * 🔧 HELPER: Setup YouTube-style video controls
 * ================================================ */
function setupYouTubeStyleVideos(videos) {
  videos.forEach(({ video, sermon, overlay, controls, progressFill, timeDisplay, playPauseBtn, videoContainer }) => {
    let isPlaying = false;
    let videoLoaded = false;
    
    // Lazy load video when scrolled into view
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !videoLoaded) {
            loadVideoSource(video, sermon);
            videoLoaded = true;
            videoObserver.unobserve(videoContainer);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    videoObserver.observe(videoContainer);
    
    // Load video source
    function loadVideoSource(videoEl, sermonData) {
      const urls = sermonData.urls || {};
      if (urls.hls_url && window.Hls && Hls.isSupported()) {
        const hls = new Hls({ startLevel: -1, maxBufferLength: 30 });
        hls.loadSource(urls.hls_url);
        hls.attachMedia(videoEl);
      } else if (urls.hls_url && videoEl.canPlayType("application/vnd.apple.mpegurl")) {
        videoEl.src = urls.hls_url;
      } else {
        videoEl.src = urls.mp4_url || urls.webm_url || sermonData.video_url || "";
      }
      
      // Setup time update
      videoEl.addEventListener('timeupdate', updateProgress);
      videoEl.addEventListener('loadedmetadata', () => {
        timeDisplay.textContent = `0:00 / ${formatTime(videoEl.duration)}`;
      });
    }
    
    // Overlay click to play
    overlay.querySelector('.overlay-play-btn').onclick = () => {
      if (!videoLoaded) {
        loadVideoSource(video, sermon);
        videoLoaded = true;
      }
      video.play();
      isPlaying = true;
      overlay.style.opacity = "0";
      controls.style.display = "flex";
      playPauseBtn.innerHTML = "⏸️";
    };
    
    // Video click to toggle play/pause
    video.onclick = () => {
      if (video.paused) {
        video.play();
        isPlaying = true;
        overlay.style.opacity = "0";
        controls.style.display = "flex";
        playPauseBtn.innerHTML = "⏸️";
      } else {
        video.pause();
        isPlaying = false;
        playPauseBtn.innerHTML = "▶️";
      }
    };
    
    // Custom controls
    playPauseBtn.onclick = () => {
      if (video.paused) {
        video.play();
        isPlaying = true;
        playPauseBtn.innerHTML = "⏸️";
      } else {
        video.pause();
        isPlaying = false;
        playPauseBtn.innerHTML = "▶️";
      }
    };
    
    // Progress bar click
    controls.querySelector('.progress-bar').onclick = (e) => {
      const rect = e.target.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      video.currentTime = percent * video.duration;
      updateProgress();
    };
    
    // Fullscreen
    controls.querySelector('.fullscreen-btn').onclick = () => {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen();
      }
    };
    
    // Update progress bar
    function updateProgress() {
      const percent = (video.currentTime / video.duration) * 100;
      progressFill.style.width = `${percent}%`;
      timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
    }
    
    // Show/hide controls on hover
    videoContainer.onmouseenter = () => {
      if (isPlaying) {
        controls.style.display = "flex";
      }
    };
    
    videoContainer.onmouseleave = () => {
      if (isPlaying) {
        setTimeout(() => {
          controls.style.display = "none";
        }, 2000);
      }
    };
    
    // When video ends
    video.onended = () => {
      isPlaying = false;
      playPauseBtn.innerHTML = "▶️";
      overlay.style.opacity = "1";
      controls.style.display = "none";
    };
  });
}

/** ================================================
 * 🔧 HELPER: Format time (MM:SS)
 * ================================================ */
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}