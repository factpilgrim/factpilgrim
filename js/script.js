/* js/script.js — full (only changes: ticker logic + shareOnThreads encoding) */

class FactPilgrim {
  constructor() {
    this.articles = [];
    this.filteredArticles = [];
    this.currentPage = 1;
    this.articlesPerPage = 12;
    this.isLoading = false;
    this.init();
  }

  async init() {
    await this.loadArticles();
    this.setupEventListeners();
    this.displayArticles();
    this.updateTicker();
    window.addEventListener('resize', () => {
      clearTimeout(this.__tickerResize);
      this.__tickerResize = setTimeout(() => this.updateTicker(), 220);
    });
  }

  async loadArticles() {
    if (this.isLoading) return;
    this.isLoading = true;
    try {
      const res = await fetch('./articles/data/news.json');
      if (!res.ok) throw new Error('Failed to load');
      this.articles = await res.json();
      this.filteredArticles = [...this.articles];
    } catch (err) {
      console.error(err);
      this.articles = [];
      this.filteredArticles = [];
    } finally { this.isLoading = false; }
  }

  setupEventListeners() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => this.loadMoreArticles());
    const collapseBtn = document.getElementById('collapseBtn');
    if (collapseBtn) collapseBtn.addEventListener('click', () => this.collapseArticles());
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      let t;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(t);
        t = setTimeout(() => this.searchArticles(e.target.value), 300);
      });
    }
  }

  searchArticles(q) {
    if (!q.trim()) { this.filteredArticles = [...this.articles]; }
    else {
      const s = q.toLowerCase();
      this.filteredArticles = this.articles.filter(a => (a.title||'').toLowerCase().includes(s) || (a.summary||'').toLowerCase().includes(s) || (a.category||'').toLowerCase().includes(s));
    }
    this.currentPage = 1;
    this.displayArticles();
    this.updateTicker(); // refresh ticker when search changes
  }

  displayArticles() {
    const heroSection = document.getElementById('heroSection');
    const articlesGrid = document.getElementById('articlesGrid');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const collapseBtn = document.getElementById('collapseBtn');
    if (!heroSection || !articlesGrid) return;

    heroSection.innerHTML = '';
    articlesGrid.innerHTML = '';

    if (this.filteredArticles.length === 0) {
      heroSection.innerHTML = '<div class="no-articles"><h2>No articles found</h2></div>';
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }

    const heroArticle = this.filteredArticles[0];
    heroSection.innerHTML = this.createHeroCard(heroArticle);

    const start = 1;
    const end = Math.min(start + (this.currentPage * this.articlesPerPage), this.filteredArticles.length);
    const html = [];
    for (let i = start; i < end; i++) { if (this.filteredArticles[i]) html.push(this.createArticleCard(this.filteredArticles[i])); }
    articlesGrid.innerHTML = html.join('');

    if (loadMoreBtn) loadMoreBtn.style.display = (end < this.filteredArticles.length) ? 'block' : 'none';
    if (collapseBtn) collapseBtn.style.display = (this.currentPage > 1) ? 'block' : 'none';

    this.addSocialSharingListeners();
  }

  createHeroCard(a) {
    const base = this.getBaseUrl();
    const url = `${base}articles/${a.filename}`;
    return `
<article class="hero-card" data-filename="${a.filename}">
  <div class="hero-image-container">
    <img src="./images/${a.image}" alt="${a.title}" class="hero-image">
  </div>
  <div class="hero-content">
    <span class="hero-category">${this.formatCategory(a.category)}</span>
    <h2 class="hero-title" onclick="factPilgrim.openArticle('${a.filename}')">${a.title}</h2>
    <p class="hero-summary">${a.summary}</p>
    <div class="hero-date">${this.formatDate(a.date)}</div>
    <a href="./articles/${a.filename}" class="hero-read-more" target="_blank">Read Full Story →</a>
    <div class="social-sharing">
      <button class="social-btn twitter" data-url="${url}" data-title="${a.title}"><i class="fab fa-x-twitter"></i></button>
      <button class="social-btn facebook" data-url="${url}" data-title="${a.title}"><i class="fab fa-facebook-f"></i></button>
      <button class="social-btn whatsapp" data-url="${url}" data-title="${a.title}"><i class="fab fa-whatsapp"></i></button>
      <button class="social-btn threads" data-url="${url}" data-title="${a.title}"><i class="fab fa-threads"></i></button>
      <button class="social-btn copy" data-url="${url}"><i class="fas fa-link"></i></button>
    </div>
  </div>
</article>`;
  }

  createArticleCard(a) {
    const base = this.getBaseUrl();
    const url = `${base}articles/${a.filename}`;
    return `
<article class="article-card" data-filename="${a.filename}">
  <div class="article-image-container">
    <img src="./images/${a.image}" alt="${a.title}" class="article-image">
  </div>
  <div class="article-content">
    <span class="article-category">${this.formatCategory(a.category)}</span>
    <h3 class="article-title" onclick="factPilgrim.openArticle('${a.filename}')">${a.title}</h3>
    <p class="article-summary">${a.summary}</p>
    <div class="article-date">${this.formatDate(a.date)}</div>
    <a href="./articles/${a.filename}" class="article-read-more" target="_blank">Read More →</a>
    <div class="article-social">
      <button class="social-btn twitter" data-url="${url}" data-title="${a.title}"><i class="fab fa-x-twitter"></i></button>
      <button class="social-btn facebook" data-url="${url}" data-title="${a.title}"><i class="fab fa-facebook-f"></i></button>
      <button class="social-btn whatsapp" data-url="${url}" data-title="${a.title}"><i class="fab fa-whatsapp"></i></button>
      <button class="social-btn threads" data-url="${url}" data-title="${a.title}"><i class="fab fa-threads"></i></button>
      <button class="social-btn copy" data-url="${url}"><i class="fas fa-link"></i></button>
    </div>
  </div>
</article>`;
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

  /* ----- TICKER: build seamless blocks, measure pixel width, set --scroll-width and duration ----- */
  updateTicker() {
    const tickerTrack = document.getElementById('tickerTrack');
    if (!tickerTrack) return;

    // Build headlines (same selection as before)
    const tickerArticles = this.articles.slice(13, 24);
    const headlines = tickerArticles.length ? tickerArticles.map(a => `<span class="ticker-item" data-filename="${a.filename}">${(a.title||'Untitled')}</span>`) : ['<span class="ticker-item">Stay tuned for the latest news</span>'];

    const innerHTML = headlines.join(' • ');
    // clear existing
    tickerTrack.innerHTML = '';

    // Create a block (one full pass)
    const blockA = document.createElement('div');
    blockA.className = 'ticker-block';
    blockA.innerHTML = innerHTML;

    // Duplicate it
    const blockB = blockA.cloneNode(true);

    tickerTrack.appendChild(blockA);
    tickerTrack.appendChild(blockB);

    // attach headline click: delegated to each item
    tickerTrack.querySelectorAll('.ticker-item').forEach(item => {
      item.addEventListener('click', (ev) => {
        const filename = item.getAttribute('data-filename');
        if (filename) window.open(`./articles/${filename}`, '_blank');
      });
    });

    // Measure the pixel width of one full block (blockA)
    // Ensure it's rendered before measurement: force reflow
    // small hack: temporarily set visibility to hidden while measuring to avoid flicker
    tickerTrack.style.visibility = 'hidden';
    document.body.offsetHeight; // force reflow
    const blockWidth = blockA.getBoundingClientRect().width || 800;
    tickerTrack.style.visibility = '';

    // set CSS variable for scroll width (the animation uses this to move exactly the block width)
    tickerTrack.style.setProperty('--scroll-width', `${blockWidth}px`);

    // compute duration from pixels-per-second so speed is visually consistent
    const pps = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ticker-speed-px-per-sec')) || 100;
    const durationSec = Math.max(6, Math.round(blockWidth / pps));
    tickerTrack.style.setProperty('--ticker-duration', `${durationSec}s`);

    // restart animation cleanly (avoid jumping)
    tickerTrack.style.animation = 'none';
    // force reflow
    // eslint-disable-next-line no-unused-expressions
    tickerTrack.offsetHeight;
    tickerTrack.style.animation = '';
  }

  formatCategory(category) { return (category || '').toUpperCase(); }
  formatDate(dateString) { try { return new Date(dateString).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }); } catch(e){ return dateString; } }

  getBaseUrl(){ return "https://factpilgrim.github.io/factpilgrim/"; }

  /* --------- Sharing helpers (THREADS: ALWAYS use encodeURIComponent(), not URLSearchParams) --------- */
  static shareOnTwitter(title, url) {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank','width=600,height=400');
  }

  static shareOnFacebook(url) {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank','width=600,height=400');
  }

  static shareOnWhatsApp(title, url) {
    window.open(`https://wa.me/?text=${encodeURIComponent(title + ' - ' + url)}`, '_blank','width=600,height=400');
  }

  static shareOnThreads(title, url) {
    // IMPORTANT: use encodeURIComponent to encode spaces as %20 and keep punctuation intact.
    // Do NOT use URLSearchParams(...).toString() which encodes spaces as + (that's the source of + signs).
    const text = `${title} - ${url}`;
    window.open(`https://threads.net/intent/post?text=${encodeURIComponent(text)}`, '_blank','width=600,height=400');
  }

  static async copyArticleLink(url) {
    try { await navigator.clipboard.writeText(url); FactPilgrim.showToast('Link copied!'); }
    catch(e) { const ta = document.createElement('textarea'); ta.value = url; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); FactPilgrim.showToast('Link copied!'); }
  }

  static showToast(msg){
    const existing = document.querySelector('.toast'); if(existing) existing.remove();
    const t = document.createElement('div'); t.className='toast'; t.textContent = msg; document.body.appendChild(t);
    setTimeout(()=>t.classList.add('show'),100); setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),300); },3000);
  }
}

/* instantiate */
let factPilgrim;
document.addEventListener('DOMContentLoaded', () => { factPilgrim = new FactPilgrim(); });
