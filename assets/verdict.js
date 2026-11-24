// Deals Dude: little celebrations (and warnings) for deal verdicts on product pages.
// Legit Steal -> confetti, Honest Markdown -> sparkles, Hike & Slash -> the "was" price gets slashed,
// Phantom Discount -> the "was" price turns ghostly. Respects reduced motion; CSP-clean (no inline
// styles: values go through CSS custom properties via the CSSOM).
(function () {
  "use strict";

  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function onceThisSession(key) {
    try {
      if (sessionStorage.getItem(key)) return false;
      sessionStorage.setItem(key, "1");
    } catch (e) { /* storage blocked: just play it */ }
    return true;
  }

  function rand(min, max) { return min + Math.random() * (max - min); }

  // Burst `count` particles out of the centre of `origin`.
  function burst(origin, count, kind) {
    var r = origin.getBoundingClientRect();
    var layer = document.createElement("div");
    layer.className = "fx-layer";
    layer.setAttribute("aria-hidden", "true");
    var colors = kind === "confetti"
      ? ["#30b552", "#ffcc00", "#34c759", "#ffd60a", "#0fa3b1", "#ff9f0a"]
      : ["#0fa3b1", "#5ac8d8", "#ffffff"];
    for (var i = 0; i < count; i++) {
      var p = document.createElement("span");
      p.className = kind === "confetti" ? "confetti" + (i % 3 === 0 ? " round" : "") : "sparkle";
      var angle = kind === "confetti" ? rand(-Math.PI * 0.95, -Math.PI * 0.05) : (i / count) * Math.PI * 2;
      var dist = kind === "confetti" ? rand(120, 320) : rand(40, 70);
      p.style.setProperty("--x", (r.left + r.width / 2) + "px");
      p.style.setProperty("--y", (r.top + r.height / 2) + "px");
      p.style.setProperty("--dx", (Math.cos(angle) * dist).toFixed(1) + "px");
      p.style.setProperty("--dy", (Math.sin(angle) * dist).toFixed(1) + "px");
      p.style.setProperty("--fall", rand(160, 320).toFixed(0) + "px");
      p.style.setProperty("--rot", rand(-720, 720).toFixed(0) + "deg");
      p.style.setProperty("--delay", rand(0, 0.15).toFixed(2) + "s");
      p.style.setProperty("--dur", (kind === "confetti" ? rand(1.4, 2.2) : rand(0.6, 0.9)).toFixed(2) + "s");
      p.style.setProperty("--c", colors[i % colors.length]);
      layer.appendChild(p);
    }
    document.body.appendChild(layer);
    setTimeout(function () { layer.remove(); }, 2600);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var box = document.querySelector(".best-box[data-verdict]");
    if (!box || reducedMotion()) return;
    var v = box.getAttribute("data-verdict");
    var pill = box.querySelector(".verdict") || box;
    box.classList.add("animate");

    if (v === "steal" && onceThisSession("dd-confetti:" + location.pathname)) {
      setTimeout(function () { burst(pill, 90, "confetti"); }, 350);
    } else if (v === "honest") {
      setTimeout(function () { burst(pill, 8, "sparkle"); }, 350);
    }
  });
})();
