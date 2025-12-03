(function () {
  window.PanelModules = window.PanelModules || {};

  window.PanelModules["design-product-preview"] = function initDesignProductPreview(root) {
    if (!root) return;

    const DEFAULT_PRODUCT_CODE = "3001C_BC_UJSST";
    const DEFAULT_COLOR_CODE = "canvas_red";

    const PRODUCT_DEFAULT_COLORS = {
      "3001C_BC_UJSST": {
        colorCode: "canvas_red",
        colorName: "Canvas Red",
        front: "shop/products/3001C_BC_UJSST/color/product/33_canvas_red_front.png",
        back: "shop/products/3001C_BC_UJSST/color/product/33_canvas_red_back.png"
      }
    };

    const templateStore = window.DesignTemplateStore;
    const settingsStore = window.CanvasSettingsStore || {};

    const toTitleCase = (value, fallback = "") => {
      if (!value || typeof value !== "string") return fallback;
      return value
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const clone = (value) => JSON.parse(JSON.stringify(value));
    const normalizeSideId = (value) => String(value || "front").toLowerCase();

    const previewTabs = root.querySelector("[data-preview-tabs]");
    const viewToggleButtons = root.querySelectorAll(".view-toggle__btn");
    const frameToggle = root.querySelector("[data-frame-toggle]");
    const previewImg = root.querySelector("[data-preview-img]");
    const previewStage = root.querySelector(".design-preview-stage");
    const overlaySvg = root.querySelector(".canvas-area-overlay");
    const overlayRect = root.querySelector(".canvas-area-rect");
    const designOverlay = root.querySelector("[data-design-overlay]");
    const designSvg = root.querySelector("[data-design-svg]");

    const state = {
      productCode: DEFAULT_PRODUCT_CODE,
      colorCode: DEFAULT_COLOR_CODE,
      sides: [],
      side: "front",
      showFrame: typeof settingsStore.showArea === "boolean" ? settingsStore.showArea : true,
      viewMode: "full"
    };
    let lastSideBroadcast = null;

    const imageMeta = {
      naturalWidth: null,
      naturalHeight: null
    };

    const getDefaultSide = (sideId = "front") => {
      if (typeof window.createDefaultCanvas === "function") {
        const canvas = window.createDefaultCanvas(sideId);
        return {
          id: sideId,
          name: toTitleCase(sideId, "Side"),
          enabled: true,
          canvases: [canvas]
        };
      }
      return {
        id: sideId,
        name: toTitleCase(sideId, "Side"),
        enabled: true,
        canvases: [
          {
            id: `${sideId}-default-canvas`,
            side: sideId,
            presetName: "Default Preset",
            x: 0,
            y: 0,
            width: 360,
            height: 477,
            layers: []
          }
        ]
      };
    };

    const normalizeTemplate = (raw) => {
      const product = raw?.product || {};
      const sides = Array.isArray(raw?.design?.sides) ? raw.design.sides : null;
      let normalizedSides = [];

      if (Array.isArray(sides) && sides.length) {
        normalizedSides = sides
          .filter(Boolean)
          .map((side, index) => {
            const sideId = normalizeSideId(side.id || side.side || `side-${index + 1}`);
            const canvas = Array.isArray(side.canvases) && side.canvases.length ? side.canvases[0] : null;
            const area = canvas
              ? {
                  x: Number(canvas.x) || 0,
                  y: Number(canvas.y) || 0,
                  width: Number(canvas.width) || 0,
                  height: Number(canvas.height) || 0
                }
              : null;
            return {
              id: sideId,
              name: side.name || side.label || toTitleCase(sideId, `Side ${index + 1}`),
              enabled: typeof side.enabled === "boolean" ? side.enabled : true,
              canvas: canvas || getDefaultSide(sideId).canvases[0],
              area: area || getDefaultSide(sideId).canvases[0],
              layers: Array.isArray(canvas?.layers) ? canvas.layers : []
            };
          });
      }

      if (!normalizedSides.length) {
        normalizedSides = [getDefaultSide("front"), getDefaultSide("back")].map((side) => ({
          id: side.id,
          name: side.name,
          enabled: true,
          canvas: side.canvases[0],
          area: side.canvases[0],
          layers: clone(side.canvases[0].layers || [])
        }));
      }

      return {
        productCode: product.code || DEFAULT_PRODUCT_CODE,
        colorCode: product.color || DEFAULT_COLOR_CODE,
        sides: normalizedSides
      };
    };

    const ensureActiveSide = () => {
      const hasActive = state.sides.some((side) => side.id === state.side);
      if (hasActive) return;
      const firstEnabled = state.sides.find((side) => side.enabled) || state.sides[0];
      if (firstEnabled) {
        state.side = firstEnabled.id;
      }
    };

    const syncFromStore = () => {
      const data = templateStore?.get?.() || {};
      const normalized = normalizeTemplate(data);
      state.productCode = normalized.productCode;
      state.colorCode = normalized.colorCode;
      state.sides = normalized.sides;
      ensureActiveSide();
      if (typeof settingsStore.showArea === "boolean") {
        state.showFrame = settingsStore.showArea;
      }
      updateVisibility();
    };

    const isCanvasEnabled = (sideId) => {
      const fromSettings = settingsStore?.enabledSides ? settingsStore.enabledSides[sideId] : undefined;
      if (typeof fromSettings === "boolean") return fromSettings;
      const side = state.sides.find((s) => s.id === sideId);
      if (typeof side?.enabled === "boolean") return side.enabled;
      return true;
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
      const sideKey = state.side === "back" ? "back" : "front";
      return meta[sideKey] || meta.front || meta.back;
    };

    const renderTabs = () => {
      if (!previewTabs) return;
      previewTabs.innerHTML = "";
      state.sides.forEach((side) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `canvas-side-tab${state.side === side.id ? " is-active" : ""}`;
        btn.dataset.sideTab = side.id;
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", String(state.side === side.id));
        btn.textContent = side.name || toTitleCase(side.id, "Side");
        const isEnabled = isCanvasEnabled(side.id);
        btn.classList.toggle("is-inactive", !isEnabled);
        btn.setAttribute("aria-disabled", String(!isEnabled));
        btn.addEventListener("click", () => {
          if (state.side === side.id) return;
          state.side = side.id;
          if (settingsStore) {
            settingsStore.side = state.side;
          }
          window.dispatchEvent(new CustomEvent("design-side-changed", { detail: { side: state.side } }));
          render();
        });
        previewTabs.appendChild(btn);
      });
    };

    const EDIT_MARGIN = 10;

    const syncViewToggle = () => {
      viewToggleButtons.forEach((b) => {
        const isActive = b.dataset.viewMode === state.viewMode;
        b.classList.toggle("is-active", isActive);
        b.setAttribute("aria-pressed", String(isActive));
      });
    };

    const appRoot = document.documentElement;
    const updateVisibility = () => {
      const hasProduct = Boolean(templateStore?.get?.()?.product?.code);
      const inDesign = appRoot.getAttribute("data-active-section") === "customize";
      const shouldShow = hasProduct && inDesign;
      const wasHidden = root.style.display === "none";
      root.style.display = shouldShow ? "" : "none";
      if (shouldShow && wasHidden) {
        syncFromStore();
        render();
      }
    };

    const applyImageLayout = (area) => {
      if (!previewImg || !previewStage) return;
      previewStage.classList.remove("is-edit-mode");
      previewImg.style.width = "";
      previewImg.style.height = "";
      previewImg.style.left = "";
      previewImg.style.top = "";

      if (state.viewMode !== "edit") return;
      if (!area || !Number.isFinite(area.width) || !Number.isFinite(area.height)) return;
      if (!imageMeta.naturalWidth || !imageMeta.naturalHeight) return;

      const stageBox = previewStage.getBoundingClientRect();
      if (!stageBox.width || !stageBox.height) return;

      const scale =
        Math.min(
          stageBox.width / (area.width + EDIT_MARGIN * 2),
          stageBox.height / (area.height + EDIT_MARGIN * 2)
        ) || 1;

      const displayW = imageMeta.naturalWidth * scale;
      const displayH = imageMeta.naturalHeight * scale;
      const centerX = stageBox.width / 2;
      const centerY = stageBox.height / 2;
      const areaCenterX = (area.x + area.width / 2) * scale;
      const areaCenterY = (area.y + area.height / 2) * scale;

      previewStage.classList.add("is-edit-mode");
      previewImg.style.width = `${displayW}px`;
      previewImg.style.height = `${displayH}px`;
      previewImg.style.left = `${centerX - areaCenterX}px`;
      previewImg.style.top = `${centerY - areaCenterY}px`;
    };

    const renderDesignLayers = (area, layers) => {
      if (!designSvg) return;
      designSvg.innerHTML = "";
      if (!area || !Number.isFinite(area.width) || !Number.isFinite(area.height)) return;

      designSvg.setAttribute("viewBox", `0 0 ${area.width} ${area.height}`);

      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      designSvg.appendChild(group);

      (layers || []).forEach((layer) => {
        const type = (layer?.type || "").toLowerCase();
        if (type === "text" && layer.text?.content) {
          const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
          textEl.setAttribute("x", String(layer.x || 0));
          const baseline = Number(layer.text.fontSize) || 14;
          textEl.setAttribute("y", String((layer.y || 0) + baseline));
          textEl.setAttribute("font-size", String(layer.text.fontSize || 16));
          textEl.setAttribute("font-family", layer.text.fontFamily || "Arial, sans-serif");
          textEl.setAttribute("fill", layer.color || "#ffffff");
          textEl.textContent = layer.text.content;
          group.appendChild(textEl);
          return;
        }

        if (type === "svg" && layer.svg?.content) {
          const svgGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
          svgGroup.setAttribute(
            "transform",
            `translate(${layer.x || 0} ${layer.y || 0}) scale(${layer.scale || 1})`
          );
          svgGroup.setAttribute("opacity", Number.isFinite(layer.opacity) ? layer.opacity : 1);
          svgGroup.innerHTML = layer.svg.content;
          group.appendChild(svgGroup);
          return;
        }

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", String(layer.x || 0));
        rect.setAttribute("y", String(layer.y || 0));
        rect.setAttribute("width", String(layer.width || 80));
        rect.setAttribute("height", String(layer.height || 80));
        rect.setAttribute("class", "layer-placeholder");
        group.appendChild(rect);
      });
    };

    const updateOverlay = (area) => {
      if (!overlayRect || !overlaySvg || !previewImg || !designOverlay || !designSvg) return;
      const enabled = isCanvasEnabled(state.side);
      if (!enabled || !area || !Number.isFinite(area.width) || !Number.isFinite(area.height)) {
        overlayRect.setAttribute("width", 0);
        overlayRect.setAttribute("height", 0);
        designSvg.setAttribute("width", 0);
        designSvg.setAttribute("height", 0);
        designOverlay.style.display = "none";
        return;
      }
      designOverlay.style.display = "";

      const hasImage =
        previewImg.complete &&
        Number.isFinite(previewImg.naturalWidth) &&
        previewImg.naturalWidth > 0 &&
        Number.isFinite(previewImg.naturalHeight) &&
        previewImg.naturalHeight > 0;

      if (!hasImage) {
        overlayRect.setAttribute("width", 0);
        overlayRect.setAttribute("height", 0);
        return;
      }

      const stage = previewImg.closest(".design-preview-stage");
      if (!stage) return;
      const stageBox = stage.getBoundingClientRect();
      const imgBox = previewImg.getBoundingClientRect();
      if (!stageBox.width || !stageBox.height || !imgBox.width || !imgBox.height) return;

      const naturalW = previewImg.naturalWidth;
      const naturalH = previewImg.naturalHeight;
      const scale = Math.min(imgBox.width / naturalW, imgBox.height / naturalH);

      const renderedW = naturalW * scale;
      const renderedH = naturalH * scale;

      const offsetX = (imgBox.width - renderedW) / 2 + (imgBox.left - stageBox.left);
      const offsetY = (imgBox.height - renderedH) / 2 + (imgBox.top - stageBox.top);

      const rectX = offsetX + area.x * scale;
      const rectY = offsetY + area.y * scale;
      const rectW = area.width * scale;
      const rectH = area.height * scale;

      overlaySvg.setAttribute("viewBox", `0 0 ${stageBox.width} ${stageBox.height}`);
      overlaySvg.setAttribute("width", stageBox.width);
      overlaySvg.setAttribute("height", stageBox.height);

      overlayRect.setAttribute("x", rectX);
      overlayRect.setAttribute("y", rectY);
      overlayRect.setAttribute("width", rectW);
      overlayRect.setAttribute("height", rectH);
      overlayRect.classList.toggle("is-outline-only", !state.showFrame);

      designSvg.setAttribute("width", rectW);
      designSvg.setAttribute("height", rectH);
      designOverlay.style.left = `${rectX}px`;
      designOverlay.style.top = `${rectY}px`;
      designOverlay.style.width = `${rectW}px`;
      designOverlay.style.height = `${rectH}px`;
    };

    const updatePreviewImage = () => {
      if (!previewImg) return;
      const src = getPreviewSrc();
      if (src) {
        previewImg.src = src;
        const meta = getColorMeta();
        const colorLabel = meta?.colorName || meta?.colorCode || "Preview";
        const sideLabel = state.side === "back" ? "Back" : "Front";
        previewImg.alt = `${sideLabel} preview - ${colorLabel}`;
        if (previewImg.complete) {
          imageMeta.naturalWidth = previewImg.naturalWidth;
          imageMeta.naturalHeight = previewImg.naturalHeight;
        }
      } else {
        previewImg.removeAttribute("src");
        previewImg.alt = "Preview unavailable";
      }
    };

    const render = () => {
      if (typeof settingsStore.showArea === "boolean") {
        state.showFrame = settingsStore.showArea;
      }
      if (settingsStore) {
        settingsStore.side = state.side;
      }
      if (state.side !== lastSideBroadcast) {
        lastSideBroadcast = state.side;
        window.dispatchEvent(new CustomEvent("design-side-changed", { detail: { side: state.side } }));
      }
      renderTabs();
      syncViewToggle();
      const active = state.sides.find((side) => side.id === state.side) || state.sides[0];
      const area = active?.area || null;
      const enabled = isCanvasEnabled(state.side);
      if (enabled) {
        renderDesignLayers(area, active?.layers || []);
      } else if (designSvg) {
        designSvg.innerHTML = "";
      }
      updatePreviewImage();
      if (overlayRect) {
        overlayRect.classList.toggle("is-outline-only", !state.showFrame);
      }
      if (frameToggle) {
        frameToggle.checked = state.showFrame;
      }
      applyImageLayout(enabled ? area : null);
      updateOverlay(enabled ? area : null);
    };

    frameToggle?.addEventListener("change", (event) => {
      state.showFrame = Boolean(event.target.checked);
      settingsStore.showArea = state.showFrame;
      render();
    });

    viewToggleButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.viewMode === "edit" ? "edit" : "full";
        if (state.viewMode === mode) return;
        state.viewMode = mode;
        viewToggleButtons.forEach((b) => {
          const isActive = b.dataset.viewMode === mode;
          b.classList.toggle("is-active", isActive);
          b.setAttribute("aria-pressed", String(isActive));
        });
        render();
      });
    });

    if (previewImg) {
      previewImg.addEventListener("load", () => {
        imageMeta.naturalWidth = previewImg.naturalWidth;
        imageMeta.naturalHeight = previewImg.naturalHeight;
        const active = state.sides.find((side) => side.id === state.side) || state.sides[0];
        updateOverlay(active?.area || null);
      });
    }

    window.addEventListener("resize", () => {
      const active = state.sides.find((side) => side.id === state.side) || state.sides[0];
      updateOverlay(active?.area || null);
    });

    templateStore?.subscribe(() => {
      syncFromStore();
      render();
    });

    templateStore?.ready?.then(() => {
      syncFromStore();
      render();
    });

    const observer = new MutationObserver(() => updateVisibility());
    observer.observe(appRoot, { attributes: true, attributeFilter: ["data-active-section"] });

    updateVisibility();
    syncFromStore();
    render();
  };
})();
