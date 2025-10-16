/* =============== Helpers =============== */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

let PRODUCTS = [];
let activeFilter = 'toate';

const grid       = $('#grid');
const q          = $('#q');
const filterBtns = $$('.filter .pill');

// ===== DEBUG UI (banner vizibil când apare o eroare) =====
function debugBanner(msg){
  try{
    let el = document.getElementById('__debug_banner');
    if(!el){
      el = document.createElement('div');
      el.id='__debug_banner';
      el.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:99999;padding:.7rem 1rem;background:#b00020;color:#fff;font:600 14px/1.3 system-ui,Segoe UI,Arial;border-bottom:2px solid rgba(255,255,255,.25);box-shadow:0 6px 16px rgba(0,0,0,.25)';
      el.innerHTML = '<span id="__debug_text"></span> <button id="__debug_close" style="margin-left:12px;padding:.25rem .55rem;border:0;border-radius:999px;background:#fff;color:#b00020;font-weight:700;cursor:pointer">OK</button>';
      document.body.appendChild(el);
      document.getElementById('__debug_close').onclick = ()=> el.remove();
    }
    document.getElementById('__debug_text').innerHTML = msg;
  }catch(e){ console.warn('debugBanner fail', e); }
}


const slug = s => (s||"")
  .toString()
  .normalize("NFD").replace(/[\u0300-\u036f]/g,"") // fără diacritice
  .toLowerCase()
  .replace(/[^a-z0-9]+/g,"-")
  .replace(/(^-|-$)+/g,"")
  .slice(0,80);

// normalizare pt. comparații (căutare/filtrare)
const norm = s => (s||"")
  .toString()
  .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .toLowerCase().trim();

/* =============== Card + Render =============== */
function card(p){
  const imgs   = Array.isArray(p.images) ? p.images : [];
  const dots   = imgs.map((_,i)=>`<i class="${i===0?'active':''}"></i>`).join('');
  const slides = imgs.map((src,i)=>`<img src="${src}" alt="${p.title}" class="${i===0?'active':''}" loading="lazy" decoding="async">`).join('');

  // folosește link-ul spre pagina statică
const linkId = p.slug || p.id || slug(p.title);
const href = `/p/${encodeURIComponent(linkId)}.html`;


  const hasPrice = Number.isFinite(Number(p.price));
  const priceStr = hasPrice ? `${Number(p.price).toFixed(2)} RON` : '';

  return `
  <article class="item" data-id="${p.id||''}">
    <a class="card-link" href="${href}" aria-label="Vezi detalii ${p.title}">
      <div class="media">
        <div class="slide-track" data-index="0">
          ${slides || `<img src="/images/preview.jpg" alt="${p.title}" class="active" style="opacity:.25">`}
        </div>
        ${imgs.length>1 ? `
        <div class="slider-nav">
          <button class="prev" type="button" aria-label="Anterior">‹</button>
          <button class="next" type="button" aria-label="Următor">›</button>
        </div>
        <div class="slider-dots">${dots}</div>` : ``}
      </div>
      <div class="content">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:.6rem;flex-wrap:wrap">
          <h3 style="margin:0;font-size:1rem">${p.title}</h3>
          <span class="pill">${p.category || ''}</span>
        </div>
        <p class="muted" style="margin:.25rem 0 .6rem">${p.desc || ""}</p>
        <div class="price">${priceStr}</div>
      </div>
    </a>
    <div class="actions">
      <button class="btn" type="button" data-act="share">Distribuie</button>
      <button class="btn primary" type="button" data-act="inquire">Solicită ofertă</button>
    </div>
  </article>`;
}


function emptyState(message){
  return `
    <div class="item" style="grid-column:1/-1;text-align:center;padding:2rem 1rem;opacity:.8">
      ${message}
    </div>`;
}

function render(){
  if (!grid) return;
  const term = norm(q?.value || '');

  const items = PRODUCTS.filter(p=>{
    const hay = norm([p.title, p.desc, p.category, ...(p.tags||[])].join(' '));
    const hitTerm = !term || hay.includes(term);
    const hitCat  = activeFilter === 'toate'
                 || p.categoryKey === activeFilter
                 || (p.tagsKey && p.tagsKey.includes(activeFilter));
    return hitTerm && hitCat;
  });

  grid.innerHTML = items.length
    ? items.map(card).join('')
    : emptyState('Nu am găsit produse pentru filtrul/căutarea selectată.');

  // butoanele din card
  grid.querySelectorAll('.actions .btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      e.stopPropagation();
      const card = e.currentTarget.closest('.item');
      const id = card?.dataset.id;
      const p = PRODUCTS.find(x=>x.id===id);
      if(!p) return;
      if (btn.dataset.act === 'share') share(p.title);
      if (btn.dataset.act === 'inquire') inquire(p.title, id);
    });
  });
}

/* =============== Loader JSON =============== */
async function fetchFirstOk(urls){
  for (const u of urls){
    try{
      const res = await fetch(u, { headers: { 'Accept': 'application/json' }});
      if (res.ok) return res;
    }catch{/* try next */}
  }
  throw new Error('Nu s-a putut încărca niciun products.json din căile testate.');
}

/* =============== Loader JSON =============== */
async function loadProducts(){
  const url = '/content/products.json?cb=' + Date.now();
  try{
    console.log('[loadProducts] încerc:', url);
    const res = await fetch(url, { headers: { 'Accept': 'application/json' }});
    if (!res.ok){
      const txt = await res.text().catch(()=>'(fără body)');
      const msg = `❌ products.json NU s-a încărcat (${res.status}). URL: <code>${url.split('?')[0]}</code><br><small>Body: ${txt.slice(0,180)}</small>`;
      console.error('[loadProducts] HTTP', res.status, txt);
      debugBanner(msg);
      // mesaj și în grid ca să fie evident
      if (grid) grid.innerHTML = `
        <div class="item" style="grid-column:1/-1;padding:1.2rem;border:1px solid #ffd8e7;border-radius:12px;background:#fff0f3">
          ${msg}
        </div>`;
      PRODUCTS = [];
      return;
    }

    const data = await res.json();
    if(!Array.isArray(data)){
      const msg = '❌ Format invalid: <code>content/products.json</code> trebuie să fie un array.';
      console.error('[loadProducts] format invalid', data);
      debugBanner(msg);
      if (grid) grid.innerHTML = `
        <div class="item" style="grid-column:1/-1;padding:1.2rem;border:1px solid #ffd8e7;border-radius:12px;background:#fff0f3">
          ${msg}
        </div>`;
      PRODUCTS = [];
      return;
    }

    PRODUCTS = data.map(p => {
      const tags = Array.isArray(p.tags) ? p.tags : [];
      return {
        id: p.id || (crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)),
        title: p.title || '',
        price: Number(p.price ?? NaN),
        category: p.category || '',
        categoryKey: norm(p.category || ''),
        desc: p.desc || '',
        images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
        slug: p.slug || slug(p.title),
        tags,
        tagsKey: tags.map(norm)
      };
    });

    console.log('[loadProducts] OK, produse:', PRODUCTS.length);
  }catch(err){
    const msg = `❌ Eroare rețea la <code>${url.split('?')[0]}</code>: ${String(err)}`;
    console.error('[loadProducts] catch', err);
    debugBanner(msg);
    PRODUCTS = [];
    if (grid){
      grid.innerHTML = `
        <div class="item" style="grid-column:1/-1;padding:1.2rem;border:1px solid #ffd8e7;border-radius:12px;background:#fff0f3">
          ${msg}
        </div>`;
    }
  }
}


/* =============== Acțiuni publice =============== */
function inquire(title){
  const url = location.href.split('#')[0] + '#contact';
  alert(`Mulțumesc pentru interes în „${title}”! Mergi la Contact pentru ofertă.\n\n${url}`);
  location.hash = 'contact';
}
window.inquire = inquire;

async function share(title){
  const shareData = { title: "Boundless Collection", text: `Îți recomand: ${title}`, url: location.href };
  try {
    if (navigator.share) { await navigator.share(shareData); }
    else { throw 0; }
  } catch {
    navigator.clipboard?.writeText(shareData.url);
    alert('Link copiat!');
  }
}
window.share = share;

/* =============== Slider delegat (prev/next + swipe) =============== */
grid?.addEventListener('click', (e)=>{
  const prev = e.target.closest('.prev');
  const next = e.target.closest('.next');
  if(!prev && !next) return;

  const card  = e.target.closest('.item');
  const track = card.querySelector('.slide-track');
  const imgs  = [...track.querySelectorAll('img')];
  if(!imgs.length) return;

  const dots = card.querySelectorAll('.slider-dots i');
  let i = parseInt(track.dataset.index || '0', 10);

  i = i + (next ? 1 : -1);
  if (i < 0) i = imgs.length - 1;
  if (i > imgs.length - 1) i = 0;

  track.dataset.index = i;
  imgs.forEach((im, idx)=> im.classList.toggle('active', idx===i));
  dots?.forEach((d, idx)=> d.classList.toggle('active', idx===i));
});

// swipe simplu
let sx=0, sy=0;
grid?.addEventListener('touchstart', (e)=>{ sx=e.touches[0].clientX; sy=e.touches[0].clientY; }, {passive:true});
grid?.addEventListener('touchend', (e)=>{
  const ex=e.changedTouches[0].clientX, ey=e.changedTouches[0].clientY;
  if(Math.abs(ex-sx)<30 || Math.abs(ey-sy)>60) return;
  const card = e.target.closest('.item'); if(!card) return;
  const btn  = card.querySelector(ex<sx ? '.next' : '.prev');
  btn?.click();
},{passive:true});

/* =============== Init pe DOMContentLoaded =============== */
window.addEventListener('DOMContentLoaded', async ()=>{
  // filtre (folosește data-filter sau textul butonului ca fallback)
  filterBtns.forEach(btn => btn.addEventListener('click', ()=>{
    filterBtns.forEach(b=>b.setAttribute('aria-pressed','false'));
    btn.setAttribute('aria-pressed','true');
    const key = btn.dataset.filter || btn.textContent;
    activeFilter = norm(key || 'toate'); // <- normalizat!
    render();
  }));

  // search
  q?.addEventListener('input', render);

  // anul curent în footer
  const year = $('#year'); if (year) year.textContent = new Date().getFullYear();

  // încarcă & randează
  await loadProducts();
  render();
});

/* =============== Meniu mobil (hamburger) =============== */
(function(){
  const btnHamb  = document.querySelector('.nav-toggle');
  const mainMenu = document.querySelector('#mainmenu');
  const dd       = document.querySelector('.dropdown');
  const ddBtn    = dd?.querySelector('.dropbtn');
  const ddMenu   = dd?.querySelector('.menu');

  // deschide/închide panoul mobil
  if (btnHamb && mainMenu){
    btnHamb.addEventListener('click', (e)=>{
      e.preventDefault();
      e.stopPropagation();
      const open = document.body.classList.toggle('menu-open');
      btnHamb.setAttribute('aria-expanded', open ? 'true' : 'false');
      dd?.classList.remove('open');
      ddBtn?.setAttribute('aria-expanded','false');
    });
  }

  // dropdown “Produse” (în meniu)
  if (dd && ddBtn && ddMenu){
    const close = ()=>{ 
      dd.classList.remove('open'); 
      ddBtn.setAttribute('aria-expanded','false'); 
    };

    ddBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      e.stopPropagation();
      const now = dd.classList.toggle('open');
      ddBtn.setAttribute('aria-expanded', now ? 'true' : 'false');
    });

    ddMenu.addEventListener('click', (e)=> e.stopPropagation());
    document.addEventListener('click', close);
    document.addEventListener('keydown', (e)=>{ if (e.key==='Escape') close(); });
  }

  // click în afara panoului mobil => închide
  document.addEventListener('click', (e)=>{
    if (!document.body.classList.contains('menu-open')) return;
    const inside = e.target.closest('.nav-toggle') || e.target.closest('nav');
    if (!inside){
      document.body.classList.remove('menu-open');
      btnHamb?.setAttribute('aria-expanded','false');
      dd?.classList.remove('open');
      ddBtn?.setAttribute('aria-expanded','false');
    }
  });

  // ESC închide panoul mobil
  document.addEventListener('keydown', (e)=>{
    if (e.key !== 'Escape') return;
    if (document.body.classList.contains('menu-open')){
      document.body.classList.remove('menu-open');
      btnHamb?.setAttribute('aria-expanded','false');
      dd?.classList.remove('open');
      ddBtn?.setAttribute('aria-expanded','false');
    }
  });
})();
