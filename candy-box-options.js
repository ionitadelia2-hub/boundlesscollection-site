// Opțiunile cutiuței sunt păstrate în prețul și denumirea trimise către coș.
(function () {
  'use strict';
  const form = document.getElementById('candyBoxOptions');
  const button = document.querySelector('[data-options-form="candyBoxOptions"]');
  if (!form || !button) return;

  const size = document.getElementById('candyBoxSize');
  const personalize = document.getElementById('candyBoxPersonalize');
  const name = document.getElementById('candyBoxName');
  const nameGroup = document.getElementById('candyBoxNameGroup');
  const priceLabel = document.querySelector('.price-badge');
  const variants = JSON.parse(form.dataset.variants);
  const money = new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function update() {
    const variant = variants.find(item => item.candy_box_size === size.value && item.personalization_required === personalize.checked);
    if (!variant) return;
    const withName = personalize.checked;
    const customerName = withName ? name.value.trim().replace(/\s+/g, ' ') : '';
    nameGroup.hidden = !withName;
    name.disabled = !withName;
    name.required = withName;
    name.setCustomValidity(withName && !customerName ? 'Scrie numele pentru personalizare.' : '');
    const price = variant.price;
    button.dataset.id = variant.id;
    button.dataset.personalization = customerName;
    button.dataset.title = variant.title + (withName ? ' — Nume: ' + customerName : '');
    button.dataset.price = price.toFixed(2);
    priceLabel.textContent = money.format(price) + ' lei / buc.';
  }

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', event => event.preventDefault());
  window.addEventListener('pageshow', update);
  update();
})();
