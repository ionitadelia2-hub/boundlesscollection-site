// ===== Boundless – Product Gallery (stable) =====
(function () {
  function init(root) {
    const track   = root.querySelector(".bc-track");
    const slides  = Array.from(root.querySelectorAll(".bc-slide"));
    const thumbs  = Array.from(root.querySelectorAll(".bc-thumb"));
    const prevBtn = root.querySelector(".bc-prev");
    const nextBtn = root.querySelector(".bc-next");
    const vp      = root.querySelector(".bc-viewport") || root;

    const autoplayDelay = Math.max(0, Number(root.dataset.autoplay || 0));

    let index = 0;
    let timer = null;
    let startX = null;
    let resizing = false;

    // --- helpers -------------------------------------------------------------
    const clamp = (i) => (i + slides.length) % slides.length;

    function slideWidth() {
      // lățimea vizibilă – cât trebuie să “sară” pentru un slide
      return vp.clientWidth || root.clientWidth || 0;
    }

    function setSlideWidths() {
      const w = slideWidth();
      // forțează fiecare slide să aibă exact lățimea viewport-ului
      slides.forEach(s => { s.style.minWidth = w + "px"; s.style.flexBasis = w + "px"; });
    }

    function render() {
      const w = slideWidth();
      // deplasare exactă în pixeli, nu procente
      track.style.transform = `translateX(${-index * w}px)`;
      thumbs.forEach((t, i) => t.classList.toggle("is-active", i === index));
      // (opțional) dezactivează săgețile dacă e un singur slide
      const single = slides.length <= 1;
      if (prevBtn) prevBtn.disabled = single;
      if (nextBtn) nextBtn.disabled = single;
    }

    function goTo(i) { index = clamp(i); render(); }

    function play() {
      if (!autoplayDelay || slides.length <= 1) return;
      stop();
      timer = setInterval(() => goTo(index + 1), autoplayDelay);
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    // --- events --------------------------------------------------------------
    prevBtn && prevBtn.addEventListener("click", () => goTo(index - 1));
    nextBtn && nextBtn.addEventListener("click", () => goTo(index + 1));
    thumbs.forEach((t, i) => t.addEventListener("click", () => goTo(i)));

    // swipe (touch)
    root.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; stop(); }, { passive: true });
    root.addEventListener("touchend",   (e) => {
      if (startX == null) return;
      const dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 30) goTo(index + (dx < 0 ? 1 : -1));
      play();
    }, { passive: true });

    // hover pause (desktop)
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", play);

    // tastatură (stânga/dreapta)
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft")  { e.preventDefault(); goTo(index - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); }
    });
    // focus pentru keydown
    if (!root.hasAttribute("tabindex")) root.setAttribute("tabindex", "0");

    // pauză când pagina e în fundal
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop(); else play();
    });

    // resize: recalculează lățimile + repoziționează
    function onResize() {
      if (resizing) return;
      resizing = true;
      requestAnimationFrame(() => {
        setSlideWidths();
        render();
        resizing = false;
      });
    }
    window.addEventListener("resize", onResize);

    // asigură-te că randează corect după încărcarea imaginilor
    slides.forEach(sl => {
      const img = sl.querySelector("img");
      if (img && !img.complete) img.addEventListener("load", onResize, { once: true });
    });

    // --- init ---------------------------------------------------------------
    setSlideWidths();
    render();
    play();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".bc-gallery").forEach(init);
  });
})();
