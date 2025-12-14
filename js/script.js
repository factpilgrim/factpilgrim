class FactPilgrim {
    constructor() {
        this.articles = [];
        this.filteredArticles = [];
        this.currentPage = 1;
        this.articlesPerPage = 12;
        this.isLoading = false;
        this.searchTimeout = null;
        this.init();
    }

    async init() {
        await this.loadArticles();
        this.setupEventListeners();
        this.displayArticles();
        this.updateTicker();
        // Listener is added ONCE, but works for ALL future cards
        this.addSocialSharingListeners(); 
    }

    async loadArticles() {
        if (this.isLoading) return;
        this.isLoading = true;
        try {
            const response = await fetch('./articles/data/news.json');
            if (!response.ok) throw new Error('Failed to load articles');
            this.articles = await response.json();
            this.filteredArticles = [...this.articles];
        } catch (error) {
            console.error('Error loading articles:', error);
            this.articles = [];
            this.filteredArticles = [];
        } finally {
            this.isLoading = false;
        }
    }

    setupEventListeners() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => this.loadMoreArticles());

        const collapseBtn = document.getElementById('collapseBtn');
        if (collapseBtn) collapseBtn.addEventListener('click', () => this.collapseArticles());

        const homeBtn = document.querySelector('.home-btn');
        if (homeBtn) {
            homeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentPage = 1;
                this.filteredArticles = [...this.articles];
                this.displayArticles();
                document.getElementById('searchInput').value = '';
            });
        }

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => this.searchArticles(e.target.value), 300);
            });
        }
    }

    searchArticles(query) {
        if (!query.trim()) {
            this.filteredArticles = [...this.articles];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredArticles = this.articles.filter(article =>
                article.title.toLowerCase().includes(searchTerm) ||
                article.summary.toLowerCase().includes(searchTerm) ||
                article.category.toLowerCase().includes(searchTerm)
            );
        }
        this.currentPage = 1;
        this.displayArticles();
    }

    getBaseUrl() {
        return "https://factpilgrim.github.io/factpilgrim/";
    }

    displayArticles() {
        const heroSection = document.getElementById('heroSection');
        const articlesGrid = document.getElementById('articlesGrid');
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        const collapseBtn = document.getElementById('collapseBtn');

        if (!heroSection || !articlesGrid) return;

        requestAnimationFrame(() => {
            heroSection.innerHTML = '';
            articlesGrid.innerHTML = '';

            if (this.filteredArticles.length === 0) {
                heroSection.innerHTML = '<div class="no-articles"><h2>No articles found</h2></div>';
                loadMoreBtn.style.display = 'none';
                return;
            }

            const heroArticle = this.filteredArticles[0];
            heroSection.innerHTML = this.createHeroCard(heroArticle);

            const startIndex = 1;
            const endIndex = Math.min(startIndex + (this.currentPage * this.articlesPerPage), this.filteredArticles.length);

            const articlesHTML = [];
            for (let i = startIndex; i < endIndex; i++) {
                if (this.filteredArticles[i]) {
                    articlesHTML.push(this.createArticleCard(this.filteredArticles[i]));
                }
            }

            articlesGrid.innerHTML = articlesHTML.join('');

            const hasMoreArticles = endIndex < this.filteredArticles.length;
            if (loadMoreBtn) loadMoreBtn.style.display = hasMoreArticles ? 'block' : 'none';
            if (collapseBtn) collapseBtn.style.display = this.currentPage > 1 ? 'block' : 'none';
        });
    }

    createHeroCard(article) {
        const baseUrl = this.getBaseUrl();
        const articleUrl = `${baseUrl}articles/${article.filename}`;
        
        return `
        <article class="hero-card" data-filename="${article.filename}">
            <div class="hero-image-container">
                <img src="./images/${article.image}" alt="${article.title}" class="hero-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="hero-image-fallback">${article.title}</div>
            </div>
            <div class="hero-content">
                <div class="hero-meta-top">
                    <span class="hero-category">${this.formatCategory(article.category)}</span>
                    <span class="hero-date">${this.formatDate(article.date)}</span>
                </div>
                <h2 class="hero-title" onclick="factPilgrim.openArticle('${article.filename}')">${article.title}</h2>
                <p class="hero-summary">${article.summary}</p>
                <div class="hero-footer">
                    <a href="./articles/${article.filename}" class="hero-read-link">Read Full Story <i class="fas fa-arrow-right"></i></a>
                    <div class="social-sharing">
                        <button class="social-btn ghost twitter" data-network="twitter" data-url="${articleUrl}" data-title="${article.title}"><i class="fab fa-x-twitter"></i></button>
                        <button class="social-btn ghost facebook" data-network="facebook" data-url="${articleUrl}"><i class="fab fa-facebook-f"></i></button>
                        <button class="social-btn ghost whatsapp" data-network="whatsapp" data-url="${articleUrl}" data-title="${article.title}"><i class="fab fa-whatsapp"></i></button>
                        <button class="social-btn ghost copy" data-network="copy" data-url="${articleUrl}"><i class="fas fa-link"></i></button>
                    </div>
                </div>
            </div>
        </article>
        `;
    }

    createArticleCard(article) {
        const baseUrl = this.getBaseUrl();
        const articleUrl = `${baseUrl}articles/${article.filename}`;
        
        return `
        <article class="article-card" data-filename="${article.filename}">
            <div class="article-image-container">
                <img src="./images/${article.image}" alt="${article.title}" class="article-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="article-image-fallback">${article.title}</div>
            </div>
            <div class="article-content">
                <span class="article-category">${this.formatCategory(article.category)}</span>
                <h3 class="article-title" onclick="factPilgrim.openArticle('${article.filename}')">${article.title}</h3>
                <p class="article-summary">${article.summary}</p>
                <div class="article-footer-row">
                    <div class="article-date">${this.formatDate(article.date)}</div>
                    <div class="article-actions">
                        <button class="icon-btn share-trigger"><i class="fas fa-share-nodes"></i></button>
                        <a href="./articles/${article.filename}" class="icon-link"><i class="fas fa-arrow-right"></i></a>
                    </div>
                </div>
                <div class="article-social-overlay">
                    <button class="social-btn mini twitter" data-network="twitter" data-url="${articleUrl}" data-title="${article.title}"><i class="fab fa-x-twitter"></i></button>
                    <button class="social-btn mini facebook" data-network="facebook" data-url="${articleUrl}"><i class="fab fa-facebook-f"></i></button>
                    <button class="social-btn mini whatsapp" data-network="whatsapp" data-url="${articleUrl}" data-title="${article.title}"><i class="fab fa-whatsapp"></i></button>
                    <button class="social-btn mini copy" data-network="copy" data-url="${articleUrl}"><i class="fas fa-link"></i></button>
                </div>
            </div>
        </article>
        `;
    }

    addSocialSharingListeners() {
        // GLOBAL EVENT DELEGATION
        // This single listener handles ALL clicks for ALL cards (even ones loaded later)
        
        document.body.addEventListener('click', (e) => {
            
            // 1. Handle SHARE ICON Click
            const trigger = e.target.closest('.share-trigger');
            if (trigger) {
                e.preventDefault();
                e.stopPropagation();
                
                const card = trigger.closest('.article-card');
                const overlay = card.querySelector('.article-social-overlay');
                
                // Close other menus
                document.querySelectorAll('.article-social-overlay.active').forEach(el => {
                    if(el !== overlay) {
                        el.classList.remove('active');
                        el.closest('.article-card').classList.remove('menu-open');
                    }
                });
                
                // Toggle current menu
                const isOpen = overlay.classList.toggle('active');
                
                // Z-Index Boost prevents overlapping issue
                if(isOpen) card.classList.add('menu-open');
                else card.classList.remove('menu-open');
                
                return;
            }

            // 2. Handle SOCIAL BUTTON Click
            const btn = e.target.closest('.social-btn');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                
                let network = btn.dataset.network;
                if (!network) {
                    if (btn.classList.contains('twitter')) network = 'twitter';
                    else if (btn.classList.contains('facebook')) network = 'facebook';
                    else if (btn.classList.contains('whatsapp')) network = 'whatsapp';
                    else network = 'copy';
                }
                
                const url = btn.dataset.url;
                const title = btn.dataset.title || '';

                if (network === 'twitter') FactPilgrim.shareOnTwitter(title, url);
                else if (network === 'facebook') FactPilgrim.shareOnFacebook(url);
                else if (network === 'whatsapp') FactPilgrim.shareOnWhatsApp(title, url);
                else if (network === 'copy') FactPilgrim.copyArticleLink(url);
                return;
            }

            // 3. Close menu if clicked outside
            if (!e.target.closest('.article-social-overlay')) {
                document.querySelectorAll('.article-social-overlay.active').forEach(el => {
                    el.classList.remove('active');
                    el.closest('.article-card').classList.remove('menu-open');
                });
            }
        });
    }

    openArticle(filename) { window.open(`./articles/${filename}`, '_blank'); }
    loadMoreArticles() { this.currentPage++; this.displayArticles(); }
    collapseArticles() { this.currentPage = 1; this.displayArticles(); }

    updateTicker() {
        const tickerTrack = document.getElementById('tickerTrack');
        if (!tickerTrack) return;
        const tickerArticles = this.articles.slice(13, 23);
        const headlines = tickerArticles.length > 0 
            ? tickerArticles.map(a => `<span class="ticker-item" data-filename="${a.filename}">${a.title}</span>`)
            : ['<span class="ticker-item">Stay tuned for the latest news</span>'];

        tickerTrack.innerHTML = '';
        for (let i = 0; i < 1; i++) {
            const block = document.createElement('div');
            block.className = 'ticker-block';
            block.innerHTML = headlines.join('<span style="padding:0 1em">•</span>');
            tickerTrack.appendChild(block);
        }

        document.querySelectorAll('.ticker-item').forEach(item => {
            item.addEventListener('click', () => {
                const filename = item.getAttribute('data-filename');
                if (filename) window.open(`./articles/${filename}`, '_blank');
            });
        });

        const firstBlock = tickerTrack.querySelector('.ticker-block');
        if (firstBlock) {
            const blockWidth = firstBlock.offsetWidth;
            const scrollWidth = blockWidth * 3; 
            tickerTrack.style.setProperty('--scroll-width', `${scrollWidth}px`);
            const duration = scrollWidth / 100;
            tickerTrack.style.setProperty('--ticker-duration', `${duration}s`);
        }
    }

    formatCategory(category) { return category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '); }
    formatDate(dateString) { return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }

    static shareOnTwitter(title, url) { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400'); }
    static shareOnFacebook(url) { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400'); }
    static shareOnWhatsApp(title, url) { window.open(`https://wa.me/?text=${encodeURIComponent(title + ' - ' + url)}`, '_blank', 'width=600,height=400'); }
    static async copyArticleLink(url) {
        try { await navigator.clipboard.writeText(url); FactPilgrim.showToast('Link copied!'); } 
        catch (err) { FactPilgrim.showToast('Link copied!'); }
    }
    static showToast(message) {
        const existing = document.querySelector('.toast');
        if(existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
    }
}

let factPilgrim;
document.addEventListener('DOMContentLoaded', () => { factPilgrim = new FactPilgrim(); });
