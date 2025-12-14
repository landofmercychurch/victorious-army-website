// src/js/sermons.js
import { api } from "../../api.js";
import { el } from "../../utils.js";
import { fetchSermonComments, postSermonComment } from "../../commentsPublic.js";

/** 🧩 OpenGraph/Twitter meta */
export function setOpenGraphMeta({ title, description, image, url }) {
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
  setMeta("og:type", "video.other");
  setMeta("og:video:url", url);
  setMeta("og:video:secure_url", url);
  setMeta("og:video:type", "text/html");
  setMeta("og:video:width", "1280");
  setMeta("og:video:height", "720");
  
  setMeta("twitter:card", "player", true);
  setMeta("twitter:title", title, true);
  setMeta("twitter:description", description, true);
  setMeta("twitter:image", image, true);
  setMeta("twitter:player", url, true);
  setMeta("twitter:player:width", "1280", true);
  setMeta("twitter:player:height", "720", true);
}

/** 🧩 Structured Data for SEO */
export function setStructuredData(sermon) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": sermon.title,
    "description": sermon.description || "Watch this inspiring sermon",
    "thumbnailUrl": sermon.thumbnail_url || "default-thumbnail.jpg",
    "uploadDate": new Date(sermon.created_at).toISOString(),
    "contentUrl": sermon.video_url || sermon.urls?.mp4_url || "",
    "embedUrl": `${window.location.origin}/sermon-detail.html?id=${sermon.id}`,
    "publisher": {
      "@type": "Organization",
      "name": "Victorious Army Revival Movement",
      "logo": {
        "@type": "ImageObject",
        "url": `${window.location.origin}/logo.png`
      }
    }
  };
  
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);
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

      // Thumbnail with link to detail page
      const thumbnailLink = el("a", "sermon-thumbnail-link");
      thumbnailLink.href = `sermon-detail.html?id=${sermon.id}`;
      
      const thumbnailImg = el("img", "thumbnail-img");
      thumbnailImg.src = sermon.thumbnail_url || "default-thumb.jpg";
      thumbnailImg.alt = `${sermon.title} - Victorious Army Revival Movement`;
      thumbnailImg.loading = "lazy";
      thumbnailImg.width = 320;
      thumbnailImg.height = 180;
      
      // Play overlay
      const playOverlay = el("div", "play-overlay");
      playOverlay.innerHTML = "▶";
      
      thumbnailLink.appendChild(thumbnailImg);
      thumbnailLink.appendChild(playOverlay);
      card.appendChild(thumbnailLink);
      
      // Content
      const content = el("div", "thumbnail-content");
      
      // Title with proper heading hierarchy
      const titleLink = el("a", "title-link");
      titleLink.href = `sermon-detail.html?id=${sermon.id}`;
      titleLink.innerHTML = `<h3>${sermon.title || "Untitled Sermon"}</h3>`;
      content.appendChild(titleLink);
      
      // Meta data
      const meta = el("div", "thumbnail-meta");
      meta.innerHTML = `
        <span>📅 ${new Date(sermon.created_at).toLocaleDateString()}</span>
        ${sermon.speaker ? `<span>👤 ${sermon.speaker}</span>` : ''}
        <span>⏱️ ${formatDuration(sermon.duration_seconds)}</span>
      `;
      content.appendChild(meta);
      
      // Description snippet for SEO
      if (sermon.description) {
        const desc = el("p", "thumbnail-desc");
        desc.textContent = sermon.description.substring(0, 150) + "...";
        content.appendChild(desc);
      }
      
      // View count
      const viewCount = el("div", "view-count");
      viewCount.textContent = `👁️ ${formatViewCount(sermon.view_count || 0)} views`;
      content.appendChild(viewCount);
      
      // Watch button
      const watchBtn = el("a", "watch-btn");
      watchBtn.href = `sermon-detail.html?id=${sermon.id}`;
      watchBtn.textContent = "Watch Sermon";
      watchBtn.setAttribute("aria-label", `Watch ${sermon.title}`);
      content.appendChild(watchBtn);
      
      card.appendChild(content);
      container.appendChild(card);
    }
    
  } catch (err) {
    console.error("Failed to load sermons:", err);
    container.innerHTML = `<p>Failed to load sermons. Please try again later.</p>`;
  }
}

/** ================================================
 * 2️⃣ SERMON LISTING PAGE: YouTube-style
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

    sermons.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    container.innerHTML = "";

    for (const sermon of sermons) {
      const card = el("div", "sermon-listing-card");
      card.dataset.id = sermon.id;

      // Video container with thumbnail fallback
      const videoContainer = el("div", "video-container");
      
      // Video element (lazy loaded)
      const video = el("video");
      video.playsInline = true;
      video.controls = false;
      video.preload = "metadata";
      video.poster = sermon.thumbnail_url || "";
      video.setAttribute("aria-label", sermon.title);
      
      // Thumbnail overlay (shows if thumbnail exists)
      const thumbnailOverlay = el("div", "thumbnail-overlay");
      if (sermon.thumbnail_url) {
        thumbnailOverlay.style.backgroundImage = `url('${sermon.thumbnail_url}')`;
        thumbnailOverlay.style.backgroundSize = "cover";
        thumbnailOverlay.style.backgroundPosition = "center";
      }
      
      // Play button
      const playBtn = el("button", "play-button");
      playBtn.innerHTML = "▶";
      playBtn.setAttribute("aria-label", `Play ${sermon.title}`);
      
      thumbnailOverlay.appendChild(playBtn);
      videoContainer.appendChild(video);
      videoContainer.appendChild(thumbnailOverlay);
      card.appendChild(videoContainer);
      
      // Video info
      const videoInfo = el("div", "video-info");
      
      // Title with proper heading
      const titleLink = el("a", "video-title-link");
      titleLink.href = `sermon-detail.html?id=${sermon.id}`;
      titleLink.innerHTML = `<h3>${sermon.title || "Untitled Sermon"}</h3>`;
      videoInfo.appendChild(titleLink);
      
      // Meta information
      const metaInfo = el("div", "video-meta");
      metaInfo.innerHTML = `
        <span>📅 ${new Date(sermon.created_at).toLocaleDateString()}</span>
        ${sermon.speaker ? `<span>👤 ${sermon.speaker}</span>` : ''}
        <span>⏱️ ${formatDuration(sermon.duration_seconds)}</span>
        <span>👁️ ${formatViewCount(sermon.view_count || 0)}</span>
      `;
      videoInfo.appendChild(metaInfo);
      
      // Description for SEO
      if (sermon.description) {
        const desc = el("p", "video-description");
        desc.textContent = sermon.description;
        videoInfo.appendChild(desc);
      }
      
      // Action buttons
      const actions = el("div", "video-actions");
      actions.innerHTML = `
        <a href="sermon-detail.html?id=${sermon.id}" class="watch-full-btn">Watch Full Message</a>
        <button class="share-btn" data-sermon-id="${sermon.id}">🔗 Share</button>
      `;
      videoInfo.appendChild(actions);
      
      card.appendChild(videoInfo);
      container.appendChild(card);
      
      // Setup video lazy loading
      setupLazyVideo(video, sermon, thumbnailOverlay, playBtn);
      
      // Setup share button
      const shareBtn = actions.querySelector('.share-btn');
      shareBtn.onclick = () => shareSermon(sermon);
    }
    
  } catch (err) {
    console.error("Failed to load sermons:", err);
    container.innerHTML = `<p>Failed to load sermons. Please try again later.</p>`;
  }
}

/** ================================================
 * 3️⃣ SERMON DETAIL PAGE: Single Video Page
 * ================================================ */
export async function initSermonDetail(container, sermonId) {
  if (!container || !sermonId) return;
  container.innerHTML = "<p>Loading sermon…</p>";

  try {
    const sermon = await api.get(`/sermons/${sermonId}`);
    
    // Set SEO meta tags
    setOpenGraphMeta({
      title: sermon.title,
      description: sermon.description || "Watch this inspiring sermon from Victorious Army Revival Movement",
      image: sermon.thumbnail_url || "default-thumbnail.jpg",
      url: `${window.location.origin}/sermon-detail.html?id=${sermonId}`
    });
    
    // Set structured data
    setStructuredData(sermon);
    
    // Update page title
    document.title = `${sermon.title} - Victorious Army Revival Movement`;
    
    // Render sermon detail
    container.innerHTML = `
      <article class="sermon-detail">
        <header class="sermon-header">
          <h1>${sermon.title}</h1>
          <div class="sermon-meta">
            <span>📅 ${new Date(sermon.created_at).toLocaleDateString()}</span>
            ${sermon.speaker ? `<span>👤 ${sermon.speaker}</span>` : ''}
            <span>⏱️ ${formatDuration(sermon.duration_seconds)}</span>
            <span>👁️ ${formatViewCount(sermon.view_count || 0)} views</span>
          </div>
        </header>
        
        <div class="video-container">
          <div id="videoPlayer" class="video-player" role="region" aria-label="Video player">
            <!-- Video loads here -->
          </div>
          <div class="video-controls">
            <button id="playPauseBtn" aria-label="Play/Pause">⏯️</button>
            <button id="fullscreenBtn" aria-label="Fullscreen">🔲</button>
            <button id="shareBtn" class="share-btn" aria-label="Share this sermon">🔗 Share</button>
            ${sermon.youtube_url ? `<a href="${sermon.youtube_url}" target="_blank" rel="noopener noreferrer" class="youtube-link">📺 Watch on YouTube</a>` : ''}
          </div>
        </div>
        
        <section class="sermon-description" aria-labelledby="description-heading">
          <h2 id="description-heading">Description</h2>
          <p>${sermon.description || 'No description available.'}</p>
        </section>
        
        <section class="bible-verses" aria-labelledby="verses-heading">
          <h2 id="verses-heading">📖 Scripture References</h2>
          <div id="scriptureReferences"></div>
        </section>
        
        <section class="comments-section" aria-labelledby="comments-heading">
          <h2 id="comments-heading">💬 Comments & Testimonies</h2>
          <div id="commentsContainer"></div>
        </section>
        
        <section class="related-sermons" aria-labelledby="related-heading">
          <h2 id="related-heading">📺 More Sermons</h2>
          <div id="relatedSermons" class="related-grid"></div>
        </section>
      </article>
    `;

    // Setup video player
    setupDetailVideoPlayer(sermon);
    
    // Load comments
    loadComments(sermonId, container);
    
    // Load related sermons
    loadRelatedSermons(sermonId, container);
    
    // Setup share button
    document.getElementById('shareBtn').addEventListener('click', () => shareSermon(sermon));
    
    // Increment view count
    incrementViewCount(sermonId);
    
  } catch (err) {
    console.error("Failed to load sermon:", err);
    container.innerHTML = `
      <div class="error-message">
        <h2>Sermon Not Found</h2>
        <p>The sermon you're looking for is not available.</p>
        <a href="sermon.html" class="btn">Browse All Sermons</a>
      </div>
    `;
  }
}

/** ================================================
 * 🔧 VIDEO SETUP FUNCTIONS
 * ================================================ */
function setupLazyVideo(video, sermon, thumbnailOverlay, playBtn) {
  let videoLoaded = false;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !videoLoaded) {
        loadVideoSource(video, sermon);
        videoLoaded = true;
        observer.unobserve(video.parentElement);
      }
    });
  }, { threshold: 0.1 });
  
  observer.observe(video.parentElement);
  
  // Play button click
  playBtn.onclick = () => {
    if (!videoLoaded) {
      loadVideoSource(video, sermon);
      videoLoaded = true;
    }
    video.play();
    thumbnailOverlay.style.display = 'none';
  };
  
  // Video click to play/pause
  video.onclick = () => {
    if (video.paused) {
      video.play();
      thumbnailOverlay.style.display = 'none';
    } else {
      video.pause();
    }
  };
  
  // Show thumbnail when video ends
  video.onended = () => {
    thumbnailOverlay.style.display = 'flex';
  };
}

function setupDetailVideoPlayer(sermon) {
  const videoPlayer = document.getElementById('videoPlayer');
  const video = el('video');
  video.controls = true;
  video.playsInline = true;
  video.preload = "auto";
  video.style.width = '100%';
  video.setAttribute('title', sermon.title);
  
  videoPlayer.appendChild(video);
  
  // Load video source
  const urls = sermon.urls || {};
  if (urls.hls_url && window.Hls && Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(urls.hls_url);
    hls.attachMedia(video);
  } else if (urls.hls_url && video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = urls.hls_url;
  } else {
    video.src = urls.mp4_url || sermon.video_url || '';
  }
  
  // Custom controls
  const playPauseBtn = document.getElementById('playPauseBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  
  playPauseBtn.onclick = () => {
    if (video.paused) {
      video.play();
      playPauseBtn.innerHTML = '⏸️';
    } else {
      video.pause();
      playPauseBtn.innerHTML = '▶️';
    }
  };
  
  fullscreenBtn.onclick = () => {
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) {
      video.webkitRequestFullscreen();
    }
  };
  
  // Update play button state
  video.onplay = () => playPauseBtn.innerHTML = '⏸️';
  video.onpause = () => playPauseBtn.innerHTML = '▶️';
}

function loadVideoSource(video, sermon) {
  const urls = sermon.urls || {};
  if (urls.hls_url && window.Hls && Hls.isSupported()) {
    const hls = new Hls({ startLevel: -1 });
    hls.loadSource(urls.hls_url);
    hls.attachMedia(video);
  } else if (urls.hls_url && video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = urls.hls_url;
  } else {
    video.src = urls.mp4_url || sermon.video_url || '';
  }
}

/** ================================================
 * 🔧 HELPER FUNCTIONS
 * ================================================ */
async function loadComments(sermonId, container) {
  try {
    const comments = await fetchSermonComments(String(sermonId));
    const commentsContainer = container.querySelector('#commentsContainer');
    
    if (!Array.isArray(comments) || comments.length === 0) {
      commentsContainer.innerHTML = '<p>No comments yet. Be the first to share!</p>';
    } else {
      commentsContainer.innerHTML = comments.map(comment => `
        <div class="comment" itemscope itemtype="http://schema.org/Comment">
          <strong itemprop="author">${comment.name || 'Guest'}:</strong>
          <p itemprop="text">${comment.content}</p>
          <small><time itemprop="dateCreated" datetime="${new Date(comment.created_at).toISOString()}">
            ${new Date(comment.created_at).toLocaleString()}
          </time></small>
        </div>
      `).join('');
    }
    
    // Add comment form
    const form = el('form', 'comment-form');
    form.innerHTML = `
      <textarea placeholder="Share your testimony..." required></textarea>
      <input type="text" placeholder="Your name (optional)">
      <button type="submit">Post Comment</button>
    `;
    
    form.onsubmit = async (e) => {
      e.preventDefault();
      const content = form.querySelector('textarea').value.trim();
      const name = form.querySelector('input').value.trim() || 'Guest';
      
      if (!content) return;
      
      try {
        await postSermonComment({ sermon_id: sermonId, name, content });
        loadComments(sermonId, container);
        form.reset();
      } catch (error) {
        console.error('Error posting comment:', error);
      }
    };
    
    commentsContainer.appendChild(form);
    
  } catch (error) {
    console.error('Error loading comments:', error);
  }
}

async function loadRelatedSermons(currentSermonId, container) {
  try {
    const sermons = await api.get('/sermons');
    const related = sermons
      .filter(s => s.id !== currentSermonId)
      .slice(0, 4);
    
    const relatedContainer = container.querySelector('#relatedSermons');
    
    relatedContainer.innerHTML = related.map(sermon => `
      <article class="related-sermon" itemscope itemtype="http://schema.org/VideoObject">
        <a href="sermon-detail.html?id=${sermon.id}" itemprop="url">
          <img src="${sermon.thumbnail_url || 'default-thumb.jpg'}" 
               alt="${sermon.title}" 
               itemprop="thumbnailUrl"
               loading="lazy"
               width="300"
               height="169">
          <h4 itemprop="name">${sermon.title}</h4>
          <p itemprop="description">${sermon.description?.substring(0, 100) || ''}...</p>
          <meta itemprop="uploadDate" content="${new Date(sermon.created_at).toISOString()}">
        </a>
      </article>
    `).join('');
    
  } catch (error) {
    console.error('Error loading related sermons:', error);
  }
}

async function incrementViewCount(sermonId) {
  try {
    await api.post(`/sermons/${sermonId}/view`);
  } catch (error) {
    console.warn('Could not increment view count:', error);
  }
}

function shareSermon(sermon) {
  const shareUrl = `${window.location.origin}/sermon-detail.html?id=${sermon.id}`;
  const shareText = `Watch "${sermon.title}" from Victorious Army Revival Movement`;
  
  if (navigator.share) {
    navigator.share({
      title: sermon.title,
      text: sermon.description || shareText,
      url: shareUrl
    });
  } else {
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
  }
}

function formatDuration(seconds) {
  if (!seconds) return 'N/A';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatViewCount(count) {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count;
}

/** ================================================
 * 4️⃣ ORIGINAL TIKTOK STYLE (Preserved)
 * ================================================ */
export async function initSermons(container) {
  // YOUR ORIGINAL CODE HERE - KEEP UNCHANGED
  // This maintains backward compatibility
  // ... [Your original initSermons function]
}