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
        
        // Social sharing configuration
        this.socialConfig = {
            twitter: {
                via: 'YourChurchName',
                hashtags: 'ChristianEbooks,FreeEbooks,SpiritualGrowth'
            },
            facebook: {
                appId: 'YOUR_FACEBOOK_APP_ID'
            },
            whatsapp: {
                text: 'Check out this free Christian ebook: '
            },
            email: {
                subject: 'Free Christian Ebook Recommendation',
                body: 'I found this free Christian ebook that you might like:\n\n'
            }
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
        
        // 3. Create social sharing modal
        console.log("Step 3: Creating social sharing modal");
        this.createSocialSharingModal();
        
        // 4. Setup navigation and search
        console.log("Step 4: Setting up navigation");
        this.setupNavigation();
        
        // 5. Load data
        console.log("Step 5: Loading data");
        await this.loadData();
        
        // 6. Setup UI and events
        console.log("Step 6: Setting up event listeners");
        this.setupEventListeners();
        
        // 7. Render everything
        console.log("Step 7: Rendering UI");
        this.render();
        
        // 8. Check URL for book ID and open modal if present
        console.log("Step 8: Checking URL parameters");
        this.checkURLForBookDetail();
        
        // 9. Inject comprehensive structured data
        console.log("Step 9: Injecting structured data");
        this.injectComprehensiveStructuredData();
        
        // 10. Setup performance monitoring
        console.log("Step 10: Setting up performance monitoring");
        this.setupPerformanceMonitoring();
        
        console.log("✅ EbooksLibrary initialization complete");
        console.groupEnd();
        
        // Make library globally accessible for debugging
        window.ebookLibrary = this;
        console.log("🌐 Library available globally as window.ebookLibrary");
        
        return this;
    }
    
    // ================ SOCIAL SHARING MODAL METHODS ================
    
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
        
        // Add CSS styles for the modal
        this.addSocialSharingModalStyles();
    }
    
    addSocialSharingModalStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            /* Social sharing modal styles */
            .social-sharing-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                justify-content: center;
                align-items: center;
                -webkit-overflow-scrolling: touch;
            }
            
            .social-sharing-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
                z-index: 1;
            }
            
            .social-sharing-container {
                position: relative;
                width: 90%;
                max-width: 500px;
                background: white;
                border-radius: 20px;
                padding: 30px;
                z-index: 2;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                animation: modalSlideIn 0.3s ease;
            }
            
            @keyframes modalSlideIn {
                from {
                    transform: translateY(-20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            .social-sharing-close {
                position: absolute;
                top: 20px;
                right: 20px;
                width: 40px;
                height: 40px;
                background: #f8f8f8;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: none;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .social-sharing-close:hover {
                background: #e8e8e8;
                transform: rotate(90deg);
            }
            
            .social-sharing-header {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .social-sharing-title {
                font-size: 24px;
                font-weight: 700;
                color: #1D1D1F;
                margin-bottom: 8px;
            }
            
            .social-sharing-subtitle {
                font-size: 16px;
                color: #666;
            }
            
            .sharing-options-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 30px;
            }
            
            @media (min-width: 480px) {
                .sharing-options-grid {
                    grid-template-columns: repeat(4, 1fr);
                }
            }
            
            .sharing-option {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 20px 10px;
                background: #f8f8f8;
                border-radius: 12px;
                border: none;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .sharing-option:hover {
                background: #e8e8e8;
                transform: translateY(-2px);
            }
            
            .sharing-icon {
                width: 40px;
                height: 40px;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                font-size: 20px;
                font-weight: 600;
            }
            
            .sharing-label {
                font-size: 14px;
                font-weight: 600;
                color: #1D1D1F;
            }
            
            /* Platform-specific colors */
            .facebook-share {
                background: #4267B2;
                color: white;
            }
            
            .twitter-share {
                background: #1DA1F2;
                color: white;
            }
            
            .whatsapp-share {
                background: #25D366;
                color: white;
            }
            
            .telegram-share {
                background: #0088cc;
                color: white;
            }
            
            .email-share {
                background: #EA4335;
                color: white;
            }
            
            .link-share {
                background: #007AFF;
                color: white;
            }
            
            .copy-share {
                background: #34C759;
                color: white;
            }
            
            .linkedin-share {
                background: #0077B5;
                color: white;
            }
            
            /* Share link section */
            .share-link-section {
                margin-top: 20px;
            }
            
            .share-link-title {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 10px;
                color: #1D1D1F;
            }
            
            .share-link-container {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .share-link-input {
                flex: 1;
                padding: 12px 16px;
                border: 2px solid #e8e8e8;
                border-radius: 12px;
                font-size: 14px;
                background: #f8f8f8;
            }
            
            .share-link-input:focus {
                outline: none;
                border-color: #007AFF;
                background: white;
            }
            
            .copy-link-btn {
                padding: 12px 24px;
                background: #007AFF;
                color: white;
                border: none;
                border-radius: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .copy-link-btn:hover {
                background: #0056CC;
            }
            
            .copy-success {
                text-align: center;
                font-size: 14px;
                color: #34C759;
                font-weight: 600;
                margin-top: 10px;
                animation: fadeInOut 3s ease;
            }
            
            @keyframes fadeInOut {
                0% { opacity: 0; }
                20% { opacity: 1; }
                80% { opacity: 1; }
                100% { opacity: 0; }
            }
            
            /* Embed code section */
            .embed-section {
                margin-top: 25px;
                padding-top: 25px;
                border-top: 1px solid #e8e8e8;
            }
            
            .embed-title {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 10px;
                color: #1D1D1F;
            }
            
            .embed-description {
                font-size: 14px;
                color: #666;
                margin-bottom: 15px;
                line-height: 1.5;
            }
            
            .embed-code-container {
                position: relative;
            }
            
            .embed-code {
                width: 100%;
                padding: 12px 16px;
                background: #f8f8f8;
                border: 2px solid #e8e8e8;
                border-radius: 12px;
                font-size: 12px;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                resize: vertical;
                min-height: 80px;
                line-height: 1.4;
            }
            
            .embed-code:focus {
                outline: none;
                border-color: #007AFF;
                background: white;
            }
            
            .copy-embed-btn {
                position: absolute;
                bottom: 10px;
                right: 10px;
                padding: 6px 12px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .copy-embed-btn:hover {
                background: #007AFF;
            }
            
            /* Mobile optimizations */
            @media (max-width: 767px) {
                .social-sharing-container {
                    width: 95%;
                    padding: 20px;
                    margin: 20px;
                }
                
                .social-sharing-close {
                    top: 10px;
                    right: 10px;
                    width: 36px;
                    height: 36px;
                }
                
                .sharing-options-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .share-link-container {
                    flex-direction: column;
                }
            }
        `;
        
        document.head.appendChild(styles);
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
        
        // Track sharing modal open event
        this.trackSEOMetric('sharing_modal_opened', {
            book_id: bookId,
            book_title: book.title
        });
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
        
        // Add to active modals
        this.performanceMetrics.activeModals.add('social-sharing');
    }
    
    loadSharingOptions(book) {
        console.log(`📤 Loading sharing options for: "${book.title}"`);
        
        // Generate shareable URL
        const shareUrl = `${window.location.origin}/ebooks/book/${this.generateSlug(book.title)}?id=${book.id}`;
        
        // Generate share text
        const shareText = `Check out "${book.title}" - a free Christian ebook by ${book.author || 'Unknown Author'}. Download now!`;
        
        // Generate hashtags for social media
        const hashtags = ['ChristianEbooks', 'FreeEbooks', 'SpiritualGrowth'];
        if (book.category) {
            hashtags.push(book.category.replace(/\s+/g, ''));
        }
        
        // Generate the sharing HTML
        const contentDiv = document.getElementById('social-sharing-content');
        contentDiv.innerHTML = `
            <div class="social-sharing-header">
                <h2 class="social-sharing-title">Share This Book</h2>
                <p class="social-sharing-subtitle">Spread the word about this free Christian ebook</p>
            </div>
            
            <div class="sharing-options-grid">
                <button class="sharing-option facebook-share-btn" onclick="ebookLibrary.shareToFacebook('${book.id}')">
                    <div class="sharing-icon facebook-share">f</div>
                    <span class="sharing-label">Facebook</span>
                </button>
                
                <button class="sharing-option twitter-share-btn" onclick="ebookLibrary.shareToTwitter('${book.id}')">
                    <div class="sharing-icon twitter-share">𝕏</div>
                    <span class="sharing-label">Twitter</span>
                </button>
                
                <button class="sharing-option whatsapp-share-btn" onclick="ebookLibrary.shareToWhatsApp('${book.id}')">
                    <div class="sharing-icon whatsapp-share">WA</div>
                    <span class="sharing-label">WhatsApp</span>
                </button>
                
                <button class="sharing-option telegram-share-btn" onclick="ebookLibrary.shareToTelegram('${book.id}')">
                    <div class="sharing-icon telegram-share">TG</div>
                    <span class="sharing-label">Telegram</span>
                </button>
                
                <button class="sharing-option email-share-btn" onclick="ebookLibrary.shareViaEmail('${book.id}')">
                    <div class="sharing-icon email-share">@</div>
                    <span class="sharing-label">Email</span>
                </button>
                
                <button class="sharing-option linkedin-share-btn" onclick="ebookLibrary.shareToLinkedIn('${book.id}')">
                    <div class="sharing-icon linkedin-share">in</div>
                    <span class="sharing-label">LinkedIn</span>
                </button>
                
                <button class="sharing-option link-share-btn" onclick="ebookLibrary.copyShareLink('${book.id}')">
                    <div class="sharing-icon link-share">🔗</div>
                    <span class="sharing-label">Copy Link</span>
                </button>
                
                <button class="sharing-option copy-share-btn" onclick="ebookLibrary.copyBookDetails('${book.id}')">
                    <div class="sharing-icon copy-share">📋</div>
                    <span class="sharing-label">Copy Details</span>
                </button>
            </div>
            
            <div class="share-link-section">
                <h3 class="share-link-title">Shareable Link</h3>
                <div class="share-link-container">
                    <input type="text" class="share-link-input" value="${shareUrl}" readonly id="share-link-input">
                    <button class="copy-link-btn" onclick="ebookLibrary.copyToClipboard('share-link-input', 'Link')">Copy</button>
                </div>
                <div id="copy-success-message" class="copy-success" hidden>Link copied to clipboard!</div>
            </div>
            
            <div class="embed-section">
                <h3 class="embed-title">Embed on Your Website</h3>
                <p class="embed-description">Copy and paste this code to embed this book on your website or blog:</p>
                <div class="embed-code-container">
                    <textarea class="embed-code" id="embed-code" readonly rows="4">
<div class="christian-ebook-widget" data-book-id="${book.id}">
    <div style="background: #f8f8f8; padding: 20px; border-radius: 12px; max-width: 400px;">
        <div style="display: flex; gap: 15px; margin-bottom: 15px;">
            <div style="width: 80px; height: 120px; background-image: url('${this.optimizeImageForSEO(book.cover_url)}'); background-size: cover; background-position: center; border-radius: 8px;"></div>
            <div style="flex: 1;">
                <h3 style="margin: 0 0 5px 0; font-size: 16px;">${book.title}</h3>
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">by ${book.author || 'Unknown Author'}</p>
                <a href="${shareUrl}" target="_blank" style="display: inline-block; padding: 8px 16px; background: #007AFF; color: white; text-decoration: none; border-radius: 8px; font-size: 14px;">Download Free PDF</a>
            </div>
        </div>
        <p style="margin: 0; font-size: 12px; color: #999; text-align: center;">Free Christian ebook from Christian Ebook Library</p>
    </div>
</div>
                    </textarea>
                    <button class="copy-embed-btn" onclick="ebookLibrary.copyToClipboard('embed-code', 'Embed Code')">Copy</button>
                </div>
                <div id="embed-success-message" class="copy-success" hidden>Embed code copied to clipboard!</div>
            </div>
        `;
        
        // Store book data for sharing functions
        this.currentSharingBook = book;
    }
    
    closeSocialSharingModal() {
        const modal = document.getElementById('social-sharing-modal');
        modal.hidden = true;
        document.body.style.overflow = '';
        
        // Remove from active modals
        this.performanceMetrics.activeModals.delete('social-sharing');
        
        // Clear current sharing book
        this.currentSharingBook = null;
    }
    
    // ================ SOCIAL SHARING METHODS ================
    
    shareToFacebook(bookId) {
        const book = this.currentSharingBook || this.books.find(b => b.id === bookId);
        if (!book) return;
        
        const shareUrl = `${window.location.origin}/ebooks/book/${this.generateSlug(book.title)}?id=${book.id}`;
        const shareText = `Check out "${book.title}" - a free Christian ebook by ${book.author || 'Unknown Author'}. Download now!`;
        
        // Facebook sharing URL
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        
        this.openShareWindow(facebookUrl, 'facebook_share');
        
        // Track the share
        this.trackSEOMetric('book_shared', {
            platform: 'facebook',
            book_id: bookId,
            book_title: book.title
        });
    }
    
    shareToTwitter(bookId) {
        const book = this.currentSharingBook || this.books.find(b => b.id === bookId);
        if (!book) return;
        
        const shareUrl = `${window.location.origin}/ebooks/book/${this.generateSlug(book.title)}?id=${book.id}`;
        const shareText = `Check out "${book.title}" - a free Christian ebook by ${book.author || 'Unknown Author'}`;
        
        // Twitter sharing URL
        const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}&via=${this.socialConfig.twitter.via}&hashtags=${this.socialConfig.twitter.hashtags}`;
        
        this.openShareWindow(twitterUrl, 'twitter_share');
        
        // Track the share
        this.trackSEOMetric('book_shared', {
            platform: 'twitter',
            book_id: bookId,
            book_title: book.title
        });
    }
    
    shareToWhatsApp(bookId) {
        const book = this.currentSharingBook || this.books.find(b => b.id === bookId);
        if (!book) return;
        
        const shareUrl = `${window.location.origin}/ebooks/book/${this.generateSlug(book.title)}?id=${book.id}`;
        const shareText = `${this.socialConfig.whatsapp.text}"${book.title}" - a free Christian ebook by ${book.author || 'Unknown Author'}. ${shareUrl}`;
        
        // WhatsApp sharing URL
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        
        this.openShareWindow(whatsappUrl, 'whatsapp_share');
        
        // Track the share
        this.trackSEOMetric('book_shared', {
            platform: 'whatsapp',
            book_id: bookId,
            book_title: book.title
        });
    }
    
    shareToTelegram(bookId) {
        const book = this.currentSharingBook || this.books.find(b => b.id === bookId);
        if (!book) return;
        
        const shareUrl = `${window.location.origin}/ebooks/book/${this.generateSlug(book.title)}?id=${book.id}`;
        const shareText = `Check out "${book.title}" - a free Christian ebook by ${book.author || 'Unknown Author'}`;
        
        // Telegram sharing URL
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        
        this.openShareWindow(telegramUrl, 'telegram_share');
        
        // Track the share
        this.trackSEOMetric('book_shared', {
            platform: 'telegram',
            book_id: bookId,
            book_title: book.title
        });
    }
    
    shareToLinkedIn(bookId) {
        const book = this.currentSharingBook || this.books.find(b => b.id === bookId);
        if (!book) return;
        
        const shareUrl = `${window.location.origin}/ebooks/book/${this.generateSlug(book.title)}?id=${book.id}`;
        
        // LinkedIn sharing URL
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        
        this.openShareWindow(linkedinUrl, 'linkedin_share');
        
        // Track the share
        this.trackSEOMetric('book_shared', {
            platform: 'linkedin',
            book_id: bookId,
            book_title: book.title
        });
    }
    
    shareViaEmail(bookId) {
        const book = this.currentSharingBook || this.books.find(b => b.id === bookId);
        if (!book) return;
        
        const shareUrl = `${window.location.origin}/ebooks/book/${this.generateSlug(book.title)}?id=${book.id}`;
        const subject = this.socialConfig.email.subject;
        const body = `${this.socialConfig.email.body}"${book.title}" by ${book.author || 'Unknown Author'}\n\n${book.description ? book.description.substring(0, 200) + '...' : 'A great Christian ebook for spiritual growth.'}\n\nDownload it here: ${shareUrl}\n\nBlessings!`;
        
        // Email sharing URL
        const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        window.location.href = emailUrl;
        
        // Track the share
        this.trackSEOMetric('book_shared', {
            platform: 'email',
            book_id: bookId,
            book_title: book.title
        });
    }
    
    copyShareLink(bookId) {
        const book = this.currentSharingBook || this.books.find(b => b.id === bookId);
        if (!book) return;
        
        const shareUrl = `${window.location.origin}/ebooks/book/${this.generateSlug(book.title)}?id=${book.id}`;
        
        this.copyToClipboardValue(shareUrl, 'Link');
        
        // Track the share
        this.trackSEOMetric('book_shared', {
            platform: 'copy_link',
            book_id: bookId,
            book_title: book.title
        });
    }
    
    copyBookDetails(bookId) {
        const book = this.currentSharingBook || this.books.find(b => b.id === bookId);
        if (!book) return;
        
        const shareUrl = `${window.location.origin}/ebooks/book/${this.generateSlug(book.title)}?id=${book.id}`;
        const details = `"${book.title}" by ${book.author || 'Unknown Author'}\n\n${book.description || 'A free Christian ebook for spiritual growth.'}\n\nDownload it here: ${shareUrl}`;
        
        this.copyToClipboardValue(details, 'Book Details');
        
        // Track the share
        this.trackSEOMetric('book_shared', {
            platform: 'copy_details',
            book_id: bookId,
            book_title: book.title
        });
    }
    
    copyToClipboard(elementId, type) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.select();
        element.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.showCopySuccess(type);
                
                // Track clipboard copy
                this.trackSEOMetric('clipboard_copy', {
                    type: type.toLowerCase().replace(' ', '_'),
                    book_id: this.currentSharingBook?.id,
                    book_title: this.currentSharingBook?.title
                });
            } else {
                this.showToast(`Failed to copy ${type.toLowerCase()}`, 'error');
            }
        } catch (err) {
            console.error('Copy failed:', err);
            this.showToast(`Failed to copy ${type.toLowerCase()}`, 'error');
        }
    }
    
    copyToClipboardValue(value, type) {
        navigator.clipboard.writeText(value).then(() => {
            this.showCopySuccess(type);
            
            // Track clipboard copy
            this.trackSEOMetric('clipboard_copy', {
                type: type.toLowerCase().replace(' ', '_'),
                book_id: this.currentSharingBook?.id,
                book_title: this.currentSharingBook?.title
            });
        }).catch(err => {
            console.error('Copy failed:', err);
            this.showToast(`Failed to copy ${type.toLowerCase()}`, 'error');
        });
    }
    
    showCopySuccess(type) {
        // Show success message in modal
        const successElement = document.getElementById(`${type.toLowerCase().replace(' ', '-')}-success-message`);
        if (successElement) {
            successElement.hidden = false;
            successElement.textContent = `${type} copied to clipboard!`;
            
            // Hide after 3 seconds
            setTimeout(() => {
                successElement.hidden = true;
            }, 3000);
        }
        
        // Also show toast notification
        this.showToast(`${type} copied to clipboard!`, 'success');
    }
    
    openShareWindow(url, platform) {
        const windowFeatures = 'width=600,height=400,menubar=no,toolbar=no,resizable=yes,scrollbars=yes';
        const shareWindow = window.open(url, `${platform}_window`, windowFeatures);
        
        if (shareWindow) {
            shareWindow.focus();
            
            // Check if window was closed (for analytics)
            const checkClosed = setInterval(() => {
                if (shareWindow.closed) {
                    clearInterval(checkClosed);
                    console.log(`${platform} share window closed`);
                }
            }, 1000);
        } else {
            this.showToast('Please allow popups to share', 'error');
        }
    }
    
    // ================ ENHANCED BOOK DETAIL MODAL ================
    
    // Update the book detail modal to include sharing button
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
        
        // Generate the full book detail HTML WITH SHARING BUTTON
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
                        
                        <button class="detail-action-btn share-btn" onclick="ebookLibrary.openSocialSharingModal('${book.id}')" style="background: #8E8E93;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24919 15.0227 5.37061L8.0826 9.84066C7.54305 9.32015 6.80891 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15C6.80891 15 7.54305 14.6798 8.0826 14.1593L15.0227 18.6294C15.0077 18.7508 15 18.8745 15 19C15 20.6569 16.3431 22 18 22C19.6569 22 21 20.   
                                
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
    
    // ================ ENHANCED BOOK CARD ================
    
    // Update book card to include share button
    createBookGridItem(book) {
        const card = el('div', 'ebook-card grid-item');
        const optimizedImage = this.optimizeImageForSEO(book.cover_url);
        
        card.innerHTML = `
            <div class="ebook-card-inner" itemprop="mainEntity" itemscope itemtype="https://schema.org/Book">
                <meta itemprop="url" content="${window.location.origin}/ebooks/book/${this.generateSlug(book.title)}?id=${book.id}">
                
                <div class="ebook-cover-container" onclick="ebookLibrary.openBookDetailModal('${book.id}')">
                    <div class="ebook-cover" 
                         style="background-image: url('${optimizedImage}')"
                         aria-label="Cover of ${book.title}"
                         itemprop="image">
                        ${book.featured ? '<span class="featured-badge">Featured</span>' : ''}
                        
                        <!-- Share button on cover -->
                        <button class="cover-share-btn" 
                                onclick="event.stopPropagation(); ebookLibrary.openSocialSharingModal('${book.id}')"
                                aria-label="Share ${book.title}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24919 15.0227 5.37061L8.0826 9.84066C7.54305 9.32015 6.80891 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15C6.80891 15 7.54305 14.6798 8.0826 14.1593L15.0227 18.6294C15.0077 18.7508 15 18.8745 15 19C15 20.6569 16.3431 22 18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C17.1911 16 16.4569 16.3202 15.9174 16.8407L8.97727 12.3706C8.99229 12.2492 9 12.1255 9 12C9 11.8745 8.99229 11.7508 8.97727 11.6294L15.9174 7.15934C16.4569 7.67985 17.1911 8 18 8Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
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
                        <button class="share-btn-small" 
                                onclick="event.stopPropagation(); ebookLibrary.openSocialSharingModal('${book.id}')"
                                aria-label="Share ${book.title}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24919 15.0227 5.37061L8.0826 9.84066C7.54305 9.32015 6.80891 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15C6.80891 15 7.54305 14.6798 8.0826 14.1593L15.0227 18.6294C15.0077 18.7508 15 18.8745 15 19C15 20.6569 16.3431 22 18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C17.1911 16 16.4569 16.3202 15.9174 16.8407L8.97727 12.3706C8.99229 12.2492 9 12.1255 9 12C9 11.8745 8.99229 11.7508 8.97727 11.6294L15.9174 7.15934C16.4569 7.67985 17.1911 8 18 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Share
                        </button>
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
                <meta itemprop="url" content="${window.location.origin}/ebooks/book/${this.generateSlug(book.title)}?id=${book.id}">
                
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
                        <button class="list-share-btn" 
                                onclick="event.stopPropagation(); ebookLibrary.openSocialSharingModal('${book.id}')"
                                aria-label="Share ${book.title}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24919 15.0227 5.37061L8.0826 9.84066C7.54305 9.32015 6.80891 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15C6.80891 15 7.54305 14.6798 8.0826 14.1593L15.0227 18.6294C15.0077 18.7508 15 18.8745 15 19C15 20.6569 16.3431 22 18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C17.1911 16 16.4569 16.3202 15.9174 16.8407L8.97727 12.3706C8.99229 12.2492 9 12.1255 9 12C9 11.8745 8.99229 11.7508 8.97727 11.6294L15.9174 7.15934C16.4569 7.67985 17.1911 8 18 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
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
                            <button class="btn-share-list" 
                                    onclick="event.stopPropagation(); ebookLibrary.openSocialSharingModal('${book.id}')"
                                    aria-label="Share ${book.title}">
                                Share
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
    
    // ================ CSS FOR SHARING BUTTONS ================
    
    addSharingButtonStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            /* Cover share button */
            .ebook-cover {
                position: relative;
            }
            
            .cover-share-btn {
                position: absolute;
                top: 10px;
                right: 10px;
                width: 36px;
                height: 36px;
                background: rgba(0, 0, 0, 0.7);
                border: none;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                opacity: 0;
                transition: all 0.2s ease;
                z-index: 2;
            }
            
            .ebook-cover:hover .cover-share-btn {
                opacity: 1;
            }
            
            .cover-share-btn:hover {
                background: rgba(0, 122, 255, 0.9);
                transform: scale(1.1);
            }
            
            /* Small share button in grid view */
            .share-btn-small {
                background: none;
                border: none;
                color: #007AFF;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 4px 8px;
                border-radius: 6px;
                transition: all 0.2s ease;
            }
            
            .share-btn-small:hover {
                background: rgba(0, 122, 255, 0.1);
            }
            
            /* List view share buttons */
            .list-share-btn {
                background: none;
                border: none;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: #666;
                transition: all 0.2s ease;
            }
            
            .list-share-btn:hover {
                background: #f8f8f8;
                color: #007AFF;
            }
            
            .btn-share-list {
                padding: 8px 16px;
                background: #8E8E93;
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .btn-share-list:hover {
                background: #636366;
            }
            
            /* Share button in detail modal */
            .share-btn {
                background: #8E8E93;
                color: white;
            }
            
            .share-btn:hover {
                background: #636366;
            }
            
            /* Social media icons in sharing modal */
            .facebook-share { background: #4267B2; }
            .twitter-share { background: #1DA1F2; }
            .whatsapp-share { background: #25D366; }
            .telegram-share { background: #0088cc; }
            .email-share { background: #EA4335; }
            .linkedin-share { background: #0077B5; }
            .link-share { background: #007AFF; }
            .copy-share { background: #34C759; }
        `;
        
        document.head.appendChild(styles);
    }
    
    // ================ SEO ENHANCEMENTS FOR SHARING ================
    
    // Update structured data to include sharing information
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
                },
                "sameAs": [
                    "https://facebook.com/YourChurchName",
                    "https://twitter.com/YourChurchName",
                    "https://instagram.com/YourChurchName"
                ]
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
                        "url": `${window.location.origin}/ebooks/book/${this.generateSlug(book.title)}?id=${book.id}`,
                        "bookFormat": "EBook",
                        "genre": book.category || "Christian",
                        "description": book.description?.substring(0, 200) || "Christian ebook for spiritual growth",
                        "publisher": {
                            "@type": "Organization",
                            "name": "Your Church Name"
                        },
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD",
                            "availability": "https://schema.org/InStock",
                            "url": `${window.location.origin}/ebooks/book/${this.generateSlug(book.title)}?id=${book.id}`
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
        
        // Social sharing schema
        const socialSchema = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Christian Ebook Library",
            "url": `${window.location.origin}/ebooks`,
            "logo": `${window.location.origin}/logo.png`,
            "sameAs": [
                "https://www.facebook.com/YourChurchName",
                "https://twitter.com/YourChurchName",
                "https://www.instagram.com/YourChurchName/",
                "https://www.youtube.com/YourChurchName"
            ]
        };
        
        // Inject all schemas
        this.injectSchema(websiteSchema, 'website-schema');
        this.injectSchema(collectionSchema, 'collection-schema');
        this.injectSchema(breadcrumbSchema, 'breadcrumb-schema');
        this.injectSchema(socialSchema, 'social-schema');
        
        this.seoData.structuredDataInjected = true;
        console.log("✅ Comprehensive structured data injected");
    }
    
    // ================ INITIALIZATION UPDATE ================
    
    // Update the init method to include sharing styles
    async init(container) {
        console.log("🚀 EbooksLibrary.init() called");
        console.group("Initialization Process");
        
        this.container = container;
        console.log("Container:", container);
        
        // 1. Set dynamic SEO meta tags FIRST
        console.log("Step 1: Setting dynamic SEO meta tags");
        this.setDynamicMetaTags();
        
        // 2. Add sharing button styles
        console.log("Step 2: Adding sharing button styles");
        this.addSharingButtonStyles();
        
        // 3. Create book detail modal
        console.log("Step 3: Creating book detail modal");
        this.createBookDetailModal();
        
        // 4. Create social sharing modal
        console.log("Step 4: Creating social sharing modal");
        this.createSocialSharingModal();
        
        // 5. Setup navigation and search
        console.log("Step 5: Setting up navigation");
        this.setupNavigation();
        
        // 6. Load data
        console.log("Step 6: Loading data");
        await this.loadData();
        
        // 7. Setup UI and events
        console.log("Step 7: Setting up event listeners");
        this.setupEventListeners();
        
        // 8. Render everything
        console.log("Step 8: Rendering UI");
        this.render();
        
        // 9. Check URL for book ID and open modal if present
        console.log("Step 9: Checking URL parameters");
        this.checkURLForBookDetail();
        
        // 10. Inject comprehensive structured data
        console.log("Step 10: Injecting structured data");
        this.injectComprehensiveStructuredData();
        
        // 11. Setup performance monitoring
        console.log("Step 11: Setting up performance monitoring");
        this.setupPerformanceMonitoring();
        
        console.log("✅ EbooksLibrary initialization complete");
        console.groupEnd();
        
        // Make library globally accessible for debugging
        window.ebookLibrary = this;
        console.log("🌐 Library available globally as window.ebookLibrary");
        
        return this;
    }
    
    // ================ RENDER FEATURED BOOKS WITH SHARING ================
    
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
                        <!-- Share button on featured cover -->
                        <button class="featured-share-btn" 
                                onclick="event.stopPropagation(); ebookLibrary.openSocialSharingModal('${book.id}')"
                                aria-label="Share ${book.title}">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24919 15.0227 5.37061L8.0826 9.84066C7.54305 9.32015 6.80891 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15C6.80891 15 7.54305 14.6798 8.0826 14.1593L15.0227 18.6294C15.0077 18.7508 15 18.8745 15 19C15 20.6569 16.3431 22 18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C17.1911 16 16.4569 16.3202 15.9174 16.8407L8.97727 12.3706C8.99229 12.2492 9 12.1255 9 12C9 11.8745 8.99229 11.7508 8.97727 11.6294L15.9174 7.15934C16.4569 7.67985 17.1911 8 18 8Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                    <div class="featured-content">
                        <div class="featured-badges">
                            <span class="badge featured">Featured</span>
                            ${book.category ? `<span class="badge">${book.category}</span>` : ''}
                        </div>
                        <h3 class="featured-title" onclick="ebookLibrary.openBookDetailModal('${book.id}')" style="cursor: pointer;">${book.title}</h3>
                        <p class="featured-author">by ${book.author || 'Unknown'}</p>
                        <div class="featured-actions">
                            <button class="btn-outline" onclick="event.stopPropagation(); ebookLibrary.downloadEbook('${book.id}', '${book.title}')">
                                Download PDF
                            </button>
                            <button class="btn-outline btn-share" onclick="event.stopPropagation(); ebookLibrary.openSocialSharingModal('${book.id}')">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="margin-right: 6px;">
                                    <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24919 15.0227 5.37061L8.0826 9.84066C7.54305 9.32015 6.80891 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15C6.80891 15 7.54305 14.6798 8.0826 14.1593L15.0227 18.6294C15.0077 18.7508 15 18.8745 15 19C15 20.6569 16.3431 22 18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C17.1911 16 16.4569 16.3202 15.9174 16.8407L8.97727 12.3706C8.99229 12.2492 9 12.1255 9 12C9 11.8745 8.99229 11.7508 8.97727 11.6294L15.9174 7.15934C16.4569 7.67985 17.1911 8 18 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Share
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
    
    // ================ ADDITIONAL SHARING FEATURES ================
    
    // Quick share method (for one-click sharing)
    quickShare(bookId, platform) {
        const book = this.books.find(b => b.id === bookId);
        if (!book) return;
        
        switch(platform) {
            case 'facebook':
                this.shareToFacebook(bookId);
                break;
            case 'twitter':
                this.shareToTwitter(bookId);
                break;
            case 'whatsapp':
                this.shareToWhatsApp(bookId);
                break;
            case 'copy':
                this.copyShareLink(bookId);
                break;
            default:
                this.openSocialSharingModal(bookId);
        }
    }
    
    // Generate social media preview for a book
    generateSocialPreview(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book) return null;
        
        return {
            title: book.title,
            description: book.description?.substring(0, 150) + '...' || 'Download this free Christian ebook for spiritual growth.',
            image: this.optimizeImageForSEO(book.cover_url),
            url: `${window.location.origin}/ebooks/book/${this.generateSlug(book.title)}?id=${book.id}`,
            author: book.author || 'Unknown Author',
            category: book.category || 'Christian'
        };
    }
    
    // Share statistics tracking
    trackShareStatistics(bookId, platform, method = 'modal') {
        const book = this.books.find(b => b.id === bookId);
        if (!book) return;
        
        // Track in local storage for analytics
        const statsKey = `share_stats_${bookId}`;
        const stats = JSON.parse(localStorage.getItem(statsKey)) || {
            total_shares: 0,
            platforms: {},
            methods: {}
        };
        
        stats.total_shares = (stats.total_shares || 0) + 1;
        stats.platforms[platform] = (stats.platforms[platform] || 0) + 1;
        stats.methods[method] = (stats.methods[method] || 0) + 1;
        
        localStorage.setItem(statsKey, JSON.stringify(stats));
        
        // Send to analytics API
        try {
            api.post('/analytics/shares', {
                book_id: bookId,
                platform: platform,
                method: method,
                timestamp: new Date().toISOString(),
                url: window.location.href
            });
        } catch (error) {
            console.error('Failed to track share:', error);
        }
    }
}

// Export the class
export default EbooksLibrary;

// Global sharing helper
if (typeof window !== 'undefined') {
    window.quickShareBook = function(bookId, platform) {
        if (window.ebookLibrary) {
            window.ebookLibrary.quickShare(bookId, platform);
        } else {
            console.error('Ebook library not initialized');
        }
    };
    
    console.log("✅ Global sharing helper available: window.quickShareBook(bookId, platform)");
}