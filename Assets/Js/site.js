// Interaction layer modelled on owoetoni.com (read with REA): custom pixel cursor with hover tags,
// googly eyes that follow the pointer, draggable hero words/shapes, and scroll reveals.
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var EMAIL = "hello@xaintxql.com";

  /* ------------------------------------------------------------------ cursor */
  var ARROW = ["1000000", "1100000", "1210000", "1221000", "1222100", "1222210", "1222221", "1222111", "1212100", "1101210", "1000121", "0000110"];
  var HAND = ["00001100000000", "00012210000000", "00012210000000", "00012210000000", "00012211100000", "00012212211000", "00012212212110", "01112212212121", "12212222222221", "12222222222221", "01222222222221", "00122222222221", "00122222222210", "00012222222210", "00001222222100", "00001111111100"];
  var NS = "http://www.w3.org/2000/svg";

  function pixelSvg(rows, fill, px) {
    var svg = doc.createElementNS(NS, "svg");
    svg.setAttribute("width", rows[0].length * px);
    svg.setAttribute("height", rows.length * px);
    svg.setAttribute("viewBox", "0 0 " + rows[0].length + " " + rows.length);
    svg.setAttribute("shape-rendering", "crispEdges");
    rows.forEach(function (row, y) {
      row.split("").forEach(function (c, x) {
        if (c === "0") return;
        var r = doc.createElementNS(NS, "rect");
        r.setAttribute("x", x); r.setAttribute("y", y); r.setAttribute("width", 1); r.setAttribute("height", 1);
        r.setAttribute("fill", c === "1" ? "#1A1714" : fill);
        svg.appendChild(r);
      });
    });
    return svg;
  }

  // what each kind of target says in the cursor tag
  var TAGS = [
    { sel: ".folder-btn", text: "OPEN FOLDER", icon: "fa-folder-open" },
    { sel: ".snaps figure", text: "ZOOM", icon: "fa-magnifying-glass-plus" },
    { sel: ".email-pill", text: "COPY EMAIL", icon: "fa-envelope", email: true },
    { sel: 'a[href*="github.com"]', text: "VIEW ON GITHUB", icon: "fa-brands fa-github" },
    { sel: 'a[href*="x.com"]', text: "VIEW ON X", icon: "fa-brands fa-x-twitter" },
    { sel: 'a[href*="instagram.com"]', text: "VIEW INSTAGRAM", icon: "fa-brands fa-instagram" },
    { sel: ".work-card a, .work-card .work-link", text: "VIEW WEBSITE", icon: "fa-arrow-up-right-from-square" },
    { sel: ".folder-detail a", text: "OPEN DEMO", icon: "fa-arrow-up-right-from-square" }
  ];
  var POINTER_SEL = 'a, button, [role="button"], [type="button"], [data-grab], .tool';

  function initCursor() {
    if (!finePointer) return;
    root.setAttribute("data-custom-cursor", "on");

    var wrap = doc.createElement("div");
    wrap.className = "pcursor";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML =
      '<svg width="0" height="0" class="pc-defs"><filter id="cursor-die" x="-40%" y="-40%" width="180%" height="180%">' +
      '<feMorphology in="SourceAlpha" operator="dilate" radius="2.4" result="grow"/><feFlood flood-color="#ffffff"/><feComposite in2="grow" operator="in" result="white"/>' +
      '<feOffset in="grow" dx="1" dy="2" result="drop"/><feGaussianBlur in="drop" stdDeviation="1.4" result="blur"/><feFlood flood-color="#000" flood-opacity="0.25"/>' +
      '<feComposite in2="blur" operator="in" result="shadow"/><feMerge><feMergeNode in="shadow"/><feMergeNode in="white"/><feMergeNode in="SourceGraphic"/></feMerge></filter></svg>' +
      '<div class="pc-icon"></div><div class="pc-tag" hidden></div>';
    doc.body.appendChild(wrap);
    var icon = wrap.querySelector(".pc-icon"), tag = wrap.querySelector(".pc-tag");
    var arrow = pixelSvg(ARROW, "#E65F2E", 3);
    var hand = pixelSvg(HAND, "#FFD34D", 2.4); hand.style.marginLeft = "-11px";
    icon.appendChild(arrow);

    var pos = { x: 0, y: 0, queued: false }, moved = false, inside = true, pressed = false;
    var mode = "arrow", tagKey = "", copiedTimer = null, copied = false;

    function place() {
      pos.queued = false;
      wrap.style.transform = "translate3d(" + pos.x + "px," + pos.y + "px,0)";
    }
    function setIcon(next) {
      if (next === mode) return;
      mode = next;
      icon.replaceChild(next === "hand" ? hand : arrow, icon.firstChild);
    }
    function scale() {
      var s = (pressed ? 0.82 : 1) * (mode === "hand" ? 1.05 : 1);
      icon.style.transform = "scale(" + s + ")";
      tag.style.setProperty("--tag-scale", pressed ? 0.82 : 1);
    }
    function describe(t) {
      if (!t || !t.closest) return { hand: false, tag: null };
      var isPointer = !!t.closest(POINTER_SEL);
      var found = null;
      for (var i = 0; i < TAGS.length; i++) if (t.closest(TAGS[i].sel)) { found = TAGS[i]; break; }
      var inLightbox = !!t.closest(".lightbox");
      if (inLightbox) found = null;
      return { hand: isPointer && !found, tag: found };
    }
    function refresh(t) {
      var d = describe(t);
      setIcon(d.hand ? "hand" : "arrow");
      var key = "";
      if (d.tag) {
        key = d.tag.text + (d.tag.email && copied ? "!" : "");
        if (key !== tagKey) {
          var label = d.tag.email && copied ? "EMAIL COPIED!" : d.tag.text;
          tag.innerHTML = '<i class="' + (d.tag.icon.indexOf("fa-brands") === 0 ? d.tag.icon : "fa-solid " + d.tag.icon) + '"></i>' + label;
          tag.classList.toggle("ok", !!(d.tag.email && copied));
          tag.hidden = false;
          tag.style.animation = "none"; void tag.offsetWidth; tag.style.animation = "";
        }
      } else {
        tag.hidden = true;
      }
      tagKey = key;
      scale();
    }

    doc.addEventListener("mousemove", function (e) {
      pos.x = e.clientX; pos.y = e.clientY;
      if (!moved) { moved = true; wrap.classList.add("on"); }
      if (!pos.queued) { pos.queued = true; requestAnimationFrame(place); }
    });
    ["mouseover", "mouseout"].forEach(function (ev) {
      doc.addEventListener(ev, function (e) { var t = e.target; requestAnimationFrame(function () { refresh(ev === "mouseout" ? e.relatedTarget : t); }); });
    });
    doc.addEventListener("mousedown", function () { pressed = true; scale(); });
    doc.addEventListener("mouseup", function () { pressed = false; scale(); });
    doc.addEventListener("mouseleave", function () { inside = false; wrap.classList.remove("on"); });
    doc.addEventListener("mouseenter", function () { inside = true; if (moved) wrap.classList.add("on"); });

    // clicking the nav email pill copies the address (like the original)
    doc.addEventListener("click", function (e) {
      var pill = e.target.closest && e.target.closest(".email-pill");
      if (!pill) return;
      e.preventDefault();
      var done = function () {
        copied = true; refresh(pill);
        clearTimeout(copiedTimer);
        copiedTimer = setTimeout(function () { copied = false; refresh(null); }, 3000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(EMAIL).then(done, function () { location.href = "mailto:" + EMAIL; });
      else location.href = "mailto:" + EMAIL;
    });
  }

  /* --------------------------------------------------- googly eyes follow you */
  function initEyes() {
    var eyes = [];
    [].slice.call(doc.querySelectorAll(".critter")).forEach(function (c) {
      var mouth = c.querySelector("i"); if (mouth) mouth.classList.add("mouth");
      var box = doc.createElement("span"); box.className = "eyes";
      for (var k = 0; k < 2; k++) {
        var ball = doc.createElement("span"); ball.className = "eye";
        var pupil = doc.createElement("span"); pupil.className = "pupil";
        ball.appendChild(pupil); box.appendChild(ball);
        eyes.push({ ball: ball, pupil: pupil, visible: true });
      }
      c.appendChild(box);
    });
    if (!eyes.length) return;
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { eyes.forEach(function (e) { if (e.ball === en.target) e.visible = en.isIntersecting; }); });
      });
      eyes.forEach(function (e) { e.visible = false; io.observe(e.ball); });
    }
    var m = { x: 0, y: 0, queued: false };
    function frame() {
      m.queued = false;
      eyes.forEach(function (e) {
        if (!e.visible) return;
        var r = e.ball.getBoundingClientRect(), size = r.width;
        var a = Math.atan2(m.y - (r.top + r.height / 2), m.x - (r.left + r.width / 2)), d = size * 0.2;
        e.pupil.style.transform = "translate(" + Math.cos(a) * d + "px," + Math.sin(a) * d + "px)";
      });
    }
    window.addEventListener("pointermove", function (e) {
      m.x = e.clientX; m.y = e.clientY;
      if (!m.queued) { m.queued = true; requestAnimationFrame(frame); }
    }, { passive: true });
  }

  /* ------------------------------------- draggable hero words and critters */
  function makeDraggable(el, snapBack) {
    var sx = 0, sy = 0, dx = 0, dy = 0, id = null;
    el.setAttribute("data-grab", "");
    el.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      id = e.pointerId; el.setPointerCapture(id);
      sx = e.clientX - dx; sy = e.clientY - dy;
      el.classList.add("dragging"); e.preventDefault();
    });
    el.addEventListener("pointermove", function (e) {
      if (e.pointerId !== id) return;
      dx = e.clientX - sx; dy = e.clientY - sy;
      el.style.setProperty("--dx", dx + "px"); el.style.setProperty("--dy", dy + "px");
    });
    function end(e) {
      if (e.pointerId !== id) return;
      id = null; el.classList.remove("dragging");
      if (snapBack) {
        dx = dy = 0; el.classList.add("snap");
        el.style.removeProperty("--dx"); el.style.removeProperty("--dy");
        setTimeout(function () { el.classList.remove("snap"); }, 650);
      }
    }
    el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
  }
  function initDrag() {
    if (!finePointer || reduce) return;
    [].slice.call(doc.querySelectorAll(".hero .word")).forEach(function (el) { makeDraggable(el, true); });
    [].slice.call(doc.querySelectorAll(".hero .critter")).forEach(function (el) { makeDraggable(el, false); });
  }

  /* ------------------------------------------------------------ scroll reveal */
  var REVEAL = ".eyebrow, .qa-row, .qa-title, .tools-title, .tools-sub, .focus-card, .work-card, .journey-card, .folder, .quote, .about-sub, .lede, .tool-board, .snaps, .hero-copy, .hero-actions";
  function initReveal() {
    if (reduce || !("IntersectionObserver" in window)) return;
    var els = [].slice.call(doc.querySelectorAll(REVEAL));
    els.forEach(function (el) { el.classList.add("rv"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        // stagger siblings that enter together
        var sibs = el.parentElement ? [].slice.call(el.parentElement.children).filter(function (s) { return s.classList.contains("rv"); }) : [];
        el.style.transitionDelay = Math.max(0, sibs.indexOf(el)) * 70 + "ms";
        el.classList.add("rv-in");
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  function init() { initCursor(); initEyes(); initDrag(); initReveal(); }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init); else init();
})();
