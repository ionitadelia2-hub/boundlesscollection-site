(function () {
  'use strict';
  const PRODUCT = 'glob-lemn-fotografie-gravata';
  const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  function database() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('boundless-photo-uploads', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('photos');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Fotografia nu poate fi păstrată în acest browser. Încearcă din nou într-un browser obișnuit.'));
    });
  }
  async function storage(mode, key, value) {
    const db = await database();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction('photos', mode);
        const request = mode === 'readwrite' ? tx.objectStore('photos').put(value, key) : tx.objectStore('photos').get(key);
        let result;
        request.onsuccess = () => { result = request.result; };
        tx.oncomplete = () => resolve(result);
        tx.onerror = tx.onabort = () => reject(new Error('Fotografia nu a putut fi salvată. Încearcă din nou.'));
      });
    } finally { db.close(); }
  }
  async function prepare(file) {
    if (!file || !TYPES.includes(file.type) || file.size > 8 * 1024 * 1024) throw new Error('Alege o fotografie JPG, PNG sau WebP de maximum 8 MB.');
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      let content;
      for (const quality of [0.88, 0.78, 0.65]) {
        content = canvas.toDataURL('image/jpeg', quality).split(',')[1];
        if (content.length <= 700000) break;
      }
      if (!content || content.length > 700000) throw new Error('Fotografia este prea mare după optimizare. Alege o imagine mai mică.');
      return { content, contentType: 'image/jpeg', filename: 'fotografie-glob.jpg' };
    } finally { bitmap.close(); }
  }
  function preview(image, photo) {
    image.src = 'data:image/jpeg;base64,' + photo.content;
    image.hidden = false;
  }
  function setupCheckout(cart) {
    const entries = cart.map((item, productIndex) => ({ item, productIndex })).filter(({ item }) => item.id === PRODUCT);
    if (!entries.length) return async () => [];
    const box = document.createElement('section');
    box.className = 'form-group full-width';
    box.style.cssText = 'border:1px solid #e7cbd5;border-radius:12px;padding:16px;background:#fff8fb';
    const heading = document.createElement('h3'); heading.textContent = 'Fotografii pentru globurile personalizate'; box.append(heading);
    const hint = document.createElement('p'); hint.textContent = 'Verifică fotografia fiecărui glob. Pentru aceeași fotografie pe mai multe globuri, modifică numărul de bucăți din coș. Maximum 3 fotografii diferite într-o comandă.'; box.append(hint);
    const pending = entries.map(({ item, productIndex }, index) => {
      let photo;
      const line = document.createElement('div'); line.style.margin = '16px 0';
      const label = document.createElement('label'); label.htmlFor = 'ornament-photo-' + productIndex; label.textContent = 'Fotografie pentru globul ' + (index + 1) + ' (' + item.quantity + ' buc.)';
      const input = document.createElement('input'); input.id = label.htmlFor; input.type = 'file'; input.accept = TYPES.join(',');
      const status = document.createElement('p'); status.setAttribute('aria-live', 'polite'); status.textContent = 'Se încarcă fotografia salvată...';
      const image = document.createElement('img'); image.hidden = true; image.alt = 'Fotografia aleasă pentru globul ' + (index + 1); image.style.cssText = 'max-width:160px;max-height:160px;object-fit:contain;display:block';
      line.append(label, input, status, image); box.append(line);
      let active = item.photoUploadKey ? storage('readonly', item.photoUploadKey).then(saved => {
        if (saved) { photo = saved; preview(image, photo); status.textContent = 'Fotografie pregătită. O poți înlocui mai jos.'; }
        else status.textContent = 'Încarcă fotografia pentru acest glob.';
      }).catch(() => { status.textContent = 'Încarcă din nou fotografia pentru acest glob.'; }) : Promise.resolve().then(() => { status.textContent = 'Încarcă fotografia pentru acest glob.'; });
      input.addEventListener('change', () => {
        const file = input.files[0]; if (!file) return;
        active = (async () => {
          try { status.textContent = 'Pregătim fotografia...'; const next = await prepare(file); photo = next; preview(image, photo); status.textContent = 'Fotografie pregătită pentru comandă.'; }
          catch (error) { photo = null; image.hidden = true; status.textContent = error.message; }
        })();
      });
      return async () => { await active; if (!photo) { input.focus(); throw new Error('Încarcă fotografia pentru globul ' + (index + 1) + '.'); } return { ...photo, productIndex }; };
    });
    document.getElementById('caricature-upload-box').before(box);
    return async () => {
      if (entries.length > 3) throw new Error('Poți comanda maximum 3 fotografii diferite pentru globuri într-o singură comandă.');
      return Promise.all(pending.map(get => get()));
    };
  }
  window.PhotoOrnamentUploads = { setupCheckout };
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('photoOrnamentOptions'); if (!form) return;
    const input = document.getElementById('photoOrnamentFile');
    const button = document.querySelector('[data-options-form="photoOrnamentOptions"]');
    const status = document.getElementById('photoOrnamentStatus');
    const image = document.getElementById('photoOrnamentPreview');
    input.addEventListener('change', async () => {
      button.disabled = true; delete button.dataset.photoUploadKey; image.hidden = true;
      try {
        status.textContent = 'Pregătim fotografia...'; const photo = await prepare(input.files[0]);
        const key = crypto.randomUUID(); await storage('readwrite', key, photo);
        button.dataset.photoUploadKey = key; preview(image, photo); status.textContent = 'Fotografia este încărcată. Poți adăuga globul în coș.'; button.disabled = false;
      } catch (error) { status.textContent = error.message; }
    });
    form.addEventListener('submit', event => event.preventDefault());
  });
})();
