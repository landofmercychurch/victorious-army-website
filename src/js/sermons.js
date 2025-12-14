// src/js/sermons.js
import { api } from "../../api.js";
import { el } from "../../utils.js";
import { fetchSermonComments, postSermonComment } from "../../commentsPublic.js";

/** 🧩 TikTok-Style Sermon Feed */
export async function initSermonTikTokFeed(container) {
  if (!container) return;
  
  // Set up TikTok-style container
  container.style.cssText = `
    position: relative;
    height: 100vh;
    overflow: hidden;
    background: #000;
  `;
  
  container.innerHTML = `
    <div class="tiktok-feed">
      <div class="sermon-videos" id="sermonVideosContainer"></div>
      <div class="loading-indicator" id="loadingIndicator">
        <div class="spinner"></div>
        <p>Loading more sermons...</p>
      </div>
      <div class="search-overlay" id="searchOverlay">
        <div class="search-container">
          <input type="text" id="sermonSearch" placeholder="Search sermons by title, speaker, or keyword..." />
          <button id="closeSearch">✕</button>
          <div id="searchResults" class="search-results"></div>
        </div>
      </div>
      <button class="search-btn" id="openSearch">🔍 Search</button>
      <div class="feed-controls">
        <button class="refresh-btn" id="refreshFeed">🔄 Refresh</button>
        <button class="filter-btn" id="openFilter">🎚️ Filter</button>
      </div>
    </div>
  `;
  
  const videosContainer = document.getElementById('sermonVideosContainer');
  const loadingIndicator = document.getElementById('loadingIndicator');
  
  let currentPage = 1;
  let isLoading = false;
  let hasMore = true;
  let sermons = [];
  let currentIndex = 0;
  
  // Load initial sermons
  await loadSermons(currentPage);
  
  // Set up vertical scroll/swipe
  setupVerticalScroll();
  
  // Set up search functionality
  setupSearch();
  
  /** Load sermons with pagination */
  async function loadSermons(page) {
    if (isLoading || !hasMore) return;
    
    isLoading = true;
    loadingIndicator.style.display = 'block';
    
    try {
      const response = await api.get(`/sermons?page=${page}&limit=10`);
      const newSermons = response.data || response;
      
      if (!Array.isArray(newSermons) || newSermons.length === 0) {
        hasMore = false;
        loadingIndicator.innerHTML = '<p>No more sermons to load</p>';
        return;
      }
      
      sermons = [...sermons, ...newSermons];
      
      // Create TikTok-style cards
      newSermons.forEach((sermon, index) => {
        createTikTokCard(sermon, videosContainer);
      });
      
      // Set up first video to auto-play
      if (page === 1 && sermons.length > 0) {
        setTimeout(() => {
          const firstVideo = videosContainer.querySelector('.tiktok-video');
          if (firstVideo) {
            firstVideo.scrollIntoView({ behavior: 'smooth' });
            setupVideoAutoplay(firstVideo);
          }
        }, 500);
      }
      
      currentPage++;
      
    } catch (err) {
      console.error('Error loading sermons:', err);
      loadingIndicator.innerHTML = '<p style="color:red;">Failed to load sermons</p>';
    } finally {
      isLoading = false;
      loadingIndicator.style.display = 'none';
    }
  }
  
  /** Create TikTok-style vertical video card */
  function createTikTokCard(sermon, container) {
    const card = el('div', 'tiktok-video');
    card.dataset.id = sermon.id;
    card.dataset.index = currentIndex++;
    
    card.style.cssText = `
      position: relative;
      width: 100%;
      height: 100vh;
      min-height: 720px;
      background: #000;
      scroll-snap-align: start;
      overflow: hidden;
    `;
    
    // Video container
    const videoContainer = el('div', 'video-container');
    videoContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    // Vertical thumbnail (720px height)
    const thumbnail = el('div', 'video-thumbnail');
    thumbnail.style.cssText = `
      width: 100%;
      height: 720px;
      max-height: 80vh;
      background-image: url('${sermon.thumbnail_url || 'default-vertical-thumb.jpg'}');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      position: relative;
      cursor: pointer;
    `;
    
    // Play overlay
    const playOverlay = el('div', 'play-overlay');
    playOverlay.innerHTML = '▶';
    playOverlay.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.7);
      color: white;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 30px;
      cursor: pointer;
      z-index: 2;
    `;
    
    // Video element (hidden initially, lazy loads)
    const video = el('video');
    video.playsInline = true;
    video.controls = false;
    video.preload = 'none';
    video.style.cssText = `
      width: 100%;
      height: 720px;
      max-height: 80vh;
      object-fit: cover;
      display: none;
    `;
    
    // Content overlay (right side - TikTok style)
    const contentOverlay = el('div', 'content-overlay');
    contentOverlay.style.cssText = `
      position: absolute;
      bottom: 100px;
      left: 20px;
      right: 20px;
      color: white;
      z-index: 3;
    `;
    
    // Title
    const title = el('h2', 'sermon-title');
    title.textContent = sermon.title || 'Untitled Sermon';
    title.style.cssText = `
      font-size: 22px;
      margin: 0 0 10px 0;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
    `;
    
    // Description (caption)
    const description = el('p', 'sermon-description');
    description.textContent = sermon.description || '';
    description.style.cssText = `
      font-size: 16px;
      margin: 0 0 15px 0;
      line-height: 1.4;
      max-height: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      text-shadow: 1px 1px 3px rgba(0,0,0,0.7);
    `;
    
    // Speaker and date
    const meta = el('div', 'sermon-meta');
    meta.style.cssText = `
      display: flex;
      gap: 15px;
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 15px;
    `;
    meta.innerHTML = `
      <span>👤 ${sermon.speaker || 'Unknown Speaker'}</span>
      <span>📅 ${new Date(sermon.created_at).toLocaleDateString()}</span>
    `;
    
    // Watch Full on YouTube button
    const youtubeBtn = el('a', 'youtube-btn');
    youtubeBtn.href = sermon.youtube_url || '#';
    youtubeBtn.target = '_blank';
    youtubeBtn.rel = 'noopener noreferrer';
    youtubeBtn.innerHTML = '📺 Watch Full Sermon on YouTube';
    youtubeBtn.style.cssText = `
      display: inline-block;
      background: #FF0000;
      color: white;
      padding: 10px 20px;
      border-radius: 25px;
      text-decoration: none;
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 20px;
    `;
    
    if (!sermon.youtube_url) {
      youtubeBtn.style.display = 'none';
    }
    
    // View Details button
    const detailsBtn = el('a', 'details-btn');
    detailsBtn.href = `sermon-detail.html?id=${sermon.id}`;
    detailsBtn.innerHTML = '📖 View Full Details';
    detailsBtn.style.cssText = `
      display: inline-block;
      background: #4CAF50;
      color: white;
      padding: 10px 20px;
      border-radius: 25px;
      text-decoration: none;
      font-weight: bold;
      font-size: 14px;
      margin-left: 10px;
    `;
    
    contentOverlay.appendChild(title);
    contentOverlay.appendChild(description);
    contentOverlay.appendChild(meta);
    contentOverlay.appendChild(youtubeBtn);
    contentOverlay.appendChild(detailsBtn);
    
    // Right side actions (TikTok style)
    const sideActions = el('div', 'side-actions');
    sideActions.style.cssText = `
      position: absolute;
      right: 20px;
      bottom: 150px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      z-index: 3;
    `;
    
    // Like button
    const likeBtn = el('button', 'action-btn like-btn');
    likeBtn.innerHTML = `
      <span class="icon">❤️</span>
      <span class="count">${sermon.like_count || 0}</span>
    `;
    likeBtn.style.cssText = `
      background: transparent;
      border: none;
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      cursor: pointer;
      font-size: 14px;
    `;
    
    // Comment button
    const commentBtn = el('button', 'action-btn comment-btn');
    commentBtn.innerHTML = `
      <span class="icon">💬</span>
      <span class="count">${sermon.comment_count || 0}</span>
    `;
    commentBtn.style.cssText = likeBtn.style.cssText;
    
    // Share button
    const shareBtn = el('button', 'action-btn share-btn');
    shareBtn.innerHTML = `
      <span class="icon">🔗</span>
      <span class="count">Share</span>
    `;
    shareBtn.style.cssText = likeBtn.style.cssText;
    
    // Save button
    const saveBtn = el('button', 'action-btn save-btn');
    saveBtn.innerHTML = `
      <span class="icon">📥</span>
      <span class="count">Save</span>
    `;
    saveBtn.style.cssText = likeBtn.style.cssText;
    
    sideActions.appendChild(likeBtn);
    sideActions.appendChild(commentBtn);
    sideActions.appendChild(shareBtn);
    sideActions.appendChild(saveBtn);
    
    // Assemble the card
    videoContainer.appendChild(thumbnail);
    videoContainer.appendChild(playOverlay);
    videoContainer.appendChild(video);
    
    card.appendChild(videoContainer);
    card.appendChild(contentOverlay);
    card.appendChild(sideActions);
    
    container.appendChild(card);
    
    // Set up interactions
    setupCardInteractions(card, sermon, video, thumbnail, playOverlay);
    
    // Set up action buttons
    setupActionButtons(likeBtn, commentBtn, shareBtn, saveBtn, sermon);
  }
  
  /** Set up card interactions */
  function setupCardInteractions(card, sermon, video, thumbnail, playOverlay) {
    let videoLoaded = false;
    
    // Click thumbnail to load and play video
    const playVideo = () => {
      if (!videoLoaded) {
        // Lazy load video source
        const urls = sermon.urls || {};
        if (urls.hls_url && window.Hls && Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(urls.hls_url);
          hls.attachMedia(video);
        } else if (urls.mp4_url) {
          video.src = urls.mp4_url;
        } else if (sermon.video_url) {
          video.src = sermon.video_url;
        }
        videoLoaded = true;
      }
      
      thumbnail.style.display = 'none';
      video.style.display = 'block';
      video.play();
      playOverlay.style.display = 'none';
    };
    
    thumbnail.onclick = playVideo;
    playOverlay.onclick = playVideo;
    
    // Pause when video ends or user clicks
    video.onclick = () => {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
        playOverlay.style.display = 'flex';
      }
    };
    
    video.onended = () => {
      thumbnail.style.display = 'block';
      video.style.display = 'none';
      playOverlay.style.display = 'flex';
    };
  }
  
  /** Set up action buttons */
  function setupActionButtons(likeBtn, commentBtn, shareBtn, saveBtn, sermon) {
    // Like button
    likeBtn.onclick = async () => {
      try {
        await api.post('/likes', { sermon_id: sermon.id });
        const countEl = likeBtn.querySelector('.count');
        const currentCount = parseInt(countEl.textContent) || 0;
        countEl.textContent = currentCount + 1;
        likeBtn.querySelector('.icon').style.color = '#ff2d55';
      } catch (err) {
        console.error('Error liking sermon:', err);
      }
    };
    
    // Comment button
    commentBtn.onclick = () => {
      showCommentModal(sermon);
    };
    
    // Share button
    shareBtn.onclick = () => {
      shareSermon(sermon);
    };
    
    // Save button
    saveBtn.onclick = () => {
      // Implement save functionality
      alert('Sermon saved to your favorites!');
    };
  }
  
  /** Set up vertical scrolling */
  function setupVerticalScroll() {
    let isScrolling = false;
    let startY = 0;
    let currentScroll = 0;
    
    // Mouse wheel scrolling
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      
      if (isScrolling) return;
      
      const videoHeight = window.innerHeight;
      const delta = e.deltaY > 0 ? 1 : -1;
      
      scrollToVideo(delta);
    });
    
    // Touch swipe for mobile
    container.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    });
    
    container.addEventListener('touchend', (e) => {
      const endY = e.changedTouches[0].clientY;
      const delta = startY - endY;
      
      if (Math.abs(delta) > 50) {
        const direction = delta > 0 ? 1 : -1;
        scrollToVideo(direction);
      }
    });
    
    // Arrow keys and spacebar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        scrollToVideo(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToVideo(-1);
      }
    });
    
    function scrollToVideo(direction) {
      if (isScrolling) return;
      
      isScrolling = true;
      const videos = Array.from(videosContainer.querySelectorAll('.tiktok-video'));
      const currentVideo = document.elementFromPoint(
        window.innerWidth / 2,
        window.innerHeight / 2
      ).closest('.tiktok-video');
      
      let nextIndex = 0;
      
      if (currentVideo) {
        const currentIndex = parseInt(currentVideo.dataset.index);
        nextIndex = Math.max(0, Math.min(videos.length - 1, currentIndex + direction));
      }
      
      const nextVideo = videos[nextIndex];
      
      if (nextVideo) {
        nextVideo.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Auto-play video when it's in view
        setTimeout(() => {
          const video = nextVideo.querySelector('video');
          const thumbnail = nextVideo.querySelector('.video-thumbnail');
          if (video && thumbnail && isElementInViewport(nextVideo)) {
            if (!video.src) {
              thumbnail.click();
            } else {
              video.play();
            }
          }
        }, 300);
        
        // Load more sermons when near bottom
        if (nextIndex >= sermons.length - 3 && hasMore && !isLoading) {
          loadSermons(currentPage);
        }
      }
      
      setTimeout(() => {
        isScrolling = false;
      }, 500);
    }
  }
  
  /** Set up search functionality */
  function setupSearch() {
    const searchOverlay = document.getElementById('searchOverlay');
    const openSearchBtn = document.getElementById('openSearch');
    const closeSearchBtn = document.getElementById('closeSearch');
    const searchInput = document.getElementById('sermonSearch');
    const searchResults = document.getElementById('searchResults');
    
    openSearchBtn.onclick = () => {
      searchOverlay.style.display = 'flex';
      searchInput.focus();
    };
    
    closeSearchBtn.onclick = () => {
      searchOverlay.style.display = 'none';
      searchInput.value = '';
      searchResults.innerHTML = '';
    };
    
    // Search as you type
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        performSearch(searchInput.value);
      }, 300);
    });
    
    async function performSearch(query) {
      if (!query.trim()) {
        searchResults.innerHTML = '';
        return;
      }
      
      try {
        const results = await api.get(`/sermons/search?q=${encodeURIComponent(query)}`);
        displaySearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
        searchResults.innerHTML = '<p class="error">Search failed</p>';
      }
    }
    
    function displaySearchResults(results) {
      if (!Array.isArray(results) || results.length === 0) {
        searchResults.innerHTML = '<p class="no-results">No sermons found</p>';
        return;
      }
      
      searchResults.innerHTML = results.map(sermon => `
        <div class="search-result" data-id="${sermon.id}">
          <img src="${sermon.thumbnail_url || 'default-thumb.jpg'}" alt="${sermon.title}">
          <div class="result-info">
            <h4>${sermon.title}</h4>
            <p>${sermon.speaker || 'Unknown Speaker'} • ${new Date(sermon.created_at).toLocaleDateString()}</p>
            ${sermon.description ? `<p class="desc">${sermon.description.substring(0, 80)}...</p>` : ''}
          </div>
        </div>
      `).join('');
      
      // Add click handlers to search results
      searchResults.querySelectorAll('.search-result').forEach(result => {
        result.onclick = () => {
          const sermonId = result.dataset.id;
          const targetCard = videosContainer.querySelector(`.tiktok-video[data-id="${sermonId}"]`);
          
          if (targetCard) {
            searchOverlay.style.display = 'none';
            searchInput.value = '';
            searchResults.innerHTML = '';
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        };
      });
    }
  }
  
  /** Helper: Check if element is in viewport */
  function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
  
  /** Set up video autoplay */
  function setupVideoAutoplay(videoElement) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const video = entry.target.querySelector('video');
          if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
            if (video && video.src) {
              video.play();
            }
          } else {
            if (video) {
              video.pause();
            }
          }
        });
      },
      { threshold: 0.7 }
    );
    
    observer.observe(videoElement);
  }
  
  /** Show comment modal */
  function showCommentModal(sermon) {
    const modal = el('div', 'comment-modal');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.9);
      z-index: 1000;
      display: flex;
      flex-direction: column;
    `;
    
    modal.innerHTML = `
      <div class="modal-header">
        <h3>Comments for: ${sermon.title}</h3>
        <button class="close-modal">✕</button>
      </div>
      <div class="comments-list" id="commentsList-${sermon.id}"></div>
      <form class="comment-form">
        <input type="text" placeholder="Your name (optional)" class="comment-name">
        <textarea placeholder="Write your comment..." class="comment-text" required></textarea>
        <button type="submit">Post Comment</button>
      </form>
    `;
    
    document.body.appendChild(modal);
    
    // Load comments
    loadCommentsForModal(sermon.id);
    
    // Close modal
    modal.querySelector('.close-modal').onclick = () => {
      document.body.removeChild(modal);
    };
    
    // Submit comment
    modal.querySelector('.comment-form').onsubmit = async (e) => {
      e.preventDefault();
      const name = modal.querySelector('.comment-name').value.trim() || 'Guest';
      const text = modal.querySelector('.comment-text').value.trim();
      
      if (!text) return;
      
      try {
        await postSermonComment({ sermon_id: sermon.id, name, content: text });
        loadCommentsForModal(sermon.id);
        modal.querySelector('.comment-text').value = '';
      } catch (err) {
        console.error('Error posting comment:', err);
      }
    };
  }
  
  async function loadCommentsForModal(sermonId) {
    try {
      const comments = await fetchSermonComments(String(sermonId));
      const container = document.getElementById(`commentsList-${sermonId}`);
      
      if (!Array.isArray(comments) || comments.length === 0) {
        container.innerHTML = '<p class="no-comments">No comments yet. Be the first!</p>';
        return;
      }
      
      container.innerHTML = comments.map(comment => `
        <div class="comment">
          <strong>${comment.name || 'Guest'}:</strong>
          <p>${comment.content}</p>
          <small>${new Date(comment.created_at).toLocaleString()}</small>
        </div>
      `).join('');
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  }
  
  /** Share sermon */
  function shareSermon(sermon) {
    const shareUrl = `${window.location.origin}/sermon-detail.html?id=${sermon.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: sermon.title,
        text: sermon.description || 'Watch this inspiring sermon',
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  }
}

/** ================================================
 * 🎥 ORIGINAL FUNCTION (Preserved for backward compatibility)
 * ================================================ */
export async function initSermons(container) {
  // Keep your original TikTok-style function here unchanged
  // ... [Your original initSermons code]
}

/** ================================================
 * 📱 MAIN PAGE: Thumbnails Only (Simplified)
 * ================================================ */
export async function initSermonThumbnails(container) {
  // Simple thumbnail grid for other pages
  if (!container) return;
  
  try {
    const sermons = await api.get("/sermons?limit=6");
    if (!Array.isArray(sermons) || sermons.length === 0) {
      container.innerHTML = "<p>No sermons available.</p>";
      return;
    }
    
    container.innerHTML = `
      <div class="thumbnail-grid">
        ${sermons.map(sermon => `
          <a href="sermon-detail.html?id=${sermon.id}" class="sermon-thumbnail">
            <img src="${sermon.thumbnail_url || 'default-thumb.jpg'}" 
                 alt="${sermon.title}"
                 loading="lazy"
                 style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px;">
            <div class="thumbnail-info">
              <h4>${sermon.title}</h4>
              <p>${sermon.speaker || 'Unknown Speaker'}</p>
            </div>
          </a>
        `).join('')}
      </div>
      <div style="text-align: center; margin-top: 20px;">
        <a href="index.html#sermons" class="btn">🎬 View TikTok Sermon Feed</a>
      </div>
    `;
    
  } catch (err) {
    console.error("Failed to load sermons:", err);
    container.innerHTML = "<p>Failed to load sermons</p>";
  }
}