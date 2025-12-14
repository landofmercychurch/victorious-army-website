// src/js/sermons.js - TIKTOK-STYLE SERMON FEED (REORGANIZED VERSION)
import { api } from "../../api.js";
import { el } from "../../utils.js";
import { fetchSermonComments, postSermonComment } from "../../commentsPublic.js";

// ============================================================================
// 🎬 MAIN FEED INITIALIZATION FUNCTION
// ============================================================================

/**
 * Initializes TikTok-style sermon feed
 * @param {HTMLElement} container - The DOM container for the feed
 */
export async function initSermonTikTokFeed(container) {
  if (!container) return;
  
  // Clear container and set base structure
  container.innerHTML = '';
  container.className = 'tiktok-feed';
  
  // Create feed HTML structure
  const feedHTML = `
    <!-- Main videos container -->
    <div class="sermon-videos" id="sermonVideosContainer"></div>
    
    <!-- Loading indicator -->
    <div class="loading-indicator" id="loadingIndicator" style="display: none;">
      <div class="spinner"></div>
      <p>Loading more sermons...</p>
    </div>
    
    <!-- Search overlay (hidden by default) -->
    <div class="search-overlay" id="searchOverlay">
      <div class="search-container">
        <button id="closeSearch" class="close-search-btn">✕</button>
        <h3>🔍 Deep Search Sermons</h3>
        <div class="search-input-container">
          <input type="text" id="sermonSearch" 
                 placeholder="Search by title, description, author, or keywords...">
          <button id="clearSearch" class="clear-search-btn">✕</button>
        </div>
        
        <!-- Search filters -->
        <div class="search-filters">
          <div class="filter-options">
            <label><input type="checkbox" id="filterTitle" checked> Title</label>
            <label><input type="checkbox" id="filterDescription" checked> Description</label>
            <label><input type="checkbox" id="filterAuthor" checked> Speaker/Author</label>
            <select id="sortBy">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="popular">Most Viewed</option>
              <option value="duration">Duration (Short to Long)</option>
            </select>
          </div>
        </div>
        
        <!-- Search results area -->
        <div id="searchResults" class="search-results"></div>
        <div id="searchStats" class="search-stats"></div>
      </div>
    </div>
    
    <!-- Search button (visible) -->
    <button class="search-btn" id="openSearch">🔍 Search</button>
    
    <!-- Feed controls -->
    <div class="feed-controls">
      <button class="refresh-btn" id="refreshFeed">🔄 Refresh</button>
      <button class="shuffle-btn" id="toggleShuffle">🔀 Shuffle: ON</button>
    </div>
    
    <!-- TikTok-style swipe guide (will be added via JS) -->
    <div class="tiktok-swipe-guide" id="swipeGuide" style="display: none;">
      <span>⬆️⬇️</span> Swipe to scroll
    </div>
  `;
  
  container.innerHTML = feedHTML;
  
  // ==========================================================================
  // 📦 VARIABLE DECLARATIONS
  // ==========================================================================
  
  // DOM elements
  const videosContainer = document.getElementById('sermonVideosContainer');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const swipeGuide = document.getElementById('swipeGuide');
  
  // App state
  let currentPage = 1;
  let isLoading = false;
  let hasMore = true;
  let sermons = [];
  let currentIndex = 0;
  let shuffleMode = true;
  let currentVideoElement = null;
  let isScrolling = false;
  let searchTimeout = null;
  
  // ==========================================================================
  // 🚀 INITIALIZATION
  // ==========================================================================
  
  // Load initial sermons
  await loadSermons();
  
  // Setup all functionality
  setupSmoothScrolling();
  setupSearch();
  setupControls();
  setupKeyboardShortcuts();
  showSwipeGuide();
  
  // ==========================================================================
  // 📥 DATA LOADING FUNCTIONS
  // ==========================================================================
  
  /**
   * Loads sermons from API with pagination
   */
  async function loadSermons() {
    if (isLoading || !hasMore) return;
    
    isLoading = true;
    loadingIndicator.style.display = 'block';
    
    try {
      const response = await api.get(`/sermons?page=${currentPage}&limit=5`);
      const newSermons = response.data || response;
      
      // Check if we have more sermons
      if (!Array.isArray(newSermons) || newSermons.length === 0) {
        hasMore = false;
        loadingIndicator.innerHTML = '<p>No more sermons</p>';
        return;
      }
      
      // Add to existing sermons
      sermons = [...sermons, ...newSermons];
      
      // Create video cards
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
  
  // ==========================================================================
  // 🎨 UI CREATION FUNCTIONS
  // ==========================================================================
  
  /**
   * Creates a TikTok-style video card
   * @param {Object} sermon - Sermon data object
   * @param {number} index - Position in the feed
   */
  function createTikTokCard(sermon, index) {
    const card = el('div', 'tiktok-video');
    card.dataset.id = sermon.id;
    card.dataset.index = index;
    
    // ========================================================================
    // 1. VIDEO CONTAINER
    // ========================================================================
    const videoContainer = el('div', 'video-container');
    
    // Thumbnail
    const thumbnail = el('div', 'video-thumbnail');
    thumbnail.style.backgroundImage = `url('${sermon.thumbnail_url || sermon.original_url || 'default-thumb.jpg'}')`;
    
    // Play overlay button
    const playOverlay = el('div', 'play-overlay');
    playOverlay.innerHTML = '▶';
    playOverlay.setAttribute('aria-label', `Play ${sermon.title}`);
    
    // Video element (hidden initially)
    const video = el('video');
    video.playsInline = true;
    video.controls = false;
    video.preload = 'none';
    video.dataset.sermonId = sermon.id;
    video.setAttribute('aria-label', `Video: ${sermon.title}`);
    
    // ========================================================================
    // 2. CONTENT OVERLAY (Bottom section)
    // ========================================================================
    const contentOverlay = el('div', 'content-overlay');
    
    // Title
    const title = el('h2', 'sermon-title');
    title.textContent = sermon.title || 'Untitled Sermon';
    
    // Description (truncated)
    const description = el('p', 'sermon-description');
    description.textContent = truncateText(sermon.description || '', 100);
    
    // Meta information
    const meta = el('div', 'sermon-meta');
    const duration = formatDuration(sermon.duration);
    meta.innerHTML = `
      <span class="meta-item">📅 ${new Date(sermon.created_at).toLocaleDateString()}</span>
      <span class="meta-item">⏱️ ${duration}</span>
      ${sermon.author ? `<span class="meta-item">👤 ${sermon.author}</span>` : ''}
    `;
    
    // ========================================================================
    // 3. ACTION BUTTONS (Split left & right)
    // ========================================================================
    const actionButtons = el('div', 'action-buttons');
    
    // YouTube button (LEFT)
    const youtubeBtn = el('a', 'youtube-btn');
    if (sermon.youtube_url) {
      youtubeBtn.href = sermon.youtube_url;
      youtubeBtn.target = '_blank';
      youtubeBtn.rel = 'noopener noreferrer';
      youtubeBtn.innerHTML = '📺 YouTube';
      youtubeBtn.setAttribute('aria-label', 'Watch full sermon on YouTube');
    } else {
      youtubeBtn.style.display = 'none';
    }
    
    // Details button (RIGHT)
    const detailsBtn = el('a', 'details-btn');
    detailsBtn.href = `sermon-detail.html?id=${sermon.id}`;
    detailsBtn.innerHTML = '📖 Details';
    detailsBtn.setAttribute('aria-label', 'View sermon details');
    
    // ========================================================================
    // 4. SIDE ACTION BUTTONS (Right side vertical)
    // ========================================================================
    const sideActions = el('div', 'side-actions');
    
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
      btn.setAttribute('aria-label', action.label);
      
      btn.onclick = (e) => {
        e.stopPropagation();
        handleAction(action.label, sermon);
      };
      
      sideActions.appendChild(btn);
    });
    
    // ========================================================================
    // 5. ASSEMBLE ALL COMPONENTS
    // ========================================================================
    
    // Assemble action buttons (YouTube + Details)
    actionButtons.appendChild(youtubeBtn);
    actionButtons.appendChild(detailsBtn);
    
    // Assemble content overlay
    contentOverlay.appendChild(title);
    contentOverlay.appendChild(description);
    contentOverlay.appendChild(meta);
    contentOverlay.appendChild(actionButtons);
    
    // Assemble video container
    videoContainer.appendChild(thumbnail);
    videoContainer.appendChild(playOverlay);
    videoContainer.appendChild(video);
    
    // Assemble final card
    card.appendChild(videoContainer);
    card.appendChild(contentOverlay);
    card.appendChild(sideActions);
    
    // Add to videos container
    videosContainer.appendChild(card);
    
    // ========================================================================
    // 6. SETUP VIDEO INTERACTIONS
    // ========================================================================
    setupVideoInteractions(card, sermon, video, thumbnail, playOverlay);
  }
  
  /**
   * Sets up video play/pause interactions
   */
  function setupVideoInteractions(card, sermon, video, thumbnail, playOverlay) {
    let videoLoaded = false;
    
    const playVideo = () => {
      // 1. Pause currently playing video
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
      
      // 2. Set as current video
      currentVideoElement = video;
      card.classList.add('playing');
      
      // 3. Load video source if not already loaded
      if (!videoLoaded) {
        const videoSources = [
          sermon.hls_url,
          sermon.mp4_url,
          sermon.video_url,
          sermon.original_url,
          sermon.webm_url,
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
      
      // 4. Show video, hide thumbnail
      thumbnail.style.display = 'none';
      video.style.display = 'block';
      playOverlay.style.display = 'none';
      
      // 5. Attempt to play
      video.play().catch(e => console.log('Autoplay prevented:', e));
      
      // 6. Setup video end handler
      video.onended = () => {
        if (shuffleMode) {
          playNextShuffle();
        } else {
          // Return to thumbnail state
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
    
    // Video click toggles play/pause
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
  
  // ==========================================================================
  // 🎯 SCROLLING & NAVIGATION
  // ==========================================================================
  
  /**
   * Sets up smooth scrolling for TikTok-style navigation
   */
  function setupSmoothScrolling() {
    let startY = 0;
    let isDragging = false;
    
    // Mouse wheel navigation
    videosContainer.addEventListener('wheel', (e) => {
      e.preventDefault();
      
      if (isScrolling) return;
      
      const delta = e.deltaY > 0 ? 1 : -1;
      scrollToNextVideo(delta);
    }, { passive: false });
    
    // Touch navigation for mobile
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
  
  /**
   * Scrolls to next/previous video
   * @param {number} direction - 1 for next, -1 for previous
   */
  function scrollToNextVideo(direction) {
    if (isScrolling) return;
    
    isScrolling = true;
    const cards = Array.from(videosContainer.querySelectorAll('.tiktok-video'));
    if (cards.length === 0) return;
    
    let nextIndex = currentIndex + direction;
    
    // Shuffle mode logic
    if (shuffleMode && direction === 1) {
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
      // Smooth scroll to next card
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
      
      // Load more sermons if near bottom
      if (nextIndex >= sermons.length - 2 && hasMore && !isLoading) {
        loadSermons();
      }
    }
    
    // Reset scrolling flag
    setTimeout(() => {
      isScrolling = false;
    }, 500);
  }
  
  /**
   * Plays next random video (shuffle mode)
   */
  function playNextShuffle() {
    const cards = Array.from(videosContainer.querySelectorAll('.tiktok-video'));
    const unplayed = cards.filter(card => !card.classList.contains('playing'));
    
    if (unplayed.length > 0) {
      const randomCard = unplayed[Math.floor(Math.random() * unplayed.length)];
      const playBtn = randomCard.querySelector('.play-overlay');
      if (playBtn) playBtn.click();
    }
  }
  
  /**
   * Shows TikTok-style swipe guide
   */
  function showSwipeGuide() {
    if (!swipeGuide) return;
    
    swipeGuide.style.display = 'flex';
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
      swipeGuide.style.opacity = '0';
      swipeGuide.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        swipeGuide.style.display = 'none';
      }, 500);
    }, 8000);
    
    // Hide on user interaction
    const hideGuide = () => {
      swipeGuide.style.opacity = '0';
      setTimeout(() => {
        swipeGuide.style.display = 'none';
      }, 500);
      
      document.removeEventListener('scroll', hideGuide);
      document.removeEventListener('keydown', hideGuide);
      document.removeEventListener('click', hideGuide);
      document.removeEventListener('touchstart', hideGuide);
    };
    
    document.addEventListener('scroll', hideGuide, { once: true });
    document.addEventListener('keydown', hideGuide, { once: true });
    document.addEventListener('click', hideGuide, { once: true });
    document.addEventListener('touchstart', hideGuide, { once: true });
  }
  
  // ==========================================================================
  // 🔍 SEARCH FUNCTIONALITY
  // ==========================================================================
  
  /**
   * Sets up search functionality
   */
  function setupSearch() {
    const searchOverlay = document.getElementById('searchOverlay');
    const openSearchBtn = document.getElementById('openSearch');
    const closeSearchBtn = document.getElementById('closeSearch');
    const searchInput = document.getElementById('sermonSearch');
    const clearSearchBtn = document.getElementById('clearSearch');
    
    // Open search overlay
    openSearchBtn.onclick = () => {
      searchOverlay.style.display = 'flex';
      searchInput.focus();
    };
    
    // Close search overlay
    closeSearchBtn.onclick = () => {
      searchOverlay.style.display = 'none';
      searchInput.value = '';
      document.getElementById('searchResults').innerHTML = '';
    };
    
    // Clear search input
    clearSearchBtn.onclick = () => {
      searchInput.value = '';
      searchInput.focus();
      document.getElementById('searchResults').innerHTML = '';
    };
    
    // Real-time search with debouncing
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();
      
      if (query.length < 2) {
        document.getElementById('searchResults').innerHTML = '';
        document.getElementById('searchStats').textContent = 'Type at least 2 characters...';
        return;
      }
      
      searchTimeout = setTimeout(() => {
        performSearch(query);
      }, 500);
    });
  }
  
  /**
   * Performs search and displays results
   * @param {string} query - Search query
   */
  async function performSearch(query) {
    if (!query || query.length < 2) return;
    
    try {
      const response = await api.get(`/sermons?search=${encodeURIComponent(query)}`);
      const results = response.data || response;
      displaySearchResults(results, query);
    } catch (err) {
      console.error('Search error:', err);
      showNotification('Search failed');
    }
  }
  
  /**
   * Displays search results
   * @param {Array} results - Search results array
   * @param {string} query - Original search query
   */
  function displaySearchResults(results, query) {
    const resultsContainer = document.getElementById('searchResults');
    const statsContainer = document.getElementById('searchStats');
    
    if (!Array.isArray(results) || results.length === 0) {
      resultsContainer.innerHTML = '<p class="no-results">No sermons found matching your search.</p>';
      statsContainer.textContent = '0 results';
      return;
    }
    
    statsContainer.textContent = `${results.length} results for "${query}"`;
    
    // Generate results HTML
    resultsContainer.innerHTML = results.map(sermon => `
      <div class="search-result-item" data-id="${sermon.id}">
        <div class="search-result-thumb">
          <img src="${sermon.thumbnail_url || ''}" alt="${sermon.title}">
        </div>
        <div class="search-result-info">
          <h4>${sermon.title}</h4>
          <p>${truncateText(sermon.description || '', 80)}</p>
          <div class="search-result-meta">
            ${sermon.author ? `<span>👤 ${sermon.author}</span>` : ''}
            <span>📅 ${new Date(sermon.created_at).toLocaleDateString()}</span>
            <span>⏱️ ${formatDuration(sermon.duration)}</span>
          </div>
          <button class="play-search-result" data-id="${sermon.id}">▶ Play</button>
          <a href="sermon-detail.html?id=${sermon.id}" class="view-details-btn">View Details</a>
        </div>
      </div>
    `).join('');
    
    // Add click handlers for "Play" buttons
    resultsContainer.querySelectorAll('.play-search-result').forEach(btn => {
      btn.onclick = () => {
        const sermonId = btn.dataset.id;
        const card = videosContainer.querySelector(`.tiktok-video[data-id="${sermonId}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth' });
          const playBtn = card.querySelector('.play-overlay');
          if (playBtn) playBtn.click();
          document.getElementById('searchOverlay').style.display = 'none';
        }
      };
    });
  }
  
  // ==========================================================================
  // 🎮 CONTROL FUNCTIONS
  // ==========================================================================
  
  /**
   * Sets up feed control buttons
   */
  function setupControls() {
    const refreshBtn = document.getElementById('refreshFeed');
    const shuffleBtn = document.getElementById('toggleShuffle');
    
    // Refresh feed
    refreshBtn.onclick = async () => {
      currentPage = 1;
      sermons = [];
      videosContainer.innerHTML = '';
      hasMore = true;
      await loadSermons();
      showNotification('Feed refreshed');
    };
    
    // Toggle shuffle mode
    shuffleBtn.onclick = () => {
      shuffleMode = !shuffleMode;
      shuffleBtn.textContent = shuffleMode ? '🔀 Shuffle: ON' : '🔀 Shuffle: OFF';
      showNotification(shuffleMode ? 'Shuffle enabled' : 'Shuffle disabled');
    };
  }
  
  /**
   * Sets up keyboard shortcuts
   */
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ignore if user is typing in input
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
        case 's':
        case 'S':
          // Focus search on Ctrl+S or Cmd+S
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            document.getElementById('openSearch').click();
          }
          break;
      }
    });
  }
  
  // ==========================================================================
  // ❤️ ACTION HANDLERS
  // ==========================================================================
  
  /**
   * Handles user actions (like, comment, share, save)
   * @param {string} action - Action type
   * @param {Object} sermon - Sermon data
   */
  async function handleAction(action, sermon) {
    switch(action) {
      case 'like':
        try {
          await api.post('/likes', { sermon_id: sermon.id });
          showNotification('Liked! ❤️');
          // Update like count in UI
          const likeBtn = document.querySelector(`.tiktok-video[data-id="${sermon.id}"] .like-btn .count`);
          if (likeBtn) {
            const currentCount = parseInt(likeBtn.textContent) || 0;
            likeBtn.textContent = currentCount + 1;
          }
        } catch (err) {
          console.error('Error liking:', err);
          showNotification('Failed to like');
        }
        break;
        
      case 'comment':
        // Open comments modal
        try {
          const comments = await fetchSermonComments(sermon.id);
          // You'll need to implement a comments modal
          showNotification('Comments loaded');
        } catch (err) {
          console.error('Error loading comments:', err);
        }
        break;
        
      case 'share':
        shareSermon(sermon);
        break;
        
      case 'save':
        try {
          await api.post('/saved', { sermon_id: sermon.id });
          showNotification('Saved for later! 📥');
        } catch (err) {
          console.error('Error saving:', err);
        }
        break;
    }
  }
  
  /**
   * Shares a sermon via Web Share API or clipboard fallback
   * @param {Object} sermon - Sermon data to share
   */
  function shareSermon(sermon) {
    const url = `${window.location.origin}/sermon-detail.html?id=${sermon.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: sermon.title,
        text: sermon.description || 'Check out this inspiring sermon',
        url: url
      }).catch(err => {
        console.log('Share cancelled:', err);
      });
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(url).then(() => {
        showNotification('Link copied to clipboard! 🔗');
      }).catch(err => {
        console.error('Clipboard error:', err);
        showNotification('Share failed');
      });
    }
  }
  
  // ==========================================================================
  // 🛠️ UTILITY FUNCTIONS
  // ==========================================================================
  
  /**
   * Shows temporary notification to user
   * @param {string} message - Notification message
   */
  function showNotification(message) {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    // Create new notification
    const notification = el('div', 'notification');
    notification.textContent = message;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    
    document.body.appendChild(notification);
    
    // Auto-remove after 2 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 2000);
  }
  
  /**
   * Formats duration from seconds to MM:SS
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration
   */
  function formatDuration(seconds) {
    if (!seconds || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  /**
   * Truncates text to specified length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  
  /**
   * Checks if element is in viewport
   * @param {HTMLElement} el - Element to check
   * @returns {boolean} True if element is in viewport
   */
  function isElementInViewport(el) {
    if (!el) return false;
    
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
}