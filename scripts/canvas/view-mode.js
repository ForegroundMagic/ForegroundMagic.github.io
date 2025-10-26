import { FRAME_RADIUS_DEFAULT, FRAME_RADIUS_EDIT, printableArea } from '../core/constants.js';
import { state } from '../core/state.js';
import { context } from '../core/context.js';

export function initViewMode(dom, selectionApi, drawerApi) {
  function computeEditViewBox() {
    return {
      x: printableArea.x,
      y: printableArea.y,
      width: printableArea.width,
      height: printableArea.height
    };
  }

  function setFrameVisibility(visible) {
    context.frameVisible = visible;
    if (dom.appShell) {
      dom.appShell.setAttribute('data-frame-visible', visible ? 'true' : 'false');
    }
    if (dom.frameToggleButton) {
      dom.frameToggleButton.classList.toggle('active', visible);
      dom.frameToggleButton.setAttribute('aria-pressed', String(visible));
    }
  }

  function applyDesignVisibility(visible) {
    if (dom.appShell) {
      dom.appShell.setAttribute('data-design-visible', visible ? 'true' : 'false');
    }
    if (dom.designToggleButton) {
      dom.designToggleButton.classList.toggle('active', visible);
      dom.designToggleButton.setAttribute('aria-pressed', String(visible));
    }
  }

  function setViewMode(mode) {
    if (mode === 'edit') {
      context.viewBoxes.edit = computeEditViewBox();
    }
    if (!context.viewBoxes[mode]) return;
    context.currentViewMode = mode;
    const box = context.viewBoxes[mode];
    dom.svgCanvas.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`);
    const frameRadius = mode === 'edit' ? FRAME_RADIUS_EDIT : FRAME_RADIUS_DEFAULT;
    if (dom.designAreaHitbox) {
      dom.designAreaHitbox.setAttribute('rx', frameRadius);
      dom.designAreaHitbox.setAttribute('ry', frameRadius);
    }
    if (dom.designAreaClipRect) {
      dom.designAreaClipRect.setAttribute('rx', frameRadius);
      dom.designAreaClipRect.setAttribute('ry', frameRadius);
    }
    dom.viewToggleButtons.forEach((button) => {
      const isActive = button.dataset.viewMode === mode;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
    if (dom.appShell) {
      dom.appShell.setAttribute('data-view-mode', mode);
    }
    if (dom.designToggleButton) {
      dom.designToggleButton.disabled = mode !== 'full';
    }
    if (mode === 'edit') {
      applyDesignVisibility(true);
    } else {
      applyDesignVisibility(context.designVisiblePreference);
    }
    if (dom.editToolbar) {
      dom.editToolbar.hidden = mode !== 'edit';
    }
    if (dom.fullToolbar) {
      dom.fullToolbar.hidden = mode !== 'full';
    }
    if (mode !== 'edit' && state.interaction) {
      dom.svgCanvas.releasePointerCapture(state.interaction.pointerId);
      state.interaction = null;
    }
    if (mode === 'full' && drawerApi) {
      drawerApi.closeDrawer();
    }
    requestAnimationFrame(() => selectionApi.updateSelectionOverlay());
  }

  dom.viewToggleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.viewMode;
      if (mode) {
        setViewMode(mode);
      }
    });
  });

  if (dom.frameToggleButton) {
    dom.frameToggleButton.addEventListener('click', () => {
      setFrameVisibility(!context.frameVisible);
    });
  }

  if (dom.designToggleButton) {
    dom.designToggleButton.addEventListener('click', () => {
      context.designVisiblePreference = !context.designVisiblePreference;
      applyDesignVisibility(context.designVisiblePreference);
    });
  }

  setFrameVisibility(context.frameVisible);
  setViewMode(context.currentViewMode);

  return {
    setViewMode,
    setFrameVisibility,
    applyDesignVisibility
  };
}
