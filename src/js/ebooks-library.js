// src/js/ebooks-library.js
import { api, API } from "../../api.js";
import { el } from "../../utils.js";

class EbooksLibrary {
    constructor() {
        console.log("📚 EbooksLibrary constructor called");
        console.group("Initializing Library");
        
        this.books = [];
        this.filteredBooks = [];
        this.categories = new Set();
        this.series = new Set();
        this.authors = new Set();
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.currentFilters = {
            category: '',
            series: '',
            author: '',
            search: '',
            sort: 'newest'
        };
        
        // Performance metrics
        this.performanceMetrics = {
            pageLoadStart: Date.now(),
            searchDebounceTimer: null,
            activeModals: new Set()
        };
        
        console.log("✅ Library initialized with:", {
            currentFilters: this.currentFilters,
            itemsPerPage: this.itemsPerPage
        });
        console.groupEnd();
    }
    
    async init(container) {
        console.log("🚀 EbooksLibrary.init() called");
        console.group("Initialization Process");
        
        this.container = container;
        console.log("Container:", container);
        
        // 1. Setup navigation and search
        console.log("Step 1: Setting up navigation");
        this.setupNavigation();
        
        // 2. Create subtle guidance
        console.log("Step 2: Creating subtle guidance");
        this.createSubtleGuidance();
        
        // 3. Create modals
        console.log("Step 3: Creating modals");
        this.createBookDetailModal();
        this.createSocialSharingModal();
        
        // 4. Load data
        console.log("Step 4: Loading data");
        await this.loadData();
        
        // 5. Setup UI and events
        console.log("Step 5: Setting up event listeners");
        this.setupEventListeners();
        
        // 6. Attach guide interactions
        console.log("Step 6: Attaching guide interactions");
        this.attachGuideInteractions();
        
        // 7. Render everything
        console.log("Step 7: Rendering UI");
        this.render();
        
        // 8. Setup performance monitoring
        console.log("Step 8: Setting up performance monitoring");
        this.setupPerformanceMonitoring();
        
        console.log("✅ EbooksLibrary initialization complete");
        console.groupEnd();
        
        // Make library globally accessible for debugging
        window.ebookLibrary = this;
        console.log("🌐 Library available globally as window.ebookLibrary");
        
        return this;
    }
    
    // ================ SUBTLE UI GUIDANCE ================
    
    createSubtleGuidance() {
        console.log("🎯 Creating subtle guidance indicators");
        
        // Check if user has seen hints before
        const hasSeenHints = localStorage.getItem('ebooks-hints-seen');
        if (hasSeenHints) return;
        
        const guideHTML = `
            <div class="subtle-guide-container" id="subtle-guide">
                <!-- Search guidance -->
                <div class="guide-hint search-hint" data-hint="search">
                    <div class="hint-content">
                        <span class="hint-text">Try searching for books</span>
                        <div class="hint-arrow">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                    </div>
                    <button class="hint-close" aria-label="Close hint">×</button>
                </div>
                
                <!-- Book interaction guidance -->
                <div class="guide-hint book-hint" data-hint="book">
                    <div class="hint-content">
                        <span class="hint-text">Click books to view details</span>
                        <div class="hint-arrow">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                    </div>
                    <button class="hint-close" aria-label="Close hint">×</button>
                </div>
            </div>
        `;
        
        // Add to body
        document.body.insertAdjacentHTML('beforeend', guideHTML);
        
        // Add styles
        this.addSubtleGuideStyles();
        
        // Show hints with delay
        this.showGuidanceHints();
    }
    
    addSubtleGuideStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            /* Subtle Guide Container */
            .subtle-guide-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9998;
            }
            
            /* Individual Guide Hint */
            .guide-hint {
                position: absolute;
                background: rgba(0, 122, 255, 0.95);
                color: white;
                padding: 10px 16px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 8px 24px rgba(0, 122, 255, 0.3);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                opacity: 0;
                transform: translateY(10px);
                pointer-events: none;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                max-width: 200px;
                z-index: 9999;
            }
            
            .hint-content {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .hint-text {
                line-height: 1.4;
            }
            
            .hint-arrow {
                flex-shrink: 0;
                animation: bounceArrow 1.5s ease-in-out infinite;
            }
            
            @keyframes bounceArrow {
                0%, 100% { transform: translateX(0); }
                50% { transform: translateX(5px); }
            }
            
            /* Specific hint positions */
            .search-hint {
                top: 140px;
                right: 20px;
            }
            
            .book-hint {
                bottom: 120px;
                left: 20px;
            }
            
            /* Show hints */
            .guide-hint.show {
                opacity: 1;
                transform: translateY(0);
                pointer-events: auto;
            }
            
            .guide-hint.show:hover {
                background: rgba(0, 122, 255, 1);
                transform: translateY(-2px);
                box-shadow: 0 12px 32px rgba(0, 122, 255, 0.4);
            }
            
            /* Close button */
            .guide-hint .hint-close {
                position: absolute;
                top: -8px;
                right: -8px;
                width: 20px;
                height: 20px;
                background: white;
                border-radius: 50%;
                border: none;
                color: #007AFF;
                font-size: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: auto;
            }
            
            .guide-hint.show:hover .hint-close {
                opacity: 1;
            }
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
                .guide-hint {
                    padding: 8px 12px;
                    font-size: 13px;
                    max-width: 160px;
                }
                
                .search-hint {
                    top: 120px;
                    right: 10px;
                }
                
                .book-hint {
                    bottom: 100px;
                    left: 10px;
                }
            }
            
            /* Animation for appearing */
            @keyframes hintAppear {
                from {
                    opacity: 0;
                    transform: translateY(20px) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            .guide-hint.show {
                animation: hintAppear 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    showGuidanceHints() {
        setTimeout(() => {
            const hints = document.querySelectorAll('.guide-hint');
            
            hints.forEach((hint, index) => {
                setTimeout(() => {
                    hint.classList.add('show');
                    
                    // Auto-hide after 8 seconds
                    setTimeout(() => {
                        this.closeHint(hint);
                    }, 8000);
                    
                }, index * 1000);
            });
            
        }, 1500);
    }
    
    closeHint(hint) {
        hint.style.opacity = '0';
        hint.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            if (hint.parentNode) {
                hint.remove();
            }
            
            // Mark as seen when all hints are closed
            const remainingHints = document.querySelectorAll('.guide-hint').length;
            if (remainingHints === 0) {
                localStorage.setItem('ebooks-hints-seen', 'true');
            }
        }, 300);
    }
    
    attachGuideInteractions() {
        // When search hint is clicked, focus search
        document.querySelector('.search-hint')?.addEventListener('click', (e) => {
            if (!e.target.classList.contains('hint-close')) {
                const searchInput = document.getElementById('ebook-search');
                if (searchInput) {
                    searchInput.focus();
                }
            }
        });
        
        // When book hint is clicked, scroll to books
        document.querySelector('.book-hint')?.addEventListener('click', (e) => {
            if (!e.target.classList.contains('hint-close')) {
                const booksSection = document.getElementById('ebooks-grid');
                if (booksSection) {
                    booksSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
        
        // Close buttons
        document.querySelectorAll('.hint-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const hint = e.target.closest('.guide-hint');
                if (hint) {
                    this.closeHint(hint);
                }
            });
        });
    }
    
    // ================ NAVIGATION METHODS ================
    
    setupNavigation() {
        console.log("🔧 Setting up navigation");
        
        // Mobile menu toggle
        const menuBtn = document.querySelector('.nav-menu-btn');
        const mobileNav = document.querySelector('.mobile-nav');
        
        if (menuBtn && mobileNav) {
            menuBtn.addEventListener('click', () => {
                const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
                menuBtn.setAttribute('aria-expanded', !isExpanded);
                mobileNav.hidden = isExpanded;
            });
        }
        
        // Search overlay functionality
        this.setupSearchOverlay();
    }
    
    setupSearchOverlay() {
        console.log("🎯 Setting up search overlay");
        
        const searchBtn = document.querySelector('.nav-search-btn');
        const searchOverlay = document.querySelector('.search-overlay');
        
        if (!searchBtn || !searchOverlay) {
            console.error("❌ Search overlay elements missing!");
            return;
        }
        
        // Initialize overlay as hidden
        this.closeSearchOverlay();
        
        // Open search overlay
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openSearchOverlay();
        });
        
        // Close search overlay with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !searchOverlay.hidden) {
                this.closeSearchOverlay();
            }
        });
        
        // Handle search form submission
        const searchForm = document.querySelector('.search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const searchInput = document.querySelector('#global-search');
                const searchTerm = searchInput?.value.trim();
                
                if (searchTerm) {
                    this.closeSearchOverlay();
                    
                    // Set search and apply filters
                    const mainSearch = document.getElementById('ebook-search');
                    if (mainSearch) {
                        mainSearch.value = searchTerm;
                        this.currentFilters.search = searchTerm;
                        this.applyFilters();
                    }
                }
            });
        }
    }
    
    openSearchOverlay() {
        console.log("🔓 Opening search overlay");
        const searchOverlay = document.querySelector('.search-overlay');
        const searchInput = document.querySelector('#global-search');
        
        if (searchOverlay) {
            searchOverlay.hidden = false;
            searchOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
        
        if (searchInput) {
            setTimeout(() => {
                searchInput.focus();
                searchInput.select();
            }, 100);
        }
    }
    
    closeSearchOverlay() {
        console.log("🔒 Closing search overlay");
        const searchOverlay = document.querySelector('.search-overlay');
        const searchInput = document.querySelector('#global-search');
        
        if (searchOverlay) {
            searchOverlay.hidden = true;
            searchOverlay.style.display = 'none';
            document.body.style.overflow = '';
        }
        
        if (searchInput) {
            searchInput.blur();
        }
    }
    
    // ================ DATA METHODS ================
    
    async loadData() {
        console.log("📥 Loading ebook data");
        
        try {
            console.log("📡 Making API call to /ebooks");
            this.books = await api.get("/ebooks");
            
            console.log(`✅ Successfully loaded ${this.books.length} books`);
            
            // Extract metadata
            this.books.forEach(book => {
                if (book.category) this.categories.add(book.category);
                if (book.series) this.series.add(book.series);
                if (book.author) this.authors.add(book.author);
            });
            
            console.log("📊 Extracted metadata:", {
                categories: this.categories.size,
                series: this.series.size,
                authors: this.authors.size
            });
            
            // Set initial filtered books
            this.filteredBooks = [...this.books];
            console.log(`📚 Initial filtered books: ${this.filteredBooks.length}`);
            
            // Sort by newest first (default)
            this.sortBooks();
            
        } catch (error) {
            console.error("❌ Failed to load ebooks:", error);
            
            // Show user-friendly error
            this.showToast('Failed to load ebooks. Please try again later.', 'error');
            
            // Create demo data
            this.createDemoData();
        }
    }
    
    createDemoData() {
        console.log("📝 Creating demo data for development");
        
        this.books = [
            {
                id: '1',
                title: 'The Power of Prayer',
                author: 'John Smith',
                category: 'Prayer',
                description: 'A comprehensive guide to developing a powerful prayer life.',
                cover_url: 'https://via.placeholder.com/400x600/f5f5f7/8e8e93?text=Power+of+Prayer',
                download_count: 1250,
                read_time_minutes: 45,
                featured: true,
                created_at: '2024-01-15'
            },
            {
                id: '2',
                title: 'Bible Study Fundamentals',
                author: 'Sarah Johnson',
                category: 'Bible Study',
                description: 'Learn how to study the Bible effectively and apply its teachings.',
                cover_url: 'https://via.placeholder.com/400x600/f5f5f7/8e8e93?text=Bible+Study',
                download_count: 980,
                read_time_minutes: 60,
                featured: true,
                created_at: '2024-02-10'
            },
            {
                id: '3',
                title: 'Growing in Faith',
                author: 'Michael Brown',
                category: 'Spiritual Growth',
                description: 'Practical steps for spiritual maturity and Christian living.',
                cover_url: 'https://via.placeholder.com/400x600/f5f5f7/8e8e93?text=Growing+in+Faith',
                download_count: 750,
                read_time_minutes: 50,
                featured: false,
                created_at: '2024-03-05'
            }
        ];
        
        // Extract metadata
        this.books.forEach(book => {
            if (book.category) this.categories.add(book.category);
            if (book.author) this.authors.add(book.author);
        });
        
        // Set initial filtered books
        this.filteredBooks = [...this.books];
        this.sortBooks();
        
        console.log("✅ Demo data created with", this.books.length, "books");
    }
    
    sortBooks() {
        console.log(`🔄 Sorting books by: ${this.currentFilters.sort}`);
        
        switch (this.currentFilters.sort) {
            case 'newest':
                this.filteredBooks.sort((a, b) => 
                    new Date(b.created_at) - new Date(a.created_at)
                );
                break;
            case 'popular':
                this.filteredBooks.sort((a, b) => 
                    (b.download_count || 0) - (a.download_count || 0)
                );
                break;
            case 'title':
                this.filteredBooks.sort((a, b) => 
                    (a.title || '').localeCompare(b.title || '')
                );
                break;
            case 'author':
                this.filteredBooks.sort((a, b) => 
                    (a.author || '').localeCompare(b.author || '')
                );
                break;
            default:
                this.filteredBooks.sort((a, b) => 
                    new Date(b.created_at) - new Date(a.created_at)
                );
        }
    }
    
    // ================ EVENT LISTENERS ================
    
    setupEventListeners() {
        console.log("🎮 Setting up event listeners");
        
        // Search input with debouncing
        const searchInput = document.getElementById('ebook-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const value = e.target.value;
                clearTimeout(this.performanceMetrics.searchDebounceTimer);
                
                this.performanceMetrics.searchDebounceTimer = setTimeout(() => {
                    console.log(`🔍 Debounced search: "${value}"`);
                    this.currentFilters.search = value;
                    this.applyFilters();
                }, 350);
            });
            
            // Clear search button
            const clearBtn = document.querySelector('.search-clear-btn');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    console.log("🧹 Clearing main search");
                    searchInput.value = '';
                    this.currentFilters.search = '';
                    this.applyFilters();
                    searchInput.focus();
                });
            }
        }
        
        // Filters
        const filters = {
            category: document.getElementById('category-filter'),
            series: document.getElementById('series-filter'),
            author: document.getElementById('author-filter'),
            sort: document.getElementById('sort-filter')
        };
        
        Object.entries(filters).forEach(([name, element]) => {
            if (element) {
                element.addEventListener('change', (e) => {
                    console.log(`🔄 ${name} filter changed: "${e.target.value}"`);
                    this.currentFilters[name] = e.target.value;
                    this.applyFilters();
                });
            }
        });
        
        // Clear all filters button
        const clearFiltersBtn = document.getElementById('clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                console.log("🗑️ Clearing all filters");
                this.clearAllFilters();
            });
        }
        
        // View toggle buttons
        const viewBtns = document.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                console.log(`👁️ Switching to ${view} view`);
                this.switchView(view);
            });
        });
        
        // Load more button
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                console.log("⬇️ Loading more books");
                this.loadMore();
            });
        }
        
        console.log("✅ All event listeners setup complete");
    }
    
    clearAllFilters() {
        console.log("🔄 Clearing all filters");
        
        // Reset all filters
        this.currentFilters = {
            category: '',
            series: '',
            author: '',
            search: '',
            sort: 'newest'
        };
        
        // Reset UI elements
        const elements = {
            'ebook-search': 'search',
            'category-filter': 'category',
            'series-filter': 'series',
            'author-filter': 'author',
            'sort-filter': 'sort'
        };
        
        Object.entries(elements).forEach(([id, type]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = this.currentFilters[type];
            }
        });
        
        // Apply filters
        this.applyFilters();
    }
    
    // ================ FILTER METHODS ================
    
    applyFilters() {
        console.log("🔄 Applying filters");
        
        this.filteredBooks = [...this.books];
        
        // Apply search
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            this.filteredBooks = this.filteredBooks.filter(book => {
                return (
                    book.title?.toLowerCase().includes(searchTerm) ||
                    book.author?.toLowerCase().includes(searchTerm) ||
                    book.description?.toLowerCase().includes(searchTerm) ||
                    book.series?.toLowerCase().includes(searchTerm) ||
                    book.category?.toLowerCase().includes(searchTerm)
                );
            });
        }
        
        // Apply category filter
        if (this.currentFilters.category) {
            this.filteredBooks = this.filteredBooks.filter(
                book => book.category === this.currentFilters.category
            );
        }
        
        // Apply series filter
        if (this.currentFilters.series) {
            this.filteredBooks = this.filteredBooks.filter(
                book => book.series === this.currentFilters.series
            );
        }
        
        // Apply author filter
        if (this.currentFilters.author) {
            this.filteredBooks = this.filteredBooks.filter(
                book => book.author === this.currentFilters.author
            );
        }
        
        console.log(`📊 After filters: ${this.filteredBooks.length} books remaining`);
        
        // Apply sorting
        this.sortBooks();
        
        // Reset pagination
        this.currentPage = 1;
        
        // Re-render
        this.renderBooks();
        
        // Update results count
        this.updateResultsCount();
    }
    
    updateResultsCount() {
        const resultsCount = document.getElementById('ebooks-count');
        const noResults = document.getElementById('no-results');
        
        if (resultsCount) {
            resultsCount.textContent = this.filteredBooks.length;
        }
        
        if (noResults) {
            noResults.hidden = this.filteredBooks.length > 0;
        }
    }
    
    // ================ RENDER METHODS ================
    
    render() {
        console.log("🎨 Rendering UI components");
        
        // Render stats
        this.renderStats();
        
        // Render filters
        this.renderFilters();
        
        // Render books
        this.renderBooks();
        
        // Render featured books
        this.renderFeatured();
        
        // Render categories
        this.renderCategories();
        
        // Update results count
        this.updateResultsCount();
        
        console.log("✅ All UI components rendered");
    }
    
    renderStats() {
        const totalBooks = document.getElementById('total-ebooks');
        const totalAuthors = document.getElementById('total-authors');
        const totalSeries = document.getElementById('total-series');
        
        if (totalBooks) {
            totalBooks.textContent = this.books.length;
        }
        
        if (totalAuthors) {
            totalAuthors.textContent = this.authors.size;
        }
        
        if (totalSeries) {
            totalSeries.textContent = this.series.size;
        }
    }
    
    renderFilters() {
        // Populate category dropdown
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            const categories = [...this.categories].sort();
            categories.forEach(category => {
                const option = el('option', '', { value: category, text: category });
                categoryFilter.appendChild(option);
            });
        }
        
        // Populate series dropdown
        const seriesFilter = document.getElementById('series-filter');
        if (seriesFilter) {
            const series = [...this.series].sort();
            series.forEach(seriesName => {
                const option = el('option', '', { value: seriesName, text: seriesName });
                seriesFilter.appendChild(option);
            });
        }
        
        // Populate author dropdown
        const authorFilter = document.getElementById('author-filter');
        if (authorFilter) {
            const authors = [...this.authors].sort();
            authors.forEach(author => {
                const option = el('option', '', { value: author, text: author });
                authorFilter.appendChild(option);
            });
        }
    }
    
    renderBooks() {
        console.log("📚 Rendering books");
        
        const grid = document.getElementById('ebooks-grid');
        if (!grid) {
            console.error("❌ Ebooks grid element not found!");
            return;
        }
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const booksToShow = this.filteredBooks.slice(startIndex, endIndex);
        
        // Clear existing
        grid.innerHTML = '';
        
        if (booksToShow.length === 0) {
            const noResults = document.getElementById('no-results');
            if (noResults) noResults.hidden = false;
            return;
        }
        
        // Get current view type
        const currentView = grid.classList.contains('list-view') ? 'list' : 'grid';
        
        // Render each book
        booksToShow.forEach((book) => {
            const card = this.createBookCard(book, currentView);
            grid.appendChild(card);
        });
        
        // Update load more button
        this.updateLoadMoreButton();
        
        console.log(`✅ ${booksToShow.length} books rendered`);
    }
    
    createBookCard(book, view) {
        const isGridView = view !== 'list';
        
        if (isGridView) {
            return this.createBookGridItem(book);
        } else {
            return this.createBookListItem(book);
        }
    }
    
    createBookGridItem(book) {
        const card = el('div', 'ebook-card apple-style-grid-item');
        const optimizedImage = this.optimizeImageForSEO(book.cover_url);
        
        card.innerHTML = `
            <div class="ebook-cover-container" onclick="ebookLibrary.openBookDetailModal('${book.id}')">
                <div class="ebook-cover apple-cover" 
                     style="background-image: url('${optimizedImage}')"
                     aria-label="Click to view ${book.title} details">
                    ${book.featured ? '<span class="featured-badge">Featured</span>' : ''}
                    <div class="cover-overlay">
                        <span class="cover-hint">Click to view details</span>
                    </div>
                </div>
            </div>
            
            <div class="ebook-content apple-content">
                <h3 class="ebook-title apple-title" onclick="ebookLibrary.openBookDetailModal('${book.id}')" style="cursor: pointer;">${book.title}</h3>
                <p class="ebook-author apple-author">by ${book.author || 'Unknown Author'}</p>
                
                <div class="ebook-meta apple-meta">
                    ${book.category ? `<span class="ebook-category apple-category">${book.category}</span>` : ''}
                    ${book.read_time_minutes ? `<span class="ebook-duration apple-duration">${book.read_time_minutes} min read</span>` : ''}
                </div>
                
                <div class="ebook-stats apple-stats">
                    <span class="download-count">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="opacity: 0.6;">
                            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" 
                                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        ${this.formatNumber(book.download_count || 0)} reads
                    </span>
                </div>
                
                <div class="ebook-actions apple-actions">
                    <button class="btn-read apple-read-btn" onclick="ebookLibrary.readBookOnline('${book.id}', '${book.title}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 20H5C3.89543 20 3 19.1046 3 18V6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M8 10H16M8 14H12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M15 19L18 22L23 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Read Online
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }
    
    createBookListItem(book) {
        const item = el('div', 'ebook-card apple-list-item');
        const optimizedImage = this.optimizeImageForSEO(book.cover_url);
        
        item.innerHTML = `
            <div class="ebook-list-item-inner">
                <div class="list-cover-container" onclick="ebookLibrary.openBookDetailModal('${book.id}')">
                    <div class="list-cover" 
                         style="background-image: url('${optimizedImage}')"
                         aria-label="Click to view ${book.title} details">
                        <div class="cover-overlay">
                            <span class="cover-hint">Click to view</span>
                        </div>
                    </div>
                </div>
                
                <div class="list-content">
                    <div class="list-header">
                        <h3 class="list-title" onclick="ebookLibrary.openBookDetailModal('${book.id}')" style="cursor: pointer;">${book.title}</h3>
                        ${book.featured ? '<span class="featured-badge-list">Featured</span>' : ''}
                    </div>
                    
                    <p class="list-author">by ${book.author || 'Unknown Author'}</p>
                    
                    <div class="list-meta">
                        ${book.category ? `<span class="list-category">${book.category}</span>` : ''}
                        ${book.series ? `<span class="list-series">${book.series} Series</span>` : ''}
                        ${book.read_time_minutes ? `<span class="list-duration">${book.read_time_minutes} min read</span>` : ''}
                    </div>
                    
                    <p class="list-description">
                        ${book.description ? `${book.description.substring(0, 200)}...` : 'A Christian ebook for spiritual growth and Bible study.'}
                    </p>
                    
                    <div class="list-stats">
                        <span class="download-count-list">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="opacity: 0.6;">
                                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" 
                                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            ${this.formatNumber(book.download_count || 0)} reads
                        </span>
                    </div>
                    
                    <div class="list-actions">
                        <button class="btn-read-list" onclick="ebookLibrary.readBookOnline('${book.id}', '${book.title}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M12 20H5C3.89543 20 3 19.1046 3 18V6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M8 10H16M8 14H12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M15 19L18 22L23 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Read Online
                        </button>
                        
                        <button class="btn-share-list" onclick="ebookLibrary.openSocialSharingModal('${book.id}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24919 15.0227 5.37061L8.0826 9.84066C7.54305 9.32015 6.80891 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15C6.80891 15 7.54305 14.6798 8.0826 14.1593L15.0227 18.6294C15.0077 18.7508 15 18.8745 15 19C15 20.6569 16.3431 22 18 22C19.6569 22 21 20.6569

<path d="M15 19L18 22L23 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Share
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return item;
    }
    
    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('load-more-btn');
        const remainingCount = document.querySelector('.remaining-count');
        
        if (!loadMoreBtn) return;
        
        const loadedCount = this.currentPage * this.itemsPerPage;
        const totalCount = this.filteredBooks.length;
        const remaining = totalCount - loadedCount;
        
        if (loadedCount >= totalCount) {
            loadMoreBtn.hidden = true;
        } else {
            loadMoreBtn.hidden = false;
            loadMoreBtn.textContent = `Load More Ebooks`;
            if (remainingCount) {
                remainingCount.textContent = `(${remaining} remaining)`;
            }
        }
    }
    
    loadMore() {
        this.currentPage++;
        this.renderBooks();
    }
    
    switchView(view) {
        const grid = document.getElementById('ebooks-grid');
        const viewBtns = document.querySelectorAll('.view-btn');
        
        if (!grid) return;
        
        // Update active button
        viewBtns.forEach(btn => {
            const isActive = btn.dataset.view === view;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-checked', isActive);
        });
        
        // Update grid view
        grid.classList.remove('grid-view', 'list-view');
        grid.classList.add(view === 'list' ? 'list-view' : 'grid-view');
        
        // Re-render books with new view
        this.renderBooks();
    }
    
    renderFeatured() {
        const featuredContainer = document.getElementById('featured-ebooks');
        if (!featuredContainer) return;
        
        const featuredBooks = this.books
            .filter(book => book.featured)
            .slice(0, 4);
        
        if (featuredBooks.length === 0) {
            featuredContainer.style.display = 'none';
        } else {
            featuredContainer.style.display = '';
            featuredContainer.innerHTML = featuredBooks.map(book => `
                <div class="featured-card">
                    <div class="featured-cover" 
                         style="background-image: url('${this.optimizeImageForSEO(book.cover_url)}')"
                         onclick="ebookLibrary.openBookDetailModal('${book.id}')">
                        <div class="cover-overlay">
                            <span class="cover-hint">Click to view</span>
                        </div>
                    </div>
                    <div class="featured-content">
                        <div class="featured-badges">
                            <span class="badge featured">Featured</span>
                            ${book.category ? `<span class="badge">${book.category}</span>` : ''}
                        </div>
                        <h3 class="featured-title" onclick="ebookLibrary.openBookDetailModal('${book.id}')" style="cursor: pointer;">${book.title}</h3>
                        <p class="featured-author">by ${book.author || 'Unknown'}</p>
                        <div class="featured-actions">
                            <button class="btn-outline" onclick="ebookLibrary.readBookOnline('${book.id}', '${book.title}')">
                                Read Online
                            </button>
                            <button class="btn-outline btn-share" onclick="ebookLibrary.openSocialSharingModal('${book.id}')">
                                Share
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
    
    renderCategories() {
        const categoriesGrid = document.getElementById('categories-grid');
        if (!categoriesGrid) return;
        
        // Count books per category
        const categoryCounts = {};
        this.books.forEach(book => {
            if (book.category) {
                categoryCounts[book.category] = (categoryCounts[book.category] || 0) + 1;
            }
        });
        
        // Get top 6 categories
        const topCategories = [...this.categories]
            .sort((a, b) => (categoryCounts[b] || 0) - (categoryCounts[a] || 0))
            .slice(0, 6);
        
        categoriesGrid.innerHTML = topCategories.map(category => `
            <div class="category-card" onclick="ebookLibrary.filterByCategory('${category}')">
                <div class="category-icon">📚</div>
                <h3 class="category-name">${category}</h3>
                <p class="category-count">${categoryCounts[category] || 0} books</p>
            </div>
        `).join('');
    }
    
    filterByCategory(category) {
        this.currentFilters.category = category;
        document.getElementById('category-filter').value = category;
        this.applyFilters();
    }

    // ================ BOOK DETAIL MODAL ================

    createBookDetailModal() {
        console.log("📖 Creating book detail modal");
        
        // Check if modal already exists
        if (document.getElementById('book-detail-modal')) {
            console.log("ℹ️ Book detail modal already exists");
            return;
        }
        
        const modalHTML = `
            <div class="book-detail-modal" id="book-detail-modal" hidden style="display: none !important;">
                <div class="book-detail-overlay" onclick="ebookLibrary.closeBookDetailModal()"></div>
                <div class="book-detail-container">
                    <button class="book-detail-close" onclick="ebookLibrary.closeBookDetailModal()" aria-label="Close book details">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    
                    <div class="book-detail-content" id="book-detail-content">
                        <!-- Content will be loaded here -->
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to the body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Force it to stay hidden
        const modal = document.getElementById('book-detail-modal');
        if (modal) {
            modal.hidden = true;
            modal.style.display = 'none';
        }
        
        console.log("✅ Book detail modal created (hidden)");
        
        // Add CSS styles for the modal
        this.addBookDetailModalStyles();
    }

    addBookDetailModalStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            /* ============ BOOK DETAIL MODAL STYLES ============ */
            /* Optimized for all mobile screens - full width, reduced padding */
            
            /* Modal container - START HIDDEN */
            .book-detail-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                display: none !important; /* Start hidden */
                justify-content: center;
                align-items: flex-start;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
            }
            
            /* Only show when not hidden */
            .book-detail-modal:not([hidden]) {
                display: flex !important;
            }
            
            /* Overlay background */
            .book-detail-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
                z-index: 1;
            }
            
            /* Modal content container */
            .book-detail-container {
                position: relative;
                width: 100%;
                max-width: 800px;
                background: white;
                margin: 0;
                z-index: 2;
                min-height: 100vh;
                overflow-y: auto;
            }
            
            /* Close button - fixed position for mobile */
            .book-detail-close {
                position: fixed;
                top: 12px;
                right: 12px;
                width: 40px;
                height: 40px;
                background: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: none;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                z-index: 3;
                cursor: pointer;
            }
            
            /* Content area - optimized padding for mobile */
            .book-detail-content {
                padding: 16px;
            }
            
            /* ============ MOBILE OPTIMIZATIONS ============ */
            
            /* Small phones (up to 375px) */
            @media (max-width: 375px) {
                .book-detail-content {
                    padding: 12px;
                }
                
                .book-detail-close {
                    top: 8px;
                    right: 8px;
                    width: 36px;
                    height: 36px;
                }
            }
            
            /* Tablets and larger phones (376px to 767px) */
            @media (min-width: 376px) and (max-width: 767px) {
                .book-detail-content {
                    padding: 14px;
                }
                
                .book-detail-close {
                    top: 10px;
                    right: 10px;
                }
            }
            
            /* Desktop and tablet landscape (768px and up) */
            @media (min-width: 768px) {
                .book-detail-container {
                    margin: 20px;
                    border-radius: 16px;
                    min-height: auto;
                    max-height: 90vh;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                }
                
                .book-detail-close {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                }
                
                .book-detail-content {
                    padding: 20px;
                }
            }
            
            /* ============ MODAL LAYOUT ============ */
            
            /* Book detail layout */
            .book-detail-layout {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            
            /* Desktop layout */
            @media (min-width: 768px) {
                .book-detail-layout {
                    flex-direction: row;
                    gap: 24px;
                }
                
                .detail-left-column {
                    flex: 0 0 280px;
                }
                
                .detail-right-column {
                    flex: 1;
                }
            }
            
            /* ============ COVER IMAGE ============ */
            
            .detail-cover-container {
                margin-bottom: 16px;
            }
            
            .detail-cover {
                width: 100%;
                height: 300px;
                border-radius: 12px;
                background-size: cover;
                background-position: center;
                position: relative;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            }
            
            /* Mobile cover adjustments */
            @media (max-width: 767px) {
                .detail-cover {
                    height: 250px;
                    border-radius: 8px;
                }
            }
            
            @media (max-width: 375px) {
                .detail-cover {
                    height: 220px;
                }
            }
            
            .detail-featured-badge {
                position: absolute;
                top: 10px;
                right: 10px;
                background: #FF3B30;
                color: white;
                padding: 4px 10px;
                border-radius: 16px;
                font-size: 11px;
                font-weight: 600;
            }
            
            /* ============ STATS ============ */
            
            .detail-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                margin-bottom: 20px;
                text-align: center;
            }
            
            @media (max-width: 375px) {
                .detail-stats {
                    gap: 8px;
                    margin-bottom: 16px;
                }
            }
            
            .stat-item {
                background: #f8f8f8;
                padding: 12px 6px;
                border-radius: 8px;
            }
            
            @media (max-width: 375px) {
                .stat-item {
                    padding: 10px 4px;
                }
            }
            
            .stat-value {
                display: block;
                font-size: 18px;
                font-weight: 700;
                color: #007AFF;
                margin-bottom: 4px;
            }
            
            @media (max-width: 375px) {
                .stat-value {
                    font-size: 16px;
                }
            }
            
            .stat-label {
                display: block;
                font-size: 11px;
                color: #666;
            }
            
            @media (max-width: 375px) {
                .stat-label {
                    font-size: 10px;
                }
            }
            
            /* ============ ACTION BUTTONS ============ */
            
            .detail-actions {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-bottom: 20px;
            }
            
            @media (max-width: 375px) {
                .detail-actions {
                    gap: 8px;
                    margin-bottom: 16px;
                }
            }
            
            .detail-action-btn {
                width: 100%;
                padding: 14px;
                border-radius: 10px;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                font-weight: 600;
                font-size: 15px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            @media (max-width: 375px) {
                .detail-action-btn {
                    padding: 12px;
                    font-size: 14px;
                }
            }
            
            .read-btn {
                background: #34C759;
                color: white;
            }
            
            .read-btn:hover {
                background: #2DA84A;
            }
            
            .share-btn {
                background: #007AFF;
                color: white;
            }
            
            .share-btn:hover {
                background: #0056CC;
            }
            
            /* ============ BOOK HEADER ============ */
            
            .book-header {
                margin-bottom: 20px;
            }
            
            @media (max-width: 375px) {
                .book-header {
                    margin-bottom: 16px;
                }
            }
            
            .book-title {
                font-size: 22px;
                font-weight: 700;
                margin-bottom: 6px;
                color: #1D1D1F;
                line-height: 1.3;
            }
            
            @media (max-width: 767px) {
                .book-title {
                    font-size: 20px;
                }
            }
            
            @media (max-width: 375px) {
                .book-title {
                    font-size: 18px;
                }
            }
            
            .book-author {
                font-size: 15px;
                color: #666;
                margin-bottom: 14px;
            }
            
            @media (max-width: 375px) {
                .book-author {
                    font-size: 14px;
                    margin-bottom: 12px;
                }
            }
            
            .book-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-bottom: 14px;
            }
            
            @media (max-width: 375px) {
                .book-meta {
                    gap: 4px;
                    margin-bottom: 12px;
                }
            }
            
            .meta-badge {
                padding: 5px 10px;
                background: #f8f8f8;
                border-radius: 16px;
                font-size: 11px;
                font-weight: 600;
                color: #666;
            }
            
            @media (max-width: 375px) {
                .meta-badge {
                    padding: 4px 8px;
                    font-size: 10px;
                }
            }
            
            /* ============ BOOK DESCRIPTION ============ */
            
            .book-description-section {
                margin-bottom: 20px;
            }
            
            @media (max-width: 375px) {
                .book-description-section {
                    margin-bottom: 16px;
                }
            }
            
            .book-description-section h3 {
                font-size: 17px;
                font-weight: 600;
                margin-bottom: 10px;
                color: #1D1D1F;
            }
            
            @media (max-width: 375px) {
                .book-description-section h3 {
                    font-size: 16px;
                    margin-bottom: 8px;
                }
            }
            
            .book-description {
                line-height: 1.6;
                color: #333;
                font-size: 15px;
            }
            
            @media (max-width: 375px) {
                .book-description {
                    font-size: 14px;
                    line-height: 1.5;
                }
            }
            
            /* ============ RELATED BOOKS ============ */
            
            .related-books-section {
                margin-top: 20px;
            }
            
            @media (max-width: 375px) {
                .related-books-section {
                    margin-top: 16px;
                }
            }
            
            .related-books-section h3 {
                font-size: 17px;
                font-weight: 600;
                margin-bottom: 12px;
                color: #1D1D1F;
            }
            
            @media (max-width: 375px) {
                .related-books-section h3 {
                    font-size: 16px;
                    margin-bottom: 10px;
                }
            }
            
            .related-books-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
            }
            
            @media (max-width: 375px) {
                .related-books-grid {
                    gap: 8px;
                }
            }
            
            .related-book-card {
                background: #f8f8f8;
                border-radius: 8px;
                overflow: hidden;
                cursor: pointer;
                transition: transform 0.2s ease;
            }
            
            .related-book-card:hover {
                transform: translateY(-2px);
            }
            
            .related-book-cover {
                width: 100%;
                height: 100px;
                background-size: cover;
                background-position: center;
            }
            
            @media (max-width: 375px) {
                .related-book-cover {
                    height: 80px;
                }
            }
            
            .related-book-info {
                padding: 10px;
            }
            
            @media (max-width: 375px) {
                .related-book-info {
                    padding: 8px;
                }
            }
            
            .related-book-info h4 {
                font-size: 13px;
                font-weight: 600;
                margin-bottom: 4px;
                color: #1D1D1F;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            
            @media (max-width: 375px) {
                .related-book-info h4 {
                    font-size: 12px;
                }
            }
            
            .related-book-info p {
                font-size: 11px;
                color: #666;
            }
            
            @media (max-width: 375px) {
                .related-book-info p {
                    font-size: 10px;
                }
            }
            
            /* ============ COVER OVERLAY HINTS ============ */
            
            .cover-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
                border-radius: inherit;
            }
            
            .ebook-cover:hover .cover-overlay,
            .featured-cover:hover .cover-overlay,
            .list-cover:hover .cover-overlay {
                opacity: 1;
            }
            
            .cover-hint {
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 6px 12px;
                border-radius: 16px;
                font-size: 12px;
                font-weight: 600;
            }
            
            @media (max-width: 375px) {
                .cover-hint {
                    padding: 4px 10px;
                    font-size: 11px;
                }
            }
            
            /* ============ LOADING STATE ============ */
            
            .book-detail-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 300px;
                gap: 16px;
            }
            
            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #007AFF;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* ============ ACCESSIBILITY ============ */
            
            /* Focus states */
            .detail-action-btn:focus-visible,
            .book-detail-close:focus-visible {
                outline: 3px solid rgba(0, 122, 255, 0.5);
                outline-offset: 2px;
            }
            
            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
                .book-detail-modal,
                .detail-action-btn,
                .related-book-card {
                    transition: none;
                }
                
                .related-book-card:hover {
                    transform: none;
                }
                
                .loading-spinner {
                    animation: none;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    openBookDetailModal(bookId) {
        console.log("📖 Opening book detail modal");
        
        const book = this.books.find(b => b.id === bookId);
        if (!book) {
            this.showToast('Book not found', 'error');
            return;
        }
        
        // Show loading state
        this.showBookDetailLoading();
        
        // Load book data and show modal
        this.loadBookDetail(book);
    }

    showBookDetailLoading() {
        const modal = document.getElementById('book-detail-modal');
        const contentDiv = document.getElementById('book-detail-content');
        
        contentDiv.innerHTML = `
            <div class="book-detail-loading">
                <div class="loading-spinner"></div>
                <p>Loading book details...</p>
            </div>
        `;
        
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    loadBookDetail(book) {
        console.log(`📥 Loading book details for: "${book.title}"`);
        
        // Format date
        const formatDate = (dateString) => {
            if (!dateString) return 'Recently added';
            const date = new Date(dateString);
            return `Added ${date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}`;
        };
        
        // Find related books (same category)
        const relatedBooks = this.books
            .filter(b => b.id !== book.id && b.category === book.category)
            .slice(0, 4);
        
        // Generate related books HTML
        let relatedBooksHTML = '';
        if (relatedBooks.length > 0) {
            relatedBooksHTML = `
                <div class="related-books-section">
                    <h3>Related Books</h3>
                    <div class="related-books-grid">
                        ${relatedBooks.map(relatedBook => `
                            <div class="related-book-card" onclick="ebookLibrary.openBookDetailModal('${relatedBook.id}')">
                                <div class="related-book-cover" 
                                     style="background-image: url('${this.optimizeImageForSEO(relatedBook.cover_url)}')">
                                </div>
                                <div class="related-book-info">
                                    <h4>${relatedBook.title}</h4>
                                    <p>${relatedBook.author || 'Unknown Author'}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Generate the full book detail HTML - optimized for mobile
        const contentDiv = document.getElementById('book-detail-content');
        contentDiv.innerHTML = `
            <div class="book-detail-layout">
                <!-- Left Column: Cover & Actions -->
                <div class="detail-left-column">
                    <div class="detail-cover-container">
                        <div class="detail-cover" 
                             style="background-image: url('${this.optimizeImageForSEO(book.cover_url)}')">
                            ${book.featured ? '<span class="detail-featured-badge">Featured</span>' : ''}
                        </div>
                    </div>
                    
                    <div class="detail-stats">
                        <div class="stat-item">
                            <span class="stat-value">${book.read_time_minutes || 0}</span>
                            <span class="stat-label">Minutes</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${book.download_count || 0}</span>
                            <span class="stat-label">Reads</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">Online</span>
                            <span class="stat-label">Format</span>
                        </div>
                    </div>
                    
                    <div class="detail-actions">
                        <button class="detail-action-btn read-btn" onclick="ebookLibrary.readBookOnline('${book.id}', '${book.title}')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M12 20H5C3.89543 20 3 19.1046 3 18V6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M8 10H16M8 14H12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M15 19L18 22L23 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Read Online
                        </button>
                        
                        <button class="detail-action-btn share-btn" onclick="ebookLibrary.openSocialSharingModal('${book.id}')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24919 15.0227 5.37061L8.0826 9.84066C7.54305 9.32015 6.80891 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15C6.80891 15 7.54305 14.6798 8.0826 14.1593L15.0227 18.6294C15.0077 18.7508 15 18.8745 15 19C15 20.6569 16.3431 22 18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C17.1911 16 16.4569 16.3202 15.9174 16.8407L8.97727 12.3706C8.99229 12.2492 9 12.1255 9 12C9 11.8745 8.99229 11.7508 8.97727 11.6294L15.9174 7.15934C16.4569 7.67985 17.1911 8 18 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Share Book
                        </button>
                    </div>
                </div>
                
                <!-- Right Column: Book Info -->
                <div class="detail-right-column">
                    <div class="book-header">
                        <h1 class="book-title">${book.title}</h1>
                        <p class="book-author">by ${book.author || 'Unknown Author'}</p>
                        
                        <div class="book-meta">
                            ${book.category ? `<span class="meta-badge category">${book.category}</span>` : ''}
                            ${book.series ? `<span class="meta-badge series">${book.series}</span>` : ''}
                            ${book.read_time_minutes ? `<span class="meta-badge duration">${book.read_time_minutes} min read</span>` : ''}
                        </div>
                    </div>
                    
                    <div class="book-description-section">
                        <h3>Description</h3>
                        <div class="book-description">
                            ${book.description || 'No description available for this book.'}
                        </div>
                    </div>
                    
                    ${relatedBooksHTML}
                </div>
            </div>
        `;
        
        // Scroll to top of modal content
        contentDiv.scrollTop = 0;
    }

    closeBookDetailModal() {
        const modal = document.getElementById('book-detail-modal');
        modal.hidden = true;
        document.body.style.overflow = '';
    }

    // ================ SOCIAL SHARING MODAL ================
    
    createSocialSharingModal() {
        console.log("📱 Creating social sharing modal");
        
        const modalHTML = `
            <div class="social-sharing-modal" id="social-sharing-modal" hidden>
                <div class="social-sharing-overlay" onclick="ebookLibrary.closeSocialSharingModal()"></div>
                <div class="social-sharing-container">
                    <button class="social-sharing-close" onclick="ebookLibrary.closeSocialSharingModal()" aria-label="Close sharing options">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    
                    <div class="social-sharing-content" id="social-sharing-content">
                        <!-- Content will be loaded here -->
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to the body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    openSocialSharingModal(bookId) {
        console.log("📱 Opening social sharing modal for book:", bookId);
        
        const book = this.books.find(b => b.id === bookId);
        if (!book) {
            this.showToast('Book not found', 'error');
            return;
        }
        
        // Show loading state
        this.showSocialSharingLoading();
        
        // Load sharing options
        this.loadSharingOptions(book);
    }
    
    showSocialSharingLoading() {
        const modal = document.getElementById('social-sharing-modal');
        const contentDiv = document.getElementById('social-sharing-content');
        
        contentDiv.innerHTML = `
            <div class="social-sharing-loading">
                <div class="loading-spinner"></div>
                <p>Loading sharing options...</p>
            </div>
        `;
        
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
    }
    
    loadSharingOptions(book) {
        console.log(`📤 Loading sharing options for: "${book.title}"`);
        
        // Generate shareable URL
        const shareUrl = `${window.location.origin}/ebooks/book/${this.generateSlug(book.title)}?id=${book.id}`;
        const shareText = `Check out "${book.title}" - a free Christian ebook by ${book.author || 'Unknown Author'}`;
        
        // Generate the sharing HTML
        const contentDiv = document.getElementById('social-sharing-content');
        contentDiv.innerHTML = `
            <div class="social-sharing-header">
                <h2 class="social-sharing-title">Share This Book</h2>
                <p class="social-sharing-subtitle">Spread the word about this free Christian ebook</p>
            </div>
            
            <div class="share-link-section">
                <h3 class="share-link-title">Shareable Link</h3>
                <div class="share-link-container">
                    <input type="text" class="share-link-input" value="${shareUrl}" readonly id="share-link-input">
                    <button class="copy-link-btn" onclick="ebookLibrary.copyToClipboard('share-link-input', 'Link')">Copy Link</button>
                </div>
                <div id="copy-success-message" class="copy-success" hidden>Link copied to clipboard!</div>
            </div>
            
            <div class="sharing-actions">
                <button class="btn-share-action facebook" onclick="ebookLibrary.shareToFacebook('${book.id}')">
                    Facebook
                </button>
                <button class="btn-share-action twitter" onclick="ebookLibrary.shareToTwitter('${book.id}')">
                    Twitter
                </button>
                <button class="btn-share-action whatsapp" onclick="ebookLibrary.shareToWhatsApp('${book.id}')">
                    WhatsApp
                </button>
                <button class="btn-share-action email" onclick="ebookLibrary.shareViaEmail('${book.id}')">
                    Email
                </button>
            </div>
        `;
    }
    
    closeSocialSharingModal() {
        const modal = document.getElementById('social-sharing-modal');
        modal.hidden = true;
        document.body.style.overflow = '';
    }
    
    // ================ SHARING METHODS ================
    
    shareToFacebook(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book) return;
        
        const shareUrl = `${window.location.origin}/ebooks/book/${this.generateSlug(book.title)}?id=${book.id}`;
        const shareText = `Check out "${book.title}" - a free Christian ebook by ${book.author || 'Unknown Author'}`;
        
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        window.open(facebookUrl, '_blank', 'width=600,height=400');
    }
    
    shareToTwitter(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book) return;
        
        const shareUrl = `${window.location.origin}/ebooks/book/${this.generateSlug(book.title)}?id=${book.id}`;
        const shareText = `Check out "${book.title}" - a free Christian ebook by ${book.author || 'Unknown Author'}`;
        
        const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        window.open(twitterUrl, '_blank', 'width=600,height=400');
    }
    
    shareToWhatsApp(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book) return;
        
        const shareUrl = `${window.location.origin}/ebooks/book/${this.generateSl book.title)}?id=${book.id}`;
        const shareText = `Check out "${book.title}" - a free Christian ebook by ${book.author || 'Unknown Author'}. ${shareUrl}`;
        
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank', 'width=600,height=400');
    }
    
    shareViaEmail(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book) return;
        
        const shareUrl = `${window.location.origin}/ebooks/book/${this.generateSlug(book.title)}?id=${book.id}`;
        const subject = 'Free Christian Ebook Recommendation';
        const body = `I found this free Christian ebook that you might like:\n\n"${book.title}" by ${book.author || 'Unknown Author'}\n\n${book.description ? book.description.substring(0, 200) + '...' : 'A great Christian ebook for spiritual growth.'}\n\nRead it here: ${shareUrl}`;
        
        const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = emailUrl;
    }
    
    copyToClipboard(elementId, type) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.select();
        element.setSelectionRange(0, 99999);
        
        try {
            document.execCommand('copy');
            this.showToast(`${type} copied to clipboard!`, 'success');
            
            // Show success message in modal
            const successElement = document.getElementById('copy-success-message');
            if (successElement) {
                successElement.hidden = false;
                setTimeout(() => {
                    successElement.hidden = true;
                }, 3000);
            }
        } catch (err) {
            console.error('Copy failed:', err);
            this.showToast(`Failed to copy ${type.toLowerCase()}`, 'error');
        }
    }
    
    // ================ READ BOOK METHOD ================
    
    async readBookOnline(bookId, bookTitle) {
        console.log(`👁️ Reading book online: "${bookTitle}"`);
        
        const book = this.books.find(b => b.id === bookId);
        if (!book) {
            this.showToast('Book not found');
            return;
        }
        
        // Track read event
        try {
            await api.post(`/ebooks/${bookId}/read`);
        } catch (error) {
            console.error("⚠️ Failed to track read event:", error);
        }
        
        // Show reading interface
        this.showReadingInterface(book);
    }
    
    showReadingInterface(book) {
        // Create reading interface
        const readingHTML = `
            <div class="reading-interface" id="reading-interface">
                <div class="reading-header">
                    <button class="reading-close" onclick="ebookLibrary.closeReadingInterface()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Back to Library
                    </button>
                    <h2 class="reading-title">${book.title}</h2>
                </div>
                
                <div class="reading-content">
                    <div class="book-info">
                        <h3>${book.title}</h3>
                        <p class="book-author">by ${book.author || 'Unknown Author'}</p>
                        ${book.category ? `<p class="book-category">Category: ${book.category}</p>` : ''}
                    </div>
                    
                    <div class="book-text">
                        ${book.description ? `
                            <p>${book.description}</p>
                            <p>This is a preview of "${book.title}". The full content is available for online reading.</p>
                        ` : `
                            <p>Welcome to "${book.title}" by ${book.author || 'Unknown Author'}.</p>
                            <p>This Christian ebook is available for online reading. Scroll through the content below.</p>
                        `}
                        
                        <!-- Sample content for demonstration -->
                        <div class="sample-content">
                            <h4>Introduction</h4>
                            <p>In this book, we explore spiritual truths and practical applications for Christian living. Each chapter provides insights and guidance for your faith journey.</p>
                            
                            <h4>Chapter 1: Getting Started</h4>
                            <p>The journey of faith begins with a simple step of trust. As you read through these pages, may you find encouragement and strength for your walk with God.</p>
                            
                            <p>Remember that spiritual growth is a process, not an event. Be patient with yourself and trust in God's timing for your development.</p>
                            
                            <h4>Continuing Your Reading</h4>
                            <p>This is a sample of the content available in this book. The full text continues with additional chapters covering various aspects of Christian living and spiritual growth.</p>
                        </div>
                    </div>
                </div>
                
                <div class="reading-footer">
                    <div class="reading-controls">
                        <button class="btn-outline" onclick="ebookLibrary.openSocialSharingModal('${book.id}')">
                            Share This Book
                        </button>
                        <div class="reading-progress">
                            <span>Reading progress: 25%</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: 25%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add reading interface to the body
        document.body.insertAdjacentHTML('beforeend', readingHTML);
        
        // Add styles for reading interface
        const styles = document.createElement('style');
        styles.textContent = `
            .reading-interface {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: white;
                z-index: 10000;
                display: flex;
                flex-direction: column;
            }
            
            .reading-header {
                padding: 20px;
                background: #f8f8f8;
                border-bottom: 1px solid #e8e8e8;
                display: flex;
                align-items: center;
                gap: 20px;
            }
            
            .reading-close {
                background: none;
                border: none;
                color: #007AFF;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .reading-title {
                font-size: 18px;
                font-weight: 600;
                margin: 0;
                color: #1D1D1F;
            }
            
            .reading-content {
                flex: 1;
                overflow-y: auto;
                padding: 30px;
                max-width: 800px;
                margin: 0 auto;
                width: 100%;
            }
            
            .book-info {
                margin-bottom: 30px;
                text-align: center;
            }
            
            .book-info h3 {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 10px;
                color: #1D1D1F;
            }
            
            .book-author {
                font-size: 18px;
                color: #666;
                margin-bottom: 10px;
            }
            
            .book-category {
                font-size: 14px;
                color: #999;
            }
            
            .book-text {
                line-height: 1.8;
                font-size: 18px;
                color: #333;
            }
            
            .book-text h4 {
                font-size: 22px;
                font-weight: 600;
                margin: 30px 0 15px 0;
                color: #1D1D1F;
            }
            
            .sample-content {
                margin-top: 40px;
            }
            
            .reading-footer {
                padding: 20px;
                background: #f8f8f8;
                border-top: 1px solid #e8e8e8;
            }
            
            .reading-controls {
                display: flex;
                justify-content: space-between;
                align-items: center;
                max-width: 800px;
                margin: 0 auto;
                width: 100%;
            }
            
            .reading-progress {
                display: flex;
                flex-direction: column;
                gap: 8px;
                align-items: flex-end;
            }
            
            .reading-progress span {
                font-size: 14px;
                color: #666;
            }
            
            .progress-bar {
                width: 200px;
                height: 8px;
                background: #e8e8e8;
                border-radius: 4px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: #34C759;
                border-radius: 4px;
            }
            
            @media (max-width: 767px) {
                .reading-content {
                    padding: 20px;
                }
                
                .reading-controls {
                    flex-direction: column;
                    gap: 20px;
                }
                
                .reading-progress {
                    align-items: center;
                }
            }
        `;
        document.head.appendChild(styles);
        
        // Hide other content
        document.body.style.overflow = 'hidden';
    }
    
    closeReadingInterface() {
        const readingInterface = document.getElementById('reading-interface');
        if (readingInterface) {
            readingInterface.remove();
        }
        document.body.style.overflow = '';
    }
    
    // ================ HELPER METHODS ================
    
    optimizeImageForSEO(url) {
        if (!url) {
            return 'https://via.placeholder.com/400x600/f5f5f7/8e8e93?text=Christian+Ebook';
        }
        
        // Optimize Cloudinary URLs
        if (url.includes('cloudinary.com') && url.includes('/upload/')) {
            return url.replace('/upload/', '/upload/f_auto,q_auto,w_400,c_fill/');
        }
        
        return url;
    }
    
    generateSlug(text) {
        if (!text) return 'christian-ebook';
        
        return text.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
    
    formatNumber(num) {
        if (!num) return '0';
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    }
    
    formatFileSize(bytes) {
        if (!bytes) return '';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }
    
    // ================ TOAST NOTIFICATION ================
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `seo-toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Close notification">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        `;
        
        // Add styles
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: ${type === 'success' ? '#34C759' : type === 'error' ? '#FF3B30' : '#007AFF'};
            color: white;
            padding: 12px 20px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 10000;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            animation: toastSlideIn 0.3s ease;
            max-width: 400px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;
        
        document.body.appendChild(toast);
        
        // Add close button functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.removeToast(toast);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            this.removeToast(toast);
        }, 5000);
    }
    
    removeToast(toast) {
        toast.style.animation = 'toastSlideOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }
    
    // ================ PERFORMANCE MONITORING ================
    
    setupPerformanceMonitoring() {
        // Track page load time
        window.addEventListener('load', () => {
            const loadTime = Date.now() - this.performanceMetrics.pageLoadStart;
            console.log(`⚡ Page loaded in ${loadTime}ms`);
        });
    }
    
    // ================ DEBUGGING METHODS ================
    
    debugState() {
        console.log("🔍 Debugging EbooksLibrary State");
        console.group("Library State");
        
        console.log("📚 Books:", {
            total: this.books.length,
            filtered: this.filteredBooks.length,
            firstBook: this.books[0]?.title || 'none'
        });
        
        console.log("🎯 Filters:", this.currentFilters);
        
        console.log("📊 Metadata:", {
            categories: this.categories.size,
            series: this.series.size,
            authors: this.authors.size
        });
        
        console.log("📄 Pagination:", {
            currentPage: this.currentPage,
            itemsPerPage: this.itemsPerPage,
            loadedCount: this.currentPage * this.itemsPerPage
        });
        
        console.groupEnd();
        return this;
    }

    // ================ SEO OPTIMIZATION METHODS ================

    enhanceSEO() {
        console.log("🔍 Enhancing SEO for ebooks library");
        
        // Add meta description if not present
        this.addMetaDescription();
        
        // Add structured data for books
        this.addStructuredData();
        
        // Optimize images for SEO
        this.optimizeAllImages();
        
        // Add canonical URLs
        this.addCanonicalUrls();
        
        // Enhance accessibility
        this.enhanceAccessibility();
    }
    
    addMetaDescription() {
        if (!document.querySelector('meta[name="description"]')) {
            const meta = document.createElement('meta');
            meta.name = 'description';
            meta.content = `Browse our collection of ${this.books.length} free Christian ebooks on prayer, Bible study, spiritual growth, and more. Download or read online.`;
            document.head.appendChild(meta);
        }
    }
    
    addStructuredData() {
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Christian Ebooks Library",
            "description": "Free Christian ebooks for spiritual growth and Bible study",
            "numberOfItems": this.books.length,
            "mainEntity": {
                "@type": "ItemList",
                "itemListElement": this.books.slice(0, 10).map((book, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "item": {
                        "@type": "Book",
                        "name": book.title,
                        "author": {
                            "@type": "Person",
                            "name": book.author || "Unknown Author"
                        },
                        "description": book.description || "Christian ebook for spiritual growth",
                        "genre": book.category || "Christian",
                        "datePublished": book.created_at || "2024"
                    }
                }))
            }
        };
        
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(structuredData);
        document.head.appendChild(script);
    }
    
    optimizeAllImages() {
        // Optimize all book cover images
        const bookCovers = document.querySelectorAll('.ebook-cover, .featured-cover, .detail-cover, .list-cover');
        bookCovers.forEach(cover => {
            const currentBg = cover.style.backgroundImage;
            if (currentBg && currentBg.includes('url')) {
                const url = currentBg.replace('url("', '').replace('")', '');
                const optimizedUrl = this.optimizeImageForSEO(url);
                cover.style.backgroundImage = `url("${optimizedUrl}")`;
                
                // Add lazy loading
                cover.setAttribute('loading', 'lazy');
                
                // Add alt text
                const title = cover.closest('.ebook-card')?.querySelector('.ebook-title')?.textContent || 'Christian ebook';
                cover.setAttribute('aria-label', `Cover of ${title}`);
            }
        });
    }
    
    addCanonicalUrls() {
        // Add canonical URL for paginated pages
        if (this.currentPage > 1) {
            const canonical = document.querySelector('link[rel="canonical"]');
            if (canonical) {
                canonical.href = window.location.origin + window.location.pathname;
            }
        }
        
        // Add pagination meta tags
        this.addPaginationMetaTags();
    }
    
    addPaginationMetaTags() {
        if (this.filteredBooks.length > this.itemsPerPage) {
            const totalPages = Math.ceil(this.filteredBooks.length / this.itemsPerPage);
            
            // Add rel="next" and rel="prev" for pagination
            if (this.currentPage < totalPages) {
                let nextLink = document.querySelector('link[rel="next"]');
                if (!nextLink) {
                    nextLink = document.createElement('link');
                    nextLink.rel = 'next';
                    document.head.appendChild(nextLink);
                }
                const nextUrl = new URL(window.location);
                nextUrl.searchParams.set('page', this.currentPage + 1);
                nextLink.href = nextUrl.toString();
            }
            
            if (this.currentPage > 1) {
                let prevLink = document.querySelector('link[rel="prev"]');
                if (!prevLink) {
                    prevLink = document.createElement('link');
                    prevLink.rel = 'prev';
                    document.head.appendChild(prevLink);
                }
                const prevUrl = new URL(window.location);
                prevUrl.searchParams.set('page', this.currentPage - 1);
                prevLink.href = prevUrl.toString();
            }
        }
    }
    
    enhanceAccessibility() {
        // Add ARIA labels to interactive elements
        const interactiveElements = document.querySelectorAll('button, [role="button"], input, select');
        interactiveElements.forEach(el => {
            if (!el.hasAttribute('aria-label') && !el.hasAttribute('aria-labelledby')) {
                const text = el.textContent.trim() || el.getAttribute('placeholder') || el.getAttribute('title') || el.getAttribute('alt');
                if (text) {
                    el.setAttribute('aria-label', text);
                }
            }
        });
        
        // Ensure proper heading hierarchy
        this.fixHeadingHierarchy();
        
        // Add skip to content link
        this.addSkipToContentLink();
    }
    
    fixHeadingHierarchy() {
        // Ensure proper h1-h6 hierarchy in book cards
        const containers = document.querySelectorAll('.ebooks-container, .book-detail-content');
        containers.forEach(container => {
            const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
            let currentLevel = 1;
            
            headings.forEach((heading, index) => {
                const tagName = heading.tagName.toLowerCase();
                const level = parseInt(tagName.replace('h', ''));
                
                // If heading level is too high, adjust it
                if (level > currentLevel + 1) {
                    const newLevel = Math.min(currentLevel + 1, 6);
                    const newHeading = document.createElement(`h${newLevel}`);
                    newHeading.innerHTML = heading.innerHTML;
                    newHeading.className = heading.className;
                    heading.parentNode.replaceChild(newHeading, heading);
                    currentLevel = newLevel;
                } else {
                    currentLevel = level;
                }
            });
        });
    }
    
    addSkipToContentLink() {
        if (!document.getElementById('skip-to-content')) {
            const skipLink = document.createElement('a');
            skipLink.id = 'skip-to-content';
            skipLink.href = '#ebooks-grid';
            skipLink.className = 'skip-to-content';
            skipLink.innerHTML = 'Skip to main content';
            skipLink.style.cssText = `
                position: absolute;
                top: -40px;
                left: 0;
                background: #007AFF;
                color: white;
                padding: 8px 16px;
                text-decoration: none;
                z-index: 10001;
                transition: top 0.3s ease;
            `;
            
            skipLink.addEventListener('focus', () => {
                skipLink.style.top = '0';
            });
            
            skipLink.addEventListener('blur', () => {
                skipLink.style.top = '-40px';
            });
            
            document.body.insertAdjacentElement('afterbegin', skipLink);
        }
    }
    
    // ================ PERFORMANCE OPTIMIZATION ================
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // ================ ANALYTICS ================
    
    trackEvent(category, action, label) {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                'event_category': category,
                'event_label': label
            });
        }
        
        // Fallback to console logging
        console.log(`📊 Analytics: ${category} - ${action} - ${label}`);
    }
}

// Export the class
export default EbooksLibrary;

// Add CSS animations for toast
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes toastSlideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes toastSlideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;

// Only add styles once
if (!document.getElementById('toast-styles')) {
    toastStyles.id = 'toast-styles';
    document.head.appendChild(toastStyles);
}

// Global debugging helper
if (typeof window !== 'undefined') {
    window.debugEbooks = () => {
        console.log("🛠️ Ebooks Library Debug Helper");
        console.log("Available commands:");
        console.log("- window.ebookLibrary.debugState() - Show library state");
        console.log("- window.ebookLibrary.openBookDetailModal('book-id') - Open book detail");
        console.log("- window.ebookLibrary.readBookOnline('book-id', 'Book Title') - Read book");
        console.log("- window.ebookLibrary.openSocialSharingModal('book-id') - Share book");
    };
    
    console.log("✅ Global debug helper available: window.debugEbooks()");
}

