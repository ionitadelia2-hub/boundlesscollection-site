// product.js – pagină produs (slug/id) – Vercel ready (multi-image robust)

(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const fmt = (n) => (Math.round(Number(n || 0) * 100) / 100).toFixed(2);

  // normalizări (identice ca în script.js)
  const norm = (s) =>
    (s || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const slugify = (s) =>
    norm(s)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
      .slice(0, 80);

  // ===== images helpers (acceptă string sau array)
  function parseImages(images) {
    // Acceptă: array sau string "a.jpg|b.jpg" / "a.jpg;b.jpg" / "a.jpg, b.jpg"
    if (Array.isArray(images)) return images.map(String).map((x) => x.trim()).filter(Boolean);

    if (typeof images === "string") {
      const s = images.trim();
      if (!s) return [];
      return s
        .split(/[|;,]/g)
        .map((x) => x.trim())
        .filter(Boolean);
    }

    return [];
  }

  function normalizeImgPath(src) {
    // transformă "images/.." în "/images/.." și curăță "./"
    if (!src) return "";
    const clean = src.toString().trim().replace(/^\.?\//, "");
    return "/" + clean;
  }

  // ========== extrage cheie din URL: /produs/<slug> sau ?slug= / ?id=
  function getKeyFromUrl() {
    const path = location.pathname.replace(/\/+$/, "");
    const m = path.match(/\/produs\/([^/]+)$/);
    if (m) return decodeURIComponent(m[1]);
    const u = new URL(location.href);
    return u.searchParams.get("slug") || u.searchParams.get("id") || "";
  }

  // ========== UI helpers
  function renderNotFound(msg = "Produs indisponibil") {
    const root = $("#product-root");
    if (!root) return;

    root.innerHTML = `
      <h1>${msg}</h1>
      <p>Produsul nu a fost specificat sau nu există.</p>
      <a class="btn btn-light" href="/">⇠ Înapoi la catalog</a>
    `;

    document.title = `Produs indisponibil • Boundless Collection`;
  }

  function updateOG(p, firstImage) {
    document.title = `${p.title} • Boundless Collection`;

    const set = (sel, val) => {
      const el = document.querySelector(sel);
      if (el) el.setAttribute("content", val);
    };

    set('meta[property="og:title"]', p.title);
    set('meta[property="og:description"]', p.desc || p.category || "Detalii produs");

    // pentru share e mai sigur full URL
    if (firstImage) {
      const abs = new URL(firstImage, location.origin).href;
      set('meta[property="og:image"]', abs);
      set('meta[name="twitter:image"]', abs);
    }

    set('meta[property="og:url"]', location.href);
  }

  function renderProduct(p) {
    const root = $("#product-root");
    if (!root) return;

    // normalizează imaginile (acceptă string sau array)
    const imgs = parseImages(p.images);
    const relImgs = (imgs.length ? imgs : ["/images/preview.jpg"]).map(normalizeImgPath);

    // OG/meta
    updateOG(p, relImgs[0]);

    // ===== markup final: IMAGINI STÂNGA, INFO DREAPTA
    root.innerHTML = `
      <section class="product-hero">
        <!-- STÂNGA: GALERIE -->
        <div class="col-media">
          <div class="gallery">
            <div class="gallery-main">
              <img id="main-photo" src="${relImgs[0]}" alt="${p.title}">
            </div>

            ${relImgs.length > 1 ? `
            <div class="thumbs">
              ${relImgs.map((src, i) => `
                <button class="thumb ${i === 0 ? "active" : ""}" data-src="${src}" aria-label="Imagine ${i + 1}">
                  <img src="${src}" alt="${p.title} imagine ${i + 1}">
                </button>
              `).join("")}
            </div>
            ` : ``}
          </div>
        </div>

        <!-- DREAPTA: INFO PRODUS -->
        <div class="col-info">
          <h1 class="product-title">${p.title}</h1>
          <p class="product-desc">${p.desc || "Model elegant, personalizabil."}</p>
          ${Number.isFinite(+p.price) ? `<span class="price-badge">${fmt(p.price)} RON</span>` : ``}

          ${(p.tags && p.tags.length) ? `
            <div class="tags">
              ${p.tags.map(t => `<span class="tag">${t}</span>`).join("")}
            </div>
          ` : ``}

          <div class="actions">
            <a class="btn" href="/" onclick="event.preventDefault(); history.back()">← Înapoi</a>
            <a class="btn primary" id="wa-btn">Scrie-ne pe WhatsApp</a>
          </div>
        </div>
      </section>
    `;

    // thumbs
    root.querySelectorAll(".thumb").forEach((btn) => {
      btn.addEventListener("click", () => {
        root.querySelectorAll(".thumb").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const main = $("#main-photo", root);
        if (main) main.src = btn.dataset.src;
      });
    });

    // WhatsApp (include URL curent)
    const wa = root.querySelector("#wa-btn");
    if (wa) {
      const msg = encodeURIComponent(`Bună! Mă interesează: ${p.title} (${location.href})`);
      wa.href = `https://wa.me/40760617724?text=${msg}`;
      wa.target = "_blank";
      wa.rel = "noopener";
    }
  }

  // ========== încărcare products.json (doar din /content, cu cachebust)
  async function fetchProducts() {
    const cb = `?cb=${Date.now()}`;
    const url = `/content/products.json${cb}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Nu am putut încărca /content/products.json");
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("products.json nu e un array");
    return data;
  }

  // ========== main
  async function main() {
    const keyRaw = getKeyFromUrl();
    if (!keyRaw) {
      renderNotFound("Produs indisponibil");
      return;
    }
    const key = norm(keyRaw);

    try {
      const list = await fetchProducts();

      // match după: slug (norm), id (exact), slug(title)
      const prod = list.find((p) => {
        const pid = (p.id ?? "").toString();
        const pslug = norm(p.slug ?? "");
        const ptitleSlug = slugify(p.title ?? "");
        return pslug === key || pid === keyRaw || ptitleSlug === key;
      });

      if (!prod) {
        renderNotFound("Produsul nu a fost găsit.");
        return;
      }

      // canonicalizează URL-ul către /produs/{slug}
      const canonical =
        prod.slug ||
        (prod.title ? slugify(prod.title) : (prod.id ?? "").toString());

      if (decodeURIComponent(keyRaw) !== canonical) {
        history.replaceState(null, "", `/produs/${encodeURIComponent(canonical)}`);
      }

      renderProduct(prod);
    } catch (e) {
      renderNotFound("Nu am putut încărca produsul.");
    }
  }

  document.addEventListener("DOMContentLoaded", main);
})();
