import { printableArea } from '../core/constants.js';
import { center } from '../core/state.js';

export function initPrecisionPanel(dom, layerManager, selectionHelpers = {}) {
  const { clamp, toPositiveRotation } = selectionHelpers;

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

  function updatePrecisionControls() {
    const layer = layerManager.getActiveLayer();
    const open =
      !dom.precisionPanel.hasAttribute('aria-hidden') ||
      dom.precisionPanel.getAttribute('aria-hidden') === 'false';

    if (!layer) {
      if (open) {
        dom.preciseName.value = '';
        dom.preciseX.value = '';
        dom.preciseY.value = '';
        dom.preciseScale.value = '';
        dom.preciseRotation.value = '';
        if (dom.preciseXSlider) dom.preciseXSlider.value = '0';
        if (dom.preciseYSlider) dom.preciseYSlider.value = '0';
        if (dom.preciseScaleSlider) dom.preciseScaleSlider.value = '100';
        if (dom.preciseRotationSlider) dom.preciseRotationSlider.value = '0';
      }
      return;
    }

    dom.preciseName.value = layer.name;
    const xOffset = Math.round(layer.cx - center.x);
    const yOffset = Math.round(layer.cy - center.y);
    const scaleValue = Math.round(layer.scale * 100);
    const rotationValue = toPositiveRotation(layer.rotation);

    dom.preciseX.value = xOffset;
    dom.preciseY.value = yOffset;
    dom.preciseScale.value = scaleValue;
    dom.preciseRotation.value = rotationValue;

    if (dom.preciseXSlider) dom.preciseXSlider.value = xOffset;
    if (dom.preciseYSlider) dom.preciseYSlider.value = yOffset;
    if (dom.preciseScaleSlider)
      dom.preciseScaleSlider.value = clamp(scaleValue, Number(dom.preciseScaleSlider.min), Number(dom.preciseScaleSlider.max));
    if (dom.preciseRotationSlider) dom.preciseRotationSlider.value = rotationValue;

    if (layer.type === 'Text') {
      dom.preciseColor.value = toHexColor(layer.fill || '#ffffff');
      dom.preciseFont.value = layer.fontFamily || "'Roboto', sans-serif";
      dom.preciseFontSize.value = Math.round(layer.fontSize || 24);
      dom.preciseText.value = layer.text || '';
      dom.toggleBold.checked = (layer.fontWeight || 400) >= 600;
      dom.toggleItalic.checked = (layer.fontStyle || 'normal') === 'italic';
      togglePrecisionFields(true);
    } else {
      dom.preciseColor.value = toHexColor(layer.fill || '#ffffff');
      togglePrecisionFields(false);
    }
  }

  function applyOffset(axis, rawValue) {
    const layer = layerManager.getActiveLayer();
    if (!layer) return;
    if (Number.isNaN(rawValue)) return;
    const clamped = clamp(rawValue, -1000, 1000);
    if (axis === 'x') {
      layer.cx = clamp(center.x + clamped, 0, printableArea.width);
      dom.preciseX.value = clamped;
      if (dom.preciseXSlider) dom.preciseXSlider.value = clamped;
    } else {
      layer.cy = clamp(center.y + clamped, 0, printableArea.height);
      dom.preciseY.value = clamped;
      if (dom.preciseYSlider) dom.preciseYSlider.value = clamped;
    }
    layerManager.scheduleRender();
  }

  function applyScale(rawValue) {
    const layer = layerManager.getActiveLayer();
    if (!layer) return;
    if (Number.isNaN(rawValue)) return;
    const clamped = clamp(rawValue, Number(dom.preciseScale.min), Number(dom.preciseScale.max));
    if (dom.preciseScaleSlider) dom.preciseScaleSlider.value = clamped;
    dom.preciseScale.value = clamped;
    layer.scale = clamp(clamped / 100, printableArea.minScale, printableArea.maxScale);
    layerManager.scheduleRender();
  }

  function applyRotation(rawValue) {
    const layer = layerManager.getActiveLayer();
    if (!layer) return;
    if (Number.isNaN(rawValue)) return;
    const normalized = clamp(rawValue, 0, 360);
    if (dom.preciseRotationSlider) dom.preciseRotationSlider.value = normalized;
    dom.preciseRotation.value = normalized;
    layer.rotation = normalized;
    layerManager.scheduleRender();
  }

  function applyColor(layer, color) {
    layer.fill = color;
    if (layer.type === 'Text') {
      layerManager.updateTextLayer(layer, { fill: color });
    } else {
      const target = layer.colorElement || layer.inner.querySelector('*');
      if (target) {
        target.setAttribute(layer.colorAttribute, color);
        layer.colorElement = target;
      }
      layerManager.scheduleRender();
    }
  }

  function wireEvents() {
    if (dom.preciseXSlider) {
      dom.preciseXSlider.addEventListener('input', () => applyOffset('x', Number(dom.preciseXSlider.value)));
    }

    dom.preciseX.addEventListener('input', () => {
      if (dom.preciseXSlider && dom.preciseX.value !== '') {
        dom.preciseXSlider.value = dom.preciseX.value;
      }
    });

    dom.preciseX.addEventListener('change', () => {
      applyOffset('x', Number(dom.preciseX.value));
    });

    if (dom.preciseYSlider) {
      dom.preciseYSlider.addEventListener('input', () => applyOffset('y', Number(dom.preciseYSlider.value)));
    }

    dom.preciseY.addEventListener('input', () => {
      if (dom.preciseYSlider && dom.preciseY.value !== '') {
        dom.preciseYSlider.value = dom.preciseY.value;
      }
    });

    dom.preciseY.addEventListener('change', () => {
      applyOffset('y', Number(dom.preciseY.value));
    });

    if (dom.preciseScaleSlider) {
      dom.preciseScaleSlider.addEventListener('input', () => applyScale(Number(dom.preciseScaleSlider.value)));
    }

    dom.preciseScale.addEventListener('input', () => {
      if (dom.preciseScaleSlider && dom.preciseScale.value !== '') {
        dom.preciseScaleSlider.value = dom.preciseScale.value;
      }
    });

    dom.preciseScale.addEventListener('change', () => {
      applyScale(Number(dom.preciseScale.value));
    });

    if (dom.preciseRotationSlider) {
      dom.preciseRotationSlider.addEventListener('input', () => applyRotation(Number(dom.preciseRotationSlider.value)));
    }

    dom.preciseRotation.addEventListener('input', () => {
      if (dom.preciseRotationSlider && dom.preciseRotation.value !== '') {
        dom.preciseRotationSlider.value = dom.preciseRotation.value;
      }
    });

    dom.preciseRotation.addEventListener('change', () => {
      applyRotation(Number(dom.preciseRotation.value));
    });

    dom.preciseColor.addEventListener('change', () => {
      const layer = layerManager.getActiveLayer();
      if (!layer) return;
      applyColor(layer, dom.preciseColor.value);
    });

    dom.preciseFont.addEventListener('change', () => {
      const layer = layerManager.getActiveLayer();
      if (!layer || layer.type !== 'Text') return;
      layerManager.updateTextLayer(layer, { fontFamily: dom.preciseFont.value });
    });

    dom.preciseFontSize.addEventListener('change', () => {
      const layer = layerManager.getActiveLayer();
      if (!layer || layer.type !== 'Text') return;
      layerManager.updateTextLayer(layer, { fontSize: Number(dom.preciseFontSize.value) });
    });

    dom.preciseText.addEventListener('input', () => {
      const layer = layerManager.getActiveLayer();
      if (!layer || layer.type !== 'Text') return;
      layerManager.updateTextLayer(layer, { text: dom.preciseText.value });
    });

    dom.toggleBold.addEventListener('change', () => {
      const layer = layerManager.getActiveLayer();
      if (!layer || layer.type !== 'Text') return;
      layerManager.updateTextLayer(layer, { fontWeight: dom.toggleBold.checked ? 700 : 400 });
    });

    dom.toggleItalic.addEventListener('change', () => {
      const layer = layerManager.getActiveLayer();
      if (!layer || layer.type !== 'Text') return;
      layerManager.updateTextLayer(layer, { fontStyle: dom.toggleItalic.checked ? 'italic' : 'normal' });
    });

    dom.preciseName.addEventListener('change', () => {
      const layer = layerManager.getActiveLayer();
      if (!layer) return;
      const normalized = layerManager.normalizeLayerNameInput(layer, dom.preciseName.value);
      if (normalized) {
        layer.name = normalized;
        layerManager.refreshLayerList();
        dom.preciseName.value = normalized;
      } else {
        dom.preciseName.value = layer.name;
      }
    });
  }

  wireEvents();

  return {
    updatePrecisionControls
  };
}
