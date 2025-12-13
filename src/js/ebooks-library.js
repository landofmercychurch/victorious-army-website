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
        
        // SEO tracking
        this.seoData = {
            pageTitle: 'Christian Ebook Library',
            metaDescription: 'Free Christian ebooks for spiritual growth, Bible study, prayer, and theology',
            structuredDataInjected: false
        };
        
        // Performance tracking
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
        
        // 1. Set dynamic SEO meta tags FIRST
        console.log("Step 1: Setting dynamic SEO meta tags");
        this.setDynamicMetaTags();
        
        // 2. Create book detail modal
        console.log("Step 2: Creating book detail modal");
        this.createBookDetailModal();
        
        // 3. Setup navigation and search
        console.log("Step 3: Setting up navigation");
        this.setupNavigation();
        
        // 4. Load data
        console.log("Step 4: Loading data");
        await this.loadData();
        
        // 5. Setup UI and events
        console.log("Step 5: Setting up event listeners");
        this.setupEventListeners();
        
        // 6. Render everything
        console.log("Step 6: Rendering UI");
        this.render();
        
        // 7. Check URL for book ID and open modal if present
        console.log("Step 7: Checking URL parameters");
        this.checkURLForBookDetail();
        
        // 8. Inject comprehensive structured data
        console.log("Step 8: Injecting structured data");
        this.injectComprehensiveStructuredData();
        
        // 9. Setup performance monitoring
        console.log("Step 9: Setting up performance monitoring");
        this.setupPerformanceMonitoring();
        
        console.log("✅ EbooksLibrary initialization complete");
        console.groupEnd();
        
        // Make library globally accessible for debugging
        window.ebookLibrary = this;
        console.log("🌐 Library available globally as window.ebookLibrary");
        
        return this;
    }
    
    // ================ NAVIGATION METHODS ================
    
    setupNavigation() {
        console.log("🔧 Setting up navigation");
        console.group("Navigation Setup");
        
        // Mobile menu toggle
        const menuBtn = document.querySelector('.nav-menu-btn');
        const mobileNav = document.querySelector('.mobile-nav');
        
        if (menuBtn && mobileNav) {
            menuBtn.addEventListener('click', () => {
                const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
                menuBtn.setAttribute('aria-expanded', !isExpanded);
                mobileNav.hidden = isExpanded;
            });
            console.log("✅ Mobile menu event listener added");
        } else {
            console.warn("⚠️ Mobile menu elements not found");
        }
        
        // Search overlay functionality
        console.log("Setting up search overlay");
        this.setupSearchOverlay();
        
        console.groupEnd();
    }
    
    setupSearchOverlay() {
        console.log("🎯 Setting up search overlay");
        console.group("Search Overlay Setup");
        
        const searchBtn = document.querySelector('.nav-search-btn');
        const searchOverlay = document.querySelector('.search-overlay');
        const searchCloseBtn = document.querySelector('.search-close-btn');
        const searchInput = document.querySelector('#global-search');
        
        if (!searchBtn || !searchOverlay) {
            console.error("❌ Critical search overlay elements missing!");
            console.groupEnd();
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
        
        // Close search overlay with close button
        if (searchCloseBtn) {
            searchCloseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeSearchOverlay();
            });
        }
        
        // Close search overlay when clicking on overlay background
        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay) {
                this.closeSearchOverlay();
            }
        });
        
        // Close search overlay with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !searchOverlay.hidden) {
                this.closeSearchOverlay();
            }
        });
        
        // Handle search form submission
        const searchForm = document.querySelector('.search-form');
        if (searchForm && searchInput) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const searchTerm = searchInput.value.trim();
                
                if (searchTerm) {
                    this.closeSearchOverlay();
                    
                    // Set search and apply filters
                    const mainSearch = document.getElementById('ebook-search');
                    if (mainSearch) {
                        mainSearch.value = searchTerm;
                        this.currentFilters.search = searchTerm;
                        this.applyFilters();
                        
                        // Auto-scroll to results
                        setTimeout(() => {
                            const resultsSection = document.getElementById('ebooks-grid');
                            if (resultsSection) {
                                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }, 300);
                    }
                }
            });
        }
        
        console.log("✅ Search overlay setup complete");
        console.groupEnd();
    }
    
    openSearchOverlay() {
        console.log("🔓 Opening search overlay");
        const searchOverlay = document.querySelector('.search-overlay');
        const searchInput = document.querySelector('#global-search');
        
        if (searchOverlay) {
            searchOverlay.hidden = false;
            searchOverlay.style.display = 'flex';
            
            // Prevent body scrolling
            document.body.style.overflow = 'hidden';
            
            // Add open class for CSS targeting
            searchOverlay.classList.add('active');
            document.body.classList.add('search-overlay-open');
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
            
            // Restore body scrolling
            document.body.style.overflow = '';
            
            // Remove open class
            searchOverlay.classList.remove('active');
            document.body.classList.remove('search-overlay-open');
        }
        
        if (searchInput) {
            searchInput.blur();
        }
    }
    
    // ================ DATA METHODS ================
    
    async loadData() {
        console.log("📥 Loading ebook data");
        console.group("Data Loading");
        
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
            
            // Create mock data for demo purposes
            this.createDemoData();
            
        } finally {
            console.groupEnd();
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
        console.group("Event Listeners Setup");
        
        // Search input (main search) with debouncing
        const searchInput = document.getElementById('ebook-search');
        if (searchInput) {
            console.log("🔍 Found main search input");
            
            searchInput.addEventListener('input', (e) => {
                const value = e.target.value;
                clearTimeout(this.performanceMetrics.searchDebounceTimer);
                
                this.performanceMetrics.searchDebounceTimer = setTimeout(() => {
                    console.log(`🔍 Debounced search: "${value}"`);
                    this.currentFilters.search = value;
                    this.applyFilters();
                    
                    // Update URL for shareable links
                    this.updateURL();
                    
                    // Update meta tags for search results
                    if (value) {
                        this.updateMetaTagsForSearch(value);
                    }
                    
                    // Auto-scroll to results if search is active
                    if (value && this.filteredBooks.length > 0) {
                        setTimeout(() => {
                            const resultsSection = document.getElementById('ebooks-grid');
                            if (resultsSection) {
                                resultsSection.scrollIntoView({ 
                                    behavior: 'smooth', 
                                    block: 'start' 
                                });
                            }
                        }, 400);
                    }
                }, 350);
            });
            
            // Update clear button visibility
            const searchClearBtn = document.querySelector('.search-clear-btn');
            if (searchClearBtn) {
                searchInput.addEventListener('input', (e) => {
                    const value = e.target.value;
                    searchClearBtn.hidden = !value;
                });
                
                // Clear search button
                searchClearBtn.addEventListener('click', () => {
                    console.log("🧹 Clearing main search");
                    searchInput.value = '';
                    this.currentFilters.search = '';
                    searchClearBtn.hidden = true;
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
        
        // Newsletter forms
        const newsletterForms = [
            { id: 'hero-newsletter', name: 'Hero' },
            { id: 'main-newsletter', name: 'Main' }
        ];
        
        newsletterForms.forEach(({ id, name }) => {
            const form = document.getElementById(id);
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    console.log(`📧 ${name} newsletter form submitted`);
                    this.handleNewsletter(e);
                });
            }
        });
        
        // Add SEO analytics tracking
        this.setupSEOTracking();
        
        console.log("✅ All event listeners setup complete");
        console.groupEnd();
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
        
        // Update clear button
        const searchClearBtn = document.querySelector('.search-clear-btn');
        if (searchClearBtn) {
            searchClearBtn.hidden = true;
        }
        
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
        
        // Update URL for SEO
        this.updateURL();
        
        // Re-render
        this.renderBooks();
        
        // Update results count
        this.updateResultsCount();
        
        // Track filter usage
        this.trackSEOMetric('filters_applied', {
            search: this.currentFilters.search,
            category: this.currentFilters.category,
            series: this.currentFilters.series,
            author: this.currentFilters.author,
            sort: this.currentFilters.sort,
            results_count: this.filteredBooks.length
        });
    }
    
    updateURL() {
        const params = new URLSearchParams();
        if (this.currentFilters.search) params.set('q', this.currentFilters.search);
        if (this.currentFilters.category) params.set('category', this.currentFilters.category);
        if (this.currentFilters.series) params.set('series', this.currentFilters.series);
        if (this.currentFilters.author) params.set('author', this.currentFilters.author);
        if (this.currentFilters.sort !== 'newest') params.set('sort', this.currentFilters.sort);
        
        const newUrl = params.toString() 
            ? `/ebooks?${params.toString()}`
            : '/ebooks';
        
        window.history.pushState({}, '', newUrl);
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
        const totalDownloads = document.getElementById('total-downloads');
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
        
        // Calculate total downloads
        const downloads = this.books.reduce((sum, book) => sum + (book.download_count || 0), 0);
        if (totalDownloads) {
            const display = downloads >= 1000 
                ? `${Math.floor(downloads / 1000)}K`
                : downloads;
            totalDownloads.textContent = display;
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
        
        // Render sidebar filters
        this.renderSidebarFilters();
    }
    
    renderSidebarFilters() {
        const categoryList = document.getElementById('category-list');
        const seriesList = document.getElementById('series-list');
        const authorList = document.getElementById('author-list');
        
        // Count occurrences
        const categoryCounts = {};
        const seriesCounts = {};
        const authorCounts = {};
        
        this.books.forEach(book => {
            if (book.category) categoryCounts[book.category] = (categoryCounts[book.category] || 0) + 1;
            if (book.series) seriesCounts[book.series] = (seriesCounts[book.series] || 0) + 1;
            if (book.author) authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
        });
        
        // Render category list
        if (categoryList) {
            const categories = [...this.categories].sort();
            categoryList.innerHTML = categories
                .map(category => `
                    <div class="filter-item ${this.currentFilters.category === category ? 'active' : ''}"
                         data-type="category" 
                         data-value="${category}">
                        <span>${category}</span>
                        <span class="filter-count">${categoryCounts[category] || 0}</span>
                    </div>
                `).join('');
        }
        
        // Render series list
        if (seriesList) {
            const series = [...this.series].sort();
            seriesList.innerHTML = series
                .map(seriesName => `
                    <div class="filter-item ${this.currentFilters.series === seriesName ? 'active' : ''}"
                         data-type="series" 
                         data-value="${seriesName}">
                        <span>${seriesName}</span>
                        <span class="filter-count">${seriesCounts[seriesName] || 0}</span>
                    </div>
                `).join('');
        }
        
        // Render author list (top 10)
        if (authorList) {
            const topAuthors = [...this.authors]
                .sort((a, b) => (authorCounts[b] || 0) - (authorCounts[a] || 0))
                .slice(0, 10);
            
            authorList.innerHTML = topAuthors
                .map(author => `
                    <div class="filter-item ${this.currentFilters.author === author ? 'active' : ''}"
                         data-type="author" 
                         data-value="${author}">
                        <span>${author}</span>
                        <span class="filter-count">${authorCounts[author] || 0}</span>
                    </div>
                `).join('');
        }
        
        // Add click handlers to filter items
        const filterItems = document.querySelectorAll('.filter-item');
        filterItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const type = item.dataset.type;
                const value = item.dataset.value;
                const wasActive = this.currentFilters[type] === value;
                
                if (wasActive) {
                    this.currentFilters[type] = ''; // Toggle off
                } else {
                    this.currentFilters[type] = value; // Toggle on
                }
                
                // Update dropdowns
                const dropdown = document.getElementById(`${type}-filter`);
                if (dropdown) {
                    dropdown.value = this.currentFilters[type];
                }
                
                this.applyFilters();
            });
        });
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
        const card = el('div', 'ebook-card grid-item');
        const optimizedImage = this.optimizeImageForSEO(book.cover_url);
        
        card.innerHTML = `
            <div class="ebook-card-inner" itemprop="mainEntity" itemscope itemtype="https://schema.org/Book">
                <meta itemprop="url" content="${window.location.origin}/ebooks/${this.generateSlug(book.title)}">
                
                <div class="ebook-cover-container" onclick="ebookLibrary.openBookDetailModal('${book.id}')">
                    <div class="ebook-cover" 
                         style="background-image: url('${optimizedImage}')"
                         aria-label="Cover of ${book.title}"
                         itemprop="image">
                        ${book.featured ? '<span class="featured-badge">Featured</span>' : ''}
                    </div>
                </div>
                
                <div class="ebook-content">
                    <h3 class="ebook-title" itemprop="name">${book.title}</h3>
                    <p class="ebook-author" itemprop="author">${book.author || 'Unknown Author'}</p>
                    
                    <div class="ebook-meta">
                        ${book.category ? `<span class="ebook-category" itemprop="genre">${book.category}</span>` : ''}
                        ${book.read_time_minutes ? `<span class="ebook-duration">${book.read_time_minutes} min</span>` : ''}
                    </div>
                    
                    <div class="ebook-stats">
                        ${book.download_count ? `<span class="download-count">${this.formatNumber(book.download_count)} downloads</span>` : ''}
                    </div>
                    
                    <div class="ebook-actions">
                        <button class="btn-read" 
                                onclick="event.stopPropagation(); ebookLibrary.downloadEbook('${book.id}', '${book.title}')"
                                aria-label="Download ${book.title}">
                            Download PDF
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    }
    
    createBookListItem(book) {
        const item = el('div', 'ebook-card list-item');
        const optimizedImage = this.optimizeImageForSEO(book.cover_url);
        
        item.innerHTML = `
            <div class="ebook-list-item-inner" itemprop="mainEntity" itemscope itemtype="https://schema.org/Book">
                <meta itemprop="url" content="${window.location.origin}/ebooks/${this.generateSlug(book.title)}">
                
                <div class="list-cover-container" onclick="ebookLibrary.openBookDetailModal('${book.id}')">
                    <div class="list-cover" 
                         style="background-image: url('${optimizedImage}')"
                         aria-label="Cover of ${book.title}"
                         itemprop="image">
                    </div>
                </div>
                
                <div class="list-content">
                    <div class="list-header">
                        <h3 class="list-title" itemprop="name">${book.title}</h3>
                        ${book.featured ? '<span class="featured-badge-list">Featured</span>' : ''}
                    </div>
                    
                    <p class="list-author" itemprop="author">by ${book.author || 'Unknown Author'}</p>
                    
                    <div class="list-meta">
                        ${book.category ? `<span class="list-category" itemprop="genre">${book.category}</span>` : ''}
                        ${book.series ? `<span class="list-series">${book.series} Series</span>` : ''}
                        ${book.read_time_minutes ? `<span class="list-duration">${book.read_time_minutes} min read</span>` : ''}
                    </div>
                    
                    <p class="list-description" itemprop="description">
                        ${book.description ? `${book.description.substring(0, 200)}...` : 'A Christian ebook for spiritual growth and Bible study.'}
                    </p>
                    
                    <div class="list-footer">
                        <div class="list-actions">
                            <button class="btn-read-list" 
                                    onclick="event.stopPropagation(); ebookLibrary.downloadEbook('${book.id}', '${book.title}')"
                                    aria-label="Download ${book.title}">
                                Download PDF
                            </button>
                        </div>
                        
                        <div class="list-stats">
                            ${book.download_count ? `<span class="list-downloads">${this.formatNumber(book.download_count)} downloads</span>` : ''}
                            ${book.file_size ? `<span class="list-size">${this.formatFileSize(book.file_size)}</span>` : ''}
                        </div>
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
        const oldView = grid.dataset.view;
        grid.dataset.view = view;
        
        // Remove all existing view classes
        grid.classList.remove('grid-view', 'list-view');
        
        // Add the new view class
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
                <div class="featured-card" onclick="ebookLibrary.openBookDetailModal('${book.id}')">
                    <div class="featured-cover" 
                         style="background-image: url('${this.optimizeImageForSEO(book.cover_url)}')">
                    </div>
                    <div class="featured-content">
                        <div class="featured-badges">
                            <span class="badge featured">Featured</span>
                            ${book.category ? `<span class="badge">${book.category}</span>` : ''}
                        </div>
                        <h3 class="featured-title">${book.title}</h3>
                        <p class="featured-author">by ${book.author || 'Unknown'}</p>
                        <div class="featured-actions">
                            <button class="btn-outline" onclick="event.stopPropagation(); ebookLibrary.downloadEbook('${book.id}', '${book.title}')">
                                Download PDF
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
    
    // ================ BOOK DETAIL MODAL METHODS ================
    
    createBookDetailModal() {
        console.log("📖 Creating book detail modal");
        
        // Create modal HTML structure
        const modalHTML = `
            <div class="book-detail-modal" id="book-detail-modal" hidden>
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
        
        // Add CSS styles for the modal
        this.addBookDetailModalStyles();
    }
    
    addBookDetailModalStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            /* Mobile-first responsive modal styles */
            .book-detail-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                display: flex;
                justify-content: center;
                align-items: flex-start;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
            }
            
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
            
            .book-detail-container {
                position: relative;
                width: 100%;
                max-width: 800px;
                background: white;
                margin: 0;
                z-index: 2;
                min-height: 100vh;
                overflow-y: auto;
                box-shadow: none;
            }
            
            .book-detail-close {
                position: fixed;
                top: 16px;
                right: 16px;
                width: 44px;
                height: 44px;
                background: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: none;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                z-index: 3;
                cursor: pointer;
            }
            
            /* Tablet styles */
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
            }
            
            /* Desktop styles */
            @media (min-width: 1024px) {
                .book-detail-container {
                    margin: 40px auto;
                    border-radius: 20px;
                }
                
                .book-detail-close {
                    top: 24px;
                    right: 24px;
                    transition: all 0.2s ease;
                }
                
                .book-detail-close:hover {
                    background: #f8f8f8;
                    transform: scale(1.05);
                }
            }
            
            /* Book detail content styles */
            .book-detail-content {
                padding: 20px;
            }
            
            .book-detail-layout {
                display: flex;
                flex-direction: column;
                gap: 24px;
            }
            
            /* Mobile layout */
            @media (max-width: 767px) {
                .book-detail-layout {
                    flex-direction: column;
                }
            }
            
            /* Tablet and desktop layout */
            @media (min-width: 768px) {
                .book-detail-layout {
                    flex-direction: row;
                    gap: 32px;
                }
                
                .detail-left-column {
                    flex: 0 0 300px;
                }
                
                .detail-right-column {
                    flex: 1;
                }
            }
            
            /* Detail cover */
            .detail-cover-container {
                margin-bottom: 20px;
            }
            
            .detail-cover {
                width: 100%;
                height: 400px;
                border-radius: 12px;
                background-size: cover;
                background-position: center;
                position: relative;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            }
            
            .detail-featured-badge {
                position: absolute;
                top: 12px;
                right: 12px;
                background: #FF3B30;
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
            }
            
            /* Detail stats */
            .detail-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
                margin-bottom: 24px;
                text-align: center;
            }
            
            .stat-item {
                background: #f8f8f8;
                padding: 16px 8px;
                border-radius: 8px;
            }
            
            .stat-value {
                display: block;
                font-size: 20px;
                font-weight: 700;
                color: #007AFF;
                margin-bottom: 4px;
            }
            
            .stat-label {
                display: block;
                font-size: 12px;
                color: #666;
            }
            
            /* Detail actions */
            .detail-actions {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 24px;
            }
            
            .detail-action-btn {
                width: 100%;
                padding: 16px;
                border-radius: 12px;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                font-weight: 600;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .download-btn {
                background: #007AFF;
                color: white;
            }
            
            .download-btn:hover {
                background: #0056CC;
            }
            
            .read-btn {
                background: #34C759;
                color: white;
            }
            
            .read-btn:hover {
                background: #2DA84A;
            }
            
            /* Book header */
            .book-header {
                margin-bottom: 24px;
            }
            
            .book-title {
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 8px;
                color: #1D1D1F;
            }
            
            .book-author {
                font-size: 16px;
                color: #666;
                margin-bottom: 16px;
            }
            
            .book-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-bottom: 16px;
            }
            
            .meta-badge {
                padding: 6px 12px;
                background: #f8f8f8;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                color: #666;
            }
            
            /* Book description */
            .book-description-section {
                margin-bottom: 24px;
            }
            
            .book-description-section h3 {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 12px;
                color: #1D1D1F;
            }
            
            .book-description {
                line-height: 1.6;
                color: #333;
            }
            
            /* Book details */
            .book-details-section {
                margin-bottom: 24px;
            }
            
            .book-details-section h3 {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 12px;
                color: #1D1D1F;
            }
            
            .details-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
            }
            
            .detail-item {
                display: flex;
                flex-direction: column;
            }
            
            .detail-label {
                font-size: 12px;
                color: #666;
                margin-bottom: 4px;
            }
            
            .detail-value {
                font-size: 14px;
                font-weight: 500;
                color: #1D1D1F;
            }
            
            /* Related books */
            .related-books-section {
                margin-top: 24px;
            }
            
            .related-books-section h3 {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 16px;
                color: #1D1D1F;
            }
            
            .related-books-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
            }
            
            .related-book-card {
                background: #f8f8f8;
                border-radius: 12px;
                overflow: hidden;
                cursor: pointer;
                transition: transform 0.2s ease;
            }
            
            .related-book-card:hover {
                transform: translateY(-4px);
            }
            
            .related-book-cover {
                width: 100%;
                height: 120px;
                background-size: cover;
                background-position: center;
            }
            
            .related-book-info {
                padding: 12px;
            }
            
            .related-book-info h4 {
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 4px;
                color: #1D1D1F;
            }
            
            .related-book-info p {
                font-size: 12px;
                color: #666;
            }
            
            /* Loading spinner */
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
        
        // Update URL for shareable link
        const slug = this.generateSlug(book.title);
        const newUrl = `/ebooks/book/${slug}?id=${bookId}`;
        window.history.pushState({}, '', newUrl);
        
        // Show loading state
        this.showBookDetailLoading();
        
        // Load book data and show modal
        this.loadBookDetail(book);
        
        // Track modal open event
        this.trackSEOMetric('book_detail_viewed', {
            book_id: bookId,
            book_title: book.title,
            category: book.category
        });
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
        
        // Add to active modals
        this.performanceMetrics.activeModals.add('book-detail');
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
        
        // Generate the full book detail HTML
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
                            <span class="stat-value">${book.download_count || 0}</span>
                            <span class="stat-label">Downloads</span>
                        </div>
                        ${book.read_time_minutes ? `
                        <div class="stat-item">
                            <span class="stat-value">${book.read_time_minutes}</span>
                            <span class="stat-label">Minutes</span>
                        </div>
                        ` : ''}
                        <div class="stat-item">
                            <span class="stat-value">PDF</span>
                            <span class="stat-label">Format</span>
                        </div>
                    </div>
                    
                    <div class="detail-actions">
                        <button class="detail-action-btn download-btn" onclick="ebookLibrary.downloadEbook('${book.id}', '${book.title}')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Download PDF
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
                    
                    <div class="book-details-section">
                        <h3>Details</h3>
                        <div class="details-grid">
                            ${book.created_at ? `
                            <div class="detail-item">
                                <span class="detail-label">Added</span>
                                <span class="detail-value">${formatDate(book.created_at)}</span>
                            </div>
                            ` : ''}
                            
                            ${book.series_order && book.series_order > 0 ? `
                            <div class="detail-item">
                                <span class="detail-label">Series Order</span>
                                <span class="detail-value">Book ${book.series_order}</span>
                            </div>
                            ` : ''}
                            
                            <div class="detail-item">
                                <span class="detail-label">Format</span>
                                <span class="detail-value">PDF (Printable)</span>
                            </div>
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
        
        // Reset URL to main ebooks page
        window.history.pushState({}, '', '/ebooks');
        
        // Remove from active modals
        this.performanceMetrics.activeModals.delete('book-detail');
    }
    
    checkURLForBookDetail() {
        const urlParams = new URLSearchParams(window.location.search);
        const bookId = urlParams.get('id');
        
        if (bookId) {
            // Check if we have a book with this ID
            const book = this.books.find(b => b.id === bookId);
            if (book) {
                // Open the modal after a short delay to allow page to load
                setTimeout(() => {
                    this.openBookDetailModal(bookId);
                }, 300);
            }
        }
    }
    
    // ================ DOWNLOAD METHODS ================
    
    async downloadEbook(bookId, bookTitle) {
        console.log(`⬇️ Downloading ebook: "${bookTitle}"`);
        
        const book = this.books.find(b => b.id === bookId);
        if (!book) {
            this.showToast('Book not found');
            return;
        }
        
        // Show downloading toast
        this.showToast(`Starting download: ${bookTitle}`);
        
        // Track download event
        try {
            await api.post(`/ebooks/${bookId}/download`);
            
            // SEO event tracking
            this.trackSEOMetric('ebook_download', {
                book_id: bookId,
                book_title: bookTitle,
                category: book.category,
                author: book.author,
                file_format: 'PDF'
            });
        } catch (error) {
            console.error("⚠️ Failed to track download event:", error);
        }
        
        // Create download link - USING SAME URL FOR BOTH DOWNLOAD AND READ
        const downloadUrl = `${API}/ebooks/download/${bookId}`;
        const fileName = `${this.generateSlug(bookTitle)}.pdf`;
        
        // Try Fetch API first for better user experience
        try {
            const response = await fetch(downloadUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/pdf'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Download failed: ${response.status}`);
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up URL object
            window.URL.revokeObjectURL(url);
            
            this.showToast(`Download complete: ${bookTitle}`);
            
        } catch (error) {
            console.error('Download error:', error);
            
            // Fallback to direct link (opens in same window)
            const fallbackWindow = window.open(downloadUrl, '_blank');
            if (fallbackWindow) {
                this.showToast(`Opening PDF for ${bookTitle}`);
            } else {
                this.showToast('Please allow popups to download the book', 'error');
            }
        }
    }
    
    // ================ SEO METHODS ================
    
    setDynamicMetaTags() {
        // Get URL parameters for dynamic titles
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('q');
        const category = urlParams.get('category');
        const series = urlParams.get('series');
        
        // Dynamic title based on filters
        let pageTitle = 'Free Christian Ebooks Library | Download Spiritual Growth Resources';
        let metaDescription = 'Browse and download 100+ free Christian ebooks. Spiritual growth, Bible study guides, prayer books, theology, and Christian living resources.';
        
        if (category) {
            pageTitle = `Free ${category} Christian Ebooks | Download PDF Books for Spiritual Growth`;
            metaDescription = `Download free ${category.toLowerCase()} Christian ebooks. Perfect for individual study, small groups, or ministry resources.`;
        } else if (searchQuery) {
            pageTitle = `Search: ${searchQuery} | Christian Ebooks Library`;
            metaDescription = `Find Christian ebooks about ${searchQuery}. Free downloads for spiritual growth and Bible study.`;
        } else if (series) {
            pageTitle = `${series} Series | Free Christian Ebook Collection`;
            metaDescription = `Download the complete ${series} series of Christian ebooks. Free spiritual resources for your faith journey.`;
        }
        
        // Update page title
        document.title = pageTitle;
        this.seoData.pageTitle = pageTitle;
        this.seoData.metaDescription = metaDescription;
        
        // Update or create meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = metaDescription;
        
        // Add robots meta tag if not present
        let robotsMeta = document.querySelector('meta[name="robots"]');
        if (!robotsMeta) {
            robotsMeta = document.createElement('meta');
            robotsMeta.name = 'robots';
            robotsMeta.content = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
            document.head.appendChild(robotsMeta);
        }
        
        // Add canonical URL
        this.updateCanonicalURL();
        
        // Update Open Graph tags
        this.updateOpenGraphTags();
        
        console.log("✅ Dynamic meta tags set:", { pageTitle, metaDescription });
    }
    
    updateCanonicalURL() {
        const params = new URLSearchParams();
        // Only include important filters for canonical
        if (this.currentFilters.category) params.set('category', this.currentFilters.category);
        if (this.currentFilters.series) params.set('series', this.currentFilters.series);
        
        let canonicalURL = `${window.location.origin}/ebooks`;
        if (params.toString()) {
            canonicalURL = `${window.location.origin}/ebooks?${params.toString()}`;
        }
        
        // Update or create canonical link
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.rel = 'canonical';
            document.head.appendChild(canonicalLink);
        }
        canonicalLink.href = canonicalURL;
    }
    
    updateOpenGraphTags() {
        const ogTags = {
            'og:title': this.seoData.pageTitle,
            'og:description': this.seoData.metaDescription.substring(0, 200),
            'og:image': `${window.location.origin}/images/ebook-library-og.jpg`,
            'og:url': window.location.href,
            'og:type': 'website',
            'og:site_name': 'Christian Ebook Library',
            'og:locale': 'en_US'
        };
        
        Object.entries(ogTags).forEach(([property, content]) => {
            let meta = document.querySelector(`meta[property="${property}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('property', property);
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', content);
        });
        
        // Twitter Cards
        const twitterTags = {
            'twitter:card': 'summary_large_image',
            'twitter:title': this.seoData.pageTitle,
            'twitter:description': this.seoData.metaDescription.substring(0, 200),
            'twitter:image': `${window.location.origin}/images/ebook-library-twitter.jpg`
        };
        
        Object.entries(twitterTags).forEach(([name, content]) => {
            let meta = document.querySelector(`meta[name="${name}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.name = name;
                document.head.appendChild(meta);
            }
            meta.content = content;
        });
    }
    
    injectComprehensiveStructuredData() {
        if (this.seoData.structuredDataInjected) {
            return;
        }
        
        const websiteSchema = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${window.location.origin}/#website`,
            "name": "Christian Ebook Library",
            "url": `${window.location.origin}/ebooks`,
            "description": this.seoData.metaDescription,
            "potentialAction": {
                "@type": "SearchAction",
                "target": `${window.location.origin}/ebooks?q={search_term_string}`,
                "query-input": "required name=search_term_string"
            },
            "inLanguage": "en-US",
            "publisher": {
                "@type": "Organization",
                "@id": `${window.location.origin}/#organization`,
                "name": "Your Church Name",
                "url": window.location.origin,
                "logo": {
                    "@type": "ImageObject",
                    "url": `${window.location.origin}/logo.png`,
                    "width": "600",
                    "height": "60"
                }
            }
        };
        
        // Collection schema with real book data
        const collectionSchema = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": `${window.location.origin}/ebooks#webpage`,
            "url": `${window.location.origin}/ebooks`,
            "name": "Christian Ebook Collection",
            "description": this.seoData.metaDescription,
            "isPartOf": {"@id": `${window.location.origin}/#website`},
            "breadcrumb": {"@id": `${window.location.origin}/ebooks#breadcrumb`},
            "mainEntity": {
                "@type": "ItemList",
                "itemListElement": this.books.slice(0, 20).map((book, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "item": {
                        "@type": "Book",
                        "name": book.title,
                        "author": {
                            "@type": "Person",
                            "name": book.author || "Unknown Author"
                        },
                        "url": `${window.location.origin}/ebooks/${this.generateSlug(book.title)}`,
                        "bookFormat": "EBook",
                        "genre": book.category || "Christian",
                        "description": book.description?.substring(0, 200) || "Christian ebook for spiritual growth",
                        "publisher": {
                            "@type": "Organization",
                            "name": "Your Church Name"
                        }
                    }
                }))
            }
        };
        
        // Breadcrumb schema
        const breadcrumbSchema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "@id": `${window.location.origin}/ebooks#breadcrumb`,
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": window.location.origin
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Ebooks",
                    "item": `${window.location.origin}/ebooks`
                }
            ]
        };
        
        // Inject all schemas
        this.injectSchema(websiteSchema, 'website-schema');
        this.injectSchema(collectionSchema, 'collection-schema');
        this.injectSchema(breadcrumbSchema, 'breadcrumb-schema');
        
        this.seoData.structuredDataInjected = true;
        console.log("✅ Comprehensive structured data injected");
    }
    
    injectSchema(schemaData, id) {
        // Remove existing
        const existing = document.getElementById(id);
        if (existing) existing.remove();
        
        // Create new
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = id;
        script.textContent = JSON.stringify(schemaData, null, 2);
        document.head.appendChild(script);
    }
    
    updateMetaTagsForSearch(searchTerm) {
        document.title = `Search: ${searchTerm} | Christian Ebooks Library`;
        
        let metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = `Find Christian ebooks about ${searchTerm}. Free downloads for spiritual growth and Bible study.`;
        }
        
        this.updateOpenGraphTags();
    }
    
    setupSEOTracking() {
        // Track filter usage
        document.addEventListener('click', (e) => {
            const filterItem = e.target.closest('.filter-item');
            if (filterItem) {
                const type = filterItem.dataset.type;
                const value = filterItem.dataset.value;
                
                this.trackSEOMetric('filter_used', {
                    filter_type: type,
                    filter_value: value,
                    total_books: this.filteredBooks.length
                });
            }
        });
        
        // Track book interactions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-read, .btn-read-list, .btn-download, .btn-download-list')) {
                const bookCard = e.target.closest('[itemtype="https://schema.org/Book"]');
                if (bookCard) {
                    const title = bookCard.querySelector('[itemprop="name"]')?.textContent;
                    this.trackSEOMetric('download_clicked', { book_title: title });
                }
            }
        });
    }
    
    trackSEOMetric(action, data = {}) {
        // Send to Google Analytics (if available)
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                ...data,
                page_location: window.location.href,
                page_title: document.title
            });
        }
        
        // Send to custom analytics endpoint
        try {
            api.post('/analytics/seo', {
                action,
                data,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                user_agent: navigator.userAgent
            });
        } catch (error) {
            // Silent fail for analytics
        }
        
        console.log(`📊 SEO Metric: ${action}`, data);
    }
    
    // ================ HELPER METHODS ================
    
    optimizeImageForSEO(url) {
        if (!url) {
            return 'https://via.placeholder.com/400x600/f5f5f7/8e8e93?text=Christian+Ebook';
        }
        
        // Optimize Cloudinary URLs for better performance
        if (url.includes('cloudinary.com') && url.includes('/upload/')) {
            // Responsive image optimization
            const optimized = url.replace('/upload/', '/upload/f_auto,q_auto,w_400,c_fill/');
            return optimized;
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
    
    // ================ PERFORMANCE MONITORING ================
    
    setupPerformanceMonitoring() {
        // Track Core Web Vitals
        const perfObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.entryType === 'largest-contentful-paint') {
                    this.trackSEOMetric('lcp_metric', { value: entry.startTime });
                } else if (entry.entryType === 'first-input') {
                    this.trackSEOMetric('fid_metric', { value: entry.startTime });
                }
            });
        });
        
        perfObserver.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
        
        // Track page load time
        window.addEventListener('load', () => {
            const loadTime = window.performance.timing.domContentLoadedEventEnd - 
                           window.performance.timing.navigationStart;
            this.trackSEOMetric('page_load_time', { value: loadTime });
        });
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
    
    // ================ ADDITIONAL METHODS ================
    
    async handleNewsletter(e) {
        console.log("📧 Handling newsletter subscription");
        
        e.preventDefault();
        const form = e.target;
        const emailInput = form.querySelector('input[type="email"]');
        const email = emailInput?.value;
        
        if (!email) {
            this.showToast('Please enter an email address');
            return;
        }
        
        try {
            console.log("📡 Subscribing to newsletter via API");
            await api.post('/newsletter/subscribe', { email });
            
            this.showToast('Subscribed successfully!', 'success');
            
            // Reset form
            form.reset();
            
            // Track subscription
            this.trackSEOMetric('newsletter_subscription', { email: email });
            
        } catch (error) {
            console.error("❌ Subscription failed:", error);
            this.showToast('Subscription failed. Please try again.', 'error');
        }
    }
    
    // Debugging methods
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
        
        console.log("🌐 URL:", window.location.href);
        
        console.log("🔧 DOM Elements:", {
            container: this.container,
            searchOverlay: document.querySelector('.search-overlay')?.hidden,
            grid: document.getElementById('ebooks-grid'),
            modal: document.getElementById('book-detail-modal')?.hidden
        });
        
        console.groupEnd();
        return this;
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
    
    .seo-toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
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
    }
    
    .toast-success {
        background: #34C759;
        color: white;
    }
    
    .toast-error {
        background: #FF3B30;
        color: white;
    }
    
    .toast-info {
        background: #007AFF;
        color: white;
    }
    
    .seo-toast .toast-icon {
        font-size: 18px;
    }
    
    .seo-toast .toast-message {
        flex: 1;
        font-size: 14px;
        line-height: 1.4;
    }
    
    .seo-toast .toast-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.8;
        transition: opacity 0.2s;
    }
    
    .seo-toast .toast-close:hover {
        opacity: 1;
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
        console.log("- window.ebookLibrary.closeBookDetailModal() - Close book detail");
        console.log("- window.ebookLibrary.downloadEbook('book-id', 'Book Title') - Download book");
        console.log("- window.ebookLibrary.applyFilters() - Apply current filters");
    };
    
    console.log("✅ Global debug helper available: window.debugEbooks()");
}