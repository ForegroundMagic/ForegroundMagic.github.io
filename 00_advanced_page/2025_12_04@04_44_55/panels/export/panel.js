(function () {
  window.PanelModules = window.PanelModules || {};

  const deepClone = (value) => JSON.parse(JSON.stringify(value));

  const DEFAULT_EXPORT_DATA = {
    product: {
      code: null,
      size: null,
      color: null
    },
    design: {
      sides: []
    }
  };

  const DEFAULT_LAYER_STACK = [
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
  ];

  const createDefaultCanvas = (sideId = "front", presetName = "Default Preset") => ({
    id: `${sideId}-default-canvas`,
    side: sideId,
    presetName,
    x: 400.5,
    y: 226,
    width: 360,
    height: 477,
    layers: deepClone(DEFAULT_LAYER_STACK)
  });

  const createDefaultSide = (sideId = "front") => ({
    id: sideId,
    name: sideId === "back" ? "Back" : "Front",
    enabled: true,
    canvases: [createDefaultCanvas(sideId)]
  });

  const TEMPLATE_FALLBACK = {
    product: {
      code: "3001C_BC_UJSST",
      size: "L",
      color: "canvas_red"
    },
    design: {
      sides: [createDefaultSide("front"), createDefaultSide("back")]
    }
  };

  const MAX_LAYERS = 9;

  const numberOrNull = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const valueOrNone = (value, fallback = "None") => {
    if (value === null || value === undefined || value === "") return fallback;
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number") return Number.isFinite(value) ? String(value) : fallback;
    return String(value);
  };

  function sanitizeLayer(layer = {}) {
    const hasIdentity = layer.type || layer.objectId || layer.id;
    if (!hasIdentity) return null;

    const base = {
      id: layer.id ?? null,
      type: layer.type ?? null,
      objectId: layer.objectId ?? null,
      x: numberOrNull(layer.x),
      y: numberOrNull(layer.y),
      width: numberOrNull(layer.width),
      height: numberOrNull(layer.height),
      scale: numberOrNull(layer.scale),
      rotation: numberOrNull(layer.rotation),
      opacity: numberOrNull(layer.opacity),
      color: layer.color ?? null,
      zIndex: numberOrNull(layer.zIndex),
      locked: layer.locked ?? false,
      visible: layer.visible ?? true
    };

    if (layer.type === "svg") {
      const svg = layer.svg || {};
      base.svg = {
        assetRef: svg.assetRef ?? null,
        viewBox: svg.viewBox ?? null,
        preserveAspectRatio: svg.preserveAspectRatio ?? null,
        content: svg.content ?? null
      };
    }

    if (layer.type === "text") {
      const text = layer.text || {};
      base.text = {
        content: text.content ?? null,
        fontFamily: text.fontFamily ?? null,
        fontSize: numberOrNull(text.fontSize),
        fontWeight: text.fontWeight ?? null,
        fontStyle: text.fontStyle ?? null,
        letterSpacing: numberOrNull(text.letterSpacing),
        lineHeight: text.lineHeight ?? null,
        textAlign: text.textAlign ?? null,
        textTransform: text.textTransform ?? null,
        decoration: text.decoration ?? null
      };
    }

    return base;
  }

  function sanitizeCanvas(canvas = {}, sideId = null) {
    const layers = Array.isArray(canvas.layers) ? canvas.layers : [];
    const normalizedLayers = layers
      .filter(Boolean)
      .slice(0, MAX_LAYERS)
      .map(sanitizeLayer)
      .filter(Boolean);

    return {
      id: canvas.id ?? null,
      side: canvas.side ?? sideId ?? null,
      presetName: canvas.presetName ?? canvas.areaName ?? null,
      x: numberOrNull(canvas.x),
      y: numberOrNull(canvas.y),
      width: numberOrNull(canvas.width),
      height: numberOrNull(canvas.height),
      layers: normalizedLayers
    };
  }

  const toTitleCase = (value, fallback = "") => {
    if (!value || typeof value !== "string") return fallback;
    return value
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  function sanitizeSide(side = {}, index = 0) {
    const sideId = String(side.id || side.side || `side-${index + 1}`).toLowerCase();
    const canvases = Array.isArray(side.canvases) ? side.canvases : [];
    const enabledFlag =
      typeof side.enabled === "boolean"
        ? side.enabled
        : typeof side.used === "boolean"
          ? side.used
          : true;

    const normalizedCanvases = canvases.length
      ? canvases.map((canvas) => sanitizeCanvas(canvas, sideId)).filter(Boolean)
      : [sanitizeCanvas(createDefaultCanvas(sideId), sideId)].filter(Boolean);

    return {
      id: sideId,
      name: side.name || side.label || toTitleCase(sideId, `Side ${index + 1}`),
      enabled: enabledFlag,
      canvases: normalizedCanvases
    };
  }

  function normalizeLegacyCanvases(canvases = []) {
    const grouped = new Map();

    canvases.forEach((canvas, index) => {
      const sideId = String(canvas.side || canvas.sideId || canvas.sideName || `side-${index + 1}`).toLowerCase();
      if (!grouped.has(sideId)) {
        grouped.set(sideId, {
          id: sideId,
          name: toTitleCase(sideId, `Side ${index + 1}`),
          enabled: true,
          canvases: []
        });
      }
      const entry = grouped.get(sideId);
      entry.canvases.push(sanitizeCanvas(canvas, sideId));
    });

    return Array.from(grouped.values());
  }

  function sanitizeExportData(raw = {}) {
    const product = raw.product || {};
    const fallbackProduct = TEMPLATE_FALLBACK.product || {};
    const sidesInput = Array.isArray(raw.design?.sides) ? raw.design.sides : null;
    const legacyCanvases = Array.isArray(raw.design?.canvases) ? raw.design.canvases : null;

    let normalizedSides = [];

    if (sidesInput?.length) {
      normalizedSides = sidesInput.map(sanitizeSide).filter(Boolean);
    } else if (legacyCanvases?.length) {
      normalizedSides = normalizeLegacyCanvases(legacyCanvases);
    }

    if (!normalizedSides.length) {
      normalizedSides = [createDefaultSide("front"), createDefaultSide("back")];
    }

    return {
      product: {
        code: product.code ?? fallbackProduct.code ?? null,
        size: product.size ?? fallbackProduct.size ?? null,
        color: product.color ?? fallbackProduct.color ?? null
      },
      design: {
        sides: normalizedSides
      }
    };
  }

  function formatPair(a, b, separator = " · ") {
    return `${valueOrNone(a)}${separator}${valueOrNone(b)}`;
  }

  function renderField(label, value) {
    return `
      <div class="layer-field">
        <div class="layer-field__label">${escapeHtml(label)}</div>
        <div class="layer-field__value">${escapeHtml(valueOrNone(value))}</div>
      </div>
    `;
  }

  function renderProductSummary(product, container) {
    if (!container) return;
    const items = [
      { label: "Product Code", value: product.code },
      { label: "Size", value: product.size },
      { label: "Color", value: product.color }
    ];

    container.innerHTML = items
      .map(
        (item) => `
          <div class="summary-grid__item">
            <dt>${escapeHtml(item.label)}</dt>
            <dd>${escapeHtml(valueOrNone(item.value))}</dd>
          </div>
        `
      )
      .join("");
  }

  function renderLayer(layer, index) {
    const baseFields = [
      renderField("Object ID", layer.objectId),
      renderField("Position", formatPair(layer.x, layer.y)),
      renderField("Size", `${valueOrNone(layer.width)} × ${valueOrNone(layer.height)}`),
      renderField("Scale", layer.scale),
      renderField("Rotation", layer.rotation !== null && layer.rotation !== undefined ? `${layer.rotation}°` : null),
      renderField("Opacity", layer.opacity),
      renderField("Color", layer.color),
      renderField("Z-Index", layer.zIndex),
      renderField("Locked", layer.locked),
      renderField("Visible", layer.visible)
    ];

    const svgDetails =
      layer.type === "svg" && layer.svg
        ? `
            <div class="layer-footnote">
              <strong>SVG:</strong>
              ${escapeHtml(valueOrNone(layer.svg.assetRef))} · ViewBox ${escapeHtml(
                valueOrNone(layer.svg.viewBox)
              )} · ${escapeHtml(valueOrNone(layer.svg.preserveAspectRatio))}
            </div>
            <div class="layer-footnote">
              <strong>Content:</strong> ${escapeHtml(valueOrNone(layer.svg.content, "None"))}
            </div>
          `
        : "";

    const textDetails =
      layer.type === "text" && layer.text
        ? `
            <div class="layer-footnote">
              <strong>Text:</strong> ${escapeHtml(valueOrNone(layer.text.content))}
            </div>
            <div class="layer-footnote">
              <strong>Font:</strong> ${escapeHtml(valueOrNone(layer.text.fontFamily))} · ${escapeHtml(
                valueOrNone(layer.text.fontSize)
              )}px · ${escapeHtml(valueOrNone(layer.text.fontWeight))}
            </div>
            <div class="layer-footnote">
              <strong>Layout:</strong> Align ${escapeHtml(valueOrNone(layer.text.textAlign))}, Line height ${escapeHtml(
                valueOrNone(layer.text.lineHeight)
              )}, Transform ${escapeHtml(valueOrNone(layer.text.textTransform))}
            </div>
          `
        : "";

    return `
      <div class="layer-card">
        <div class="layer-card__header">
          <span class="layer-chip">Layer ${index + 1}</span>
          <span class="layer-type">${escapeHtml(valueOrNone(layer.type))}</span>
        </div>
        <div class="layer-fields">
          ${baseFields.join("")}
        </div>
        ${svgDetails || textDetails ? `${svgDetails}${textDetails}` : ""}
      </div>
    `;
  }

  function renderSideSummary(sides, container) {
    if (!container) return;
    if (!sides.length) {
      container.innerHTML =
        '<p class="layer-footnote">No sides available. Add at least one side with a canvas to export design data.</p>';
      return;
    }

    container.innerHTML = sides
      .map((side) => {
        const canvases = Array.isArray(side.canvases) ? side.canvases : [];
        const sideLabel = side.name || side.label || side.id || "Side";
        const canvasMarkup = canvases.length
          ? canvases
              .map((canvas, index) => {
                const layersMarkup = (canvas.layers || [])
                  .map((layer, idx) => renderLayer(layer, idx))
                  .join("");

                return `
                  <div class="canvas-card canvas-card--nested">
                    <div class="canvas-card__meta">
                      <div class="canvas-meta-group">
                        <span class="meta-pill"><strong>Canvas</strong> ${escapeHtml(
                          valueOrNone(canvas.id || index + 1)
                        )}</span>
                        <span class="meta-pill"><strong>Preset</strong> ${escapeHtml(
                          valueOrNone(canvas.presetName)
                        )}</span>
                      </div>
                      <div class="canvas-meta-group">
                        <span class="meta-pill"><strong>Position</strong> ${escapeHtml(
                          formatPair(canvas.x, canvas.y)
                        )}</span>
                        <span class="meta-pill"><strong>Size</strong> ${escapeHtml(
                          `${valueOrNone(canvas.width)} × ${valueOrNone(canvas.height)}`
                        )}</span>
                      </div>
                    </div>
                    <div class="layer-list">
                      ${
                        layersMarkup ||
                        '<p class="layer-footnote">No layers in this canvas. Add graphics or text to export.</p>'
                      }
                    </div>
                  </div>
                `;
              })
              .join("")
          : '<p class="layer-footnote">No canvases for this side yet.</p>';

        return `
          <article class="canvas-card">
            <div class="canvas-card__meta">
              <div class="canvas-meta-group">
                <span class="layer-chip">${escapeHtml(valueOrNone(sideLabel))}</span>
                <span class="layer-type">${side.enabled ? "Enabled" : "Not used"}</span>
              </div>
              <div class="canvas-meta-group">
                <span class="meta-pill"><strong>Status</strong> ${side.enabled ? "Enabled" : "Disabled"}</span>
                <span class="meta-pill"><strong>Canvases</strong> ${canvases.length}</span>
              </div>
            </div>
            ${canvasMarkup}
          </article>
        `;
      })
      .join("");
  }

  function renderJsonPreview(payload, target) {
    if (!target) return;
    target.textContent = JSON.stringify(payload, null, 2);
  }

  function createExportController(root) {
    const productSummaryEl = root.querySelector("[data-product-summary]");
    const canvasSummaryEl = root.querySelector("[data-canvas-summary]");
    const jsonPreviewEl = root.querySelector("[data-json-preview]");
    const productChip = root.querySelector("[data-product-chip]");
    const canvasCount = root.querySelector("[data-canvas-count]");
    const statusEl = root.querySelector("[data-export-status]");
    const saveButton = root.querySelector("[data-save-server]");
    const downloadButton = root.querySelector("[data-download-export]");

    let state = {
      data: sanitizeExportData(DEFAULT_EXPORT_DATA)
    };

    const updateStatus = (message) => {
      if (statusEl) statusEl.textContent = message;
    };

    const render = () => {
      const payload = sanitizeExportData(state.data);
      state.data = payload;

      if (productChip) {
        const parts = [payload.product.code, payload.product.size, payload.product.color].filter(Boolean);
        productChip.textContent = parts.length ? parts.join(" · ") : "None selected";
      }

      if (canvasCount) {
        const sides = payload.design.sides || [];
        const enabledSides = sides.filter((side) => side.enabled).length;
        const totalCanvases = sides.reduce(
          (sum, side) => sum + (Array.isArray(side.canvases) ? side.canvases.length : 0),
          0
        );
        const sideLabel = `${enabledSides}/${sides.length} ${sides.length === 1 ? "side" : "sides"}`;
        const canvasLabel = `${totalCanvases} ${totalCanvases === 1 ? "canvas" : "canvases"}`;
        canvasCount.textContent = `${sideLabel} · ${canvasLabel}`;
      }

      renderProductSummary(payload.product, productSummaryEl);
      renderSideSummary(payload.design.sides, canvasSummaryEl);
      renderJsonPreview(payload, jsonPreviewEl);
      window.ExportDesignBuffer = payload;
    };

    const download = () => {
      const payload = sanitizeExportData(state.data);
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().replace(/[:]/g, "-");
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `design-export-${stamp}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      updateStatus("JSON downloaded locally.");
    };

    const saveToServer = () => {
      const payload = sanitizeExportData(state.data);
      console.log("Pretend save to server with payload:", payload);
      updateStatus("Save to server queued (stub).");
    };

    const setData = (nextData) => {
      state.data = sanitizeExportData({
        ...DEFAULT_EXPORT_DATA,
        ...nextData,
        design: {
          ...DEFAULT_EXPORT_DATA.design,
          ...(nextData?.design || {})
        }
      });
      render();
    };

    const getData = () => sanitizeExportData(state.data);

    saveButton?.addEventListener("click", saveToServer);
    downloadButton?.addEventListener("click", download);

    return { setData, getData, download };
  }

  window.PanelModules["export-settings"] = (root) => {
    if (!root) return;
    root.setAttribute("aria-label", "Export design settings panel");

    const templateStore = window.DesignTemplateStore;
    const resolveLatestPayload = () => {
      const storePayload = templateStore?.get?.();
      if (storePayload?.design?.sides?.length) return storePayload;
      if (window.ExportDesignBuffer?.design?.sides?.length) return window.ExportDesignBuffer;
      return TEMPLATE_FALLBACK;
    };

    const controller = createExportController(root);
    controller.setData(resolveLatestPayload());

    const maybeSyncBuffer = () => {
      if (window.ExportDesignBuffer) {
        controller.setData(window.ExportDesignBuffer);
      }
    };

    maybeSyncBuffer();

    const unsubscribe = templateStore?.subscribe?.((payload) => controller.setData(payload));
    templateStore?.ready?.then(() => controller.setData(resolveLatestPayload()));

    window.addEventListener("export-data-changed", (event) => {
      if (event?.detail && typeof controller?.setData === "function") {
        controller.setData(event.detail);
      }
    });

    window.ExportDesignData = window.ExportDesignData || {};
    window.ExportDesignData.set = (payload) => {
      if (templateStore?.set) {
        templateStore.set(payload);
      } else {
        controller.setData(payload);
      }
    };
    window.ExportDesignData.get = () => (templateStore?.get?.() || controller.getData());
    window.ExportDesignData.download = () => controller.download();

    // Return cleanup for future extensibility.
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  };
})();
