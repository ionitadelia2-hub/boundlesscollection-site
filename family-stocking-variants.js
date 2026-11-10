const FAMILY_STOCKING_ID = "ornament-lemn-soseta-familiei";
function expandFamilyStockingVariants(product) {
  if (product.id !== FAMILY_STOCKING_ID) return [product];
  return [1, 2, 3, 4, 5, 6].map(count => ({
    ...product,
    id: product.id + "-inimi-" + count,
    title: product.title + " — " + count + " inimioare",
    price: Number(product.price) + Math.max(0, count - 5) * 2,
    heart_count: count,
    personalization_required: true,
    personalization_max_length: 300,
    personalization_label: "Familie și nume"
  }));
}
module.exports = { FAMILY_STOCKING_ID, expandFamilyStockingVariants };
