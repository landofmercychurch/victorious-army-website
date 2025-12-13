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
        
        // 2. Setup navigation and search
        console.log("Step 2: Setting up navigation");
        this.setupNavigation();
        
        // 3. Load data
        console.log("Step 3: Loading data");
        await this.loadData();
        
        // 4. Setup UI and events
        console.log("Step 4: Setting up event listeners");
        this.setupEventListeners();
        
        // 5. Render everything
        console.log("Step 5: Rendering UI");
        this.render();
        
        // 6. Inject comprehensive structured data
        console.log("Step 6: Injecting structured data");
        this.injectComprehensiveStructuredData();
        
        // 7. Setup performance monitoring
        console.log("Step 7: Setting up performance monitoring");
        this.setupPerformanceMonitoring();
        
        console.log("✅ EbooksLibrary initialization complete");
        console.groupEnd();
        
        // Make library globally accessible for debugging
        window.ebookLibrary = this;
        console.log("🌐 Library available globally as window.ebookLibrary");
        
        return this;
    }
    
    // ================ ORIGINAL METHODS ================
    
    setupNavigation() {
        console.log("🔧 Setting up navigation");
        console.group("Navigation Setup");
        
        // Mobile menu toggle
        const menuBtn = document.querySelector('.nav-menu-btn');
        const mobileNav = document.querySelector('.mobile-nav');
        
        console.log("Mobile menu elements:", {
            menuBtn: menuBtn,
            mobileNav: mobileNav,
            menuBtnExists: !!menuBtn,
            mobileNavExists: !!mobileNav
        });
        
        if (menuBtn && mobileNav) {
            menuBtn.addEventListener('click', () => {
                const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
                console.log(`📱 Mobile menu ${isExpanded ? 'closing' : 'opening'}`);
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
        
        console.log("Search overlay elements found:", {
            searchBtn: searchBtn,
            searchOverlay: searchOverlay,
            searchCloseBtn: searchCloseBtn,
            searchInput: searchInput,
            allExist: !!searchBtn && !!searchOverlay && !!searchCloseBtn && !!searchInput
        });
        
        if (!searchBtn || !searchOverlay) {
            console.error("❌ Critical search overlay elements missing!");
            console.groupEnd();
            return;
        }
        
        // Initialize overlay as hidden
        console.log("Initializing overlay as hidden");
        this.closeSearchOverlay();
        
        // Open search overlay
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("🔍 Opening search overlay via button click");
            this.openSearchOverlay();
        });
        console.log("✅ Open button event listener added");
        
        // Close search overlay with close button
        if (searchCloseBtn) {
            searchCloseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("❌ Closing overlay via close button");
                this.closeSearchOverlay();
            });
            console.log("✅ Close button event listener added");
        }
        
        // Close search overlay when clicking on overlay background
        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay) {
                console.log("🎯 Closing overlay via background click");
                this.closeSearchOverlay();
            }
        });
        
        // Close search overlay with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !searchOverlay.hidden) {
                console.log("⌨️ Closing overlay via Escape key");
                this.closeSearchOverlay();
            }
        });
        console.log("✅ Escape key event listener added");
        
        // Auto-close after 15 seconds of inactivity
        let inactivityTimer;
        const resetInactivityTimer = () => {
            clearTimeout(inactivityTimer);
            if (!searchOverlay.hidden) {
                inactivityTimer = setTimeout(() => {
                    console.log("⏰ Auto-closing overlay due to inactivity");
                    this.closeSearchOverlay();
                }, 15000);
            }
        };
        
        // Reset timer on user interaction
        if (searchInput) {
            searchInput.addEventListener('input', resetInactivityTimer);
            searchInput.addEventListener('keydown', resetInactivityTimer);
        }
        searchOverlay.addEventListener('mousemove', resetInactivityTimer);
        searchOverlay.addEventListener('click', resetInactivityTimer);
        console.log("✅ Inactivity timer setup complete");
        
        // Handle search form submission
        const searchForm = document.querySelector('.search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const searchTerm = searchInput?.value.trim();
                console.log("📝 Search form submitted:", searchTerm);
                
                if (searchTerm) {
                    this.closeSearchOverlay();
                    
                    // Transfer search to main search input
                    const mainSearch = document.getElementById('ebook-search');
                    if (mainSearch) {
                        mainSearch.value = searchTerm;
                        this.currentFilters.search = searchTerm;
                        console.log("🔄 Transferring search to main input:", searchTerm);
                        this.applyFilters();
                    }
                }
            });
            console.log("✅ Search form event listener added");
        }
        
        // Clear search button functionality (inside overlay)
        const searchClearBtn = document.querySelector('.search-clear-btn');
        if (searchClearBtn && searchInput) {
            // Show/hide clear button based on input
            searchInput.addEventListener('input', (e) => {
                const hasValue = !!e.target.value.trim();
                searchClearBtn.hidden = !hasValue;
                console.log(`🔄 Clear button ${hasValue ? 'shown' : 'hidden'}`);
            });
            
            // Clear input when button clicked
            searchClearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("🧹 Clearing search input");
                searchInput.value = '';
                searchClearBtn.hidden = true;
                searchInput.focus();
                resetInactivityTimer();
            });
            console.log("✅ Search clear button setup complete");
        }
        
        console.log("✅ Search overlay setup complete");
        console.groupEnd();
    }
    
    openSearchOverlay() {
        console.log("🔓 Opening search overlay");
        const searchOverlay = document.querySelector('.search-overlay');
        const searchInput = document.querySelector('#global-search');
        
        console.log("Overlay state before opening:", {
            overlay: searchOverlay,
            hidden: searchOverlay?.hidden,
            style: searchOverlay?.style.display
        });
        
        if (searchOverlay) {
            searchOverlay.hidden = false;
            searchOverlay.style.display = 'flex';
            searchOverlay.style.visibility = 'visible';
            searchOverlay.style.opacity = '1';
            
            // Prevent body scrolling
            document.body.style.overflow = 'hidden';
            
            // Add open class for CSS targeting
            searchOverlay.classList.add('active');
            document.body.classList.add('search-overlay-open');
            
            console.log("✅ Overlay opened, CSS classes added:", {
                hasActiveClass: searchOverlay.classList.contains('active'),
                bodyHasClass: document.body.classList.contains('search-overlay-open')
            });
        }
        
        if (searchInput) {
            setTimeout(() => {
                console.log("🎯 Focusing search input");
                searchInput.focus();
                searchInput.select();
            }, 100);
        }
    }
    
    closeSearchOverlay() {
        console.log("🔒 Closing search overlay");
        const searchOverlay = document.querySelector('.search-overlay');
        const searchInput = document.querySelector('#global-search');
        
        console.log("Overlay state before closing:", {
            overlay: searchOverlay,
            hidden: searchOverlay?.hidden
        });
        
        if (searchOverlay) {
            searchOverlay.hidden = true;
            searchOverlay.style.display = 'none';
            searchOverlay.style.visibility = 'hidden';
            searchOverlay.style.opacity = '0';
            
            // Restore body scrolling
            document.body.style.overflow = '';
            
            // Remove open class
            searchOverlay.classList.remove('active');
            document.body.classList.remove('search-overlay-open');
            
            console.log("✅ Overlay closed, CSS classes removed");
        }
        
        if (searchInput) {
            searchInput.blur();
            console.log("🔍 Search input blurred");
        }
    }
    
    async loadData() {
        console.log("📥 Loading ebook data");
        console.group("Data Loading");
        
        try {
            console.log("📡 Making API call to /ebooks");
            this.books = await api.get("/ebooks");
            
            console.log(`✅ Successfully loaded ${this.books.length} books`);
            console.table(this.books.slice(0, 3)); // Log first 3 books
            
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
        
        // Create sample books for development
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
        console.group("Book Sorting");
        
        const originalOrder = [...this.filteredBooks];
        
        switch (this.currentFilters.sort) {
            case 'newest':
                console.log("📅 Sorting by newest (created date)");
                this.filteredBooks.sort((a, b) => 
                    new Date(b.created_at) - new Date(a.created_at)
                );
                break;
            case 'popular':
                console.log("🔥 Sorting by popularity (download count)");
                this.filteredBooks.sort((a, b) => 
                    (b.download_count || 0) - (a.download_count || 0)
                );
                break;
            case 'title':
                console.log("🔤 Sorting by title alphabetically");
                this.filteredBooks.sort((a, b) => 
                    (a.title || '').localeCompare(b.title || '')
                );
                break;
            case 'author':
                console.log("✍️ Sorting by author alphabetically");
                this.filteredBooks.sort((a, b) => 
                    (a.author || '').localeCompare(b.author || '')
                );
                break;
            default:
                console.warn("⚠️ Unknown sort option, defaulting to newest");
                this.filteredBooks.sort((a, b) => 
                    new Date(b.created_at) - new Date(a.created_at)
                );
        }
        
        console.log("✅ Books sorted");
        console.groupEnd();
    }
    
    setupEventListeners() {
        console.log("🎮 Setting up event listeners");
        console.group("Event Listeners Setup");
        
        // Search input (main search) with debouncing
        const searchInput = document.getElementById('ebook-search');
        if (searchInput) {
            console.log("🔍 Found main search input");
            
            let searchTimeout;
            const searchHandler = (e) => {
                const value = e.target.value;
                clearTimeout(searchTimeout);
                
                searchTimeout = setTimeout(() => {
                    console.log(`🔍 Debounced search: "${value}"`);
                    this.currentFilters.search = value;
                    this.applyFilters();
                    
                    // Update URL for shareable links
                    this.updateURL();
                    
                    // Update meta tags for search results
                    if (value) {
                        this.updateMetaTagsForSearch(value);
                    }
                }, 350);
            };
            
            searchInput.addEventListener('input', searchHandler);
            
            // Update clear button visibility
            const searchClearBtn = document.querySelector('.search-clear-btn');
            searchInput.addEventListener('input', (e) => {
                const value = e.target.value;
                
                // Show/hide clear button
                if (searchClearBtn) {
                    searchClearBtn.hidden = !value;
                    console.log(`🔄 Clear button ${value ? 'shown' : 'hidden'}`);
                }
            });
            
            // Clear search button
            const clearBtn = document.querySelector('.search-clear-btn');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    console.log("🧹 Clearing main search");
                    searchInput.value = '';
                    this.currentFilters.search = '';
                    clearBtn.hidden = true;
                    this.applyFilters();
                    searchInput.focus();
                });
                console.log("✅ Main search clear button listener added");
            }
        } else {
            console.warn("⚠️ Main search input not found");
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
                console.log(`✅ ${name} filter listener added`);
            } else {
                console.warn(`⚠️ ${name} filter element not found`);
            }
        });
        
        // Clear all filters button
        const clearFiltersBtn = document.getElementById('clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                console.log("🗑️ Clearing all filters");
                this.clearAllFilters();
            });
            console.log("✅ Clear filters button listener added");
        }
        
        // Clear search & filters button
        const clearSearchBtn = document.getElementById('clear-search-btn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                console.log("🧹 Clearing search and filters");
                this.clearAllFilters();
            });
            console.log("✅ Clear search button listener added");
        }
        
        // View toggle buttons
        const viewBtns = document.querySelectorAll('.view-btn');
        console.log(`🔘 Found ${viewBtns.length} view toggle buttons`);
        
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
            console.log("✅ Load more button listener added");
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
                console.log(`✅ ${name} newsletter form listener added`);
            } else {
                console.warn(`⚠️ ${name} newsletter form not found: ${id}`);
            }
        });
        
        // Add SEO analytics tracking
        this.setupSEOTracking();
        
        console.log("✅ All event listeners setup complete");
        console.groupEnd();
    }
    
    clearAllFilters() {
        console.log("🔄 Clearing all filters");
        console.group("Clear Filters");
        
        // Reset all filters
        const oldFilters = { ...this.currentFilters };
        this.currentFilters = {
            category: '',
            series: '',
            author: '',
            search: '',
            sort: 'newest'
        };
        
        console.log("Filters reset:", { from: oldFilters, to: this.currentFilters });
        
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
                console.log(`✅ Reset ${type} filter UI`);
            }
        });
        
        // Update clear button
        const searchClearBtn = document.querySelector('.search-clear-btn');
        if (searchClearBtn) {
            searchClearBtn.hidden = true;
            console.log("✅ Search clear button hidden");
        }
        
        // Apply filters (will reset everything)
        this.applyFilters();
        
        console.groupEnd();
    }
    
    switchView(view) {
        console.log(`🔄 Switching to ${view} view`);
        console.group("View Switch");
        
        const grid = document.getElementById('ebooks-grid');
        const viewBtns = document.querySelectorAll('.view-btn');
        
        if (!grid) {
            console.error("❌ Ebooks grid not found");
            return;
        }
        
        console.log(`Found ${viewBtns.length} view buttons`);
        
        // Update active button
        viewBtns.forEach(btn => {
            const isActive = btn.dataset.view === view;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-checked', isActive);
            if (isActive) {
                console.log(`✅ Activated ${view} view button`);
            }
        });
        
        // Update grid view
        const oldView = grid.dataset.view;
        grid.dataset.view = view;
        grid.className = `ebooks-grid ${view === 'list' ? 'list-view' : 'grid-view'}`;
        
        console.log(`View changed: ${oldView} → ${view}`);
        console.log(`Grid classes: ${grid.className}`);
        
        // Re-render books with new view
        this.renderBooks();
        
        console.groupEnd();
    }
    
    applyFilters() {
        console.log("🔄 Applying filters");
        console.group("Filter Application");
        
        console.log("Current filters:", this.currentFilters);
        console.log(`Starting with ${this.books.length} total books`);
        
        this.filteredBooks = [...this.books];
        
        // Apply search
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            const beforeSearch = this.filteredBooks.length;
            
            this.filteredBooks = this.filteredBooks.filter(book => {
                const matches = 
                    book.title?.toLowerCase().includes(searchTerm) ||
                    book.author?.toLowerCase().includes(searchTerm) ||
                    book.description?.toLowerCase().includes(searchTerm) ||
                    book.series?.toLowerCase().includes(searchTerm) ||
                    book.category?.toLowerCase().includes(searchTerm);
                return matches;
            });
            
            console.log(`🔍 Search filter "${searchTerm}": ${beforeSearch} → ${this.filteredBooks.length} books`);
        }
        
        // Apply category filter
        if (this.currentFilters.category) {
            const beforeCategory = this.filteredBooks.length;
            this.filteredBooks = this.filteredBooks.filter(
                book => book.category === this.currentFilters.category
            );
            console.log(`📂 Category filter "${this.currentFilters.category}": ${beforeCategory} → ${this.filteredBooks.length} books`);
        }
        
        // Apply series filter
        if (this.currentFilters.series) {
            const beforeSeries = this.filteredBooks.length;
            this.filteredBooks = this.filteredBooks.filter(
                book => book.series === this.currentFilters.series
            );
            console.log(`📚 Series filter "${this.currentFilters.series}": ${beforeSeries} → ${this.filteredBooks.length} books`);
        }
        
        // Apply author filter
        if (this.currentFilters.author) {
            const beforeAuthor = this.filteredBooks.length;
            this.filteredBooks = this.filteredBooks.filter(
                book => book.author === this.currentFilters.author
            );
            console.log(`✍️ Author filter "${this.currentFilters.author}": ${beforeAuthor} → ${this.filteredBooks.length} books`);
        }
        
        console.log(`📊 After filters: ${this.filteredBooks.length} books remaining`);
        
        // Apply sorting
        this.sortBooks();
        
        // Reset pagination
        this.currentPage = 1;
        console.log(`📄 Pagination reset to page 1`);
        
        // Update URL for SEO (optional)
        this.updateURL();
        
        // Re-render
        this.renderBooks();
        
        // Update results count
        this.updateResultsCount();
        
        console.groupEnd();
    }
    
    updateURL() {
        console.log("🌐 Updating browser URL");
        
        const params = new URLSearchParams();
        if (this.currentFilters.search) params.set('q', this.currentFilters.search);
        if (this.currentFilters.category) params.set('category', this.currentFilters.category);
        if (this.currentFilters.series) params.set('series', this.currentFilters.series);
        if (this.currentFilters.author) params.set('author', this.currentFilters.author);
        if (this.currentFilters.sort !== 'newest') params.set('sort', this.currentFilters.sort);
        
        const newUrl = params.toString() 
            ? `/ebooks?${params.toString()}`
            : '/ebooks';
        
        console.log(`URL parameters: ${params.toString() || 'none'}`);
        console.log(`New URL: ${newUrl}`);
        
        window.history.pushState({}, '', newUrl);
    }
    
    updateResultsCount() {
        console.log("🔢 Updating results count");
        
        const resultsCount = document.getElementById('ebooks-count');
        const noResults = document.getElementById('no-results');
        
        if (resultsCount) {
            resultsCount.textContent = this.filteredBooks.length;
            console.log(`✅ Results count updated: ${this.filteredBooks.length}`);
        }
        
        if (noResults) {
            const shouldHide = this.filteredBooks.length > 0;
            noResults.hidden = shouldHide;
            console.log(`📭 No results message ${shouldHide ? 'hidden' : 'shown'}`);
        }
    }
    
    render() {
        console.log("🎨 Rendering UI components");
        console.group("UI Rendering");
        
        // Render stats
        console.log("Step 1: Rendering stats");
        this.renderStats();
        
        // Render filters
        console.log("Step 2: Rendering filters");
        this.renderFilters();
        
        // Render books
        console.log("Step 3: Rendering books");
        this.renderBooks();
        
        // Render featured books (if any)
        console.log("Step 4: Rendering featured books");
        this.renderFeatured();
        
        // Render categories
        console.log("Step 5: Rendering categories");
        this.renderCategories();
        
        // Update results count
        console.log("Step 6: Updating results count");
        this.updateResultsCount();
        
        console.log("✅ All UI components rendered");
        console.groupEnd();
    }
    
    renderStats() {
        console.log("📊 Rendering statistics");
        console.group("Statistics");
        
        const totalBooks = document.getElementById('total-ebooks');
        const totalAuthors = document.getElementById('total-authors');
        const totalDownloads = document.getElementById('total-downloads');
        const totalSeries = document.getElementById('total-series');
        
        if (totalBooks) {
            totalBooks.textContent = this.books.length;
            console.log(`✅ Total books: ${this.books.length}`);
        }
        
        if (totalAuthors) {
            totalAuthors.textContent = this.authors.size;
            console.log(`✅ Total authors: ${this.authors.size}`);
        }
        
        if (totalSeries) {
            totalSeries.textContent = this.series.size;
            console.log(`✅ Total series: ${this.series.size}`);
        }
        
        // Calculate total downloads
        const downloads = this.books.reduce((sum, book) => sum + (book.download_count || 0), 0);
        if (totalDownloads) {
            const display = downloads >= 1000 
                ? `${Math.floor(downloads / 1000)}K`
                : downloads;
            totalDownloads.textContent = display;
            console.log(`✅ Total downloads: ${downloads} (display: ${display})`);
        }
        
        console.groupEnd();
    }
    
    renderFilters() {
        console.log("🔧 Rendering filter dropdowns");
        console.group("Filter Rendering");
        
        // Populate category dropdown
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            const categories = [...this.categories].sort();
            console.log(`Adding ${categories.length} categories to dropdown`);
            
            categories.forEach(category => {
                const option = el('option', '', { value: category, text: category });
                categoryFilter.appendChild(option);
            });
            console.log("✅ Category dropdown populated");
        }
        
        // Populate series dropdown
        const seriesFilter = document.getElementById('series-filter');
        if (seriesFilter) {
            const series = [...this.series].sort();
            console.log(`Adding ${series.length} series to dropdown`);
            
            series.forEach(seriesName => {
                const option = el('option', '', { value: seriesName, text: seriesName });
                seriesFilter.appendChild(option);
            });
            console.log("✅ Series dropdown populated");
        }
        
        // Populate author dropdown
        const authorFilter = document.getElementById('author-filter');
        if (authorFilter) {
            const authors = [...this.authors].sort();
            console.log(`Adding ${authors.length} authors to dropdown`);
            
            authors.forEach(author => {
                const option = el('option', '', { value: author, text: author });
                authorFilter.appendChild(option);
            });
            console.log("✅ Author dropdown populated");
        }
        
        // Render sidebar filters
        console.log("📋 Rendering sidebar filters");
        this.renderSidebarFilters();
        
        console.groupEnd();
    }
    
    renderSidebarFilters() {
        console.log("📁 Rendering sidebar filter lists");
        console.group("Sidebar Filters");
        
        const categoryList = document.getElementById('category-list');
        const seriesList = document.getElementById('series-list');
        const authorList = document.getElementById('author-list');
        
        console.log("Filter list elements:", {
            categoryList: !!categoryList,
            seriesList: !!seriesList,
            authorList: !!authorList
        });
        
        // Count occurrences
        const categoryCounts = {};
        const seriesCounts = {};
        const authorCounts = {};
        
        this.books.forEach(book => {
            if (book.category) categoryCounts[book.category] = (categoryCounts[book.category] || 0) + 1;
            if (book.series) seriesCounts[book.series] = (seriesCounts[book.series] || 0) + 1;
            if (book.author) authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
        });
        
        console.log("Category counts:", categoryCounts);
        console.log("Series counts:", seriesCounts);
        console.log("Top 5 author counts:", Object.entries(authorCounts).sort((a,b) => b[1]-a[1]).slice(0,5));
        
        // Render category list
        if (categoryList) {
            const categories = [...this.categories].sort();
            console.log(`Rendering ${categories.length} categories`);
            
            categoryList.innerHTML = categories
                .map(category => `
                    <div class="filter-item ${this.currentFilters.category === category ? 'active' : ''}"
                         data-type="category" 
                         data-value="${category}">
                        <span>${category}</span>
                        <span class="filter-count">${categoryCounts[category] || 0}</span>
                    </div>
                `).join('');
            console.log("✅ Category list rendered");
        }
        
        // Render series list
        if (seriesList) {
            const series = [...this.series].sort();
            console.log(`Rendering ${series.length} series`);
            
            seriesList.innerHTML = series
                .map(seriesName => `
                    <div class="filter-item ${this.currentFilters.series === seriesName ? 'active' : ''}"
                         data-type="series" 
                         data-value="${seriesName}">
                        <span>${seriesName}</span>
                        <span class="filter-count">${seriesCounts[seriesName] || 0}</span>
                    </div>
                `).join('');
            console.log("✅ Series list rendered");
        }
        
        // Render author list (top 10)
        if (authorList) {
            const topAuthors = [...this.authors]
                .sort((a, b) => (authorCounts[b] || 0) - (authorCounts[a] || 0))
                .slice(0, 10);
            
            console.log(`Rendering top ${topAuthors.length} authors`);
            
            authorList.innerHTML = topAuthors
                .map(author => `
                    <div class="filter-item ${this.currentFilters.author === author ? 'active' : ''}"
                         data-type="author" 
                         data-value="${author}">
                        <span>${author}</span>
                        <span class="filter-count">${authorCounts[author] || 0}</span>
                    </div>
                `).join('');
            console.log("✅ Author list rendered");
        }
        
        // Add click handlers to filter items
        const filterItems = document.querySelectorAll('.filter-item');
        console.log(`Adding click handlers to ${filterItems.length} filter items`);
        
        filterItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const type = item.dataset.type;
                const value = item.dataset.value;
                const wasActive = this.currentFilters[type] === value;
                
                if (wasActive) {
                    this.currentFilters[type] = ''; // Toggle off
                    console.log(`🔘 ${type} filter deactivated: "${value}"`);
                } else {
                    this.currentFilters[type] = value; // Toggle on
                    console.log(`🔘 ${type} filter activated: "${value}"`);
                }
                
                // Update dropdowns
                const dropdown = document.getElementById(`${type}-filter`);
                if (dropdown) {
                    dropdown.value = this.currentFilters[type];
                    console.log(`🔄 Updated ${type} dropdown to: "${this.currentFilters[type]}"`);
                }
                
                this.applyFilters();
            });
        });
        
        console.log("✅ Sidebar filters rendered");
        console.groupEnd();
    }
    
    renderFeatured() {
        console.log("⭐ Rendering featured books");
        console.group("Featured Books");
        
        const featuredContainer = document.getElementById('featured-ebooks');
        if (!featuredContainer) {
            console.warn("⚠️ Featured books container not found");
            return;
        }
        
        const featuredBooks = this.books
            .filter(book => book.featured)
            .slice(0, 4);
        
        console.log(`Found ${featuredBooks.length} featured books`);
        
        if (featuredBooks.length === 0) {
            featuredContainer.style.display = 'none';
            console.log("📭 No featured books, hiding container");
        } else {
            featuredContainer.style.display = '';
            featuredContainer.innerHTML = featuredBooks.map(book => `
                <div class="featured-card" onclick="ebookLibrary.openBookDetail('${book.id}')">
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
                            <button class="btn-outline" onclick="event.stopPropagation(); ebookLibrary.readBookOnline('${book.id}', '${book.title}')">
                                Read Online
                            </button>
                            <button class="btn-outline" onclick="event.stopPropagation(); ebookLibrary.downloadEbook('${book.id}', '${book.title}')">
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            
            console.log("✅ Featured books rendered");
            console.table(featuredBooks.map(b => ({ title: b.title, author: b.author, category: b.category })));
        }
        
        console.groupEnd();
    }
    
    renderCategories() {
        console.log("📂 Rendering category cards");
        console.group("Categories");
        
        const categoriesGrid = document.getElementById('categories-grid');
        if (!categoriesGrid) {
            console.warn("⚠️ Categories grid not found");
            return;
        }
        
        // Count books per category
        const categoryCounts = {};
        this.books.forEach(book => {
            if (book.category) {
                categoryCounts[book.category] = (categoryCounts[book.category] || 0) + 1;
            }
        });
        
        console.log("Category counts:", categoryCounts);
        
        // Get top 6 categories
        const topCategories = [...this.categories]
            .sort((a, b) => (categoryCounts[b] || 0) - (categoryCounts[a] || 0))
            .slice(0, 6);
        
        console.log(`Rendering top ${topCategories.length} categories`);
        
        categoriesGrid.innerHTML = topCategories.map(category => `
            <div class="category-card" onclick="ebookLibrary.filterByCategory('${category}')">
                <div class="category-icon">📚</div>
                <h3 class="category-name">${category}</h3>
                <p class="category-count">${categoryCounts[category] || 0} books</p>
            </div>
        `).join('');
        
        console.log("✅ Categories rendered");
        console.groupEnd();
    }
    
    filterByCategory(category) {
        console.log(`📂 Filtering by category: "${category}"`);
        this.currentFilters.category = category;
        document.getElementById('category-filter').value = category;
        console.log(`✅ Category filter set to: "${category}"`);
        this.applyFilters();
    }
    
    renderBooks() {
        console.log("📚 Rendering books with improved layout");
        
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
        
        // Render each book with improved structure
        booksToShow.forEach((book, index) => {
            const card = this.createBookCard(book, grid.dataset.view, index);
            grid.appendChild(card);
        });
        
        // Update load more button
        this.updateLoadMoreButton();
        
        console.log(`✅ ${booksToShow.length} books rendered successfully`);
    }
    
    createBookCard(book, view, index) {
        const isGridView = view === 'grid';
        
        if (isGridView) {
            return this.createBookGridItem(book);
        } else {
            return this.createBookListItem(book);
        }
    }
    
    createBookGridItem(book) {
        console.log(`📐 Creating grid item for: "${book.title}"`);
        
        const card = el('div', 'ebook-card grid-item');
        const optimizedImage = this.optimizeImageForSEO(book.cover_url);
        
        console.log(`Book cover URL: ${book.cover_url || 'none'} → Optimized: ${optimizedImage}`);
        
        card.innerHTML = `
            <div class="ebook-card-inner" itemprop="mainEntity" itemscope itemtype="https://schema.org/Book">
                <meta itemprop="url" content="${window.location.origin}/ebooks/${this.generateSlug(book.title)}">
                
                <div class="ebook-cover-container" onclick="ebookLibrary.openBookDetail('${book.id}')">
                    <div class="ebook-cover" 
                         style="background-image: url('${optimizedImage}')"
                         aria-label="Cover of ${book.title}"
                         itemprop="image">
                    </div>
                    ${book.featured ? '<span class="featured-badge">Featured</span>' : ''}
                </div>
                
                <div class="ebook-content">
                    <h3 class="ebook-title" itemprop="name">${book.title}</h3>
                    <p class="ebook-author" itemprop="author">${book.author || 'Unknown Author'}</p>
                    
                    <div class="ebook-meta">
                        ${book.category ? `<span class="ebook-category" itemprop="genre">${book.category}</span>` : ''}
                        ${book.read_time_minutes ? `<span class="ebook-duration">${book.read_time_minutes} min</span>` : ''}
                    </div>
                    
                    <div class="ebook-description" itemprop="description">
                        ${book.description ? `${book.description.substring(0, 100)}...` : 'Christian ebook for spiritual growth.'}
                    </div>
                    
                    <div class="ebook-actions">
                        <button class="btn-read" 
                                onclick="event.stopPropagation(); ebookLibrary.readBookOnline('${book.id}', '${book.title}')"
                                aria-label="Read ${book.title} online">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 20H5C3.89543 20 3 19.1046 3 18V6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M8 10H16M8 14H12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M15 19L18 22L23 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Read Online
                        </button>
                        
                        <button class="btn-download" 
                                onclick="event.stopPropagation(); ebookLibrary.downloadEbook('${book.id}', '${book.title}')"
                                aria-label="Download ${book.title}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Download PDF
                        </button>
                    </div>
                    
                    <div class="ebook-stats">
                        ${book.download_count ? `<span class="download-count">${this.formatNumber(book.download_count)} downloads</span>` : ''}
                        ${book.created_at ? `<span class="upload-date">${this.formatDate(book.created_at)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
        
        console.log(`✅ Grid card created for: "${book.title}"`);
        return card;
    }
    
    createBookListItem(book) {
        console.log(`📋 Creating list item for: "${book.title}"`);
        
        const item = el('div', 'ebook-card list-item');
        const optimizedImage = this.optimizeImageForSEO(book.cover_url);
        
        console.log(`Book data:`, {
            title: book.title,
            author: book.author,
            descriptionLength: book.description?.length || 0,
            category: book.category,
            series: book.series
        });
        
        item.innerHTML = `
            <div class="ebook-list-item-inner" itemprop="mainEntity" itemscope itemtype="https://schema.org/Book">
                <meta itemprop="url" content="${window.location.origin}/ebooks/${this.generateSlug(book.title)}">
                
                <div class="list-cover-container" onclick="ebookLibrary.openBookDetail('${book.id}')">
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
                                    onclick="event.stopPropagation(); ebookLibrary.readBookOnline('${book.id}', '${book.title}')"
                                    aria-label="Read ${book.title} online">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path d="M12 20H5C3.89543 20 3 19.1046 3 18V6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    <path d="M8 10H16M8 14H12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    <path d="M15 19L18 22L23 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Read Online
                            </button>
                            
                            <button class="btn-download-list" 
                                    
                                    onclick="event.stopPropagation(); ebookLibrary.downloadEbook('${book.id}', '${book.title}')"
                                    aria-label="Download ${book.title}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
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
        
        console.log(`✅ List item created for: "${book.title}"`);
        return item;
    }

    updateLoadMoreButton() {
        console.log("🔘 Updating load more button");
        console.group("Load More Button");
        
        const loadMoreBtn = document.getElementById('load-more-btn');
        const remainingCount = document.querySelector('.remaining-count');
        
        if (!loadMoreBtn) {
            console.warn("⚠️ Load more button not found");
            console.groupEnd();
            return;
        }
        
        const loadedCount = this.currentPage * this.itemsPerPage;
        const totalCount = this.filteredBooks.length;
        const remaining = totalCount - loadedCount;
        
        console.log(`Books: Loaded ${loadedCount} of ${totalCount}, ${remaining} remaining`);
        
        if (loadedCount >= totalCount) {
            loadMoreBtn.hidden = true;
            console.log("✅ Load more button hidden (all books loaded)");
        } else {
            loadMoreBtn.hidden = false;
            loadMoreBtn.textContent = `Load More Ebooks`;
            if (remainingCount) {
                remainingCount.textContent = `(${remaining} remaining)`;
                console.log(`✅ Remaining count updated: ${remaining} books`);
            }
            console.log("✅ Load more button shown");
        }
        
        console.groupEnd();
    }
    
    loadMore() {
        console.log("⬇️ Loading more books");
        console.group("Load More");
        
        const previousPage = this.currentPage;
        this.currentPage++;
        
        console.log(`Page incremented: ${previousPage} → ${this.currentPage}`);
        console.log(`Items per page: ${this.itemsPerPage}`);
        console.log(`Will show: ${this.currentPage * this.itemsPerPage} of ${this.filteredBooks.length} total`);
        
        this.renderBooks();
        
        console.log("✅ More books loaded");
        console.groupEnd();
    }
    
    openBookDetail(bookId) {
        console.log("📖 Opening book detail");
        console.group("Book Detail");
        
        const book = this.books.find(b => b.id === bookId);
        if (!book) {
            console.error(`❌ Book not found with ID: ${bookId}`);
            console.groupEnd();
            return;
        }
        
        console.log(`Book found: "${book.title}" by ${book.author}`);
        
        // Navigate to book detail page
        const slug = this.generateSlug(book.title);
        const seriesSlug = this.generateSlug(book.series || 'standalone');
        const newUrl = `/ebooks/${seriesSlug}/${slug}?id=${bookId}`;
        
        console.log(`Generated URL: ${newUrl}`);
        console.log(`Slug: ${slug}, Series slug: ${seriesSlug}`);
        
        window.location.href = newUrl;
        
        console.groupEnd();
    }
    
    // ================ SEO OPTIMIZATION METHODS ================

    setDynamicMetaTags() {
        console.log("🏷️ Setting dynamic SEO meta tags");
        
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
        console.log("🔗 Updating canonical URL");
        
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
        
        console.log(`✅ Canonical URL updated: ${canonicalURL}`);
    }

    updateOpenGraphTags() {
        console.log("🔄 Updating Open Graph tags");
        
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
        console.log("📊 Injecting comprehensive structured data");
        
        if (this.seoData.structuredDataInjected) {
            console.log("⚠️ Structured data already injected");
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

    // ================ IMPROVED FUNCTIONALITY METHODS ================

    async readBookOnline(bookId, bookTitle) {
        console.log(`👁️ Reading book online: "${bookTitle}"`);
        
        const book = this.books.find(b => b.id === bookId);
        if (!book) {
            this.showToast('Book not found');
            return;
        }
        
        // Track read event for analytics
        try {
            await api.post(`/ebooks/${bookId}/read`);
            
            // SEO event tracking
            this.trackSEOMetric('book_read', {
                book_id: bookId,
                book_title: bookTitle,
                category: book.category,
                author: book.author
            });
        } catch (error) {
            console.error("⚠️ Failed to track read event:", error);
        }
        
        // Open reading interface in new tab
        const readUrl = `${API}/ebooks/read/${bookId}`;
        const features = 'width=1200,height=800,scrollbars=yes,resizable=yes';
        const newWindow = window.open(readUrl, '_blank', features);
        
        if (newWindow) {
            // Focus the new window
            newWindow.focus();
            this.showToast(`Opening "${bookTitle}" for reading`);
        } else {
            this.showToast('Please allow popups to read the book');
        }
    }

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
        
        // Create download link
        const downloadUrl = `${API}/ebooks/download/${bookId}`;
        const fileName = `${this.generateSlug(bookTitle)}.pdf`;
        
        // Use Fetch API for better error handling
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
            this.showToast('Download failed. Please try again.');
            
            // Fallback to direct link
            window.location.href = downloadUrl;
        }
    }

    // ================ SEO HELPER METHODS ================

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
        
        // Add lazy loading attribute
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

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
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

    // ================ SEO TRACKING AND ANALYTICS ================

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
            if (e.target.closest('.btn-read, .btn-read-list')) {
                const bookCard = e.target.closest('[itemtype="https://schema.org/Book"]');
                if (bookCard) {
                    const title = bookCard.querySelector('[itemprop="name"]')?.textContent;
                    this.trackSEOMetric('read_clicked', { book_title: title });
                }
            }
            
            if (e.target.closest('.btn-download, .btn-download-list')) {
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

    setupPerformanceMonitoring() {
        // Track Core Web Vitals
        const perfObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                console.log(`⚡ Performance: ${entry.name} = ${entry.startTime}ms`);
                
                // Log to analytics if LCP, FID, or CLS
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

    // ================ IMPROVED TOAST NOTIFICATION ================

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

    // ================ ADDITIONAL ORIGINAL METHODS ================
    
    async handleNewsletter(e) {
        console.log("📧 Handling newsletter subscription");
        console.group("Newsletter");
        
        e.preventDefault();
        const form = e.target;
        const emailInput = form.querySelector('input[type="email"]');
        const email = emailInput?.value;
        
        if (!email) {
            console.error("❌ No email provided");
            this.showToast('Please enter an email address');
            console.groupEnd();
            return;
        }
        
        console.log(`Email: ${email}`);
        console.log(`Form:`, form);
        
        try {
            console.log("📡 Subscribing to newsletter via API");
            await api.post('/newsletter/subscribe', { email });
            
            console.log("✅ Successfully subscribed");
            this.showToast('Subscribed successfully!', 'success');
            
            // Reset form
            form.reset();
            console.log("✅ Form reset");
            
            // Track subscription
            this.trackSEOMetric('newsletter_subscription', { email: email });
            
        } catch (error) {
            console.error("❌ Subscription failed:", error);
            this.showToast('Subscription failed. Please try again.', 'error');
        }
        
        console.groupEnd();
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
        
        console.log("🌐 API:", {
            API: API,
            baseURL: window.location.origin
        });
        
        console.log("🔧 DOM Elements:", {
            container: this.container,
            searchOverlay: document.querySelector('.search-overlay')?.hidden,
            grid: document.getElementById('ebooks-grid'),
            filters: {
                category: document.getElementById('category-filter')?.value,
                search: document.getElementById('ebook-search')?.value
            }
        });
        
        console.groupEnd();
        return this;
    }
    
    debugSearchOverlay() {
        console.log("🔍 Debugging Search Overlay");
        console.group("Search Overlay Debug");
        
        const overlay = document.querySelector('.search-overlay');
        const searchBtn = document.querySelector('.nav-search-btn');
        const searchInput = document.querySelector('#global-search');
        
        console.log("Elements:", {
            overlay: {
                element: overlay,
                exists: !!overlay,
                hidden: overlay?.hidden,
                display: overlay?.style.display,
                computedDisplay: overlay ? getComputedStyle(overlay).display : 'N/A',
                classes: overlay?.className
            },
            searchBtn: {
                element: searchBtn,
                exists: !!searchBtn,
                type: searchBtn?.nodeName
            },
            searchInput: {
                element: searchInput,
                exists: !!searchInput,
                value: searchInput?.value
            }
        });
        
        console.log("Event Listeners:", {
            searchBtnClick: searchBtn ? searchBtn.onclick : 'none',
            overlayClick: overlay ? overlay.onclick : 'none'
        });
        
        console.log("CSS Classes:", {
            body: document.body.className,
            overlay: overlay?.className,
            hasActive: overlay?.classList.contains('active')
        });
        
        console.groupEnd();
    }
    
    dumpBooks() {
        console.log("📋 Dumping All Books");
        console.group("Books Data");
        
        console.table(this.books.map(book => ({
            id: book.id,
            title: book.title,
            author: book.author,
            category: book.category,
            series: book.series,
            downloads: book.download_count || 0,
            featured: book.featured || false
        })));
        
        console.groupEnd();
        return this;
    }
}

// Export the enhanced class
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
        console.log("- window.ebookLibrary.debugSearchOverlay() - Debug search");
        console.log("- window.ebookLibrary.dumpBooks() - List all books");
        console.log("- window.ebookLibrary.openSearchOverlay() - Open search");
        console.log("- window.ebookLibrary.closeSearchOverlay() - Close search");
    };
    
    console.log("✅ Global debug helper available: window.debugEbooks()");
}