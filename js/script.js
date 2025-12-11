/* js/script.js
   Restored full site JS with robust ticker behavior and correct Threads sharing encoding.
   This keeps all existing features (search, load more, hero build) and fixes ticker looping.
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
        // if it's an <a> let default happen; if a button prevent default and act
        if (homeBtn.getAttribute('href') === null) {
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

    if
