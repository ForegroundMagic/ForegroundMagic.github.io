import { state } from './state.js';

export function initDrawer(dom, { onPanelChange } = {}) {
  let activeDrawerPanel = null;
  let isDrawerExpanded = false;

  function applyDrawerExpansion(expanded) {
    if (!dom.drawer) return;
    isDrawerExpanded = Boolean(expanded);
    dom.drawer.classList.toggle('is-expanded', isDrawerExpanded);
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
      dom.drawerExpandIcon.textContent = isDrawerExpanded ? '⤡' : '⤢';
    }
    if (typeof scheduleLayoutUpdate === 'function') {
      scheduleLayoutUpdate();
    }
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

  function setActiveDrawerPanel(panel) {
    if (!dom.drawerSections.length) return;
    dom.drawerSections.forEach((section) => {
      const isActive = section === panel;
      section.hidden = !isActive;
      section.setAttribute('aria-hidden', String(!isActive));
      if (isActive) {
        section.scrollTop = 0;
      }
    });
    if (dom.galleryButton) {
      const showPrimaryAction = panel === dom.galleryPanel;
      dom.galleryButton.classList.toggle('is-visible', showPrimaryAction);
      dom.galleryButton.toggleAttribute('hidden', !showPrimaryAction);
    }
    activeDrawerPanel = panel || null;
    if (typeof onPanelChange === 'function') {
      onPanelChange(activeDrawerPanel);
    }
  }

  function openDrawerPanel(panel, options = {}) {
    if (!dom.drawer || !panel) return;
    setActiveDrawerPanel(panel);
    const resolvedTitle =
      options.title || panel.dataset.drawerTitle || panel.querySelector('h2')?.textContent || 'Menu';
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
    if (activeDrawerPanel === dom.galleryPanel) {
      state.activeTemplate = null;
      if (dom.galleryButton) {
        dom.galleryButton.disabled = true;
      }
    }
    applyDrawerExpansion(false);
    dom.drawer.classList.remove('open');
    dom.drawer.setAttribute('aria-hidden', 'true');
    setActiveDrawerPanel(null);
    if (dom.collapsePrecision) {
      dom.collapsePrecision.setAttribute('aria-expanded', 'false');
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
      closeDrawer();
    });
  }

  document.addEventListener('click', (event) => {
    if (!dom.drawer || !dom.drawer.classList.contains('open')) return;
    const target = event.target;
    if (dom.drawer.contains(target)) return;
    if (target.closest('.toolbar-btn') || target.closest('.collapse-precision')) return;
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
    setActiveDrawerPanel,
    getActiveDrawerPanel: () => activeDrawerPanel
  };
}
