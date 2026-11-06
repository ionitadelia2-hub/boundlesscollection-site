// Catalog comun pentru selector și validarea prețului în comandă.
const WOODEN_ORNAMENT_ID = 'glob-lemn-stitch-initiala';
const ORNAMENT_LETTERS = Array.from('AĂÂBCDEFGHIÎJKLMNOPQRSȘTȚUVWXYZ');
function expandWoodenOrnamentVariants(product) {
  if (product.id !== WOODEN_ORNAMENT_ID) return [product];
  return ORNAMENT_LETTERS.flatMap(letter => [false, true].map(personalized => ({
    ...product,
    id: product.id + '-litera-' + letter.codePointAt(0).toString(16) + (personalized ? '-personalizat' : ''),
    title: product.title + ' — Litera: ' + letter + (personalized ? '' : ' — Fără scris jos'),
    price: 35 + (personalized ? 2 : 0),
    ornament_letter: letter,
    personalization_required: personalized,
    personalization_label: 'Text jos'
  })));
}
module.exports = { WOODEN_ORNAMENT_ID, ORNAMENT_LETTERS, expandWoodenOrnamentVariants };
