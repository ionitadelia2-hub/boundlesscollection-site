(function () {
  'use strict';
  const form = document.getElementById('familyOrnamentOptions');
  const name = document.getElementById('familyOrnamentName');
  const button = document.querySelector('[data-options-form="familyOrnamentOptions"]');
  if (!form || !name || !button) return;
  const title = button.dataset.title;
  function update() {
    const value = name.value.trim().replace(/\s+/g, ' ');
    name.setCustomValidity(!value ? 'Scrie textul dorit pe glob.' : /[\u0000-\u001f\u007f]/.test(value) ? 'Scrie un text valid.' : '');
    button.dataset.personalization = value;
    button.dataset.title = title + (value ? ' — ' + (form.dataset.personalizationLabel || 'Text familie') + ': ' + value : '');
  }
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', event => event.preventDefault());
  window.addEventListener('pageshow', update);
  update();
})();
