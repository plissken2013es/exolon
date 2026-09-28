let box = null;
let timer = null;

/**
 * Shows a short message over the game screen for a couple of seconds.
 */
export default function notify(text, color = "#00dede") {
  if (!box) {
    box = document.createElement("div");
    box.style.cssText =
      "position: absolute; top: 8px; left: 50%; transform: translateX(-50%); padding: 4px 10px; " +
      "background: #000; border: 2px solid currentColor; font-size: 12px; font-weight: bold; " +
      "white-space: nowrap; z-index: 10; pointer-events: none;";
    document.getElementById("app").append(box);
  }
  box.textContent = text;
  box.style.color = color;
  box.style.display = "block";
  clearTimeout(timer);
  timer = setTimeout(() => (box.style.display = "none"), 2500);
}
