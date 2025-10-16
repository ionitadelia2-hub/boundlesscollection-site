// build.js — produce /public cu tot site-ul (catalog + pagini produs + sitemap)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT     = __dirname;
const OUT      = path.join(ROOT, 'public');        // <- folderul de ieșire pentru Vercel
const CSV_FILE = path.join(ROOT, 'content', 'products.csv');
const JSON_OUT = path.join(ROOT, 'content', 'products.json'); // sursă, apoi copiem în OUT
// după fs.writeFileSync(JSON_OUT, ...);
copyFileSync(JSON_OUT, path.join(OUT, 'products.json')); // <- bonus: /products.json


const ORIGIN = (process.env.SITE_ORIGIN || 'https://boundlesscollection.ro').replace(/\/+$/, '');

// ---------- utilitare fs ----------
function rimrafSync(p) {
  if (!fs.existsSync(p)) return;
  for (const entry of fs.readdirSync(p)) {
    const cur = path.join(p, entry);
    const st = fs.lstatSync(cur);
    if (st.isDirectory()) rimrafSync(cur);
    else fs.unlinkSync(cur);
  }
  fs.rmdirSync(p);
}
function ensureDir(p){ fs.mkdirSync(p, { recursive: true }); }
function copyFileSync(src, dest){
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}
function copyDirSync(src, dest){
  if (!fs.existsSync(src)) return;
  for (const entry of fs.readdirSync(src)){
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const st = fs.lstatSync(s);
    if (st.isDirectory()) copyDirSync(s, d);
    else copyFileSync(s, d);
  }
}

// ---------- helpers ----------
function slugify(str){
  return (str||'').toString().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9\s-]/gi,'')
    .trim().replace(/\s+/g,'-').replace(/-+/g,'-').toLowerCase();
}
function esc(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function absUrl(u){ if (!u) return ORIGIN; if (/^https?:\/\//i.test(u)) return u; return `${ORIGIN}${u.startsWith('/')?'':'/'}${u}`; }
function normImgPath(u){ if (!u) return ''; if (/^https?:\/\//i.test(u)) return u; return u.startsWith('/')?u:`/${u}`; }
function toRelForPage(u){ if (!u) return ''; if (/^https?:\/\//i.test(u)) return u; if (u.startsWith('/')) return u; return `/${u.replace(/^\.?\//,'')}`; }
function toAbsForMeta(u){ if (!u) return `${ORIGIN}/content/preview.jpg`; if (/^https?:\/\//i.test(u)) return u; if (u.startsWith('/')) return `${ORIGIN}${u}`; return `${ORIGIN}/${u.replace(/^\.?\//,'')}`; }

// ---------- template pagină produs ----------
function pageTemplate(prod){
  const brand = 'Boundless Collection';
  const title = esc(prod.title||'');
  const desc  = esc(prod.desc || title);
  const price = Number(prod.price||0).toFixed(2) + ' RON';

  const relImgs = (prod.images || []).map(toRelForPage);
  const ogImg   = toAbsForMeta((prod.images || [])[0]);
  const url     = `${ORIGIN}/p/${prod.slug}.html`;
  const imagesAbs = (prod.images||[]).map(toAbsForMeta);

  // link WhatsApp cu numele produsului
  const waMsg  = encodeURIComponent(`Bună! Mă interesează produsul: ${prod.title} (${url})`);
  const waLink = `https://wa.me/40706611774?text=${waMsg}`;

  return `<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} – ${brand}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">

<meta property="og:type" content="product">
<meta property="og:title" content="${title} – ${brand}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${ogImg}">
<meta property="og:url" content="${url}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title} – ${brand}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${ogImg}">

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Product",
 "name":"${title}",
 "image":${JSON.stringify(imagesAbs)},
 "description":"${desc}",
 "brand":{"@type":"Brand","name":"${brand}"},
 "offers":{"@type":"Offer","priceCurrency":"RON","price":"${Number(prod.price||0).toFixed(2)}",
 "availability":"https://schema.org/InStock","url":"${url}"}}
</script>

<link rel="stylesheet" href="/style.css">
</head>
<body>
<header class="header">
  <nav class="nav">
    <a href="/" class="logo">
      <img src="/images/logo.png" alt="" class="brand-logo" onerror="this.style.display='none'">
      <span class="brand-text">Boundless Collection</span>
    </a>
    <a class="btn btn-light back-link" href="/">← Înapoi la catalog</a>
  </nav>
</header>

<main class="container product-page">
  <article>
    <h1>${title}</h1>
    <div class="media">
      ${relImgs.map(src => `<img src="${src}" alt="${esc(title)}" loading="lazy">`).join('')}
    </div>

    <p class="price price-badge">${price}</p>
    <p>${desc}</p>

    <div class="tags">
      ${(prod.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}
    </div>

    <div class="actions">
      <a class="btn" href="/" onclick="event.preventDefault(); history.back()">Înapoi</a>
      <a class="btn btn-primary" href="${waLink}" target="_blank" rel="noopener">
        <svg class="wa-ico" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M19.11 17.38c-.29-.15-1.72-.85-1.99-.95-.27-.1-.47-.15-.67.15-.2.29-.77.95-.94 1.14-.17.2-.35.22-.64.08-.29-.15-1.24-.46-2.36-1.48-.87-.77-1.45-1.73-1.62-2.02-.17-.29-.02-.45.13-.6.14-.14.29-.35.44-.52.15-.17.2-.29.3-.49.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.49-.67-.5-.17-.01-.37-.01-.57-.01s-.52.07-.79.37c-.27.29-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.11 3.23 5.1 4.53.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.72-.7 1.96-1.38.24-.68.24-1.26.17-1.38-.07-.12-.26-.2-.55-.35zM16.01 4c-6.62 0-12 5.31-12 11.85 0 2.09.55 4.04 1.52 5.74L4 28l6.61-2.09c1.63.89 3.5 1.41 5.49 1.41 6.62 0 12-5.31 12-11.85S22.63 4 16.01 4zm0 21.42c-1.8 0-3.46-.52-4.86-1.41l-.35-.22-3.92 1.24 1.28-3.78-.23-.38c-.92-1.52-1.45-3.3-1.45-5.22 0-5.48 4.5-9.93 10.04-9.93 5.54 0 10.04 4.45 10.04 9.93 0 5.48-4.5 9.93-10.04 9.93z" fill="currentColor"/>
        </svg>
        Scrie-ne pe WhatsApp
      </a>
    </div>
  </article>
</main>

<footer class="footer"><small>© <span id="year"></span> ${brand}</small></footer>
<script>document.getElementById('year').textContent=new Date().getFullYear()</script>
</body></html>`;
}

// ---------- build ----------
function parseCSV(text){
  const lines = text.split(/\r?\n/).filter(l=>l.trim().length);
  if (!lines.length) return [];
  const split = (line)=>{
    const out=[]; let cur='', q=false;
    for (let i=0;i<line.length;i++){
      const ch=line[i];
      if (ch==='"'){ if(q && line[i+1]==='"'){cur+='"'; i++;} else q=!q; }
      else if(ch===',' && !q){ out.push(cur); cur=''; }
      else cur+=ch;
    }
    out.push(cur); return out.map(v=>v.trim());
  };
  const header = split(lines[0]).map(h=>h.trim());
  return lines.slice(1).map(line=>{
    const cols = split(line); const row={};
    header.forEach((h,i)=> row[h] = (cols[i]||'').trim());
    return row;
  });
}

function main(){
  if (!fs.existsSync(CSV_FILE)){ console.error('❌ Lipsește content/products.csv'); process.exit(1); }

  // curăț OUT/public
  if (fs.existsSync(OUT)) rimrafSync(OUT);
  ensureDir(OUT);

  const rows = parseCSV(fs.readFileSync(CSV_FILE,'utf8'));
  const products = rows.map(r=>{
    const id = r.id || crypto.randomUUID();
    const slug = slugify(`${r.title||''}-${id.slice(0,8)}`);
    const images = (r.images||'').split('|').map(s=>s.trim()).filter(Boolean).map(normImgPath);
    const tags = (r.tags||'').split('|').map(s=>s.trim()).filter(Boolean);
    return { id, title:r.title||'', price:Number(r.price||0), category:r.category||'', desc:r.desc||'', images, tags, slug };
  });

  // 1) scriu JSON sursă
  fs.writeFileSync(JSON_OUT, JSON.stringify(products,null,2),'utf8');

  // 2) copiez fișiere în OUT/public
  //   - rădăcina (toate .html, .css, .js, robots.txt etc.)
  for (const entry of fs.readdirSync(ROOT)){
    if (['node_modules','public','.git','.vercel'].includes(entry)) continue;
    const s = path.join(ROOT, entry);
    const st = fs.lstatSync(s);
    if (st.isFile() && /\.(html|css|js|txt|ico|png|svg|webmanifest|json)$/i.test(entry)){
      copyFileSync(s, path.join(OUT, entry));
    }
  }
  //   - directoare necesare
  copyDirSync(path.join(ROOT,'images'),  path.join(OUT,'images'));
  copyDirSync(path.join(ROOT,'content'), path.join(OUT,'content'));

  // 3) paginile produs /public/p/*.html
  const PAGES_DIR = path.join(OUT,'p');
  ensureDir(PAGES_DIR);
  products.forEach(p=>{
    fs.writeFileSync(path.join(PAGES_DIR, `${p.slug}.html`), pageTemplate(p),'utf8');
  });

  // 4) sitemap în OUT/public
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${ORIGIN}/</loc></url>
  ${products.map(p=>`<url><loc>${ORIGIN}/p/${p.slug}.html</loc></url>`).join('\n  ')}
</urlset>`;
  fs.writeFileSync(path.join(OUT,'sitemap.xml'), sitemap,'utf8');

  console.log(`\n✔ ${products.length} produs(e) -> JSON + pagini + sitemap`);
  console.log(`✔ ORIGIN: ${ORIGIN}`);
  console.log(`✔ Output: ${OUT}\n`);
}

main();

// după ce scrii JSON_OUT
fs.writeFileSync(JSON_OUT, JSON.stringify(products, null, 2), 'utf8');
// 👉 publică-l și ca /products.json
copyFileSync(JSON_OUT, path.join(OUT, 'products.json'));
