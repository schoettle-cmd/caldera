/* copyPrompt */
document.querySelectorAll("[data-copy]").forEach(function (b) {
  var pre = document.getElementById(b.getAttribute("data-copy"));
  var label = b.querySelector(".copy-label");
  b.addEventListener("click", function () {
    var done = function () { b.classList.add("is-copied"); label.textContent = "Copied"; setTimeout(function () { b.classList.remove("is-copied"); label.textContent = "Copy prompt"; }, 2000); };
    var fallback = function () { window.getSelection().selectAllChildren(pre); label.textContent = "Press Cmd/Ctrl+C"; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(pre.innerText).then(done, fallback); else fallback();
  });
});
document.querySelectorAll("[data-lines]").forEach(function (m) {
  var pre = document.getElementById(m.getAttribute("data-lines"));
  m.textContent = " \u00b7 " + pre.innerText.split("\n").length + " lines";
});
document.querySelectorAll(".prompt-expand").forEach(function (b) {
  b.addEventListener("click", function () {
    var body = b.closest(".prompt-body"), open = body.classList.toggle("is-collapsed") === false;
    b.textContent = open ? "Collapse" : "Show the full prompt"; b.setAttribute("aria-expanded", String(open));
  });
});
