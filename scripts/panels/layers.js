import { svgNS } from '../core/constants.js';
import { state, counters, createId, center } from '../core/state.js';

export function createLayerManager(dom, callbacks = {}) {
  const { onSelectionChanged, onPrecisionRequested, onOpenAdjustPanel, onLayerPointerDown } = callbacks;

  function ensureDefs() {
    let defs = dom.svgCanvas.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS(svgNS, 'defs');
      dom.svgCanvas.insertBefore(defs, dom.svgCanvas.firstChild);
    }
    return defs;
  }

  async function createLayerFromTemplate(template) {
    if (!template) return null;

    const outer = document.createElementNS(svgNS, 'g');
    outer.classList.add('layer');
    outer.dataset.type = template.type;
    const inner = document.createElementNS(svgNS, 'g');
    inner.classList.add('layer-inner');
    outer.appendChild(inner);

    dom.layerRoot.appendChild(outer);

    let colorElement = null;

    try {
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
        colorElement = text;
      } else {
        const result = await Promise.resolve(template.createContent(inner));
        colorElement = result?.colorElement || inner.querySelector('*');
        if (colorElement && (template.baseColor || template.fill)) {
          colorElement.setAttribute(template.colorAttribute || 'fill', template.baseColor || template.fill);
        }
      }
    } catch (error) {
      console.error('Failed to create layer from template', error);
      outer.remove();
      return null;
    }

    const layerId = createId('layer');
    outer.dataset.layerId = layerId;
    outer.setAttribute('tabindex', '0');

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
      colorAttribute: template.colorAttribute || 'fill',
      colorElement: colorElement || null
    };

    if (template.type === 'Text') {
      layer.text = template.text;
      layer.fill = template.fill;
      layer.fontFamily = template.fontFamily;
      layer.fontSize = template.fontSize;
      layer.fontWeight = template.fontWeight;
      layer.fontStyle = template.fontStyle;
      updateTextLayer(layer, { skipRender: true });
    } else {
      layer.fill = template.fill || template.baseColor || '#ffffff';
    }

    state.layers.push(layer);
    attachLayerListeners(layer);
    setActiveLayer(layer.id);
    scheduleRender();
    refreshLayerList();
    syncLayerDom();

    return layer;
  }

  function isLayerNameUnique(name, excludeId = null) {
    return !state.layers.some((layer) => layer.name === name && layer.id !== excludeId);
  }

  function generateSequentialName(type, excludeId = null) {
    let candidate;
    do {
      counters[type] += 1;
      candidate = `${type}_${counters[type]}`;
    } while (!isLayerNameUnique(candidate, excludeId));
    return candidate;
  }

  function createLayerName(type, userSuffix = '', excludeId = null) {
    const suffix = (userSuffix || '').trim();
    if (suffix) {
      const direct = `${type}-${suffix}`;
      if (isLayerNameUnique(direct, excludeId)) {
        return direct;
      }
    }

    const base = generateSequentialName(type, excludeId);
    if (!suffix) {
      return base;
    }

    let composite = `${base} ${suffix}`;
    if (isLayerNameUnique(composite, excludeId)) {
      return composite;
    }

    let attemptIndex = 2;
    while (!isLayerNameUnique(`${composite} (${attemptIndex})`, excludeId)) {
      attemptIndex += 1;
    }
    return `${composite} (${attemptIndex})`;
  }

  function normalizeLayerNameInput(layer, rawName) {
    if (!layer || typeof rawName !== 'string') {
      return null;
    }

    const trimmed = rawName.trim();
    if (!trimmed) {
      return null;
    }

    const type = layer.type;
    const hyphenPrefix = `${type}-`;
    const underscorePrefix = `${type}_`;
    const lower = trimmed.toLowerCase();
    let remainder = trimmed;

    if (lower.startsWith(hyphenPrefix.toLowerCase())) {
      remainder = trimmed.slice(hyphenPrefix.length).trim();
    } else if (lower.startsWith(underscorePrefix.toLowerCase())) {
      remainder = trimmed.slice(underscorePrefix.length).trim();
    }

    if (!remainder) {
      return null;
    }

    const normalized = `${type}-${remainder}`;
    if (normalized === layer.name) {
      return normalized;
    }

    if (isLayerNameUnique(normalized, layer.id)) {
      return normalized;
    }

    return createLayerName(type, remainder, layer.id);
  }

  function setActiveLayer(id) {
    state.activeLayerId = id;
    if (typeof onSelectionChanged === 'function') {
      onSelectionChanged();
    }
    if (typeof onPrecisionRequested === 'function') {
      onPrecisionRequested();
    }
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
      if (typeof onSelectionChanged === 'function') {
        onSelectionChanged();
      }
    });
  }

  function updateLayerTransform(layer) {
    const { cx, cy, scale, rotation, width, height } = layer;
    const transform = `translate(${cx} ${cy}) rotate(${rotation}) scale(${scale})`;
    layer.group.setAttribute('transform', transform);
    layer.inner.setAttribute('transform', `translate(${-width / 2} ${-height / 2})`);
  }

  function attachLayerListeners(layer) {
    layer.group.addEventListener('pointerdown', (event) => {
      if (typeof onLayerPointerDown === 'function') {
        onLayerPointerDown(event);
      }
    });
  }

  function refreshLayerList() {
    if (!dom.layerList || !dom.layerTemplate) return;
    dom.layerList.innerHTML = '';

    const MAX_LAYER_SLOTS = 9;
    const visibleLayers = state.layers.slice(-MAX_LAYER_SLOTS).reverse();

    for (let slot = 0; slot < MAX_LAYER_SLOTS; slot += 1) {
      const layer = visibleLayers[slot] || null;
      const clone = dom.layerTemplate.content.firstElementChild.cloneNode(true);
      const slotNumber = slot + 1;
      const indexBadge = clone.querySelector('.layer-index');
      if (indexBadge) {
        indexBadge.textContent = String(slotNumber);
      }

      clone.dataset.layerSlot = String(slotNumber);

      const layerActions = clone.querySelector('.layer-actions');

      if (layer) {
        clone.dataset.layerId = layer.id;
        clone.classList.remove('is-empty');
        clone.classList.toggle('active', layer.id === state.activeLayerId);
        const layerName = clone.querySelector('.layer-name');
        if (layerName) {
          layerName.textContent = layer.name;
        }
        clone.setAttribute('aria-label', `Layer ${slotNumber}: ${layer.name}`);
        if (layerActions) {
          layerActions.removeAttribute('aria-hidden');
        }

        const selectButton = clone.querySelector('.layer-select');
        const adjustButton = clone.querySelector('.layer-adjust');
        const deleteButton = clone.querySelector('.layer-delete');
        const moveUpButton = clone.querySelector('.layer-move[data-direction="up"]');
        const moveDownButton = clone.querySelector('.layer-move[data-direction="down"]');

        if (selectButton) {
          selectButton.disabled = false;
          selectButton.tabIndex = 0;
          selectButton.addEventListener('click', (event) => {
            event.stopPropagation();
            setActiveLayer(layer.id);
          });
        }

        if (adjustButton) {
          adjustButton.disabled = false;
          adjustButton.tabIndex = 0;
          adjustButton.addEventListener('click', (event) => {
            event.stopPropagation();
            if (typeof onOpenAdjustPanel === 'function') {
              onOpenAdjustPanel(layer.id);
            }
          });
        }

        if (deleteButton) {
          deleteButton.disabled = false;
          deleteButton.tabIndex = 0;
          deleteButton.addEventListener('click', (event) => {
            event.stopPropagation();
            deleteLayer(layer.id);
          });
        }

        const isTopMost = slot === 0;
        const isBottomMost = slot === visibleLayers.length - 1;

        if (moveUpButton) {
          moveUpButton.disabled = isTopMost;
          moveUpButton.tabIndex = isTopMost ? -1 : 0;
          moveUpButton.setAttribute('aria-disabled', String(isTopMost));
          moveUpButton.addEventListener('click', (event) => {
            event.stopPropagation();
            moveLayer(layer.id, 'up');
          });
        }

        if (moveDownButton) {
          moveDownButton.disabled = isBottomMost;
          moveDownButton.tabIndex = isBottomMost ? -1 : 0;
          moveDownButton.setAttribute('aria-disabled', String(isBottomMost));
          moveDownButton.addEventListener('click', (event) => {
            event.stopPropagation();
            moveLayer(layer.id, 'down');
          });
        }
      } else {
        clone.classList.add('is-empty');
        clone.classList.remove('active');
        clone.removeAttribute('data-layer-id');
        const layerName = clone.querySelector('.layer-name');
        if (layerName) {
          layerName.textContent = 'Empty slot';
        }
        clone.setAttribute('aria-label', `Layer ${slotNumber}: empty slot`);
        if (layerActions) {
          layerActions.setAttribute('aria-hidden', 'true');
        }
        const actionButtons = clone.querySelectorAll('.layer-actions button');
        actionButtons.forEach((button) => {
          button.disabled = true;
          button.tabIndex = -1;
          button.setAttribute('aria-disabled', 'true');
        });
      }

      dom.layerList.appendChild(clone);
    }

    if (dom.layerLimitIndicator) {
      const count = state.layers.length;
      dom.layerLimitIndicator.textContent = `${count}/9 max`;
      dom.layerLimitIndicator.setAttribute('aria-label', `${count} of 9 layers used (maximum 9)`);
      dom.layerLimitIndicator.classList.toggle('is-full', count >= 9);
    }
  }

  function openAdjustPanelForLayer(layerId) {
    setActiveLayer(layerId);
    if (typeof onOpenAdjustPanel === 'function') {
      onOpenAdjustPanel(layerId);
    }
  }

  function moveLayer(id, direction) {
    const index = state.layers.findIndex((layer) => layer.id === id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index + 1 : index - 1;
    if (targetIndex < 0 || targetIndex >= state.layers.length) return;
    const [layer] = state.layers.splice(index, 1);
    state.layers.splice(targetIndex, 0, layer);
    dom.layerRoot.appendChild(layer.group);
    refreshLayerList();
    scheduleRender();
  }

  function deleteLayer(id) {
    const index = state.layers.findIndex((layer) => layer.id === id);
    if (index === -1) return;
    const [layer] = state.layers.splice(index, 1);
    if (layer.group.parentNode) {
      layer.group.parentNode.removeChild(layer.group);
    }
    if (state.activeLayerId === id) {
      state.activeLayerId = null;
      if (typeof onSelectionChanged === 'function') {
        onSelectionChanged();
      }
      if (typeof onPrecisionRequested === 'function') {
        onPrecisionRequested();
      }
    }
    refreshLayerList();
    scheduleRender();
  }

  function syncLayerDom() {
    ensureDefs();
    state.layers.forEach((layer) => {
      if (!layer.group.isConnected) {
        dom.layerRoot.appendChild(layer.group);
      }
    });
  }

  function updateTextLayer(layer, options = {}) {
    const textNode = layer.inner.querySelector('text');
    if (!textNode) return;
    layer.colorElement = textNode;
    if (options.text !== undefined) {
      layer.text = options.text;
      textNode.textContent = options.text;
    }
    if (options.fill !== undefined) {
      layer.fill = options.fill;
      textNode.setAttribute('fill', options.fill);
    }
    if (options.fontFamily !== undefined) {
      layer.fontFamily = options.fontFamily;
      textNode.setAttribute('font-family', options.fontFamily);
    }
    if (options.fontSize !== undefined) {
      layer.fontSize = options.fontSize;
      textNode.setAttribute('font-size', options.fontSize);
    }
    if (options.fontWeight !== undefined) {
      layer.fontWeight = options.fontWeight;
      textNode.setAttribute('font-weight', options.fontWeight);
    }
    if (options.fontStyle !== undefined) {
      layer.fontStyle = options.fontStyle;
      textNode.setAttribute('font-style', options.fontStyle);
    }
    if (!options.skipRender) {
      scheduleRender();
    }
  }

  return {
    createLayerFromTemplate,
    setActiveLayer,
    getActiveLayer,
    scheduleRender,
    updateLayerTransform,
    refreshLayerList,
    moveLayer,
    deleteLayer,
    openAdjustPanelForLayer,
    normalizeLayerNameInput,
    syncLayerDom,
    updateTextLayer
  };
}
