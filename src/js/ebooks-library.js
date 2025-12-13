// src/js/ebooks-library.js
import { api, API } from "../../api.js";
import { el } from "../../utils.js";

class EbooksLibrary {
    constructor() {
        console.log("📚 EbooksLibrary constructor called");
        
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
    }
    
    async init(container) {
        console.log("🚀 EbooksLibrary.init() called");
        
        this.container = container;
        
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
        
        // Make library globally accessible
        window.ebookLibrary = this;
        
        return this;
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

    // ================ IMPROVED UI METHODS ================

    setupEventListeners() {
        console.log("🎮 Setting up event listeners");
        
        // Search input with debouncing (SEO-friendly)
        const searchInput = document.getElementById('ebook-search');
        if (searchInput) {
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
                }, 350); // 350ms delay for better UX
            };
            
            searchInput.addEventListener('input', searchHandler);
        }
        
        // Setup other event listeners (keep your existing code)
        // ... rest of your event listeners code
        
        // Add SEO analytics tracking
        this.setupSEOTracking();
    }

    updateMetaTagsForSearch(searchTerm) {
        document.title = `Search: ${searchTerm} | Christian Ebooks Library`;
        
        let metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = `Find Christian ebooks about ${searchTerm}. Free downloads for spiritual growth and Bible study.`;
        }
        
        this.updateOpenGraphTags();
    }

    // ================ IMPROVED RENDER METHODS ================

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
        
        // Add CSS classes for responsive grid
        const view = grid.dataset.view || 'grid';
        grid.className = `ebooks-grid ${view}-view ${view === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : ''}`;
        
        // Render each book with improved structure
        booksToShow.forEach((book, index) => {
            const card = this.createBookCard(book, view, index);
            grid.appendChild(card);
        });
        
        // Update load more button
        this.updateLoadMoreButton();
        
        // Update structured data for pagination
        this.updateStructuredDataForPagination();
    }

    createBookCard(book, view, index) {
        const isGridView = view === 'grid';
        const card = el('div', `ebook-card ${isGridView ? 'grid-item' : 'list-item'}`);
        
        // Add microdata for SEO
        card.setAttribute('itemscope', '');
        card.setAttribute('itemtype', 'https://schema.org/Book');
        
        const optimizedImage = this.optimizeImageForSEO(book.cover_url);
        const downloadUrl = `${API}/ebooks/download/${book.id}`;
        const readUrl = `${API}/ebooks/read/${book.id}`;
        
        if (isGridView) {
            // IMPROVED GRID VIEW - Responsive with 2 columns on mobile
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
        } else {
            // IMPROVED LIST VIEW - Better spacing and readability
            card.innerHTML = `
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
                                    Download
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
        }
        
        return card;
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

    updateStructuredDataForPagination() {
        // Update ListItem positions for current page
        const listSchema = document.getElementById('collection-schema');
        if (listSchema) {
            try {
                const schemaData = JSON.parse(listSchema.textContent);
                const startIndex = (this.currentPage - 1) * this.itemsPerPage;
                
                if (schemaData.mainEntity && schemaData.mainEntity.itemListElement) {
                    schemaData.mainEntity.itemListElement.forEach((item, index) => {
                        const bookIndex = startIndex + index;
                        if (this.filteredBooks[bookIndex]) {
                            item.position = bookIndex + 1;
                            item.item.name = this.filteredBooks[bookIndex].title;
                            item.item.author.name = this.filteredBooks[bookIndex].author || "Unknown Author";
                        }
                    });
                    
                    listSchema.textContent = JSON.stringify(schemaData, null, 2);
                }
            } catch (error) {
                console.error('Failed to update pagination schema:', error);
            }
        }
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

    // ================ KEEP YOUR EXISTING METHODS ================
    // Add the rest of your methods here (setupNavigation, loadData, etc.)
    // Make sure to integrate the SEO improvements into them
    
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
    
    /* Responsive grid styles */
    .ebooks-grid.grid-view {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
    }
    
    @media (min-width: 768px) {
        .ebooks-grid.grid-view {
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        }
    }
    
    @media (min-width: 1024px) {
        .ebooks-grid.grid-view {
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
        }
    }
    
    .ebooks-grid.list-view {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    
    /* Improved card styles */
    .ebook-card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .ebook-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }
    
    .ebook-card .ebook-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
    }
    
    .ebook-card .btn-read,
    .ebook-card .btn-download {
        flex: 1;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.2s;
    }
    
    .ebook-card .btn-read {
        background: #007AFF;
        color: white;
        border: none;
    }
    
    .ebook-card .btn-read:hover {
        background: #0056CC;
    }
    
    .ebook-card .btn-download {
        background: white;
        color: #007AFF;
        border: 1px solid #007AFF;
    }
    
    .ebook-card .btn-download:hover {
        background: #f0f7ff;
    }
`;

document.head.appendChild(toastStyles);