// build.js — generează site-ul static în /public din content/products.csv
// Node >= 18, fără dependențe externe

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;                         // rădăcina repo-ului
const OUT  = path.join(ROOT, "public");         // directorul servit de hosting (web root)

const CSV_FILE  = path.join(ROOT, "content", "products.csv");
const JSON_OUT  = path.join(ROOT, "content", "products.json");

const ORIGIN = (process.env.SITE_ORIGIN || "https://boundlesscollection.ro").replace(/\/+$/, "");

// ---------------- fs utils ----------------
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
function ensureDir(p)     { fs.mkdirSync(p, { recursive: true }); }
function copyFileSync(s,d){ ensureDir(path.dirname(d)); fs.copyFileSync(s,d); }
function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const st = fs.lstatSync(s);
    if (st.isDirectory()) copyDirSync(s, d);
    else copyFileSync(s, d);
  }
}
const exists = (...parts) => fs.existsSync(path.join(...parts));

// ---------------- helpers ----------------
const slugify = (str) => (str || "")
  .toString()
  .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9\s-]/gi, "")
  .trim().replace(/\s+/g, "-").replace(/-+/g, "-")
  .toLowerCase();

const esc = (s) => (s || "").replace(/[&<>"']/g, c => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));

// root-absolute pentru servire web
const toRootAbs = (u) => {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u.replace(ORIGIN, ""); // normalizează spre root
  return "/" + String(u).replace(/^\/+/, "");
};
// absolute (cu ORIGIN) pentru meta / feed
const toAbs = (u) => {
  if (!u) return `${ORIGIN}/content/preview.jpg`;
  if (/^https?:\/\//i.test(u)) return u;
  return `${ORIGIN}/${String(u).replace(/^\/+/, "")}`;
};

const cssTagIfExists = (filename) => exists(ROOT, filename)
  ? `<link rel="stylesheet" href="/${filename}">`
  : "";
const jsTagIfExists  = (filename) => exists(ROOT, filename)
  ? `<script defer src="/${filename}"></script>`
  : "";

// ---- map categorii pentru breadcrumbs ----
const CATEGORY_MAP = {
  "invitatii": { name: "Invitații", url: "/invitatii.html" },
  "plicuri": { name: "Plicuri de dar", url: "/plicuri.html" },
  "meniuri": { name: "Meniuri", url: "/meniuri.html" },
  "aranjamente-florale": { name: "Aranjamente florale", url: "/aranjamente-florale.html" },
  "seturi": { name: "Seturi", url: "/seturi.html" },
  "marturii soia": { name: "Mărturii", url: "/marturii.html" }
};

// ---------------- template pagină produs ----------------
function pageTemplate(prod) {
  const brand = "Boundless Collection";
  const title = esc(prod.title || "");
  const desc  = esc(prod.desc || title);
  const priceStr = Number(prod.price || 0).toFixed(2);
  const price = priceStr + " RON";

  const relImgs = (prod.images || []).map(toRootAbs);
  const imagesAbsForMeta = (prod.images || []).map(toAbs);
  const ogImg = imagesAbsForMeta[0] || `${ORIGIN}/content/preview.jpg`;
  const firstImg = relImgs[0] || "/content/preview.jpg";

  const url = `${ORIGIN}/p/${prod.slug}.html`;

  const waMsg  = encodeURIComponent(`Bună! Mă interesează produsul: ${prod.title} (${url})`);
  const waLink = `https://wa.me/40760617724?text=${waMsg}`;

  const faviconPng  = exists(ROOT, "images", "delia-avatar.png") ? `/images/delia-avatar.png` : "";
  const faviconIco  = exists(ROOT, "images", "delia-avatar.png") ? `/images/delia-avatar.png` : "";
  const brandAvatar = exists(ROOT, "images", "delia-avatar.png") ? `/images/delia-avatar.png` : "";

  const cssGlobal  = cssTagIfExists("style.css");
  const cssGallery = cssTagIfExists("gallery.css");
  const cssProduct = cssTagIfExists("product-page.css");

  const jsGlobal   = jsTagIfExists("script.js");
  const jsGallery  = ""; // jsTagIfExists("gallery.js");
  const jsProduct  = ""; // jsTagIfExists("product.js");

  // -------- JSON-LD: Product + BreadcrumbList --------
  const priceValidUntil = new Date(new Date().getFullYear() + 1, 11, 31)
    .toISOString().slice(0, 10);

  const bc = CATEGORY_MAP[prod.product_type || prod.category] || { name: "Produse", url: "/index.html#produse" };

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: prod.title || "",
    description: prod.desc || prod.title || "",
    image: imagesAbsForMeta,
    brand: { "@type": "Brand", name: brand },
    category: prod.category || "",
    sku: prod.id,
    mpn: prod.mpn || prod.id,
    ...(prod.material ? { material: prod.material } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "RON",
      price: priceStr,
      priceValidUntil,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: brand },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        applicableCountry: "RO",
        returnMethod: "https://schema.org/Mail"
      }
    }
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Acasă", item: `${ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: bc.name, item: `${ORIGIN}${bc.url}` },
      { "@type": "ListItem", position: 3, name: prod.title || "", item: url }
    ]
  };

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
  ${faviconPng ? `<link rel="icon" type="image/png" href="${faviconPng}">` : ""}
  ${faviconIco ? `<link rel="icon" type="image/x-icon" href="${faviconIco}">` : ""}

  <script type="application/ld+json">${JSON.stringify(productLd)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Poppins:wght@300;400;600&display=swap" rel="stylesheet">
  ${cssGlobal}${cssGallery}${cssProduct}
  <style>
    .single-media{ width:100%; max-width:720px; margin:0 auto; }
    .single-viewport{
      width:100%; aspect-ratio:1/1; background:#fff; border-radius:14px;
      box-shadow:0 6px 24px rgba(0,0,0,.06); overflow:hidden; display:grid; place-items:center;
    }
    .single-viewport img{ max-width:100%; max-height:100%; width:auto; height:auto; object-fit:contain; display:block; }
    @media (max-width:960px){ .single-media{ max-width:94%; } }
  </style>
</head>
<body>
  <header class="header">
    <div class="container nav">
      <a class="brand" href="/index.html">
        <div class="brand-logo">${brandAvatar ? `<img src="${brandAvatar}" alt="Delia – ${brand}">` : ""}</div>
        <div class="brand-title">${brand}</div>
      </a>
      <button class="nav-toggle" aria-controls="mainmenu" aria-expanded="false" aria-label="Meniu"></button>
      <nav aria-label="Meniu principal">
        <ul id="mainmenu">
          <li class="dropdown">
            <button class="dropbtn" aria-haspopup="true" aria-expanded="false">Produse</button>
            <ul class="menu" role="menu">
              <li><a href="/marturii.html">Prezentare Mărturii</a></li>
              <li><a href="/invitatii.html">Prezentare Invitații</a></li>
              <li><a href="/plicuri.html">Prezentare Plicuri de dar</a></li>
              <li><a href="/meniuri.html">Prezentare Meniuri</a></li>
              <li><a href="/numere-masa.html">Prezentare Numere de masă</a></li>
              <li><a href="/stickere-oglinda.html">Prezentare Stickere oglindă</a></li>
              <li><a href="/aranjamente-florale.html">Prezentare Aranjamente florale</a></li>
              <li><a href="/seturi.html">Prezentare Seturi</a></li>
            </ul>
          </li>
          <li><a href="/index.html">Acasă</a></li>
          <li><a href="https://www.instagram.com/marturiiboundlesscollection_" target="_blank" rel="noopener">Instagram</a></li>
          <li><a href="https://www.facebook.com/share/16TEGEfgGs/" target="_blank" rel="noopener">Facebook</a></li>
          <li><a class="cta" href="https://wa.me/40760617724" target="_blank" rel="noopener">WhatsApp</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main class="container product-page">
    <section class="product-hero">
      <div class="hero-media">
        <figure class="single-media">
          <div class="single-viewport"><img src="${firstImg}" alt="${esc(title)}" loading="eager" decoding="async"></div>
        </figure>
      </div>
      <div class="hero-text">
        <h1 class="product-title">${title}</h1>
        <p class="product-desc">${desc}</p>
        <p class="price price-badge">${price}</p>
        <div class="tags">${(prod.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        <div class="actions">
          <a class="btn" href="/index.html#produse" id="backBtn">← Înapoi</a>
          <a class="btn btn-primary" href="${waLink}" target="_blank" rel="noopener">Scrie-ne pe WhatsApp</a>
        </div>
      </div>
    </section>
  </main>

  <footer><div class="container footer-inner">
    <small>© <span id="year"></span> Delia’s Candles & Papetărie</small>
    <small>Realizat cu pasiune ✨</small>
  </div></footer>

  <script>
    document.getElementById('year').textContent = new Date().getFullYear();
    (function(){
      var ref=(document.referrer||"").toLowerCase(), back="/index.html#produse";
      if(ref.includes("/marturii")) back="/marturii.html";
      else if(ref.includes("/invitatii")) back="/invitatii.html";
      else if(ref.includes("/plicuri")) back="/plicuri.html";
      else if(ref.includes("/meniuri")) back="/meniuri.html";
      else if(ref.includes("/numere-masa")) back="/numere-masa.html";
      else if(ref.includes("/aranjamente-florale")) back="/aranjamente-florale.html";
      else if(ref.includes("/seturi")) back="/seturi.html";
      var b=document.getElementById('backBtn'); if(b) b.href=back;
    })();
    (function(){
      const btn=document.querySelector('.nav-toggle'), menu=document.querySelector('#mainmenu'),
            dd=document.querySelector('.dropdown'), ddBtn=dd?.querySelector('.dropbtn');
      if(!btn||!menu) return;
      function closeAll(){ document.body.classList.remove('menu-open'); btn.setAttribute('aria-expanded','false'); if(dd){ dd.classList.remove('open'); ddBtn?.setAttribute('aria-expanded','false'); } }
      btn.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); const open=document.body.classList.toggle('menu-open'); btn.setAttribute('aria-expanded', open?'true':'false'); if(!open&&dd){ dd.classList.remove('open'); ddBtn?.setAttribute('aria-expanded','false'); }});
      if(dd&&ddBtn){ ddBtn.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); const now=dd.classList.toggle('open'); ddBtn.setAttribute('aria-expanded', now?'true':'false'); }); menu.addEventListener('click',e=>e.stopPropagation()); }
      document.addEventListener('click', closeAll); document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeAll(); });
    })();
  </script>
  ${jsGlobal}${jsGallery}${jsProduct}
</body>
</html>`;
}

// ---------------- CSV parser simplu ----------------
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length);
  if (!lines.length) return [];
  const split = (line) => {
    const out = []; let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') { cur += '"'; i++; }
        else q = !q;
      } else if (ch === "," && !q) { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out.map(v => v.trim());
  };
  const header = split(lines[0]).map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = split(line); const row = {};
    header.forEach((h, i) => row[h] = (cols[i] || "").trim());
    return row;
  });
}

// === Export CSV compatibil Google Merchant: /public/feeds/products-merchant.csv
function csvEscape(s) {
  const v = String(s ?? "");
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}
function exportMerchantCSV(products) {
  const FEEDS_DIR = path.join(OUT, "feeds");
  ensureDir(FEEDS_DIR);

  const header = [
    "id","title","description","link","image_link",
    "price","availability","condition","brand","mpn",
    "google_product_category","product_type"
  ];
  const rows = [header];

  products.forEach(p => {
    const link = `${ORIGIN}/p/${p.slug}.html`;
    const imageAbs = toAbs((p.images && p.images[0]) ? p.images[0] : "/content/preview.jpg");
    const price = `${Number(p.price || 0).toFixed(2)} RON`;

    rows.push([
      p.id,
      p.title,
      p.desc || p.title,
      link,
      imageAbs,
      price,
      "in stock",
      "new",
      "Boundless Collection",
      p.mpn || p.id, // mpn (fallback id)
      p.google_product_category || "",
      p.product_type || p.category || ""
    ]);
  });

  const csv = rows.map(r => r.map(csvEscape).join(",")).join("\n");
  const outPath = path.join(FEEDS_DIR, "products-merchant.csv");
  fs.writeFileSync(outPath, csv, "utf8");
  console.log(`✔ Export feed: ${outPath}`);
}

// ---------------- main build ----------------
function main() {
  if (!fs.existsSync(CSV_FILE)) {
    console.error("❌ Lipsește content/products.csv");
    process.exit(1);
  }

  // curăț OUT
  if (fs.existsSync(OUT)) rimrafSync(OUT);
  ensureDir(OUT);

  // 1) CSV -> produse
  const rows = parseCSV(fs.readFileSync(CSV_FILE, "utf8"));

  const products = rows.map((r) => {
    const id    = r.id || crypto.randomUUID();
    const title = r.title || "";
    const slug  = slugify(`${title}-${id.slice(0, 8)}`);

    const images = (r.images || "")
      .split("|").map(s => s.trim()).filter(Boolean)
      .map(toRootAbs);  // => "/images/.."

    const tags = (r.tags || "")
      .split("|").map(s => s.trim()).filter(Boolean);

    // nou: citim și păstrăm google_product_category și product_type (egale cu category)
    const category = r.category || "";
    const product_type = r.product_type || category || "";
    const gpc = r.google_product_category || "";

    // opțional: material dacă există în CSV (altfel omis din JSON-LD)
    const material = r.material || "";

    return {
      id,
      title,
      price: Number(r.price || 0),
      category,
      product_type,
      desc: r.desc || "",
      images,
      tags,
      slug,
      google_product_category: gpc,
      material,
      mpn: r.mpn || "" // dacă vrei să treci MPNe reale în CSV, altfel rămâne fallback la id
    };
  });

  // 2) scriu JSON sursă + copie publică
  ensureDir(path.dirname(JSON_OUT));
  fs.writeFileSync(JSON_OUT, JSON.stringify(products, null, 2), "utf8");
  copyFileSync(JSON_OUT, path.join(OUT, "content", "products.json"));

  // 3) copiere fișiere statice (din rădăcină => OUT)
  for (const entry of fs.readdirSync(ROOT)) {
    if (["node_modules", "public", ".git", ".vercel"].includes(entry)) continue;
    const s = path.join(ROOT, entry);
    const st = fs.lstatSync(s);
    if (st.isFile() && /\.(html|css|js|txt|ico|png|svg|webmanifest|json|xml)$/i.test(entry)) {
      copyFileSync(s, path.join(OUT, entry));
    }
  }

  // 4) directoare media/content
  copyDirSync(path.join(ROOT, "images"),  path.join(OUT, "images"));
  copyDirSync(path.join(ROOT, "content"), path.join(OUT, "content"));

  // 5) pagini de produs /public/p/*.html
  const PAGES_DIR = path.join(OUT, "p");
  ensureDir(PAGES_DIR);
  products.forEach((p) => {
    fs.writeFileSync(path.join(PAGES_DIR, `${p.slug}.html`), pageTemplate(p), "utf8");
  });

  // 6) sitemap simplu
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${ORIGIN}/</loc></url>
  ${products.map(p => `<url><loc>${ORIGIN}/p/${p.slug}.html</loc></url>`).join("\n  ")}
</urlset>`;
  fs.writeFileSync(path.join(OUT, "sitemap.xml"), sitemap, "utf8");

  // 7) feed Merchant (include google_product_category + product_type + mpn)
  console.log("DEBUG: export Merchant – produse:", products.length);
  exportMerchantCSV(products);

  console.log(`\n✔ ${products.length} produs(e) -> JSON + pagini + sitemap + feed Merchant`);
  console.log(`✔ ORIGIN: ${ORIGIN}`);
  console.log(`✔ Output: ${OUT}\n`);
}

main();
