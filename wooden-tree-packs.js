// Pachete comune paginii produsului și validării comenzii.
const WOODEN_TREE_ID = 'glob-lemn-brad-verde-ajurat';
const WOODEN_TREE_PACKS = [{ count: 1, price: 10 }, { count: 3, price: 25 }, { count: 5, price: 45 }];
function expandWoodenTreePacks(product) {
  if (product.id !== WOODEN_TREE_ID) return [product];
  return WOODEN_TREE_PACKS.map(pack => ({
    ...product,
    id: pack.count === 1 ? product.id : product.id + '-pachet-' + pack.count,
    title: product.title + ' — ' + (pack.count === 1 ? '1 bucată' : 'Pachet ' + pack.count + ' bucăți'),
    price: pack.price,
    pack_count: pack.count
  }));
}
module.exports = { WOODEN_TREE_ID, WOODEN_TREE_PACKS, expandWoodenTreePacks };
