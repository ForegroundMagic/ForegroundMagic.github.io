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

    dom.layerRoot.appendChild(outer);

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
    } else {
      layer.fill = template.fill || template.baseColor || '#ffffff';
    }

    state.layers.push(layer);
    attachLayerListeners(layer);
    setActiveLayer(layer.id);
    scheduleRender();
    refreshLayerList();
    syncLayerDom();
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

    state.layers
      .slice()
      .reverse()
      .forEach((layer, index) => {
        const clone = dom.layerTemplate.content.firstElementChild.cloneNode(true);
        clone.dataset.layerId = layer.id;
        clone.querySelector('.layer-name').textContent = layer.name;
        clone.classList.toggle('active', layer.id === state.activeLayerId);

        const selectButton = clone.querySelector('.layer-select');
        const adjustButton = clone.querySelector('.layer-adjust');
        const deleteButton = clone.querySelector('.layer-delete');
        const moveButtons = clone.querySelectorAll('.layer-move');

        selectButton.addEventListener('click', () => setActiveLayer(layer.id));
        adjustButton.addEventListener('click', () => {
          if (typeof onOpenAdjustPanel === 'function') {
            onOpenAdjustPanel(layer.id);
          }
        });
        deleteButton.addEventListener('click', () => deleteLayer(layer.id));
        moveButtons.forEach((button) => {
          button.addEventListener('click', () => moveLayer(layer.id, button.dataset.direction));
        });

        const summaryIndex = state.layers.length - index;
        clone.setAttribute('data-layer-index', String(summaryIndex));

        dom.layerList.appendChild(clone);
      });

    if (dom.layerSummary) {
      if (state.layers.length === 0) {
        dom.layerSummary.textContent = 'No layers yet';
      } else {
        dom.layerSummary.textContent = `${state.layers.length} layer${state.layers.length === 1 ? '' : 's'} total`;
      }
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
