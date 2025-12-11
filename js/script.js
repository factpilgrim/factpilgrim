/* js/script.js
   Full script — keeps existing site behavior, plus:
   - robust ticker measurement & restart (no mid-headline pauses)
   - Threads sharing uses encodeURIComponent (no + signs)
   - unified spacing preserved
*/

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
    window.addEventListener('resize', () => {
      clearTimeout(this.__tickerResize);
      this.__tickerResize = setTimeout(() => this.updateTicker(), 250);
    });
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
        // if home-btn is an <a> with href, allow navigation; if a button, act
        if (!homeBtn.getAttribute('href')) {
          e.preventDefault();
          this.currentPage = 1;
          this.filteredArticles = [...this.articles];
          this.displayArticles();
          const si = document.getElementById('searchInput');
          if (si) si.value = '';
        }
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
        (article.title || '').toLowerCase().includes(searchTerm) ||
        (article.summary || '').toLowerCase().includes(searchTerm) ||
        (article.category || '').toLowerCase().includes(searchTerm)
      );
    }
    this.currentPage = 1;
    this.displayArticles();
    this.updateTicker();
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
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
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
    <img src="./images/${article.image}" alt="${this.escapeHtml(article.title)}" class="hero-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
    <div class="hero-image-fallback" style="display:none">${this.escapeHtml(article.title)}</div>
  </div>
  <div class="hero-content">
    <span class="hero-category">${this.formatCategory(article.category)}</span>
    <h2 class="hero-title" onclick="factPilgrim.openArticle('${article.filename}')">${this.escapeHtml(article.title)}</h2>
    <p class="hero-summary">${this.escapeHtml(article.summary)}</p>
    <div class="hero-date">${this.formatDate(article.date)}</div>
    <a href="./articles/${article.filename}" class="hero-read-more" target="_blank">Read Full Story →</a>
    <div class="social-sharing">
      <button class="social-btn twitter" data-url="${articleUrl}" data-title="${this.escapeHtml(article.title)}"><i class="fab fa-x-twitter"></i></button>
      <button class="social-btn facebook" data-url="${articleUrl}" data-title="${this.escapeHtml(article.title)}"><i class="fab fa-facebook-f"></i></button>
      <button class="social-btn whatsapp" data-url="${articleUrl}" data-title="${this.escapeHtml(article.title)}"><i class="fab fa-whatsapp"></i></button>
      <button class="social-btn threads" data-url="${articleUrl}" data-title="${this.escapeHtml(article.title)}"><i class="fab fa-threads"></i></button>
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
    <img src="./images/${article.image}" alt="${this.escapeHtml(article.title)}" class="article-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
    <div class="article-image-fallback" style="display:none">${this.escapeHtml(article.title)}</div>
  </div>
  <div class="article-content">
    <span class="article-category">${this.formatCategory(article.category)}</span>
    <h3 class="article-title" onclick="factPilgrim.openArticle('${article.filename}')">${this.escapeHtml(article.title)}</h3>
    <p class="article-summary">${this.escapeHtml(article.summary)}</p>
    <div class="article-date">${this.formatDate(article.date)}</div>
    <a href="./articles/${article.filename}" class="article-read-more" target="_blank">Read More →</a>
    <div class="article-social">
      <button class="social-btn twitter" data-url="${articleUrl}" data-title="${this.escapeHtml(article.title)}"><i class="fab fa-x-twitter"></i></button>
      <button class="social-btn facebook" data-url="${articleUrl}" data-title="${this.escapeHtml(article.title)}"><i class="fab fa-facebook-f"></i></button>
      <button class="social-btn whatsapp" data-url="${articleUrl}" data-title="${this.escapeHtml(article.title)}"><i class="fab fa-whatsapp"></i></button>
      <button class="social-btn threads" data-url="${articleUrl}" data-title="${this.escapeHtml(article.title)}"><i class="fab fa-threads"></i></button>
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

  /* ---------- TICKER: build two blocks, measure, set CSS vars, restart animation cleanly ---------- */
  updateTicker() {
    const tickerTrack = document.getElementById('tickerTrack');
    if (!tickerTrack) return;

    // choose articles for ticker
    const tickerArticles = this.articles.slice(13, 24);
    const headlines = tickerArticles.length > 0 ? tickerArticles.map((a) => {
      const safeTitle = (a.title || 'Untitled').trim();
      return `<span class="ticker-item" data-filename="${a.filename}">${this.escapeHtml(safeTitle)}</span>`;
    }) : ['<span class="ticker-item">Stay tuned for the latest news</span>'];

    const html = headlines.join(' • ');

    // Clear existing
    tickerTrack.innerHTML = '';

    // Create two blocks containing the full list
    const blockA = document.createElement('div');
    blockA.className = 'ticker-block';
    blockA.innerHTML = html;

    const blockB = blockA.cloneNode(true);

    tickerTrack.appendChild(blockA);
    tickerTrack.appendChild(blockB);

    // attach click events on each item
    tickerTrack.querySelectorAll('.ticker-item').forEach(item => {
      item.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const filename = item.getAttribute('data-filename');
        if (filename) {
          window.open(`./articles/${filename}`, '_blank');
        }
      });
    });

    // Force rendering then measure the width of one full block
    const prevVisibility = tickerTrack.style.visibility;
    tickerTrack.style.visibility = 'hidden';
    // force reflow
    // eslint-disable-next-line no-unused-expressions
    document.body.offsetHeight;
    const blockWidth = Math.max(200, blockA.getBoundingClientRect().width);
    tickerTrack.style.visibility = prevVisibility || '';

    // set CSS vars on container so keyframes translate by the pixel width measured
    tickerTrack.style.setProperty('--scroll-width', `${blockWidth}px`);

    // compute duration from pixel speed variable
    const pps = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ticker-speed-px-per-sec')) || 100;
    const duration = Math.max(6, Math.round(blockWidth / pps));
    tickerTrack.style.setProperty('--ticker-duration', `${duration}s`);

    // restart animation cleanly to avoid stuck mid-line
    tickerTrack.style.animation = 'none';
    // force reflow
    // eslint-disable-next-line no-unused-expressions
    tickerTrack.offsetHeight;
    tickerTrack.style.animation = '';
  }

  formatCategory(category) {
    return (category || '').toUpperCase();
  }

  formatDate(dateString) {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return dateString;
    }
  }

  escapeHtml(unsafe) {
    if (!unsafe && unsafe !== 0) return '';
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* ----------------- Sharing methods (THREADS uses encodeURIComponent to avoid + signs) ----------------- */
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
    // IMPORTANT: use encodeURIComponent to avoid spaces encoded as + (URLSearchParams produces +).
    const text = `${title} - ${url}`;
    window.open(`https://threads.net/intent/post?text=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400');
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
    if (existing) existing.remove();
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
