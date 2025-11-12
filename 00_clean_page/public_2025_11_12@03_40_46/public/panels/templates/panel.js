(function () {
  window.PanelModules = window.PanelModules || {};

  window.PanelModules.templates = function initTemplatesPanel(root) {
    if (!root) return;
    const helper = root.querySelector(".floating-panel__blank-helper");
    if (helper) {
      helper.textContent =
        "Template picker placeholder. Drop curated mockups or pre-sized artboards in this space when the vault is ready.";
    }
  };
})();
