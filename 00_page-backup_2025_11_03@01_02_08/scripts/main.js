import { loadDrawerViews } from './core/drawer-loader.js';
import { createDomReferences } from './core/dom.js';
import { context } from './core/context.js';
import { initDrawer } from './core/drawer.js';
import { createLayerManager } from './panels/layers.js';
import { initSelection } from './canvas/selection.js';
import { initPrecisionPanel } from './panels/precision.js';
import { initViewMode } from './canvas/view-mode.js';
import { initGallery } from './panels/gallery.js';
import { designTemplates, elementTemplates, textTemplates } from './templates/index.js';
async function bootstrap() {
  await loadDrawerViews();
  const dom = createDomReferences();
  context.dom = dom;

  const drawer = initDrawer(dom);
  let selection;
  let precision;

  const layerManager = createLayerManager(dom, {
    onSelectionChanged: () => selection?.updateSelectionOverlay(),
    onPrecisionRequested: () => precision?.updatePrecisionControls(),
    onOpenAdjustPanel: () => {
      drawer.openDrawerPanel(dom.precisionPanel, {
        title: 'Precision Controls',
        push: true,
        preserveExpansion: true
      });
      precision?.updatePrecisionControls();
    },
    onLayerPointerDown: (event) => selection?.handleLayerPointerDown(event)
  });

  selection = initSelection(dom, layerManager, {
    onPrecisionRequested: () => precision?.updatePrecisionControls()
  });

  precision = initPrecisionPanel(dom, layerManager, selection);
  const viewMode = initViewMode(dom, selection, drawer);
  const gallery = initGallery(dom, drawer, layerManager);

  function handleCollapsePrecision() {
    const expanded = dom.collapsePrecision.getAttribute('aria-expanded') === 'true';
    const nextState = !expanded;
    dom.collapsePrecision.setAttribute('aria-expanded', String(nextState));
    if (nextState) {
      drawer.openDrawerPanel(dom.precisionPanel, { title: 'Precision Controls' });
      precision.updatePrecisionControls();
    } else if (drawer.getActiveDrawerPanel() === dom.precisionPanel) {
      drawer.closeDrawer();
    } else {
      dom.precisionPanel.hidden = true;
      dom.precisionPanel.setAttribute('aria-hidden', 'true');
    }
  }

  if (dom.collapsePrecision) {
    dom.collapsePrecision.addEventListener('click', handleCollapsePrecision);
  }

  dom.toolbarButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      if (action === 'designs') {
        gallery.openGallery('Design', designTemplates);
      } else if (action === 'elements') {
        gallery.openGallery('Element', elementTemplates);
      } else if (action === 'text') {
        gallery.openGallery('Text', textTemplates);
      } else if (action === 'layers') {
        drawer.openDrawerPanel(dom.layerPanel, { title: 'Layers' });
      } else if (action === 'export') {
        drawer.closeDrawer();
        exportSvg();
      }
    });
  });

  if (dom.layerRoot) {
    dom.layerRoot.addEventListener('click', (event) => {
      if (context.currentViewMode !== 'edit') return;
      const target = event.target.closest('[data-layer-id]');
      if (!target) return;
      layerManager.setActiveLayer(target.dataset.layerId);
    });
  }

  function exportSvg() {
    const clone = dom.svgCanvas.cloneNode(true);
    const fullView = context.viewBoxes.full;
    clone.setAttribute('viewBox', `${fullView.x} ${fullView.y} ${fullView.width} ${fullView.height}`);
    clone.querySelectorAll('.layer').forEach((node) => {
      node.removeAttribute('tabindex');
    });
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(clone);
    const blob = new Blob([
      '<?xml version="1.0" encoding="UTF-8"?>\n',
      source
    ], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tshirt-design.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function init() {
    drawer.closeDrawer();
    precision.updatePrecisionControls();
    viewMode.setFrameVisibility(context.frameVisible);
    viewMode.setViewMode(context.currentViewMode);
    layerManager.refreshLayerList();
    layerManager.syncLayerDom();
  }

  init();
}

bootstrap().catch((error) => {
  console.error('Failed to initialize application', error);
});
