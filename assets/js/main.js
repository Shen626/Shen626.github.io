/* Mutian Shen — personal site. No dependencies. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  /* Header: a hairline appears once the page has scrolled. */
  var header = $(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 4); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* Clips play only while on screen, and never with reduced motion. */
  var clipObserver = null;
  if ("IntersectionObserver" in window && !reduceMotion) {
    clipObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) { e.target.pause(); return; }
        var p = e.target.play();
        if (p && typeof p.catch === "function") p.catch(function () {});
      });
    }, { threshold: 0.35 });
  }
  function watchClips(root) {
    if (clipObserver) $$("video[data-autoplay]", root).forEach(function (v) { clipObserver.observe(v); });
  }
  watchClips(document);

  /* Lightbox for figures and clips (delegated, so it also covers entries added later). */
  var lb = $("#lightbox");
  var lbStage = $("#lb-stage");
  var lbCap = $("#lb-cap");
  if (lb && typeof lb.showModal === "function") {
    document.addEventListener("click", function (ev) {
      var a = ev.target && ev.target.closest ? ev.target.closest("a.media") : null;
      if (!a || ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
      ev.preventDefault();
      lbStage.textContent = "";
      var el;
      if (a.getAttribute("data-kind") === "video") {
        el = document.createElement("video");
        el.src = a.getAttribute("href");
        el.controls = true; el.loop = true; el.muted = true; el.playsInline = true; el.autoplay = true;
      } else {
        el = document.createElement("img");
        el.src = a.getAttribute("href");
        var inner = $("img", a);
        el.alt = inner ? inner.alt : "";
      }
      lbStage.appendChild(el);
      lbCap.textContent = a.getAttribute("data-cap") || "";
      lb.showModal();
    });
    $("#lb-close").addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (ev) {
      if (ev.target === lb || ev.target === lbStage) lb.close();
    });
    lb.addEventListener("close", function () { lbStage.textContent = ""; });
  }

  /* The research list and the CV are added once a person is using the page. */
  var SHOW = true;
  var KEY = [83, 104, 101, 110, 45, 55, 145, 42, 92];
  var automated = navigator.webdriver === true ||
    /bot|crawl|spider|slurp|preview|fetch|headless|lighthouse|archiv|scrap|gpt|claude|anthropic|openai|perplexity|agent|python|curl|wget|http-?client|okhttp|axios|phantom|puppeteer|playwright|selenium/i
      .test(navigator.userAgent || "");
  var firstUse = ["pointermove", "pointerdown", "touchstart", "wheel", "keydown", "focusin"];
  var queue = [];
  var used = false;
  function onFirstUse(ev) {
    if (used || (ev && ev.isTrusted === false)) return;
    used = true;
    firstUse.forEach(function (n) { window.removeEventListener(n, onFirstUse, true); });
    queue.forEach(function (fn) { try { fn(); } catch (e) {} });
  }
  if (SHOW && !automated) {
    firstUse.forEach(function (n) {
      window.addEventListener(n, onFirstUse, { capture: true, passive: true });
    });
  }
  function unscramble(bytes) {
    for (var i = 0; i < bytes.length; i++) bytes[i] ^= KEY[i % KEY.length];
    return bytes;
  }

  var store = $("#research-data");
  var list = $("#papers");
  if (store && list && typeof TextDecoder === "function") {
    queue.push(function () {
      var bin = atob(store.textContent.replace(/\s+/g, ""));
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      list.innerHTML = new TextDecoder("utf-8").decode(unscramble(bytes));
      store.parentNode.removeChild(store);
      watchClips(list);
    });
  }

  var cvLinks = $$(".js-cv");
  if (cvLinks.length && window.fetch && window.Blob && window.URL && URL.createObjectURL) {
    queue.push(function () {
      fetch("assets/doc/c.bin")
        .then(function (r) { if (!r.ok) throw new Error(); return r.arrayBuffer(); })
        .then(function (buf) {
          var pdf = new Blob([unscramble(new Uint8Array(buf))], { type: "application/pdf" });
          var url = URL.createObjectURL(pdf);
          cvLinks.forEach(function (a) {
            a.setAttribute("href", url);
            a.setAttribute("download", "Mutian_Shen_CV.pdf");
            a.parentNode.hidden = false;
          });
        })
        .catch(function () {});
    });
  }

  /* Email: assembled here so the address is not in the markup as a ready-made mailto:. */
  var mail = ["albertshen2026", "u.northwestern.edu"].join("@");
  $$(".js-mail").forEach(function (a) { a.setAttribute("href", "mailto:" + mail); });
})();
