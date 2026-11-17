// Variante comune paginii produsului și validării comenzii.
const NICOLAE_IDS = ["cutie-mos-nicolae-dulciuri","nuielusa-mos-nicolae-mesaj","set-mos-nicolae-cutie-nuielusa"];
function expandNicolaeVariants(product) {
  if (!NICOLAE_IDS.includes(product.id)) return [product];
  return [false, true].map(personalized => ({
    ...product,
    id: product.id + (personalized ? '-personalizat' : ''),
    title: product.title + (personalized ? ' — Personalizare cu nume' : ''),
    price: Number(product.price) + (personalized ? 5 : 0),
    personalization_required: personalized,
    personalization_label: 'Nume'
  }));
}
module.exports = { NICOLAE_IDS, expandNicolaeVariants };
