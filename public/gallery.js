// ===== Boundless – Product Gallery (vanilla) =====
(function () {
  function init(root) {
    const track = root.querySelector(".bc-track");
    const slides = Array.from(root.querySelectorAll(".bc-slide"));
    const thumbs = Array.from(root.querySelectorAll(".bc-thumb"));
    const prev = root.querySelector(".bc-prev");
    const next = root.querySelector(".bc-next");
    const autoplayDelay = Number(root.dataset.autoplay || 0);

    let index = 0, timer = null, x0 = null;

    function render() {
      track.style.transform = `translateX(${-index * 100}%)`;
      thumbs.forEach((t, i) => t.classList.toggle("is-active", i === index));
    }
    function goTo(i) { index = (i + slides.length) % slides.length; render(); }
    function play() { if (!autoplayDelay) return; stop(); timer = setInterval(() => goTo(index + 1), autoplayDelay); }
    function stop() { if (timer) clearInterval(timer), (timer = null); }

    prev && prev.addEventListener("click", () => { goTo(index - 1); });
    next && next.addEventListener("click", () => { goTo(index + 1); });
    thumbs.forEach((t, i) => t.addEventListener("click", () => goTo(i)));

    // swipe
    root.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; stop(); }, { passive: true });
    root.addEventListener("touchend", (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 30) goTo(index + (dx < 0 ? 1 : -1));
      play();
    });

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", play);
    root.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") prev.click(); if (e.key === "ArrowRight") next.click(); });

    render(); play();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".bc-gallery").forEach(init);
  });
})();
