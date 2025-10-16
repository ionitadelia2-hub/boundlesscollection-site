// product.js – pagină produs (merge cu /p/<slug>.html și /produs/<slug>)
const $ = (s, r=document) => r.querySelector(s);
const fmt = n => (Math.round(Number(n||0)*100)/100).toFixed(2);

const norm = s => (s||"").toString()
  .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .toLowerCase().trim();

const slugify = s => norm(s)
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)+/g, "")
  .slice(0,80);

// ---- extrage cheia din URL (/produs/<slug> | /p/<slug>.html | ?slug= / ?id=)
function getKeyFromUrl(){
  const path = location.pathname.replace(/\/+$/,'');
  // /p/<slug>.html  (extensia .html e opțională)
  let m = path.match(/\/p\/([^\/\.]+)(?:\.html)?$/i);
  if (m) return decodeURIComponent(m[1]);
  // /produs/<slug>
  m = path.match(/\/produs\/([^/]+)$/i);
  if (m) return decodeURIComponent(m[1]);

  const u = new URL(location.href);
  return u.searchParams.get('slug') || u.searchParams.get('id') || "";
}

// ---- UI helpers
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

// ---- rander produs + slider
function renderProduct(p){
  const root = $('#product-root');
  if (!root) return;

  const images = Array.isArray(p.images) && p.images.length ? p.images : ['/images/preview.jpg'];
  updateOG(p, images[0]);

  root.innerHTML = `
    <nav class="crumbs"><a href="/">Acasă</a> › <span class="current">${p.title}</span></nav>

    <header class="product-head">
      <h1 class="product-title">${p.title}</h1>
      ${Number.isFinite(+p.price) ? `<span class="price-badge">${fmt(p.price)} RON</span>` : ``}
    </header>

    <section class="product-hero">
      <div class="gallery">
        <div class="gallery-main">
          <button class="nav prev" aria-label="Anterior">‹</button>
          <img id="main-photo" src="${images[0]}" alt="${p.title}">
          <button class="nav next" aria-label="Următor">›</button>
        </div>
        <div class="thumbs">
          ${images.map((src,i)=>`
            <button class="thumb ${i===0?'active':''}" data-index="${i}" aria-label="Imagine ${i+1}">
              <img src="${src}" alt="${p.title} imagine ${i+1}">
            </button>
          `).join('')}
        </div>
      </div>

      <div class="product-info">
        <p class="lead">${p.desc || 'Model elegant, personalizabil.'}</p>

        ${Array.isArray(p.options) && p.options.length ? `
          <ul class="tags">
            ${p.options.map(o => `<li>${o}</li>`).join('')}
          </ul>
        ` : ''}

        <div class="actions">
          <a class="btn btn-primary" id="wa-btn">Cere ofertă pe WhatsApp</a>
          <a class="btn btn-light" href="/">⇠ Înapoi la catalog</a>
        </div>
      </div>
    </section>
  `;

  // ---- slider logic (prev/next + thumbs)
  let idx = 0;
  const main = $('#main-photo');
  const thumbs = [...root.querySelectorAll('.thumb')];

  function show(i){
    idx = (i + images.length) % images.length;
    main.src = images[idx];
    thumbs.forEach(b => b.classList.toggle('active', Number(b.dataset.index)===idx));
  }

  root.querySelector('.prev')?.addEventListener('click', ()=>show(idx-1));
  root.querySelector('.next')?.addEventListener('click', ()=>show(idx+1));
  thumbs.forEach(btn => btn.addEventListener('click', ()=>show(Number(btn.dataset.index))));

  // WhatsApp
  root.querySelector('#wa-btn')?.addEventListener('click', ()=>{
    const msg = encodeURIComponent(`Bună! Aș dori ofertă pentru: ${p.title} (ID: ${p.id || p.slug}).`);
    window.open(`https://wa.me/40760617724?text=${msg}`, '_blank', 'noopener');
  });
}

// ---- încărcare products.json
async function fetchProducts(){
  const cb = `?cb=${Date.now()}`;
  const url = `/content/products.json${cb}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error('Nu am putut încărca /content/products.json');
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('products.json nu e un array');
  return data;
}

// ---- main
async function main(){
  const keyRaw = getKeyFromUrl();
  if (!keyRaw){ renderNotFound("Produs indisponibil"); return; }
  const key = norm(keyRaw);

  try{
    const list = await fetchProducts();

    const prod = list.find(p => {
      const pid = (p.id ?? '').toString();
      const pslug = norm(p.slug ?? '');
      const ptitleSlug = slugify(p.title ?? '');
      return pslug === key || pid === keyRaw || ptitleSlug === key;
    });

    if (!prod){ renderNotFound("Produsul nu a fost găsit."); return; }

    // Canonical: nu forțăm redirect între /p/ și /produs/ ca să nu stricăm paginile statice,
    // doar actualizăm URL-ul în aceeași „familie” dacă e nevoie.
    const canonicalSlug = prod.slug || (prod.title ? slugify(prod.title) : (prod.id ?? '').toString());
    const path = location.pathname;
    const isStatic = /\/p\//.test(path);
    const desired = isStatic ? `/p/${encodeURIComponent(canonicalSlug)}.html`
                             : `/produs/${encodeURIComponent(canonicalSlug)}`;
    if (!decodeURIComponent(path).endsWith(decodeURIComponent(desired))){
      history.replaceState(null, "", desired);
    }

    renderProduct(prod);
  }catch(e){
    renderNotFound("Nu am putut încărca produsul.");
  }
}

document.addEventListener('DOMContentLoaded', main);
