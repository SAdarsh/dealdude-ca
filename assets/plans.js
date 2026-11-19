// Deals Dude phone plans: filter chips (plan type, data, coverage) over the server-rendered tables.
// Hand-maintained (site/assets/); no inline script, so it runs under the strict CSP.
(function () {
  "use strict";

  var state = { kind: "", tier: "", us: "" };

  function apply() {
    document.querySelectorAll("table.plan-table").forEach(function (table) {
      var shown = 0;
      table.querySelectorAll("tbody tr").forEach(function (tr) {
        var ok = Object.keys(state).every(function (k) {
          return !state[k] || tr.getAttribute("data-" + k) === state[k];
        });
        tr.hidden = !ok;
        if (ok) shown++;
      });
      var panel = table.closest(".panel");
      var empty = panel && panel.querySelector(".filter-empty");
      if (empty) empty.hidden = shown > 0;
    });
  }

  document.addEventListener("click", function (e) {
    var chip = e.target.closest("button[data-filter]");
    if (!chip) return;
    var name = chip.getAttribute("data-filter");
    if (!(name in state)) return;
    state[name] = chip.getAttribute("data-value") || "";
    document.querySelectorAll('button[data-filter="' + name + '"]').forEach(function (b) {
      b.setAttribute("aria-pressed", b === chip ? "true" : "false");
    });
    apply();
  });
})();
