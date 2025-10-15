// product.js – pagină produs (id/slug)

const $ = (s, r=document) => r.querySelector(s);
const fmt = n => (Math.round(Number(n||0)*100)/100).toFixed(2);

// === util: slug identic cu cel din script.js (pt. fallback) ===
const slug = s => (s||"")
  .toString()
  .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g,"-")
  .replace(/(^-|-$)+/g,"")
  .slice(0,80);

// --------- ID din URL: ?id=... sau /produs/<id|slug> ---------
function getId(){
  const u = new URL(location.href);
  let id = u.searchParams.get('id');
  if (!id) {
    const parts = location.pathname.split('/').filter(Boolean); // ["produs","<id|slug>"]
    const maybe = parts[1];
    if (parts[0] === 'produs' && maybe) id = decodeURIComponent(maybe);
  }
  return id || "";
}

// --------- UI helpers ---------
function renderNotFound(msg="Produs indisponibil"){
  const root = $('#product-root');
  if (!root) return;
  root.innerHTML = `
    <h1>${msg}</h1>
    <p>Produsul nu a fost specificat sau nu există.</p>
    <a class="btn btn-light" href="/">⇠ Înapoi la galerie</a>
  `;
  document.title = `Produs indisponibil • Boundless Collection`;
}

function renderProduct(p){
  const root = $('#product-root');
  if (!root) return;

  const images = Array.isArray(p.images) && p.images.length ? p.images : ['/images/preview.jpg'];

  // titlu + meta dinamice
  document.title = `${p.title} • Boundless Collection`;
  const ogT = document.querySelector('meta[property="og:title"]');        if (ogT) ogT.setAttribute('content', p.title);
  const ogD = document.querySelector('meta[property="og:description"]');  if (ogD) ogD.setAttribute('content', p.desc || 'Detalii produs');
  const ogI = document.querySelector('meta[property="og:image"]');        if (ogI) ogI.setAttribute('content', images[0]);
  const ogU = document.querySelector('meta[property="og:url"]');          if (ogU) ogU.setAttribute('content', location.href);

  root.innerHTML = `
    <nav class="crumbs"><a href="/">Acasă</a> › <span class="current">${p.title}</span></nav>

    <header class="product-head">
      <h1 class="product-title">${p.title}</h1>
      <span class="price-badge">${fmt(p.price)} RON</span>
    </header>

    <section class="product-hero">
      <div class="gallery">
        <div class="gallery-main">
          <img id="main-photo" src="${images[0]}" alt="${p.title}">
        </div>
        <div class="thumbs">
          ${images.map((src,i)=>`
            <button class="thumb ${i===0?'active':''}" data-src="${src}" aria-label="Imagine ${i+1}">
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

  // thumbs → schimbă imaginea mare
  root.querySelectorAll('.thumb').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      root.querySelectorAll('.thumb').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      $('#main-photo').src = btn.dataset.src;
    });
  });

  // WhatsApp
  root.querySelector('#wa-btn')?.addEventListener('click', ()=>{
    const msg = encodeURIComponent(`Bună! Aș dori ofertă pentru: ${p.title} (ID: ${p.id}).`);
    window.open(`https://wa.me/40760617724?text=${msg}`, '_blank', 'noopener');
  });
}

// --------- încărcare JSON cu fallback de cale ---------
async function fetchProducts(){
  const tries = ['/content/products.json', 'content/products.json'];
  for (const url of tries) {
    try {
      console.log('[product.js] încerc fetch:', url);
      const r = await fetch(url, { headers: { 'Accept':'application/json' } });
      console.log('[product.js] răspuns pentru', url, 'status =', r.status);
      if (r.ok) {
        const data = await r.json();
        console.log('[product.js] încărcat din', url, 'items =', Array.isArray(data) ? data.length : 'N/A');
        return data;
      }
    } catch (e) {
      console.warn('[product.js] fetch eșuat pentru', url, e);
    }
  }
  throw new Error('Nu am putut încărca products.json din /content/');
}

// --------- main ---------
async function main(){
  console.log('[product.js] location.pathname =', location.pathname);
  const key = getId();
  console.log('[product.js] id/slug din URL =', key);

  if (!key) {
    renderNotFound("Produs indisponibil");
    return;
  }

  try {
    const list = await fetchProducts();
    console.log('[product.js] produse încărcate =', Array.isArray(list) ? list.length : 'N/A');

    // match după id, slug sau slug(titlu)
    const prod = list.find(p =>
      String(p.id) === key ||
      p.slug === key ||
      slug(p.title) === key
    );
    console.log('[product.js] produs găsit =', prod);

    if (!prod) {
      renderNotFound("Produsul nu a fost găsit.");
      return;
    }

    // normalizează URL-ul (opțional)
    const canonical = prod.slug || String(prod.id) || slug(prod.title);
    if (key !== canonical) {
      history.replaceState(null, "", `/produs/${encodeURIComponent(canonical)}`);
    }

    renderProduct(prod);
  } catch (e) {
    console.error('[product.js] EROARE în main()', e);
    renderNotFound("Nu am putut încărca produsul.");
  }
}

document.addEventListener('DOMContentLoaded', main);
