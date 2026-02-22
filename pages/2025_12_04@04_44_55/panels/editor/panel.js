(function () {
  window.PanelModules = window.PanelModules || {};

  const FRIENDLY = {
    graphics: "Graphics",
    text: "Text"
  };

  window.PanelModules.editor = function initEditorPanel(root, context = {}) {
    if (!root) return;
    const label = root.querySelector("[data-panel-variant-label]");
    const eyebrow = root.querySelector(".floating-panel__eyebrow");
    const friendly = FRIENDLY[context.variant] || context.title || "Library";

    if (label) {
      label.textContent = friendly;
    }

    if (eyebrow) {
      eyebrow.textContent = friendly === "Text" ? "Typography Deck" : "Layer Library";
    }
  };
})();
