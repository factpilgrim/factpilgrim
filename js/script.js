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

            this.addSocialSharingListeners();
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
                <span class="hero-category">${this.formatCategory(article.category)}</span>
                <h2 class="hero-title" onclick="factPilgrim.openArticle('${article.filename}')">${article.title}</h2>
                <p class="hero-summary">${article.summary}</p>
                <div class="hero-date">${this.formatDate(article.date)}</div>
                <a href="./articles/${article.filename}" class="hero-read-more" target="_blank">Read Full Story →</a>
                <div class="social-sharing">
                    <button class="social-btn twitter" data-url="${articleUrl}" data-title="${article.title}"><i class="fab fa-x-twitter"></i></button>
                    <button class="social-btn facebook" data-url="${articleUrl}"><i class="fab fa-facebook-f"></i></button>
                    <button class="social-btn whatsapp" data-url="${articleUrl}" data-title="${article.title}"><i class="fab fa-whatsapp"></i></button>
                    <button class="social-btn threads" data-url="${articleUrl}" data-title="${article.title}"><i class="fab fa-threads"></i></button>
                    <button class="social-btn copy" data-url="${articleUrl}"><i class="fas fa-link"></i></button>
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
                <div class="article-date">${this.formatDate(article.date)}</div>
                <a href="./articles/${article.filename}" class="article-read-more" target="_blank">Read More →</a>
                <div class="article-social">
                    <button class="social-btn twitter" data-url="${articleUrl}" data-title="${article.title}"><i class="fab fa-x-twitter"></i></button>
                    <button class="social-btn facebook" data-url="${articleUrl}"><i class="fab fa-facebook-f"></i></button>
                    <button class="social-btn whatsapp" data-url="${articleUrl}" data-title="${article.title}"><i class="fab fa-whatsapp"></i></button>
                    <button class="social-btn threads" data-url="${articleUrl}" data-title="${article.title}"><i class="fab fa-threads"></i></button>
                    <button class="social-btn copy" data-url="${articleUrl}"><i class="fas fa-link"></i></button>
                </div>
            </div>
        </article>
        `;
    }

    addSocialSharingListeners() {
        document.querySelectorAll('.social-btn.twitter').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); FactPilgrim.shareOnTwitter(btn.dataset.title, btn.dataset.url); }));
        document.querySelectorAll('.social-btn.facebook').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); FactPilgrim.shareOnFacebook(btn.dataset.url); }));
        document.querySelectorAll('.social-btn.whatsapp').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); FactPilgrim.shareOnWhatsApp(btn.dataset.title, btn.dataset.url); }));
        document.querySelectorAll('.social-btn.threads').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); FactPilgrim.shareOnThreads(btn.dataset.title, btn.dataset.url); }));
        document.querySelectorAll('.social-btn.copy').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); FactPilgrim.copyArticleLink(btn.dataset.url); }));
    }

    openArticle(filename) { window.open(`./articles/${filename}`, '_blank'); }

    loadMoreArticles() { this.currentPage++; this.displayArticles(); }

    collapseArticles() { this.currentPage = 1; this.displayArticles(); }

    updateTicker() {
        const tickerTrack = document.getElementById('tickerTrack');
        if (!tickerTrack) return;

        // Get articles 14-24 (indices 13-23)
        const tickerArticles = this.articles.slice(13, 24);
        let headlines = tickerArticles.length > 0 ? tickerArticles.map((a) => {
            return `<span class="ticker-item" data-filename="${a.filename}">${a.title}</span>`;
        }) : ['<span>Stay tuned for the latest news</span>'];

        // Create seamless looping by duplicating content
        const tickerHTML = headlines.join(' • ') + ' • ';
        tickerTrack.innerHTML = '';
        
        // Create three copies for seamless loop (original, duplicate 1, duplicate 2)
        for (let i = 0; i < 3; i++) {
            const span = document.createElement('span');
            span.innerHTML = tickerHTML;
            tickerTrack.appendChild(span);
        }

        // Add click listeners to ticker items
        document.querySelectorAll('.ticker-item').forEach(item => {
            item.addEventListener('click', () => {
                const filename = item.getAttribute('data-filename');
                if (filename) {
                    window.open(`./articles/${filename}`, '_blank');
                }
            });
        });

        // Calculate duration for smooth animation
        const totalWidth = tickerTrack.scrollWidth / 3; // Width of one segment
        const duration = totalWidth / 50; // Smoother speed calculation
        tickerTrack.style.setProperty('--ticker-duration', `${duration}s`);
    }

    formatCategory(category) { return category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '); }

    formatDate(dateString) { return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }

    static shareOnTwitter(title, url) {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
    }

    static shareOnFacebook(url) {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
    }

    static shareOnWhatsApp(title, url) {
        window.open(`https://wa.me/?text=${encodeURIComponent(title + ' - ' + url)}`, '_blank', 'width=600,height=400');
    }

    static shareOnThreads(title, url) {
        // FIXED: Threads sharing with same format as WhatsApp
        const shareText = `${title} - ${url}`;
        window.open(`https://threads.net/intent/post?text=${encodeURIComponent(shareText)}`, '_blank', 'width=600,height=400');
    }

    static async copyArticleLink(url) {
        try {
            await navigator.clipboard.writeText(url);
            FactPilgrim.showToast('Link copied!');
        } catch (err) {
            const ta = document.createElement('textarea');
            ta.value = url;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            FactPilgrim.showToast('Link copied!');
        }
    }

    static showToast(message) {
        const existing = document.querySelector('.toast');
        if(existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

let factPilgrim;
document.addEventListener('DOMContentLoaded', () => {
    factPilgrim = new FactPilgrim();
});
