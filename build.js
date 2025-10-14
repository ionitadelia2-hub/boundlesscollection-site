// build.js — Rulează: npm run build:catalog
// 1) CSV -> content/products.json
// 2) Generează /p/<slug>.html (cu OG/Twitter + JSON-LD corecte)
// 3) Generează sitemap.xml

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// --- Căi proiect
const ROOT      = __dirname;
const CSV_FILE  = path.join(ROOT, 'content', 'products.csv');
const JSON_OUT  = path.join(ROOT, 'content', 'products.json');
const PAGES_DIR = path.join(ROOT, 'p');

// --- Domeniu (ORIGIN) — env SITE_ORIGIN > fallback domeniu live
const ORIGIN = (process.env.SITE_ORIGIN || 'https://boundlesscollection.ro').replace(/\/+$/, '');

// ===================== Utils =====================
function slugify(str){
  return (str||'').toString().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'')     // diacritice
    .replace(/[^a-z0-9\s-]/gi,'')       // caractere non-alfanumerice
    .trim()
    .replace(/\s+/g,'-')
    .replace(/-+/g,'-')
    .toLowerCase();
}

function esc(s){
  return (s||'').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

/** CSV parser care respectă ghilimelele (poți avea virgule în descrieri) */
function parseCSV(text){
  const lines = text.split(/\r?\n/).filter(l => l.trim().length);
  if (!lines.length) return [];

  const splitCsv = (line) => {
    const out = [];
    let cur = '', inQ = false;
    for (let i=0; i<line.length; i++){
      const ch = line[i];
      if (ch === '"'){
        if (inQ && line[i+1] === '"'){ cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === ',' && !inQ){
        out.push(cur); cur = '';
      } else cur += ch;
    }
    out.push(cur);
    return out.map(v => v.trim());
  };

  const header = splitCsv(lines[0]).map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = splitCsv(line);
    const row = {};
    header.forEach((h,i) => row[h] = (cols[i]||'').trim());
    return row;
  });
}

/** Pentru <img> din pagină (pagină în /p/, imagini în /images) */
function toRelForPage(u){
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;          // lasă URL absolut
  if (u.startsWith('/')) return `..${u}`;          // /images/x.jpg -> ../images/x.jpg
  return `../${u.replace(/^\.?\//,'')}`;           // images/x.jpg -> ../images/x.jpg
}

/** Pentru OG/Twitter/JSON-LD — trebuie absolut */
function absUrl(u){
  if (!u) return `${ORIGIN}/content/preview.jpg`;
  if (/^https?:\/\//i.test(u)) return u;
  return `${ORIGIN}/${u.replace(/^\/+/,'')}`;      // images/x.jpg -> https://site.ro/images/x.jpg
}

// ===================== HTML produs =====================
function pageTemplate(prod){
    const brand='Boundless Collection';
    const title = esc(prod.title||'');
    const desc  = esc(prod.desc || title);
    const price = Number(prod.price||0).toFixed(2)+' RON';
  
    // imaginea OG absolută (prima)
    const firstImg = (prod.images && prod.images[0]) || '/content/preview.jpg';
    const ogImgAbs = absUrl(firstImg);
    const url      = `${ORIGIN}/p/${prod.slug}.html`;
  
    // imagini pentru galerie (relative față de /p/)
    const relImgs = (prod.images||[]).map(toRelForPage);
    const imgsForLD = (prod.images||[]).map(absUrl);
  
    // link WhatsApp precompletat
    const waText = encodeURIComponent(`Bună! Aș dori detalii despre: ${title} (${url})`);
    const waLink = `https://wa.me/40706617724?text=${waText}`;
  
    return `<!doctype html>
  <html lang="ro">
  <head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} – ${brand}</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="${url}">
  
  <!-- Open Graph / Twitter -->
  <meta property="og:type" content="product">
  <meta property="og:title" content="${title} – ${brand}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${ogImgAbs}">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title} – ${brand}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${ogImgAbs}">
  
  <!-- JSON-LD Product -->
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Product",
   "name":"${title}",
   "image":${JSON.stringify(imgsForLD)},
   "description":"${desc}",
   "brand":{"@type":"Brand","name":"${brand}"},
   "offers":{"@type":"Offer","priceCurrency":"RON","price":"${Number(prod.price||0).toFixed(2)}",
   "availability":"https://schema.org/InStock","url":"${url}"}}
  </script>
  
  <link rel="stylesheet" href="../style.css">
  </head>
  <body>
  <header class="header">
    <nav class="nav">
      <a href="/" class="logo">${brand}</a>
      <a class="btn btn-light back-link" href="/">← Înapoi la catalog</a>
    </nav>
  </header>
  
  <main class="container product-page">
    <nav class="crumbs">
      <a href="/">Acasă</a>
      <span aria-hidden="true">›</span>
      ${prod.category ? `<a href="/#${esc(prod.category)}">${esc(prod.category)}</a><span aria-hidden="true">›</span>` : ''}
      <span class="current">${title}</span>
    </nav>
  
    <article class="product-card">
      <header class="product-head">
        <h1 class="product-title">${title}</h1>
        <span class="price-badge">${price}</span>
      </header>
  
      <section class="product-hero">
        <figure class="gallery">
          <div class="gallery-main">
            <img id="mainImg" src="${relImgs[0] || '/content/preview.jpg'}" alt="${title}" loading="eager">
          </div>
          ${relImgs.length > 1 ? `
          <div class="thumbs">
            ${relImgs.map((src,i)=>`
              <button class="thumb" data-src="${src}" aria-label="Imagine ${i+1}">
                <img src="${src}" alt="${title} – miniatura ${i+1}" loading="lazy">
              </button>`).join('')}
          </div>` : ``}
        </figure>
  
        <div class="product-info">
          <p class="lead">${desc}</p>
  
          ${ (prod.tags && prod.tags.length)
            ? `<ul class="tags">
                 ${prod.tags.map(t=>`<li>${esc(t)}</li>`).join('')}
               </ul>`
            : `` }
  
          <div class="actions">
            <a class="btn btn-light" href="/" onclick="event.preventDefault(); history.back()">⟵ Înapoi</a>
            <a class="btn btn-primary" href="${waLink}" target="_blank" rel="noopener">✉️ Scrie-ne pe WhatsApp</a>
          </div>
        </div>
      </section>
    </article>
  </main>
  
  <footer class="footer">
    <small>© <span id="year"></span> ${brand}</small>
  </footer>
  
  <script>
    // anul din footer
    document.getElementById('year').textContent=new Date().getFullYear();
  
    // schimbă imaginea principală la click pe thumbnail
    const mainImg = document.getElementById('mainImg');
    document.querySelectorAll('.thumb').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const src = btn.getAttribute('data-src');
        if (src) mainImg.src = src;
        // stări active vizuale
        document.querySelectorAll('.thumb').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  </script>
  </body>
  </html>`;
  }
  

// ===================== Build principal =====================
function main(){
  if (!fs.existsSync(CSV_FILE)){
    console.error('❌ Lipsește content/products.csv');
    process.exit(1);
  }

  const rows = parseCSV(fs.readFileSync(CSV_FILE, 'utf8'));

  const products = rows.map(r => {
    const id   = r.id && r.id.trim() ? r.id.trim() : crypto.randomUUID();
    const slug = slugify(`${r.title || ''}-${id.slice(0,8)}`);

    // Imagini: din CSV ca “images/x.jpg|images/y.jpg” (fără slash inițial)
    const images = (r.images || '')
      .split('|')
      .map(s => s.trim())
      .filter(Boolean);

    const tags = (r.tags || '')
      .split('|')
      .map(s => s.trim())
      .filter(Boolean);

    return {
      id,
      title:    r.title || '',
      price:    Number(r.price || 0),
      category: r.category || '',
      desc:     r.desc || '',
      images,
      tags,
      slug
    };
  });

  // 1) JSON
  fs.writeFileSync(JSON_OUT, JSON.stringify(products, null, 2), 'utf8');

  // 2) Pagini produs
  if (!fs.existsSync(PAGES_DIR)) fs.mkdirSync(PAGES_DIR, { recursive: true });
  products.forEach(p => {
    fs.writeFileSync(path.join(PAGES_DIR, `${p.slug}.html`), pageTemplate(p), 'utf8');
  });

  // 3) Sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${ORIGIN}/</loc></url>
  ${products.map(p => `  <url><loc>${ORIGIN}/p/${p.slug}.html</loc></url>`).join('\n')}
</urlset>`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');

  console.log(`\n✔ ${products.length} produse -> JSON + pagini + sitemap`);
  console.log(`✔ ORIGIN: ${ORIGIN}\n`);
}

main();
