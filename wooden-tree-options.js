(function () {
  'use strict';
  const form = document.getElementById('woodenTreeOptions');
  const button = document.querySelector('[data-options-form="woodenTreeOptions"]');
  if (!form || !button) return;
  const select = document.getElementById('woodenTreePack');
  const variants = JSON.parse(form.dataset.variants);
  function update() {
    const variant = variants.find(item => item.pack_count === Number(select.value));
    button.disabled = !variant;
    if (!variant) return;
    button.dataset.id = variant.id;
    button.dataset.title = variant.title;
    button.dataset.unit = variant.pack_count === 1 ? 'buc.' : 'pachete';
    button.dataset.price = variant.price.toFixed(2);
    document.querySelector('.price-badge').textContent = variant.price.toFixed(2).replace('.', ',') + (variant.pack_count === 1 ? ' lei / buc.' : ' lei / pachet');
  }
  form.addEventListener('change', update);
  form.addEventListener('submit', event => event.preventDefault());
  window.addEventListener('pageshow', update);
  update();
})();
