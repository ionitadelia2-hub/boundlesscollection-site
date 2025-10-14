const $ = (s, r=document) => r.querySelector(s);
const fmt = n => (Math.round(Number(n||0)*100)/100).toFixed(2);

/* --------- ID din URL: ?id=... sau /produs/<id> --------- */
function getId(){
  const u = new URL(location.href);
  let id = u.searchParams.get('id');
  if (!id) {
    // suport pentru rewrites /produs/<id>
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

function renderProduct(p){
  const images = Array.isArray(p.images) && p.images.length ? p.images : ['/images/preview.jpg'];

  // titlu dinamic în tab
  document.title = `${p.title} • Boundless Collection`;

  $('#product-root').innerHTML = `
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
          <a class="btn btn-light" href="/">Înapoi la catalog</a>
        </div>
      </div>
    </section>
  `;

  // thumbs → schimbă imaginea principală
  document.querySelectorAll('.thumb').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.thumb').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      $('#main-photo').src = btn.dataset.src;
    });
  });

  // WhatsApp
  $('#wa-btn').addEventListener('click', ()=>{
    const msg = encodeURIComponent(`Bună! Aș dori ofertă pentru: ${p.title} (ID: ${p.id}).`);
    window.open(`https://wa.me/40760617724?text=${msg}`, '_blank', 'noopener');
  });
}

/* --------- încărcare JSON cu fallback de cale --------- */
async function fetchProducts(){
  const tries = ['/content/products.json', 'content/products.json'];
  for (const url of tries) {
    try {
      const r = await fetch(url, { headers: { 'Accept':'application/json' } });
      if (r.ok) return await r.json();
    } catch (e) {
      // continuăm cu următoarea variantă
    }
  }
  throw new Error('Nu am putut încărca products.json din /content/');
}

/* --------- main --------- */
async function main(){
  const id = getId();
  if(!id) return renderNotFound("Produs indisponibil");

  try{
    const list = await fetchProducts();
    const prod = list.find(x => String(x.id) === id);
    if(!prod) return renderNotFound("Produsul nu a fost găsit.");
    renderProduct(prod);
  }catch(e){
    console.error(e);
    renderNotFound("Nu am putut încărca produsul.");
  }
}

document.addEventListener('DOMContentLoaded', main);
