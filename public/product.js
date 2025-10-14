const $ = (s, r=document) => r.querySelector(s);
const fmt = n => (Math.round(Number(n||0)*100)/100).toFixed(2);

/* ------------ helpers ------------ */
const slugify = s => (s||"").toString()
  .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)+/g,"");

function absUrl(src){
  try { return new URL(src, location.origin).href; }
  catch { return src; }
}

/* --------- ID din URL: ?id=... sau /produs/<id|slug> --------- */
function getId(){
  const u = new URL(location.href);
  let id = u.searchParams.get('id');
  if (!id) {
    const parts = location.pathname.split('/').filter(Boolean); // ["produs","<id>"]
    const maybe = parts[1];
    if (parts[0] === 'produs' && maybe) id = decodeURIComponent(maybe);
  }
  return id || "";
}

/* --------- UI helpers --------- */
function renderNotFound(msg="Produs indisponibil"){
  $('#product-root').innerHTML = `
    <h1>${msg}</h1>
    <p>Produsul nu a fost specificat sau nu există.</p>
    <a class="btn btn-light" href="/">Înapoi la galerie</a>
  `;
  document.title = `Produs indisponibil • Boundless Collection`;
}

function setCanonical(href){
  let el = document.querySelector('link[rel="canonical"]');
  if(!el){ el = document.createElement('link'); el.rel = 'canonical'; document.head.appendChild(el); }
  el.href = href;
}

function upsertMeta(attr, content){
  const [k,v] = Object.entries(attr)[0];
  let el = document.head.querySelector(`${k}[${k}="${v}"]`);
  if(!el){ el = document.createElement('meta'); el.setAttribute(k,v); document.head.appendChild(el); }
  el.setAttribute('content', content);
}

function injectSEO(p, pageUrl, cover){
  // OG / Twitter
  upsertMeta({property:'og:type'}, 'product');
  upsertMeta({property:'og:title'}, p.title);
  upsertMeta({property:'og:description'}, p.desc || 'Produs Boundless Collection');
  upsertMeta({property:'og:image'}, cover);
  upsertMeta({property:'og:url'}, pageUrl);

  upsertMeta({name:'twitter:card'}, 'summary_large_image');
  upsertMeta({name:'twitter:title'}, p.title);
  upsertMeta({name:'twitter:description'}, p.desc || 'Produs Boundless Collection');
  upsertMeta({name:'twitter:image'}, cover);

  // JSON-LD Product
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.text = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    image: (p.images && p.images.length ? p.images : ['/content/preview.jpg']).map(absUrl),
    description: p.desc || '',
    sku: p.id,
    brand: { "@type":"Brand", "name":"Boundless Collection" },
    offers: p.price ? {
      "@type": "Offer",
      priceCurrency: "RON",
      price: Number(p.price),
      url: pageUrl,
      availability: "https://schema.org/InStock"
    } : undefined
  });
  document.head.appendChild(ld);
}

/* --------- UI produs --------- */
function renderProduct(p){
  const imgs = (Array.isArray(p.images) && p.images.length ? p.images : ['/content/preview.jpg']);
  const absImgs = imgs.map(absUrl);
  const cover = absImgs[0];
  const url = location.href;

  document.title = `${p.title} • Boundless Collection`;
  setCanonical(url);
  injectSEO(p, url, cover);

  $('#product-root').innerHTML = `
    <nav class="crumbs"><a href="/">Acasă</a> › <span class="current">${p.title}</span></nav>

    <header class="product-head">
      <h1 class="product-title">${p.title}</h1>
      ${p.price ? `<span class="price-badge">${fmt(p.price)} RON</span>` : ``}
    </header>

    <section class="product-hero">
      <div class="gallery">
        <div class="gallery-main">
          <img id="main-photo" src="${cover}" alt="${p.title}">
        </div>
        <div class="thumbs">
          ${absImgs.map((src,i)=>`
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
          <a class="btn btn-light" href="/">Înapoi la catalog</a>
        </div>
      </div>
    </section>
  `;

  // thumbs
  document.querySelectorAll('.thumb').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.thumb').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      $('#main-photo').src = btn.dataset.src;
    });
  });

  // WhatsApp
  $('#wa-btn')?.addEventListener('click', ()=>{
    const msg = encodeURIComponent(`Bună! Aș dori ofertă pentru: ${p.title} (ID: ${p.id}).`);
    window.open(`https://wa.me/40760617724?text=${msg}`, '_blank', 'noopener');
  });
}

/* --------- products.json (no-cache) --------- */
async function fetchProducts(){
  const urls = [
    `/content/products.json?cb=${Date.now()}`,
    `content/products.json?cb=${Date.now()}`
  ];
  for (const url of urls) {
    try {
      const r = await fetch(url, { headers: { 'Accept':'application/json' }, cache: 'no-store' });
      if (r.ok) return await r.json();
    } catch { /* try next */ }
  }
  throw new Error('Nu am putut încărca /content/products.json');
}

/* --------- main --------- */
async function main(){
  const id = getId();
  if(!id) return renderNotFound("Produs indisponibil");

  try{
    const list = await fetchProducts();

    // găsește după id, slug sau slug(titlu)
    const by = (x) => String(x.id) === id
      || (x.slug && String(x.slug) === id)
      || slugify(x.title) === id;

    const prod = list.find(by);
    if(!prod) return renderNotFound("Produsul nu a fost găsit.");

    renderProduct(prod);
  }catch(e){
    console.error(e);
    renderNotFound("Nu am putut încărca produsul.");
  }
}

document.addEventListener('DOMContentLoaded', main);
