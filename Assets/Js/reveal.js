// Slide/fade the footer signs and bubbles in as they scroll into view (like owoetoni.com)
(function () {
  var els = [].slice.call(document.querySelectorAll(".sign, .bubble"));
  if (!els.length) return;
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    els.forEach(function (el) { el.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      io.unobserve(e.target);
    });
  }, { threshold: 0.2 });
  els.forEach(function (el, i) { el.style.transitionDelay = (i % 6) * 90 + "ms"; io.observe(el); });
})();
