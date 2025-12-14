// src/js/sermons.js
import { api } from "../../api.js";
import { el } from "../../utils.js";
import { fetchSermonComments, postSermonComment } from "../../commentsPublic.js";

/** 🧩 SEO: Set Open Graph Meta for Sermon Detail Pages */
export function setSermonOGMeta(sermon) {
  if (!sermon) return;
  
  const head = document.head;
  const url = `${window.location.origin}/sermon-detail.html?id=${sermon.id}`;
  
  // Function to set/update meta tags
  function setMeta(property, content, isName = false) {
    const selector = isName ? `meta[name="${property}"]` : `meta[property="${property}"]`;
    let meta = head.querySelector(selector);
    
    if (!meta) {
      meta = document.createElement('meta');
      if (isName) {
        meta.setAttribute('name', property);
      } else {
        meta.setAttribute('property', property);
      }
      head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }
  
  // Basic Open Graph
  setMeta('og:title', `${sermon.title} - Victorious Army Revival Movement`);
  setMeta('og:description', sermon.description || 'Watch this inspiring sermon');
  setMeta('og:image', sermon.thumbnail_url || 'default-thumbnail.jpg');
  setMeta('og:url', url);
  setMeta('og:type', 'video.other');
  
  // Video specific OG tags
  setMeta('og:video:url', sermon.video_url || sermon.youtube_url || '');
  setMeta('og:video:secure_url', sermon.video_url || sermon.youtube_url || '');
  setMeta('og:video:type', 'text/html');
  setMeta('og:video:width', '720');
  setMeta('og:video:height', '1280');
  
  // Twitter Cards
  setMeta('twitter:card', 'player', true);
  setMeta('twitter:title', sermon.title, true);
  setMeta('twitter:description', sermon.description || 'Watch this inspiring sermon', true);
  setMeta('twitter:image', sermon.thumbnail_url || 'default-thumbnail.jpg', true);
  setMeta('twitter:player', url, true);
  setMeta('twitter:player:width', '720', true);
  setMeta('twitter:player:height', '1280', true);
  
  // Canonical URL
  let canonical = head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    head.appendChild(canonical);
  }
  canonical.setAttribute('href', url);
}

/** 🧩 SEO: Set Structured Data (Schema.org) */
export function setSermonStructuredData(sermon) {
  // Remove existing structured data
  document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
    if (script.textContent.includes('VideoObject')) {
      script.remove();
    }
  });
  
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": sermon.title,
    "description": sermon.description || "Watch this inspiring sermon from Victorious Army Revival Movement",
    "thumbnailUrl": sermon.thumbnail_url || "default-thumbnail.jpg",
    "uploadDate": new Date(sermon.created_at).toISOString(),
    "duration": sermon.duration ? `PT${sermon.duration}S` : undefined,
    "contentUrl": sermon.video_url || sermon.mp4_url || sermon.original_url || "",
    "embedUrl": `${window.location.origin}/sermon-detail.html?id=${sermon.id}`,
    "publisher": {
      "@type": "Organization",
      "name": "Victorious Army Revival Movement",
      "logo": {
        "@type": "ImageObject",
        "url": `${window.location.origin}/logo.png`
      }
    },
    "author": {
      "@type": "Person",
      "name": sermon.author || "Unknown Speaker"
    }
  };
  
  script.textContent = JSON.stringify(structuredData, null, 2);
  document.head.appendChild(script);
}

/** 🎬 TIKTOK-STYLE SERMON FEED WITH ALL FEATURES */
export async function initSermonTikTokFeed(container) {
  if (!container) return;
  
  // Set up TikTok-style container
  container.style.cssText = `
    position: relative;
    height: 100vh;
    overflow: hidden;
    background: #000;
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
  `;
  
  container.innerHTML = `
    <div class="tiktok-feed">
      <div class="sermon-videos" id="sermonVideosContainer" style="height: 100%;"></div>
      
      <!-- Loading Indicator -->
      <div class="loading-indicator" id="loadingIndicator" style="display: none;">
        <div class="spinner"></div>
        <p>Loading more sermons...</p>
      </div>
      
      <!-- Search Overlay -->
      <div class="search-overlay" id="searchOverlay" style="display: none;">
        <div class="search-container">
          <div class="search-header">
            <h3 style="margin: 0; color: white;">🔍 Deep Search Sermons</h3>
            <button id="closeSearch" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">✕</button>
          </div>
          
          <div class="search-filters">
            <input type="text" id="sermonSearch" placeholder="Search by title, description, or keywords..." 
                   style="width: 100%; padding: 15px; font-size: 16px; border: 2px solid #4CAF50; border-radius: 8px; background: #111; color: white;">
            
            <div class="filter-options" style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
              <label style="color: white; font-size: 14px;">
                <input type="checkbox" id="filterTitle" checked> Title
              </label>
              <label style="color: white; font-size: 14px;">
                <input type="checkbox" id="filterDescription" checked> Description
              </label>
              <label style="color: white; font-size: 14px;">
                <input type="checkbox" id="filterAuthor"> Speaker/Author
              </label>
              <select id="sortBy" style="margin-left: auto; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="popular">Most Viewed</option>
                <option value="duration">Duration (Short to Long)</option>
              </select>
            </div>
          </div>
          
          <div id="searchResults" class="search-results" style="margin-top: 20px; max-height: 60vh; overflow-y: auto;"></div>
          
          <div class="search-stats" id="searchStats" style="color: #ccc; font-size: 12px; margin-top: 10px; text-align: center;"></div>
        </div>
      </div>
      
      <!-- Control Buttons -->
      <button class="search-btn" id="openSearch" style="position: fixed; top: 80px; right: 20px; background: rgba(0,0,0,0.7); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 12px 20px; border-radius: 25px; cursor: pointer; z-index: 100;">🔍 Search</button>
      
      <div class="feed-controls" style="position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 100;">
        <button class="refresh-btn" id="refreshFeed" style="background: rgba(0,0,0,0.7); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 12px 20px; border-radius: 25px; cursor: pointer;">🔄 Refresh</button>
        <button class="shuffle-btn" id="toggleShuffle" style="background: rgba(0,0,0,0.7); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 12px 20px; border-radius: 25px; cursor: pointer;">🔀 Shuffle: ON</button>
      </div>
      
      <!-- Current Video Info -->
      <div class="current-video-info" id="currentVideoInfo" style="position: fixed; top: 80px; left: 20px; background: rgba(0,0,0,0.7); color: white; padding: 10px 15px; border-radius: 8px; max-width: 300px; z-index: 100; display: none;">
        <strong>Now Playing:</strong>
        <span id="currentVideoTitle" style="display: block; margin-top: 5px; font-size: 14px;"></span>
      </div>
    </div>
  `;
  
  const videosContainer = document.getElementById('sermonVideosContainer');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const currentVideoInfo = document.getElementById('currentVideoInfo');
  const currentVideoTitle = document.getElementById('currentVideoTitle');
  
  // State management
  let currentPage = 1;
  let isLoading = false;
  let hasMore = true;
  let allSermons = [];
  let displayedSermons = [];
  let currentVideoIndex = 0;
  let shuffleMode = true;
  let unplayedSermons = [];
  let currentVideoElement = null;
  let observer = null;
  
  // Load initial sermons
  await loadSermons(currentPage);
  
  // Set up scroll observer
  setupScrollObserver();
  
  // Set up search functionality
  setupDeepSearch();
  
  // Set up controls
  setupControls();
  
  // Set up keyboard shortcuts
  setupKeyboardShortcuts();
  
  /** Load sermons with pagination */
  async function loadSermons(page, searchQuery = '') {
    if (isLoading) return;
    
    isLoading = true;
    loadingIndicator.style.display = 'block';
    
    try {
      let url = `/sermons?page=${page}&limit=10&order=created_at.desc`;
      if (searchQuery) {
        url += `&q=${encodeURIComponent(searchQuery)}`;
      }
      
      const response = await api.get(url);
      const newSermons = response.data || response;
      
      if (!Array.isArray(newSermons) || newSermons.length === 0) {
        hasMore = false;
        loadingIndicator.innerHTML = '<p style="color: #ccc; text-align: center;">No more sermons found</p>';
        return;
      }
      
      // Add to all sermons
      allSermons = [...allSermons, ...newSermons];
      displayedSermons = [...displayedSermons, ...newSermons];
      
      // Initialize shuffle pool
      if (page === 1) {
        unplayedSermons = [...newSermons];
      } else {
        unplayedSermons = [...unplayedSermons, ...newSermons];
      }
      
      // Create TikTok cards
      newSermons.forEach((sermon, index) => {
        createTikTokCard(sermon, videosContainer, allSermons.length - newSermons.length + index);
      });
      
      // Auto-play first video if it's the initial load
      if (page === 1 && displayedSermons.length > 0) {
        setTimeout(() => {
          const firstVideoCard = videosContainer.querySelector('.tiktok-video');
          if (firstVideoCard) {
            scrollToVideoCard(firstVideoCard);
          }
        }, 1000);
      }
      
      currentPage++;
      
    } catch (err) {
      console.error('Error loading sermons:', err);
      loadingIndicator.innerHTML = '<p style="color: red; text-align: center;">Failed to load sermons</p>';
    } finally {
      isLoading = false;
      setTimeout(() => {
        loadingIndicator.style.display = 'none';
      }, 500);
    }
  }
  
  /** Create TikTok-style vertical video card */
  function createTikTokCard(sermon, container, index) {
    const card = el('div', 'tiktok-video');
    card.dataset.id = sermon.id;
    card.dataset.index = index;
    
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
    
    // Vertical thumbnail (from your database)
    const thumbnail = el('div', 'video-thumbnail');
    thumbnail.style.cssText = `
      width: 100%;
      height: 720px;
      max-height: 80vh;
      background-image: url('${sermon.thumbnail_url || sermon.original_url || 'default-vertical-thumb.jpg'}');
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
      transition: all 0.3s ease;
    `;
    
    // Video element (hidden initially)
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
    video.dataset.sermonId = sermon.id;
    
    // Content overlay (TikTok style)
    const contentOverlay = el('div', 'content-overlay');
    contentOverlay.style.cssText = `
      position: absolute;
      bottom: 100px;
      left: 20px;
      right: 20px;
      color: white;
      z-index: 3;
      background: linear-gradient(transparent, rgba(0,0,0,0.8));
      padding: 20px;
      border-radius: 10px;
    `;
    
    // Title with SEO-friendly structure
    const title = el('h2', 'sermon-title');
    title.textContent = sermon.title || 'Untitled Sermon';
    title.style.cssText = `
      font-size: 22px;
      margin: 0 0 10px 0;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
    `;
    
    // Description (caption) - from your database
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
    
    // Meta info from your database
    const meta = el('div', 'sermon-meta');
    meta.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 15px;
    `;
    
    const duration = sermon.duration ? formatDuration(sermon.duration) : 'N/A';
    const size = sermon.size_mb ? `${sermon.size_mb.toFixed(1)} MB` : '';
    const format = sermon.format ? `.${sermon.format}` : '';
    
    meta.innerHTML = `
      <span>📅 ${new Date(sermon.created_at).toLocaleDateString()}</span>
      <span>⏱️ ${duration}</span>
      ${size ? `<span>💾 ${size}${format}</span>` : ''}
    `;
    
    // YouTube button (from your database)
    const youtubeBtn = el('a', 'youtube-btn');
    youtubeBtn.href = sermon.youtube_url || '#';
    youtubeBtn.target = '_blank';
    youtubeBtn.rel = 'noopener noreferrer';
    youtubeBtn.innerHTML = '📺 Watch Full on YouTube';
    youtubeBtn.style.cssText = `
      display: inline-block;
      background: #FF0000;
      color: white;
      padding: 10px 20px;
      border-radius: 25px;
      text-decoration: none;
      font-weight: bold;
      font-size: 14px;
      margin-right: 10px;
      margin-bottom: 10px;
    `;
    
    if (!sermon.youtube_url) {
      youtubeBtn.style.display = 'none';
    }
    
    // Details button
    const detailsBtn = el('a', 'details-btn');
    detailsBtn.href = `sermon-detail.html?id=${sermon.id}`;
    detailsBtn.innerHTML = '📖 Full Details & Comments';
    detailsBtn.style.cssText = `
      display: inline-block;
      background: #4CAF50;
      color: white;
      padding: 10px 20px;
      border-radius: 25px;
      text-decoration: none;
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 10px;
    `;
    
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
      btn.style.cssText = `
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
      
      btn.onclick = (e) => {
        e.stopPropagation();
        handleAction(action.label, sermon);
      };
      
      sideActions.appendChild(btn);
    });
    
    // Assemble the card
    videoContainer.appendChild(thumbnail);
    videoContainer.appendChild(playOverlay);
    videoContainer.appendChild(video);
    
    contentOverlay.appendChild(title);
    contentOverlay.appendChild(description);
    contentOverlay.appendChild(meta);
    contentOverlay.appendChild(youtubeBtn);
    contentOverlay.appendChild(detailsBtn);
    
    card.appendChild(videoContainer);
    card.appendChild(contentOverlay);
    card.appendChild(sideActions);
    
    container.appendChild(card);
    
    // Set up video interactions
    setupVideoInteractions(card, sermon, video, thumbnail, playOverlay);
  }
  
  /** Set up video playback interactions */
  function setupVideoInteractions(card, sermon, video, thumbnail, playOverlay) {
    let videoLoaded = false;
    
    // Load and play video
    const playVideo = () => {
      // Pause current video if playing
      if (currentVideoElement && currentVideoElement !== video) {
        currentVideoElement.pause();
        const currentCard = currentVideoElement.closest('.tiktok-video');
        if (currentCard) {
          const currentThumbnail = currentCard.querySelector('.video-thumbnail');
          const currentOverlay = currentCard.querySelector('.play-overlay');
          if (currentThumbnail) currentThumbnail.style.display = 'block';
          if (currentOverlay) currentOverlay.style.display = 'flex';
        }
      }
      
      // Set current video
      currentVideoElement = video;
      currentVideoInfo.style.display = 'block';
      currentVideoTitle.textContent = sermon.title;
      
      // Load video if not loaded
      if (!videoLoaded) {
        // Try different video URLs from your database
        const videoSources = [
          sermon.his_url, // Assuming this is HLS URL
          sermon.mp4_url,
          sermon.video_url,
          sermon.original_url,
          sermon.webm_urt, // Note: typo in your schema (urt instead of url)
          sermon.mov_url
        ].filter(Boolean);
        
        if (videoSources.length > 0) {
          // Try HLS first
          if (videoSources[0].includes('.m3u8') && window.Hls && Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(videoSources[0]);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              video.play().catch(e => console.log('Autoplay prevented:', e));
            });
          } else {
            video.src = videoSources[0];
            video.play().catch(e => console.log('Autoplay prevented:', e));
          }
        }
        videoLoaded = true;
      } else {
        video.play().catch(e => console.log('Play prevented:', e));
      }
      
      // Show video, hide thumbnail
      thumbnail.style.display = 'none';
      video.style.display = 'block';
      playOverlay.style.display = 'none';
      
      // Set up ended event for shuffle
      video.onended = () => {
        if (shuffleMode) {
          playNextShuffle();
        } else {
          // Show thumbnail again
          thumbnail.style.display = 'block';
          playOverlay.style.display = 'flex';
          video.style.display = 'none';
        }
      };
    };
    
    // Click handlers
    thumbnail.onclick = playVideo;
    playOverlay.onclick = playVideo;
    
    // Video click to toggle play/pause
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
  
  /** Play next video in shuffle mode */
  function playNextShuffle() {
    if (unplayedSermons.length === 0) {
      // Reset unplayed sermons
      unplayedSermons = [...displayedSermons];
    }
    
    // Remove current sermon from unplayed
    const currentCard = currentVideoElement?.closest('.tiktok-video');
    const currentSermonId = currentCard?.dataset.id;
    unplayedSermons = unplayedSermons.filter(s => s.id !== currentSermonId);
    
    // Pick random next sermon
    if (unplayedSermons.length > 0) {
      const nextSermon = unplayedSermons[Math.floor(Math.random() * unplayedSermons.length)];
      const nextCard = videosContainer.querySelector(`.tiktok-video[data-id="${nextSermon.id}"]`);
      
      if (nextCard) {
        scrollToVideoCard(nextCard);
        
        // Auto-play after scroll
        setTimeout(() => {
          const playBtn = nextCard.querySelector('.play-overlay');
          if (playBtn) playBtn.click();
        }, 300);
      }
    }
  }
  
  /** Scroll to video card */
  function scrollToVideoCard(card) {
    if (!card) return;
    
    card.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
    
    // Update current video index
    currentVideoIndex = parseInt(card.dataset.index);
  }
  
  /** Set up Intersection Observer for scroll */
  function setupScrollObserver() {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const card = entry.target;
            const video = card.querySelector('video');
            
            // Pause all other videos
            document.querySelectorAll('video').forEach(v => {
              if (v !== video && !v.paused) {
                v.pause();
                const parentCard = v.closest('.tiktok-video');
                if (parentCard) {
                  const thumb = parentCard.querySelector('.video-thumbnail');
                  const overlay = parentCard.querySelector('.play-overlay');
                  if (thumb) thumb.style.display = 'block';
                  if (overlay) overlay.style.display = 'flex';
                }
              }
            });
            
            // Load more if this is near the bottom
            const index = parseInt(card.dataset.index);
            if (index >= displayedSermons.length - 3 && hasMore && !isLoading) {
              loadSermons(currentPage);
            }
          }
        });
      },
      {
        threshold: 0.7,
        root: container
      }
    );
    
    // Observe all video cards
    setTimeout(() => {
      document.querySelectorAll('.tiktok-video').forEach(card => {
        observer.observe(card);
      });
    }, 1000);
  }
  
  /** Set up deep search functionality */
  function setupDeepSearch() {
    const searchOverlay = document.getElementById('searchOverlay');
    const openSearchBtn = document.getElementById('openSearch');
    const closeSearchBtn = document.getElementById('closeSearch');
    const searchInput = document.getElementById('sermonSearch');
    const searchResults = document.getElementById('searchResults');
    const searchStats = document.getElementById('searchStats');
    
    openSearchBtn.onclick = () => {
      searchOverlay.style.display = 'flex';
      searchInput.focus();
    };
    
    closeSearchBtn.onclick = () => {
      searchOverlay.style.display = 'none';
      searchInput.value = '';
      searchResults.innerHTML = '';
      searchStats.innerHTML = '';
    };
    
    // Search as you type with debounce
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        performDeepSearch(searchInput.value);
      }, 500);
    });
    
    // Filter change listeners
    document.getElementById('filterTitle').addEventListener('change', () => performDeepSearch(searchInput.value));
    document.getElementById('filterDescription').addEventListener('change', () => performDeepSearch(searchInput.value));
    document.getElementById('filterAuthor').addEventListener('change', () => performDeepSearch(searchInput.value));
    document.getElementById('sortBy').addEventListener('change', () => performDeepSearch(searchInput.value));
    
    async function performDeepSearch(query) {
      if (!query.trim()) {
        searchResults.innerHTML = '<p class="no-results">Type to search sermons...</p>';
        searchStats.innerHTML = '';
        return;
      }
      
      try {
        // Get search filters
        const searchTitle = document.getElementById('filterTitle').checked;
        const searchDescription = document.getElementById('filterDescription').checked;
        const searchAuthor = document.getElementById('filterAuthor').checked;
        const sortBy = document.getElementById('sortBy').value;
        
        // Build search query
        let searchParams = new URLSearchParams();
        searchParams.append('q', query);
        
        if (searchTitle) searchParams.append('search_title', 'true');
        if (searchDescription) searchParams.append('search_description', 'true');
        if (searchAuthor) searchParams.append('search_author', 'true');
        searchParams.append('sort', sortBy);
        
        const results = await api.get(`/sermons/search?${searchParams.toString()}`);
        
        // Display results
        displaySearchResults(results, query);
        
      } catch (err) {
        console.error('Search error:', err);
        searchResults.innerHTML = '<p class="error" style="color: red; text-align: center;">Search failed. Please try again.</p>';
        searchStats.innerHTML = '';
      }
    }
    
    function displaySearchResults(results, query) {
      if (!Array.isArray(results) || results.length === 0) {
        searchResults.innerHTML = `
          <div class="no-results" style="text-align: center; padding: 40px; color: #999;">
            <p>No sermons found for "${query}"</p>
            <p style="font-size: 12px; margin-top: 10px;">Try different keywords or adjust search filters</p>
          </div>
        `;
        searchStats.innerHTML = `0 results for "${query}"`;
        return;
      }
      
      searchResults.innerHTML = results.map(sermon => `
        <div class="search-result" data-id="${sermon.id}" style="display: flex; align-items: center; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: background 0.3s;">
          <img src="${sermon.thumbnail_url || sermon.original_url || 'default-thumb.jpg'}" 
               alt="${sermon.title}"
               style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; margin-right: 15px;">
          <div class="result-info" style="flex: 1;">
            <h4 style="margin: 0 0 5px 0; font-size: 16px; color: white;">${highlightText(sermon.title, query)}</h4>
            <p style="margin: 0 0 5px 0; font-size: 12px; color: #ccc;">
              📅 ${new Date(sermon.created_at).toLocaleDateString()} • 
              ⏱️ ${formatDuration(sermon.duration)} • 
              ${sermon.size_mb ? `💾 ${sermon.size_mb.toFixed(1)} MB` : ''}
            </p>
            ${sermon.description ? `
              <p class="desc" style="margin: 0; font-size: 13px; color: #ddd; line-height: 1.4;">
                ${highlightText(sermon.description.substring(0, 120), query)}...
              </p>
            ` : ''}
          </div>
          <button class="play-result" data-id="${sermon.id}" style="background: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-size: 12px;">
            ▶ Play
          </button>
        </div>
      `).join('');
      
      searchStats.innerHTML = `${results.length} results for "${query}"`;
      
      // Add click handlers
      searchResults.querySelectorAll('.search-result').forEach(result => {
        result.onclick = (e) => {
          if (!e.target.classList.contains('play-result')) {
            const sermonId = result.dataset.id;
            navigateToSermon(sermonId);
          }
        };
      });
      
      searchResults.querySelectorAll('.play-result').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const sermonId = btn.dataset.id;
          navigateToSermon(sermonId, true);
        };
      });
    }
    
    function highlightText(text, query) {
      if (!text || !query) return text;
      const regex = new RegExp(`(${query})`, 'gi');
      return text.replace(regex, '<mark style="background: yellow; color: black; padding: 2px;">$1</mark>');
    }
    
    function navigateToSermon(sermonId, playImmediately = false) {
      const card = videosContainer.querySelector(`.tiktok-video[data-id="${sermonId}"]`);
      
      if (card) {
        searchOverlay.style.display = 'none';
        searchInput.value = '';
        searchResults.innerHTML = '';
        searchStats.innerHTML = '';
        
        scrollToVideoCard(card);
        
        if (playImmediately) {
          setTimeout(() => {
            const playBtn = card.querySelector('.play-overlay');
            if (playBtn) playBtn.click();
          }, 300);
        }
      } else {
        // Sermon not loaded yet, load it
        loadSpecificSermon(sermonId);
      }
    }
    
    async function loadSpecificSermon(sermonId) {
      try {
        const sermon = await api.get(`/sermons/${sermonId}`);
        
        // Add to displayed sermons if not already there
        if (!displayedSermons.some(s => s.id === sermonId)) {
          displayedSermons.push(sermon);
          unplayedSermons.push(sermon);
          createTikTokCard(sermon, videosContainer, displayedSermons.length - 1);
          
          // Re-observe with new card
          const newCard = videosContainer.querySelector(`.tiktok-video[data-id="${sermonId}"]`);
          if (newCard && observer) {
            observer.observe(newCard);
          }
        }
        
        // Navigate to it
        navigateToSermon(sermonId, true);
        
      } catch (err) {
        console.error('Error loading specific sermon:', err);
        alert('Could not load this sermon. It may have been removed.');
      }
    }
  }
  
  /** Set up controls */
  function setupControls() {
    const refreshBtn = document.getElementById('refreshFeed');
    const shuffleBtn = document.getElementById('toggleShuffle');
    
    refreshBtn.onclick = async () => {
      // Reset state
      currentPage = 1;
      isLoading = false;
      hasMore = true;
      allSermons = [];
      displayedSermons = [];
      unplayedSermons = [];
      
      // Clear container
      videosContainer.innerHTML = '';
      
      // Reload
      await loadSermons(currentPage);
      
      // Show notification
      showNotification('Feed refreshed!');
    };
    
    shuffleBtn.onclick = () => {
      shuffleMode = !shuffleMode;
      shuffleBtn.textContent = shuffleMode ? '🔀 Shuffle: ON' : '🔀 Shuffle: OFF';
      shuffleBtn.style.background = shuffleMode 
        ? 'rgba(76, 175, 80, 0.7)' 
        : 'rgba(0,0,0,0.7)';
      
      showNotification(shuffleMode ? 'Shuffle mode enabled' : 'Shuffle mode disabled');
    };
  }
  
  /** Set up keyboard shortcuts */
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger if user is typing in search
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      switch(e.key) {
        case ' ':
        case 'ArrowDown':
          e.preventDefault();
          scrollToNextVideo();
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          scrollToPrevVideo();
          break;
          
        case 's':
        case 'S':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            document.getElementById('openSearch').click();
          }
          break;
          
        case 'r':
        case 'R':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            document.getElementById('refreshFeed').click();
          }
          break;
      }
    });
  }
  
  /** Scroll to next video */
  function scrollToNextVideo() {
    const cards = Array.from(videosContainer.querySelectorAll('.tiktok-video'));
    if (cards.length === 0) return;
    
    let nextIndex;
    if (shuffleMode && unplayedSermons.length > 0) {
      // Get random unplayed sermon
      const randomSermon = unplayedSermons[Math.floor(Math.random() * unplayedSermons.length)];
      const randomCard = cards.find(card => card.dataset.id === randomSermon.id);
      if (randomCard) {
        scrollToVideoCard(randomCard);
        return;
      }
    }
    
    // Linear navigation
    nextIndex = (currentVideoIndex + 1) % cards.length;
    const nextCard = cards[nextIndex];
    if (nextCard) {
      scrollToVideoCard(nextCard);
    }
  }
  
  /** Scroll to previous video */
  function scrollToPrevVideo() {
    const cards = Array.from(videosContainer.querySelectorAll('.tiktok-video'));
    if (cards.length === 0) return;
    
    const prevIndex = (currentVideoIndex - 1 + cards.length) % cards.length;
    const prevCard = cards[prevIndex];
    if (prevCard) {
      scrollToVideoCard(prevCard);
    }
  }
  
  /** Handle action buttons */
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
        
      case 'comment':
        // Open comment modal
        openCommentModal(sermon);
        break;
        
      case 'share':
        shareSermon(sermon);
        break;
        
      case 'save':
        try {
          await api.post('/saves', { sermon_id: sermon.id });
          showNotification('Saved to favorites! 📥');
        } catch (err) {
          console.error('Error saving:', err);
        }
        break;
    }
  }
  
  /** Open comment modal */
  function openCommentModal(sermon) {
    // Implement comment modal
    alert(`Comment functionality for: ${sermon.title}`);
  }
  
  /** Share sermon */
  function shareSermon(sermon) {
    const shareUrl = `${window.location.origin}/sermon-detail.html?id=${sermon.id}`;
    const shareText = `Watch "${sermon.title}" from Victorious Army Revival Movement`;
    
    if (navigator.share) {
      navigator.share({
        title: sermon.title,
        text: shareText,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      showNotification('Link copied to clipboard!');
    }
  }
  
  /** Show notification */
  function showNotification(message) {
    // Remove existing notification
    const existing = document.getElementById('temp-notification');
    if (existing) existing.remove();
    
    const notification = el('div', 'notification');
    notification.id = 'temp-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      z-index: 1000;
      animation: fadeInOut 2s ease-in-out;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
        20% { opacity: 1; transform: translateX(-50%) translateY(0); }
        80% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after animation
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 2000);
  }
  
  /** Format duration */
  function formatDuration(seconds) {
    if (!seconds) return 'N/A';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

/** ================================================
 * 🎥 ORIGINAL FUNCTION (Preserved)
 * ================================================ */
export async function initSermons(container) {
  // Your original code here
}

/** ================================================
 * 📱 THUMBNAIL GRID (For other pages)
 * ================================================ */
export async function initSermonThumbnails(container) {
  // Simple thumbnail implementation
}