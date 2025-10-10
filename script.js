/* =============== Helpers =============== */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

let PRODUCTS = [];
let activeFilter = 'toate';

const grid       = $('#grid');
const q          = $('#q');
const filterBtns = $$('.filter .pill');

/* =============== Card + Render =============== */
function card(p){
  const imgs   = Array.isArray(p.images) ? p.images : [];
  const dots   = imgs.map((_,i)=>`<i class="${i===0?'active':''}"></i>`).join('');
  const slides = imgs.map((src,i)=>`<img src="${src}" alt="${p.title}" class="${i===0?'active':''}" loading="lazy">`).join('');

  return `
  <article class="item" data-id="${p.id}">
    <div class="media">
      <div class="slide-track" data-index="0">
        ${slides || `<img src="" alt="${p.title}" class="active" style="opacity:.25">`}
      </div>
      ${imgs.length>1 ? `
      <div class="slider-nav">
        <button class="prev" aria-label="Anterior">‹</button>
        <button class="next" aria-label="Următor">›</button>
      </div>
      <div class="slider-dots">${dots}</div>` : ``}
    </div>

    <div class="content">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:.6rem;flex-wrap:wrap">
        <h3 style="margin:0;font-size:1rem">${p.title}</h3>
        <span class="pill">${p.category}</span>
      </div>
      <p class="muted" style="margin:.25rem 0 .6rem">${p.desc || ""}</p>
      <div class="price">${Number(p.price).toFixed(2)} RON</div>
    </div>

    <div class="actions">
      <button class="btn" onclick="share('${p.title}')">Distribuie</button>
      <button class="btn primary" onclick="inquire('${p.title}')">Solicită ofertă</button>
    </div>
  </article>`;
}

function render(){
  if (!grid) return;
  const term = (q?.value || '').toLowerCase();
  const items = PRODUCTS.filter(p=>{
    const hitTerm = [p.title, p.desc, p.category].join(' ').toLowerCase().includes(term);
    const hitCat  = activeFilter==='toate' || p.category===activeFilter;
    return hitTerm && hitCat;
  });
  grid.innerHTML = items.map(card).join('');
}

/* =============== Loader JSON =============== */
async function loadProducts(){
  try{
    const res = await fetch('content/products.json?cachebust=' + Date.now(), {
      headers: { 'Accept': 'application/json' }
    });
    if(!res.ok) throw new Error('Nu s-a putut încărca products.json');
    const data = await res.json();
    if(!Array.isArray(data)) throw new Error('Format invalid: products.json trebuie să fie un array');
    // normalizare minimă:
    PRODUCTS = data.map(p => ({
      id: p.id || crypto.randomUUID(),
      title: p.title || '',
      price: Number(p.price || 0),
      category: p.category || '',
      desc: p.desc || '',
      images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : [])
    }));
  }catch(err){
    console.error(err);
    PRODUCTS = []; // fallback gol
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
  // filtre
  filterBtns.forEach(btn => btn.addEventListener('click', ()=>{
    filterBtns.forEach(b=>b.setAttribute('aria-pressed','false'));
    btn.setAttribute('aria-pressed','true');
    activeFilter = btn.dataset.filter;
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
