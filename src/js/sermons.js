// src/js/sermons.js - TIKTOK-STYLE SERMON FEED (FIXED & ORGANIZED)
import { api } from "../../api.js"; // FIXED PATH
import { el } from "../../utils.js"; // FIXED PATH
import { fetchSermonComments, postSermonComment } from "../../commentsPublic.js"; // FIXED PATH

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
  
  // ==========================================================================
  // 📦 CREATE FEED STRUCTURE
  // ==========================================================================
  
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
    
    <!-- TikTok-style swipe guide -->
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
  let videos = []; // Array to track all videos for auto-play
  
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
      const response = await api.get("/sermons"); // FIXED: Your old code uses simple GET
      const newSermons = Array.isArray(response) ? response : 
                        (response.data || response.sermons || []);
      
      // Sort by date (newest first) - from your old code
      newSermons.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
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
      
      // Setup auto-play observer after videos are loaded
      setupAutoPlayObserver();
      
    } catch (err) {
      console.error('Error loading sermons:', err);
      showNotification('Failed to load sermons');
      videosContainer.innerHTML = '<p style="color:red; text-align:center; padding: 2rem;">Failed to load sermons. Please try again.</p>';
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
    thumbnail.style.backgroundImage = `url('${sermon.thumbnail_url || sermon.original_url || ''}')`;
    thumbnail.style.backgroundColor = '#000'; // From your old code
    
    // Play overlay button
    const playOverlay = el('div', 'play-overlay');
    playOverlay.innerHTML = '▶';
    playOverlay.setAttribute('aria-label', `Play ${sermon.title}`);
    
    // Video element
    const video = el('video');
    video.playsInline = true;
    video.controls = false; // We'll handle controls manually
    video.preload = 'metadata'; // From your old code
    video.dataset.sermonId = sermon.id;
    video.setAttribute('aria-label', `Video: ${sermon.title}`);
    video.style.display = 'none'; // Hidden initially
    
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
      youtubeBtn.innerHTML = '📺 Full Sermon'; // From your old code
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
    // 6. SETUP VIDEO INTERACTIONS (FROM YOUR OLD CODE)
    // ========================================================================
    setupVideoInteractions(card, sermon, video, thumbnail, playOverlay);
    
    // Track video for auto-play
    videos.push({ video, sermon, card });
  }
  
  /**
   * Sets up video play/pause interactions (based on your old code)
   */
  function setupVideoInteractions(card, sermon, video, thumbnail, playOverlay) {
    let videoLoaded = false;
    let lazyObserver = null;
    
    const playVideo = () => {
      // Pause currently playing video
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
      
      // Set as current video
      currentVideoElement = video;
      card.classList.add('playing');
      
      // Load video source if not already loaded (from your old code)
      if (!videoLoaded) {
        // Use your old code's URL structure
        const urls = sermon.urls || {};
        const videoSources = [
          urls.hls_url,
          sermon.hls_url,
          urls.mp4_url,
          sermon.mp4_url,
          urls.webm_url,
          sermon.webm_url,
          sermon.video_url,
          sermon.original_url
        ].filter(Boolean);
        
        if (videoSources.length > 0) {
          if (videoSources[0].includes('.m3u8') && window.Hls && Hls.isSupported()) {
            // HLS stream (from your old code)
            const hls = new Hls({ startLevel: -1, maxBufferLength: 30 });
            hls.loadSource(videoSources[0]);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              video.play().catch(() => {});
            });
          } else if (videoSources[0].includes('.m3u8') && video.canPlayType("application/vnd.apple.mpegurl")) {
            // Native HLS for Safari
            video.src = videoSources[0];
          } else {
            // Direct video file
            video.src = videoSources[0];
          }
        }
        videoLoaded = true;
        
        // Stop lazy observer
        if (lazyObserver) {
          lazyObserver.disconnect();
        }
      }
      
      // Show video, hide thumbnail
      thumbnail.style.display = 'none';
      video.style.display = 'block';
      playOverlay.style.display = 'none';
      
      // Attempt to play
      video.play().catch(e => console.log('Autoplay prevented:', e));
      
      // Setup video end handler (shuffle mode)
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
    
    // Lazy loading observer (from your old code)
    lazyObserver = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting && !videoLoaded) {
            // Just preload, don't autoplay
            const urls = sermon.urls || {};
            const videoSources = [
              urls.hls_url,
              sermon.hls_url,
              urls.mp4_url,
              sermon.mp4_url
            ].filter(Boolean);
            
            if (videoSources.length > 0) {
              video.preload = 'auto';
            }
          }
        });
      },
      { threshold: 0.25, root: videosContainer }
    );
    
    lazyObserver.observe(video);
  }
  
  // ==========================================================================
  // 🎯 AUTO-PLAY OBSERVER (FROM YOUR OLD CODE)
  // ==========================================================================
  
  /**
   * Sets up auto-play observer for visible videos
   */
  function setupAutoPlayObserver() {
    const autoPlayObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const vid = entry.target;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
            // Pause all other videos
            videos.forEach((v) => {
              if (v.video !== vid && !v.video.paused) {
                v.video.pause();
                const vCard = v.video.closest('.tiktok-video');
                if (vCard) {
                  vCard.classList.remove('playing');
                  const vThumb = vCard.querySelector('.video-thumbnail');
                  const vOverlay = vCard.querySelector('.play-overlay');
                  if (vThumb) vThumb.style.display = 'block';
                  if (vOverlay) vOverlay.style.display = 'flex';
                }
              }
            });
            // Play the one currently visible
            if (vid.paused) {
              vid.play().catch(() => {});
              const card = vid.closest('.tiktok-video');
              if (card) {
                card.classList.add('playing');
                const thumb = card.querySelector('.video-thumbnail');
                const overlay = card.querySelector('.play-overlay');
                if (thumb) thumb.style.display = 'none';
                if (overlay) overlay.style.display = 'none';
              }
            }
          } else if (!vid.paused) {
            vid.pause();
            const card = vid.closest('.tiktok-video');
            if (card) {
              card.classList.remove('playing');
              const thumb = card.querySelector('.video-thumbnail');
              const overlay = card.querySelector('.play-overlay');
              if (thumb) thumb.style.display = 'block';
              if (overlay) overlay.style.display = 'flex';
            }
          }
        });
      },
      { threshold: 0.7, root: null }
    );

    // Observe all videos
    videos.forEach((vObj) => autoPlayObserver.observe(vObj.video));
    
    // Pause all videos when feed is out of view (from your old code)
    window.addEventListener("scroll", () => {
      const rect = videosContainer.getBoundingClientRect();
      const fullyOutOfView = rect.bottom < 0 || rect.top > window.innerHeight;

      if (fullyOutOfView) {
        videos.forEach((v) => {
          if (!v.video.paused) {
            v.video.pause();
            const card = v.video.closest('.tiktok-video');
            if (card) {
              card.classList.remove('playing');
              const thumb = card.querySelector('.video-thumbnail');
              const overlay = card.querySelector('.play-overlay');
              if (thumb) thumb.style.display = 'block';
              if (overlay) overlay.style.display = 'flex';
            }
          }
        });
      }
    });
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
    if (isScrolling || videos.length === 0) return;
    
    isScrolling = true;
    
    let nextIndex = currentIndex + direction;
    
    // Shuffle mode logic (from your old code)
    if (shuffleMode && direction === 1) {
      const unplayedVideos = videos.filter((v, idx) => idx !== currentIndex);
      if (unplayedVideos.length > 0) {
        const randomVideo = unplayedVideos[Math.floor(Math.random() * unplayedVideos.length)];
        nextIndex = videos.findIndex(v => v.video === randomVideo.video);
      } else {
        nextIndex = (currentIndex + 1) % videos.length;
      }
    }
    
    // Ensure index is within bounds
    nextIndex = Math.max(0, Math.min(videos.length - 1, nextIndex));
    
    if (videos[nextIndex]) {
      const nextCard = videos[nextIndex].card;
      
      // Smooth scroll to next card
      nextCard.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      
      currentIndex = nextIndex;
      
      // Auto-play after scroll
      setTimeout(() => {
        const video = videos[nextIndex].video;
        const playBtn = nextCard.querySelector('.play-overlay');
        if (video && playBtn) {
          playBtn.click(); // Trigger play
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
   * Plays next random video (shuffle mode - from your old code)
   */
  function playNextShuffle() {
    if (videos.length <= 1) return;
    
    // Filter unplayed videos
    const unplayed = videos.filter(v => !v.card.classList.contains('playing'));
    
    if (unplayed.length === 0) {
      // Reset if all have been played
      videos.forEach(v => v.card.classList.remove('playing'));
      const randomVideo = videos[Math.floor(Math.random() * videos.length)];
      const playBtn = randomVideo.card.querySelector('.play-overlay');
      if (playBtn) playBtn.click();
    } else {
      const randomVideo = unplayed[Math.floor(Math.random() * unplayed.length)];
      const playBtn = randomVideo.card.querySelector('.play-overlay');
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
      const results = Array.isArray(response) ? response : 
                     (response.data || response.sermons || []);
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
          <img src="${sermon.thumbnail_url || ''}" alt="${sermon.title}" onerror="this.style.display='none'">
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
      videos = [];
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
  // ❤️ ACTION HANDLERS (FROM YOUR OLD CODE)
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
          // Refresh like count (from your old code)
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
        // Handle comments (from your old code)
        try {
          const comments = await fetchSermonComments(String(sermon.id));
          showNotification(`${comments.length || 0} comments loaded`);
          // You can implement a comments modal here
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
}