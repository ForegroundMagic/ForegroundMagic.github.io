document.addEventListener("DOMContentLoaded", () => {
  initSectionTabs();
  initPanels();
});

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

  const manager = createPanelManager();
  if (!manager) return;

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      manager.open({
        id: trigger.dataset.panelId,
        variant: trigger.dataset.panelVariant || "default",
        title:
          trigger.dataset.panelTitle ||
          trigger.querySelector(".tool__label")?.textContent?.trim() ||
          "Panel"
      });
    });
  });
}

function createPanelManager() {
  const appContainer = document.querySelector(".app-container");
  if (!appContainer) return null;

  const overlay = document.createElement("div");
  overlay.className = "panel-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="panel-overlay__stage" role="dialog" aria-modal="true" tabindex="-1" data-panel-host></div>
  `;

  appContainer.appendChild(overlay);

  const panelHost = overlay.querySelector("[data-panel-host]");
  const stage = overlay.querySelector(".panel-overlay__stage");
  const templateCache = new Map();
  const styleCache = new Set();
  const scriptCache = new Set();

  const registry = {
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
    canvas: {
      html: "panels/canvas/panel.html",
      css: "panels/canvas/panel.css",
      js: "panels/canvas/panel.js"
    }
  };

  overlay.addEventListener("click", (event) => {
    if (event.target.closest("[data-panel-close]")) {
      closePanel();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) {
      closePanel();
    }
  });

  function closePanel() {
    overlay.hidden = true;
    overlay.removeAttribute("data-current-panel");
    overlay.removeAttribute("data-current-variant");
    panelHost.innerHTML = "";
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
    open: openPanel
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
