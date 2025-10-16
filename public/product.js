// product.js – pagină produs (slug/id) – Vercel ready

const $ = (s, r=document) => r.querySelector(s);
const fmt = n => (Math.round(Number(n||0)*100)/100).toFixed(2);

// normalizări (identice ca în script.js)
const norm = s => (s||"").toString()
  .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .toLowerCase().trim();

const slugify = s => norm(s)
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)+/g, "")
  .slice(0,80);

// ========== extrage cheie din URL: /produs/<slug> sau ?slug= / ?id=
function getKeyFromUrl(){
  const path = location.pathname.replace(/\/+$/,'');
  const m = path.match(/\/produs\/([^/]+)$/);
  if (m) return decodeURIComponent(m[1]);
  const u = new URL(location.href);
  return u.searchParams.get('slug') || u.searchParams.get('id') || "";
}

// ========== UI helpers
function renderNotFound(msg="Produs indisponibil"){
  const root = $('#product-root');
  if (!root) return;
  root.innerHTML = `
    <h1>${msg}</h1>
    <p>Produsul nu a fost specificat sau nu există.</p>
    <a class="btn btn-light" href="/">⇠ Înapoi la catalog</a>
  `;
  document.title = `Produs indisponibil • Boundless Collection`;
}

function updateOG(p, firstImage){
  document.title = `${p.title} • Boundless Collection`;
  const set = (sel, val) => { const el = document.querySelector(sel); if (el) el.setAttribute('content', val); };
  set('meta[property="og:title"]', p.title);
  set('meta[property="og:description"]', p.desc || p.category || 'Detalii produs');
  if (firstImage) set('meta[property="og:image"]', firstImage);
  set('meta[property="og:url"]', location.href);
}

function renderProduct(p){
  const root = document.querySelector('#product-root');
  if (!root) return;

  const images = Array.isArray(p.images) && p.images.length ? p.images : ['/images/preview.jpg'];
  document.title = `${p.title} • Boundless Collection`;

  // markup cu SLIDER (slide-track + butoane + dots)
  root.innerHTML = `
    <nav class="breadcrumbs"><a href="/">Acasă</a><span>›</span><span class="current">${p.title}</span></nav>

    <header class="product-head">
      <h1 class="product-title">${p.title}</h1>
      ${Number.isFinite(+p.price) ? `<span class="price-badge">${(+p.price).toFixed(2)} RON</span>` : ``}
    </header>

    <section class="product-hero">
      <div class="gallery">
        <div class="frame">
          <div class="slide-track" data-index="0" style="transform:translateX(0%)">
            ${images.map((src,i)=>`
              <img class="slide ${i===0?'active':''}" src="${src}" alt="${p.title} – imagine ${i+1}" loading="${i? 'lazy':'eager'}" decoding="async">
            `).join('')}
          </div>

          ${images.length>1 ? `
            <button class="nav prev" type="button" aria-label="Imagine anterioară">‹</button>
            <button class="nav next" type="button" aria-label="Imagine următoare">›</button>
          ` : ``}
        </div>

        ${images.length>1 ? `
          <div class="thumbs">
            ${images.map((src,i)=>`
              <button class="thumb ${i===0?'active':''}" data-i="${i}" aria-label="Miniatură ${i+1}">
                <img src="${src}" alt="Miniatură ${i+1}">
              </button>
            `).join('')}
          </div>
        ` : ``}
      </div>

      <div class="product-info">
        <p class="lead">${p.desc || 'Model elegant, personalizabil.'}</p>
        ${Array.isArray(p.options) && p.options.length ? `
          <ul class="tags">${p.options.map(o=>`<li>${o}</li>`).join('')}</ul>
        ` : ''}

        <div class="actions">
          <a class="btn primary" id="wa-btn">Cere ofertă pe WhatsApp</a>
          <a class="btn" href="/">⇠ Înapoi la catalog</a>
        </div>
      </div>
    </section>
  `;

  // === SLIDER logic ===
  const track = root.querySelector('.slide-track');
  const slides = [...root.querySelectorAll('.slide')];
  const thumbs = [...root.querySelectorAll('.thumb')];
  const prevBtn = root.querySelector('.nav.prev');
  const nextBtn = root.querySelector('.nav.next');
  let index = 0, busy = false;

  function go(i){
    if (busy || !slides.length) return;
    index = (i + slides.length) % slides.length;
    busy = true;
    track.style.transform = `translateX(${-100*index}%)`;
    slides.forEach((s,k)=>s.classList.toggle('active', k===index));
    thumbs.forEach((t,k)=>t.classList.toggle('active', k===index));
    setTimeout(()=>busy=false, 250);
  }
  function next(){ go(index+1); }
  function prev(){ go(index-1); }

  // inițializează lățimea track-ului (flex row implicit via CSS)
  track.style.width = `${slides.length*100}%`;

  // evenimente
  nextBtn?.addEventListener('click', next);
  prevBtn?.addEventListener('click', prev);
  thumbs.forEach(btn => btn.addEventListener('click', ()=> go(+btn.dataset.i)));

  // taste ← / →
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  // swipe pe mobil
  let startX=0, deltaX=0;
  track.addEventListener('touchstart', (e)=>{ startX = e.touches[0].clientX; deltaX=0; }, {passive:true});
  track.addEventListener('touchmove',  (e)=>{ deltaX = e.touches[0].clientX - startX; }, {passive:true});
  track.addEventListener('touchend',   ()=>{
    if (Math.abs(deltaX) > 40) (deltaX<0 ? next() : prev());
  });

  // WhatsApp
  root.querySelector('#wa-btn')?.addEventListener('click', ()=>{
    const msg = encodeURIComponent(`Bună! Aș dori ofertă pentru: ${p.title} (ID: ${p.id || p.slug}).`);
    window.open(`https://wa.me/40760617724?text=${msg}`, '_blank', 'noopener');
  });
}


// ========== încărcare products.json (root cu fallback + cachebust)
// ========== încărcare products.json (doar din /content, cu cachebust)
// ========== încărcare products.json (doar din /content, cu cachebust)
async function fetchProducts(){
  const cb = `?cb=${Date.now()}`;
  const url = `/content/products.json${cb}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error('Nu am putut încărca /content/products.json');
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('products.json nu e un array');
  return data;
}



// ========== main
async function main(){
  const keyRaw = getKeyFromUrl();
  if (!keyRaw){
    renderNotFound("Produs indisponibil");
    return;
  }
  const key = norm(keyRaw);

  try{
    const list = await fetchProducts();

    // match după: slug (norm), id (exact), slug(title)
    const prod = list.find(p => {
      const pid = (p.id ?? '').toString();
      const pslug = norm(p.slug ?? '');
      const ptitleSlug = slugify(p.title ?? '');
      return pslug === key || pid === keyRaw || ptitleSlug === key;
    });

    if (!prod){
      renderNotFound("Produsul nu a fost găsit.");
      return;
    }

    // canonicalizează URL-ul către /produs/{slug}
    const canonical = prod.slug || (prod.title ? slugify(prod.title) : (prod.id ?? '').toString());
    if (decodeURIComponent(keyRaw) !== canonical){
      history.replaceState(null, "", `/produs/${encodeURIComponent(canonical)}`);
    }

    renderProduct(prod);
  }catch(e){
    renderNotFound("Nu am putut încărca produsul.");
  }
}

document.addEventListener('DOMContentLoaded', main);
