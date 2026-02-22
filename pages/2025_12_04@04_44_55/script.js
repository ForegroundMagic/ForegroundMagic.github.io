const DEFAULT_TEMPLATE_URL = "default-template.json";

const deepClone = (value) => JSON.parse(JSON.stringify(value));

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

const DEFAULT_TEMPLATE_DATA = {
  product: {
    code: "3001C_BC_UJSST",
    size: "L",
    color: "canvas_red"
  },
  design: {
    sides: [
      {
        id: "front",
        name: "Front",
        enabled: true,
        canvases: [createDefaultCanvas("front")]
      },
      {
        id: "back",
        name: "Back",
        enabled: true,
        canvases: [createDefaultCanvas("back")]
      }
    ]
  }
};

const toTitleCase = (value, fallback = "") => {
  if (!value || typeof value !== "string") return fallback;
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

function sanitizeTemplate(raw = {}) {
  const source = deepClone(raw || {});
  const product = source.product || {};
  const sides = Array.isArray(source.design?.sides) ? source.design.sides : null;
  const legacyCanvases = Array.isArray(source.design?.canvases) ? source.design.canvases : null;

  let normalizedSides = [];

  if (Array.isArray(sides) && sides.length) {
    normalizedSides = sides
      .filter(Boolean)
      .map((side, index) => {
        const sideId = String(side.id || side.side || `side-${index + 1}`).toLowerCase();
        const canvases = Array.isArray(side.canvases) ? side.canvases : [];
        const enabledFlag =
          typeof side.enabled === "boolean"
            ? side.enabled
            : typeof side.used === "boolean"
              ? side.used
              : true;

        return {
          id: sideId,
          name: side.name || side.label || toTitleCase(sideId, `Side ${index + 1}`),
          enabled: enabledFlag,
          canvases: canvases.length ? canvases.map((canvas) => ({ ...canvas })) : [createDefaultCanvas(sideId)]
        };
      })
      .filter(Boolean);
  } else if (legacyCanvases?.length) {
    const grouped = {};
    legacyCanvases.forEach((canvas, index) => {
      const sideId = String(canvas.side || canvas.sideId || canvas.sideName || `side-${index + 1}`).toLowerCase();
      if (!grouped[sideId]) {
        grouped[sideId] = {
          id: sideId,
          name: toTitleCase(sideId, `Side ${index + 1}`),
          enabled: true,
          canvases: []
        };
      }
      grouped[sideId].canvases.push({ ...canvas });
    });
    normalizedSides = Object.values(grouped);
  }

  if (!normalizedSides.length) {
    normalizedSides = deepClone(DEFAULT_TEMPLATE_DATA.design.sides);
  }

  return {
    product: {
      code: product.code || DEFAULT_TEMPLATE_DATA.product.code,
      size: product.size || DEFAULT_TEMPLATE_DATA.product.size,
      color: product.color || DEFAULT_TEMPLATE_DATA.product.color
    },
    design: {
      sides: normalizedSides
    }
  };
}

function createDesignTemplateStore() {
  let data = sanitizeTemplate(DEFAULT_TEMPLATE_DATA);
  const listeners = new Set();
  let readyResolve;
  let readyResolved = false;

  const ready = new Promise((resolve) => {
    readyResolve = resolve;
  });

  const resolveReady = (payload) => {
    if (readyResolved) return;
    readyResolved = true;
    readyResolve?.(payload);
  };

  const notify = () => {
    const snapshot = deepClone(data);
    listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (error) {
        console.error("DesignTemplateStore listener failed", error);
      }
    });
    window.ExportDesignBuffer = snapshot;
    window.dispatchEvent(new CustomEvent("export-data-changed", { detail: snapshot }));
  };

  const set = (nextData) => {
    data = sanitizeTemplate(nextData);
    notify();
    resolveReady(deepClone(data));
  };

  const update = (updater) => {
    const draft = deepClone(data);
    const next = typeof updater === "function" ? updater(draft) : updater;
    set(next);
  };

  const subscribe = (listener) => {
    if (typeof listener !== "function") return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const loadDefault = async () => {
    try {
      const response = await fetch(DEFAULT_TEMPLATE_URL);
      if (!response.ok) throw new Error(`Failed to load ${DEFAULT_TEMPLATE_URL}`);
      const payload = await response.json();
      set(payload);
    } catch (error) {
      console.warn("Falling back to bundled template data:", error);
      set(data);
    }
  };

  return {
    get: () => deepClone(data),
    set,
    update,
    subscribe,
    loadDefault,
    ready
  };
}

window.DesignTemplateStore = createDesignTemplateStore();

async function mountStaticDesignPreview() {
  const bottomPanel = document.querySelector(".panel-bottom");
  if (!bottomPanel) return;

  const templatePath = "panels/design/product-preview/panel.html";
  const cssPath = "panels/design/product-preview/panel.css";
  const jsPath = "panels/design/product-preview/panel.js";

  const ensureStyles = (href) =>
    new Promise((resolve, reject) => {
      if (document.querySelector(`link[href="${href}"]`)) return resolve();
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });

  const ensureScript = (src) =>
    new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });

  try {
    const response = await fetch(templatePath);
    if (!response.ok) throw new Error(`Failed to load ${templatePath}`);
    const html = await response.text();
    const template = document.createElement("template");
    template.innerHTML = html.trim();

    const existing = bottomPanel.querySelector('[data-panel-kind="design-product-preview"]');
    if (existing) existing.remove();

    const fragment = template.content.cloneNode(true);
    bottomPanel.appendChild(fragment);

    await ensureStyles(cssPath);
    await ensureScript(jsPath);

    const root = bottomPanel.querySelector('[data-panel-kind="design-product-preview"]');
    const module = window.PanelModules?.["design-product-preview"];
    if (typeof module === "function" && root) {
      module(root, { id: "design-product-preview", variant: "default", title: "Product Design Preview" });
    }
  } catch (error) {
    console.error("Failed to mount design preview panel", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.DesignTemplateStore.loadDefault();
  bridgeDesignStoreToExport();
  initSectionTabs();
  initBrandNameAutosize();
  mountStaticDesignPreview();
  initPanels();
});

function bridgeDesignStoreToExport() {
  const store = window.DesignTemplateStore;
  if (!store?.subscribe) return;
  let isSyncing = false;

  const mirror = (payload) => {
    if (isSyncing) return;
    isSyncing = true;
    const snapshot = deepClone(payload);
    window.ExportDesignBuffer = snapshot;
    window.dispatchEvent(new CustomEvent("export-data-changed", { detail: snapshot }));

    try {
      if (window.ExportDesignData?.set) {
        window.ExportDesignData.set(snapshot);
      }
    } catch (error) {
      console.warn("Failed to mirror design store to export data", error);
    } finally {
      isSyncing = false;
    }
  };

  mirror(store.get());
  store.subscribe(mirror);
}

function initSectionTabs() {
  const root = document.documentElement;
  const tabButtons = document.querySelectorAll(".header-tools .tool");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const section = btn.dataset.section;
      if (!section) return;

      root.setAttribute("data-active-section", section);

      tabButtons.forEach((b) => {
        b.classList.toggle("is-active", b === btn);
      });
    });
  });
}

function initPanels() {
  const triggers = document.querySelectorAll("[data-panel-id]");
  if (!triggers.length) return;

  const appContainer = document.querySelector(".app-container");
  const topPanel = document.querySelector(".panel-top");
  const bottomPanel = document.querySelector(".panel-bottom");

  const defaultRegistry = {
    catalog: {
      html: "panels/catalog/panel.html",
      css: "panels/catalog/panel.css",
      js: "panels/catalog/panel.js"
    },
    editor: {
      html: "panels/editor/panel.html",
      css: "panels/editor/panel.css",
      js: "panels/editor/panel.js"
    },
    templates: {
      html: "panels/templates/panel.html",
      css: "panels/templates/panel.css",
      js: "panels/templates/panel.js"
    },
    "canvas-settings-panel": {
      html: "panels/design/canvas/settings/panel.html",
      css: "panels/design/canvas/settings/panel.css",
      js: "panels/design/canvas/settings/panel.js"
    }
  };

  const exportRegistry = {
    "export-settings": {
      html: "panels/export/panel.html",
      css: "panels/export/panel.css",
      js: "panels/export/panel.js"
    }
  };

  const layersRegistry = {
    "layers-panel": {
      html: "panels/design/layers/panel.html",
      css: "panels/design/layers/panel.css",
      js: "panels/design/layers/panel.js"
    }
  };


  const managers = [];
  const triggerMap = new Map();

  const defaultManager = createPanelManager({
    hostElement: appContainer,
    registry: defaultRegistry,
    onClose: (id) => setTriggerActive(id, false)
  });

  if (defaultManager) {
    managers.push({ manager: defaultManager, ids: Object.keys(defaultRegistry) });
  }

  const exportManager = createPanelManager({
    hostElement: bottomPanel,
    registry: exportRegistry,
    allowClose: false,
    overlayClassName: "panel-overlay panel-overlay--bottom",
    onClose: (id) => setTriggerActive(id, false)
  });

  if (exportManager) {
    managers.push({ manager: exportManager, ids: Object.keys(exportRegistry) });
  }

  const layersManager = createPanelManager({
    hostElement: topPanel,
    registry: layersRegistry,
    allowClose: true,
    overlayClassName: "panel-overlay",
    onClose: (id) => setTriggerActive(id, false)
  });

  if (layersManager) {
    managers.push({ manager: layersManager, ids: Object.keys(layersRegistry) });
  }


  if (!managers.length) return;

  const idToManager = new Map();
  managers.forEach(({ ids, manager }) => {
    ids.forEach((id) => idToManager.set(id, manager));
  });

  const setTriggerActive = (id, isActive) => {
    const trigger = triggerMap.get(id);
    if (!trigger) return;
    trigger.classList.toggle("is-active", Boolean(isActive));
    trigger.setAttribute("aria-pressed", String(Boolean(isActive)));
  };

  const setExclusiveActive = (targetId) => {
    triggerMap.forEach((btn, id) => {
      const active = id === targetId;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  };

  const closePanelById = (id, { force = false } = {}) => {
    const managerForPanel = idToManager.get(id);
    if (managerForPanel?.close) {
      managerForPanel.close({ force });
      setTriggerActive(id, false);
    }
  };

  const closeAllPanels = ({ force = false } = {}) => {
    managers.forEach(({ manager }) => {
      manager.close?.({ force });
    });
  };

  const openPanelById = (id, { variant = "default", title = "Panel" } = {}) => {
    const managerForPanel = idToManager.get(id);
    if (managerForPanel) {
      managerForPanel.open({ id, variant, title });
      setExclusiveActive(id);
    }
  };

  window.PanelSystem = {
    openPanelById,
    closePanelById,
    closeAllPanels
  };

  const exportPanelId = "export-settings";
  const layersPanelId = "layers-panel";

  triggers.forEach((trigger) => {
    const panelId = trigger.dataset.panelId;
    if (panelId) triggerMap.set(panelId, trigger);
    trigger.addEventListener("click", () => {
      const id = trigger.dataset.panelId;
      if (!id) return;

      if (
        id === exportPanelId &&
        document.documentElement.getAttribute("data-active-section") !== "order"
      ) {
        closePanelById(exportPanelId, { force: true });
        return;
      }

      openPanelById(id, {
        variant: trigger.dataset.panelVariant || "default",
        title:
          trigger.dataset.panelTitle ||
          trigger.querySelector(".tool__label")?.textContent?.trim() ||
          "Panel"
      });
    });
  });

  const exportButton = document.querySelector(`[data-panel-id="${exportPanelId}"]`);
  const layersButton = document.querySelector(`[data-panel-id="${layersPanelId}"]`);
  const toolbarButtons = document.querySelectorAll(".toolbar .tool, .header-tools .tool");
  const overlayPanelIds = [exportPanelId, layersPanelId];

  toolbarButtons.forEach((button) => {
    button.addEventListener("click", () => {
      overlayPanelIds.forEach((panelId) => {
        const trigger =
          panelId === exportPanelId ? exportButton : panelId === layersPanelId ? layersButton : null;
        if (trigger && button === trigger) return;
        closePanelById(panelId, { force: true });
      });
    });
  });
}

function initBrandNameAutosize() {
  const targets = Array.from(document.querySelectorAll(".brand__name"));
  if (!targets.length) return;

  const MIN_FONT_SIZE = 10;
  const STEP = 0.5;

  const fit = (node) => {
    // Reset to stylesheet-driven size (clamp) before measuring.
    node.style.fontSize = "";

    const computed = window.getComputedStyle(node);
    const baseSize = parseFloat(computed.fontSize) || 20;
    const minSize = Math.max(MIN_FONT_SIZE, baseSize * 0.5);

    let currentSize = baseSize;
    node.style.fontSize = `${currentSize}px`;

    const fits = () => {
      const width = node.clientWidth || node.parentElement?.clientWidth || Infinity;
      const parentHeight = node.parentElement?.getBoundingClientRect().height || Infinity;
      const height = node.clientHeight || parentHeight;

      return node.scrollWidth <= width && node.scrollHeight <= height;
    };

    if (fits()) return;

    while (currentSize > minSize && !fits()) {
      currentSize -= STEP;
      node.style.fontSize = `${currentSize}px`;
    }
  };

  const scheduleFit = () => window.requestAnimationFrame(() => targets.forEach(fit));

  const observer = new ResizeObserver(scheduleFit);
  targets.forEach((node) => {
    observer.observe(node);
    if (node.parentElement) observer.observe(node.parentElement);
  });

  window.addEventListener("resize", scheduleFit, { passive: true });
  scheduleFit();
}

function createPanelManager(options = {}) {
  const {
    hostElement,
    overlayClassName = "panel-overlay",
    registry: registryConfig = {},
    allowClose = true,
    onClose = () => {}
  } = options;

  if (!hostElement) return null;

  const overlay = document.createElement("div");
  overlay.className = overlayClassName;
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="panel-overlay__stage" role="dialog" aria-modal="true" tabindex="-1" data-panel-host></div>
  `;

  hostElement.appendChild(overlay);

  const panelHost = overlay.querySelector("[data-panel-host]");
  const stage = overlay.querySelector(".panel-overlay__stage");
  const templateCache = new Map();
  const styleCache = new Set();
  const scriptCache = new Set();

  const registry = {
    ...registryConfig
  };

  if (allowClose) {
    overlay.addEventListener("click", (event) => {
      if (event.target.closest("[data-panel-close]")) {
        closePanel();
      }
    });
  }

  if (allowClose) {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !overlay.hidden) {
        closePanel();
      }
    });
  }

  function closePanel({ force = false } = {}) {
    if (!allowClose && !force) return;
    const currentId = overlay.getAttribute("data-current-panel");
    overlay.hidden = true;
    overlay.removeAttribute("data-current-panel");
    overlay.removeAttribute("data-current-variant");
    panelHost.innerHTML = "";
    if (currentId) onClose(currentId);
  }

  async function openPanel({ id, variant, title }) {
    overlay.hidden = false;
    overlay.setAttribute("data-current-panel", id);
    overlay.setAttribute("data-current-variant", variant);
    panelHost.innerHTML = "";
    stage?.focus();

    const fallbackRoot = buildFallbackPanel({ id, variant, title });
    const fallbackMessage = fallbackRoot.querySelector("[data-fallback-message]");
    panelHost.appendChild(fallbackRoot);

    const definition = registry[id];
    if (!definition) {
      if (fallbackMessage) {
        fallbackMessage.textContent = "Panel files are not registered yet.";
      }
      return;
    }

    try {
      const fragment = await loadTemplate(definition.html);
      panelHost.innerHTML = "";
      panelHost.appendChild(fragment);

      const panelRoot =
        panelHost.querySelector("[data-panel-shell]") || panelHost.firstElementChild;
      if (panelRoot) {
        panelRoot.setAttribute("data-panel-variant", variant);
        const titleNode = panelRoot.querySelector("[data-panel-title]");
        if (titleNode) {
          titleNode.textContent = title;
        }
      }

      await Promise.all([useStyles(definition.css), useScript(definition.js)]);
      runPanelModule(id, panelRoot, { id, variant, title });
    } catch (error) {
      console.error("Panel load failed:", error);
      if (fallbackMessage) {
        fallbackMessage.textContent =
          "Unable to load panel files. If you're viewing this page directly via the file system, please use a local web server or try again.";
      }
    }
  }

  function loadTemplate(path) {
    if (templateCache.has(path)) {
      const template = templateCache.get(path);
      return Promise.resolve(template.content.cloneNode(true));
    }

    return fetch(path)
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${path}`);
        return response.text();
      })
      .then((markup) => {
        const template = document.createElement("template");
        template.innerHTML = markup.trim();
        templateCache.set(path, template);
        return template.content.cloneNode(true);
      });
  }

  function useStyles(href) {
    if (!href || styleCache.has(href)) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.onload = () => {
        styleCache.add(href);
        resolve();
      };
      link.onerror = (error) => reject(error);
      document.head.appendChild(link);
    });
  }

  function useScript(src) {
    if (!src || scriptCache.has(src)) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.onload = () => {
        scriptCache.add(src);
        resolve();
      };
      script.onerror = (error) => reject(error);
      document.body.appendChild(script);
    });
  }

  function runPanelModule(key, root, context) {
    const modules = window.PanelModules || {};
    const hook = modules[key];
    if (typeof hook === "function") {
      try {
        hook(root, context);
      } catch (error) {
        console.error(`Panel module ${key} failed`, error);
      }
    }
  }

  return {
    open: openPanel,
    close: (options) => closePanel(options || {}),
    isActive: (id) => !overlay.hidden && (!id || overlay.getAttribute("data-current-panel") === id)
  };
}

function buildFallbackPanel({ id, variant, title }) {
  const wrapper = document.createElement("section");
  wrapper.className = "floating-panel";
  wrapper.setAttribute("data-panel-shell", "");
  wrapper.setAttribute("data-panel-kind", `${id}-fallback`);
  wrapper.setAttribute("data-panel-variant", variant);
  wrapper.innerHTML = `
    <header class="floating-panel__header">
      <div>
        <p class="floating-panel__eyebrow">Panel Preview</p>
        <h2 class="floating-panel__title" data-fallback-title></h2>
      </div>
      <button class="floating-panel__close" type="button" aria-label="Close panel" data-panel-close>
        <svg viewBox="0 0 20 20" role="presentation" focusable="false">
          <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="m6 6 8 8m0-8-8 8"></path>
        </svg>
      </button>
    </header>
    <div class="floating-panel__body">
      <div class="floating-panel__blank">
        <p class="floating-panel__blank-label" data-panel-variant-label></p>
        <p class="floating-panel__blank-helper" data-fallback-message>Loading panel…</p>
      </div>
    </div>
  `;

  const titleNode = wrapper.querySelector("[data-fallback-title]");
  const variantNode = wrapper.querySelector("[data-panel-variant-label]");

  if (titleNode) {
    titleNode.textContent = title;
  }

  if (variantNode) {
    variantNode.textContent = title || variant;
  }

  return wrapper;
}
