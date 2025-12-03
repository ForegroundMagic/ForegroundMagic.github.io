(function () {
  window.PanelModules = window.PanelModules || {};

  window.PanelModules["canvas-settings-panel"] = function initCanvasSettingsPanel(root) {
    if (!root) return;

    const DEFAULT_PRODUCT_CODE = "3001C_BC_UJSST";
    const DEFAULT_AREA_NAME = "Default Preset";
    const DEFAULT_COLOR_CODE = "canvas_red";
    const DEFAULT_PRODUCT_SIZE = "L";

    const clone = (value) => JSON.parse(JSON.stringify(value));

    // Fallback export canvas template (mirrors Export panel sample)
    const DEFAULT_CANVAS_TEMPLATE = {
      id: "front-default-canvas",
      side: "front",
      presetName: "Default Preset",
      x: 400.5,
      y: 226,
      width: 360,
      height: 477,
      layers: [
        {
          id: "layer-1",
          type: "svg",
          objectId: "logo-main",
          x: 100,
          y: 120,
          width: 200,
          height: 200,
          scale: 1,
          rotation: 0,
          opacity: 1,
          color: "#FFFFFF",
          zIndex: 1,
          locked: false,
          visible: true,
          svg: {
            assetRef: "assets/logo-main.svg",
            viewBox: "0 0 100 100",
            preserveAspectRatio: "xMidYMid meet",
            content: "<path d='M10 10L90 10L50 90Z' />"
          }
        },
        {
          id: "layer-2",
          type: "text",
          objectId: "headline-1",
          x: 150,
          y: 380,
          width: 400,
          height: 80,
          scale: 1,
          rotation: 0,
          opacity: 1,
          color: "#FFFFFF",
          zIndex: 2,
          locked: false,
          visible: true,
          text: {
            content: "YOUR CUSTOM TEXT",
            fontFamily: "Arial",
            fontSize: 32,
            fontWeight: "bold",
            fontStyle: "normal",
            letterSpacing: 0,
            lineHeight: 1.2,
            textAlign: "center",
            textTransform: "uppercase",
            decoration: "none"
          }
        }
      ]
    };

    const DEFAULT_SIDE_TEMPLATES = [
      {
        id: "front",
        name: "Front",
        enabled: true,
        canvases: [clone(DEFAULT_CANVAS_TEMPLATE)]
      },
      {
        id: "back",
        name: "Back",
        enabled: true,
        canvases: [
          clone({
            ...DEFAULT_CANVAS_TEMPLATE,
            id: "back-default-canvas",
            side: "back"
          })
        ]
      }
    ];

    const templateStore = window.DesignTemplateStore;

    const normalizeSideId = (value) => String(value || "front").toLowerCase();

    const getTemplateData = () => {
      const data = templateStore?.get?.();
      if (data?.product && data.design?.sides?.length) return data;
      if (Array.isArray(data?.design?.canvases)) {
        const sides = {};
        data.design.canvases.forEach((canvas, index) => {
          const sideId = String(canvas.side || "front").toLowerCase();
          if (!sides[sideId]) {
            sides[sideId] = {
              id: sideId,
              name: sideId === "back" ? "Back" : "Front",
              enabled: true,
              canvases: []
            };
          }
          sides[sideId].canvases.push(clone(canvas));
        });

        return {
          product: data.product,
          design: { sides: Object.values(sides) }
        };
      }
      return {
        product: {
          code: DEFAULT_PRODUCT_CODE,
          size: DEFAULT_PRODUCT_SIZE,
          color: DEFAULT_COLOR_CODE
        },
        design: { sides: clone(DEFAULT_SIDE_TEMPLATES) }
      };
    };

    // Snapshot of product_media_area table (SQLite) for quick front-end lookup.
    const PRODUCT_MEDIA_AREA_TABLE = [
      {
        productCode: "3001C_BC_UJSST",
        side: "Back",
        areaName: "Full",
        areaType: "standard",
        x: 360.5,
        y: 178.5,
        width: 440.0,
        height: 583.0,
        widthInches: 11.41,
        heightInches: 15.11
      },
      {
        productCode: "3001C_BC_UJSST",
        side: "Back",
        areaName: "Default Preset",
        areaType: "standard",
        x: 400.5,
        y: 226.0,
        width: 360.0,
        height: 477.0,
        widthInches: 9.33,
        heightInches: 12.37
      },
      {
        productCode: "3001C_BC_UJSST",
        side: "Back",
        areaName: "Yoke",
        areaType: "standard",
        x: 531.0,
        y: 104.5,
        width: 100.0,
        height: 132.0,
        widthInches: 2.59,
        heightInches: 3.42
      },
      {
        productCode: "3001C_BC_UJSST",
        side: "Front",
        areaName: "Full",
        areaType: "standard",
        x: 360.5,
        y: 178.5,
        width: 440.0,
        height: 583.0,
        widthInches: 11.41,
        heightInches: 15.11
      },
      {
        productCode: "3001C_BC_UJSST",
        side: "Front",
        areaName: "Default Preset",
        areaType: "standard",
        x: 400.5,
        y: 226.0,
        width: 360.0,
        height: 477.0,
        widthInches: 9.33,
        heightInches: 12.37
      },
      {
        productCode: "3001C_BC_UJSST",
        side: "Front",
        areaName: "Left Chest Tall",
        areaType: "standard",
        x: 677.0,
        y: 180.0,
        width: 110.0,
        height: 145.0,
        widthInches: 2.85,
        heightInches: 3.76
      },
      {
        productCode: "3001C_BC_UJSST",
        side: "Front",
        areaName: "Left Chest",
        areaType: "standard",
        x: 684.5,
        y: 190.0,
        width: 95.0,
        height: 125.0,
        widthInches: 2.46,
        heightInches: 3.24
      },
      {
        productCode: "3001C_BC_UJSST",
        side: "Front",
        areaName: "Right Chest Tall",
        areaType: "standard",
        x: 374.0,
        y: 180.0,
        width: 110.0,
        height: 145.0,
        widthInches: 2.85,
        heightInches: 3.76
      },
      {
        productCode: "3001C_BC_UJSST",
        side: "Front",
        areaName: "Right Chest",
        areaType: "standard",
        x: 381.5,
        y: 190.0,
        width: 95.0,
        height: 125.0,
        widthInches: 2.46,
        heightInches: 3.24
      }
    ];

    // Default color previews pulled from product_default_color + product_color_assets.
    const PRODUCT_DEFAULT_COLORS = {
      "3001C_BC_UJSST": {
        colorCode: "canvas_red",
        colorName: "Canvas Red",
        front: "shop/products/3001C_BC_UJSST/color/product/33_canvas_red_front.png",
        back: "shop/products/3001C_BC_UJSST/color/product/33_canvas_red_back.png"
      }
    };

    const groupProductAreasBySide = (productCode) => {
      const rows = PRODUCT_MEDIA_AREA_TABLE.filter((row) => row.productCode === productCode);
      if (!rows.length) return {};
      return rows.reduce((acc, row) => {
        const id = normalizeSideId(row.side);
        if (!id) return acc;
        acc[id] = acc[id] || [];
        acc[id].push({ ...row });
        return acc;
      }, {});
    };

    const formatSideLabel = (value, fallbackId = "side") => {
      if (typeof value === "string" && value.trim()) return value.trim();
      const safe = String(fallbackId || "side");
      return safe.charAt(0).toUpperCase() + safe.slice(1);
    };

    const sideTabsContainer = root.querySelector("[data-side-tabs]");
    const areaSelect = root.querySelector("[data-area-select]");
    const sizeLabel = root.querySelector("[data-area-size]");
    const canvasSizeLabel = root.querySelector("[data-canvas-size]");
    const headerSizeLabel = root.querySelector("[data-active-size]");
    const sideHeading = root.querySelector("[data-side-heading]");
    const canvasTitle = root.querySelector("[data-canvas-title]");
    const sideEnableToggle = root.querySelector("#sideEnableToggle");
    const previewImg = root.querySelector("[data-preview-img]");
    const previewStage = root.querySelector(".canvas-preview-stage");
    const overlaySvg = root.querySelector(".canvas-area-overlay");
    const overlayRect = root.querySelector(".canvas-area-overlay .canvas-area-rect");
    const saveButton = root.querySelector("[data-save-canvas]");
    const saveToast = root.querySelector("[data-save-toast]");
    const frameToggleInputs = [root.querySelector("#canvasShowToggle"), root.querySelector("#customFrameToggle")].filter(
      Boolean
    );

    const inputs = {
      x: root.querySelector("#customX"),
      y: root.querySelector("#customY"),
      width: root.querySelector("#customW"),
      height: root.querySelector("#customH")
    };

    const ranges = {
      x: root.querySelector("#customXRange"),
      y: root.querySelector("#customYRange"),
      width: root.querySelector("#customWRange"),
      height: root.querySelector("#customHRange")
    };

    const lockManualControls = () => {
      Object.values(inputs).forEach((input) => {
        if (input) input.disabled = true;
      });
      Object.values(ranges).forEach((range) => {
        if (range) range.disabled = true;
      });
      const stepButtons = root.querySelectorAll("[data-custom-step], #customCenterHBtn, #customCenterVBtn");
      stepButtons.forEach((btn) => {
        btn.disabled = true;
      });
    };
    lockManualControls();

    const globalStore = (window.CanvasSettingsStore = window.CanvasSettingsStore || {});

    const state = {
      productCode: DEFAULT_PRODUCT_CODE,
      side: "front",
      presetName: DEFAULT_AREA_NAME,
      colorCode: DEFAULT_COLOR_CODE,
      size: DEFAULT_PRODUCT_SIZE,
      presetBySide: {},
      enabledSides: {},
      sideAreas: {},
      sideLabels: {},
      showArea: true
    };
    let saveFeedbackTimer = null;

    const applyTemplateToState = (templateData) => {
      if (!templateData) return;
      const product = templateData.product || {};
      const sides = Array.isArray(templateData.design?.sides) ? templateData.design.sides : [];
      const primarySide =
        sides.find((side) => side.enabled && Array.isArray(side.canvases) && side.canvases.length) ||
        sides[0] ||
        null;
      const primaryCanvas = primarySide?.canvases?.[0] || null;
      if (Array.isArray(sides)) {
        sides.forEach((side, index) => {
          const id = normalizeSideId(side.id || side.side || `side-${index + 1}`);
          if (!id) return;
          state.enabledSides[id] = typeof side.enabled === "boolean" ? side.enabled : true;
          const firstCanvas = Array.isArray(side.canvases) ? side.canvases[0] : null;
          const presetName =
            firstCanvas?.presetName || firstCanvas?.areaName || state.presetBySide[id] || DEFAULT_AREA_NAME;
          state.presetBySide[id] = presetName;
        });
      }
      state.productCode = product.code || state.productCode;
      state.colorCode = product.color || state.colorCode;
      state.size = product.size || state.size;
      if (primarySide) {
        state.side = normalizeSideId(primarySide.id || primarySide.side || state.side || "front");
        state.enabledSides[state.side] = typeof primarySide.enabled === "boolean" ? primarySide.enabled : true;
      }
      if (primaryCanvas) {
        state.presetName =
          primaryCanvas.presetName || primaryCanvas.areaName || state.presetName || DEFAULT_AREA_NAME;
        state.presetBySide[state.side] = state.presetName;
      }
      if (templateData.enabledSides && typeof templateData.enabledSides === "object") {
        state.enabledSides = { ...state.enabledSides, ...templateData.enabledSides };
      }
      if (templateData.presetBySide && typeof templateData.presetBySide === "object") {
        state.presetBySide = { ...state.presetBySide, ...templateData.presetBySide };
      }
      if (templateData.sideAreas) {
        state.sideAreas = clone(templateData.sideAreas);
      }
      if (templateData.sideLabels) {
        state.sideLabels = clone(templateData.sideLabels);
      }
      if (typeof templateData.showArea === "boolean") {
        state.showArea = templateData.showArea;
      }
    };

    const refreshSideCatalogFromTemplate = () => {
      const templateData = getTemplateData();
      const productCode = templateData.product?.code || state.productCode || DEFAULT_PRODUCT_CODE;
      const areasBySide = groupProductAreasBySide(productCode);
      const catalog = {};

      Object.entries(areasBySide).forEach(([sideId, list]) => {
        catalog[sideId] = {
          id: sideId,
          label: formatSideLabel(list[0]?.side, sideId),
          areas: list
        };
      });

      const templateSides = Array.isArray(templateData.design?.sides) ? templateData.design.sides : [];
      templateSides.forEach((side, index) => {
        const id = normalizeSideId(side.id || side.side || `side-${index + 1}`);
        if (!id) return;
        if (!catalog[id]) {
          catalog[id] = {
            id,
            label: formatSideLabel(side.name || side.side, id),
            areas: []
          };
        }
      });

      if (!Object.keys(catalog).length) {
        DEFAULT_SIDE_TEMPLATES.forEach((side) => {
          const id = normalizeSideId(side.id || side.side);
          catalog[id] = {
            id,
            label: formatSideLabel(side.name || side.side, id),
            areas: []
          };
        });
      }

      state.productCode = productCode;
      state.sideAreas = Object.fromEntries(Object.entries(catalog).map(([id, entry]) => [id, entry.areas || []]));
      state.sideLabels = Object.fromEntries(
        Object.entries(catalog).map(([id, entry]) => [id, entry.label || formatSideLabel(null, id)])
      );

      Object.entries(state.sideAreas).forEach(([sideId, areas]) => {
        if (!state.presetBySide[sideId] && Array.isArray(areas) && areas.length) {
          const defaultArea = areas.find((area) => area.areaName === DEFAULT_AREA_NAME) || areas[0];
          state.presetBySide[sideId] = defaultArea?.areaName || DEFAULT_AREA_NAME;
        }
      });

      if (!state.sideLabels[state.side]) {
        const [firstSide] = Object.keys(catalog);
        state.side = firstSide || state.side || "front";
      }

      if (!state.presetBySide[state.side]) {
        const defaultArea = (state.sideAreas[state.side] || [])[0];
        if (defaultArea?.areaName) {
          state.presetBySide[state.side] = defaultArea.areaName;
        }
      }

      if (!state.presetName) {
        state.presetName = state.presetBySide[state.side] || DEFAULT_AREA_NAME;
      }
    };

    applyTemplateToState(getTemplateData());
    applyTemplateToState(globalStore);
    refreshSideCatalogFromTemplate();

    const imageMeta = {
      naturalWidth: null,
      naturalHeight: null
    };

    const sideLabelForState = (sideId = state.side) => state.sideLabels[sideId] || formatSideLabel(sideId);

    const getTemplateSide = () => {
      const data = getTemplateData();
      const sides = Array.isArray(data?.design?.sides) ? data.design.sides : [];
      return sides.find((side) => normalizeSideId(side.id || side.side) === state.side) || null;
    };

    const buildFallbackAreaForSide = (sideId = state.side) => {
      const data = getTemplateData();
      const sides = Array.isArray(data?.design?.sides) ? data.design.sides : [];
      const templateSide = sides.find((side) => normalizeSideId(side.id || side.side) === sideId);
      const canvas = templateSide?.canvases?.[0];
      const fallbackCanvas =
        canvas ||
        clone({
          ...DEFAULT_CANVAS_TEMPLATE,
          id: `${sideId}-default-canvas`,
          side: sideId
        });

      if (!fallbackCanvas) return null;

      const label = fallbackCanvas.presetName || fallbackCanvas.areaName || DEFAULT_AREA_NAME;
      return {
        areaName: label,
        areaType: "standard",
        x: fallbackCanvas.x ?? 0,
        y: fallbackCanvas.y ?? 0,
        width: fallbackCanvas.width ?? 0,
        height: fallbackCanvas.height ?? 0,
        widthInches: null,
        heightInches: null
      };
    };

    const getAreas = () => {
      const presetAreas = state.sideAreas[state.side] || [];
      if (presetAreas.length) return presetAreas;

      const fallbackArea = buildFallbackAreaForSide(state.side);
      return fallbackArea ? [fallbackArea] : [];
    };
    const isSideEnabled = (sideId, fallback = true) => {
      const key = sideId || state.side;
      const value = state.enabledSides[key];
      if (typeof value === "boolean") return value;
      if (typeof fallback === "boolean") return fallback;
      return true;
    };

    const syncSideEnableToggle = () => {
      if (!sideEnableToggle) return;
      const enabled = isSideEnabled(state.side);
      sideEnableToggle.checked = enabled;
      sideEnableToggle.setAttribute("aria-pressed", String(enabled));
    };

    const syncFrameToggle = () => {
      frameToggleInputs.forEach((input) => {
        input.checked = state.showArea;
        input.setAttribute("aria-pressed", String(state.showArea));
      });
    };

    const getColorMeta = () => {
      const meta = PRODUCT_DEFAULT_COLORS[state.productCode];
      if (!meta) return null;
      if (state.colorCode && state.colorCode === meta.colorCode) return meta;
      return meta;
    };

    const getPreviewSrc = () => {
      const meta = getColorMeta();
      if (!meta) return null;
      const sideKey = normalizeSideId(state.side);
      return meta[sideKey] || meta.front || meta.back;
    };

    const pickDefaultPresetName = (areas) => {
      if (!areas.length) return null;
      const defaultArea = areas.find((area) => area.areaName === DEFAULT_AREA_NAME);
      return defaultArea?.areaName || areas[0].areaName;
    };

    const formatSizeLabel = (area) => {
      if (!area) return "—";
      const wIn = Number(area.widthInches);
      const hIn = Number(area.heightInches);
      if (Number.isFinite(wIn) && Number.isFinite(hIn)) {
        return `${wIn.toFixed(2)} in × ${hIn.toFixed(2)} in`;
      }
      if (Number.isFinite(area.width) && Number.isFinite(area.height)) {
        return `${Math.round(area.width)} px × ${Math.round(area.height)} px`;
      }
      return "—";
    };

    const getSideEntries = () => {
      const entries = Object.keys(state.sideLabels).map((id) => ({
        id,
        label: state.sideLabels[id],
        areas: state.sideAreas[id] || []
      }));

      return entries.sort((a, b) => {
        const order = ["front", "back"];
        const aIndex = order.indexOf(a.id);
        const bIndex = order.indexOf(b.id);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.label.localeCompare(b.label);
      });
    };

    const renderSideTabs = () => {
      if (!sideTabsContainer) return;
      sideTabsContainer.innerHTML = "";
      const sides = getSideEntries();
      sides.forEach((side) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `canvas-side-tab${state.side === side.id ? " is-active" : ""}`;
        btn.dataset.sideTab = side.id;
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", String(state.side === side.id));
        btn.textContent = side.label;
        sideTabsContainer.appendChild(btn);
      });
    };

    const renderAreaOptions = () => {
      if (!areaSelect) return;
      const label = sideLabelForState();
      if (sideHeading) sideHeading.textContent = label;
      if (canvasTitle) canvasTitle.textContent = `${label} canvas`;
      state.presetName = state.presetBySide[state.side] || state.presetName || DEFAULT_AREA_NAME;
      const areas = getAreas();
      const currentArea = areas.find((area) => area.areaName === state.presetName) || null;
      if (!currentArea) {
        state.presetName = pickDefaultPresetName(areas) || DEFAULT_AREA_NAME;
        state.presetBySide[state.side] = state.presetName;
      }

      areaSelect.innerHTML = "";
      areas.forEach((area) => {
        const option = document.createElement("option");
        option.value = area.areaName;
        option.textContent = area.areaName;
        option.selected = area.areaName === state.presetName;
        areaSelect.appendChild(option);
      });
    };

    const updateControls = () => {
      const areas = getAreas();
      const activeArea =
        areas.find((area) => area.areaName === state.presetName) ||
        areas.find((area) => area.areaName === DEFAULT_AREA_NAME) ||
        areas[0];

      if (!activeArea) {
        if (sizeLabel) sizeLabel.textContent = "—";
        if (canvasSizeLabel) canvasSizeLabel.textContent = "—";
        if (headerSizeLabel) headerSizeLabel.textContent = "—";
        return null;
      }

      const sizeText = formatSizeLabel(activeArea);
      if (sizeLabel) sizeLabel.textContent = sizeText;
      if (canvasSizeLabel) canvasSizeLabel.textContent = sizeText;
      if (headerSizeLabel) headerSizeLabel.textContent = sizeText;

      const numberTargets = [
        ["x", activeArea.x, 0],
        ["y", activeArea.y, 0],
        ["width", activeArea.width, 1],
        ["height", activeArea.height, 1]
      ];

      numberTargets.forEach(([key, value, min]) => {
        if (inputs[key]) {
          inputs[key].value = Number.isFinite(value) ? Math.round(value) : "";
          inputs[key].disabled = true;
        }
        if (ranges[key]) {
          ranges[key].min = String(min);
          const maxValue = Number.isFinite(value) ? Math.max(value, 1000) : 1000;
          ranges[key].max = String(Math.round(maxValue));
          ranges[key].value = Number.isFinite(value) ? Math.round(value) : "0";
          ranges[key].disabled = true;
        }
      });

      return activeArea;
    };

    const updateOverlay = (areaOverride = null) => {
      if (!overlayRect || !overlaySvg || !previewImg || !previewStage) return;

      const areas = getAreas();
      const activeArea =
        areaOverride ||
        areas.find((area) => area.areaName === state.presetName) ||
        areas.find((area) => area.areaName === DEFAULT_AREA_NAME) ||
        areas[0];

      const hasImage =
        previewImg.complete &&
        Number.isFinite(previewImg.naturalWidth) &&
        previewImg.naturalWidth > 0 &&
        Number.isFinite(previewImg.naturalHeight) &&
        previewImg.naturalHeight > 0;

      if (!activeArea || !hasImage) {
        overlayRect.setAttribute("width", 0);
        overlayRect.setAttribute("height", 0);
        return;
      }

      const stageBox = previewStage.getBoundingClientRect();
      const imgBox = previewImg.getBoundingClientRect();
      if (!stageBox.width || !stageBox.height || !imgBox.width || !imgBox.height) {
        overlayRect.setAttribute("width", 0);
        overlayRect.setAttribute("height", 0);
        return;
      }

      const naturalW = previewImg.naturalWidth;
      const naturalH = previewImg.naturalHeight;

      const scale = Math.min(imgBox.width / naturalW, imgBox.height / naturalH);
      const renderedW = naturalW * scale;
      const renderedH = naturalH * scale;

      const offsetX = (imgBox.width - renderedW) / 2 + (imgBox.left - stageBox.left);
      const offsetY = (imgBox.height - renderedH) / 2 + (imgBox.top - stageBox.top);

      const rectX = offsetX + activeArea.x * scale;
      const rectY = offsetY + activeArea.y * scale;
      const rectW = activeArea.width * scale;
      const rectH = activeArea.height * scale;

      overlaySvg.setAttribute("viewBox", `0 0 ${stageBox.width} ${stageBox.height}`);
      overlaySvg.setAttribute("width", stageBox.width);
      overlaySvg.setAttribute("height", stageBox.height);

      overlayRect.setAttribute("x", rectX);
      overlayRect.setAttribute("y", rectY);
      overlayRect.setAttribute("width", rectW);
      overlayRect.setAttribute("height", rectH);
      overlayRect.classList.toggle("is-outline-only", !state.showArea);
    };

    const updatePreviewImage = () => {
      if (!previewImg) return;
      const src = getPreviewSrc();
      if (src) {
        previewImg.src = src;
        const meta = getColorMeta();
        const colorLabel = meta?.colorName || meta?.colorCode || "Preview";
        const sideLabel = sideLabelForState();
        previewImg.alt = `${sideLabel} preview - ${colorLabel}`;
        if (previewImg.complete) {
          imageMeta.naturalWidth = previewImg.naturalWidth;
          imageMeta.naturalHeight = previewImg.naturalHeight;
          updateOverlay();
        }
      } else {
        previewImg.removeAttribute("src");
        previewImg.alt = "Preview unavailable";
      }
    };

    const persistState = () => {
      globalStore.productCode = state.productCode;
      globalStore.side = state.side;
      globalStore.presetName = state.presetName;
      globalStore.presetBySide = clone(state.presetBySide);
      globalStore.colorCode = state.colorCode;
      globalStore.size = state.size;
      globalStore.enabledSides = clone(state.enabledSides);
      globalStore.sideLabels = clone(state.sideLabels);
      globalStore.sideAreas = clone(state.sideAreas);
      globalStore.showArea = state.showArea;
    };

    const showSaveFeedback = () => {
      if (!saveToast) return;
      saveToast.hidden = false;
      saveToast.classList.add("is-visible");
      if (saveButton) {
        saveButton.classList.add("is-pressed");
      }
      if (saveFeedbackTimer) {
        clearTimeout(saveFeedbackTimer);
      }
      saveFeedbackTimer = setTimeout(() => {
        saveToast.classList.remove("is-visible");
        if (saveButton) {
          saveButton.classList.remove("is-pressed");
        }
        saveToast.hidden = true;
      }, 1600);
    };

    const getAreasForSide = (sideId = state.side) => {
      const areas = state.sideAreas[sideId] || [];
      if (areas.length) return areas;
      const fallbackArea = buildFallbackAreaForSide(sideId);
      return fallbackArea ? [fallbackArea] : [];
    };

    const getDefaultAreaForSide = (sideId = state.side) => {
      const areas = getAreasForSide(sideId);
      return areas.find((area) => area.areaName === DEFAULT_AREA_NAME) || areas[0] || null;
    };

    const buildCanvasPayload = (sideId, area, baseCanvas = DEFAULT_CANVAS_TEMPLATE) => {
      const preset = area?.areaName || baseCanvas.presetName || DEFAULT_AREA_NAME;
      const safeSide = normalizeSideId(sideId);
      const canvasId = `${safeSide}-${preset}`.replace(/\s+/g, "-").toLowerCase();
      return {
        ...clone(baseCanvas),
        id: canvasId,
        side: safeSide,
        presetName: preset,
        x: Math.round(area?.x ?? baseCanvas.x ?? 0),
        y: Math.round(area?.y ?? baseCanvas.y ?? 0),
        width: Math.round(area?.width ?? baseCanvas.width ?? 0),
        height: Math.round(area?.height ?? baseCanvas.height ?? 0),
        layers: clone(baseCanvas.layers || [])
      };
    };

    const mergeSidesWithCatalog = (sides) => {
      const map = {};
      const incoming = Array.isArray(sides) ? clone(sides) : [];
      incoming.forEach((side, index) => {
        const id = normalizeSideId(side.id || side.side || `side-${index + 1}`);
        if (!id) return;
        map[id] = {
          ...side,
          id,
          side: id,
          name: side.name || state.sideLabels[id] || formatSideLabel(id)
        };
      });

      Object.keys(state.sideLabels).forEach((sideId) => {
        if (!map[sideId]) {
          map[sideId] = {
            id: sideId,
            side: sideId,
            name: state.sideLabels[sideId] || formatSideLabel(sideId),
            enabled: isSideEnabled(sideId, true),
            canvases: []
          };
        }
      });

      if (!Object.keys(map).length) {
        DEFAULT_SIDE_TEMPLATES.forEach((side) => {
          const id = normalizeSideId(side.id || side.side);
          map[id] = {
            ...side,
            id,
            side: id,
            name: state.sideLabels[id] || side.name || formatSideLabel(id),
            canvases: side.canvases || []
          };
        });
      }

      return Object.values(map);
    };

    const pushExportData = (activeArea) => {
      const template = getTemplateData();
      const sides = mergeSidesWithCatalog(template.design?.sides);
      const activeSideId = normalizeSideId(state.side);
      const sideLabel = sideLabelForState(activeSideId);

      const baseSide =
        sides.find((side) => normalizeSideId(side.id || side.side) === activeSideId) ||
        clone({
          id: activeSideId,
          side: activeSideId,
          name: sideLabel,
          enabled: isSideEnabled(activeSideId, true),
          canvases: [clone(DEFAULT_CANVAS_TEMPLATE)]
        });

      const baseCanvas = baseSide?.canvases?.[0] || DEFAULT_CANVAS_TEMPLATE;
      const resolvedArea = activeArea || getDefaultAreaForSide(activeSideId);
      const canvasPayload = resolvedArea ? buildCanvasPayload(activeSideId, resolvedArea, baseCanvas) : null;

      const updatedSide = {
        ...baseSide,
        id: activeSideId,
        name: baseSide.name || sideLabel,
        side: activeSideId,
        enabled: isSideEnabled(activeSideId, baseSide.enabled),
        canvases: canvasPayload ? [canvasPayload] : []
      };

      let mergedSides = sides.map((side) => {
        const sideId = normalizeSideId(side.id || side.side);
        if (sideId === activeSideId) return updatedSide;

        const defaultArea = getDefaultAreaForSide(sideId);
        const baseCanvasForSide = Array.isArray(side.canvases) && side.canvases.length ? side.canvases[0] : baseCanvas;
        const canvasList =
          Array.isArray(side.canvases) && side.canvases.length
            ? side.canvases
            : defaultArea
              ? [buildCanvasPayload(sideId, defaultArea, baseCanvasForSide)]
              : [];
        return {
          ...side,
          id: sideId,
          side: sideId,
          name: side.name || state.sideLabels[sideId] || formatSideLabel(sideId),
          enabled: isSideEnabled(sideId, side.enabled),
          canvases: canvasList
        };
      });

      if (!mergedSides.some((side) => normalizeSideId(side.id || side.side) === activeSideId)) {
        mergedSides = [...mergedSides, updatedSide];
      }

      const payload = {
        product: {
          code: state.productCode || template.product?.code || DEFAULT_PRODUCT_CODE,
          size: state.size || template.product?.size || DEFAULT_PRODUCT_SIZE,
          color: state.colorCode || template.product?.color || DEFAULT_COLOR_CODE
        },
        design: {
          sides: mergedSides
        }
      };

      if (templateStore?.set) {
        templateStore.set(payload);
      } else {
        window.ExportDesignBuffer = payload;
        if (window.ExportDesignData?.set) {
          window.ExportDesignData.set(payload);
        }
        window.dispatchEvent(new CustomEvent("export-data-changed", { detail: payload }));
      }
    };

    const readNumber = (input, fallback) => {
      const v = Number(input?.value);
      return Number.isFinite(v) ? v : fallback;
    };

    const saveCurrentCanvas = () => {
      const baseArea = updateControls();
      if (!baseArea) return;
      const customArea = { ...baseArea };
      customArea.x = readNumber(inputs.x, baseArea.x);
      customArea.y = readNumber(inputs.y, baseArea.y);
      customArea.width = readNumber(inputs.width, baseArea.width);
      customArea.height = readNumber(inputs.height, baseArea.height);
      updateOverlay(customArea);
      pushExportData(customArea);
      persistState();
    };

    const render = () => {
      renderSideTabs();
      renderAreaOptions();
      const activeArea = updateControls();
      updatePreviewImage();
      syncSideEnableToggle();
      syncFrameToggle();
      updateOverlay(activeArea);
      persistState();
      pushExportData(activeArea);
    };

    sideTabsContainer?.addEventListener("click", (event) => {
      const tab = event.target.closest("[data-side-tab]");
      if (!tab) return;
      const nextSide = normalizeSideId(tab.dataset.sideTab);
      if (!nextSide || state.side === nextSide) return;
      state.side = nextSide;
      if (state.enabledSides[state.side] === undefined) {
        state.enabledSides[state.side] = true;
      }
      const templateSide = getTemplateSide();
      const firstCanvas = templateSide?.canvases?.[0];
      const presetName =
        firstCanvas?.presetName ||
        firstCanvas?.areaName ||
        state.presetBySide[state.side] ||
        pickDefaultPresetName(getAreasForSide(state.side)) ||
        DEFAULT_AREA_NAME;
      state.presetName = presetName;
      state.presetBySide[state.side] = presetName;
      render();
    });

    areaSelect?.addEventListener("change", (event) => {
      const next = event.target.value;
      if (next === state.presetName) return;
      state.presetName = next;
      state.presetBySide[state.side] = next;
      render();
    });

    sideEnableToggle?.addEventListener("change", () => {
      state.enabledSides[state.side] = Boolean(sideEnableToggle.checked);
      render();
    });

    frameToggleInputs.forEach((input) => {
      input.addEventListener("change", (event) => {
        state.showArea = Boolean(event.target.checked);
        syncFrameToggle();
        updateOverlay();
        persistState();
      });
    });

    saveButton?.addEventListener("click", () => {
      saveCurrentCanvas();
      showSaveFeedback();
    });

    if (previewImg) {
      previewImg.addEventListener("load", () => {
        imageMeta.naturalWidth = previewImg.naturalWidth;
        imageMeta.naturalHeight = previewImg.naturalHeight;
        updateOverlay();
      });
    }

    window.addEventListener("resize", () => updateOverlay());

    const bootstrapFromTemplate = () => {
      applyTemplateToState(getTemplateData());
      refreshSideCatalogFromTemplate();
      render();
    };

    templateStore?.ready?.then(bootstrapFromTemplate);
    bootstrapFromTemplate();
  };
})();
