'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const toolbarDeck = document.querySelector('.toolbar-deck');

  const headerButtons = document.querySelectorAll('.header-tools .tool');
  const mainPages = document.querySelectorAll('.main-page');

  const subpageContainers = new Map();
  document.querySelectorAll('[data-subpage-container]').forEach((container) => {
    const section = container.getAttribute('data-subpage-container');
    if (section) {
      subpageContainers.set(section, container);
    }
  });

  const subpageTemplates = new Map();
  document.querySelectorAll('template[data-section][data-subpage]').forEach((template) => {
    const key = `${template.dataset.section}:${template.dataset.subpage}`;
    subpageTemplates.set(key, template);
  });

  const defaultSubpages = {
    explore: 'welcome',
    customize: 'product-preview',
    order: 'shop-1',
  };

  const activeSubpages = new Map();
  let customizePreviewState = null;

  function makeExclusiveWithin(container, groupName) {
    const buttons = [...container.querySelectorAll(`[data-group="${groupName}"]`)];
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        buttons.forEach((innerButton) => {
          innerButton.setAttribute('aria-pressed', String(innerButton === button));
        });
      });
    });
  }

  function wireToggles(container) {
    container.querySelectorAll('[data-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        const next = button.getAttribute('aria-pressed') !== 'true';
        button.setAttribute('aria-pressed', String(next));
      });
    });
  }

  function setDeckDisabled(disabled) {
    if (!toolbarDeck) return;
    toolbarDeck.querySelectorAll('.tool').forEach((button) => {
      button.disabled = Boolean(disabled);
      button.setAttribute('aria-disabled', String(Boolean(disabled)));
    });
  }

  function updateHeaderButtons(section) {
    headerButtons.forEach((btn) => {
      const isActive = btn.dataset.section === section;
      btn.toggleAttribute('aria-current', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
      btn.classList.toggle('is-active', isActive);
    });
  }

  function updateMainPages(section) {
    mainPages.forEach((page) => {
      const isCurrent = page.dataset.section === section;
      page.toggleAttribute('hidden', !isCurrent);
      page.setAttribute('aria-hidden', String(!isCurrent));
    });
  }

  function updateSubpageButtons(section, subpage) {
    document.querySelectorAll(`[data-section-target="${section}"][data-subpage]`).forEach((button) => {
      const isActive = button.dataset.subpage === subpage;
      button.setAttribute('aria-pressed', String(isActive));
      button.toggleAttribute('aria-current', isActive);
      button.classList.toggle('is-active', isActive);
    });
  }

  function findFirstSubpage(section) {
    const button = document.querySelector(`[data-section-target="${section}"][data-subpage]`);
    if (button) return button.dataset.subpage;
    const match = [...subpageTemplates.keys()].find((key) => key.startsWith(`${section}:`));
    if (match) {
      const [, subpage] = match.split(':');
      return subpage;
    }
    return null;
  }

  function setupCustomizePreview(container) {
    const rootEl = container.querySelector('[data-customize-root]');
    if (!rootEl) return null;

    const viewToolbarEl = rootEl.querySelector('.view-mode-toolbar');
    if (!viewToolbarEl) return null;

    makeExclusiveWithin(viewToolbarEl, 'side');
    makeExclusiveWithin(viewToolbarEl, 'mode');
    wireToggles(viewToolbarEl);

    const cleanup = [];
    const onActivateCallbacks = [];

    function isModeActive(value) {
      const button = viewToolbarEl.querySelector(`[data-group="mode"][data-value="${value}"]`);
      return button ? button.getAttribute('aria-pressed') === 'true' : false;
    }

    function updatePreviewLock() {
      const inCustomize = root.getAttribute('data-active-section') === 'customize';
      const lock = inCustomize && isModeActive('preview') && !isModeActive('edit');
      setDeckDisabled(lock);
    }

    viewToolbarEl.querySelectorAll('[data-group="mode"]').forEach((button) => {
      button.addEventListener('click', updatePreviewLock);
      cleanup.push(() => button.removeEventListener('click', updatePreviewLock));
    });

    const raster = rootEl.querySelector('#raster');
    if (raster) {
      const frontURL = raster.getAttribute('data-front-src');
      const backURL = raster.getAttribute('data-back-src');
      [frontURL, backURL].filter(Boolean).forEach((url) => {
        const image = new Image();
        image.src = url;
      });

      function getActiveSide() {
        const button = viewToolbarEl.querySelector('[data-group="side"][aria-pressed="true"]');
        return button ? button.getAttribute('data-value') : 'front';
      }

      function applyImageForSide(side) {
        const url = side === 'back' ? backURL : frontURL;
        if (!url) return;
        raster.setAttribute('href', url);
        raster.setAttribute('xlink:href', url);
      }

      viewToolbarEl.querySelectorAll('[data-group="side"]').forEach((button) => {
        const handler = () => applyImageForSide(button.getAttribute('data-value'));
        button.addEventListener('click', handler);
        cleanup.push(() => button.removeEventListener('click', handler));
      });

      onActivateCallbacks.push(() => applyImageForSide(getActiveSide()));
    }

    const designToggle = viewToolbarEl.querySelector('[data-toggle="design"]');
    const designOverlay = rootEl.querySelector('#designOverlay');
    if (designToggle && designOverlay) {
      const handler = () => {
        designOverlay.style.display = designToggle.getAttribute('aria-pressed') === 'true' ? 'block' : 'none';
      };
      designToggle.addEventListener('click', handler);
      cleanup.push(() => designToggle.removeEventListener('click', handler));
      handler();
    }

    const frameToggle = viewToolbarEl.querySelector('[data-toggle="frame"]');
    const frameOverlay = rootEl.querySelector('#frameOverlay');
    if (frameToggle && frameOverlay) {
      const handler = () => {
        frameOverlay.style.display = frameToggle.getAttribute('aria-pressed') === 'true' ? 'block' : 'none';
      };
      frameToggle.addEventListener('click', handler);
      cleanup.push(() => frameToggle.removeEventListener('click', handler));
      handler();
    }

    const svg = rootEl.querySelector('#sceneSvg');
    const editButton = viewToolbarEl.querySelector('[data-group="mode"][data-value="edit"]');
    const previewButton = viewToolbarEl.querySelector('[data-group="mode"][data-value="preview"]');
    if (svg && editButton && previewButton) {
      const VIEWBOX_PREVIEW = { x: 0, y: 0, w: 1155, h: 1155 };
      const DESIGN_RECT = { x: 361, y: 180, w: 440, h: 583 };
      const IMAGE_BOUNDS = { x: 0, y: 0, w: 1155, h: 1155 };
      const PADDING_RATIO = 0.05;

      function clampRect(rect, bounds) {
        let { x, y, w, h } = rect;
        if (w > bounds.w) w = bounds.w;
        if (h > bounds.h) h = bounds.h;
        if (x < bounds.x) x = bounds.x;
        if (y < bounds.y) y = bounds.y;
        if (x + w > bounds.x + bounds.w) x = bounds.x + bounds.w - w;
        if (y + h > bounds.y + bounds.h) y = bounds.y + bounds.h - h;
        return { x, y, w, h };
      }

      function expandRect(rect) {
        const padX = rect.w * PADDING_RATIO;
        const padY = rect.h * PADDING_RATIO;
        return clampRect({ x: rect.x - padX, y: rect.y - padY, w: rect.w + padX * 2, h: rect.h + padY * 2 }, IMAGE_BOUNDS);
      }

      function setViewBox({ x, y, w, h }) {
        svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
      }

      function updateViewBox() {
        const inCustomize = root.getAttribute('data-active-section') === 'customize';
        const isEdit = editButton.getAttribute('aria-pressed') === 'true';
        if (inCustomize && isEdit) {
          setViewBox(expandRect(DESIGN_RECT));
        } else {
          setViewBox(VIEWBOX_PREVIEW);
        }
      }

      const handler = updateViewBox;
      editButton.addEventListener('click', handler);
      previewButton.addEventListener('click', handler);
      cleanup.push(() => {
        editButton.removeEventListener('click', handler);
        previewButton.removeEventListener('click', handler);
      });

      window.addEventListener('resize', handler);
      cleanup.push(() => window.removeEventListener('resize', handler));

      handler();
      onActivateCallbacks.push(handler);
    }

    updatePreviewLock();

    return {
      updatePreviewLock,
      onActivate: () => {
        onActivateCallbacks.forEach((callback) => callback());
        updatePreviewLock();
      },
      onDeactivate: () => {
        setDeckDisabled(false);
      },
      destroy: () => {
        cleanup.forEach((fn) => fn());
        setDeckDisabled(false);
      },
    };
  }

  function renderSubpage(section, subpage) {
    const container = subpageContainers.get(section);
    if (!container) return;
    const template = subpageTemplates.get(`${section}:${subpage}`);
    if (!template) return;

    if (section === 'customize' && customizePreviewState && typeof customizePreviewState.destroy === 'function') {
      customizePreviewState.destroy();
      customizePreviewState = null;
    }

    container.replaceChildren(template.content.cloneNode(true));
    activeSubpages.set(section, subpage);

    if (section === 'customize') {
      customizePreviewState = setupCustomizePreview(container) || null;
      const isActive = root.getAttribute('data-active-section') === 'customize';
      if (isActive && customizePreviewState && typeof customizePreviewState.onActivate === 'function') {
        customizePreviewState.onActivate();
      } else if (customizePreviewState && typeof customizePreviewState.updatePreviewLock === 'function') {
        customizePreviewState.updatePreviewLock();
      }
    }
  }

  function setSubpage(section, subpage) {
    const current = activeSubpages.get(section);
    if (current === subpage) {
      updateSubpageButtons(section, subpage);
      return;
    }
    renderSubpage(section, subpage);
    updateSubpageButtons(section, subpage);
  }

  function ensureSubpage(section) {
    const current = activeSubpages.get(section);
    if (current) {
      updateSubpageButtons(section, current);
      return;
    }
    const fallback = defaultSubpages[section] || findFirstSubpage(section);
    if (fallback) {
      setSubpage(section, fallback);
    }
  }

  function setActive(section) {
    root.setAttribute('data-active-section', section);
    updateHeaderButtons(section);
    updateMainPages(section);
    ensureSubpage(section);

    if (customizePreviewState) {
      if (section === 'customize' && typeof customizePreviewState.onActivate === 'function') {
        customizePreviewState.onActivate();
      } else if (section !== 'customize' && typeof customizePreviewState.onDeactivate === 'function') {
        customizePreviewState.onDeactivate();
      }
      if (typeof customizePreviewState.updatePreviewLock === 'function') {
        customizePreviewState.updatePreviewLock();
      }
    } else if (section !== 'customize') {
      setDeckDisabled(false);
    }
  }

  headerButtons.forEach((btn) => {
    btn.addEventListener('click', () => setActive(btn.dataset.section));
    btn.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setActive(btn.dataset.section);
      }
    });
  });

  const subpageButtons = document.querySelectorAll('[data-section-target][data-subpage]');
  subpageButtons.forEach((button) => {
    const section = button.getAttribute('data-section-target');
    const subpage = button.getAttribute('data-subpage');
    if (!section || !subpage) return;

    const activate = () => {
      setSubpage(section, subpage);
      if (root.getAttribute('data-active-section') !== section) {
        setActive(section);
      }
    };

    button.addEventListener('click', activate);
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    });
  });

  // ============================================================
  // DROPDOWN PANELS LOGIC (Customize toolbar -> Panels)
  // ============================================================
  const customizeToolbar = document.querySelector('.toolbar[data-section="customize"]');
  const customizeButtons = customizeToolbar ? customizeToolbar.querySelectorAll('.tool[data-tool]') : [];
  const panelNames = new Set(['designs', 'elements', 'text', 'color', 'edit', 'layers']);
  let currentOpenPanel = '';

  function getCustomizeButtonByName(name) {
    return customizeToolbar ? customizeToolbar.querySelector(`.tool[data-tool="${name}"]`) : null;
  }

  function openPanel(name) {
    if (!panelNames.has(name)) return;

    if (currentOpenPanel && currentOpenPanel !== name) {
      const previousButton = getCustomizeButtonByName(currentOpenPanel);
      if (previousButton) {
        previousButton.setAttribute('aria-pressed', 'false');
      }
    }

    root.setAttribute('data-open-panel', name);
    currentOpenPanel = name;

    const button = getCustomizeButtonByName(name);
    if (button) {
      button.setAttribute('aria-pressed', 'true');
    }
  }

  function closePanel() {
    const name = root.getAttribute('data-open-panel') || '';
    if (name) {
      const button = getCustomizeButtonByName(name);
      if (button) {
        button.setAttribute('aria-pressed', 'false');
      }
    }
    root.setAttribute('data-open-panel', '');
    currentOpenPanel = '';
  }

  customizeButtons.forEach((button) => {
    const tool = button.getAttribute('data-tool');
    if (tool && panelNames.has(tool)) {
      button.addEventListener('click', () => openPanel(tool));
    }
  });

  document.querySelectorAll('[data-close-panel]').forEach((button) => {
    button.addEventListener('click', closePanel);
  });

  // ============================================================
  // INITIAL STATE
  // ============================================================
  setActive(root.getAttribute('data-active-section') || 'explore');
});
