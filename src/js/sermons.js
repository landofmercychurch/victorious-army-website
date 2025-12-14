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
        <div class="search-input-container">
          <input type="text" id="sermonSearch" placeholder="Search by title, description, author, or keywords...">
          <button id="clearSearch" class="clear-search-btn">✕</button>
        </div>
        
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
  let searchTimeout = null;
  
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
    
    // Video container with padding
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
    
    // Content overlay at bottom
    const contentOverlay = el('div', 'content-overlay');
    
    // Title
    const title = el('h2', 'sermon-title');
    title.textContent = sermon.title || 'Untitled Sermon';
    
    // Description (truncated)
    const description = el('p', 'sermon-description');
    description.textContent = truncateText(sermon.description || '', 100);
    
    // Meta info
    const meta = el('div', 'sermon-meta');
    const duration = formatDuration(sermon.duration);
    meta.innerHTML = `
      <span class="meta-item">📅 ${new Date(sermon.created_at).toLocaleDateString()}</span>
      <span class="meta-item">⏱️ ${duration}</span>
      ${sermon.author ? `<span class="meta-item">👤 ${sermon.author}</span>` : ''}
    `;
    
    // Action buttons container - SPLIT LEFT & RIGHT
    const actionButtons = el('div', 'action-buttons');
    
    // YouTube button - LEFT
    const youtubeBtn = el('a', 'youtube-btn');
    if (sermon.youtube_url) {
      youtubeBtn.href = sermon.youtube_url;
      youtubeBtn.target = '_blank';
      youtubeBtn.rel = 'noopener noreferrer';
      youtubeBtn.innerHTML = '📺 YouTube';
    } else {
      youtubeBtn.style.display = 'none';
    }
    
    // Details button - RIGHT
    const detailsBtn = el('a', 'details-btn');
    detailsBtn.href = `sermon-detail.html?id=${sermon.id}`;
    detailsBtn.innerHTML = '📖 Details';
    
    // Side actions (right side) - ADJUSTED POSITION
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
    
    // Assemble with proper spacing
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
  
  /** Enhanced Search Functionality */
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
  
  function displaySearchResults(results, query) {
    const resultsContainer = document.getElementById('searchResults');
    const statsContainer = document.getElementById('searchStats');
    
    if (!Array.isArray(results) || results.length === 0) {
      resultsContainer.innerHTML = '<p class="no-results">No sermons found matching your search.</p>';
      statsContainer.textContent = '0 results';
      return;
    }
    
    statsContainer.textContent = `${results.length} results for "${query}"`;
    
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
    
    // Add click handlers
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
  
  /** Setup enhanced search */
  function setupSearch() {
    const searchOverlay = document.getElementById('searchOverlay');
    const openSearchBtn = document.getElementById('openSearch');
    const closeSearchBtn = document.getElementById('closeSearch');
    const searchInput = document.getElementById('sermonSearch');
    const clearSearchBtn = document.getElementById('clearSearch');
    
    openSearchBtn.onclick = () => {
      searchOverlay.style.display = 'flex';
      searchInput.focus();
    };
    
    closeSearchBtn.onclick = () => {
      searchOverlay.style.display = 'none';
      searchInput.value = '';
    };
    
    clearSearchBtn.onclick = () => {
      searchInput.value = '';
      searchInput.focus();
    };
    
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
  
  /** Helper functions */
  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  
  // ... Rest of the functions remain the same ...