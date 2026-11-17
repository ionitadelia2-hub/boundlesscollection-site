(function () {
  'use strict';
  const form = document.getElementById('nicolaeOptions');
  const button = document.querySelector('[data-options-form="nicolaeOptions"]');
  if (!form || !button) return;
  const personalize = document.getElementById('nicolaePersonalize');
  const name = document.getElementById('nicolaeName');
  const group = document.getElementById('nicolaeNameGroup');
  const variants = JSON.parse(form.dataset.variants);
  const priceLabel = document.querySelector('.price-badge');
  function update() {
    const variant = variants.find(item => item.personalization_required === personalize.checked);
    if (!variant) return;
    const value = personalize.checked ? name.value.trim().replace(/\s+/g, ' ') : '';
    group.hidden = !personalize.checked;
    name.disabled = !personalize.checked;
    name.required = personalize.checked;
    name.setCustomValidity(personalize.checked && !value ? 'Scrie numele pentru personalizare.' : '');
    button.dataset.id = variant.id;
    button.dataset.personalization = value;
    button.dataset.title = variant.title + (value ? ' — Nume: ' + value : '');
    button.dataset.price = variant.price.toFixed(2);
    priceLabel.textContent = variant.price.toFixed(2).replace('.', ',') + ' lei / buc.';
    button.dispatchEvent(new Event('change', { bubbles: true }));
  }
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', event => event.preventDefault());
  window.addEventListener('pageshow', update);
  update();
})();
