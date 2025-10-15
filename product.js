const $ = (s, r=document) => r.querySelector(s);
const fmt = n => (Math.round(Number(n||0)*100)/100).toFixed(2);

// === util: slug ca în script.js ===
const slug = s => (s||"")
  .toString()
  .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g,"-")
  .replace(/(^-|-$)+/g,"")
  .slice(0,80);

/* --------- ID din URL: ?id=... sau /produs/<id|slug> --------- */
function getId(){
  const u = new URL(location.href);
  let id = u.searchParams.get('id');
  if (!id) {
    const parts = location.pathname.split('/').filter(Boolean); // ["produs","<id|slug>"]
    const maybe = parts[1];
    if (parts[0] === 'produs' && maybe) id = decodeURIComponent(maybe);
  }
  return id || "";
}

/* ... renderNotFound, renderProduct, fetchProducts rămân neschimbate ... */

/* --------- main --------- */
async function main(){
  const key = getId();
  if (!key) return renderNotFound("Produs indisponibil");

  try {
    const list = await fetchProducts();

    // MATCH după id, slug sau slug(titlu)
    const prod = list.find(p =>
      String(p.id) === key ||
      p.slug === key ||
      slug(p.title) === key
    );

    if (!prod) return renderNotFound("Produsul nu a fost găsit.");

    // (opțional) canonicalizează URL-ul: /produs/<slug|id>
    const canonical = prod.slug || String(prod.id) || slug(prod.title);
    if (key !== canonical) {
      history.replaceState(null, "", `/produs/${encodeURIComponent(canonical)}`);
    }

    renderProduct(prod);
  } catch (e) {
    console.error(e);
    renderNotFound("Nu am putut încărca produsul.");
  }
}

document.addEventListener('DOMContentLoaded', main);
