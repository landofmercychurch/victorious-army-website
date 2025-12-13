// src/ebooks-library.js
import { api, API } from "./api.js";
import { el } from "./utils.js";

class EbooksLibrary {
    constructor() {
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
    }
    
    async init(container) {
        this.container = container;
        
        // 1. Set SEO meta tags
        this.setMetaTags();
        
        // 2. Setup navigation and search FIRST
        this.setupNavigation();
        
        // 3. Load data using YOUR EXACT API PATTERN
        await this.loadData();
        
        // 4. Setup UI and events
        this.setupEventListeners();
        
        // 5. Render everything
        this.render();
        
        // 6. Inject structured data for SEO
        this.injectStructuredData();
        
        return this;
    }
    
    setupNavigation() {
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
    
    // Search overlay functionality - CALL THE METHOD
    this.setupSearchOverlay();  // <-- CORRECT: Call the existing method
}
    const searchBtn = document.querySelector('.nav-search-btn');
    const searchOverlay = document.querySelector('.search-overlay');
    const searchCloseBtn = document.querySelector('.search-close-btn');
    const searchInput = document.querySelector('#global-search');
    
    console.log('Search overlay setup - Elements:', {
        searchBtn: !!searchBtn,
        searchOverlay: !!searchOverlay,
        searchCloseBtn: !!searchCloseBtn,
        searchInput: !!searchInput
    });
    
    if (!searchBtn || !searchOverlay) {
        console.warn('Search overlay elements not found');
        return;
    }
    
    // Initialize overlay as hidden
    this.closeSearchOverlay();
    
    // Open search overlay
    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Opening search overlay');
        this.openSearchOverlay();
    });
    
    // Close search overlay with close button
    if (searchCloseBtn) {
        searchCloseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Closing via close button');
            this.closeSearchOverlay();
        });
    }
    
    // Close search overlay when clicking on overlay background
    searchOverlay.addEventListener('click', (e) => {
        if (e.target === searchOverlay) {
            console.log('Closing via background click');
            this.closeSearchOverlay();
        }
    });
    
    // Close search overlay with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !searchOverlay.hidden) {
            console.log('Closing via Escape key');
            this.closeSearchOverlay();
        }
    });
    
    // Auto-close after 15 seconds of inactivity
    let inactivityTimer;
    const resetInactivityTimer = () => {
        clearTimeout(inactivityTimer);
        if (!searchOverlay.hidden) {
            inactivityTimer = setTimeout(() => {
                console.log('Auto-closing due to inactivity');
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
    
    // Handle search form submission
    const searchForm = document.querySelector('.search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchTerm = searchInput?.value.trim();
            
            if (searchTerm) {
                console.log('Search submitted:', searchTerm);
                this.closeSearchOverlay();
                
                // Transfer search to main search input
                const mainSearch = document.getElementById('ebook-search');
                if (mainSearch) {
                    mainSearch.value = searchTerm;
                    this.currentFilters.search = searchTerm;
                    this.applyFilters();
                }
            }
        });
    }
    
    // Clear search button functionality (inside overlay)
    const searchClearBtn = document.querySelector('.search-clear-btn');
    if (searchClearBtn && searchInput) {
        // Show/hide clear button based on input
        searchInput.addEventListener('input', (e) => {
            searchClearBtn.hidden = !e.target.value.trim();
        });
        
        // Clear input when button clicked
        searchClearBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            searchInput.value = '';
            searchClearBtn.hidden = true;
            searchInput.focus();
            resetInactivityTimer();
        });
    }
    
    // Main search action button (outside overlay)
    const searchActionBtn = document.querySelector('.search-action-btn');
    if (searchActionBtn) {
        searchActionBtn.addEventListener('click', () => {
            const mainSearchInput = document.getElementById('ebook-search');
            if (mainSearchInput) {
                this.currentFilters.search = mainSearchInput.value;
                this.applyFilters();
            }
        });
    }
    
    console.log('Search overlay setup complete');
}

// NEW HELPER METHOD: Open search overlay
openSearchOverlay() {
    const searchOverlay = document.querySelector('.search-overlay');
    const searchInput = document.querySelector('#global-search');
    
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
    }
    
    if (searchInput) {
        setTimeout(() => {
            searchInput.focus();
            searchInput.select();
        }, 100);
    }
}

// NEW HELPER METHOD: Close search overlay
closeSearchOverlay() {
    const searchOverlay = document.querySelector('.search-overlay');
    const searchInput = document.querySelector('#global-search');
    
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
    }
    
    if (searchInput) {
        searchInput.blur();
    }
}

// Optional: Add this method to your class for debugging
debugOverlayState() {
    const overlay = document.querySelector('.search-overlay');
    const state = {
        element: overlay,
        hidden: overlay?.hidden,
        display: overlay?.style.display,
        computedDisplay: overlay ? getComputedStyle(overlay).display : 'N/A',
        visibility: overlay ? getComputedStyle(overlay).visibility : 'N/A',
        opacity: overlay ? getComputedStyle(overlay).opacity : 'N/A',
        hasActiveClass: overlay?.classList.contains('active'),
        bodyHasClass: document.body.classList.contains('search-overlay-open')
    };
    console.log('🔍 Overlay State:', state);
    return state;
}
    
    setMetaTags() {
        // Update page title
        document.title = 'Christian Ebook Library | Free Spiritual Resources';
        
        // Update meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = 'Browse and download free Christian ebooks. Spiritual growth books, Bible study guides, prayer books, and theology resources.';
        
        // Update Open Graph
        this.updateOpenGraph();
    }
    
    updateOpenGraph() {
        const tags = {
            'og:title': 'Christian Ebook Library',
            'og:description': 'Free Christian ebooks for spiritual growth and Bible study',
            'og:image': `${window.location.origin}/images/ebook-library-og.jpg`,
            'og:url': window.location.href,
            'og:type': 'website'
        };
        
        Object.entries(tags).forEach(([property, content]) => {
            let meta = document.querySelector(`meta[property="${property}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('property', property);
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', content);
        });
    }
    
    async loadData() {
        try {
            // USE YOUR EXACT API CALL
            this.books = await api.get("/ebooks");
            
            // Extract metadata
            this.books.forEach(book => {
                if (book.category) this.categories.add(book.category);
                if (book.series) this.series.add(book.series);
                if (book.author) this.authors.add(book.author);
            });
            
            // Set initial filtered books
            this.filteredBooks = [...this.books];
            
            // Sort by newest first (default)
            this.sortBooks();
            
        } catch (error) {
            console.error('Failed to load ebooks:', error);
            throw error;
        }
    }
    
    sortBooks() {
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
            default:
                this.filteredBooks.sort((a, b) => 
                    new Date(b.created_at) - new Date(a.created_at)
                );
        }
    }
    
    setupEventListeners() {
        // Search input (main search)
        const searchInput = document.getElementById('ebook-search');
        if (searchInput) {
            // Update clear button visibility
            const searchClearBtn = document.querySelector('.search-clear-btn');
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value;
                this.applyFilters();
                
                // Show/hide clear button
                if (searchClearBtn) {
                    searchClearBtn.hidden = !e.target.value;
                }
            });
            
            // Clear search button
            const clearBtn = document.querySelector('.search-clear-btn');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    searchInput.value = '';
                    this.currentFilters.search = '';
                    clearBtn.hidden = true;
                    this.applyFilters();
                    searchInput.focus();
                });
            }
        }
        
        // Filters
        document.getElementById('category-filter')?.addEventListener('change', (e) => {
            this.currentFilters.category = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('series-filter')?.addEventListener('change', (e) => {
            this.currentFilters.series = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('author-filter')?.addEventListener('change', (e) => {
            this.currentFilters.author = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('sort-filter')?.addEventListener('change', (e) => {
            this.currentFilters.sort = e.target.value;
            this.applyFilters();
        });
        
        // Clear all filters button
        document.getElementById('clear-filters')?.addEventListener('click', () => {
            this.clearAllFilters();
        });
        
        // Clear search & filters button
        document.getElementById('clear-search-btn')?.addEventListener('click', () => {
            this.clearAllFilters();
        });
        
        // View toggle buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });
        
        // Load more button
        document.getElementById('load-more-btn')?.addEventListener('click', () => {
            this.loadMore();
        });
        
        // Newsletter forms
        document.getElementById('hero-newsletter')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleNewsletter(e);
        });
        
        document.getElementById('main-newsletter')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleNewsletter(e);
        });
    }
    
    clearAllFilters() {
        // Reset all filters
        this.currentFilters = {
            category: '',
            series: '',
            author: '',
            search: '',
            sort: 'newest'
        };
        
        // Reset UI elements
        document.getElementById('ebook-search').value = '';
        document.getElementById('category-filter').value = '';
        document.getElementById('series-filter').value = '';
        document.getElementById('author-filter').value = '';
        document.getElementById('sort-filter').value = 'newest';
        
        // Update clear button
        const searchClearBtn = document.querySelector('.search-clear-btn');
        if (searchClearBtn) {
            searchClearBtn.hidden = true;
        }
        
        // Apply filters (will reset everything)
        this.applyFilters();
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
        grid.dataset.view = view;
        grid.className = `ebooks-grid ${view === 'list' ? 'list-view' : 'grid-view'}`;
        
        // Re-render books with new view
        this.renderBooks();
    }
    
    applyFilters() {
        this.filteredBooks = [...this.books];
        
        // Apply search
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            this.filteredBooks = this.filteredBooks.filter(book => 
                book.title?.toLowerCase().includes(searchTerm) ||
                book.author?.toLowerCase().includes(searchTerm) ||
                book.description?.toLowerCase().includes(searchTerm) ||
                book.series?.toLowerCase().includes(searchTerm) ||
                book.category?.toLowerCase().includes(searchTerm)
            );
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
        
        // Apply sorting
        this.sortBooks();
        
        // Reset pagination
        this.currentPage = 1;
        
        // Update URL for SEO (optional)
        this.updateURL();
        
        // Re-render
        this.renderBooks();
        
        // Update results count
        this.updateResultsCount();
    }
    
    updateURL() {
        // Update browser URL without reloading
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
    
    render() {
        // Render stats
        this.renderStats();
        
        // Render filters
        this.renderFilters();
        
        // Render books
        this.renderBooks();
        
        // Render featured books (if any)
        this.renderFeatured();
        
        // Render categories
        this.renderCategories();
        
        // Update results count
        this.updateResultsCount();
    }
    
    renderStats() {
        const totalBooks = document.getElementById('total-ebooks');
        const totalAuthors = document.getElementById('total-authors');
        const totalDownloads = document.getElementById('total-downloads');
        const totalSeries = document.getElementById('total-series');
        
        if (totalBooks) totalBooks.textContent = this.books.length;
        if (totalAuthors) totalAuthors.textContent = this.authors.size;
        if (totalSeries) totalSeries.textContent = this.series.size;
        
        // Calculate total downloads
        const downloads = this.books.reduce((sum, book) => sum + (book.download_count || 0), 0);
        if (totalDownloads) {
            totalDownloads.textContent = downloads >= 1000 
                ? `${Math.floor(downloads / 1000)}K`
                : downloads;
        }
    }
    
    renderFilters() {
        // Populate category dropdown
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            [...this.categories].sort().forEach(category => {
                const option = el('option', '', { value: category, text: category });
                categoryFilter.appendChild(option);
            });
        }
        
        // Populate series dropdown
        const seriesFilter = document.getElementById('series-filter');
        if (seriesFilter) {
            [...this.series].sort().forEach(series => {
                const option = el('option', '', { value: series, text: series });
                seriesFilter.appendChild(option);
            });
        }
        
        // Populate author dropdown
        const authorFilter = document.getElementById('author-filter');
        if (authorFilter) {
            [...this.authors].sort().forEach(author => {
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
            categoryList.innerHTML = [...this.categories]
                .sort()
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
            seriesList.innerHTML = [...this.series]
                .sort()
                .map(series => `
                    <div class="filter-item ${this.currentFilters.series === series ? 'active' : ''}"
                         data-type="series" 
                         data-value="${series}">
                        <span>${series}</span>
                        <span class="filter-count">${seriesCounts[series] || 0}</span>
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
        document.querySelectorAll('.filter-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const type = item.dataset.type;
                const value = item.dataset.value;
                
                if (this.currentFilters[type] === value) {
                    this.currentFilters[type] = ''; // Toggle off
                } else {
                    this.currentFilters[type] = value; // Toggle on
                }
                
                // Update dropdowns
                document.getElementById(`${type}-filter`).value = this.currentFilters[type];
                
                this.applyFilters();
            });
        });
    }
    
    renderFeatured() {
        const featuredContainer = document.getElementById('featured-ebooks');
        if (!featuredContainer) return;
        
        const featuredBooks = this.books
            .filter(book => book.featured)
            .slice(0, 4);
        
        if (featuredBooks.length === 0) {
            featuredContainer.style.display = 'none';
            return;
        }
        
        featuredContainer.innerHTML = featuredBooks.map(book => `
            <div class="featured-card" onclick="ebookLibrary.openBookDetail('${book.id}')">
                <div class="featured-cover" 
                     style="background-image: url('${this.optimizeImage(book.cover_url)}')">
                </div>
                <div class="featured-content">
                    <div class="featured-badges">
                        <span class="badge featured">Featured</span>
                        ${book.category ? `<span class="badge">${book.category}</span>` : ''}
                    </div>
                    <h3 class="featured-title">${book.title}</h3>
                    <p class="featured-author">by ${book.author || 'Unknown'}</p>
                    <div class="featured-actions">
                        <button class="btn-outline" onclick="event.stopPropagation(); ebookLibrary.readBook('${book.id}')">
                            Read
                        </button>
                        <button class="btn-outline" onclick="event.stopPropagation(); ebookLibrary.downloadBook('${book.id}')">
                            Download
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
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
    
    renderBooks() {
        const grid = document.getElementById('ebooks-grid');
        if (!grid) return;
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const booksToShow = this.filteredBooks.slice(startIndex, endIndex);
        
        // Clear existing
        grid.innerHTML = '';
        
        if (booksToShow.length === 0) {
            const noResults = document.getElementById('no-results');
            if (noResults) {
                noResults.hidden = false;
            }
            return;
        }
        
        // Render each book
        booksToShow.forEach(book => {
            const card = this.createBookCard(book);
            grid.appendChild(card);
        });
        
        // Update load more button
        this.updateLoadMoreButton();
    }
    
    createBookCard(book) {
        const view = document.getElementById('ebooks-grid')?.dataset.view || 'grid';
        
        if (view === 'list') {
            return this.createBookListItem(book);
        }
        
        return this.createBookGridItem(book);
    }
    
    createBookGridItem(book) {
        const card = el('div', 'ebook-card');
        
        const optimizedImage = this.optimizeImage(book.cover_url);
        
        card.innerHTML = `
            <div class="ebook-cover" 
                 style="background-image: url('${optimizedImage}')"
                 onclick="ebookLibrary.openBookDetail('${book.id}')">
            </div>
            <div class="ebook-info">
                <h3 class="ebook-title">${book.title}</h3>
                <p class="ebook-author">${book.author || 'Unknown Author'}</p>
                <div class="ebook-meta">
                    ${book.category ? `<span>${book.category}</span>` : ''}
                    ${book.read_time_minutes ? `<span>${book.read_time_minutes} min</span>` : ''}
                </div>
                <div class="ebook-actions">
                    <button class="btn-small" onclick="event.stopPropagation(); ebookLibrary.readBook('${book.id}')">
                        Read
                    </button>
                    <button class="btn-small outline" onclick="event.stopPropagation(); ebookLibrary.downloadBook('${book.id}')">
                        Download
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }
    
    createBookListItem(book) {
        const item = el('div', 'ebook-list-item');
        
        const optimizedImage = this.optimizeImage(book.cover_url);
        
        item.innerHTML = `
            <div class="list-cover" 
                 style="background-image: url('${optimizedImage}')"
                 onclick="ebookLibrary.openBookDetail('${book.id}')">
            </div>
            <div class="list-info">
                <h3 class="list-title">${book.title}</h3>
                <p class="list-author">by ${book.author || 'Unknown Author'}</p>
                ${book.description ? `<p class="list-description">${book.description.substring(0, 150)}...</p>` : ''}
                <div class="list-meta">
                    ${book.category ? `<span class="list-category">${book.category}</span>` : ''}
                    ${book.series ? `<span class="list-series">${book.series}</span>` : ''}
                    ${book.read_time_minutes ? `<span class="list-time">${book.read_time_minutes} min read</span>` : ''}
                </div>
            </div>
            <div class="list-actions">
                <button class="btn-small" onclick="event.stopPropagation(); ebookLibrary.readBook('${book.id}')">
                    Read
                </button>
                <button class="btn-small outline" onclick="event.stopPropagation(); ebookLibrary.downloadBook('${book.id}')">
                    Download
                </button>
            </div>
        `;
        
        return item;
    }
    
    optimizeImage(url) {
        if (!url) return 'https://via.placeholder.com/180x240?text=No+Cover';
        
        // Optimize Cloudinary URLs
        if (url.includes('cloudinary.com') && url.includes('/upload/')) {
            return url.replace('/upload/', '/upload/f_auto,q_auto,w_400/');
        }
        
        return url;
    }
    
    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('load-more-btn');
        const remainingCount = document.querySelector('.remaining-count');
        
        if (!loadMoreBtn) return;
        
        const loadedCount = this.currentPage * this.itemsPerPage;
        const totalCount = this.filteredBooks.length;
        
        if (loadedCount >= totalCount) {
            loadMoreBtn.hidden = true;
        } else {
            loadMoreBtn.hidden = false;
            const remaining = totalCount - loadedCount;
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
    
    openBookDetail(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book) return;
        
        // Navigate to book detail page
        const slug = this.generateSlug(book.title);
        const seriesSlug = this.generateSlug(book.series || 'standalone');
        window.location.href = `/ebooks/${seriesSlug}/${slug}?id=${bookId}`;
    }
    
    generateSlug(text) {
        if (!text) return 'untitled';
        return text.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    
    async readBook(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book) return;
        
        // Track read event (optional)
        try {
            await api.post(`/ebooks/${bookId}/read`);
        } catch (error) {
            console.error('Failed to track read:', error);
        }
        
        // Open in new tab
        window.open(`${API}/ebooks/read/${bookId}`, '_blank');
    }
    
    async downloadBook(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book) return;
        
        // Track download event (optional)
        try {
            await api.post(`/ebooks/${bookId}/download`);
        } catch (error) {
            console.error('Failed to track download:', error);
        }
        
        // Trigger download
        const link = document.createElement('a');
        link.href = `${API}/ebooks/download/${bookId}`;
        link.download = `${this.generateSlug(book.title)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show notification
        this.showToast('Download started!');
    }
    
    showToast(message) {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #007AFF;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    async handleNewsletter(e) {
        e.preventDefault();
        const form = e.target;
        const email = form.querySelector('input[type="email"]').value;
        
        try {
            await api.post('/newsletter/subscribe', { email });
            this.showToast('Subscribed successfully!');
            form.reset();
        } catch (error) {
            this.showToast('Subscription failed. Please try again.');
        }
    }
    
    injectStructuredData() {
        // Website schema
        const websiteSchema = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Christian Ebook Library",
            "url": window.location.origin,
            "potentialAction": {
                "@type": "SearchAction",
                "target": `${window.location.origin}/ebooks?q={search_term_string}`,
                "query-input": "required name=search_term_string"
            }
        };
        
        // Book collection schema
        const collectionSchema = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Christian Ebook Collection",
            "description": "Free Christian ebooks for spiritual growth",
            "hasPart": this.books.slice(0, 10).map(book => ({
                "@type": "Book",
                "name": book.title,
                "author": book.author,
                "url": `${window.location.origin}/ebooks/${this.generateSlug(book.title)}`
            }))
        };
        
        // Inject schemas
        this.injectSchema(websiteSchema, 'website-schema');
        this.injectSchema(collectionSchema, 'collection-schema');
    }
    
    injectSchema(schemaData, id) {
        // Remove existing
        const existing = document.getElementById(id);
        if (existing) existing.remove();
        
        // Create new
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = id;
        script.textContent = JSON.stringify(schemaData);
        document.head.appendChild(script);
    }
}

// Export for use
export default EbooksLibrary;
