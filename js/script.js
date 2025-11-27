class FactPilgrim {
    constructor() {
        this.sections = {
            'in-short': [],
            'social-tamasha': [],
            'in-depth': []
        };
        this.allArticles = [];
        this.expandedSections = new Set();
        this.currentFilter = null;
        
        this.init();
    }

    async init() {
        try {
            await this.loadAllArticles();
            this.renderBreakingNews();
            this.renderAllSections();
            this.setupEventListeners();
            this.setupSearch();
        } catch (error) {
            console.error('Failed to initialize Fact Pilgrim:', error);
            this.showError('Failed to load content. Please refresh the page.');
        }
    }

    async loadSectionArticles(section) {
        try {
            const response = await fetch(`articles/data/${section}.json`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            return Array.isArray(data.articles) ? data.articles : [];
        } catch (error) {
            console.warn(`Could not load ${section} articles:`, error);
            return [];
        }
    }

    async loadAllArticles() {
        const loadingPromises = Object.keys(this.sections).map(async (section) => {
            this.sections[section] = await this.loadSectionArticles(section);
        });

        await Promise.all(loadingPromises);
        
        // Combine all articles
        this.allArticles = Object.values(this.sections).flat();
        
        // Sort all articles by publish date (newest first)
        this.allArticles.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Sort each section
        Object.keys(this.sections).forEach(section => {
            this.sections[section].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        });
    }

    renderBreakingNews() {
        const ticker = document.getElementById('breakingNewsTicker');
        const latestArticles = this.allArticles.slice(0, 20); // Increased to 20 articles

        if (latestArticles.length === 0) {
            ticker.innerHTML = '<div class="ticker-item">Latest news updates coming soon...</div>';
            return;
        }

        const tickerItems = latestArticles.map(article => `
            <div class="ticker-item">
                <a href="articles/${article.slug}.html" class="ticker-link">${article.title}</a>
            </div>
        `).join('');

        // Create multiple duplicates for seamless continuous looping
        ticker.innerHTML = tickerItems + tickerItems + tickerItems;
    }

    renderSection(sectionId) {
        const container = document.getElementById(`${sectionId}-articles`);
        const articles = this.sections[sectionId];
        const isExpanded = this.expandedSections.has(sectionId);
        const displayCount = isExpanded ? articles.length : 3;

        if (articles.length === 0) {
            container.innerHTML = this.createEmptyState(sectionId);
            return;
        }

        const articlesToShow = articles.slice(0, displayCount);
        container.innerHTML = articlesToShow.map(article => this.createArticleCard(article, sectionId)).join('');

        // Update toggle button
        this.updateSectionToggleButton(sectionId, isExpanded);
    }

    createArticleCard(article, sectionId) {
        // Auto-adjust image based on section
        let imageSize = '400x250'; // Default size
        
        switch(sectionId) {
            case 'in-short':
                imageSize = '350x220'; // Smaller for quick reads
                break;
            case 'social-tamasha':
                imageSize = '400x250'; // Standard for social content
                break;
            case 'in-depth':
                imageSize = '450x280'; // Larger for featured articles
                break;
        }

        const imageContent = article.image ? 
            `<img src="${article.image}" alt="${article.title}" loading="lazy" onerror="this.onerror=null; this.src='images/BreakingNews.jpg'; this.style.objectFit='cover';">` :
            `<img src="images/BreakingNews.jpg" alt="Breaking News" style="object-fit: cover; width: 100%; height: 100%;">`;

        return `
            <article class="article-card" data-category="${article.category}" data-id="${article.id}">
                <div class="article-image">
                    ${imageContent}
                </div>
                <div class="article-content">
                    <h3 class="article-title">${article.title}</h3>
                    <div class="article-meta">
                        <span class="article-date">${article.publish_date}</span>
                        <span class="article-category">${article.category}</span>
                    </div>
                    <p class="article-excerpt">${article.excerpt}</p>
                    <a href="articles/${article.slug}.html" class="read-more-btn">
                        Read Full Story
                        <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </article>
        `;
    }

    createEmptyState(sectionId) {
        const sectionNames = {
            'in-short': 'In Short',
            'social-tamasha': 'Social Tamasha',
            'in-depth': 'In Depth'
        };

        return `
            <div class="empty-state">
                <i class="fas fa-newspaper"></i>
                <h3>No Articles Yet</h3>
                <p>Check back soon for new ${sectionNames[sectionId]} articles.</p>
            </div>
        `;
    }

    renderAllSections() {
        Object.keys(this.sections).forEach(section => {
            this.renderSection(section);
        });
    }

    toggleSection(sectionId) {
        if (this.expandedSections.has(sectionId)) {
            this.expandedSections.delete(sectionId);
        } else {
            this.expandedSections.add(sectionId);
        }
        this.renderSection(sectionId);
    }

    updateSectionToggleButton(sectionId, isExpanded) {
        const button = document.querySelector(`[data-section="${sectionId}"]`);
        if (!button) return;

        const textSpan = button.querySelector('.btn-text');
        const icon = button.querySelector('i');

        if (isExpanded) {
            textSpan.textContent = 'Show Less';
            icon.className = 'fas fa-arrow-up';
        } else {
            textSpan.textContent = 'View All';
            icon.className = 'fas fa-arrow-right';
        }
    }

    filterByCategory(category) {
        this.currentFilter = category;
        const filteredArticles = this.allArticles.filter(article => 
            article.category === category
        );

        if (filteredArticles.length === 0) {
            this.showMessage(`No articles found in ${category} category.`);
            return;
        }

        this.renderCategoryView(category, filteredArticles);
    }

    renderCategoryView(category, articles) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });

        // Create or update category view
        let categoryView = document.getElementById('category-view');
        if (!categoryView) {
            categoryView = document.createElement('section');
            categoryView.id = 'category-view';
            categoryView.className = 'content-section';
            document.querySelector('.main-content').prepend(categoryView);
        }

        categoryView.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">
                    <i class="fas fa-filter"></i>
                    ${category} Articles
                </h2>
                <button class="section-toggle-btn" id="clearCategoryFilter">
                    <span class="btn-text">Back to Home</span>
                    <i class="fas fa-arrow-left"></i>
                </button>
            </div>
            <div class="articles-grid">
                ${articles.map(article => this.createArticleCard(article, 'in-depth')).join('')}
            </div>
        `;

        categoryView.style.display = 'block';

        // Add event listener to clear button
        document.getElementById('clearCategoryFilter').addEventListener('click', () => {
            this.clearCategoryFilter();
        });
    }

    clearCategoryFilter() {
        this.currentFilter = null;
        const categoryView = document.getElementById('category-view');
        if (categoryView) {
            categoryView.remove();
        }

        // Show all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'block';
        });

        this.renderAllSections();
    }

    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');

        const performSearch = () => {
            const query = searchInput.value.trim().toLowerCase();
            if (query.length < 2) {
                if (this.currentFilter) {
                    this.clearCategoryFilter();
                }
                return;
            }

            const results = this.allArticles.filter(article =>
                article.title.toLowerCase().includes(query) ||
                article.excerpt.toLowerCase().includes(query) ||
                article.category.toLowerCase().includes(query)
            );

            if (results.length === 0) {
                this.showMessage(`No results found for "${query}"`);
                return;
            }

            this.renderSearchResults(query, results);
        };

        searchInput.addEventListener('input', this.debounce(performSearch, 300));
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }

    renderSearchResults(query, results) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });

        // Create or update search results view
        let searchView = document.getElementById('search-results');
        if (!searchView) {
            searchView = document.createElement('section');
            searchView.id = 'search-results';
            searchView.className = 'content-section';
            document.querySelector('.main-content').prepend(searchView);
        }

        searchView.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">
                    <i class="fas fa-search"></i>
                    Search Results
                </h2>
                <button class="section-toggle-btn" id="clearSearch">
                    <span class="btn-text">Clear Search</span>
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="search-meta">
                <p>Found ${results.length} results for "<strong>${query}</strong>"</p>
            </div>
            <div class="articles-grid">
                ${results.map(article => this.createArticleCard(article, 'in-depth')).join('')}
            </div>
        `;

        searchView.style.display = 'block';

        // Add event listener to clear button
        document.getElementById('clearSearch').addEventListener('click', () => {
            this.clearSearch();
        });
    }

    clearSearch() {
        const searchView = document.getElementById('search-results');
        const searchInput = document.getElementById('searchInput');
        
        if (searchView) searchView.remove();
        if (searchInput) searchInput.value = '';

        // Show all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'block';
        });

        this.renderAllSections();
    }

    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const navLinks = document.getElementById('navLinks');
        
        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                mobileMenuBtn.setAttribute('aria-expanded', 
                    navLinks.classList.contains('active').toString()
                );
            });
        }

        // Section toggle buttons
        document.querySelectorAll('.section-toggle-btn[data-section]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const section = button.getAttribute('data-section');
                this.toggleSection(section);
            });
        });

        // Category filters
        document.querySelectorAll('.category-filter').forEach(button => {
            button.addEventListener('click', () => {
                const category = button.getAttribute('data-category');
                this.filterByCategory(category);
            });
        });

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    mobileMenuBtn.setAttribute('aria-expended', 'false');
                }
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-container') && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    mobileMenuBtn.setAttribute('aria-expanded', 'false');
                }
                this.clearSearch();
                this.clearCategoryFilter();
            }
        });
    }

    // Utility functions
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

    showMessage(message, type = 'info') {
        // Remove existing message
        const existingMessage = document.getElementById('flash-message');
        if (existingMessage) existingMessage.remove();

        // Create new message
        const messageEl = document.createElement('div');
        messageEl.id = 'flash-message';
        messageEl.className = `flash-message flash-${type}`;
        messageEl.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add styles
        const styles = `
            .flash-message {
                position: fixed;
                top: 100px;
                right: 20px;
                background: var(--primary-blue);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: var(--border-radius-md);
                box-shadow: var(--card-shadow-hover);
                z-index: 1001;
                display: flex;
                align-items: center;
                gap: 1rem;
                max-width: 400px;
                animation: slideInRight 0.3s ease;
            }
            .flash-message button {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 0.25rem;
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;

        if (!document.getElementById('flash-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'flash-styles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }

        document.body.appendChild(messageEl);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentElement) {
                messageEl.remove();
            }
        }, 5000);
    }

    showError(message) {
        this.showMessage(message, 'error');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.factPilgrim = new FactPilgrim();
});
