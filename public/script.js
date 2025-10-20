// script.js – catalog + navigație
(function () {
  'use strict';

  // ===== Helpers globali =====
  if (!window.$)  window.$  = (s, d = document) => d.querySelector(s);
  if (!window.$$) window.$$ = (s, d = document) => Array.from(d.querySelectorAll(s));

  const grid       = $('#grid') || null;
  const q          = $('#q') || null;
  const filterBtns = $$('.filter .pill') || [];

  let PRODUCTS = [];
  let activeFilter = 'toate';

  // ===== Filtru setat de pagină (ex: marturii.html) =====
  const PAGE_FILTER = (typeof window.PAGE_CATEGORY === 'string' && window.PAGE_CATEGORY.trim())
    ? window.PAGE_CATEGORY.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()
    : null;

  // ===== Normalizări =====
  const norm = (s) =>
    (s || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const slug = (s) =>
    (s || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .slice(0, 80);

  // ===== Card produs =====
  function card(p) {
    const imgs   = Array.isArray(p.images) ? p.images : [];
    const dots   = imgs.map((_, i) => `<i class="${i === 0 ? 'active' : ''}"></i>`).join('');
    const slides = imgs.map(
      (src, i) =>
        `<img src="${src}" alt="${p.title}" class="${i === 0 ? 'active' : ''}" loading="lazy" decoding="async">`
    ).join('');

    const linkId = p.slug || p.id || slug(p.title);
    const href   = `/p/${encodeURIComponent(linkId)}.html`;
    const priceStr = Number.isFinite(Number(p.price)) ? `${Number(p.price).toFixed(2)} RON` : '';

    return `
    <article class="item" data-id="${p.id || ''}">
      <a class="card-link" href="${href}" aria-label="Vezi detalii ${p.title}">
        <div class="media">
          <div class="slide-track" data-index="0">
            ${slides || `<img src="/images/preview.jpg" alt="${p.title}" class="active" style="opacity:.25">`}
          </div>
          ${imgs.length > 1 ? `
            <div class="slider-nav">
              <button class="prev" type="button">‹</button>
              <button class="next" type="button">›</button>
            </div>
            <div class="slider-dots">${dots}</div>` : ``}
        </div>
        <div class="content">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:.6rem;flex-wrap:wrap">
            <h3 style="margin:0;font-size:1rem">${p.title}</h3>
            <span class="pill">${p.category || ''}</span>
          </div>
          <p class="muted" style="margin:.25rem 0 .6rem">${p.desc || ''}</p>
          <div class="price">${priceStr}</div>
        </div>
      </a>
      <div class="actions">
        <button class="btn" type="button" data-act="share">Distribuie</button>
        <button class="btn primary" type="button" data-act="inquire">Solicită ofertă</button>
      </div>
    </article>`;
  }

  function emptyState(message) {
    return `<div class="item" style="grid-column:1/-1;text-align:center;padding:2rem 1rem;opacity:.8">${message}</div>`;
  }

  // ===== Render produse =====
  function render() {
    if (!grid) return;
    const term = norm(q?.value || '');

    const items = PRODUCTS.filter((p) => {
      const hay = norm([p.title, p.desc, p.category, ...(p.tags || [])].join(' '));
      const hitTerm = !term || hay.includes(term);

      const hitCatToggle =
        activeFilter === 'toate' ||
        p.categoryKey === activeFilter ||
        (p.tagsKey && p.tagsKey.includes(activeFilter));

      const hitPage =
        !PAGE_FILTER ||
        p.categoryKey === PAGE_FILTER ||
        (p.tagsKey && p.tagsKey.includes(PAGE_FILTER));

      return hitTerm && hitCatToggle && hitPage;
    });

    grid.innerHTML = items.length
      ? items.map(card).join('')
      : emptyState('Nu am găsit produse pentru această categorie.');

    // acțiuni
    grid.querySelectorAll('.actions .btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const card = e.currentTarget.closest('.item');
        const id = card?.dataset.id;
        const p = PRODUCTS.find((x) => x.id === id);
        if (!p) return;
        if (btn.dataset.act === 'share') share(p.title);
        if (btn.dataset.act === 'inquire') inquire(p.title, id);
      });
    });
  }

  // ===== Încărcare produse =====
  async function loadProducts() {
    const url = '/content/products.json?cb=' + Date.now();
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Eroare la încărcarea fișierului');

      const data = await res.json();
      PRODUCTS = Array.isArray(data)
        ? data.map((p) => {
            const tags = Array.isArray(p.tags) ? p.tags : [];
            return {
              id: p.id || String(Math.random()).slice(2),
              title: p.title || '',
              price: Number(p.price ?? NaN),
              category: p.category || '',
              categoryKey: norm(p.category || ''),
              desc: p.desc || '',
              images: Array.isArray(p.images) ? p.images : [],
              slug: p.slug || slug(p.title),
              tags,
              tagsKey: tags.map(norm),
            };
          })
        : [];
    } catch (err) {
      console.error('loadProducts:', err);
      PRODUCTS = [];
    }
  }

  // ===== Acțiuni publice =====
  function inquire(title) {
    alert(`Mulțumesc pentru interes în „${title}”!`);
  }

  async function share(title) {
    const data = { title: 'Boundless Collection', text: `Îți recomand: ${title}`, url: location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else throw 0;
    } catch {
      navigator.clipboard?.writeText(data.url);
      alert('Link copiat!');
    }
  }

  // ===== Init =====
  window.addEventListener('DOMContentLoaded', async () => {
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();

    if (grid) {
      await loadProducts();
      render();
    }

    filterBtns.forEach((btn) =>
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
        const key = btn.dataset.filter || btn.textContent;
        activeFilter = norm(key || 'toate');
        render();
      })
    );

    q?.addEventListener('input', render);
  });
})();
