/* =============== Helpers =============== */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

let PRODUCTS = [];
let activeFilter = 'toate';

const grid       = $('#grid');
const q          = $('#q');
const filterBtns = $$('.filter .pill');

const slug = s => (s||"")
  .toString()
  .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g,"-")
  .replace(/(^-|-$)+/g,"")
  .slice(0,80);

const norm = s => (s||"")
  .toString()
  .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .toLowerCase().trim();

/* Aliasuri între butoane și categorii/taguri */
const ALIASES = {
  'plicuri': ['plicuri', 'plicuri de dar', 'plic'],
  'marturii soia': ['marturii soia', 'marturii', 'marturii din ceara de soia'],
  'aranjamente florale': ['aranjamente florale', 'aranjamente'],
  'set': ['set', 'seturi'],
  'numere': ['numere', 'numere de masa'],
  'meniuri': ['meniuri', 'meniu'],
  'invitatii': ['invitatii', 'invitații', 'invitatie', 'invitație']
};
const matchesAlias = (candidate, filterKey) => {
  const options = ALIASES[filterKey] || [filterKey];
  return options.some(opt => candidate.includes(opt));
};

/* =============== Card + Render =============== */
function card(p){
  const imgs   = Array.isArray(p.images) ? p.images : [];
  const dots   = imgs.map((_,i)=>`<i class="${i===0?'active':''}"></i>`).join('');
  const slides = imgs.map((src,i)=>`<img src="${src}" alt="${p.title}" class="${i===0?'active':''}" loading="lazy" decoding="async">`).join('');

  const linkId = p.slug || p.id || slug(p.title);
  const href = `/produs/${encodeURIComponent(linkId)}`;

  return `
  <article class="item" data-id="${p.id}">
    <div class="media" data-href="${href}">
      <div class="slide-track" data-index="0">
        ${slides || `<img src="images/preview.jpg" alt="${p.title}" class="active" style="opacity:.25">`}
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
        <h3 style="margin:0;font-size:1rem">
          <a href="${href}" class="card-title-link">${p.title}</a>
        </h3>
        <span class="pill">${p.category || ''}</span>
      </div>
      <p class="muted" style="margin:.25rem 0 .6rem">${p.desc || ""}</p>
      <div class="price">${Number(p.price||0).toFixed(2)} RON</div>
    </div>

    <div class="actions">
      <button class="btn" type="button" data-act="share">Distribuie</button>
      <button class="btn primary" type="button" data-act="inquire">Solicită ofertă</button>
    </div>
  </article>`;
}

function render(){
  if (!grid) return;
  const term = norm(q?.value || '');

  const items = PRODUCTS.filter(p=>{
    const hay = norm([p.title, p.desc, p.category, ...(p.tags||[])].join(' '));
    const hitTerm = !term || hay.includes(term);

    const hitCat = activeFilter === 'toate'
      || matchesAlias(p.categoryKey, activeFilter)
      || (p.tagsKey && p.tagsKey.some(t => matchesAlias(t, activeFilter)));

    return hitTerm && hitCat;
  });

  grid.innerHTML = items.map(card).join('');

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

/* =============== Loader JSON (multi-path, cu fallback) =============== */
async function fetchFirst(urls){
  for (const url of urls){
    try{
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if(res.ok){
        console.info('[products.json] loaded from:', url);
        return await res.json();
      }else{
        console.warn('[products.json] not found at:', url, res.status);
      }
    }catch(e){
      console.warn('[products.json] error at:', url, e?.message||e);
    }
  }
  throw new Error('Nu am putut încărca products.json din niciuna dintre căi.');
}

async function loadProducts(){
  // Dacă rulează pe GitHub Pages sub /<user>.github.io/<repo>/
  const basePath = (location.pathname.includes('/boundlesscollection-site/'))
    ? '/boundlesscollection-site'
    : '';

  // Încearcă pe rând: rădăcina curentă, /content, și cu prefixul repo-ului
  const candidates = [
    './products.json?cb=' + Date.now(),
    './content/products.json?cb=' + Date.now(),
    `${basePath}/products.json?cb=${Date.now()}`,
    `${basePath}/content/products.json?cb=${Date.now()}`
  ];

  const data = await fetchFirst(candidates);
  if(!Array.isArray(data)) throw new Error('Format invalid: products.json trebuie să fie un array');

  PRODUCTS = data.map(p => {
    const tags = Array.isArray(p.tags) ? p.tags : [];
    return {
      id: p.id || (crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)),
      title: p.title || '',
      price: Number(p.price || 0),
      category: p.category || '',
      categoryKey: norm(p.category || ''),
      desc: p.desc || '',
      // asigură-te că în products.json imaginile sunt fără slash inițial: "images/.."
      images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
      slug: p.slug || slug(p.title),
      tags,
      tagsKey: tags.map(norm)
    };
  });
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

/* =============== Slider: click delegat (prev/next/dots/media) =============== */
grid?.addEventListener('click', (e)=>{
  const card  = e.target.closest('.item');
  if (!card) return;

  const track = card.querySelector('.slide-track');
  const imgs  = [...track.querySelectorAll('img')];
  const dotsC = card.querySelector('.slider-dots');
  const dots  = dotsC ? [...dotsC.querySelectorAll('i')] : [];
  const setIndex = (i)=>{
    if (!imgs.length) return;
    i = (i + imgs.length) % imgs.length;
    track.dataset.index = i;
    imgs.forEach((im, idx)=> im.classList.toggle('active', idx===i));
    dots.forEach((d, idx)=> d.classList.toggle('active', idx===i));
  };

  const prev = e.target.closest('.prev');
  const next = e.target.closest('.next');
  if (prev || next){
    e.preventDefault(); e.stopPropagation();
    let i = parseInt(track.dataset.index || '0', 10);
    setIndex(i + (next ? 1 : -1));
    return;
  }

  const dot = e.target.closest('.slider-dots i');
  if (dot){
    e.preventDefault(); e.stopPropagation();
    const i = dots.indexOf(dot);
    if (i >= 0) setIndex(i);
    return;
  }

  const media = e.target.closest('.media');
  if (media && !e.target.closest('.slider-nav') && !e.target.closest('.slider-dots')){
    const href = media.dataset.href;
    if (href){
      e.preventDefault();
      location.href = href;
    }
  }
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

/* =============== Init =============== */
window.addEventListener('DOMContentLoaded', async ()=>{
  filterBtns.forEach(btn => btn.addEventListener('click', ()=>{
    filterBtns.forEach(b=>b.setAttribute('aria-pressed','false'));
    btn.setAttribute('aria-pressed','true');
    activeFilter = norm(btn.dataset.filter || 'toate');
    render();
  }));

  q?.addEventListener('input', render);

  const year = $('#year'); if (year) year.textContent = new Date().getFullYear();

  try{
    await loadProducts();
  }catch(err){
    console.error(err);
    alert('Nu s-a putut încărca lista de produse. Vezi consola pentru detalii.');
  }
  render();
});

/* =============== Meniu mobil =============== */
(function(){
  const btnHamb  = document.querySelector('.nav-toggle');
  const mainMenu = document.querySelector('#mainmenu');
  const dd       = document.querySelector('.dropdown');
  const ddBtn    = dd?.querySelector('.dropbtn');
  const ddMenu   = dd?.querySelector('.menu');

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
