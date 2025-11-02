'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;

  // ============================================================
  // SECTION SWITCHING (Header 'Explore' / 'Customize' / 'Order')
  // ============================================================
  const headerButtons = document.querySelectorAll('.header-tools .tool');
  const mainPages = document.querySelectorAll('.main-page');

  function setActive(section) {
    root.setAttribute('data-active-section', section);
    headerButtons.forEach((btn) => {
      const isActive = btn.dataset.section === section;
      btn.toggleAttribute('aria-current', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
      btn.classList.toggle('is-active', isActive);
    });

    mainPages.forEach((page) => {
      const isCurrent = page.dataset.section === section;
      page.toggleAttribute('hidden', !isCurrent);
      page.setAttribute('aria-hidden', String(!isCurrent));
    });
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

  // ============================================================
  // VIEW TOOLBAR BEHAVIOR (exclusive groups + independent toggles)
  // ============================================================
  const viewToolbarEl = document.querySelector('.view-mode-toolbar');
  const toolbarDeck = document.querySelector('.toolbar-deck');

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

  if (viewToolbarEl) {
    makeExclusiveWithin(viewToolbarEl, 'side');
    makeExclusiveWithin(viewToolbarEl, 'mode');
    wireToggles(viewToolbarEl);
  }

  function isModeActive(value) {
    if (!viewToolbarEl) return false;
    const button = viewToolbarEl.querySelector(`[data-group="mode"][data-value="${value}"]`);
    return button ? button.getAttribute('aria-pressed') === 'true' : false;
  }

  function setDeckDisabled(disabled) {
    if (!toolbarDeck) return;
    toolbarDeck.querySelectorAll('.tool').forEach((button) => {
      button.disabled = Boolean(disabled);
      button.setAttribute('aria-disabled', String(Boolean(disabled)));
    });
  }

  function updatePreviewLock() {
    const inCustomize = root.getAttribute('data-active-section') === 'customize';
    const lock = inCustomize && isModeActive('preview') && !isModeActive('edit');
    setDeckDisabled(lock);
  }

  if (viewToolbarEl) {
    viewToolbarEl.querySelectorAll('[data-group="mode"]').forEach((button) => {
      button.addEventListener('click', updatePreviewLock);
    });
  }

  const sectionObserver = new MutationObserver(updatePreviewLock);
  sectionObserver.observe(root, { attributes: true, attributeFilter: ['data-active-section'] });

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
  updatePreviewLock();

  // ============================================================
  // IMAGE STAGE (SVG): load real product images for Front/Back
  // ============================================================
  (function initImageStage() {
    const raster = document.getElementById('raster');
    if (!raster) return;

    const frontURL = raster.getAttribute('data-front-src');
    const backURL = raster.getAttribute('data-back-src');
    [frontURL, backURL].filter(Boolean).forEach((url) => {
      const image = new Image();
      image.src = url;
    });

    function getActiveSide() {
      const button = document.querySelector('.view-mode-toolbar [data-group="side"][aria-pressed="true"]');
      return button ? button.getAttribute('data-value') : 'front';
    }

    function applyImageForSide(side) {
      const url = side === 'back' ? backURL : frontURL;
      if (!url) return;
      raster.setAttribute('href', url);
      raster.setAttribute('xlink:href', url);
    }

    document.querySelectorAll('.view-mode-toolbar [data-group="side"]').forEach((button) => {
      button.addEventListener('click', () => {
        applyImageForSide(button.getAttribute('data-value'));
      });
    });

    const observer = new MutationObserver(() => {
      if (root.getAttribute('data-active-section') === 'customize') {
        applyImageForSide(getActiveSide());
      }
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-active-section'] });

    if (root.getAttribute('data-active-section') === 'customize') {
      applyImageForSide(getActiveSide());
    }
  })();

  // ============================================================
  // DESIGN OVERLAY (SVG <g>) — toggled by Design button
  // ============================================================
  (function initDesignOverlay() {
    const designToggle = document.querySelector('.view-mode-toolbar [data-toggle="design"]');
    const overlay = document.getElementById('designOverlay');
    if (!designToggle || !overlay) return;

    function update() {
      overlay.style.display = designToggle.getAttribute('aria-pressed') === 'true' ? 'block' : 'none';
    }

    designToggle.addEventListener('click', update);
    update();
  })();

  // ============================================================
  // EDIT MODE ZOOM — focus on svg_canvas_area with padding
  // ============================================================
  (function initEditModeZoom() {
    const svg = document.getElementById('sceneSvg');
    const editButton = document.querySelector('.view-mode-toolbar [data-group="mode"][data-value="edit"]');
    const previewButton = document.querySelector('.view-mode-toolbar [data-group="mode"][data-value="preview"]');
    if (!svg || !editButton || !previewButton) return;

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

    function update() {
      const inCustomize = root.getAttribute('data-active-section') === 'customize';
      const isEdit = editButton.getAttribute('aria-pressed') === 'true';
      if (inCustomize && isEdit) {
        setViewBox(expandRect(DESIGN_RECT));
      } else {
        setViewBox(VIEWBOX_PREVIEW);
      }
    }

    [editButton, previewButton].forEach((button) => {
      button.addEventListener('click', update);
    });

    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['data-active-section'] });

    window.addEventListener('resize', update);

    update();
  })();

  // ============================================================
  // FRAME OVERLAY — toggled by Frame button (dashed outline)
  // ============================================================
  (function initFrameOverlay() {
    const frameToggle = document.querySelector('.view-mode-toolbar [data-toggle="frame"]');
    const frameOverlay = document.getElementById('frameOverlay');
    if (!frameToggle || !frameOverlay) return;

    function update() {
      frameOverlay.style.display = frameToggle.getAttribute('aria-pressed') === 'true' ? 'block' : 'none';
    }

    frameToggle.addEventListener('click', update);
    update();
  })();
});
