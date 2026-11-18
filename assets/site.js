// Deals Dude site behaviour: theme toggle, mobile nav, Black Friday countdown.
(function () {
  var root = document.documentElement;

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { return null; }
  }

  // Theme: explicit choice wins, otherwise follow the OS.
  var saved = store("dd-theme");
  if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);

  function currentTheme() {
    var t = root.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var themeBtn = document.querySelector("[data-theme-toggle]");
    if (themeBtn) {
      themeBtn.addEventListener("click", function () {
        var next = currentTheme() === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        store("dd-theme", next);
      });
    }

    var menuBtn = document.querySelector("[data-menu-toggle]");
    var nav = document.getElementById("site-nav");
    if (menuBtn && nav) {
      menuBtn.addEventListener("click", function () {
        var open = nav.classList.toggle("open");
        menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    var year = document.querySelector("[data-year]");
    if (year) year.textContent = new Date().getFullYear();

    // Countdown to Black Friday 2026 (midnight Eastern).
    var cd = document.querySelector("[data-countdown]");
    if (cd) {
      var target = new Date(cd.getAttribute("data-countdown")).getTime();
      var label = cd.querySelector(".label");
      var fields = {
        d: cd.querySelector("[data-d]"),
        h: cd.querySelector("[data-h]"),
        m: cd.querySelector("[data-m]"),
        s: cd.querySelector("[data-s]")
      };
      var tick = function () {
        var diff = target - Date.now();
        if (diff <= 0) {
          label.textContent = "Black Friday is here. Compare before you click buy.";
          fields.d.textContent = fields.h.textContent = fields.m.textContent = fields.s.textContent = "0";
          return;
        }
        fields.d.textContent = Math.floor(diff / 86400000);
        fields.h.textContent = Math.floor(diff / 3600000) % 24;
        fields.m.textContent = Math.floor(diff / 60000) % 60;
        fields.s.textContent = Math.floor(diff / 1000) % 60;
        setTimeout(tick, 1000);
      };
      tick();
    }
  });
})();
