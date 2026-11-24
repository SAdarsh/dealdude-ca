// Deals Dude home search: live product suggestions from data/search.json, keyboard navigation,
// and a rotating "Try ..." placeholder. CSP-clean: no inline handlers; the form never submits
// natively (CSP form-action 'none'), we navigate in JS instead.
(function () {
  "use strict";

  var MAX = 6;
  var VERDICT = { steal: "Legit Steal", honest: "Honest Markdown", same: "Same Old Price", wait: "Wait for It",
    hike: "Hike &amp; Slash", phantom: "Phantom Discount", fresh: "Too Fresh to Call" };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function squash(s) { return String(s).toLowerCase().replace(/[^a-z0-9]/g, ""); }
  function money(v) { return "$" + v.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.querySelector("form[data-home-search]");
    if (!form) return;
    var input = form.querySelector("input");
    var list = form.querySelector(".suggest");
    var index = null, loading = null, hits = [], active = -1;

    function load() {
      if (!loading) {
        loading = fetch("data/search.json").then(function (r) { return r.json(); })
          .then(function (d) { index = d; return d; })
          .catch(function () { index = []; return index; });
      }
      return loading;
    }

    function goSearch(q) { location.href = "deals/index.html" + (q ? "?q=" + encodeURIComponent(q) : ""); }

    function close() {
      list.hidden = true; active = -1;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }

    function highlight(i) {
      var items = list.querySelectorAll("[role=option]");
      active = Math.max(-1, Math.min(i, items.length - 1));
      items.forEach(function (el, n) { el.setAttribute("aria-selected", n === active ? "true" : "false"); });
      if (active >= 0) { input.setAttribute("aria-activedescendant", items[active].id); items[active].scrollIntoView({ block: "nearest" }); }
      else input.removeAttribute("aria-activedescendant");
    }

    function render() {
      var q = input.value.trim();
      if (!q || !index) { close(); return; }
      var tokens = q.split(/\s+/).map(squash).filter(Boolean);
      var first = tokens[0] || "";
      hits = index.filter(function (it) {
        var hay = squash(it.b + " " + it.t);
        return tokens.every(function (t) { return hay.indexOf(t) !== -1; });
      }).sort(function (a, b) {
        return (a.p == null) - (b.p == null)
          || (squash(b.t).indexOf(first) === 0) - (squash(a.t).indexOf(first) === 0)
          || (a.p || 0) - (b.p || 0);
      }).slice(0, MAX);

      var html = hits.map(function (it, n) {
        var pill = has(VERDICT, it.v) ? '<span class="verdict v-' + esc(it.v) + '">' + VERDICT[it.v] + "</span>" : "";
        var price = it.p == null ? '<span class="muted">Out of stock</span>' : "<strong>" + money(it.p) + "</strong>";
        return '<li id="sg-' + n + '" role="option" aria-selected="false" class="suggest-item" data-href="' + esc(it.u) + '">' +
          '<span class="sg-title">' + esc(it.t) + '</span><span class="sg-meta">' + price + pill + "</span></li>";
      }).join("");
      html += '<li id="sg-all" role="option" aria-selected="false" class="suggest-item suggest-all" data-q="' + esc(q) + '">' +
        (hits.length ? "See all results for " : "No exact matches. Search all deals for ") + "“" + esc(q) + "”</li>";
      list.innerHTML = html;
      list.hidden = false; active = -1;
      input.setAttribute("aria-expanded", "true");
    }

    function choose(el) {
      if (!el) { goSearch(input.value.trim()); return; }
      if (el.hasAttribute("data-href")) location.href = el.getAttribute("data-href");
      else goSearch(el.getAttribute("data-q"));
    }

    var timer;
    input.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () { load().then(render); }, 80);
    });
    input.addEventListener("focus", function () { load(); stopRotate(); if (input.value.trim()) load().then(render); });
    input.addEventListener("keydown", function (e) {
      var items = list.querySelectorAll("[role=option]");
      if (e.key === "ArrowDown") { e.preventDefault(); if (list.hidden) { load().then(render); } else highlight(active + 1 >= items.length ? 0 : active + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); highlight(active <= 0 ? items.length - 1 : active - 1); }
      else if (e.key === "Escape") { close(); }
      else if (e.key === "Enter") { e.preventDefault(); choose(active >= 0 ? items[active] : null); }
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); choose(active >= 0 ? list.querySelectorAll("[role=option]")[active] : null); });
    list.addEventListener("mousedown", function (e) { e.preventDefault(); }); // keep focus while clicking
    list.addEventListener("click", function (e) { choose(e.target.closest("[role=option]")); });
    list.addEventListener("mousemove", function (e) {
      var el = e.target.closest("[role=option]");
      if (el) highlight(Array.prototype.indexOf.call(list.querySelectorAll("[role=option]"), el));
    });
    document.addEventListener("click", function (e) { if (!form.contains(e.target)) close(); });

    // Rotating example placeholder ("Try "PS5""), paused while typing; static under reduced motion.
    var examples = [];
    try { examples = JSON.parse(input.getAttribute("data-examples") || "[]"); } catch (e) { examples = []; }
    var rot = null, k = 0;
    function stopRotate() { if (rot) { clearInterval(rot); rot = null; } }
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function startRotate() {
      if (rot || examples.length < 2 || reduce) return;
      rot = setInterval(function () {
        if (document.activeElement === input || input.value) return;
        k = (k + 1) % examples.length;
        input.setAttribute("placeholder", "Try “" + examples[k] + "”");
      }, 2600);
    }
    startRotate();
    input.addEventListener("blur", startRotate);
  });
})();
