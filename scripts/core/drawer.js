import { state } from './state.js';

export function initDrawer(dom, { onPanelChange } = {}) {
  let activeDrawerPanel = null;
  let isDrawerExpanded = false;
  let forceFullHeight = false;
  const panelStack = [];

  function applyDrawerExpansion(expanded) {
    if (!dom.drawer) return;
    isDrawerExpanded = Boolean(expanded);
    refreshDrawerSizing();
    if (dom.drawerExpand) {
      dom.drawerExpand.setAttribute('aria-pressed', String(isDrawerExpanded));
      dom.drawerExpand.setAttribute(
        'aria-label',
        isDrawerExpanded ? 'Collapse drawer' : 'Expand drawer'
      );
      dom.drawerExpand.setAttribute(
        'title',
        isDrawerExpanded ? 'Collapse drawer' : 'Expand drawer'
      );
    }
    if (dom.drawerExpandIcon) {
      const iconPath = isDrawerExpanded
        ? 'assets/icons/drawer_close_down.svg'
        : 'assets/icons/drawer_open_up.svg';
      dom.drawerExpandIcon.setAttribute('src', iconPath);
    }
    if (typeof scheduleLayoutUpdate === 'function') {
      scheduleLayoutUpdate();
    }
  }

  function refreshDrawerSizing() {
    if (!dom.drawer) return;
    const shouldFillHeight = isDrawerExpanded || forceFullHeight;
    dom.drawer.classList.toggle('is-expanded', isDrawerExpanded);
    dom.drawer.classList.toggle('is-fullheight', shouldFillHeight);
  }

  function updateLayoutMetrics() {
    if (!dom.appShell || !dom.appHeader || !dom.appFooter) return;
    const headerRect = dom.appHeader.getBoundingClientRect();
    const footerRect = dom.appFooter.getBoundingClientRect();
    const appRect = dom.appShell.getBoundingClientRect();
    const headerHeight = headerRect.height;
    const footerHeight = footerRect.height;
    const available = Math.max(0, window.innerHeight - headerHeight - footerHeight);
    document.documentElement.style.setProperty('--header-h', `${headerHeight}px`);
    document.documentElement.style.setProperty('--footer-h', `${footerHeight}px`);
    document.documentElement.style.setProperty('--avail', `${available}px`);
    const drawerTop = appRect.top + headerHeight + available * 0.7;
    document.documentElement.style.setProperty('--drawer-top', `${drawerTop}px`);
    document.documentElement.style.setProperty('--app-left', `${appRect.left}px`);
    document.documentElement.style.setProperty('--app-width', `${appRect.width}px`);
  }

  function getPanelTitle(panel) {
    if (!panel) return 'Menu';
    return panel.dataset.drawerTitle || panel.querySelector('h2')?.textContent || 'Menu';
  }

  function updateActivePanel(panel, { preserveExpansion = false } = {}) {
    if (!dom.drawerSections.length) return;
    const previousPanel = activeDrawerPanel;
    if (previousPanel && previousPanel !== panel && previousPanel.classList.contains('gallery-panel')) {
      const addButton = previousPanel.querySelector('.gallery-add-button');
      if (addButton) {
        addButton.disabled = true;
        addButton.classList.remove('is-enabled');
      }
    }

    dom.drawerSections.forEach((section) => {
      const isActive = section === panel;
      section.hidden = !isActive;
      section.setAttribute('aria-hidden', String(!isActive));
      if (isActive) {
        section.scrollTop = 0;
      }
    });
    if (dom.galleryButton) {
      const showPrimaryAction = Boolean(panel?.classList.contains('gallery-panel'));
      dom.galleryButton.classList.toggle('is-visible', showPrimaryAction);
      dom.galleryButton.toggleAttribute('hidden', !showPrimaryAction);
    }
    activeDrawerPanel = panel || null;
    forceFullHeight = Boolean(activeDrawerPanel?.dataset.drawerFullheight === 'true');
    if (dom.layerLimitIndicator) {
      const showLimit = activeDrawerPanel === dom.layerPanel;
      dom.layerLimitIndicator.toggleAttribute('hidden', !showLimit);
      if (!showLimit) {
        dom.layerLimitIndicator.classList.remove('is-full');
      }
    }
    if (!preserveExpansion && previousPanel !== activeDrawerPanel) {
      applyDrawerExpansion(false);
    } else {
      refreshDrawerSizing();
    }
    if (typeof onPanelChange === 'function') {
      onPanelChange(activeDrawerPanel);
    }
  }

  function openDrawerPanel(panel, options = {}) {
    if (!dom.drawer || !panel) return;
    const { push = false, preserveExpansion = false } = options;

    if (push) {
      const top = panelStack[panelStack.length - 1];
      if (activeDrawerPanel && top !== activeDrawerPanel) {
        panelStack.push(activeDrawerPanel);
      } else if (!panelStack.length && activeDrawerPanel) {
        panelStack.push(activeDrawerPanel);
      }
      panelStack.push(panel);
    } else {
      panelStack.length = 0;
      panelStack.push(panel);
    }

    updateActivePanel(panel, { preserveExpansion });
    const resolvedTitle = options.title || getPanelTitle(panel);
    if (dom.drawerTitle) {
      dom.drawerTitle.textContent = resolvedTitle;
    }
    dom.drawer.classList.add('open');
    dom.drawer.setAttribute('aria-hidden', 'false');
    if (panel !== dom.precisionPanel && dom.collapsePrecision) {
      dom.collapsePrecision.setAttribute('aria-expanded', 'false');
    }
  }

  function closeDrawer() {
    if (!dom.drawer) return;
    if (activeDrawerPanel?.classList.contains('gallery-panel')) {
      state.activeTemplate = null;
      const addButton = activeDrawerPanel.querySelector('.gallery-add-button');
      if (addButton) {
        addButton.disabled = true;
        addButton.classList.remove('is-enabled');
      }
    }
    panelStack.length = 0;
    dom.drawer.classList.remove('open');
    dom.drawer.setAttribute('aria-hidden', 'true');
    updateActivePanel(null);
    if (dom.drawerTitle) {
      dom.drawerTitle.textContent = 'Menu';
    }
    if (dom.collapsePrecision) {
      dom.collapsePrecision.setAttribute('aria-expanded', 'false');
    }
  }

  function popDrawerPanel() {
    if (panelStack.length <= 1) {
      closeDrawer();
      return;
    }
    panelStack.pop();
    const previous = panelStack[panelStack.length - 1] || null;
    updateActivePanel(previous, { preserveExpansion: true });
    if (dom.drawerTitle) {
      dom.drawerTitle.textContent = getPanelTitle(previous);
    }
  }

  const scheduleLayoutUpdate = () => window.requestAnimationFrame(updateLayoutMetrics);
  window.addEventListener('resize', scheduleLayoutUpdate);
  window.addEventListener('orientationchange', scheduleLayoutUpdate);
  scheduleLayoutUpdate();

  if (dom.drawerExpand) {
    dom.drawerExpand.addEventListener('click', () => {
      applyDrawerExpansion(!isDrawerExpanded);
    });
  }

  applyDrawerExpansion(false);

  if (dom.drawerClose) {
    dom.drawerClose.addEventListener('click', () => {
      if (panelStack.length > 1) {
        popDrawerPanel();
      } else {
        closeDrawer();
      }
    });
  }

  document.addEventListener('click', (event) => {
    if (!dom.drawer || !dom.drawer.classList.contains('open')) return;
    const target = event.target;
    if (dom.drawer.contains(target)) return;
    if (target.closest('.toolbar-btn') || target.closest('.collapse-precision')) return;
    if (dom.layerPanel && activeDrawerPanel === dom.layerPanel) return;
    closeDrawer();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (dom.drawer && dom.drawer.classList.contains('open')) {
      closeDrawer();
    }
  });

  return {
    openDrawerPanel,
    closeDrawer,
    setActiveDrawerPanel: (panel, options = {}) => updateActivePanel(panel, options),
    getActiveDrawerPanel: () => activeDrawerPanel
  };
}
