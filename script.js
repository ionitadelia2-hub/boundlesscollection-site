/* ===========================
   MOD ADMIN: memorie + URL + toggle
   =========================== */
// Pornește admin dacă avem ?admin=1 sau dacă e salvat în localStorage
const IS_ADMIN =
  location.search.includes('admin=1') ||
  localStorage.getItem('admin') === '1';

// Dezactivare rapidă dacă există ?admin=0
if (location.search.includes('admin=0')) {
  localStorage.removeItem('admin');
  document.body.classList.remove('admin');
  // curățăm URL-ul (scoatem parametrii)
  history.replaceState({}, "", location.pathname + location.hash);
} else if (IS_ADMIN) {
  document.body.classList.add('admin');
  localStorage.setItem('admin', '1');
  history.replaceState({}, "", location.pathname + location.hash);
}

// Helper: setează UI + memorie
function setAdmin(on) {
  if (on) {
    document.body.classList.add('admin');
    localStorage.setItem('admin', '1');
  } else {
    document.body.classList.remove('admin');
    localStorage.removeItem('admin');
  }
  const t = document.getElementById('adminToggle');
  if (t) t.textContent = 'Admin: ' + (on ? 'ON' : 'OFF');
}

// La încărcare, sincronizăm textul butonului (dacă există) + shortcuts
window.addEventListener('DOMContentLoaded', () => {
  setAdmin(document.body.classList.contains('admin'));

  // Buton plutitor (dacă există în HTML)
  document.getElementById('adminToggle')?.addEventListener('click', () => {
    const now = document.body.classList.contains('admin');
    setAdmin(!now);
    if (!document.body.classList.contains('admin')) location.reload();
  });

  // Shortcut: Alt + A (comută fără URL)
  document.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key.toLowerCase() === 'a')) {
      const now = document.body.classList.contains('admin');
      setAdmin(!now);
      if (!document.body.classList.contains('admin')) location.reload();
      e.preventDefault();
    }
  });
});


/* ===========================
   Date produse (localStorage)
   =========================== */
const demo = [
  { id: crypto.randomUUID(), title: "Invitație Florală",      price: 9.5, category: "Invitații",     desc: "Model elegant cu sigiliu din ceară.", image: "https://images.unsplash.com/photo-1519681393784-6f2cb90b72a1?q=80&w=1200&auto=format&fit=crop" },
  { id: crypto.randomUUID(), title: "Plic de dar Roz Pal",     price: 6,   category: "Plicuri",       desc: "Carton texturat, fundă satin.",      image: "https://images.unsplash.com/photo-1527259232211-2a12fda1d24a?q=80&w=1200&auto=format&fit=crop" },
  { id: crypto.randomUUID(), title: "Meniu Elegant",           price: 7.5, category: "Meniuri",       desc: "Print calitativ, fonturi moderne.",  image: "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=1200&auto=format&fit=crop" },
  { id: crypto.randomUUID(), title: "Număr de masă Minimal",   price: 5,   category: "Numere",        desc: "Aspect curat, ușor de citit.",       image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop" },
  { id: crypto.randomUUID(), title: "Mărturie Soia – Fluture", price: 12,  category: "Mărturii soia", desc: "Aromă florală discretă.",             image: "https://images.unsplash.com/photo-1505577058444-a3dab90d4253?q=80&w=1200&auto=format&fit=crop" },
  { id: crypto.randomUUID(), title: "Set Papetărie Roz",       price: 39,  category: "Set",           desc: "Invitație + plic + meniu + număr.",  image: "https://images.unsplash.com/photo-1520975922329-8273f33a69a6?q=80&w=1200&auto=format&fit=crop" }
];

const KEY = "delia_products_v1";
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function load() {
  const saved = localStorage.getItem(KEY);
  if (!saved) { localStorage.setItem(KEY, JSON.stringify(demo)); return demo; }
  try { return JSON.parse(saved); } catch { return demo; }
}
function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

let PRODUCTS = load();

// Migrare: asigură p.images = [] și mută p.image în p.images[0] dacă există
PRODUCTS = PRODUCTS.map(p => {
  if (Array.isArray(p.images)) return p;
  const arr = [];
  if (p.image) arr.push(p.image);
  return { ...p, images: arr };
});
save(PRODUCTS);


/* ===========================
   Elemente UI & stare
   =========================== */
let EDIT_ID = null;              // produsul aflat în editare (sau null)
let EDIT_IMAGES = [];            // galeria vizuală din formular

const grid       = $("#grid");
const q          = $("#q");
const filterBtns = $$(".filter .pill");
const form       = $("#form");
let activeFilter = "toate";


/* ===========================
   Manager imagini (galerie în formular)
   =========================== */
function syncImagesStore() {
  const store = document.getElementById('imagesStore'); // textarea invizibilă
  if (store) store.value = EDIT_IMAGES.join('\n');
}

function renderThumbs() {
  const wrap = document.getElementById('imgManager');
  if (!wrap) return;

  if (EDIT_IMAGES.length === 0) {
    wrap.innerHTML = `<div class="thumb empty">Nicio imagine încă</div>`;
    syncImagesStore();
    return;
  }

  wrap.innerHTML = EDIT_IMAGES.map((src, i) => `
    <figure class="thumb">
      <img src="${src}" alt="img ${i + 1}">
      <button type="button" class="remove" data-i="${i}" aria-label="Șterge imaginea">×</button>
    </figure>
  `).join('');

  wrap.querySelectorAll('.remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = +btn.dataset.i;
      EDIT_IMAGES.splice(idx, 1);
      renderThumbs();
    });
  });

  syncImagesStore();
}

// Hook-uri adăugare URL / fișiere
window.addEventListener('DOMContentLoaded', () => {
  const urlInp   = document.getElementById('imgUrl');
  const addBtn   = document.getElementById('addUrl');
  const filesInp = document.getElementById('files');

  addBtn?.addEventListener('click', () => {
    const u = (urlInp.value || '').trim();
    if (u) {
      EDIT_IMAGES.push(u);
      renderThumbs();
      urlInp.value = '';
    }
  });

  filesInp?.addEventListener('change', async (e) => {
    const files = [...e.target.files].filter(f => f && f.size);
    for (const f of files) {
      EDIT_IMAGES.push(await toDataURL(f));
    }
    renderThumbs();
    e.target.value = ''; // reset input
  });

  // randare inițială a galeriei (goală)
  renderThumbs();
});


/* ===========================
   Card produs + listare
   =========================== */
function card(p) {
  const imgs = (p.images && p.images.length) ? p.images : [];
  const dots   = imgs.map((_, i) => `<i class="${i === 0 ? 'active' : ''}"></i>`).join('');
  const slides = imgs.map((src, i) => `<img src="${src}" alt="${p.title}" class="${i === 0 ? 'active' : ''}" loading="lazy">`).join('');

  return `
  <article class="item" data-id="${p.id}">
    <div class="media">
      <div class="slide-track" data-index="0">
        ${slides || `<img src="" alt="${p.title}" class="active" style="opacity:.3">`}
      </div>
      ${imgs.length > 1 ? `
      <div class="slider-nav">
        <button class="prev" aria-label="Anterior">‹</button>
        <button class="next" aria-label="Următor">›</button>
      </div>
      <div class="slider-dots">${dots}</div>` : ``}
    </div>

    <div class="content">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:.6rem;flex-wrap:wrap">
        <h3 style="margin:0;font-size:1rem">${p.title}</h3>
        <span class="pill">${p.category}</span>
      </div>
      <p class="muted" style="margin:.25rem 0 .6rem">${p.desc || ""}</p>
      <div class="price">${Number(p.price).toFixed(2)} RON</div>
    </div>

    <div class="actions">
      <button class="btn" onclick="share('${p.title}')">Distribuie</button>
      <button class="btn primary" onclick="inquire('${p.title}')">Solicită ofertă</button>
      <button class="btn small warn admin-only"   onclick="editProduct('${p.id}')">Editează</button>
      <button class="btn small danger admin-only" onclick="deleteProduct('${p.id}')">Șterge</button>
    </div>
  </article>`;
}

function render() {
  if (!grid) return;
  const term = (q?.value || "").toLowerCase();
  const items = PRODUCTS.filter(p => {
    const hitTerm = [p.title, p.desc, p.category].join(" ").toLowerCase().includes(term);
    const hitCat  = activeFilter === "toate" || p.category === activeFilter;
    return hitTerm && hitCat;
  });
  grid.innerHTML = items.map(card).join("");
}
render();

q?.addEventListener("input", render);
filterBtns.forEach(btn => btn.addEventListener("click", () => {
  filterBtns.forEach(b => b.setAttribute("aria-pressed", "false"));
  btn.setAttribute("aria-pressed", "true");
  activeFilter = btn.dataset.filter;
  render();
}));


/* ===========================
   Formular: creare / actualizare produse
   =========================== */
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const images = [...EDIT_IMAGES]; // preluăm din managerul vizual

  if (EDIT_ID) {
    // UPDATE produs existent
    const i = PRODUCTS.findIndex(x => x.id === EDIT_ID);
    if (i !== -1) {
      PRODUCTS[i] = {
        ...PRODUCTS[i],
        title:    fd.get("title"),
        price:    Number(fd.get("price")),
        category: fd.get("category"),
        desc:     fd.get("desc"),
        images
      };
      save(PRODUCTS);
      EDIT_ID = null;
      form.querySelector('[type="submit"]').textContent = "Adaugă";
      document.getElementById('cancelEdit')?.style.setProperty('display', 'none');
    }
  } else {
    // CREATE produs nou
    PRODUCTS.unshift({
      id:       crypto.randomUUID(),
      title:    fd.get("title"),
      price:    Number(fd.get("price")),
      category: fd.get("category"),
      desc:     fd.get("desc"),
      images
    });
    save(PRODUCTS);
  }

  form.reset();
  EDIT_IMAGES = [];
  renderThumbs();
  render();
});

function toDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}


/* ===========================
   Acțiuni carduri publice
   =========================== */
function inquire(title) {
  const url = location.href.split('#')[0] + '#contact';
  alert(`Mulțumesc pentru interes în „${title}”! Mergi la Contact pentru ofertă.\n\n${url}`);
  location.hash = 'contact';
}
window.inquire = inquire;

async function share(title) {
  const shareData = { title: "Delia's – Papetărie & Mărturii", text: `Îți recomand: ${title}`, url: location.href };
  try { if (navigator.share) { await navigator.share(shareData); } else { throw 0; } }
  catch { navigator.clipboard?.writeText(shareData.url); alert("Link copiat!"); }
}
window.share = share;


/* ===========================
   Editare / ștergere produse (admin)
   =========================== */
function editProduct(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p || !form) return;

  form.querySelector('[name="title"]').value    = p.title || "";
  form.querySelector('[name="price"]').value    = p.price ?? "";
  form.querySelector('[name="category"]').value = p.category || "";
  form.querySelector('[name="desc"]').value     = p.desc || "";

  // sincronizează galeria vizuală
  EDIT_IMAGES = [...(p.images || [])];
  renderThumbs();

  const filesInput = form.querySelector('[name="files"]');
  if (filesInput) filesInput.value = ""; // reset input fișiere

  EDIT_ID = id;
  form.querySelector('[type="submit"]').textContent = "Salvează modificările";
  const cancelBtn = document.getElementById('cancelEdit');
  if (cancelBtn) cancelBtn.style.display = "inline-flex";

  // deschide automat panoul <details> cu editorul
  const adminWrap = document.querySelector('details.admin');
  adminWrap?.setAttribute('open', '');
  if (adminWrap) {
    adminWrap.classList.add('highlight');
    setTimeout(() => adminWrap.classList.remove('highlight'), 1000);
  }

  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.editProduct = editProduct;

function deleteProduct(id) {
  if (!confirm("Ștergi acest produs?")) return;
  PRODUCTS = PRODUCTS.filter(x => x.id !== id);
  save(PRODUCTS);
  render();
}
window.deleteProduct = deleteProduct;

document.getElementById('cancelEdit')?.addEventListener('click', cancelEdit);
function cancelEdit() {
  if (!form) return;
  EDIT_ID = null;
  form.reset();
  EDIT_IMAGES = [];
  renderThumbs();
  render();
  form.querySelector('[type="submit"]').textContent = "Adaugă";
  const cancelBtn = document.getElementById('cancelEdit');
  if (cancelBtn) cancelBtn.style.display = "none";
}


/* ===========================
   Formular Contact → WhatsApp (fallback email)
   =========================== */
(function () {
  const cform = document.getElementById('contactForm');
  if (!cform) return;

  const PHONE = '40760617724'; // format internațional: 40 + numărul fără 0

  cform.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(cform);
    if (fd.get('website')) return; // honeypot anti-bot

    const name  = (fd.get('name')    || '').trim() || '-';
    const email = (fd.get('email')   || '').trim() || '-';
    const phone = (fd.get('phone')   || '').trim() || '-';
    const msg   = (fd.get('message') || '').trim() || '-';

    const text =
`Bună, Delia!
Am o întrebare despre produsele tale.

Nume: ${name}
Email: ${email}
Telefon: ${phone}

Mesaj:
${msg}`;

    const wa = `https://wa.me/${PHONE}?text=` + encodeURIComponent(text);
    const w  = window.open(wa, '_blank');

    if (!w || w.closed || typeof w.closed === 'undefined') {
      const subject = 'Cerere ofertă de pe site';
      const body    = encodeURIComponent(text);
      window.location.href = `mailto:boundlesscollection@yahoo.com?subject=${encodeURIComponent(subject)}&body=${body}`;
    }
    cform.reset();
  });
})();


/* ===========================
   Meniu: hamburger + dropdown „Produse”
   =========================== */
(function () {
  const btnHamb  = document.querySelector('.nav-toggle');
  const mainMenu = document.getElementById('mainmenu');
  const dd       = document.querySelector('.dropdown');
  const ddBtn    = dd?.querySelector('.dropbtn');
  const ddMenu   = dd?.querySelector('.menu');

  // Hamburger (mobil)
  if (btnHamb && mainMenu) {
    btnHamb.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const open = document.body.classList.toggle('menu-open');
      btnHamb.setAttribute('aria-expanded', open ? 'true' : 'false');
      dd?.classList.remove('open');
      ddBtn?.setAttribute('aria-expanded', 'false');
    });
  }

  // Dropdown „Produse”
  if (dd && ddBtn && ddMenu) {
    const close = () => { dd.classList.remove('open'); ddBtn.setAttribute('aria-expanded', 'false'); };

    ddBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const nowOpen = dd.classList.toggle('open');
      ddBtn.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
    });

    ddMenu.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  // Click în afara panoului mobil -> închide tot
  document.addEventListener('click', (e) => {
    if (!document.body.classList.contains('menu-open')) return;
    const inside = e.target.closest('.nav-toggle') || e.target.closest('nav');
    if (!inside) {
      document.body.classList.remove('menu-open');
      btnHamb?.setAttribute('aria-expanded', 'false');
      dd?.classList.remove('open');
      ddBtn?.setAttribute('aria-expanded', 'false');
    }
  });

  // ESC închide panoul mobil
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (document.body.classList.contains('menu-open')) {
      document.body.classList.remove('menu-open');
      btnHamb?.setAttribute('aria-expanded', 'false');
      dd?.classList.remove('open');
      ddBtn?.setAttribute('aria-expanded', 'false');
    }
  });
})();


/* ===========================
   Slider (delegat pe .products)
   =========================== */
grid?.addEventListener('click', (e) => {
  const prev = e.target.closest('.prev');
  const next = e.target.closest('.next');
  if (!prev && !next) return;

  const card  = e.target.closest('.item');
  const track = card.querySelector('.slide-track');
  const imgs  = [...track.querySelectorAll('img')];
  if (!imgs.length) return;

  const dots = card.querySelectorAll('.slider-dots i');
  let i = parseInt(track.dataset.index || '0', 10);

  i = i + (next ? 1 : -1);
  if (i < 0) i = imgs.length - 1;
  if (i > imgs.length - 1) i = 0;

  track.dataset.index = i;
  imgs.forEach((im, idx) => im.classList.toggle('active', idx === i));
  dots?.forEach((d,  idx) => d.classList.toggle('active', idx === i));
});

// Swipe (simplu) pentru mobil
let sx = 0, sy = 0;
grid?.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
grid?.addEventListener('touchend',   (e) => {
  const ex = e.changedTouches[0].clientX, ey = e.changedTouches[0].clientY;
  if (Math.abs(ex - sx) < 30 || Math.abs(ey - sy) > 60) return; // prag + ignorăm scroll vertical
  const card = e.target.closest('.item'); if (!card) return;
  const btn  = card.querySelector(ex < sx ? '.next' : '.prev');
  btn?.click();
}, { passive: true });
