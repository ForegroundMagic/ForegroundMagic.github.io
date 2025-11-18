(function () {
  window.PanelModules = window.PanelModules || {};

  window.PanelModules["canvas-settings-panel"] = function initCanvasSettingsPanel(root) {
    if (!root) return;

    const note = root.querySelector(".canvas-settings__note");
    if (note) {
      note.textContent =
        "Canvas settings live separately from Graphics/Text panels so you can tweak the workspace without affecting those overlays.";
    }

    const tabContainer = root.querySelector("[data-canvas-tabs]");
    if (tabContainer) {
      const tabs = Array.from(tabContainer.querySelectorAll("[data-tab]"));
      const views = Array.from(tabContainer.querySelectorAll("[data-tab-view]"));

      const activate = (key) => {
        tabs.forEach((tab) => {
          const isActive = tab.dataset.tab === key;
          tab.classList.toggle("is-active", isActive);
          tab.setAttribute("aria-selected", String(isActive));
        });

        views.forEach((view) => {
          const isActive = view.dataset.tabView === key;
          view.classList.toggle("is-active", isActive);
          view.hidden = !isActive;
        });
      };

      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          activate(tab.dataset.tab);
        });
      });

      activate("single");
    }
  };
})();
