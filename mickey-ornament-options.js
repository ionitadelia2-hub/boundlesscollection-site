(function () {
  'use strict';
  const form = document.getElementById('mickeyOrnamentOptions');
  const name = document.getElementById('mickeyName');
  const letter = document.getElementById('mickeyLetter');
  const button = document.querySelector('[data-options-form="mickeyOrnamentOptions"]');
  if (!form || !name || !letter || !button) return;
  const title = button.dataset.title;
  function update() {
    const value = name.value.trim().replace(/\s+/g, ' ');
    name.setCustomValidity(!value ? 'Scrie numele dorit pe glob.' : /[\u0000-\u001f\u007f]/.test(value) ? 'Scrie un nume valid.' : '');
    const details = 'Inițială: ' + letter.value + '; Nume: ' + value;
    button.dataset.personalization = details;
    button.dataset.title = title + ' — ' + details;
  }
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', event => event.preventDefault());
  window.addEventListener('pageshow', update);
  update();
})();
