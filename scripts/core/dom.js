export function createDomReferences() {
  const drawer = document.getElementById('drawer');
  const drawerBody = document.getElementById('drawer-body');
  const drawerExpand = document.getElementById('drawer-expand');
  const galleryPanels = new Map();
  if (drawerBody) {
    drawerBody.querySelectorAll('.gallery-panel[data-gallery-type]').forEach((panel) => {
      const type = panel.dataset.galleryType?.toLowerCase();
      if (!type) return;
      galleryPanels.set(type, {
        panel,
        searchInput: panel.querySelector('.gallery-search-input'),
        activeTags: panel.querySelector('.gallery-active-tags'),
        tagStrip: panel.querySelector('.gallery-tag-strip'),
        grid: panel.querySelector('.gallery-grid'),
        prevButton: panel.querySelector('.gallery-prev'),
        nextButton: panel.querySelector('.gallery-next'),
        pageIndicator: panel.querySelector('.page-indicator'),
        addButton: panel.querySelector('.gallery-add-button')
      });
    });
  }
  return {
    appShell: document.querySelector('.app-shell'),
    appHeader: document.querySelector('.app-header'),
    controlsRegion: document.querySelector('.controls-region'),
    controlRegion: document.querySelector('.preview-control-region'),
    toolbarRegion: document.querySelector('.toolbar-region'),
    svgCanvas: document.getElementById('svg-canvas'),
    selectionOverlay: document.getElementById('selection-overlay'),
    selectionFrame: document.querySelector('#selection-overlay .selection-frame'),
    rotateHandle: document.querySelector('#selection-overlay .rotate-handle'),
    handles: Array.from(document.querySelectorAll('#selection-overlay .handle')),
    designAreaHitbox: document.getElementById('design-area-hitbox'),
    designAreaClipRect: document.getElementById('design-area-clip-rect'),
    viewToggleButtons: Array.from(document.querySelectorAll('[data-view-mode]')),
    frameToggleButton: document.querySelector('[data-toggle="frame"]'),
    designToggleButton: document.querySelector('[data-toggle="design"]'),
    editToolbar: document.querySelector('[data-toolbar="edit"]'),
    fullToolbar: document.querySelector('[data-toolbar="full"]'),
    drawer,
    drawerTitle: document.getElementById('drawer-title'),
    layerLimitIndicator: document.getElementById('layer-limit-indicator'),
    drawerBody,
    drawerClose: document.getElementById('drawer-close'),
    drawerExpand,
    drawerExpandIcon: drawerExpand ? drawerExpand.querySelector('.drawer-expand-icon') : null,
    drawerSections: drawerBody ? Array.from(drawerBody.querySelectorAll('.drawer-section')) : [],
    layerRoot: document.getElementById('layer-root'),
    layerPanel: document.getElementById('layer-panel'),
    layerList: document.getElementById('layer-list'),
    galleryPanels,
    precisionPanel: document.getElementById('precision-panel'),
    preciseName: document.getElementById('precise-name'),
    preciseX: document.getElementById('precise-x'),
    preciseY: document.getElementById('precise-y'),
    preciseScale: document.getElementById('precise-scale'),
    preciseRotation: document.getElementById('precise-rotation'),
    preciseColor: document.getElementById('precise-color'),
    preciseFont: document.getElementById('precise-font'),
    preciseFontSize: document.getElementById('precise-font-size'),
    preciseText: document.getElementById('precise-text'),
    toggleBold: document.getElementById('toggle-bold'),
    toggleItalic: document.getElementById('toggle-italic'),
    preciseRotationSlider: document.getElementById('precise-rotation-slider'),
    preciseXSlider: document.getElementById('precise-x-slider'),
    preciseYSlider: document.getElementById('precise-y-slider'),
    preciseScaleSlider: document.getElementById('precise-scale-slider'),
    collapsePrecision: document.querySelector('.collapse-precision'),
    toolbarButtons: Array.from(document.querySelectorAll('.toolbar-btn')),
    layerTemplate: document.getElementById('layer-row-template'),
    galleryTemplate: document.getElementById('gallery-item-template')
  };
}
