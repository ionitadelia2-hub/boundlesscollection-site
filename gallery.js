// ===== Boundless – Product Gallery (buttons, no-scroll, pixel-perfect) =====
(function () {
  function init(root) {
    const vp      = root.querySelector(".bc-viewport");
    const track   = root.querySelector(".bc-track");
    const slides  = Array.from(root.querySelectorAll(".bc-slide"));
    root.classList.toggle("is-single", slides.length <= 1);
    const thumbs  = Array.from(root.querySelectorAll(".bc-thumb"));
    const prevBtn = root.querySelector(".bc-prev");
    const nextBtn = root.querySelector(".bc-next");
    const autoplayDelay = Math.max(0, Number(root.dataset.autoplay || 0));

    if (!vp || !track || slides.length === 0) return;

    let index = 0;
    let timer = null;
    let startX = null;
    let resizing = false;

    const clamp = (i) => (i + slides.length) % slides.length;

    function viewportWidth() {
      return vp.clientWidth || root.clientWidth || 0;
    }

    function layout() {
      const w = viewportWidth();
      // fiecare slide = lățimea viewport-ului
      slides.forEach(s => {
        s.style.width = w + "px";
        s.style.minWidth = w + "px";
        s.style.flexBasis = w + "px";
      });
      // track = suma slide-urilor
      track.style.width = (w * slides.length) + "px";
      // repoziționează pe slide-ul curent
      track.style.transform = `translateX(${-index * w}px)`;
    }

    function render() {
      const w = viewportWidth();
      track.style.transform = `translateX(${-index * w}px)`;
      thumbs.forEach((t, i) => t.classList.toggle("is-active", i === index));
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
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    // butoane
    prevBtn && prevBtn.addEventListener("click", () => goTo(index - 1));
    nextBtn && nextBtn.addEventListener("click", () => goTo(index + 1));
    thumbs.forEach((t, i) => t.addEventListener("click", () => goTo(i)));

    // swipe touch (fără scroll)
    root.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; stop(); }, { passive: true });
    root.addEventListener("touchend", (e) => {
      if (startX == null) return;
      const dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 30) goTo(index + (dx < 0 ? 1 : -1));
      play();
    }, { passive: true });

    // hover pause
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", play);

    // tastatură
    if (!root.hasAttribute("tabindex")) root.setAttribute("tabindex", "0");
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft")  { e.preventDefault(); goTo(index - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); }
    });

    // resize: recalculează layout-ul o singură dată per frame
    function onResize() {
      if (resizing) return;
      resizing = true;
      requestAnimationFrame(() => { layout(); resizing = false; });
    }
    window.addEventListener("resize", onResize);

    // după încărcarea imaginilor (în caz că schimbă layout-ul)
    slides.forEach(sl => {
      const img = sl.querySelector("img");
      if (img && !img.complete) img.addEventListener("load", onResize, { once: true });
    });

    // tab inactiv → pauză autoplay
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop(); else play();
    });

    // init
    layout();
    render();
    play();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".bc-gallery").forEach(init);
  });
})();
