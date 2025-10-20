// ===== Boundless – Product Gallery (scroll-snap, stable) =====
(function () {
  function init(root) {
    const vp      = root.querySelector(".bc-viewport");
    const track   = root.querySelector(".bc-track");
    const slides  = Array.from(root.querySelectorAll(".bc-slide"));
    const thumbs  = Array.from(root.querySelectorAll(".bc-thumb"));
    const prevBtn = root.querySelector(".bc-prev");
    const nextBtn = root.querySelector(".bc-next");
    const autoplayDelay = Math.max(0, Number(root.dataset.autoplay || 0));

    if (!vp || !track || slides.length === 0) return;

    let index = 0, timer = null, touchStartX = null;

    // helpers
    const clamp = (i) => (i + slides.length) % slides.length;
    const slideWidth = () => vp.clientWidth || 0;

    function goTo(i, instant = false) {
      index = clamp(i);
      const target = slides[index];
      if (!target) return;
      const x = target.offsetLeft; // offset în track
      vp.scrollTo({ left: x, behavior: instant ? "auto" : "smooth" });
      renderActive();
    }

    function renderActive() {
      thumbs.forEach((t, i) => t.classList.toggle("is-active", i === index));
      const single = slides.length <= 1;
      if (prevBtn) prevBtn.disabled = single;
      if (nextBtn) nextBtn.disabled = single;
    }

    function syncIndexFromScroll() {
      // rotunjim la „pagina” cea mai apropiată
      const w = slideWidth() || 1;
      index = clamp(Math.round(vp.scrollLeft / w));
      renderActive();
    }

    function play() {
      if (!autoplayDelay || slides.length <= 1) return;
      stop();
      timer = setInterval(() => goTo(index + 1), autoplayDelay);
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    // UI events
    prevBtn && prevBtn.addEventListener("click", () => goTo(index - 1));
    nextBtn && nextBtn.addEventListener("click", () => goTo(index + 1));
    thumbs.forEach((t, i) => t.addEventListener("click", () => goTo(i)));

    // swipe touch
    root.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; stop(); }, { passive: true });
    root.addEventListener("touchend", (e) => {
      if (touchStartX == null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(dx) > 30) goTo(index + (dx < 0 ? 1 : -1));
      play();
    }, { passive: true });

    // ținem indexul sincronizat și la scroll manual
    vp.addEventListener("scroll", () => {
      // debounce simplu ca să nu recalculăm excesiv
      window.clearTimeout(vp._snapTimer);
      vp._snapTimer = window.setTimeout(syncIndexFromScroll, 80);
    });

    // hover (desktop)
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", play);

    // tastatură
    if (!root.hasAttribute("tabindex")) root.setAttribute("tabindex", "0");
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft")  { e.preventDefault(); goTo(index - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); }
    });

    // când se schimbă mărimea, repoziționăm exact pe slide-ul curent
    window.addEventListener("resize", () => goTo(index, true));

    // dacă imaginile se încarcă mai târziu, repoziționăm
    slides.forEach(sl => {
      const img = sl.querySelector("img");
      if (img && !img.complete) img.addEventListener("load", () => goTo(index, true), { once: true });
    });

    // pauză când tab-ul e în fundal
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop(); else play();
    });

    // init
    goTo(0, true);
    play();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".bc-gallery").forEach(init);
  });
})();
