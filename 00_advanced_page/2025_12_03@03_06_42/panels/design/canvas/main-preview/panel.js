(function () {
  window.PanelModules = window.PanelModules || {};

  window.PanelModules["canvas-main-preview-panel"] = function initCanvasMainPreviewPanel(root) {
    if (!root) return;

    const settingsButton = root.querySelector("[data-open-canvas-settings]");
    if (settingsButton) {
      settingsButton.addEventListener("click", () => {
        const openPanelById = window.PanelSystem?.openPanelById;
        if (typeof openPanelById === "function") {
          openPanelById("canvas-settings-panel", {
            variant: "default",
            title: "Canvas Settings"
          });
        }
      });
    }
  };
})();
