/* =========================================================
   CONFIG
   ========================================================= */
   const ADMIN_PASSWORD = 'Haisalumanarim8!';         // ← SCHIMBĂ aici
   const STORAGE_KEY    = 'delia_products_v1';
   const ADMIN_FLAG     = 'admin';
   const ADMIN_PASS_OK  = 'admin_pass_ok';
   
   /* mici utilitare */
   const $  = (s, r=document) => r.querySelector(s);
   const $$ = (s, r=document) => [...r.querySelectorAll(s)];
   
   /* =========================================================
      MOD ADMIN – memorie + URL + parolă + toggle
      ========================================================= */
   (function initAdmin(){
     const onUrlAdmin   = location.search.includes('admin=1');
     const onUrlLogout  = location.search.includes('admin=0');
     const alreadyAdmin = localStorage.getItem(ADMIN_FLAG) === '1';
     const passOk       = localStorage.getItem(ADMIN_PASS_OK) === '1';
   
     if (onUrlLogout) {
       localStorage.removeItem(ADMIN_FLAG);
       localStorage.removeItem(ADMIN_PASS_OK);
       document.body.classList.remove('admin');
       history.replaceState({}, "", location.pathname + location.hash);
     } else if (onUrlAdmin || alreadyAdmin) {
       // dacă nu e validată parola încă, o cerem
       if (!passOk) {
         const pw = prompt('Introdu parola de administrare:');
         if (pw === ADMIN_PASSWORD) {
           localStorage.setItem(ADMIN_PASS_OK, '1');
         } else {
           alert('Parolă greșită.');
         }
       }
       if (localStorage.getItem(ADMIN_PASS_OK) === '1') {
         document.body.classList.add('admin');
         localStorage.setItem(ADMIN_FLAG, '1');
       }
       history.replaceState({}, "", location.pathname + location.hash);
     }
   
     // toggle vizibil (dacă e prezent în HTML)
     window.addEventListener('DOMContentLoaded', ()=>{
       const btn = $('#adminToggle');
       if (btn) {
         btn.addEventListener('click', ()=>{
           const now = document.body.classList.contains('admin');
           if (now) {
             // ieșire
             document.body.classList.remove('admin');
             localStorage.removeItem(ADMIN_FLAG);
             localStorage.removeItem(ADMIN_PASS_OK);
             btn.textContent = 'Admin: OFF';
             location.reload();
           } else {
             // intrare
             const pw = prompt('Introdu parola de administrare:');
             if (pw === ADMIN_PASSWORD) {
               localStorage.setItem(ADMIN_PASS_OK, '1');
               localStorage.setItem(ADMIN_FLAG, '1');
               document.body.classList.add('admin');
               btn.textContent = 'Admin: ON';
               // arată panoul de editare mai evident
               const adminWrap = $('details.admin');
               adminWrap?.setAttribute('open','');
               adminWrap?.classList.add('highlight');
               setTimeout(()=>adminWrap?.classList.remove('highlight'), 1800);
             } else {
               alert('Parolă greșită.');
             }
           }
         });
         btn.textContent = 'Admin: ' + (document.body.classList.contains('admin') ? 'ON' : 'OFF');
       }
   
       // shortcut: Alt + A
       document.addEventListener('keydown', (e)=>{
         if (e.altKey && e.key.toLowerCase() === 'a') {
           $('#adminToggle')?.click();
           e.preventDefault();
         }
       });
     });
   })();
   
   /* =========================================================
      DATE DEMO + PERSISTENȚĂ
      ========================================================= */
   const demo = [
     { id: crypto.randomUUID(), title: 'Invitație Florală',      price: 9.5, category: 'Invitații',     desc: 'Model elegant cu sigiliu din ceară.', image: 'https://images.unsplash.com/photo-1519681393784-6f2cb90b72a1?q=80&w=1200&auto=format&fit=crop' },
     { id: crypto.randomUUID(), title: 'Plic de dar Roz Pal',     price: 6,   category: 'Plicuri',       desc: 'Carton texturat, fundă satin.',      image: 'https://images.unsplash.com/photo-1527259232211-2a12fda1d24a?q=80&w=1200&auto=format&fit=crop' },
     { id: crypto.randomUUID(), title: 'Meniu Elegant',           price: 7.5, category: 'Meniuri',       desc: 'Print calitativ, fonturi moderne.',  image: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=1200&auto=format&fit=crop' },
     { id: crypto.randomUUID(), title: 'Număr de masă Minimal',   price: 5,   category: 'Numere',        desc: 'Aspect curat, ușor de citit.',       image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop' },
     { id: crypto.randomUUID(), title: 'Mărturie Soia – Fluture', price: 12,  category: 'Mărturii soia', desc: 'Aromă florală discretă.',             image: 'https://images.unsplash.com/photo-1505577058444-a3dab90d4253?q=80&w=1200&auto=format&fit=crop' },
     { id: crypto.randomUUID(), title: 'Set Papetărie Roz',       price: 39,  category: 'Set',           desc: 'Invitație + plic + meniu + număr.',  image: 'https://images.unsplash.com/photo-1520975922329-8273f33a69a6?q=80&w=1200&auto=format&fit=crop' },
   ];
   
   function loadProducts(){
     const saved = localStorage.getItem(STORAGE_KEY);
     if (!saved){ localStorage.setItem(STORAGE_KEY, JSON.stringify(demo)); return demo; }
     try { return JSON.parse(saved); } catch { return demo; }
   }
   function saveProducts(data){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
   
   /* încărcare + migrare la images[] */
   let PRODUCTS = loadProducts();
   PRODUCTS = PRODUCTS.map(p=>{
     if (Array.isArray(p.images)) return p;
     const arr = [];
     if (p.image) arr.push(p.image);
     const np = {...p, images: arr};
     delete np.image;
     return np;
   });
   saveProducts(PRODUCTS);
   
   /* =========================================================
      STARE UI / REFERINȚE
      ========================================================= */
   let EDIT_ID = null;
   let EDIT_IMAGES = [];
   
   const grid       = $('#grid');
   const q          = $('#q');
   const filterBtns = $$('.filter .pill');
   const form       = $('#form');
   let activeFilter = 'toate';
   
   /* =========================================================
      MANAGER IMAGINI (în formular)
      ========================================================= */
   function syncImagesStore(){
     const store = $('#imagesStore');
     if (store) store.value = EDIT_IMAGES.join('\n');
   }
   function renderThumbs(){
     const wrap = $('#imgManager');
     if (!wrap) return;
   
     if (EDIT_IMAGES.length === 0){
       wrap.innerHTML = `<div class="thumb empty">Nicio imagine încă</div>`;
       syncImagesStore();
       return;
     }
     wrap.innerHTML = EDIT_IMAGES.map((src, i)=>`
       <figure class="thumb">
         <img src="${src}" alt="img ${i+1}">
         <button type="button" class="remove" data-i="${i}" aria-label="Șterge imaginea">×</button>
       </figure>
     `).join('');
   
     wrap.querySelectorAll('.remove').forEach(btn=>{
       btn.addEventListener('click', ()=>{
         const idx = +btn.dataset.i;
         EDIT_IMAGES.splice(idx, 1);
         renderThumbs();
       });
     });
   
     syncImagesStore();
   }
   function addImageUrl(u){
     const url = (u||'').trim();
     if (!url) return;
     EDIT_IMAGES.push(url);
     renderThumbs();
   }
   
   /* hook-uri UI pentru manager imagini */
   window.addEventListener('DOMContentLoaded', ()=>{
     const urlInp   = $('#imgUrl');
     const addBtn   = $('#addUrl');
     const filesInp = $('#files');
   
     addBtn?.addEventListener('click', ()=>{
       addImageUrl(urlInp.value);
       urlInp.value = '';
     });
   
     filesInp?.addEventListener('change', async (e)=>{
       const files = [...e.target.files].filter(f => f && f.size);
       for (const f of files){
         EDIT_IMAGES.push(await toDataURL(f));
       }
       renderThumbs();
       e.target.value = '';
     });
   
     renderThumbs();
   });
   
   /* =========================================================
      CARD PRODUS + LISTARE / FILTRARE
      ========================================================= */
   function card(p){
     const imgs  = (p.images && p.images.length) ? p.images : [];
     const dots  = imgs.map((_,i)=>`<i class="${i===0?'active':''}"></i>`).join('');
     const slides= imgs.map((src,i)=>`<img src="${src}" alt="${p.title}" class="${i===0?'active':''}" loading="lazy">`).join('');
   
     return `
     <article class="item" data-id="${p.id}">
       <div class="media">
         <div class="slide-track" data-index="0">
           ${slides || `<img src="" alt="${p.title}" class="active" style="opacity:.25">`}
         </div>
         ${imgs.length>1 ? `
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
   
   function render(){
     if (!grid) return;
     const term = (q?.value || '').toLowerCase();
     const items = PRODUCTS.filter(p=>{
       const hitTerm = [p.title, p.desc, p.category].join(' ').toLowerCase().includes(term);
       const hitCat  = activeFilter==='toate' || p.category===activeFilter;
       return hitTerm && hitCat;
     });
     grid.innerHTML = items.map(card).join('');
   }
   window.addEventListener('DOMContentLoaded', render);
   
   q?.addEventListener('input', render);
   filterBtns.forEach(btn => btn.addEventListener('click', ()=>{
     filterBtns.forEach(b=>b.setAttribute('aria-pressed','false'));
     btn.setAttribute('aria-pressed','true');
     activeFilter = btn.dataset.filter;
     render();
   }));
   
   /* =========================================================
      CRUD FORMULAR (CREATE/UPDATE)
      ========================================================= */
   form?.addEventListener('submit', (e)=>{
     e.preventDefault();
     const fd = new FormData(form);
     const images = [...EDIT_IMAGES]; // din managerul vizual
   
     if (EDIT_ID){
       const i = PRODUCTS.findIndex(x=>x.id===EDIT_ID);
       if (i !== -1){
         PRODUCTS[i] = {
           ...PRODUCTS[i],
           title:    fd.get('title'),
           price:    Number(fd.get('price')),
           category: fd.get('category'),
           desc:     fd.get('desc'),
           images
         };
         saveProducts(PRODUCTS);
         EDIT_ID = null;
         form.querySelector('[type="submit"]').textContent = 'Adaugă';
         $('#cancelEdit')?.style.setProperty('display','none');
       }
     } else {
       PRODUCTS.unshift({
         id:       crypto.randomUUID(),
         title:    fd.get('title'),
         price:    Number(fd.get('price')),
         category: fd.get('category'),
         desc:     fd.get('desc'),
         images
       });
       saveProducts(PRODUCTS);
     }
   
     form.reset();
     EDIT_IMAGES = [];
     renderThumbs();
     render();
   });
   
   /* conversie fișier -> dataURL */
   function toDataURL(file){
     return new Promise((res, rej)=>{
       const r = new FileReader();
       r.onload  = ()=>res(r.result);
       r.onerror = rej;
       r.readAsDataURL(file);
     });
   }
   
   /* =========================================================
      ACȚIUNI CARDURI PUBLICE
      ========================================================= */
   function inquire(title){
     const url = location.href.split('#')[0] + '#contact';
     alert(`Mulțumesc pentru interes în „${title}”! Mergi la Contact pentru ofertă.\n\n${url}`);
     location.hash = 'contact';
   }
   window.inquire = inquire;
   
   async function share(title){
     const shareData = { title: "Delia's – Papetărie & Mărturii", text: `Îți recomand: ${title}`, url: location.href };
     try {
       if (navigator.share) { await navigator.share(shareData); }
       else { throw 0; }
     } catch {
       navigator.clipboard?.writeText(shareData.url);
       alert('Link copiat!');
     }
   }
   window.share = share;
   
   /* =========================================================
      EDIT/DELETE (ADMIN)
      ========================================================= */
   function editProduct(id){
     const p = PRODUCTS.find(x=>x.id===id);
     if (!p || !form) return;
   
     form.querySelector('[name="title"]').value    = p.title || '';
     form.querySelector('[name="price"]').value    = p.price ?? '';
     form.querySelector('[name="category"]').value = p.category || '';
     form.querySelector('[name="desc"]').value     = p.desc || '';
   
     // imagini → în bufferul vizual
     EDIT_IMAGES = [...(p.images || [])];
     renderThumbs();
   
     const filesInput = form.querySelector('[name="files"]');
     if (filesInput) filesInput.value = '';
   
     EDIT_ID = id;
     form.querySelector('[type="submit"]').textContent = 'Salvează modificările';
     const cancelBtn = $('#cancelEdit');
     if (cancelBtn) cancelBtn.style.display = 'inline-flex';
   
     const adminWrap = $('details.admin');
     adminWrap?.setAttribute('open','');
     if (adminWrap){
       adminWrap.classList.add('highlight');
       setTimeout(()=>adminWrap.classList.remove('highlight'), 1800);
     }
     form.scrollIntoView({behavior:'smooth', block:'start'});
   }
   window.editProduct = editProduct;
   
   function deleteProduct(id){
     if (!confirm('Ștergi acest produs?')) return;
     PRODUCTS = PRODUCTS.filter(x=>x.id!==id);
     saveProducts(PRODUCTS);
     render();
   }
   window.deleteProduct = deleteProduct;
   
   $('#cancelEdit')?.addEventListener('click', ()=>{
     if (!form) return;
     EDIT_ID = null;
     form.reset();
     EDIT_IMAGES = [];
     renderThumbs();
     render();
     form.querySelector('[type="submit"]').textContent = 'Adaugă';
     const cancelBtn = $('#cancelEdit');
     if (cancelBtn) cancelBtn.style.display = 'none';
   });
   
   /* Reset total (revine la demo) */
   $('#reset')?.addEventListener('click', ()=>{
     if (confirm('Ștergi toate produsele salvate local?')){
       localStorage.removeItem(STORAGE_KEY);
       PRODUCTS = loadProducts();
       // re-migrare
       PRODUCTS = PRODUCTS.map(p=>{
         if (Array.isArray(p.images)) return p;
         const arr = [];
         if (p.image) arr.push(p.image);
         const np = {...p, images: arr};
         delete np.image;
         return np;
       });
       saveProducts(PRODUCTS);
       render();
     }
   });
   
   /* =========================================================
      CONTACT: WhatsApp (fallback e-mail)
      ========================================================= */
   (function(){
     const cform = $('#contactForm');
     if (!cform) return;
     const PHONE = '40760617724'; // 40 + număr fără 0
   
     cform.addEventListener('submit', (e)=>{
       e.preventDefault();
       const fd = new FormData(cform);
       if (fd.get('website')) return; // honeypot
   
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
   
   /* =========================================================
      MENIU: hamburger + dropdown “Produse”
      ========================================================= */
   (function(){
     const btnHamb  = $('.nav-toggle');
     const mainMenu = $('#mainmenu');
     const dd       = $('.dropdown');
     const ddBtn    = dd?.querySelector('.dropbtn');
     const ddMenu   = dd?.querySelector('.menu');
   
     if (btnHamb && mainMenu){
       btnHamb.addEventListener('click', (e)=>{
         e.preventDefault();
         e.stopPropagation();
         const open = document.body.classList.toggle('menu-open');
         btnHamb.setAttribute('aria-expanded', open ? 'true' : 'false');
         dd?.classList.remove('open');
         ddBtn?.setAttribute('aria-expanded','false');
       });
     }
   
     if (dd && ddBtn && ddMenu){
       const close = ()=>{ dd.classList.remove('open'); ddBtn.setAttribute('aria-expanded','false'); };
   
       ddBtn.addEventListener('click', (e)=>{
         e.preventDefault();
         e.stopPropagation();
         const now = dd.classList.toggle('open');
         ddBtn.setAttribute('aria-expanded', now ? 'true' : 'false');
       });
   
       ddMenu.addEventListener('click', (e)=> e.stopPropagation());
       document.addEventListener('click', close);
       document.addEventListener('keydown', (e)=>{ if (e.key==='Escape') close(); });
     }
   
     // Click în afara panoului mobil -> închide tot
     document.addEventListener('click', (e)=>{
       if (!document.body.classList.contains('menu-open')) return;
       const inside = e.target.closest('.nav-toggle') || e.target.closest('nav');
       if (!inside){
         document.body.classList.remove('menu-open');
         btnHamb?.setAttribute('aria-expanded','false');
         dd?.classList.remove('open');
         ddBtn?.setAttribute('aria-expanded','false');
       }
     });
   
     // ESC închide panoul mobil
     document.addEventListener('keydown', (e)=>{
       if (e.key !== 'Escape') return;
       if (document.body.classList.contains('menu-open')){
         document.body.classList.remove('menu-open');
         btnHamb?.setAttribute('aria-expanded','false');
         dd?.classList.remove('open');
         ddBtn?.setAttribute('aria-expanded','false');
       }
     });
   })();
   
   /* =========================================================
      SLIDER pe carduri (delegat pe .products)
      ========================================================= */
   grid?.addEventListener('click', (e)=>{
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
     imgs.forEach((im, idx)=> im.classList.toggle('active', idx===i));
     dots?.forEach((d, idx)=> d.classList.toggle('active', idx===i));
   });
   
   // swipe simplu pe mobil
   let sx = 0, sy = 0;
   grid?.addEventListener('touchstart', (e)=>{ sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, {passive:true});
   grid?.addEventListener('touchend', (e)=>{
     const ex = e.changedTouches[0].clientX, ey = e.changedTouches[0].clientY;
     if (Math.abs(ex-sx) < 30 || Math.abs(ey-sy) > 60) return;
     const card = e.target.closest('.item'); if (!card) return;
     const btn  = card.querySelector(ex < sx ? '.next' : '.prev');
     btn?.click();
   }, {passive:true});
   
   /* =========================================================
      INIT DIVERSE
      ========================================================= */
   window.addEventListener('DOMContentLoaded', ()=>{
     const year = $('#year');
     if (year) year.textContent = new Date().getFullYear();
   });
   
   