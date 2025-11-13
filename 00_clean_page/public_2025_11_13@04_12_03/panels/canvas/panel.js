(function(){
  const DATA_URL = "assets/data/product_media.json";
  const dataCache = {
    promise: null,
    value: null
  };

  window.PanelModules = window.PanelModules || {};

  window.PanelModules.canvas = function initCanvasPanel(root){
    if (!root) return;
    const statusNode = root.querySelector("[data-canvas-status]");
    const statusText = root.querySelector("[data-status-text]");
    const workspace = root.querySelector("[data-canvas-workspace]");

    showStatus("Loading product data…");

    loadProductDataset()
      .then((dataset) => {
        if (statusNode) statusNode.hidden = true;
        if (workspace) workspace.hidden = false;
        bootstrapCanvas(root, dataset);
      })
      .catch((error) => {
        console.error("Canvas panel failed to load", error);
        if (statusText) {
          statusText.textContent = "Unable to load product data. Please ensure this page is served via a local web server.";
        }
      });

    function showStatus(message){
      if (statusText) statusText.textContent = message;
      if (statusNode) statusNode.hidden = false;
      if (workspace) workspace.hidden = true;
    }
  };

  function loadProductDataset(){
    if (dataCache.value) return Promise.resolve(dataCache.value);
    if (dataCache.promise) return dataCache.promise;

    dataCache.promise = fetch(DATA_URL)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load product media data");
        return response.json();
      })
      .then((payload) => {
        const DefaultProductMedia = {};
        const ProductMediaAreas = {};
        const ProductPpiConfig = {};
        const productOrder = [];

        const products = Array.isArray(payload?.products) ? payload.products : [];
        products.forEach((product) => {
          if (!product?.productCode) return;
          productOrder.push(product.productCode);
          const colors = Array.isArray(product.colors) ? product.colors : [];
          let chosen = colors.find((c) => c.colorAssetId === product.defaultColorAssetId);
          if (!chosen) chosen = colors[0];

          if (chosen) {
            DefaultProductMedia[product.productCode] = {
              colorAssetId: chosen.colorAssetId,
              colorCode: chosen.colorCode,
              colorName: chosen.colorName,
              front: chosen.preview?.front,
              back: chosen.preview?.back
            };
          }

          const sideAreas = {};
          Object.entries(product.mediaAreas || {}).forEach(([side, list]) => {
            sideAreas[side] = Array.isArray(list)
              ? list.map((entry) => ({ ...entry }))
              : [];
          });
          ProductMediaAreas[product.productCode] = sideAreas;

          const ppiEntry = {};
          Object.entries(product.ppi || {}).forEach(([side, ppi]) => {
            if (!ppi && ppi !== 0) return;
            const key = side.toLowerCase() === "back" ? "back" : "front";
            ppiEntry[key] = ppi;
          });
          ProductPpiConfig[product.productCode] = ppiEntry;
        });

        dataCache.value = {
          DefaultProductMedia,
          ProductMediaAreas,
          ProductPpiConfig,
          productOrder
        };
        return dataCache.value;
      })
      .catch((error) => {
        dataCache.promise = null;
        throw error;
      });

    return dataCache.promise;
  }

  function bootstrapCanvas(root, dataset){
    const {
      DefaultProductMedia,
      ProductMediaAreas,
      ProductPpiConfig,
      productOrder
    } = dataset;

    const byId = (id) => root.querySelector(`#${id}`);
    const workspace = root.querySelector("[data-canvas-workspace]");
    const statusNode = root.querySelector("[data-canvas-status]");
    const statusText = root.querySelector("[data-status-text]");

    const productSelect = byId("productSelect");
    const previewImg = byId("productPreviewImage");
    const overlaySvg = byId("previewCanvasOverlay");
    const areaSelect = byId("previewAreaSelect");
    const previewAreaSizeDisplay = byId("previewAreaSizeDisplay");
    const previewAreaSizeEl = byId("previewAreaSize");
    const customHeaderTitleEl = byId("customHeaderTitle");

    const sideButtons = Array.from(root.querySelectorAll(".tp-side-btn"));
    const metaSideEl = root.querySelector("[data-meta-side]");
    const metaAreaEl = root.querySelector("[data-meta-area]");
    const customPanel = root.querySelector("[data-custom-panel]");
    if (customPanel) customPanel.setAttribute("data-custom-active", "false");

    const customInputs = {
      x: byId("customX"),
      y: byId("customY"),
      width: byId("customW"),
      height: byId("customH")
    };
    const customRanges = {
      x: byId("customXRange"),
      y: byId("customYRange"),
      width: byId("customWRange"),
      height: byId("customHRange")
    };
    const customResetBtn = byId("customResetBtn");
    const customFrameToggleBtn = byId("customFrameToggleBtn");
    const customCenterHBtn = byId("customCenterHBtn");
    const customCenterVBtn = byId("customCenterVBtn");

    const advancedToggleBtn = root.querySelector("[data-advanced-toggle]");
    const advancedPanel = root.querySelector("[data-advanced-panel]");
    const advancedSummary = root.querySelector("[data-advanced-summary]");
    const advancedWarning = root.querySelector("[data-advanced-warning]");
    const advancedDisabled = root.querySelector("[data-advanced-disabled]");
    const advancedPageCards = {};
    root.querySelectorAll("[data-adv-page]").forEach(card => {
      const pageId = card.getAttribute("data-adv-page");
      if (!pageId) return;
      const inputs = {};
      const ranges = {};
      ["x","y","width","height"].forEach(field => {
        inputs[field] = card.querySelector(`[data-adv-input="${field}"]`);
        ranges[field] = card.querySelector(`[data-adv-range="${field}"]`);
      });
      advancedPageCards[pageId] = {
        card,
        toggle: card.querySelector("[data-adv-toggle]"),
        sizeLabel: card.querySelector("[data-adv-size]"),
        inputs,
        ranges,
        steppers: card.querySelectorAll("[data-adv-step]"),
        centers: card.querySelectorAll("[data-adv-center]")
      };
    });

    Object.entries(advancedPageCards).forEach(([pageId, ui]) => {
      if (ui.toggle) {
        ui.toggle.addEventListener("change", () => handleAdvancedToggle(pageId, ui.toggle.checked));
      }
      ["x", "y", "width", "height"].forEach((field) => {
        const input = ui.inputs[field];
        const range = ui.ranges[field];
        if (input) {
          input.addEventListener("input", () => {
            const raw = parseFloat(input.value);
            if (!Number.isFinite(raw)) return;
            setAdvancedFromRelative(pageId, field, Math.round(raw));
          });
        }
        if (range) {
          range.addEventListener("input", () => {
            const raw = parseFloat(range.value);
            if (!Number.isFinite(raw)) return;
            setAdvancedFromRelative(pageId, field, Math.round(raw));
          });
        }
      });
      if (ui.steppers) {
        ui.steppers.forEach((btn) => {
          const field = btn.getAttribute("data-field");
          let step = parseFloat(btn.getAttribute("data-step"));
          if (!Number.isFinite(step) || step === 0) step = 1;
          let holdTimer = null;

          const applyStep = () => {
            const current = parseFloat(ui.inputs[field]?.value) || 0;
            setAdvancedFromRelative(pageId, field, current + step);
          };

          const startHold = (event) => {
            event.preventDefault();
            applyStep();
            holdTimer = setInterval(applyStep, 180);
          };

          const stopHold = () => {
            if (holdTimer) {
              clearInterval(holdTimer);
              holdTimer = null;
            }
          };

          btn.addEventListener("mousedown", startHold);
          btn.addEventListener("touchstart", startHold, { passive: false });
          ["mouseup", "mouseleave", "touchend", "touchcancel"].forEach((evt) => {
            btn.addEventListener(evt, stopHold);
          });
          btn.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              applyStep();
            }
          });
        });
      }
      if (ui.centers) {
        ui.centers.forEach((btn) => {
          const axis = btn.getAttribute("data-adv-center");
          btn.addEventListener("click", () => centerAdvancedPage(pageId, axis));
        });
      }
    });

    const customBoundsByKey = {};
    const customCurrentByKey = {};
    const advancedPagesByKey = {};
    const advancedCustomBackups = {};
    const customSteppers = Array.from(root.querySelectorAll("[data-custom-step]"));

    const availableProducts = Object.keys(DefaultProductMedia);
    let currentProductCode = productOrder.find((code) => availableProducts.includes(code)) || availableProducts[0] || null;
    let currentSide = "front";
    let currentAreaName = null;
    let isCustomFrameEnabled = true;
    let isAdvancedPanelOpen = false;
    let isAdvancedModeEnabled = false;

    if (!currentProductCode) {
      if (statusText) statusText.textContent = "No products with preview media were found in the database.";
      if (statusNode) statusNode.hidden = false;
      if (workspace) workspace.hidden = true;
      return;
    }

    if (productSelect) {
      productSelect.innerHTML = "";
      availableProducts.forEach((code) => {
        const meta = DefaultProductMedia[code];
        const option = document.createElement("option");
        option.value = code;
        option.textContent = meta?.colorName ? `${code} — ${meta.colorName}` : code;
        productSelect.appendChild(option);
      });
      if (currentProductCode) {
        productSelect.value = currentProductCode;
      }

      productSelect.addEventListener("change", () => {
        const next = productSelect.value;
        if (!next || !DefaultProductMedia[next]) return;
        if (next === currentProductCode) return;
        currentProductCode = next;
        currentAreaName = null;
        updatePreview();
        refreshAreaOptions();
      });
    }

    function customKey(){
      return `${currentProductCode}:${currentSide}`;
    }

    function sideKey(){
      return currentSide === "back" ? "Back" : "Front";
    }

    function ensureCustomStateForCurrent(){
      const key = customKey();
      if (customCurrentByKey[key]) return;
      const prod = ProductMediaAreas[currentProductCode];
      if (!prod) return;
      const areas = prod[sideKey()];
      if (!areas) return;
      const base = areas.find((a) => a.areaType === "custom_max");
      if (!base) return;
      customBoundsByKey[key] = {
        minX: base.x,
        minY: base.y,
        maxX: base.x + base.width,
        maxY: base.y + base.height
      };
      customCurrentByKey[key] = {
        x: base.x,
        y: base.y,
        width: base.width,
        height: base.height
      };
    }

    function getCustomStateForCurrent(){
      ensureCustomStateForCurrent();
      return customCurrentByKey[customKey()] || null;
    }

    function getCustomBoundsForCurrent(){
      ensureCustomStateForCurrent();
      return customBoundsByKey[customKey()] || null;
    }

    function advancedKey(){
      return customKey();
    }

    function ensureAdvancedPagesForCurrent(){
      const key = advancedKey();
      if (!advancedPagesByKey[key]) {
        const bounds = getCustomBoundsForCurrent();
        if (bounds) {
          advancedPagesByKey[key] = createAdvancedPagesFromBounds(bounds);
        } else {
          advancedPagesByKey[key] = ADVANCED_PAGE_PRESETS.map((preset) => ({
            id: preset.id,
            name: `${preset.label} — ${preset.description}`,
            enabled: preset.defaultEnabled,
            x: 0,
            y: 0,
            width: MIN_PAGE_SIZE,
            height: MIN_PAGE_SIZE
          }));
        }
      }
      return advancedPagesByKey[key];
    }

    function createAdvancedPagesFromBounds(bounds){
      const totalWidth = bounds.maxX - bounds.minX;
      const totalHeight = bounds.maxY - bounds.minY;
      const baseWidth = Math.max(MIN_PAGE_SIZE, Math.round(totalWidth * 0.1));
      const baseHeight = Math.max(MIN_PAGE_SIZE, Math.round(totalHeight * 0.1));
      return ADVANCED_PAGE_PRESETS.map((preset) => {
        const width = Math.min(baseWidth, totalWidth);
        const height = Math.min(baseHeight, totalHeight);
        const x = preset.anchorX === "right" ? bounds.maxX - width : bounds.minX;
        const y = preset.anchorY === "bottom" ? bounds.maxY - height : bounds.minY;
        return {
          id: preset.id,
          name: `${preset.label} — ${preset.description}`,
          enabled: preset.defaultEnabled,
          x,
          y,
          width,
          height
        };
      });
    }

    function getAdvancedPagesForCurrent(){
      const bounds = getCustomBoundsForCurrent();
      const pages = ensureAdvancedPagesForCurrent();
      if (!bounds) return pages;
      advancedPagesByKey[advancedKey()] = pages.map((page) => clampRectToBounds(page, bounds));
      return advancedPagesByKey[advancedKey()];
    }

    function getCurrentAdvancedPage(){
      const pages = getAdvancedPagesForCurrent();
      return pages.find((page) => page.enabled) || pages[0] || null;
    }

    function clampAdvancedPagesToBounds(){
      const bounds = getCustomBoundsForCurrent();
      if (!bounds) return;
      const key = advancedKey();
      if (!advancedPagesByKey[key] || !advancedPagesByKey[key].length) return;
      advancedPagesByKey[key] = advancedPagesByKey[key].map((page) => clampRectToBounds(page, bounds));
      syncAllAdvancedCards();
    }

    function advancedBackupKey(){
      return advancedKey();
    }

    function enableAdvancedMode(){
      if (isAdvancedModeEnabled || currentAreaName !== "Custom") return;
      const state = getCustomStateForCurrent();
      if (state) {
        advancedCustomBackups[advancedBackupKey()] = { ...state };
      }
      isAdvancedModeEnabled = true;
      setCustomControlsDisabled(true);
      if (customPanel) customPanel.setAttribute("data-advanced-mode", "true");
      clampAdvancedPagesToBounds();
      syncAllAdvancedCards();
      updateCanvasOverlay();
    }

    function disableAdvancedMode(){
      if (!isAdvancedModeEnabled) return;
      isAdvancedModeEnabled = false;
      setCustomControlsDisabled(false);
      if (customPanel) customPanel.removeAttribute("data-advanced-mode");
      const backup = advancedCustomBackups[advancedBackupKey()];
      if (backup) {
        customCurrentByKey[customKey()] = { ...backup };
        syncCustomInputsFromState();
        updateAreaSizeLabels();
      }
      updateCanvasOverlay();
    }

    function setCustomControlsDisabled(disabled){
      Object.values(customInputs).forEach((input) => {
        if (input) input.disabled = disabled;
      });
      Object.values(customRanges).forEach((range) => {
        if (range) range.disabled = disabled;
      });
      customSteppers.forEach((btn) => {
        btn.disabled = disabled;
      });
      [customCenterHBtn, customCenterVBtn, customResetBtn, customFrameToggleBtn].forEach((btn) => {
        if (btn) btn.disabled = disabled;
      });
    }

    function setCustomStateForCurrent(next){
      ensureCustomStateForCurrent();
      const key = customKey();
      if (!customCurrentByKey[key]) return;
      customCurrentByKey[key] = { ...customCurrentByKey[key], ...next };
      clampAdvancedPagesToBounds();
      syncAllAdvancedCards();
      syncCustomInputsFromState();
      updateCanvasOverlay();
      updateAreaSizeLabels();
    }

    function setCustomFromRelative(field, value){
      const bounds = getCustomBoundsForCurrent();
      const state = getCustomStateForCurrent();
      if (!bounds || !state) return;

      const maxWidth = bounds.maxX - bounds.minX;
      const maxHeight = bounds.maxY - bounds.minY;
      let relX = state.x - bounds.minX;
      let relY = state.y - bounds.minY;
      let relW = state.width;
      let relH = state.height;

      let v = Number(value);
      if (!Number.isFinite(v)) v = 0;

      switch (field) {
        case "x": relX = v; break;
        case "y": relY = v; break;
        case "width": relW = v; break;
        case "height": relH = v; break;
      }

      if (relW < 1) relW = 1;
      if (relH < 1) relH = 1;
      if (maxWidth && relW > maxWidth) relW = maxWidth;
      if (maxHeight && relH > maxHeight) relH = maxHeight;
      if (relX < 0) relX = 0;
      if (relY < 0) relY = 0;
      if (maxWidth && relX + relW > maxWidth) relX = maxWidth - relW;
      if (maxHeight && relY + relH > maxHeight) relY = maxHeight - relH;

      setCustomStateForCurrent({
        x: bounds.minX + relX,
        y: bounds.minY + relY,
        width: relW,
        height: relH
      });
    }

    function getAreasForCurrent(){
      const prod = ProductMediaAreas[currentProductCode];
      if (!prod) return [];
      const raw = prod[sideKey()] || [];
      const areas = raw.map((area) => ({ ...area }));
      const customState = getCustomStateForCurrent();
      if (customState) {
        for (let i = 0; i < areas.length; i += 1) {
          if (areas[i].areaType === "custom_max") {
            areas[i].x = customState.x;
            areas[i].y = customState.y;
            areas[i].width = customState.width;
            areas[i].height = customState.height;
            break;
          }
        }
      }
      return areas;
    }

    function getActiveArea(){
      const areas = getAreasForCurrent();
      if (!areas.length) return null;
      return areas.find((a) => a.areaName === currentAreaName) || areas[0];
    }

    function getPpiForCurrentSide(){
      const cfg = ProductPpiConfig[currentProductCode];
      const ppi = cfg ? (currentSide === "back" ? cfg.back : cfg.front) : null;
      if (!ppi || !Number.isFinite(ppi) || ppi <= 0) return null;
      return ppi;
    }

    function describeAreaInches(area){
      if (!area) return null;
      const ppi = getPpiForCurrentSide() || area.ppiUsed;
      if (!ppi || !Number.isFinite(ppi)) return null;
      let wIn = area.width / ppi;
      let hIn = area.height / ppi;
      if (!Number.isFinite(wIn) || !Number.isFinite(hIn)) return null;
      wIn = Math.floor(wIn * 100) / 100;
      hIn = Math.floor(hIn * 100) / 100;
      return {
        widthIn: wIn,
        heightIn: hIn,
        label: `${wIn.toFixed(2)} in × ${hIn.toFixed(2)} in`
      };
    }

    function updateMetaLabels(){
      if (metaSideEl) metaSideEl.textContent = currentSide === "back" ? "Back" : "Front";
      if (metaAreaEl) metaAreaEl.textContent = currentAreaName || "—";
      if (customPanel) {
        customPanel.setAttribute("data-custom-active", currentAreaName === "Custom" ? "true" : "false");
      }
      refreshAdvancedPanel();
    }

    function updateAreaSizeLabels(){
      const activeArea = getActiveArea();
      const inches = activeArea ? describeAreaInches(activeArea) : null;
      const label = inches ? inches.label : "—";
      if (previewAreaSizeDisplay) previewAreaSizeDisplay.textContent = label;
      if (previewAreaSizeEl) previewAreaSizeEl.textContent = label;

      const customState = getCustomStateForCurrent();
      let source = activeArea;
      if (currentAreaName === "Custom" && customState) {
        source = { width: customState.width, height: customState.height };
      }
      const customInches = source ? describeAreaInches(source) : null;
      if (customHeaderTitleEl) {
        const sideLabel = currentSide === "back" ? "Back" : "Front";
        const sizeLabel = customInches ? customInches.label : "—";
        customHeaderTitleEl.textContent = `Custom Canvas - ${sideLabel} - ${sizeLabel}`;
      }
    }

    function syncCustomInputsFromState(){
      const state = getCustomStateForCurrent();
      if (!state) return;
      const bounds = getCustomBoundsForCurrent();
      let relX = state.x;
      let relY = state.y;
      let relW = state.width;
      let relH = state.height;
      let maxWidth = null;
      let maxHeight = null;
      if (bounds) {
        maxWidth = bounds.maxX - bounds.minX;
        maxHeight = bounds.maxY - bounds.minY;
        relX = state.x - bounds.minX;
        relY = state.y - bounds.minY;
      }
      if (customInputs.x) customInputs.x.value = Math.round(relX);
      if (customInputs.y) customInputs.y.value = Math.round(relY);
      if (customInputs.width) customInputs.width.value = Math.round(relW);
      if (customInputs.height) customInputs.height.value = Math.round(relH);
      if (bounds) {
        if (customRanges.x) {
          customRanges.x.min = 0;
          customRanges.x.max = maxWidth;
          customRanges.x.value = Math.round(relX);
        }
        if (customRanges.y) {
          customRanges.y.min = 0;
          customRanges.y.max = maxHeight;
          customRanges.y.value = Math.round(relY);
        }
        if (customRanges.width) {
          customRanges.width.min = 1;
          customRanges.width.max = maxWidth;
          customRanges.width.value = Math.round(relW);
        }
        if (customRanges.height) {
          customRanges.height.min = 1;
          customRanges.height.max = maxHeight;
          customRanges.height.value = Math.round(relH);
        }
      }
    }

    const MIN_PAGE_SIZE = 24;
    const ADVANCED_PAGE_PRESETS = [
      { id: "page1", label: "Page 1", description: "Top Left", anchorX: "left", anchorY: "top", defaultEnabled: true },
      { id: "page2", label: "Page 2", description: "Top Right", anchorX: "right", anchorY: "top", defaultEnabled: true },
      { id: "page3", label: "Page 3", description: "Bottom Left", anchorX: "left", anchorY: "bottom", defaultEnabled: true },
      { id: "page4", label: "Page 4", description: "Bottom Right", anchorX: "right", anchorY: "bottom", defaultEnabled: true }
    ];

    function updateAdvancedSummary(){
      if (!advancedSummary) return;
      if (!isAdvancedPanelOpen) {
        advancedSummary.textContent = "Open Advanced to manage pages.";
        return;
      }
      if (!isAdvancedModeEnabled || currentAreaName !== "Custom") {
        advancedSummary.textContent = "Switch to the Custom area to manage pages.";
        return;
      }
      const pages = ensureAdvancedPagesForCurrent();
      const enabledCount = pages.filter((page) => page.enabled).length;
      advancedSummary.textContent = `${enabledCount}/4 pages enabled`;
    }

    function refreshAdvancedPanel(){
      if (!advancedPanel) return;
      const isCustomArea = currentAreaName === "Custom";
      if (advancedDisabled) {
        advancedDisabled.hidden = isAdvancedPanelOpen && isCustomArea;
      }

      if (isAdvancedPanelOpen && isCustomArea) {
        enableAdvancedMode();
        ensureAdvancedPagesForCurrent();
        Object.values(advancedPageCards).forEach(({ card, toggle }) => {
          card.classList.remove("is-readonly");
          if (toggle) toggle.disabled = false;
        });
        syncAllAdvancedCards();
        showAdvancedWarning("");
      } else {
        disableAdvancedMode();
        Object.values(advancedPageCards).forEach(({ card, toggle }) => {
          card.classList.add("is-readonly");
          if (toggle) toggle.disabled = true;
        });
        if (advancedWarning) {
          advancedWarning.hidden = true;
          advancedWarning.textContent = "";
        }
        syncAllAdvancedCards();
      }

      updateAdvancedSummary();
    }

    function syncAllAdvancedCards(){
      Object.keys(advancedPageCards).forEach((pageId) => syncAdvancedCard(pageId));
    }

    function syncAdvancedCard(pageId){
      const ui = advancedPageCards[pageId];
      if (!ui) return;
      const pages = ensureAdvancedPagesForCurrent();
      const page = pages.find((p) => p.id === pageId);
      if (!page) return;
      const isCustomArea = currentAreaName === "Custom" && isAdvancedModeEnabled;
      const bounds = getCustomBoundsForCurrent();

      if (ui.toggle) {
        ui.toggle.checked = Boolean(page.enabled);
        ui.toggle.disabled = !isCustomArea;
      }

      ui.card.classList.toggle("is-readonly", !isCustomArea);

      Object.values(ui.inputs).forEach((input) => {
        if (input) input.disabled = !isCustomArea;
      });
      Object.values(ui.ranges).forEach((range) => {
        if (range) range.disabled = !isCustomArea;
      });
      ui.steppers?.forEach((btn) => {
        btn.disabled = !isCustomArea;
      });
      ui.centers?.forEach((btn) => {
        btn.disabled = !isCustomArea;
      });

      if (!isCustomArea || !bounds) {
        if (ui.sizeLabel) ui.sizeLabel.textContent = isCustomArea ? "—" : "Custom area only";
        return;
      }

      const totalWidth = bounds.maxX - bounds.minX;
      const totalHeight = bounds.maxY - bounds.minY;
      const relX = page.x - bounds.minX;
      const relY = page.y - bounds.minY;
      const relW = page.width;
      const relH = page.height;

      if (ui.sizeLabel) {
        ui.sizeLabel.textContent = page.enabled
          ? `${Math.round(page.width)} × ${Math.round(page.height)} px`
          : "Disabled";
      }

      ["x","y","width","height"].forEach((field) => {
        const input = ui.inputs[field];
        const range = ui.ranges[field];
        let value = 0;
        if (field === "x") value = relX;
        else if (field === "y") value = relY;
        else if (field === "width") value = relW;
        else if (field === "height") value = relH;

        if (input) input.value = Math.round(value);

        if (range) {
          if (field === "x") {
            range.min = 0;
            range.max = Math.max(0, totalWidth - relW);
          } else if (field === "y") {
            range.min = 0;
            range.max = Math.max(0, totalHeight - relH);
          } else if (field === "width") {
            const widthMin = Math.min(MIN_PAGE_SIZE, totalWidth);
            range.min = widthMin;
            range.max = Math.max(widthMin, totalWidth - relX);
          } else if (field === "height") {
            const heightMin = Math.min(MIN_PAGE_SIZE, totalHeight);
            range.min = heightMin;
            range.max = Math.max(heightMin, totalHeight - relY);
          }
          range.value = Math.round(value);
        }
      });
    }

    function handleAdvancedToggle(pageId, enabled){
      const pages = ensureAdvancedPagesForCurrent();
      const page = pages.find((p) => p.id === pageId);
      if (!page) return;
      if (currentAreaName !== "Custom") {
        syncAdvancedCard(pageId);
        return;
      }
      if (enabled) {
        const overlaps = pages.some(
          (other) => other.id !== pageId && other.enabled && rectsOverlap(page, other)
        );
        if (overlaps) {
          showAdvancedWarning("Unable to enable this page because it overlaps another active page.");
          syncAdvancedCard(pageId);
          return;
        }
      }
      page.enabled = enabled;
      showAdvancedWarning("");
      syncAdvancedCard(pageId);
      updateAdvancedSummary();
      updateCanvasOverlay();
    }

    function centerAdvancedPage(pageId, axis){
      if (currentAreaName !== "Custom") return;
      const bounds = getCustomBoundsForCurrent();
      const pages = ensureAdvancedPagesForCurrent();
      const page = pages.find((p) => p.id === pageId);
      if (!bounds || !page) return;
      const totalWidth = bounds.maxX - bounds.minX;
      const totalHeight = bounds.maxY - bounds.minY;
      if (axis === "x") {
        const relX = (totalWidth - page.width) / 2;
        setAdvancedFromRelative(pageId, "x", relX);
      } else if (axis === "y") {
        const relY = (totalHeight - page.height) / 2;
        setAdvancedFromRelative(pageId, "y", relY);
      }
    }

    function showAdvancedWarning(message){
      if (!advancedWarning) return;
      if (!message) {
        advancedWarning.hidden = true;
        advancedWarning.textContent = "";
      } else {
        advancedWarning.hidden = false;
        advancedWarning.textContent = message;
      }
    }

    function setAdvancedFromRelative(pageId, field, value){
      if (currentAreaName !== "Custom") return;
      const bounds = getCustomBoundsForCurrent();
      const pages = ensureAdvancedPagesForCurrent();
      const page = pages.find((p) => p.id === pageId);
      if (!bounds || !page) return;
      const totalWidth = bounds.maxX - bounds.minX;
      const totalHeight = bounds.maxY - bounds.minY;
      const minWidth = Math.min(MIN_PAGE_SIZE, totalWidth);
      const minHeight = Math.min(MIN_PAGE_SIZE, totalHeight);
      let relX = page.x - bounds.minX;
      let relY = page.y - bounds.minY;
      let relW = page.width;
      let relH = page.height;
      let v = Number(value);
      if (!Number.isFinite(v)) v = 0;

      switch (field) {
        case "x": relX = v; break;
        case "y": relY = v; break;
        case "width": relW = v; break;
        case "height": relH = v; break;
      }

      if (relW < minWidth) relW = minWidth;
      if (relH < minHeight) relH = minHeight;
      if (relX < 0) relX = 0;
      if (relY < 0) relY = 0;
      if (relX + relW > totalWidth) {
        if (field === "width") {
          relW = totalWidth - relX;
        } else {
          relX = totalWidth - relW;
        }
      }
      if (relY + relH > totalHeight) {
        if (field === "height") {
          relH = totalHeight - relY;
        } else {
          relY = totalHeight - relH;
        }
      }

      const candidate = {
        id: page.id,
        name: page.name,
        enabled: page.enabled,
        x: bounds.minX + relX,
        y: bounds.minY + relY,
        width: relW,
        height: relH
      };

      if (candidate.width < minWidth || candidate.height < minHeight) {
        syncAdvancedCard(pageId);
        return;
      }

      const overlaps = pages.some(
        (other) => other.id !== page.id && other.enabled && rectsOverlap(candidate, other)
      );
      if (overlaps) {
        showAdvancedWarning("Pages cannot overlap. Adjust spacing or size.");
        syncAdvancedCard(pageId);
        return;
      }

      showAdvancedWarning("");
      Object.assign(page, candidate);
      syncAdvancedCard(pageId);
      updateCanvasOverlay();
    }

    function rectsOverlap(a, b){
      return a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
    }

    function clampRectToBounds(rect, bounds){
      const totalWidth = bounds.maxX - bounds.minX;
      const totalHeight = bounds.maxY - bounds.minY;
      const minWidth = Math.min(MIN_PAGE_SIZE, totalWidth);
      const minHeight = Math.min(MIN_PAGE_SIZE, totalHeight);
      let width = Math.min(Math.max(rect.width, minWidth), totalWidth);
      let height = Math.min(Math.max(rect.height, minHeight), totalHeight);
      let x = Math.max(bounds.minX, Math.min(bounds.maxX - width, rect.x));
      let y = Math.max(bounds.minY, Math.min(bounds.maxY - height, rect.y));
      if (x + width > bounds.maxX) x = bounds.maxX - width;
      if (y + height > bounds.maxY) y = bounds.maxY - height;
      return { ...rect, x, y, width, height };
    }


    function updateSideButtons(){
      sideButtons.forEach((btn) => {
        const isActive = btn.dataset.side === currentSide;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-pressed", String(isActive));
      });
      updateMetaLabels();
    }

    function updatePreview(){
      const media = DefaultProductMedia[currentProductCode];
      if (!media) return;
      const path = currentSide === "back" ? media.back : media.front;
      if (!path || !previewImg) return;
      previewImg.src = path;
      previewImg.alt = `${media.colorName || media.colorCode || currentProductCode} - ${currentSide === "front" ? "Front" : "Back"} preview`;
      updateSideButtons();
      if (previewImg.complete && previewImg.naturalWidth) {
        refreshAreaOptions();
      }
    }

    function updateCanvasOverlay(){
      if (!overlaySvg || !previewImg || !previewImg.naturalWidth) return;
      const areas = getAreasForCurrent();
      overlaySvg.innerHTML = "";
      if (!areas.length) {
        updateAreaSizeLabels();
        return;
      }

      let area = areas.find((a) => a.areaName === currentAreaName);
      if (!area) {
        area = areas[0];
        currentAreaName = area.areaName;
        if (areaSelect) areaSelect.value = currentAreaName;
        updateMetaLabels();
      }

      overlaySvg.setAttribute("viewBox", `0 0 ${previewImg.naturalWidth} ${previewImg.naturalHeight}`);
      const ns = "http://www.w3.org/2000/svg";

      if (area.areaType === "custom_max") {
        const bounds = getCustomBoundsForCurrent();
        const state = getCustomStateForCurrent();
        const usingAdvancedPages = isAdvancedModeEnabled && currentAreaName === "Custom";
        const advancedPages = usingAdvancedPages
          ? getAdvancedPagesForCurrent().filter((page) => page.enabled)
          : [];
        if (bounds && isCustomFrameEnabled) {
          const maxRect = document.createElementNS(ns, "rect");
          maxRect.setAttribute("x", bounds.minX);
          maxRect.setAttribute("y", bounds.minY);
          maxRect.setAttribute("width", bounds.maxX - bounds.minX);
          maxRect.setAttribute("height", bounds.maxY - bounds.minY);
          maxRect.setAttribute("rx", "8");
          maxRect.setAttribute("ry", "8");
          maxRect.setAttribute("fill", "none");
          maxRect.setAttribute("stroke", "#ffffff");
          maxRect.setAttribute("stroke-width", "2");
          maxRect.setAttribute("stroke-dasharray", "6 4");
          overlaySvg.appendChild(maxRect);
        }
        if (!usingAdvancedPages) {
          const src = state || {
            x: area.x,
            y: area.y,
            width: area.width,
            height: area.height
          };
          const currentRect = document.createElementNS(ns, "rect");
          currentRect.setAttribute("x", src.x);
          currentRect.setAttribute("y", src.y);
          currentRect.setAttribute("width", src.width);
          currentRect.setAttribute("height", src.height);
          currentRect.setAttribute("rx", "8");
          currentRect.setAttribute("ry", "8");
          currentRect.setAttribute("fill", "#3bff9c");
          currentRect.setAttribute("fill-opacity", "0.18");
          currentRect.setAttribute("stroke", "#3bff9c");
          currentRect.setAttribute("stroke-width", "2");
          overlaySvg.appendChild(currentRect);
        }

        if (advancedPages.length) {
          const currentPage = getCurrentAdvancedPage();
          advancedPages.forEach((page) => {
            const pageRect = document.createElementNS(ns, "rect");
            pageRect.setAttribute("x", page.x);
            pageRect.setAttribute("y", page.y);
            pageRect.setAttribute("width", page.width);
            pageRect.setAttribute("height", page.height);
            pageRect.setAttribute("rx", "8");
            pageRect.setAttribute("ry", "8");
            pageRect.classList.add("preview-advanced-page");
            if (currentPage && currentPage.id === page.id) {
              pageRect.classList.add("is-current");
            }
            overlaySvg.appendChild(pageRect);
          });
        }
      } else {
        const rect = document.createElementNS(ns, "rect");
        rect.setAttribute("x", area.x);
        rect.setAttribute("y", area.y);
        rect.setAttribute("width", area.width);
        rect.setAttribute("height", area.height);
        rect.setAttribute("rx", "8");
        rect.setAttribute("ry", "8");
        rect.setAttribute("fill", "#3bff9c");
        rect.setAttribute("fill-opacity", "0.18");
        rect.setAttribute("stroke", "#3bff9c");
        rect.setAttribute("stroke-width", "2");
        overlaySvg.appendChild(rect);
      }
      updateAreaSizeLabels();
    }

    function refreshAreaOptions(){
      if (!areaSelect) return;
      const areas = getAreasForCurrent();
      areaSelect.innerHTML = "";
      if (!areas.length) {
        currentAreaName = null;
        updateCanvasOverlay();
        updateMetaLabels();
        return;
      }

      areas.forEach((area) => {
        const option = document.createElement("option");
        option.value = area.areaName;
        option.textContent = area.areaName;
        areaSelect.appendChild(option);
      });

      if (!currentAreaName || !areas.some((a) => a.areaName === currentAreaName)) {
        const preferred = areas.find((a) => a.areaName === "Default Preset") || areas[0];
        currentAreaName = preferred.areaName;
      }
      areaSelect.value = currentAreaName;
      updateMetaLabels();
      if (currentAreaName === "Custom") {
        syncCustomInputsFromState();
      }
      updateCanvasOverlay();
    }

    if (areaSelect) {
      areaSelect.addEventListener("change", () => {
        currentAreaName = areaSelect.value || null;
        updateMetaLabels();
        if (currentAreaName === "Custom") {
          syncCustomInputsFromState();
        }
        updateCanvasOverlay();
      });
    }

    sideButtons.forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        const nextSide = btn.dataset.side === "back" ? "back" : "front";
        if (nextSide === currentSide) return;
        currentSide = nextSide;
        updatePreview();
        refreshAreaOptions();
      });
    });

    ["x", "y", "width", "height"].forEach((key) => {
      const input = customInputs[key];
      const slider = customRanges[key];
      if (input) {
        input.addEventListener("input", () => {
          const raw = parseFloat(input.value);
          if (!Number.isFinite(raw)) return;
          setCustomFromRelative(key, Math.round(raw));
          if (slider) slider.value = input.value;
        });
      }
      if (slider) {
        slider.addEventListener("input", () => {
          const raw = parseFloat(slider.value);
          if (!Number.isFinite(raw)) return;
          const val = Math.round(raw);
          slider.value = String(val);
          if (input) input.value = String(val);
          setCustomFromRelative(key, val);
        });
      }
    });

    if (advancedToggleBtn && advancedPanel) {
      advancedToggleBtn.addEventListener("click", () => {
        isAdvancedPanelOpen = !isAdvancedPanelOpen;
        advancedPanel.hidden = !isAdvancedPanelOpen;
        advancedToggleBtn.setAttribute("aria-expanded", isAdvancedPanelOpen ? "true" : "false");
        refreshAdvancedPanel();
        updateCanvasOverlay();
      });
    }

    root.querySelectorAll("[data-custom-step]").forEach((btn) => {
      const field = btn.getAttribute("data-field");
      let step = parseFloat(btn.getAttribute("data-step"));
      if (!Number.isFinite(step) || step === 0) step = 1;
      let holdTimer = null;

      const applyStep = () => {
        const input = customInputs[field];
        if (!input) return;
        const current = parseFloat(input.value) || 0;
        const next = current + step;
        input.value = String(next);
        const slider = customRanges[field];
        if (slider) slider.value = String(next);
        setCustomFromRelative(field, next);
      };

      const startHold = (event) => {
        event.preventDefault();
        applyStep();
        holdTimer = setInterval(applyStep, 180);
      };

      const stopHold = () => {
        if (holdTimer) {
          clearInterval(holdTimer);
          holdTimer = null;
        }
      };

      btn.addEventListener("mousedown", startHold);
      btn.addEventListener("touchstart", startHold, { passive: false });
      ["mouseup", "mouseleave", "touchend", "touchcancel"].forEach((evt) => {
        btn.addEventListener(evt, stopHold);
      });
      btn.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          applyStep();
        }
      });
    });

    if (customCenterHBtn) {
      customCenterHBtn.addEventListener("click", () => {
        const bounds = getCustomBoundsForCurrent();
        const state = getCustomStateForCurrent();
        if (!bounds || !state) return;
        const maxWidth = bounds.maxX - bounds.minX;
        const relW = state.width;
        const target = (maxWidth - relW) / 2;
        setCustomFromRelative("x", target);
      });
    }

    if (customCenterVBtn) {
      customCenterVBtn.addEventListener("click", () => {
        const bounds = getCustomBoundsForCurrent();
        const state = getCustomStateForCurrent();
        if (!bounds || !state) return;
        const maxHeight = bounds.maxY - bounds.minY;
        const relH = state.height;
        const target = (maxHeight - relH) / 2;
        setCustomFromRelative("y", target);
      });
    }

    if (customFrameToggleBtn) {
      customFrameToggleBtn.setAttribute("aria-pressed", "true");
      customFrameToggleBtn.addEventListener("click", () => {
        isCustomFrameEnabled = !isCustomFrameEnabled;
        customFrameToggleBtn.setAttribute("aria-pressed", isCustomFrameEnabled ? "true" : "false");
        updateCanvasOverlay();
      });
    }

    if (customResetBtn) {
      customResetBtn.addEventListener("click", () => {
        const bounds = getCustomBoundsForCurrent();
        if (!bounds) return;
        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;
        setCustomStateForCurrent({
          x: bounds.minX,
          y: bounds.minY,
          width,
          height
        });
      });
    }

    if (previewImg) {
      previewImg.addEventListener("load", () => {
        refreshAreaOptions();
      });
    }

    updatePreview();
    refreshAreaOptions();

  }
})();
