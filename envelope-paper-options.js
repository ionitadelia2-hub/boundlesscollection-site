// Reguli comune pentru catalogul generat și validarea comenzilor.
const PAPER_OPTIONS = [
  { weight: 200, label: "200 g/m²", price: 2 },
  { weight: 220, label: "220 g/m² — carton foto", price: 3.5 },
  { weight: 250, label: "250 g/m²", price: 3 }
];

function expandEnvelopeVariants(product) {
  if (
    product.paper_weight ||
    !["plicuri", "plicuri nunta", "plicuri botez"].includes(product.category) ||
    product.id.includes("cod-qr")
  ) return [product];

  const options = PAPER_OPTIONS.map(option => ({
    ...option,
    id: option.weight === 200 ? product.id : product.id + "-gramaj-" + option.weight,
    slug: option.weight === 200 ? product.slug : product.slug + "-" + option.weight + "g"
  }));

  return options.map(option => {
    const material = option.weight === 220 ? "carton foto" : "carton";
    const description = (product.desc || "").replace(
      /carton(?:\s+(?:premium|mat|alb|fin|calitativ|texturat))*\s+(?:de\s+)?(?:200|220|250)\s*g(?:rame|\/m²|\/mp)?/gi,
      material + " de " + option.weight + " g/m²"
    );
    return {
      ...product,
      id: option.id,
      slug: option.slug,
      title: product.title + " — " + option.label,
      price: option.price,
      desc: description,
      material: material + " " + option.weight + " g/m²",
      paper_weight: option.weight,
      paper_base_id: product.id,
      paper_options: options
    };
  });
}

module.exports = { expandEnvelopeVariants };
