// src/js/sermons.js - UPDATED VERSION
import { api } from "../../api.js";
import { el } from "../../utils.js";
import { fetchSermonComments, postSermonComment } from "../../commentsPublic.js";

/** 🎬 TIKTOK-STYLE SERMON FEED - FIXED VERSION */
export async function initSermonTikTokFeed(container) {
  if (!container) return;
  
  // Clear container and set base styles
  container.innerHTML = '';
  container.className = 'tiktok-feed';
  
  // Create feed structure
  const feedHTML = `
    <div class="sermon-videos" id="sermonVideosContainer"></div>
    
    <div class="loading-indicator" id="loadingIndicator" style="display: none;">
      <div class="spinner"></div>
      <p>Loading more sermons...</p>
    </div>
    
    <div class="search-overlay" id="searchOverlay">
      <div class="search-container">
        <button id="closeSearch" class="close-search-btn">✕</button>
        <h3>🔍 Deep Search Sermons</h3>
        <input type="text" id="sermonSearch" placeholder="Search by title, description, or keywords...">
        
        <div class="search-filters">
          <div class="filter-options">
            <label><input type="checkbox" id="filterTitle" checked> Title</label>
            <label><input type="checkbox" id="filterDescription" checked> Description</label>
            <label><input type="checkbox" id="filterAuthor"> Speaker/Author</label>
            <select id="sortBy">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="popular">Most Viewed</option>
              <option value="duration">Duration (Short to Long)</option>
            </select>
          </div>
        </div>
        
        <div id="searchResults" class="search-results"></div>
        <div id="searchStats" class="search-stats"></div>
      </div>
    </div>
    
    <button class="search-btn" id="openSearch">🔍 Search</button>
    
    <div class="feed-controls">
      <button class="refresh-btn" id="refreshFeed">🔄 Refresh</button>
      <button class="shuffle-btn" id="toggleShuffle">🔀 Shuffle: ON</button>
    </div>
    
    <div class="current-video-info" id="currentVideoInfo" style="display: none;">
      <strong>Now Playing:</strong>
      <span id="currentVideoTitle"></span>
    </div>
  `;
  
  container.innerHTML = feedHTML;
  
  const videosContainer = document.getElementById('sermonVideosContainer');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const currentVideoInfo = document.getElementById('currentVideoInfo');
  const currentVideoTitle = document.getElementById('currentVideoTitle');
  
  // State
  let currentPage = 1;
  let isLoading = false;
  let hasMore = true;
  let sermons = [];
  let currentIndex = 0;
  let shuffleMode = true;
  let currentVideoElement = null;
  let isScrolling = false;
  
  // Load initial sermons
  await loadSermons();
  
  // Setup scrolling
  setupSmoothScrolling();
  
  // Setup search
  setupSearch();
  
  // Setup controls
  setupControls();
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts();
  
  /** Load sermons */
  async function loadSermons() {
    if (isLoading || !hasMore) return;
    
    isLoading = true;
    loadingIndicator.style.display = 'block';
    
    try {
      const response = await api.get(`/sermons?page=${currentPage}&limit=5`);
      const newSermons = response.data || response;
      
      if (!Array.isArray(newSermons) || newSermons.length === 0) {
        hasMore = false;
        loadingIndicator.innerHTML = '<p>No more sermons</p>';
        return;
      }
      
      sermons = [...sermons, ...newSermons];
      
      // Create cards
      newSermons.forEach((sermon, index) => {
        createTikTokCard(sermon, index + (currentPage - 1) * 5);
      });
      
      currentPage++;
      
    } catch (err) {
      console.error('Error loading sermons:', err);
      showNotification('Failed to load sermons');
    } finally {
      isLoading = false;
      loadingIndicator.style.display = 'none';
    }
  }
  
  /** Create TikTok card with proper layout */
  function createTikTokCard(sermon, index) {
    const card = el('div', 'tiktok-video');
    card.dataset.id = sermon.id;
    card.dataset.index = index;
    
    // Video container
    const videoContainer = el('div', 'video-container');
    
    // Thumbnail
    const thumbnail = el('div', 'video-thumbnail');
    thumbnail.style.backgroundImage = `url('${sermon.thumbnail_url || sermon.original_url || 'default-thumb.jpg'}')`;
    
    // Play overlay
    const playOverlay = el('div', 'play-overlay');
    playOverlay.innerHTML = '▶';
    
    // Video element
    const video = el('video');
    video.playsInline = true;
    video.controls = false;
    video.preload = 'none';
    video.dataset.sermonId = sermon.id;
    
    // Content overlay
    const contentOverlay = el('div', 'content-overlay');
    
    // Title
    const title = el('h2', 'sermon-title');
    title.textContent = sermon.title || 'Untitled Sermon';
    
    // Description (initially hidden, shows on hover)
    const description = el('p', 'sermon-description');
    description.textContent = sermon.description || '';
    
    // Meta info
    const meta = el('div', 'sermon-meta');
    const duration = formatDuration(sermon.duration);
    meta.innerHTML = `
      <span>📅 ${new Date(sermon.created_at).toLocaleDateString()}</span>
      <span>⏱️ ${duration}</span>
    `;
    
    // Action buttons container
    const actionButtons = el('div', 'action-buttons');
    
    // YouTube button
    const youtubeBtn = el('a', 'youtube-btn');
    if (sermon.youtube_url) {
      youtubeBtn.href = sermon.youtube_url;
      youtubeBtn.target = '_blank';
      youtubeBtn.rel = 'noopener noreferrer';
      youtubeBtn.innerHTML = '📺 Watch Full on YouTube';
    } else {
      youtubeBtn.style.display = 'none';
    }
    
    // Details button
    const detailsBtn = el('a', 'details-btn');
    detailsBtn.href = `sermon-detail.html?id=${sermon.id}`;
    detailsBtn.innerHTML = '📖 Full Details';
    
    // Side actions (right side)
    const sideActions = el('div', 'side-actions');
    
    // Action buttons
    const actions = [
      { icon: '❤️', label: 'like', color: '#ff2d55' },
      { icon: '💬', label: 'comment', color: '#007aff' },
      { icon: '🔗', label: 'share', color: '#34c759' },
      { icon: '📥', label: 'save', color: '#5856d6' }
    ];
    
    actions.forEach(action => {
      const btn = el('button', `action-btn ${action.label}-btn`);
      btn.innerHTML = `
        <span class="icon">${action.icon}</span>
        <span class="count">0</span>
      `;
      
      btn.onclick = (e) => {
        e.stopPropagation();
        handleAction(action.label, sermon);
      };
      
      sideActions.appendChild(btn);
    });
    
    // Assemble
    actionButtons.appendChild(youtubeBtn);
    actionButtons.appendChild(detailsBtn);
    
    contentOverlay.appendChild(title);
    contentOverlay.appendChild(description);
    contentOverlay.appendChild(meta);
    contentOverlay.appendChild(actionButtons);
    
    videoContainer.appendChild(thumbnail);
    videoContainer.appendChild(playOverlay);
    videoContainer.appendChild(video);
    
    card.appendChild(videoContainer);
    card.appendChild(contentOverlay);
    card.appendChild(sideActions);
    
    videosContainer.appendChild(card);
    
    // Setup interactions
    setupVideoInteractions(card, sermon, video, thumbnail, playOverlay);
  }
  
  /** Setup video interactions */
  function setupVideoInteractions(card, sermon, video, thumbnail, playOverlay) {
    let videoLoaded = false;
    
    const playVideo = () => {
      // Pause current video
      if (currentVideoElement && currentVideoElement !== video) {
        currentVideoElement.pause();
        const currentCard = currentVideoElement.closest('.tiktok-video');
        if (currentCard) {
          currentCard.classList.remove('playing');
          const currentThumb = currentCard.querySelector('.video-thumbnail');
          const currentOverlay = currentCard.querySelector('.play-overlay');
          if (currentThumb) currentThumb.style.display = 'block';
          if (currentOverlay) currentOverlay.style.display = 'flex';
        }
      }
      
      // Update current video
      currentVideoElement = video;
      card.classList.add('playing');
      currentVideoInfo.style.display = 'block';
      currentVideoTitle.textContent = sermon.title;
      
      // Load video if needed
      if (!videoLoaded) {
        const videoSources = [
          sermon.his_url,
          sermon.mp4_url,
          sermon.video_url,
          sermon.original_url,
          sermon.webm_urt,
          sermon.mov_url
        ].filter(Boolean);
        
        if (videoSources.length > 0) {
          if (videoSources[0].includes('.m3u8') && window.Hls && Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(videoSources[0]);
            hls.attachMedia(video);
          } else {
            video.src = videoSources[0];
          }
        }
        videoLoaded = true;
      }
      
      // Show video
      thumbnail.style.display = 'none';
      video.style.display = 'block';
      playOverlay.style.display = 'none';
      video.play().catch(e => console.log('Autoplay prevented'));
      
      // Setup ended event
      video.onended = () => {
        if (shuffleMode) {
          playNextShuffle();
        } else {
          thumbnail.style.display = 'block';
          playOverlay.style.display = 'flex';
          video.style.display = 'none';
          card.classList.remove('playing');
        }
      };
    };
    
    // Click handlers
    thumbnail.onclick = playVideo;
    playOverlay.onclick = playVideo;
    
    // Video click to toggle
    video.onclick = () => {
      if (video.paused) {
        video.play();
        playOverlay.style.display = 'none';
      } else {
        video.pause();
        playOverlay.style.display = 'flex';
      }
    };
  }
  
  /** Setup smooth scrolling */
  function setupSmoothScrolling() {
    let startY = 0;
    let isDragging = false;
    
    // Mouse wheel
    videosContainer.addEventListener('wheel', (e) => {
      e.preventDefault();
      
      if (isScrolling) return;
      
      const delta = e.deltaY > 0 ? 1 : -1;
      scrollToNextVideo(delta);
    }, { passive: false });
    
    // Touch events
    videosContainer.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      isDragging = true;
    });
    
    videosContainer.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      isDragging = false;
      
      const endY = e.changedTouches[0].clientY;
      const delta = startY - endY;
      
      if (Math.abs(delta) > 50) {
        const direction = delta > 0 ? 1 : -1;
        scrollToNextVideo(direction);
      }
    });
  }
  
  /** Scroll to next/prev video */
  function scrollToNextVideo(direction) {
    if (isScrolling) return;
    
    isScrolling = true;
    const cards = Array.from(videosContainer.querySelectorAll('.tiktok-video'));
    if (cards.length === 0) return;
    
    let nextIndex = currentIndex + direction;
    
    if (shuffleMode && direction === 1) {
      // Shuffle mode: pick random next
      const unplayed = cards.filter((_, idx) => idx !== currentIndex);
      if (unplayed.length > 0) {
        const randomCard = unplayed[Math.floor(Math.random() * unplayed.length)];
        nextIndex = parseInt(randomCard.dataset.index);
      } else {
        nextIndex = (currentIndex + 1) % cards.length;
      }
    }
    
    // Ensure index is within bounds
    nextIndex = Math.max(0, Math.min(cards.length - 1, nextIndex));
    
    const nextCard = cards[nextIndex];
    if (nextCard) {
      nextCard.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      
      currentIndex = nextIndex;
      
      // Auto-play after scroll
      setTimeout(() => {
        const video = nextCard.querySelector('video');
        const playBtn = nextCard.querySelector('.play-overlay');
        if (video && playBtn && isElementInViewport(nextCard)) {
          if (!video.src) {
            playBtn.click();
          } else {
            video.play().catch(() => playBtn.click());
          }
        }
      }, 300);
      
      // Load more if near bottom
      if (nextIndex >= sermons.length - 2 && hasMore && !isLoading) {
        loadSermons();
      }
    }
    
    setTimeout(() => {
      isScrolling = false;
    }, 500);
  }
  
  /** Play next in shuffle */
  function playNextShuffle() {
    const cards = Array.from(videosContainer.querySelectorAll('.tiktok-video'));
    const unplayed = cards.filter(card => !card.classList.contains('playing'));
    
    if (unplayed.length > 0) {
      const randomCard = unplayed[Math.floor(Math.random() * unplayed.length)];
      const playBtn = randomCard.querySelector('.play-overlay');
      if (playBtn) playBtn.click();
    }
  }
  
  /** Check if element is in viewport */
  function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
  
  /** Setup search */
  function setupSearch() {
    const searchOverlay = document.getElementById('searchOverlay');
    const openSearchBtn = document.getElementById('openSearch');
    const closeSearchBtn = document.getElementById('closeSearch');
    
    openSearchBtn.onclick = () => {
      searchOverlay.style.display = 'flex';
      document.getElementById('sermonSearch').focus();
    };
    
    closeSearchBtn.onclick = () => {
      searchOverlay.style.display = 'none';
    };
  }
  
  /** Setup controls */
  function setupControls() {
    const refreshBtn = document.getElementById('refreshFeed');
    const shuffleBtn = document.getElementById('toggleShuffle');
    
    refreshBtn.onclick = async () => {
      currentPage = 1;
      sermons = [];
      videosContainer.innerHTML = '';
      hasMore = true;
      await loadSermons();
      showNotification('Feed refreshed');
    };
    
    shuffleBtn.onclick = () => {
      shuffleMode = !shuffleMode;
      shuffleBtn.textContent = shuffleMode ? '🔀 Shuffle: ON' : '🔀 Shuffle: OFF';
      showNotification(shuffleMode ? 'Shuffle enabled' : 'Shuffle disabled');
    };
  }
  
  /** Setup keyboard shortcuts */
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.key) {
        case ' ':
        case 'ArrowDown':
          e.preventDefault();
          scrollToNextVideo(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          scrollToNextVideo(-1);
          break;
      }
    });
  }
  
  /** Handle actions */
  async function handleAction(action, sermon) {
    switch(action) {
      case 'like':
        try {
          await api.post('/likes', { sermon_id: sermon.id });
          showNotification('Liked! ❤️');
        } catch (err) {
          console.error('Error liking:', err);
        }
        break;
      case 'share':
        shareSermon(sermon);
        break;
    }
  }
  
  /** Share sermon */
  function shareSermon(sermon) {
    const url = `${window.location.origin}/sermon-detail.html?id=${sermon.id}`;
    if (navigator.share) {
      navigator.share({
        title: sermon.title,
        text: sermon.description,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      showNotification('Link copied!');
    }
  }
  
  /** Show notification */
  function showNotification(message) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = el('div', 'notification');
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 2000);
  }
  
  /** Format duration */
  function formatDuration(seconds) {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}