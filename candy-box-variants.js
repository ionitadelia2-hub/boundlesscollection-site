// Aceleași variante și prețuri pentru pagina produsului și validarea comenzii.
const CANDY_BOX_ID = 'cutiuta-dulciuri-om-zapada';
const CANDY_BOX_SIZES = [
  { value: 'mini', label: 'Mini', height: '13,6', base: '4,7', price: 10 },
  { value: 'mare', label: 'Mare', height: '23,5', base: '8,1', price: 18 }
];
const CANDY_BOX_PERSONALIZATION_PRICE = 2;

function expandCandyBoxVariants(product) {
  if (product.id !== CANDY_BOX_ID) return [product];
  return CANDY_BOX_SIZES.flatMap(size => [false, true].map(personalized => ({
    ...product,
    id: product.id + '-' + size.value + (personalized ? '-personalizat' : ''),
    title: product.title + ' — ' + size.label + (personalized ? '' : ' — Fără personalizare'),
    price: size.price + (personalized ? CANDY_BOX_PERSONALIZATION_PRICE : 0),
    candy_box_size: size.value,
    personalization_required: personalized
  })));
}

module.exports = { CANDY_BOX_ID, CANDY_BOX_SIZES, CANDY_BOX_PERSONALIZATION_PRICE, expandCandyBoxVariants };
