(function () {
  'use strict';
  const form = document.getElementById('familyStockingOptions');
  const button = document.querySelector('[data-options-form="familyStockingOptions"]');
  if (!form || !button) return;
  const family = document.getElementById('stockingFamily');
  const count = document.getElementById('stockingHearts');
  const variants = JSON.parse(form.dataset.variants);
  const sixth = document.getElementById('stockingHeart6Group');
  const price = document.querySelector('.price-badge');
  function clean(input) {
    const value = input.value.trim().replace(/\s+/g, ' ');
    input.setCustomValidity(!value ? 'Completează numele dorit.' : /[\u0000-\u001f\u007f]/.test(value) ? 'Scrie un nume valid.' : '');
    return value;
  }
  function update() {
    const n = Number(count.value);
    const variant = variants.find(v => v.heart_count === n);
    if (!variant) { button.disabled = true; return; }
    const last = document.getElementById('stockingHeart6');
    sixth.hidden = n === 5;
    last.disabled = n === 5;
    last.required = n === 6;
    const names = Array.from({length:n}, (_, i) => clean(document.getElementById('stockingHeart' + (i+1))));
    const details = clean(family) + '; Inimioare: ' + names.join(', ');
    button.disabled = false;
    button.dataset.id = variant.id;
    button.dataset.price = variant.price.toFixed(2);
    button.dataset.personalization = details;
    button.dataset.title = variant.title + ' — ' + details;
    price.textContent = variant.price.toFixed(2).replace('.', ',') + ' lei / buc.';
  }
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', event => event.preventDefault());
  window.addEventListener('pageshow', update);
  update();
})();
