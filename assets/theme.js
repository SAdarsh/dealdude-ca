// Apply the saved light/dark choice before first paint (loaded synchronously in <head>).
try {
  var t = localStorage.getItem("dd-theme");
  if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
} catch (e) { /* storage blocked: follow the OS setting */ }
