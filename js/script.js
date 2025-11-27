class FactPilgrim {
    constructor() {
        this.sections = {
            'in-short': [],
            'social-tamasha': [],
            'in-depth': []
        };
        this.allArticles = [];
        this.expandedSections = new Set();
        this.init();
    }

    async init() {
        try {
            await this.loadAllArticles();
            this.renderBreakingNews();
            this.renderAllSections();
            this.setupEventListeners();
        } catch (error) {
            console.error('Init Error:', error);
        }
    }

    async loadSectionArticles(section) {
        try {
            // Note: Updated path to be more robust for GitHub Pages
            const response = await fetch(`articles/data/${section}.json`);
            if (!response.ok) return [];
            const data = await response.json();
            return data.articles || [];
        } catch (error) {
            console.warn(`Missing data for ${section}`);
            return [];
        }
    }

    async loadAllArticles() {
        const promises = Object.keys(this.sections).map(async section => {
            this.sections[section] = await this.loadSectionArticles(section);
        });
        await Promise.all(promises);
        
        // Combine and Sort
        this.allArticles = Object.values(this.sections).flat()
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    renderBreakingNews() {
        const ticker = document.getElementById('breakingNewsTicker');
        if(!ticker) return;
        
        const latest = this.allArticles.slice(0, 5);
        if (latest.length === 0) {
            ticker.innerHTML = '<div class="ticker-item">Welcome to Fact Pilgrim</div>';
            return;
        }

        const items = latest.map(art => 
            `<div class="ticker-item"><a href="articles/${art.slug}.html" class="ticker-link">${art.title}</a></div>`
        ).join('');
        
        ticker.innerHTML = items + items; // Duplicate for smooth loop
    }

    renderSection(sectionId) {
        const container = document.getElementById(`${sectionId}-articles`);
        if(!container) return;

        const articles = this.sections[sectionId];
        const isExpanded = this.expandedSections.has(sectionId);
        // Show 3 initially, or all if expanded
        const displayCount = isExpanded ? articles.length : 3;
        
        if (articles.length === 0) {
            container.innerHTML = `<div class="empty-state"><p>Coming Soon...</p></div>`;
            return;
        }

        container.innerHTML = articles.slice(0, displayCount).map(article => this.createArticleCard(article)).join('');
        this.updateButton(sectionId, isExpanded);
    }

    createArticleCard(article) {
        // FIXED: Robust Image Logic. If no image, uses a colored placeholder.
        const hasImage = article.image && article.image.trim().length > 0;
        
        // If image exists, use it. If not, use a fallback DIV.
        const imageHtml = hasImage 
            ? `<img src="${article.image}" alt="${article.title}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
               <div class="image-fallback" style="display:none">Fact Pilgrim</div>`
            : `<div class="image-fallback">Fact Pilgrim</div>`;

        return `
            <article class="article-card">
                <div class="article-image">
                    ${imageHtml}
                </div>
                <div class="article-content">
                    <h3 class="article-title">${article.title}</h3>
                    <div class="article-meta">
                        <span>${article.publish_date}</span>
                        <span class="article-category">${article.category}</span>
                    </div>
                    <p class="article-excerpt">${article.excerpt}</p>
                    <a href="articles/${article.slug}.html" class="read-more-btn">
                        Read Story <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </article>
        `;
    }

    renderAllSections() {
        Object.keys(this.sections).forEach(id => this.renderSection(id));
    }

    toggleSection(sectionId) {
        if (this.expandedSections.has(sectionId)) {
            this.expandedSections.delete(sectionId);
        } else {
            this.expandedSections.add(sectionId);
        }
        this.renderSection(sectionId);
    }

    updateButton(sectionId, isExpanded) {
        const btn = document.querySelector(`button[data-section="${sectionId}"]`);
        if(btn) {
            btn.innerHTML = isExpanded 
                ? 'Show Less <i class="fas fa-arrow-up"></i>' 
                : 'View All <i class="fas fa-arrow-right"></i>';
        }
    }

    setupEventListeners() {
        // Section Toggles
        document.querySelectorAll('.section-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.getAttribute('data-section');
                this.toggleSection(section);
            });
        });

        // Mobile Menu
        const menuBtn = document.getElementById('mobileMenuBtn');
        const navLinks = document.getElementById('navLinks');
        if(menuBtn && navLinks) {
            menuBtn.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new FactPilgrim();
});
