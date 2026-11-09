(function () {
  'use strict';
  function init() {
    if (!['/', '/index', '/index.html'].includes(window.location.pathname)) return;
    const dialog = document.getElementById('portraitPopup');
    if (!dialog || typeof dialog.showModal !== 'function') return;
    const key = 'bc_portrait_popup_seen_v1';
    try { if (sessionStorage.getItem(key)) return; } catch (_) {}
    const close = dialog.querySelector('.portrait-popup-close');
    let previousFocus;
    let previousOverflow;
    function finish() {
      document.body.style.overflow = previousOverflow;
      if (previousFocus && previousFocus.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus({ preventScroll: true });
    }
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', finish);
    window.setTimeout(() => {
      if (document.querySelector('dialog[open]')) return;
      previousFocus = document.activeElement;
      previousOverflow = document.body.style.overflow;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
      close.focus({ preventScroll: true });
      try { sessionStorage.setItem(key, '1'); } catch (_) {}
    }, 1800);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
