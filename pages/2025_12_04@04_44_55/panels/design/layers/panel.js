(function () {
  window.PanelModules = window.PanelModules || {};

  window.PanelModules["layers-panel"] = function initLayersPanel(root) {
    if (!root) return;

    const templateStore = window.DesignTemplateStore;
    const settingsStore = window.CanvasSettingsStore || {};

    const listEl = root.querySelector("[data-layer-list]");
    const sideLabel = root.querySelector("[data-active-side]");

    const MAX_LAYERS = 9;

    const state = {
      side: "front",
      layers: [],
      selectedIndex: 0
    };

    const toTitle = (value, fallback = "Layer") => {
      if (!value || typeof value !== "string") return fallback;
      const cleaned = value.replace(/[_-]+/g, " ").trim();
      return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : fallback;
    };

    const deepClone = (value) => JSON.parse(JSON.stringify(value));

    const resolveActiveSide = (data) => {
      const requested = settingsStore.side || state.side;
      const sides = Array.isArray(data?.design?.sides) ? data.design.sides : [];
      const found = sides.find((s) => (s.id || s.side || "").toLowerCase() === requested);
      if (found) return (found.id || found.side || "front").toLowerCase();
      const enabled = sides.find((s) => s.enabled !== false);
      if (enabled) return (enabled.id || enabled.side || "front").toLowerCase();
      return (sides[0]?.id || sides[0]?.side || "front").toLowerCase();
    };

    const getLayersForSide = (data, sideId) => {
      const sides = Array.isArray(data?.design?.sides) ? data.design.sides : [];
      const side = sides.find((s) => (s.id || s.side || "").toLowerCase() === sideId);
      const canvas = side?.canvases?.[0];
      const layers = Array.isArray(canvas?.layers) ? deepClone(canvas.layers) : [];
      const sorted = layers
        .map((layer, idx) => ({
          ...layer,
          __order: Number.isFinite(layer.zIndex) ? Number(layer.zIndex) : layers.length - idx
        }))
        .sort((a, b) => b.__order - a.__order)
        .slice(0, MAX_LAYERS);
      return sorted;
    };

    const persistLayers = (nextLayers) => {
      if (!templateStore?.update) return;
      templateStore.update((draft) => {
        const sideId = state.side;
        const sides = Array.isArray(draft.design?.sides) ? draft.design.sides : [];
        const side = sides.find((s) => (s.id || s.side || "").toLowerCase() === sideId);
        if (!side) return draft;
        const canvas = side.canvases?.[0];
        if (!canvas) return draft;
        canvas.layers = nextLayers.map((layer, idx) => ({
          ...layer,
          zIndex: nextLayers.length - idx
        }));
        return draft;
      });
      settingsStore.side = state.side;
    };

    const renderList = () => {
      if (!listEl) return;
      listEl.innerHTML = "";
      if (sideLabel) sideLabel.textContent = toTitle(state.side, "Side");

      const total = MAX_LAYERS;
      for (let idx = 0; idx < total; idx += 1) {
      const layer = state.layers[idx];
        const row = document.createElement("button");
        row.type = "button";
        row.className = `layer-row${layer ? "" : " is-empty"}`;
        row.setAttribute("role", "option");
        const isSelected = idx === state.selectedIndex && Boolean(layer);
        row.setAttribute("aria-selected", String(isSelected));
        row.dataset.index = String(idx);
        row.disabled = !layer;
        row.tabIndex = layer ? 0 : -1;
        const canMoveUp = layer && idx > 0 && idx < state.layers.length;
        const canMoveDown = layer && idx < state.layers.length - 1;
        row.innerHTML = layer
          ? `
          <span class="layer-num">${idx + 1}</span>
          <div class="layer-meta">
            <p class="layer-title">${toTitle(layer.objectId || layer.id || `Layer ${idx + 1}`)}</p>
            <p class="layer-sub">${layer.text?.content || layer.svg?.assetRef || "Graphic"}</p>
          </div>
          <div class="layer-controls">
            <button type="button" class="layer-move-btn" data-move-up ${canMoveUp ? "" : "disabled"} aria-label="Move up">↑</button>
            <button type="button" class="layer-move-btn" data-move-down ${canMoveDown ? "" : "disabled"} aria-label="Move down">↓</button>
          </div>
        `
          : `
          <span class="layer-num">${idx + 1}</span>
          <div class="layer-meta">
            <p class="layer-title">Empty</p>
            <p class="layer-sub">No object</p>
          </div>
          <div class="layer-controls">
            <button type="button" class="layer-move-btn" data-move-up disabled aria-label="Move up">↑</button>
            <button type="button" class="layer-move-btn" data-move-down disabled aria-label="Move down">↓</button>
          </div>
        `;
        if (isSelected) row.classList.add("is-selected");
        listEl.appendChild(row);
      }
    };

    const reorderLayer = (currentIndex, direction) => {
      const nextIndex = currentIndex + direction;
      if (nextIndex < 0 || nextIndex >= state.layers.length) return;
      const nextLayers = deepClone(state.layers);
      const [item] = nextLayers.splice(currentIndex, 1);
      nextLayers.splice(nextIndex, 0, item);
      state.layers = nextLayers;
      state.selectedIndex = nextIndex;
      persistLayers(nextLayers);
      renderList();
      const rows = listEl.querySelectorAll(".layer-row");
      const target = rows[nextIndex];
      target?.focus();
    };

    const handleKeyNav = (event) => {
      if (!event.target.classList.contains("layer-row") || event.target.disabled) return;
      const idx = Number(event.target.dataset.index);
      if (!Number.isFinite(idx)) return;
      if (event.key === "ArrowUp") {
        event.preventDefault();
        reorderLayer(idx, -1);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        reorderLayer(idx, 1);
      }
    };

    listEl?.addEventListener("click", (event) => {
      const row = event.target.closest(".layer-row");
      if (!row || row.disabled) return;
      if (event.target.closest("[data-move-up]")) {
        reorderLayer(Number(row.dataset.index), -1);
        return;
      }
      if (event.target.closest("[data-move-down]")) {
        reorderLayer(Number(row.dataset.index), 1);
        return;
      }
      const idx = Number(row.dataset.index);
      if (!Number.isFinite(idx)) return;
      state.selectedIndex = idx;
      listEl.querySelectorAll(".layer-row").forEach((el) => el.classList.remove("is-selected"));
      row.classList.add("is-selected");
      row.focus();
    });

    listEl?.addEventListener("keydown", handleKeyNav);

    const bootstrap = () => {
      const data = templateStore?.get?.();
      if (!data) return;
      state.side = resolveActiveSide(data);
      state.layers = getLayersForSide(data, state.side);
      state.selectedIndex = state.layers.length ? Math.min(state.selectedIndex, state.layers.length - 1) : -1;
      renderList();
    };

    window.addEventListener("design-side-changed", (event) => {
      const nextSide = (event.detail?.side || "").toLowerCase();
      if (!nextSide) return;
      state.side = nextSide;
      const data = templateStore?.get?.();
      state.layers = getLayersForSide(data, state.side);
      state.selectedIndex = state.layers.length ? Math.min(state.selectedIndex, state.layers.length - 1) : -1;
      renderList();
    });

    templateStore?.subscribe(() => bootstrap());
    templateStore?.ready?.then(() => bootstrap());
    bootstrap();
  };
})();
