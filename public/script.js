/* ================== Helpers ================== */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const fmt = n => (Math.round(Number(n||0)*100)/100).toFixed(2);
const slug = s => (s||"")
  .toString()
  .normalize("NFD").replace(/[\u0300-\u036f]/g,"") // fără diacritice
  .toLowerCase()
  .replace(/[^a-z0-9]+/g,"-")
  .replace(/(^-|-$)+/g,"")
  .slice(0,80);

/* ================== State ================== */
let PRODUCTS = [];
let activeFilter = 'toate';

const grid       = $('#grid');
const q          = $('#q');
const filterBtns = $$('.filter .pill');

/* ================== Card ================== */
function catLabel(cat){
  // Acceptă string sau array și întoarce un text frumos
  if (Array.isArray(cat)) return cat.join(', ');
  return String(cat||'').trim();
}
function catSlugs(cat){
  // Slug-uri pentru filtrare
  if (Array.isArray(cat)) return cat.map(c => slug(c));
  if (typeof cat === 'string') return [slug(cat)];
  return [];
}

function card(p){
  const imgs   = Array.isArray(p.images) ? p.images : [];
  const dots   = imgs.map((_,i)=>`<i class="${i===0?'active':''}"></i>`).join('');
  const slides = imgs.map((src,i)=>`<img src="${src}" alt="${p.title}" class="${i===0?'active':''}" loading="lazy" decoding="async">`).join('');

  // cardul este link către pagina de produs, butoanele rămân clickabile
  return `
  <article class="item" data-id="${p.id}" data-cats="${catSlugs(p.category).join(' ')}" tabindex="0">
    <a class="card-link" href="/produs.html?id=${encodeURIComponent(p.id)}" aria-label="Vezi detalii ${p.title}">
      <div class="media">
        <div class="slide-track" data-index="0">
          ${slides || `<img src="/images/preview.jpg" alt="${p.title}" class="active" style="opacity:.3">`}
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
          <span class="pill">${catLabel(p.category)}</span>
        </div>
        <p class="muted" style="margin:.25rem 0 .6rem">${p.desc || ""}</p>
        <div class="price">${fmt(p.price)} RON</div>
      </div>
    </a>

    <div class="actions">
      <button class="btn" type="button" data-act="share">Distribuie</button>
      <button class="btn primary" type="button" data-act="inquire">Solicită ofertă</button>
    </div>
  </article>`;
}

/* ================== Render ================== */
function matchesFilter(p){
  if (activeFilter === 'toate') return true;
  const wanted = slug(activeFilter);
  const cats = catSlugs(p.category);
  return cats.includes(wanted);
}

function render(){
  if (!grid || !PRODUCTS.length) { grid && (grid.innerHTML = ''); return; }
  const term = (q?.value || '').toLowerCase();

  const items = PRODUCTS.filter(p=>{
    const hay = [p.title, p.desc, catLabel(p.category)].join(' ').toLowerCase();
    const hitTerm = !term || hay.includes(term);
    return hitTerm && matchesFilter(p);
  });

  grid.innerHTML = items.map(card).join('');

  // delegare pentru butoane share/inquire ca să nu deschidă linkul cardului
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

  // accesibilitate: Enter pe card → deschide link
  grid.querySelectorAll('.item').forEach(it=>{
    it.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter'){
        const a = it.querySelector('.card-link');
        a?.click();
      }
    });
  });
}

/* ================== Loader JSON ================== */
async function loadProducts(){
  try{
    // script.js
const res = await fetch('/content/products.json?cachebust=' + Date.now(), {
  headers: { 'Accept': 'application/json' }
});

    if(!res.ok) throw new Error('Nu s-a putut încărca products.json');
    const data = await res.json();
    if(!Array.isArray(data)) throw new Error('Format invalid: products.json trebuie să fie un array');

    PRODUCTS = data.map(p => {
      const id = p.id ? String(p.id) : slug(p.title);
      return {
        id: id || crypto.randomUUID(),
        title: p.title || '',
        price: Number(p.price ?? p.price_from ?? 0),
        // categorie poate fi string sau array
        category: Array.isArray(p.category) ? p.category : (p.category ? [p.category] : []),
        desc: p.desc || p.description || '',
        images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
      };
    });
  }catch(err){
    console.error(err);
    PRODUCTS = [];
  }
}

/* ================== Acțiuni publice ================== */
function inquire(title, id){
  const url = new URL('/produs.html', location.origin);
  if (id) url.searchParams.set('id', id);
  const waMsg = encodeURIComponent(`Bună! Aș dori o ofertă pentru: ${title}${id?` (ID: ${id})`:''}.`);
  const wa = `https://wa.me/40760617724?text=${waMsg}`;
  // mergi direct pe WhatsApp (mai tare pt conversie)
  window.open(wa, '_blank', 'noopener');
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

/* ================== Slider delegat (prev/next + swipe) ================== */
grid?.addEventListener('click', (e)=>{
  const btn = e.target.closest('.prev, .next');
  if(!btn) return;

  // Nu lăsa butoanele slider să apese linkul cardului
  e.preventDefault(); e.stopPropagation();

  const card  = e.target.closest('.item');
  const track = card.querySelector('.slide-track');
  const imgs  = [...track.querySelectorAll('img')];
  if(!imgs.length) return;

  const dots = card.querySelectorAll('.slider-dots i');
  let i = parseInt(track.dataset.index || '0', 10);

  i = i + (btn.classList.contains('next') ? 1 : -1);
  if (i < 0) i = imgs.length - 1;
  if (i > imgs.length - 1) i = 0;

  track.dataset.index = i;
  imgs.forEach((im, idx)=> im.classList.toggle('active', idx===i));
  dots?.forEach((d, idx)=> d.classList.toggle('active', idx===i));
});

// swipe simplu (nu declanșa linkul cardului)
let sx=0, sy=0;
grid?.addEventListener('touchstart', (e)=>{ sx=e.touches[0].clientX; sy=e.touches[0].clientY; }, {passive:true});
grid?.addEventListener('touchend', (e)=>{
  const ex=e.changedTouches[0].clientX, ey=e.changedTouches[0].clientY;
  if(Math.abs(ex-sx)<30 || Math.abs(ey-sy)>60) return;
  const card = e.target.closest('.item'); if(!card) return;
  const btn  = card.querySelector(ex<sx ? '.next' : '.prev');
  // prevenim clickul pe linkul cardului
  e.preventDefault(); e.stopPropagation();
  btn?.click();
},{passive:true});

/* ================== Init ================== */
window.addEventListener('DOMContentLoaded', async ()=>{
  // filtre
  filterBtns.forEach(btn => btn.addEventListener('click', ()=>{
    filterBtns.forEach(b=>b.setAttribute('aria-pressed','false'));
    btn.setAttribute('aria-pressed','true');
    activeFilter = (btn.dataset.filter || 'toate').toLowerCase();
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

/* ================== Meniu mobil + dropdown ================== */
(function(){
  const btnHamb  = document.querySelector('.nav-toggle');
  const mainMenu = document.querySelector('#mainmenu');
  const dd       = document.querySelector('.dropdown');
  const ddBtn    = dd?.querySelector('.dropbtn');
  const ddMenu   = dd?.querySelector('.menu');

  // panou mobil
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

  // dropdown
  if (dd && ddBtn && ddMenu){
    const close = ()=>{ dd.classList.remove('open'); ddBtn.setAttribute('aria-expanded','false'); };
    ddBtn.addEventListener('click', (e)=>{
      e.preventDefault(); e.stopPropagation();
      const now = dd.classList.toggle('open');
      ddBtn.setAttribute('aria-expanded', now ? 'true' : 'false');
    });
    ddMenu.addEventListener('click', (e)=> e.stopPropagation());
    document.addEventListener('click', close);
    document.addEventListener('keydown', (e)=>{ if (e.key==='Escape') close(); });
  }

  // click în afară → închide panoul mobil
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
})();
