import { printableArea } from '../core/constants.js';
import { state } from '../core/state.js';
import { context } from '../core/context.js';

export function initSelection(dom, layerManager, callbacks = {}) {
  const { onPrecisionRequested } = callbacks;

  function updateSelectionOverlay() {
    if (context.currentViewMode !== 'edit') {
      dom.selectionOverlay.hidden = true;
      return;
    }
    const layer = layerManager.getActiveLayer();
    if (!layer || !dom.designAreaHitbox) {
      dom.selectionOverlay.hidden = true;
      return;
    }

    const areaRect = dom.designAreaHitbox.getBoundingClientRect();
    const containerRect = dom.svgCanvas.parentElement.getBoundingClientRect();
    const scaleX = areaRect.width / printableArea.width;
    const scaleY = areaRect.height / printableArea.height;
    const widthPx = layer.width * layer.scale * scaleX;
    const heightPx = layer.height * layer.scale * scaleY;
    const centerX = areaRect.left + layer.cx * scaleX;
    const centerY = areaRect.top + layer.cy * scaleY;

    const overlay = dom.selectionOverlay;
    overlay.hidden = false;
    overlay.style.width = `${widthPx}px`;
    overlay.style.height = `${heightPx}px`;
    overlay.style.left = `${centerX - containerRect.left - widthPx / 2}px`;
    overlay.style.top = `${centerY - containerRect.top - heightPx / 2}px`;
    overlay.style.transformOrigin = 'center center';
    overlay.style.transform = `rotate(${layer.rotation}deg)`;

    dom.selectionFrame.style.width = '100%';
    dom.selectionFrame.style.height = '100%';

    dom.handles.forEach((handle) => {
      const pos = handle.classList.contains('handle-tl')
        ? { x: 0, y: 0 }
        : handle.classList.contains('handle-tr')
          ? { x: 1, y: 0 }
          : handle.classList.contains('handle-br')
            ? { x: 1, y: 1 }
            : { x: 0, y: 1 };
      handle.style.left = `${pos.x * 100}%`;
      handle.style.top = `${pos.y * 100}%`;
    });

    dom.rotateHandle.style.left = '50%';
    dom.rotateHandle.style.top = '-32px';
  }

  function startInteraction(type, event, handlePosition = null) {
    if (context.currentViewMode !== 'edit') return;
    const layer = layerManager.getActiveLayer();
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
    dom.svgCanvas.setPointerCapture(event.pointerId);
  }

  function updateInteraction(event) {
    if (context.currentViewMode !== 'edit') return;
    if (!state.interaction) return;
    const layer = layerManager.getActiveLayer();
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

    layerManager.scheduleRender();
    if (typeof onPrecisionRequested === 'function') {
      onPrecisionRequested();
    }
  }

  function endInteraction(event) {
    if (!state.interaction) return;
    dom.svgCanvas.releasePointerCapture(state.interaction.pointerId);
    state.interaction = null;
    layerManager.scheduleRender();
  }

  function handleLayerPointerDown(event) {
    if (context.currentViewMode !== 'edit') return;
    event.preventDefault();
    const layerId = event.currentTarget.dataset.layerId;
    layerManager.setActiveLayer(layerId);
    startInteraction('move', event);
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
    let result = value % 360;
    if (result < -180) {
      result += 360;
    } else if (result > 180) {
      result -= 360;
    }
    return result;
  }

  function toPositiveRotation(value) {
    let result = value % 360;
    if (result < 0) {
      result += 360;
    }
    return result;
  }

  function getSvgPoint(clientX, clientY) {
    const point = dom.svgCanvas.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const ctm = dom.svgCanvas.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const transformed = point.matrixTransform(ctm.inverse());
    return { x: transformed.x, y: transformed.y };
  }

  function getDesignPoint(clientX, clientY) {
    const svgPoint = getSvgPoint(clientX, clientY);
    return {
      x: svgPoint.x - printableArea.x,
      y: svgPoint.y - printableArea.y
    };
  }

  dom.svgCanvas.addEventListener('pointermove', updateInteraction);
  dom.svgCanvas.addEventListener('pointerup', endInteraction);
  dom.svgCanvas.addEventListener('pointercancel', endInteraction);
  dom.svgCanvas.addEventListener('pointerleave', (event) => {
    if (state.interaction && state.interaction.type === 'move') {
      endInteraction(event);
    }
  });

  dom.svgCanvas.addEventListener('pointerdown', (event) => {
    if (context.currentViewMode !== 'edit') return;
    if (event.target.closest('.handle') || event.target === dom.rotateHandle) return;
    startInteraction('move', event);
  });

  dom.handles.forEach((handle) => {
    handle.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      startInteraction('scale', event);
    });
  });

  dom.rotateHandle.addEventListener('pointerdown', (event) => {
    event.stopPropagation();
    startInteraction('rotate', event);
  });

  return {
    updateSelectionOverlay,
    handleLayerPointerDown,
    startInteraction,
    updateInteraction,
    endInteraction,
    getDesignPoint,
    toPositiveRotation,
    clamp
  };
}
