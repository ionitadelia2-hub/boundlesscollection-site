(function () {
  'use strict';
  const form = document.getElementById('woodenOrnamentOptions');
  const button = document.querySelector('[data-options-form="woodenOrnamentOptions"]');
  if (!form || !button) return;
  const letter = document.getElementById('ornamentLetter');
  const personalize = document.getElementById('ornamentPersonalize');
  const text = document.getElementById('ornamentText');
  const group = document.getElementById('ornamentTextGroup');
  const variants = JSON.parse(form.dataset.variants);
  const price = document.querySelector('.price-badge');
  function update() {
    group.hidden = !personalize.checked;
    text.disabled = !personalize.checked;
    text.required = personalize.checked;
    const value = personalize.checked ? text.value.trim().replace(/\s+/g, ' ') : '';
    text.setCustomValidity(personalize.checked && !value ? 'Scrie textul dorit în partea de jos.' : '');
    const variant = variants.find(item => item.ornament_letter === letter.value && item.personalization_required === personalize.checked);
    button.disabled = !variant;
    if (!variant) return;
    button.dataset.id = variant.id;
    button.dataset.personalization = value;
    button.dataset.title = variant.title + (value ? ' — Text jos: ' + value : '');
    button.dataset.price = variant.price.toFixed(2);
    price.textContent = variant.price.toFixed(2).replace('.', ',') + ' lei / buc.';
  }
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', event => event.preventDefault());
  window.addEventListener('pageshow', update);
  update();
})();
