// Deals Dude price comparison: relative "checked" times, stale-data notice, search, chart hover.
(function () {
  "use strict";

  function rel(iso) {
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (!isFinite(s)) return null;
    if (s < 90) return "just now";
    if (s < 3600) return Math.round(s / 60) + " min ago";
    if (s < 86400) return Math.round(s / 3600) + " h ago";
    return Math.round(s / 86400) + " d ago";
  }

  function money(v) {
    return "$" + v.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function squash(s) { return String(s).toLowerCase().replace(/[^a-z0-9]/g, ""); }

  var COND = { new: "New", open_box: "Open box", refurbished_manufacturer: "Manufacturer refurbished",
               refurbished_seller: "Seller refurbished", used: "Used" };

  // ---- relative times + stale notice -------------------------------------------------
  function times() {
    document.querySelectorAll("time[data-rel]").forEach(function (t) {
      var r = rel(t.getAttribute("datetime"));
      if (r) { t.title = t.textContent; t.textContent = r; }
    });
    document.querySelectorAll(".stale-note[data-updated]").forEach(function (n) {
      var age = (Date.now() - new Date(n.getAttribute("data-updated")).getTime()) / 1000;
      if (age > Number(n.getAttribute("data-stale-after"))) n.hidden = false;
    });
  }

  // ---- search ------------------------------------------------------------------------
  function search() {
    var input = document.getElementById("deal-search");
    if (!input) return;
    var grid = document.getElementById("results-grid");
    var wrap = document.getElementById("search-results");
    var defaults = document.getElementById("default-sections");
    var count = document.getElementById("results-count");
    var title = document.getElementById("results-title");
    var chips = document.querySelectorAll(".chip");
    var cond = "";
    var index = null;

    var src = JSON.parse(document.getElementById("search-index-url").textContent);
    fetch(src).then(function (r) { return r.json(); }).then(function (d) {
      index = d;
      var q = new URLSearchParams(location.search).get("q");
      if (q) { input.value = q; }
      render();
    }).catch(function () { /* default sections stay visible */ });

    function card(it) {
      var price = it.p == null ? '<span class="price muted">Out of stock</span>'
        : '<span class="price">' + money(it.p) + "</span>" + (it.w ? '<s class="was">' + money(it.w) + "</s>" : "");
      var where = it.p == null ? "" : '<p><span class="cond cond-' + esc(it.c) + '">' + esc(COND[it.c] || it.c) +
        "</span> at " + esc(it.r) + "</p>";
      return '<a class="card glass deal-card" href="../' + esc(it.u) + '">' +
        (it.b ? '<span class="pill">' + esc(it.b) + "</span>" : "") +
        "<h3>" + esc(it.t) + '</h3><div class="price-row">' + price + "</div>" + where +
        '<span class="more">Compare ' + it.n + " offer" + (it.n === 1 ? "" : "s") + " →</span></a>";
    }

    function render() {
      if (!index) return;
      var tokens = input.value.split(/\s+/).map(squash).filter(Boolean);
      if (!tokens.length && !cond) { wrap.hidden = true; defaults.hidden = false; return; }
      var hits = index.filter(function (it) {
        var hay = squash(it.b + " " + it.t);
        return tokens.every(function (t) { return hay.indexOf(t) !== -1; }) && (!cond || it.g.indexOf(cond) !== -1);
      });
      hits.sort(function (a, b) { return (a.p == null) - (b.p == null) || (a.p || 0) - (b.p || 0); });
      title.textContent = tokens.length ? "Results for “" + input.value.trim() + "”" : "All products";
      count.textContent = hits.length + " product" + (hits.length === 1 ? "" : "s") + (hits.length > 60 ? " · showing 60" : "");
      grid.innerHTML = hits.length ? hits.slice(0, 60).map(card).join("")
        : '<p class="empty-note">No matches yet. We add products to tracking regularly, so try a model name or check back soon.</p>';
      wrap.hidden = false; defaults.hidden = true;
    }

    var timer;
    input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(render, 120); });
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        cond = c.getAttribute("data-cond");
        chips.forEach(function (o) { o.setAttribute("aria-pressed", o === c ? "true" : "false"); });
        render();
      });
    });
  }

  // ---- chart hover: crosshair + tooltip ------------------------------------------------
  function charts() {
    document.querySelectorAll(".price-chart[data-chart]").forEach(function (root) {
      var d = JSON.parse(root.getAttribute("data-chart"));
      var svg = root.querySelector("svg");
      var tip = root.querySelector(".viz-tooltip");
      var line = root.querySelector(".viz-crosshair");
      var px0 = d.plot[0], px1 = d.plot[2];

      function valueAt(pts, t) { // step-after lookup
        var v = null;
        for (var i = 0; i < pts.length && pts[i][0] <= t; i++) v = pts[i][1];
        return v;
      }

      function move(ev) {
        var rect = svg.getBoundingClientRect();
        var scale = d.w / rect.width;
        var x = (ev.clientX - rect.left) * scale;
        if (x < px0 || x > px1) { hide(); return; }
        var t = d.t0 + (x - px0) / (px1 - px0) * (d.t1 - d.t0);
        line.setAttribute("x1", x); line.setAttribute("x2", x); line.setAttribute("visibility", "visible");
        var when = new Date(t * 1000).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
        var rows = d.series.map(function (s, i) {
          var v = valueAt(s.pts, t);
          return '<div class="tt-row"><span><span class="viz-swatch s' + (i + 1) + '"></span>' + esc(s.name) +
            "</span><strong>" + (v == null ? "–" : money(v)) + "</strong></div>";
        }).join("");
        tip.innerHTML = '<div class="tt-time">' + esc(when) + "</div>" + rows;
        tip.hidden = false;
        var left = (ev.clientX - rect.left) + 14;
        if (left + tip.offsetWidth > rect.width) left = (ev.clientX - rect.left) - tip.offsetWidth - 14;
        tip.style.left = Math.max(0, left) + "px";
      }
      function hide() { tip.hidden = true; line.setAttribute("visibility", "hidden"); }

      svg.addEventListener("pointermove", move);
      svg.addEventListener("pointerdown", move);
      svg.addEventListener("pointerleave", hide);
    });
  }

  document.addEventListener("DOMContentLoaded", function () { times(); search(); charts(); });
})();
