// Chatul Boundless Collection, în proprietatea dedicată din contul tawk.to.
(function () {
  if (document.getElementById("boundless-live-chat")) return;

  window.Tawk_API = window.Tawk_API || {};
  window.Tawk_LoadStart = new Date();

  const script = document.createElement("script");
  script.id = "boundless-live-chat";
  script.async = true;
  script.src = "https://embed.tawk.to/6adf5b89acddd8347a46c802/1k5s7r5au";
  script.charset = "UTF-8";
  script.setAttribute("crossorigin", "*");
  document.head.appendChild(script);
})();
