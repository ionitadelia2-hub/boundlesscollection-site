// Totalul produsului folosește prețul și cantitatea citite și de coș.
(function () {
  const button = document.querySelector('.add-to-cart');
  const quantity = document.getElementById('productQuantity');
  if (!button || !quantity || document.getElementById('productSubtotal')) return;

  const total = document.createElement('output');
  total.id = 'productSubtotal';
  total.setAttribute('for', 'productQuantity');
  total.setAttribute('aria-live', 'polite');
  total.setAttribute('aria-atomic', 'true');
  total.style.cssText = 'display:block;margin:16px 0;padding:12px 16px;border:1px solid #f7b8d0;border-radius:12px;background:#fff6fa;color:#2a2a2a;text-align:left;line-height:1.6;';
  const label = document.createElement('span');
  label.textContent = 'Total produs: ';
  const amount = document.createElement('strong');
  const calculation = document.createElement('span');
  calculation.style.cssText = 'display:block;font-size:0.9rem;';
  total.append(label, amount, calculation);
  const actions = button.closest('.actions');
  (actions || button).before(total);

  const money = new Intl.NumberFormat('ro-RO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  function updateTotal() {
    const price = Number(button.getAttribute('data-price'));
    const minimum = Math.max(1, parseInt(button.getAttribute('data-min-quantity') || '1', 10) || 1);
    const count = Math.max(minimum, parseInt(quantity.value || String(minimum), 10) || minimum);
    const cents = Math.round(price * 100);
    if (!Number.isFinite(price) || price < 0 || !Number.isSafeInteger(cents * count)) {
      total.hidden = true;
      total.style.display = 'none';
      return;
    }
    total.hidden = false;
    total.style.display = 'block';
    amount.textContent = money.format(cents * count / 100) + ' lei';
    calculation.textContent = count + ' buc. × ' + money.format(cents / 100) + ' lei';
  }

  quantity.addEventListener('input', updateTotal);
  quantity.addEventListener('change', updateTotal);
  quantity.addEventListener('blur', updateTotal);
  // Butoanele +/− existente modifică inputul înainte ca evenimentul să ajungă aici.
  document.addEventListener('click', function (event) {
    if (event.target.closest('.quantity-minus, .quantity-plus, .add-to-cart')) updateTotal();
  });
  // Formatele, ramele și ambalajul caricaturilor actualizează data-price.
  new MutationObserver(updateTotal).observe(button, {
    attributes: true,
    attributeFilter: ['data-price', 'data-min-quantity']
  });
  window.addEventListener('pageshow', updateTotal);
  updateTotal();
})();
