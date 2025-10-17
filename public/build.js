// build.js — generează site-ul static în /public din content/products.csv
// Node >= 18, fără dependențe externe

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;                        // rădăcina repo-ului
const OUT  = path.join(ROOT, "public");        // directorul servit de hosting (web root)

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

// Transformă o cale relativă de imagine în root-absolute (pentru web root)
/** ex: "images/poza.jpg" -> "/images/poza.jpg" */
const toRootAbs = (u) => {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  return "/" + String(u).replace(/^\/+/, "");
};

// Pentru meta absolute (cu ORIGIN)
const toAbsForMeta = (u) => {
  if (!u) return `${ORIGIN}/content/preview.jpg`;
  if (/^https?:\/\//i.test(u)) return u;
  return `${ORIGIN}/${String(u).replace(/^\/+/, "")}`;
};

// Generează tag <link rel="stylesheet"...> doar dacă fișierul există în sursă
const cssTagIfExists = (filename) => {
  if (exists(ROOT, filename)) return `<link rel="stylesheet" href="/${filename}">`;
  return "";
};
// Generează tag <script ...> doar dacă fișierul există în sursă
const jsTagIfExists  = (filename) => {
  if (exists(ROOT, filename)) return `<script defer src="/${filename}"></script>`;
  return "";
};

// ---------------- template pagină produs ----------------
function pageTemplate(prod) {
  const brand = "Boundless Collection";
  const title = esc(prod.title || "");
  const desc  = esc(prod.desc || title);
  const price = Number(prod.price || 0).toFixed(2) + " RON";

  // imaginile din CSV (relative) -> root-absolute pentru web
  const relImgs = (prod.images || []).map(toRootAbs);
  const imagesAbsForMeta = (prod.images || []).map(toAbsForMeta);
  const ogImg = imagesAbsForMeta[0] || `${ORIGIN}/content/preview.jpg`;

  const url = `${ORIGIN}/p/${prod.slug}.html`;

  const waMsg  = encodeURIComponent(`Bună! Mă interesează produsul: ${prod.title} (${url})`);
  const waLink = `https://wa.me/40760617724?text=${waMsg}`;

  // favicon preferat (dacă nu există, browserul îl ignoră)
  const faviconPng = exists(ROOT, "images", "Delia.png") ? `/images/Delia.png` : "";
  const faviconIco = exists(ROOT, "images", "Delia.ico") ? `/images/Delia.ico` : "";
  const brandAvatar = exists(ROOT, "images", "delia-avatar.png") ? `/images/delia-avatar.png` : "";

  // CSS: întâi global, apoi layout produs, apoi override-uri (dacă există)
  const cssGlobal   = cssTagIfExists("style.css");
  const cssGallery  = cssTagIfExists("gallery.css");       // layout / slider
  const cssProduct  = cssTagIfExists("product-page.css");  // opțional override

  // JS necesar
  /*const jsGlobal    = jsTagIfExists("script.js");*/
  const jsGallery   = jsTagIfExists("gallery.js");         // logică slider
  const jsProduct   = jsTagIfExists("product.js");         // rander/alte interacțiuni

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

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Poppins:wght@300;400;600&display=swap" rel="stylesheet">

  <!-- CSS -->
  ${cssGlobal}
  ${cssGallery}
  ${cssProduct}
</head>
<body>
<header class="header">
  <nav class="nav">
    <a href="/" class="logo" aria-label="Înapoi la pagina principală">
      ${brandAvatar ? `<img src="${brandAvatar}" alt="" class="brand-logo" onerror="this.style.display='none'">` : ""}
      <span class="brand-text">Boundless Collection</span>
    </a>
    <a class="btn btn-light back-link" href="/" onclick="event.preventDefault(); history.back()">← Înapoi la catalog</a>
  </nav>
</header>

<main class="container product-page">
  <section class="product-hero">

    <!-- GALERIE: stânga -->
    <div class="hero-media">
      <section class="bc-gallery" data-autoplay="3500" tabindex="0" aria-label="Galerie produs">
        <div class="bc-viewport">
          <div class="bc-track">
            ${relImgs.map((src, i) => `
              <figure class="bc-slide">
                <img src="${src}" alt="${esc(title)} – imagine ${i + 1}" loading="${i ? "lazy" : "eager"}">
              </figure>
            `).join("")}
          </div>
          ${relImgs.length > 1 ? `<button class="bc-nav bc-prev">‹</button><button class="bc-nav bc-next">›</button>` : ""}
        </div>
        ${relImgs.length > 1 ? `
        <div class="bc-thumbs">
          <div class="bc-thumbs-row">
            ${relImgs.map((src, i) => `
              <button class="bc-thumb ${i===0 ? "is-active" : ""}">
                <img src="${src}" alt="${esc(title)} thumb ${i + 1}" loading="lazy">
              </button>
            `).join("")}
          </div>
        </div>` : ""}
      </section>
    </div>

    <!-- TEXT: dreapta -->
    <div class="hero-text">
      <h1 class="product-title">${title}</h1>
      <p class="product-desc">${desc}</p>
      <p class="price price-badge">${price}</p>

      <div class="tags">
        ${(prod.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join("")}
      </div>

      <div class="actions">
        <a class="btn" href="/" onclick="event.preventDefault(); history.back()">← Înapoi</a>
        <a class="btn btn-primary" href="https://wa.me/40760617724?text=${encodeURIComponent(`Bună! Mă interesează produsul: ${prod.title} (${url})`)}" target="_blank" rel="noopener">Scrie-ne pe WhatsApp</a>
      </div>
    </div>

  </section>
</main>

<footer class="footer">
  <small>© <span id="year"></span> ${brand}</small>
</footer>
<script>document.getElementById('year').textContent = new Date().getFullYear();</script>

<!-- JS (doar ce există) -->
${jsGallery}
${jsProduct}
</body>
</html>`;
}

// ---------------- CSV parser simplu ----------------
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length);
  if (!lines.length) return [];
  const split = (line) => {
    const out = [];
    let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') { cur += '"'; i++; }
        else q = !q;
      } else if (ch === "," && !q) {
        out.push(cur); cur = "";
      } else cur += ch;
    }
    out.push(cur);
    return out.map(v => v.trim());
  };
  const header = split(lines[0]).map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = split(line);
    const row = {};
    header.forEach((h, i) => row[h] = (cols[i] || "").trim());
    return row;
  });
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
    const id  = r.id || crypto.randomUUID();
    const slug = slugify(`${r.title || ""}-${id.slice(0, 8)}`);

    const images = (r.images || "")
      .split("|").map(s => s.trim()).filter(Boolean)
      .map(toRootAbs);  // => "/images/.."

    const tags = (r.tags || "")
      .split("|").map(s => s.trim()).filter(Boolean);

    return {
      id,
      title: r.title || "",
      price: Number(r.price || 0),
      category: r.category || "",
      desc: r.desc || "",
      images,
      tags,
      slug
    };
  });

  // 2) scriu JSON sursă + copii publice
  ensureDir(path.dirname(JSON_OUT));
  fs.writeFileSync(JSON_OUT, JSON.stringify(products, null, 2), "utf8");
  copyFileSync(JSON_OUT, path.join(OUT, "products.json"));
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

  // 4) directoare de media/content
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

  console.log(`\n✔ ${products.length} produs(e) -> JSON + pagini + sitemap`);
  console.log(`✔ ORIGIN: ${ORIGIN}`);
  console.log(`✔ Output: ${OUT}\n`);
}

main();
