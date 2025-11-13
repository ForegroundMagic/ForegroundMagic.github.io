(function () {
  window.PanelModules = window.PanelModules || {};

  const VARIANT_TITLES = {
    "all-wares": "All Wares",
    hot: "Hot",
    new: "New"
  };

  window.PanelModules.catalog = function initCatalogPanel(root, context = {}) {
    if (!root) return;

    const modeLabel = root.querySelector("[data-panel-variant-label]");
    const friendlyTitle = VARIANT_TITLES[context.variant] || context.title || "Catalog";
    if (modeLabel) {
      modeLabel.textContent = friendlyTitle;
    }
  };
})();
