/* js/script.js — final
   - Robust ticker (measure pixel width, restart cleanly)
   - Share functions: encodeURIComponent + defensive sanitization for Threads
   - No article HTML edits here
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
      const r = await fetch('./articles/data/news.json');
      if (!r.ok) throw new Error('Failed to load articles');
      this.articles = await r.json();
      this.filteredArticles = [...this.articles];
    } catch (e) {
      console.error(e);
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
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => this.searchArticles(e.target.value), 300);
      });
    }
  }

  searchArticles(q) {
    if (!q.trim()) this.filteredArticles = [...this.articles];
    else {
      const s = q.toLowerCase();
      this.filteredArticles = this.articles.filter(a => (a.title||'').toLowerCase().includes(s) || (a.summary||'').toLowerCase().includes(s) || (a.category||'').toLowerCase().includes(s));
    }
    this.currentPage = 1;
    this.displayArticles();
    this.updateTicker();
  }

  getBaseUrl() { return "https://factpilgrim.github.io/factpilgrim/"; }

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

      const start = 1;
      const end = Math.min(start + (this.currentPage * this.articlesPerPage), this.filteredArticles.length);
      const html = [];
      for (let i=start;i<end;i++) if (this.filteredArticles[i]) html.push(this.createArticleCard(this.filteredArticles[i]));
      articlesGrid.innerHTML = html.join('');

      if (loadMoreBtn) loadMoreBtn.style.display = (end < this.filteredArticles.length) ? 'block' : 'none';
      if (collapseBtn) collapseBtn.style.display = (this.currentPage > 1) ? 'block' : 'none';

      this.addSocialSharingListeners();
    });
  }

  createHeroCard(a) {
    const base = this.getBaseUrl();
    const url = `${base}articles/${a.filename}`;
    return `
<article class="hero-card" data-filename="${a.filename}">
  <div class="hero-image-container"><img src="./images/${a.image}" alt="${this.escapeHtml(a.title)}" class="hero-image"></div>
  <div class="hero-content">
    <span class="hero-category">${this.formatCategory(a.category)}</span>
    <h2 class="hero-title" onclick="factPilgrim.openArticle('${a.filename}')">${this.escapeHtml(a.title)}</h2>
    <p class="hero-summary">${this.escapeHtml(a.summary)}</p>
    <div class="hero-date">${this.formatDate(a.date)}</div>
    <a href="./articles/${a.filename}" class="hero-read-more" target="_blank">Read Full Story →</a>
    <div class="social-sharing">
      <button class="social-btn twitter" data-url="${url}" data-title="${this.escapeHtml(a.title)}"><i class="fab fa-x-twitter"></i></button>
      <button class="social-btn facebook" data-url="${url}" data-title="${this.escapeHtml(a.title)}"><i class="fab fa-facebook-f"></i></button>
      <button class="social-btn whatsapp" data-url="${url}" data-title="${this.escapeHtml(a.title)}"><i class="fab fa-whatsapp"></i></button>
      <button class="social-btn threads" data-url="${url}" data-title="${this.escapeHtml(a.title)}"><i class="fab fa-threads"></i></button>
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
  <div class="article-image-container"><img src="./images/${a.image}" alt="${this.escapeHtml(a.title)}" class="article-image"></div>
  <div class="article-content">
    <span class="article-category">${this.formatCategory(a.category)}</span>
    <h3 class="article-title" onclick="factPilgrim.openArticle('${a.filename}')">${this.escapeHtml(a.title)}</h3>
    <p class="article-summary">${this.escapeHtml(a.summary)}</p>
    <div class="article-date">${this.formatDate(a.date)}</div>
    <a href="./articles/${a.filename}" class="article-read-more" target="_blank">Read More →</a>
    <div class="article-social">
      <button class="social-btn twitter" data-url="${url}" data-title="${this.escapeHtml(a.title)}"><i class="fab fa-x-twitter"></i></button>
      <button class="social-btn facebook" data-url="${url}" data-title="${this.escapeHtml(a.title)}"><i class="fab fa-facebook-f"></i></button>
      <button class="social-btn whatsapp" data-url="${url}" data-title="${this.escapeHtml(a.title)}"><i class="fab fa-whatsapp"></i></button>
      <button class="social-btn threads" data-url="${url}" data-title="${this.escapeHtml(a.title)}"><i class="fab fa-threads"></i></button>
      <button class="social-btn copy" data-url="${url}"><i class="fas fa-link"></i></button>
    </div>
  </div>
</article>`;
  }

  addSocialSharingListeners() {
    document.querySelectorAll('.social-btn.twitter').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); FactPilgrim.shareOnTwitter(btn.dataset.title, btn.dataset.url); }));
    document.querySelectorAll('.social-btn.facebook').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); FactPilgrim.shareOnFacebook(btn.dataset.url); }));
    document.querySelectorAll('.social-btn.whatsapp').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); FactPilgrim.shareOnWhatsApp(btn.dataset.title, btn.dataset.url); }));
    document.querySelectorAll('.social-btn.threads').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); FactPilgrim.shareOnThreads(btn.dataset.title, btn.dataset.url); }));
    document.querySelectorAll('.social-btn.copy').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); FactPilgrim.copyArticleLink(btn.dataset.url); }));
  }

  openArticle(filename) { window.open(`./articles/${filename}`, '_blank'); }
  loadMoreArticles() { this.currentPage++; this.displayArticles(); }
  collapseArticles() { this.currentPage = 1; this.displayArticles(); }

  updateTicker() {
    const ticker = document.getElementById('tickerTrack');
    if (!ticker) return;
    const items = this.articles.slice(13,24);
    const headlines = items.length ? items.map(a => `<span class="ticker-item" data-filename="${a.filename}">${this.escapeHtml(a.title||'Untitled')}</span>`).join(' • ') : '<span class="ticker-item">Stay tuned for latest news</span>';
    ticker.innerHTML = '';
    const a = document.createElement('div'); a.className='ticker-block'; a.innerHTML = headlines;
    const b = a.cloneNode(true);
    ticker.appendChild(a); ticker.appendChild(b);
    ticker.querySelectorAll('.ticker-item').forEach(it => it.addEventListener('click', ev => { ev.stopPropagation(); const f = it.getAttribute('data-filename'); if (f) window.open(`./articles/${f}`,'_blank'); }));
    const prevVis = ticker.style.visibility;
    ticker.style.visibility = 'hidden';
    document.body.offsetHeight;
    const w = Math.max(200, a.getBoundingClientRect().width || 200);
    ticker.style.visibility = prevVis || '';
    ticker.style.setProperty('--scroll-width', `${w}px`);
    const pps = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ticker-speed-px-per-sec')) || 100;
    const dur = Math.max(6, Math.round(w / pps));
    ticker.style.setProperty('--ticker-duration', `${dur}s`);
    ticker.style.animation = 'none';
    ticker.offsetHeight;
    ticker.style.animation = '';
  }

  formatCategory(c) { return (c||'').toUpperCase(); }
  formatDate(d) { try { return new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }); } catch(e) { return d; } }
  escapeHtml(str) { if (!str && str!==0) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }

  static shareOnTwitter(title, url) {
    const t = title || document.title || '';
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(url)}`,'_blank','width=600,height=400');
  }
  static shareOnFacebook(url) {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,'_blank','width=600,height=400');
  }
  static shareOnWhatsApp(title, url) {
    const t = title || document.title || '';
    window.open(`https://wa.me/?text=${encodeURIComponent(t + ' - ' + url)}`,'_blank','width=600,height=400');
  }

  static shareOnThreads(title, url) {
    const t = title || document.title || '';
    let text = `${t} - ${url}`;
    try { text = decodeURIComponent(text); } catch(e) { /* ignore */ }
    let encoded = encodeURIComponent(text);
    encoded = encoded.replace(/\+/g, '%20');
    window.open(`https://threads.net/intent/post?text=${encoded}`, '_blank', 'width=600,height=400');
  }

  static async copyArticleLink(url) {
    try { await navigator.clipboard.writeText(url); FactPilgrim.showToast('Link copied!'); }
    catch(e) { const ta=document.createElement('textarea'); ta.value=url; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); FactPilgrim.showToast('Link copied!'); }
  }

  static showToast(msg) {
    const existing = document.querySelector('.toast'); if (existing) existing.remove();
    const t = document.createElement('div'); t.className='toast'; t.textContent = msg; document.body.appendChild(t);
    setTimeout(()=>t.classList.add('show'),100); setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),300); },3000);
  }
}

let factPilgrim;
document.addEventListener('DOMContentLoaded', () => { factPilgrim = new FactPilgrim(); });
