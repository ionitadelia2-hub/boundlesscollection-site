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
  // debug: unde suntem și ce cheie (id/slug) citim din URL
  console.log('[product.js] location.pathname =', location.pathname);
  const key = getId();
  console.log('[product.js] id/slug din URL =', key);

  if (!key) {
    renderNotFound("Produs indisponibil");
    return;
  }

  try {
    const list = await fetchProducts();
    console.log('[product.js] produse încărcate =', Array.isArray(list) ? list.length : 'N/A');

    // match după id, slug sau slug(titlu)
    const prod = list.find(p =>
      String(p.id) === key ||
      p.slug === key ||
      slug(p.title) === key
    );
    console.log('[product.js] produs găsit =', prod);

    if (!prod) {
      renderNotFound("Produsul nu a fost găsit.");
      return;
    }

    // opțional: normalizează URL-ul (slug canonic)
    const canonical = prod.slug || String(prod.id) || slug(prod.title);
    if (key !== canonical) {
      history.replaceState(null, "", `/produs/${encodeURIComponent(canonical)}`);
    }

    renderProduct(prod);
  } catch (e) {
    console.error('[product.js] EROARE în main()', e);
    renderNotFound("Nu am putut încărca produsul.");
  }
}


document.addEventListener('DOMContentLoaded', main);
