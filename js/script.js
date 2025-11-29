// Fact Pilgrim 5.2 - Main JavaScript
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
            this.articles = this.getSampleArticles();
            this.filteredArticles = [...this.articles];
        } finally {
            this.isLoading = false;
        }
    }

    getSampleArticles() {
        return [
            {
                "title": "Delhi Air Quality Reaches Hazardous Levels, Schools Shut",
                "category": "environment",
                "summary": "The air quality index in Delhi crossed 500, entering the 'severe plus' category, prompting authorities to close schools and implement emergency measures.",
                "date": "2024-01-15",
                "image": "delhi-air.jpg",
                "filename": "delhi-air-quality-crisis.html"
            },
            {
                "title": "Global Climate Summit Reaches Historic Agreement",
                "category": "world",
                "summary": "World leaders have agreed on a groundbreaking climate deal that sets ambitious targets for carbon reduction by 2030.",
                "date": "2024-01-14",
                "image": "climate-summit.jpg",
                "filename": "climate-summit-agreement.html"
            }
        ];
    }

    setupEventListeners() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreArticles());
        }

        const collapseBtn = document.getElementById('collapseBtn');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => this.collapseArticles());
        }

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
                this.searchTimeout = setTimeout(() => {
                    this.searchArticles(e.target.value);
                }, 300);
            });
        }

        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchArticles(searchInput.value);
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
        const url = window.location.href;
        return url.substring(0, url.lastIndexOf('/') + 1);
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
                heroSection.innerHTML = '<div class="no-articles"><h2>No articles found</h2><p>Try adjusting your search or filter criteria.</p></div>';
                loadMoreBtn.style.display = 'none';
                collapseBtn.style.display = 'none';
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
            const hasMultiplePages = this.currentPage > 1;
            
            if (loadMoreBtn) loadMoreBtn.style.display = hasMoreArticles ? 'block' : 'none';
            if (collapseBtn) collapseBtn.style.display = hasMultiplePages ? 'block' : 'none';

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
                        <button class="social-btn twitter" data-url="${articleUrl}" data-title="${article.title}" data-tooltip="Share on X">
                            <i class="fab fa-x-twitter"></i>
                        </button>
                        <button class="social-btn facebook" data-url="${articleUrl}" data-tooltip="Share on Facebook">
                            <i class="fab fa-facebook-f"></i>
                        </button>
                        <button class="social-btn whatsapp" data-url="${articleUrl}" data-title="${article.title}" data-tooltip="Share on WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                        <button class="social-btn copy" data-url="${articleUrl}" data-tooltip="Copy Link">
                            <i class="fas fa-link"></i>
                        </button>
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
                        <button class="social-btn twitter" data-url="${articleUrl}" data-title="${article.title}" data-tooltip="Share on X">
                            <i class="fab fa-x-twitter"></i>
                        </button>
                        <button class="social-btn facebook" data-url="${articleUrl}" data-tooltip="Share on Facebook">
                            <i class="fab fa-facebook-f"></i>
                        </button>
                        <button class="social-btn whatsapp" data-url="${articleUrl}" data-title="${article.title}" data-tooltip="Share on WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                        <button class="social-btn copy" data-url="${articleUrl}" data-tooltip="Copy Link">
                            <i class="fas fa-link"></i>
                        </button>
                    </div>
                </div>
            </article>
        `;
    }

    addSocialSharingListeners() {
        document.querySelectorAll('.social-btn.twitter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = btn.getAttribute('data-url');
                const title = btn.getAttribute('data-title');
                FactPilgrim.shareOnTwitter(title, url);
            });
        });

        document.querySelectorAll('.social-btn.facebook').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = btn.getAttribute('data-url');
                FactPilgrim.shareOnFacebook(url);
            });
        });

        document.querySelectorAll('.social-btn.whatsapp').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = btn.getAttribute('data-url');
                const title = btn.getAttribute('data-title');
                FactPilgrim.shareOnWhatsApp(title, url);
            });
        });

        document.querySelectorAll('.social-btn.copy').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const url = btn.getAttribute('data-url');
                await FactPilgrim.copyArticleLink(url);
            });
        });
    }

    openArticle(filename) {
        window.open(`./articles/${filename}`, '_blank');
    }

    loadMoreArticles() {
        this.currentPage++;
        this.displayArticles();
    }

    collapseArticles() {
        this.currentPage = 1;
        this.displayArticles();
    }

    updateTicker() {
        const tickerTrack = document.getElementById('tickerTrack');
        if (!tickerTrack) return;

        let headlines = [];
        if (this.articles.length > 0) {
            headlines = this.articles.slice(0, 5).map(article => article.title);
        } else {
            headlines = ['Stay tuned for the latest news and updates from Fact Pilgrim'];
        }

        const tickerText = headlines.join(' • ');
        
        // Clear previous content
        tickerTrack.innerHTML = '';
        
        // Create Two Sets of Text for Seamless Looping
        const span1 = document.createElement('span');
        span1.textContent = tickerText + ' • ';
        
        const span2 = document.createElement('span');
        span2.textContent = tickerText + ' • ';
        
        tickerTrack.appendChild(span1);
        tickerTrack.appendChild(span2);

        // Dynamic Speed Calculation
        // Calculate width of one span to determine duration
        // We want a constant speed, e.g., 50 pixels per second
        const width = span1.offsetWidth;
        const speed = 50; // pixels per second (adjust this number to make it faster/slower)
        const duration = width / speed;

        // Apply duration to the track
        tickerTrack.style.setProperty('--ticker-duration', `${duration}s`);
    }

    formatCategory(category) {
        return category.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    static shareOnTwitter(title, url) {
        const text = `Check out this article: ${title}`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(twitterUrl, '_blank', 'width=600,height=400');
    }

    static shareOnFacebook(url) {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(facebookUrl, '_blank', 'width=600,height=400');
    }

    static shareOnWhatsApp(title, url) {
        const text = `Check out this article: ${title} - ${url}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank', 'width=600,height=400');
    }

    static async copyArticleLink(url) {
        try {
            await navigator.clipboard.writeText(url);
            this.showToast('Link copied to clipboard!');
        } catch (err) {
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Link copied to clipboard!');
        }
    }

    static showToast(message) {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

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
