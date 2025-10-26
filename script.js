const svgNS = 'http://www.w3.org/2000/svg';
const svgCanvas = document.getElementById('svg-canvas');
const selectionOverlay = document.getElementById('selection-overlay');
const selectionFrame = selectionOverlay.querySelector('.selection-frame');
const rotateHandle = selectionOverlay.querySelector('.rotate-handle');
const handles = Array.from(selectionOverlay.querySelectorAll('.handle'));
const designAreaHitbox = document.getElementById('design-area-hitbox');
const viewToggleButtons = Array.from(document.querySelectorAll('[data-view-mode]'));

const layerRoot = document.getElementById('layer-root');

const layerPanel = document.getElementById('layer-panel');
const layerList = document.getElementById('layer-list');
const galleryPanel = document.getElementById('gallery-panel');
const galleryTitle = document.getElementById('gallery-title');
const galleryContent = document.getElementById('gallery-content');
const galleryButton = document.getElementById('add-gallery-item');
const precisionPanel = document.getElementById('precision-panel');

const preciseX = document.getElementById('precise-x');
const preciseY = document.getElementById('precise-y');
const preciseScale = document.getElementById('precise-scale');
const preciseRotation = document.getElementById('precise-rotation');
const preciseColor = document.getElementById('precise-color');
const preciseFont = document.getElementById('precise-font');
const preciseFontSize = document.getElementById('precise-font-size');
const preciseText = document.getElementById('precise-text');
const toggleBold = document.getElementById('toggle-bold');
const toggleItalic = document.getElementById('toggle-italic');
const deleteLayerButton = document.getElementById('delete-layer');

const collapsePrecision = document.querySelector('.collapse-precision');
const toolbarButtons = Array.from(document.querySelectorAll('.toolbar-btn'));

const layerTemplate = document.getElementById('layer-row-template');
const galleryTemplate = document.getElementById('gallery-item-template');

const printableArea = {
  x: 361,
  y: 180,
  width: 440,
  height: 583,
  minScale: 0.25,
  maxScale: 4
};

const viewBoxes = {
  full: { x: 0, y: 0, width: 1155, height: 1155 },
  edit: computeEditViewBox()
};

let currentViewMode = 'full';

function createId(prefix) {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

let counters = {
  Design: 0,
  Element: 0,
  Text: 0
};

const state = {
  layers: [],
  activeLayerId: null,
  activeTemplate: null,
  galleryType: null,
  interaction: null,
  needsRender: false
};

const center = {
  x: printableArea.width / 2,
  y: printableArea.height / 2
};

const designTemplates = [
  {
    type: 'Design',
    key: 'sunsetWaves',
    name: 'Sunset Waves',
    preview: '🌅',
    width: 240,
    height: 240,
    baseColor: '#ff6b6b',
    createContent(node) {
      const gradientId = createId('grad');
      const defs = ensureDefs();
      const gradient = document.createElementNS(svgNS, 'linearGradient');
      gradient.setAttribute('id', gradientId);
      gradient.setAttribute('x1', '0%');
      gradient.setAttribute('y1', '0%');
      gradient.setAttribute('x2', '0%');
      gradient.setAttribute('y2', '100%');
      const stop1 = document.createElementNS(svgNS, 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', '#ff6b6b');
      const stop2 = document.createElementNS(svgNS, 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', '#fbd786');
      gradient.append(stop1, stop2);
      defs.appendChild(gradient);

      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', '120');
      circle.setAttribute('cy', '110');
      circle.setAttribute('r', '90');
      circle.setAttribute('fill', `url(#${gradientId})`);
      circle.setAttribute('opacity', '0.95');

      const wavePath = document.createElementNS(svgNS, 'path');
      wavePath.setAttribute('d', 'M0 160 C40 140 80 160 120 150 C160 140 200 160 240 150 V240 H0 Z');
      wavePath.setAttribute('fill', '#4d8dff');
      wavePath.setAttribute('opacity', '0.85');

      const wave2 = document.createElementNS(svgNS, 'path');
      wave2.setAttribute('d', 'M0 190 C60 175 100 200 140 185 C180 170 220 200 240 190 V240 H0 Z');
      wave2.setAttribute('fill', '#3850ff');
      wave2.setAttribute('opacity', '0.75');

      node.append(circle, wavePath, wave2);
    }
  },
  {
    type: 'Design',
    key: 'astroBadge',
    name: 'Astro Badge',
    preview: '👩‍🚀',
    width: 200,
    height: 260,
    baseColor: '#6c7ae0',
    createContent(node) {
      const body = document.createElementNS(svgNS, 'rect');
      body.setAttribute('x', '10');
      body.setAttribute('y', '10');
      body.setAttribute('width', '180');
      body.setAttribute('height', '240');
      body.setAttribute('rx', '35');
      body.setAttribute('fill', '#222639');
      body.setAttribute('stroke', '#6c7ae0');
      body.setAttribute('stroke-width', '6');

      const star = document.createElementNS(svgNS, 'polygon');
      star.setAttribute('points', '100,55 112,90 150,90 118,112 130,150 100,130 70,150 82,112 50,90 88,90');
      star.setAttribute('fill', '#ffc857');
      star.setAttribute('filter', 'url(#selection-shadow)');

      const orbit = document.createElementNS(svgNS, 'path');
      orbit.setAttribute('d', 'M40 180 C80 150 120 210 160 180');
      orbit.setAttribute('stroke', '#6c7ae0');
      orbit.setAttribute('stroke-width', '8');
      orbit.setAttribute('stroke-linecap', 'round');
      orbit.setAttribute('fill', 'none');

      const planet = document.createElementNS(svgNS, 'circle');
      planet.setAttribute('cx', '140');
      planet.setAttribute('cy', '170');
      planet.setAttribute('r', '20');
      planet.setAttribute('fill', '#ff6b6b');

      node.append(body, star, orbit, planet);
    }
  }
];

const elementTemplates = [
  {
    type: 'Element',
    key: 'sparkle',
    name: 'Sparkle',
    preview: '✴️',
    width: 140,
    height: 140,
    baseColor: '#f9f871',
    createContent(node) {
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', 'M70 0 L85 55 L140 70 L85 85 L70 140 L55 85 L0 70 L55 55 Z');
      path.setAttribute('fill', '#f9f871');
      node.append(path);
    },
    colorAttribute: 'fill'
  },
  {
    type: 'Element',
    key: 'ring',
    name: 'Orbit Ring',
    preview: '⭕',
    width: 180,
    height: 120,
    baseColor: '#7c5cff',
    createContent(node) {
      const ellipse = document.createElementNS(svgNS, 'ellipse');
      ellipse.setAttribute('cx', '90');
      ellipse.setAttribute('cy', '60');
      ellipse.setAttribute('rx', '85');
      ellipse.setAttribute('ry', '40');
      ellipse.setAttribute('fill', 'none');
      ellipse.setAttribute('stroke', '#7c5cff');
      ellipse.setAttribute('stroke-width', '12');
      node.append(ellipse);
    },
    colorAttribute: 'stroke'
  },
  {
    type: 'Element',
    key: 'heart',
    name: 'Heart',
    preview: '❤️',
    width: 160,
    height: 140,
    baseColor: '#ff4d6d',
    createContent(node) {
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', 'M80 132 L20 72 C-10 42 20 0 60 20 C80 30 90 45 80 65 C90 45 110 30 130 20 C170 0 200 42 170 72 Z');
      path.setAttribute('fill', '#ff4d6d');
      node.append(path);
    },
    colorAttribute: 'fill'
  }
];

const textTemplates = [
  {
    type: 'Text',
    key: 'boldStatement',
    name: 'Bold Statement',
    preview: 'Bold',
    width: 260,
    height: 120,
    text: 'Reach for the Stars',
    fontSize: 28,
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 700,
    fontStyle: 'normal',
    fill: '#ffffff'
  },
  {
    type: 'Text',
    key: 'scripted',
    name: 'Scripted',
    preview: 'Script',
    width: 240,
    height: 140,
    text: 'Dream Big',
    fontSize: 36,
    fontFamily: "'Georgia', serif",
    fontWeight: 600,
    fontStyle: 'italic',
    fill: '#ffe066'
  },
  {
    type: 'Text',
    key: 'tagline',
    name: 'Tagline',
    preview: 'Tag',
    width: 280,
    height: 110,
    text: 'Cosmic Explorer',
    fontSize: 26,
    fontFamily: "'Roboto', sans-serif",
    fontWeight: 500,
    fontStyle: 'normal',
    fill: '#7c5cff'
  }
];

function ensureDefs() {
  let defs = svgCanvas.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS(svgNS, 'defs');
    svgCanvas.insertBefore(defs, svgCanvas.firstChild);
  }
  return defs;
}

function createLayerFromTemplate(template) {
  const outer = document.createElementNS(svgNS, 'g');
  outer.classList.add('layer');
  outer.dataset.type = template.type;
  const inner = document.createElementNS(svgNS, 'g');
  inner.classList.add('layer-inner');
  outer.appendChild(inner);

  if (template.type === 'Text') {
    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', template.width / 2);
    text.setAttribute('y', template.height / 2);
    text.setAttribute('fill', template.fill);
    text.setAttribute('font-size', template.fontSize);
    text.setAttribute('font-family', template.fontFamily);
    text.setAttribute('font-weight', template.fontWeight);
    text.setAttribute('font-style', template.fontStyle);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.textContent = template.text;
    inner.appendChild(text);
  } else {
    template.createContent(inner);
  }

  const layerId = createId('layer');
  outer.dataset.layerId = layerId;
  outer.setAttribute('tabindex', '0');
  outer.addEventListener('pointerdown', onLayerPointerDown);

  layerRoot.appendChild(outer);

  const layer = {
    id: layerId,
    type: template.type,
    name: createLayerName(template.type),
    group: outer,
    inner,
    width: template.width,
    height: template.height,
    cx: center.x,
    cy: center.y,
    scale: 1,
    rotation: 0,
    colorAttribute: template.colorAttribute || 'fill'
  };

  if (template.type === 'Text') {
    layer.text = template.text;
    layer.fill = template.fill;
    layer.fontFamily = template.fontFamily;
    layer.fontSize = template.fontSize;
    layer.fontWeight = template.fontWeight;
    layer.fontStyle = template.fontStyle;
    updateTextLayer(layer, { skipRender: true });
  }

  if (template.type !== 'Text') {
    layer.fill = template.fill || template.baseColor || '#ffffff';
  }

  state.layers.push(layer);
  setActiveLayer(layer.id);
  scheduleRender();
  refreshLayerList();
  syncLayerDom();
}

function createLayerName(type) {
  counters[type] += 1;
  return `${type}_${counters[type]}`;
}

function setActiveLayer(id) {
  state.activeLayerId = id;
  updateSelectionOverlay();
  updatePrecisionControls();
  refreshLayerList();
}

function getActiveLayer() {
  return state.layers.find((layer) => layer.id === state.activeLayerId) || null;
}

function scheduleRender() {
  if (state.needsRender) return;
  state.needsRender = true;
  requestAnimationFrame(() => {
    state.needsRender = false;
    state.layers.forEach(updateLayerTransform);
    updateSelectionOverlay();
  });
}

function updateLayerTransform(layer) {
  const { cx, cy, scale, rotation, width, height } = layer;
  const transform = `translate(${cx} ${cy}) rotate(${rotation}) scale(${scale})`;
  layer.group.setAttribute('transform', transform);
  layer.inner.setAttribute('transform', `translate(${-width / 2} ${-height / 2})`);
}

function updateSelectionOverlay() {
  const layer = getActiveLayer();
  if (!layer || !designAreaHitbox) {
    selectionOverlay.hidden = true;
    return;
  }

  const areaRect = designAreaHitbox.getBoundingClientRect();
  const containerRect = svgCanvas.parentElement.getBoundingClientRect();
  const scaleX = areaRect.width / printableArea.width;
  const scaleY = areaRect.height / printableArea.height;
  const widthPx = layer.width * layer.scale * scaleX;
  const heightPx = layer.height * layer.scale * scaleY;
  const centerX = areaRect.left + layer.cx * scaleX;
  const centerY = areaRect.top + layer.cy * scaleY;

  const overlay = selectionOverlay;
  overlay.hidden = false;
  overlay.style.width = `${widthPx}px`;
  overlay.style.height = `${heightPx}px`;
  overlay.style.left = `${centerX - containerRect.left - widthPx / 2}px`;
  overlay.style.top = `${centerY - containerRect.top - heightPx / 2}px`;
  overlay.style.transformOrigin = 'center center';
  overlay.style.transform = `rotate(${layer.rotation}deg)`;

  selectionFrame.style.width = '100%';
  selectionFrame.style.height = '100%';

  handles.forEach((handle) => {
    const pos = handle.classList.contains('handle-tl') ? { x: 0, y: 0 }
      : handle.classList.contains('handle-tr') ? { x: 1, y: 0 }
        : handle.classList.contains('handle-br') ? { x: 1, y: 1 }
          : { x: 0, y: 1 };
    handle.style.left = `${pos.x * 100}%`;
    handle.style.top = `${pos.y * 100}%`;
  });

  rotateHandle.style.left = '50%';
  rotateHandle.style.top = '-32px';
}

function updatePrecisionControls() {
  const layer = getActiveLayer();
  const open = !precisionPanel.hasAttribute('aria-hidden') || precisionPanel.getAttribute('aria-hidden') === 'false';
  if (!layer) {
    galleryButton.disabled = true;
    deleteLayerButton.disabled = true;
    if (open) {
      preciseX.value = '';
      preciseY.value = '';
      preciseScale.value = '';
      preciseRotation.value = '';
    }
    return;
  }

  preciseX.value = layer.cx.toFixed(0);
  preciseY.value = layer.cy.toFixed(0);
  preciseScale.value = Math.round(layer.scale * 100);
  preciseRotation.value = Math.round(layer.rotation);
  deleteLayerButton.disabled = false;

  if (layer.type === 'Text') {
    preciseColor.value = toHexColor(layer.fill || '#ffffff');
    preciseFont.value = layer.fontFamily || "'Roboto', sans-serif";
    preciseFontSize.value = Math.round(layer.fontSize || 24);
    preciseText.value = layer.text || '';
    toggleBold.checked = (layer.fontWeight || 400) >= 600;
    toggleItalic.checked = (layer.fontStyle || 'normal') === 'italic';
    togglePrecisionFields(true);
  } else {
    preciseColor.value = toHexColor(layer.fill || '#ffffff');
    togglePrecisionFields(false);
  }
}

function togglePrecisionFields(isText) {
  document.getElementById('font-label').style.display = isText ? 'grid' : 'none';
  document.getElementById('font-size-label').style.display = isText ? 'grid' : 'none';
  document.getElementById('font-style-controls').style.display = isText ? 'flex' : 'none';
  document.getElementById('text-content-label').style.display = isText ? 'grid' : 'none';
}

function toHexColor(value) {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = value;
  return ctx.fillStyle;
}

function onLayerPointerDown(event) {
  event.preventDefault();
  const layerId = event.currentTarget.dataset.layerId;
  setActiveLayer(layerId);
  startInteraction('move', event);
}

function startInteraction(type, event, handlePosition = null) {
  const layer = getActiveLayer();
  if (!layer) return;
  const pointer = getDesignPoint(event.clientX, event.clientY);
  const interaction = {
    type,
    pointerId: event.pointerId,
    startPointer: pointer,
    startLayer: { ...layer },
    handlePosition
  };
  state.interaction = interaction;
  svgCanvas.setPointerCapture(event.pointerId);
}

function updateInteraction(event) {
  if (!state.interaction) return;
  const layer = getActiveLayer();
  if (!layer) return;

  const pointer = getDesignPoint(event.clientX, event.clientY);
  const { startPointer, startLayer, type } = state.interaction;

  if (type === 'move') {
    const dx = pointer.x - startPointer.x;
    const dy = pointer.y - startPointer.y;
    layer.cx = clamp(startLayer.cx + dx, 0, printableArea.width);
    layer.cy = clamp(startLayer.cy + dy, 0, printableArea.height);
  } else if (type === 'scale') {
    const centerPoint = { x: startLayer.cx, y: startLayer.cy };
    const startDistance = distanceBetweenPoints(startPointer, centerPoint);
    const currentDistance = distanceBetweenPoints(pointer, centerPoint);
    const ratio = currentDistance / Math.max(startDistance, 0.1);
    layer.scale = clamp(startLayer.scale * ratio, printableArea.minScale, printableArea.maxScale);
  } else if (type === 'rotate') {
    const centerPoint = { x: startLayer.cx, y: startLayer.cy };
    const startAngle = angleBetweenPoints(centerPoint, startPointer);
    const currentAngle = angleBetweenPoints(centerPoint, pointer);
    const rotation = startLayer.rotation + (currentAngle - startAngle);
    layer.rotation = normalizeRotation(rotation);
  }

  scheduleRender();
  updatePrecisionControls();
}

function endInteraction(event) {
  if (!state.interaction) return;
  svgCanvas.releasePointerCapture(state.interaction.pointerId);
  state.interaction = null;
  scheduleRender();
}

function distanceBetweenPoints(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function angleBetweenPoints(origin, point) {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeRotation(value) {
  let angle = value % 360;
  if (angle > 180) angle -= 360;
  if (angle < -180) angle += 360;
  return angle;
}

function getSvgPoint(clientX, clientY) {
  const point = svgCanvas.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  return point.matrixTransform(svgCanvas.getScreenCTM().inverse());
}

function getDesignPoint(clientX, clientY) {
  const svgPoint = getSvgPoint(clientX, clientY);
  return {
    x: svgPoint.x - printableArea.x,
    y: svgPoint.y - printableArea.y
  };
}

function computeEditViewBox(padding = 80) {
  const paddedWidth = printableArea.width + padding * 2;
  const paddedHeight = printableArea.height + padding * 2;
  const viewSize = Math.min(1155, Math.max(paddedWidth, paddedHeight));
  const centerX = printableArea.x + printableArea.width / 2;
  const centerY = printableArea.y + printableArea.height / 2;
  let x = centerX - viewSize / 2;
  let y = centerY - viewSize / 2;
  x = clamp(x, 0, 1155 - viewSize);
  y = clamp(y, 0, 1155 - viewSize);
  return { x, y, width: viewSize, height: viewSize };
}

function setViewMode(mode) {
  if (mode === 'edit') {
    viewBoxes.edit = computeEditViewBox();
  }
  if (!viewBoxes[mode]) return;
  currentViewMode = mode;
  const box = viewBoxes[mode];
  svgCanvas.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`);
  viewToggleButtons.forEach((button) => {
    const isActive = button.dataset.viewMode === mode;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
  requestAnimationFrame(() => updateSelectionOverlay());
}

svgCanvas.addEventListener('pointermove', updateInteraction);
svgCanvas.addEventListener('pointerup', endInteraction);
svgCanvas.addEventListener('pointercancel', endInteraction);
svgCanvas.addEventListener('pointerleave', (event) => {
  if (state.interaction && state.interaction.type === 'move') {
    endInteraction(event);
  }
});

svgCanvas.addEventListener('pointerdown', (event) => {
  if (event.target === svgCanvas) {
    state.activeLayerId = null;
    updateSelectionOverlay();
    updatePrecisionControls();
    refreshLayerList();
  }
});

document.addEventListener('pointerdown', (event) => {
  if (!svgCanvas.contains(event.target) && !selectionOverlay.contains(event.target)) {
    if (!layerPanel.contains(event.target) && !galleryPanel.contains(event.target) && !precisionPanel.contains(event.target)) {
      state.activeLayerId = null;
      updateSelectionOverlay();
      updatePrecisionControls();
      refreshLayerList();
    }
  }
});

handles.forEach((handle) => {
  handle.addEventListener('pointerdown', (event) => {
    event.stopPropagation();
    event.preventDefault();
    startInteraction('scale', event);
  });
});

rotateHandle.addEventListener('pointerdown', (event) => {
  event.stopPropagation();
  event.preventDefault();
  startInteraction('rotate', event);
});

document.querySelectorAll('.close-panel').forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.close;
    if (target === 'layer') togglePanel(layerPanel, false);
    if (target === 'gallery') {
      togglePanel(galleryPanel, false);
      state.activeTemplate = null;
      galleryButton.disabled = true;
    }
    if (target === 'precision') {
      togglePanel(precisionPanel, false);
      collapsePrecision.setAttribute('aria-expanded', 'false');
    }
  });
});

viewToggleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setViewMode(button.dataset.viewMode);
  });
});

collapsePrecision.addEventListener('click', () => {
  const expanded = collapsePrecision.getAttribute('aria-expanded') === 'true';
  collapsePrecision.setAttribute('aria-expanded', String(!expanded));
  togglePanel(precisionPanel, !expanded);
  updatePrecisionControls();
});

toolbarButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.action;
    if (action === 'designs') {
      openGallery('Design', designTemplates);
    } else if (action === 'elements') {
      openGallery('Element', elementTemplates);
    } else if (action === 'text') {
      openGallery('Text', textTemplates);
    } else if (action === 'layers') {
      togglePanel(galleryPanel, false);
      togglePanel(precisionPanel, false);
      togglePanel(layerPanel, true);
    } else if (action === 'export') {
      exportSvg();
    }
  });
});

galleryButton.addEventListener('click', () => {
  if (!state.activeTemplate) return;
  if (state.layers.length >= 9) {
    alert('Maximum of 9 layers reached.');
    return;
  }
  createLayerFromTemplate(state.activeTemplate);
  state.activeTemplate = null;
  galleryButton.disabled = true;
  togglePanel(galleryPanel, false);
});

function openGallery(type, templates) {
  togglePanel(layerPanel, false);
  togglePanel(precisionPanel, false);
  state.galleryType = type;
  state.activeTemplate = null;
  galleryTitle.textContent = `${type} Gallery`;
  galleryContent.innerHTML = '';
  galleryButton.disabled = true;

  templates.forEach((template) => {
    const node = galleryTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector('.preview').textContent = template.preview;
    node.querySelector('.gallery-name').textContent = template.name;
    node.addEventListener('click', () => {
      galleryContent.querySelectorAll('.gallery-item').forEach((item) => item.classList.remove('active'));
      node.classList.add('active');
      state.activeTemplate = template;
      galleryButton.disabled = false;
    });
    galleryContent.appendChild(node);
  });

  togglePanel(galleryPanel, true);
}

function togglePanel(panel, show) {
  if (show) {
    panel.setAttribute('aria-hidden', 'false');
  } else {
    panel.setAttribute('aria-hidden', 'true');
  }
}

function refreshLayerList() {
  layerList.innerHTML = '';
  state.layers.slice().reverse().forEach((layer) => {
    const row = layerTemplate.content.firstElementChild.cloneNode(true);
    row.dataset.layerId = layer.id;
    row.querySelector('.layer-name').textContent = layer.name;
    const select = row.querySelector('.layer-select');
    select.setAttribute('aria-label', `Select ${layer.name}`);
    select.textContent = '●';
    select.addEventListener('click', () => setActiveLayer(layer.id));
    if (state.activeLayerId === layer.id) {
      row.classList.add('active');
    }
    row.querySelectorAll('.layer-move').forEach((btn) => {
      btn.addEventListener('click', () => moveLayer(layer.id, btn.dataset.direction));
      const dirLabel = btn.dataset.direction === 'up' ? 'Move layer up' : 'Move layer down';
      btn.setAttribute('aria-label', dirLabel);
    });
    const deleteBtn = row.querySelector('.layer-delete');
    deleteBtn.addEventListener('click', () => deleteLayer(layer.id));
    deleteBtn.setAttribute('aria-label', `Delete ${layer.name}`);
    layerList.appendChild(row);
  });
}

function moveLayer(id, direction) {
  const index = state.layers.findIndex((layer) => layer.id === id);
  if (index < 0) return;
  if (direction === 'up' && index < state.layers.length - 1) {
    const [layer] = state.layers.splice(index, 1);
    state.layers.splice(index + 1, 0, layer);
  }
  if (direction === 'down' && index > 0) {
    const [layer] = state.layers.splice(index, 1);
    state.layers.splice(index - 1, 0, layer);
  }
  refreshLayerList();
  syncLayerDom();
  scheduleRender();
}

function deleteLayer(id) {
  const index = state.layers.findIndex((layer) => layer.id === id);
  if (index < 0) return;
  const [layer] = state.layers.splice(index, 1);
  layer.group.remove();
  if (state.activeLayerId === id) {
    state.activeLayerId = null;
  }
  refreshLayerList();
  syncLayerDom();
  scheduleRender();
}

deleteLayerButton.addEventListener('click', () => {
  const layer = getActiveLayer();
  if (layer) {
    deleteLayer(layer.id);
  }
});

preciseX.addEventListener('change', () => {
  const layer = getActiveLayer();
  if (!layer) return;
  const value = Number(preciseX.value);
  if (Number.isNaN(value)) return;
  layer.cx = clamp(value, 0, printableArea.width);
  scheduleRender();
});

preciseY.addEventListener('change', () => {
  const layer = getActiveLayer();
  if (!layer) return;
  const value = Number(preciseY.value);
  if (Number.isNaN(value)) return;
  layer.cy = clamp(value, 0, printableArea.height);
  scheduleRender();
});

preciseScale.addEventListener('change', () => {
  const layer = getActiveLayer();
  if (!layer) return;
  const value = Number(preciseScale.value);
  if (Number.isNaN(value)) return;
  layer.scale = clamp(value / 100, printableArea.minScale, printableArea.maxScale);
  scheduleRender();
});

preciseRotation.addEventListener('change', () => {
  const layer = getActiveLayer();
  if (!layer) return;
  const value = Number(preciseRotation.value);
  if (Number.isNaN(value)) return;
  layer.rotation = normalizeRotation(value);
  scheduleRender();
});

preciseColor.addEventListener('change', () => {
  const layer = getActiveLayer();
  if (!layer) return;
  applyColor(layer, preciseColor.value);
});

preciseFont.addEventListener('change', () => {
  const layer = getActiveLayer();
  if (!layer || layer.type !== 'Text') return;
  layer.fontFamily = preciseFont.value;
  updateTextLayer(layer);
});

preciseFontSize.addEventListener('change', () => {
  const layer = getActiveLayer();
  if (!layer || layer.type !== 'Text') return;
  layer.fontSize = Number(preciseFontSize.value);
  updateTextLayer(layer);
});

preciseText.addEventListener('input', () => {
  const layer = getActiveLayer();
  if (!layer || layer.type !== 'Text') return;
  layer.text = preciseText.value;
  updateTextLayer(layer);
});

toggleBold.addEventListener('change', () => {
  const layer = getActiveLayer();
  if (!layer || layer.type !== 'Text') return;
  layer.fontWeight = toggleBold.checked ? 700 : 400;
  updateTextLayer(layer);
});

toggleItalic.addEventListener('change', () => {
  const layer = getActiveLayer();
  if (!layer || layer.type !== 'Text') return;
  layer.fontStyle = toggleItalic.checked ? 'italic' : 'normal';
  updateTextLayer(layer);
});

function applyColor(layer, color) {
  layer.fill = color;
  if (layer.type === 'Text') {
    const text = layer.inner.querySelector('text');
    text.setAttribute('fill', color);
  } else {
    const targets = layer.inner.children;
    Array.from(targets).forEach((target) => {
      if (target.hasAttribute(layer.colorAttribute || 'fill')) {
        target.setAttribute(layer.colorAttribute || 'fill', color);
      }
    });
  }
  scheduleRender();
}

function updateTextLayer(layer, options = {}) {
  const textNode = layer.inner.querySelector('text');
  if (!textNode) return;
  textNode.textContent = layer.text;
  textNode.setAttribute('fill', layer.fill);
  textNode.setAttribute('font-family', layer.fontFamily);
  textNode.setAttribute('font-size', layer.fontSize);
  textNode.setAttribute('font-weight', layer.fontWeight);
  textNode.setAttribute('font-style', layer.fontStyle);
  textNode.setAttribute('text-anchor', 'middle');
  textNode.setAttribute('dominant-baseline', 'middle');

  textNode.setAttribute('x', 0);
  textNode.setAttribute('y', 0);
  const bbox = textNode.getBBox();
  const padding = 32;
  layer.width = Math.max(bbox.width + padding, 80);
  layer.height = Math.max(bbox.height + padding, 60);
  textNode.setAttribute('x', layer.width / 2);
  textNode.setAttribute('y', layer.height / 2);

  if (!options.skipRender) {
    scheduleRender();
  }
}

function exportSvg() {
  const clone = svgCanvas.cloneNode(true);
  const fullView = viewBoxes.full;
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
  togglePanel(layerPanel, false);
  togglePanel(galleryPanel, false);
  togglePanel(precisionPanel, false);
  deleteLayerButton.disabled = true;
  togglePrecisionFields(false);
  setViewMode(currentViewMode);
  layerRoot.addEventListener('click', (event) => {
    const target = event.target.closest('[data-layer-id]');
    if (!target) return;
    const id = target.dataset.layerId;
    setActiveLayer(id);
  });
}

function syncLayerDom() {
  state.layers.forEach((layer) => {
    layerRoot.appendChild(layer.group);
  });
}

init();
