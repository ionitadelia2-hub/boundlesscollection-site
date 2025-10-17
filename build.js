// build.js — generează site-ul static în /public din content/products.csv
// Node >=18 (fără dependențe externe)

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const OUT = path.join(ROOT, "public");                  // director ieșire (Vercel Output)
const CSV_FILE = path.join(ROOT, "content", "products.csv");
const JSON_OUT = path.join(ROOT, "content", "products.json");

const ORIGIN = (process.env.SITE_ORIGIN || "https://boundlesscollection.ro")
  .replace(/\/+$/, "");

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
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function copyFileSync(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}
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

const toRelForPage = (u) => {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/")) return u;
  return "/" + u.replace(/^\.?\//, "");
};
const toAbsForMeta = (u) => {
  if (!u) return `${ORIGIN}/content/preview.jpg`;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/")) return `${ORIGIN}${u}`;
  return `${ORIGIN}/${u.replace(/^\.?\//, "")}`;
};

// ---------------- template pagină produs ----------------
function pageTemplate(prod) {
  const brand = "Boundless Collection";
  const title = esc(prod.title || "");
  const desc = esc(prod.desc || title);
  const price = Number(prod.price || 0).toFixed(2) + " RON";
  const relImgs = (prod.images || []).map(toRelForPage);
  const ogImg = toAbsForMeta((prod.images || [])[0]);
  const url = `${ORIGIN}/p/${prod.slug}.html`;
  const imagesAbs = (prod.images || []).map(toAbsForMeta);

  const waMsg = encodeURIComponent(`Bună! Mă interesează produsul: ${prod.title} (${url})`);
  const waLink = `https://wa.me/40760617724?text=${waMsg}`;

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
 "offers":{"@type":"Offer","priceCurrency":"RON","price":"${Number(prod.price||0).toFixed(2)}","availability":"https://schema.org/InStock","url":"${url}"}}
</script>
<link rel="stylesheet" href="/style.css">
<link rel="stylesheet" href="/gallery.css"><!-- nou: stil slider -->
<link rel="stylesheet" href="/product-page.css"><!-- override pagină produs -->
</head>
<body>
<header class="header">
  <nav class="nav">
    <a href="/" class="logo">
      <img src="/images/logo.png" alt="" class="brand-logo" onerror="this.style.display='none'">
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
                <img src="${src}" alt="${esc(title)} – imagine ${i+1}" loading="${i ? "lazy" : "eager"}">
              </figure>
            `).join("")}
          </div>
          <button class="bc-nav bc-prev">‹</button>
          <button class="bc-nav bc-next">›</button>
        </div>
        ${relImgs.length > 1 ? `
        <div class="bc-thumbs">
          <div class="bc-thumbs-row">
            ${relImgs.map((src, i) => `
              <button class="bc-thumb ${i===0?"is-active":""}">
                <img src="${src}" alt="${esc(title)} thumb ${i+1}" loading="lazy">
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
        ${(prod.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join("")}
      </div>

      <div class="actions">
        <a class="btn" href="/" onclick="event.preventDefault(); history.back()">← Înapoi</a>
        <a class="btn btn-primary" href="${waLink}" target="_blank" rel="noopener">Scrie-ne pe WhatsApp</a>
      </div>
    </div>

  </section>
</main>


<footer class="footer"><small>© <span id="year"></span> ${brand}</small></footer>
<script>document.getElementById('year').textContent=new Date().getFullYear()</script>
<script defer src="/gallery.js"></script><!-- nou: logică slider -->
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

  // 1) CSV -> obiecte produse
  const rows = parseCSV(fs.readFileSync(CSV_FILE, "utf8"));

  const products = rows.map((r) => {
    const id = r.id || crypto.randomUUID();
    const slug = slugify(`${r.title || ""}-${id.slice(0, 8)}`);
    const images = (r.images || "")
      .split("|")
      .map(s => s.trim())
      .filter(Boolean)
      .map(toRelForPage); // -> /images/...

    const tags = (r.tags || "")
      .split("|")
      .map(s => s.trim())
      .filter(Boolean);

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

  // 2) scriu JSON sursă în /content și îl public și în /public
  ensureDir(path.dirname(JSON_OUT));
  fs.writeFileSync(JSON_OUT, JSON.stringify(products, null, 2), "utf8");
  copyFileSync(JSON_OUT, path.join(OUT, "products.json"));             // /products.json
  copyFileSync(JSON_OUT, path.join(OUT, "content", "products.json"));  // /content/products.json

  // 3) copiere fișiere statice din rădăcină (inclusiv *.json)
  for (const entry of fs.readdirSync(ROOT)) {
    if (["node_modules", "public", ".git", ".vercel"].includes(entry)) continue;
    const s = path.join(ROOT, entry);
    const st = fs.lstatSync(s);
    if (st.isFile() && /\.(html|css|js|txt|ico|png|svg|webmanifest|json)$/i.test(entry)) {
      copyFileSync(s, path.join(OUT, entry));
    }
  }

  // 4) directoare
  copyDirSync(path.join(ROOT, "images"), path.join(OUT, "images"));
  copyDirSync(path.join(ROOT, "content"), path.join(OUT, "content"));

  // 5) pagini produs: /public/p/*.html
  const PAGES_DIR = path.join(OUT, "p");
  ensureDir(PAGES_DIR);
  products.forEach((p) => {
    fs.writeFileSync(path.join(PAGES_DIR, `${p.slug}.html`), pageTemplate(p), "utf8");
  });

  // 6) sitemap în /public
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
