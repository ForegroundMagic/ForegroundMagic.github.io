// Overlay control + Product Preview with SVG canvas, driven by DB-derived data.
(function(){
  const byId = (id)=> document.getElementById(id);

  // Default color preview paths for each product (from product_media.db)
  const DefaultProductMedia = {
  "3001C_BC_UJSST": {
    "colorAssetId": 33,
    "colorCode": "canvas_red",
    "colorName": "Canvas Red",
    "front": "assets/img/products/3001C_BC_UJSST/preview/33_canvas_red_front.png",
    "back": "assets/img/products/3001C_BC_UJSST/preview/33_canvas_red_back.png"
  },
  "Product_Demo_01": {
    "colorAssetId": 44,
    "colorCode": "heather_team_purple",
    "colorName": "Heather Team Purple",
    "front": "assets/img/products/Product_Demo_01/preview/06_heather_team_purple_front.png",
    "back": "assets/img/products/Product_Demo_01/preview/06_heather_team_purple_back.png"
  },
  "Product_Demo_02": {
    "colorAssetId": 58,
    "colorCode": "deep_teal",
    "colorName": "Deep Teal",
    "front": "assets/img/products/Product_Demo_02/preview/20_deep_teal_front.png",
    "back": "assets/img/products/Product_Demo_02/preview/20_deep_teal_back.png"
  },
  "Product_Demo_03": {
    "colorAssetId": 64,
    "colorCode": "true_royal",
    "colorName": "True Royal",
    "front": "assets/img/products/Product_Demo_03/preview/26_true_royal_front.png",
    "back": "assets/img/products/Product_Demo_03/preview/26_true_royal_back.png"
  }
};

  // Media areas (printable regions) per product / side (from product_media.db)
  const ProductMediaAreas = {
  "3001C_BC_UJSST": {
    "Back": [
      {
        "mediaAreaId": 7,
        "areaName": "Full",
        "areaType": "standard",
        "x": 360.5,
        "y": 178.5,
        "width": 440.0,
        "height": 583.0,
        "isFullArea": true
      },
      {
        "mediaAreaId": 8,
        "areaName": "Default Preset",
        "areaType": "standard",
        "x": 400.5,
        "y": 226.0,
        "width": 360.0,
        "height": 477.0,
        "isFullArea": false
      },
      {
        "mediaAreaId": 9,
        "areaName": "Yoke",
        "areaType": "standard",
        "x": 531.0,
        "y": 104.5,
        "width": 100.0,
        "height": 132.0,
        "isFullArea": false
      },
      {
        "mediaAreaId": 11,
        "areaName": "Custom",
        "areaType": "custom_max",
        "x": 360.5,
        "y": 178.5,
        "width": 440.0,
        "height": 583.0,
        "isFullArea": true
      }
    ],
    "Front": [
      {
        "mediaAreaId": 1,
        "areaName": "Full",
        "areaType": "standard",
        "x": 360.5,
        "y": 178.5,
        "width": 440.0,
        "height": 583.0,
        "isFullArea": true
      },
      {
        "mediaAreaId": 2,
        "areaName": "Default Preset",
        "areaType": "standard",
        "x": 400.5,
        "y": 226.0,
        "width": 360.0,
        "height": 477.0,
        "isFullArea": false
      },
      {
        "mediaAreaId": 3,
        "areaName": "Left Chest Tall",
        "areaType": "standard",
        "x": 677.0,
        "y": 180.0,
        "width": 110.0,
        "height": 145.0,
        "isFullArea": false
      },
      {
        "mediaAreaId": 4,
        "areaName": "Left Chest",
        "areaType": "standard",
        "x": 684.5,
        "y": 190.0,
        "width": 95.0,
        "height": 125.0,
        "isFullArea": false
      },
      {
        "mediaAreaId": 5,
        "areaName": "Right Chest Tall",
        "areaType": "standard",
        "x": 374.0,
        "y": 180.0,
        "width": 110.0,
        "height": 145.0,
        "isFullArea": false
      },
      {
        "mediaAreaId": 6,
        "areaName": "Right Chest",
        "areaType": "standard",
        "x": 381.5,
        "y": 190.0,
        "width": 95.0,
        "height": 125.0,
        "isFullArea": false
      },
      {
        "mediaAreaId": 10,
        "areaName": "Custom",
        "areaType": "custom_max",
        "x": 360.5,
        "y": 178.5,
        "width": 440.0,
        "height": 583.0,
        "isFullArea": true
      }
    ]
  }
};
  // Physical size config per product/side based on ppi_used from DB.
// We assume a uniform PPI for each side of a product and compute inch sizes as pixels / ppi.
  const ProductPpiConfig = {
    "3001C_BC_UJSST": {
      front:  38.56,
      back:   38.56
    },
    "Product_Demo_01": {
      front:  38.56,
      back:   38.56
    }
  };

  // State for customizable "Custom" area per product/side.
  // We keep original bounds and a mutable current rect clamped inside those bounds.
  const customBoundsByKey = {}; // key => { minX, minY, maxX, maxY }
  const customCurrentByKey = {}; // key => { x, y, width, height }

  function customKey(){
    return currentProductCode + ":" + currentSide;
  }

  function ensureCustomStateForCurrent(){
    const key = customKey();
    if (customCurrentByKey[key]) return;

    const prod = ProductMediaAreas[currentProductCode];
    if (!prod) return;
    const areas = prod[sideKey()];
    if (!areas) return;

    const base = areas.find(a => a.areaType === "custom_max");
    if (!base) return;

    customBoundsByKey[key] = {
      minX: base.x,
      minY: base.y,
      maxX: base.x + base.width,
      maxY: base.y + base.height
    };
    customCurrentByKey[key] = {
      x: base.x,
      y: base.y,
      width: base.width,
      height: base.height
    };
  }

  function getCustomStateForCurrent(){
    ensureCustomStateForCurrent();
    const key = customKey();
    return customCurrentByKey[key] || null;
  }


  const tpTop = byId('tpTop');
  const tpTopX = byId('tpTopExpandable');
  const tpFull = byId('tpFull');
  const tpPreview = byId('tpPreview');
  const tpCustom = byId('tpCustom');

  const previewImg = byId('productPreviewImage');
  const overlaySvg = byId('previewCanvasOverlay');
  const areaSelect = byId('previewAreaSelect');
  const sideButtons = document.querySelectorAll('#tpPreview .tp-side-btn');
  const toggleIcon = document.getElementById('tpToggleIcon');

  // Customization panel elements
  const previewAreaSizeEl = byId('previewAreaSize');
  const customSideLabelEl = byId('customSideLabel');
  const customAreaLabelEl = byId('customAreaLabel');
  const customSizeInchesEl = byId('customSizeInches');
  const customInputs = {
    x: byId('customX'),
    y: byId('customY'),
    width: byId('customW'),
    height: byId('customH')
  };
  const customResetBtn = byId('customResetBtn');

  const customRanges = {
    x: byId('customXRange'),
    y: byId('customYRange'),
    width: byId('customWRange'),
    height: byId('customHRange')
  };
  const customCenterHBtn = byId('customCenterHBtn');
  const customCenterVBtn = byId('customCenterVBtn');

  let currentProductCode = '3001C_BC_UJSST';
  let currentSide = 'front'; // 'front' | 'back'
  let currentAreaName = null;

  // ---- Helpers ----
  function closePanel(panel){
    if (!panel) return;
    panel.classList.remove('is-open', 'is-expanded');
    panel.dataset.expanded = 'false';
  }

  function openPanel(panel){
    if (!panel) return;
    panel.classList.add('is-open');
  }

// Close buttons
  document.querySelectorAll('.toolpanel .tp-close').forEach(btn => {
    btn.addEventListener('click', (e)=>{
      const panel = e.currentTarget.closest('.toolpanel');
      closePanel(panel);
      if (toggleIcon) toggleIcon.textContent = 'open_in_full';
    });
  });

  // Expand/collapse toggle for topX
  const toggleBtn = document.querySelector('#tpTopExpandable .tp-toggle');
  if (toggleBtn && toggleIcon){
    toggleBtn.addEventListener('click', ()=>{
      const expanded = tpTopX.classList.toggle('is-expanded');
      tpTopX.dataset.expanded = expanded ? 'true' : 'false';
      toggleIcon.textContent = expanded ? 'close_fullscreen' : 'open_in_full';
    });
  }

  // ---- Preview side + area logic ----
  function sideKey(){
    return currentSide === 'back' ? 'Back' : 'Front';
  }

  function getAreasForCurrent(){
    const prod = ProductMediaAreas[currentProductCode];
    if (!prod) return [];
    const raw = prod[sideKey()] || [];
    const areas = raw.map(a => ({ ...a }));

    const customState = getCustomStateForCurrent();
    if (customState) {
      for (let i = 0; i < areas.length; i++) {
        if (areas[i].areaType === 'custom_max') {
          areas[i].x = customState.x;
          areas[i].y = customState.y;
          areas[i].width = customState.width;
          areas[i].height = customState.height;
          break;
        }
      }
    }
    return areas;
  }


  // Compute approximate physical size (inches) for the active area,
  // based on ProductInchConfig and the max custom area as reference.
  function getPpiForCurrentSide(){
    const cfgProd = ProductPpiConfig[currentProductCode];
    const ppi = cfgProd && cfgProd[currentSide];
    if (!ppi || !isFinite(ppi) || ppi <= 0) return null;
    return ppi;
  }

  function describeAreaInches(areaLike){
    if (!areaLike) return null;
    const ppi = getPpiForCurrentSide();
    if (!ppi) return null;
    let wIn = areaLike.width / ppi;
    let hIn = areaLike.height / ppi;
    if (!isFinite(wIn) || !isFinite(hIn)) return null;
    // round down to 2 decimal places (matches DB behaviour, eg 145px / 38.56 -> 3.76)
    wIn = Math.floor(wIn * 100) / 100;
    hIn = Math.floor(hIn * 100) / 100;
    return {
      widthIn: wIn,
      heightIn: hIn,
      label: wIn.toFixed(2) + ' in × ' + hIn.toFixed(2) + ' in'
    };
  }

  function getActiveArea(){
    const areas = getAreasForCurrent();
    if (!areas.length) return null;
    return areas.find(a => a.areaName === currentAreaName) || areas[0];
  }

  function updateAreaSizeLabels(){
    const activeArea = getActiveArea();
    const inches = activeArea ? describeAreaInches(activeArea) : null;

    if (previewAreaSizeEl) {
      previewAreaSizeEl.textContent = inches ? inches.label : '—';
    }

    const customState = getCustomStateForCurrent();
    if (customSizeInchesEl) {
      let source = activeArea;
      if (currentAreaName === 'Custom' && customState) {
        source = { width: customState.width, height: customState.height };
      }
      const customInches = source ? describeAreaInches(source) : null;
      customSizeInchesEl.textContent = customInches ? customInches.label : '—';
    }
  }

  
  function getCustomBoundsForCurrent(){
    ensureCustomStateForCurrent();
    const key = customKey();
    return customBoundsByKey[key] || null;
  }

  function syncCustomInputsFromState(){
    const customState = getCustomStateForCurrent();
    const bounds = getCustomBoundsForCurrent();
    if (!customState || !bounds) return;

    const maxWidth = bounds.maxX - bounds.minX;
    const maxHeight = bounds.maxY - bounds.minY;

    // Convert absolute canvas coords to values relative to the custom max area
    const relX = customState.x - bounds.minX;
    const relY = customState.y - bounds.minY;
    const relW = customState.width;
    const relH = customState.height;

    // Inputs (relative values so user sees 0..max)
    if (customInputs.x) customInputs.x.value = Math.round(relX);
    if (customInputs.y) customInputs.y.value = Math.round(relY);
    if (customInputs.width) customInputs.width.value = Math.round(relW);
    if (customInputs.height) customInputs.height.value = Math.round(relH);

    // Sliders mirror the same values and respect max custom area
    if (customRanges.x) {
      customRanges.x.min = 0;
      customRanges.x.max = Math.round(maxWidth);
      customRanges.x.value = Math.round(relX);
    }
    if (customRanges.y) {
      customRanges.y.min = 0;
      customRanges.y.max = Math.round(maxHeight);
      customRanges.y.value = Math.round(relY);
    }
    if (customRanges.width) {
      customRanges.width.min = 1;
      customRanges.width.max = Math.round(maxWidth);
      customRanges.width.value = Math.round(relW);
    }
    if (customRanges.height) {
      customRanges.height.min = 1;
      customRanges.height.max = Math.round(maxHeight);
      customRanges.height.value = Math.round(relH);
    }

    if (customSideLabelEl) {
      customSideLabelEl.textContent = currentSide === 'back' ? 'Back' : 'Front';
    }
    if (customAreaLabelEl) {
      customAreaLabelEl.textContent = 'Area: ' + (currentAreaName || 'Custom');
    }
  }

  // Apply a change coming from the UI (inputs, sliders, +/-) using values
  // relative to the custom_max area (0..maxWidth / 0..maxHeight).
  function setCustomFromRelative(field, value){
    const bounds = getCustomBoundsForCurrent();
    const state = getCustomStateForCurrent();
    if (!bounds || !state || typeof field !== 'string') return;

    let v = Number(value);
    if (!isFinite(v)) return;

    const maxWidth = bounds.maxX - bounds.minX;
    const maxHeight = bounds.maxY - bounds.minY;

    // Current relative values
    let relX = state.x - bounds.minX;
    let relY = state.y - bounds.minY;
    let relW = state.width;
    let relH = state.height;

    // Apply the change
    switch (field) {
      case 'x':
        relX = v;
        break;
      case 'y':
        relY = v;
        break;
      case 'width':
        relW = v;
        break;
      case 'height':
        relH = v;
        break;
      default:
        return;
    }

    // Minimum size of 1px
    if (relW < 1) relW = 1;
    if (relH < 1) relH = 1;

    // Clamp position into 0..max range
    if (relX < 0) relX = 0;
    if (relY < 0) relY = 0;
    if (relX > maxWidth) relX = maxWidth;
    if (relY > maxHeight) relY = maxHeight;

    // Ensure the rectangle stays fully inside the custom_max area:
    // if position + size would overflow, shrink the size to "remaining safe" space.
    if (relX + relW > maxWidth) relW = maxWidth - relX;
    if (relY + relH > maxHeight) relH = maxHeight - relY;

    // Guard again in case maxWidth/maxHeight are very small
    if (relW < 1) relW = 1;
    if (relH < 1) relH = 1;

    const absState = {
      x: bounds.minX + relX,
      y: bounds.minY + relY,
      width: relW,
      height: relH
    };

    setCustomStateForCurrent(absState);
  }
function setCustomStateForCurrent(partial){
    const existing = getCustomStateForCurrent();
    if (!existing) return;
    const key = customKey();
    const bounds = customBoundsByKey[key];

    const next = Object.assign({}, existing, partial || {});

    // Ensure minimum size
    if (next.width < 1) next.width = 1;
    if (next.height < 1) next.height = 1;

    // Enforce maximum size equal to the original custom_max area
    if (bounds) {
      const maxWidth = bounds.maxX - bounds.minX;
      const maxHeight = bounds.maxY - bounds.minY;
      if (next.width > maxWidth) next.width = maxWidth;
      if (next.height > maxHeight) next.height = maxHeight;
    }

    // Clamp position so the rect always stays fully inside the original custom_max area
    if (bounds) {
      if (next.x < bounds.minX) next.x = bounds.minX;
      if (next.y < bounds.minY) next.y = bounds.minY;
      if (next.x + next.width > bounds.maxX) next.x = bounds.maxX - next.width;
      if (next.y + next.height > bounds.maxY) next.y = bounds.maxY - next.height;
    }

    customCurrentByKey[key] = next;
    syncCustomInputsFromState();
    updateCanvasOverlay();
    updateAreaSizeLabels();
  }

  function updateSideButtons(){
    sideButtons.forEach(btn => {
      const isActive = btn.dataset.side === currentSide;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  function updatePreview(){
    const media = DefaultProductMedia[currentProductCode];
    if (!media) return;
    const path = currentSide === 'back' ? media.back : media.front;
    if (!path) return;
    previewImg.src = path;
    previewImg.alt = media.colorName + ' - ' + (currentSide === 'front' ? 'Front' : 'Back') + ' preview';
    updateSideButtons();
    // When image has finished loading we will update overlay via the load handler
    if (previewImg.complete && previewImg.naturalWidth) {
      refreshAreaOptions();
    }
  }

  function updateCanvasOverlay(){
    if (!overlaySvg || !previewImg || !previewImg.naturalWidth) return;
    const areas = getAreasForCurrent();
    overlaySvg.innerHTML = '';
    if (!areas.length) return;

    let area = areas.find(a => a.areaName === currentAreaName);
    if (!area) {
      area = areas[0];
      currentAreaName = area.areaName;
      if (areaSelect) areaSelect.value = currentAreaName;
    }

    overlaySvg.setAttribute('viewBox', '0 0 ' + previewImg.naturalWidth + ' ' + previewImg.naturalHeight);

    const ns = 'http://www.w3.org/2000/svg';
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', area.x);
    rect.setAttribute('y', area.y);
    rect.setAttribute('width', area.width);
    rect.setAttribute('height', area.height);
    rect.setAttribute('rx', '8');
    rect.setAttribute('ry', '8');
    rect.setAttribute('fill', '#3bff9c');
    rect.setAttribute('fill-opacity', '0.18');
    rect.setAttribute('stroke', '#3bff9c');
    rect.setAttribute('stroke-width', '2');
    if (area.areaType === 'custom_max') {
      rect.setAttribute('stroke-dasharray', '6 4');
    }
    overlaySvg.appendChild(rect);
    updateAreaSizeLabels();
  }

  function refreshAreaOptions(){
    if (!areaSelect) return;
    const areas = getAreasForCurrent();
    areaSelect.innerHTML = '';
    if (!areas.length) {
      currentAreaName = null;
      updateCanvasOverlay();
      return;
    }

    areas.forEach(area => {
      const opt = document.createElement('option');
      opt.value = area.areaName;
      opt.textContent = area.areaName;
      areaSelect.appendChild(opt);
    });

    if (!currentAreaName || !areas.some(a => a.areaName === currentAreaName)) {
      const preferred = areas.find(a => a.areaName === 'Default Preset') || areas[0];
      currentAreaName = preferred.areaName;
    }
    areaSelect.value = currentAreaName;
    if (tpCustom) {
      if (currentAreaName === 'Custom') {
        openPanel(tpCustom);
        syncCustomInputsFromState();
      } else {
        closePanel(tpCustom);
      }
    } else {
      syncCustomInputsFromState();
    }
    updateCanvasOverlay();
  }

  if (areaSelect){
    areaSelect.addEventListener('change', () => {
      currentAreaName = areaSelect.value || null;
      if (tpCustom) {
        if (currentAreaName === 'Custom') {
          openPanel(tpCustom);
          syncCustomInputsFromState();
        } else {
          closePanel(tpCustom);
        }
      }
      updateCanvasOverlay();
    });
  }

  sideButtons.forEach(btn => {
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      const side = btn.dataset.side === 'back' ? 'back' : 'front';
      if (currentSide === side) return;
      currentSide = side;
      updatePreview();
      refreshAreaOptions();
    });
  });

  // Cust  // Customization: input fields, sliders and +/- steppers
  if (customInputs.x || customInputs.y || customInputs.width || customInputs.height) {
    ['x','y','width','height'].forEach(key => {
      const input = customInputs[key];
      if (!input) return;
      input.addEventListener('input', () => {
        const val = parseFloat(input.value);
        if (!isFinite(val)) return;
        // Keep the paired slider visually in sync immediately
        const slider = customRanges[key];
        if (slider) {
          slider.value = String(val);
        }
        // Inputs use values relative to the custom max area.
        setCustomFromRelative(key, val);
      });
    });
  }

  // Range sliders mirror the same relative values and stay in sync with inputs
  if (customRanges.x || customRanges.y || customRanges.width || customRanges.height) {
    ['x','y','width','height'].forEach(key => {
      const slider = customRanges[key];
      if (!slider) return;
      slider.addEventListener('input', () => {
        const val = parseFloat(slider.value);
        if (!isFinite(val)) return;
        // Keep the paired input visually in sync immediately
        const input = customInputs[key];
        if (input) {
          input.value = String(val);
        }
        // Values are relative to the custom max area.
        setCustomFromRelative(key, val);
      });
    });
  }

  // +/- steppers: increment by 1 and support press-and-hold
  if (typeof window !== 'undefined') {
    const stepButtons = document.querySelectorAll('[data-custom-step]');
    stepButtons.forEach(btn => {
      const field = btn.getAttribute('data-field');
      let step = parseFloat(btn.getAttribute('data-step'));
      if (!isFinite(step) || step === 0) step = 1;

      let holdInterval = null;

      const applyStep = () => {
        const bounds = getCustomBoundsForCurrent();
        const state = getCustomStateForCurrent();
        if (!bounds || !state || !field) return;

        const maxWidth = bounds.maxX - bounds.minX;
        const maxHeight = bounds.maxY - bounds.minY;

        let relX = state.x - bounds.minX;
        let relY = state.y - bounds.minY;
        let relW = state.width;
        let relH = state.height;

        let current;
        switch (field) {
          case 'x': current = relX; break;
          case 'y': current = relY; break;
          case 'width': current = relW; break;
          case 'height': current = relH; break;
          default: return;
        }

        const nextVal = current + step;
        setCustomFromRelative(field, nextVal);
      };

      const startHold = (ev) => {
        ev.preventDefault();
        applyStep();
        if (holdInterval) clearInterval(holdInterval);
        holdInterval = setInterval(applyStep, 120);
      };

      const stopHold = () => {
        if (holdInterval) {
          clearInterval(holdInterval);
          holdInterval = null;
        }
      };

      // Mouse / touch for continuous stepping
      btn.addEventListener('mousedown', startHold);
      btn.addEventListener('touchstart', startHold, { passive: false });

      ['mouseup','mouseleave','touchend','touchcancel'].forEach(evtName => {
        btn.addEventListener(evtName, stopHold);
      });

      // Keyboard accessibility: single step on Enter/Space
      btn.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          applyStep();
        }
      });
    });
  }

  // Reset to original max custom area for this product/side
  if (customResetBtn){
    customResetBtn.addEventListener('click', () => {
      const key = customKey();
      const bounds = getCustomBoundsForCurrent();
      if (!bounds) return;
      const width = bounds.maxX - bounds.minX;
      const height = bounds.maxY - bounds.minY;

      // Set absolute state back to full custom_max area
      setCustomStateForCurrent({
        x: bounds.minX,
        y: bounds.minY,
        width,
        height
      });
    });
  }

  // Center horizontally within the custom_max area
  if (customCenterHBtn){
    customCenterHBtn.addEventListener('click', () => {
      const bounds = getCustomBoundsForCurrent();
      const state = getCustomStateForCurrent();
      if (!bounds || !state) return;

      const maxWidth = bounds.maxX - bounds.minX;
      const relW = state.width;
      const targetRelX = (maxWidth - relW) / 2;
      setCustomFromRelative('x', targetRelX);
    });
  }

  // Center vertically within the custom_max area
  if (customCenterVBtn){
    customCenterVBtn.addEventListener('click', () => {
      const bounds = getCustomBoundsForCurrent();
      const state = getCustomStateForCurrent();
      if (!bounds || !state) return;

      const maxHeight = bounds.maxY - bounds.minY;
      const relH = state.height;
      const targetRelY = (maxHeight - relH) / 2;
      setCustomFromRelative('y', targetRelY);
    });
  }

  previewImg.addEventListener('load', () => {
    // Ensure overlay uses up-to-date natural dimensions
    refreshAreaOptions();
  });

  // ---- Public APIs ----
  window.ToolPanels = {
    open(kind){
      const map = { top: tpTop, topX: tpTopX, full: tpFull, preview: tpPreview, custom: tpCustom };
      Object.values(map).forEach(el => el && closePanel(el));
      const el = map[kind];
      if (el) {
        openPanel(el);
        if (kind === 'topX' && toggleIcon) toggleIcon.textContent = 'open_in_full';
        if (kind === 'preview') {
          updatePreview();
          refreshAreaOptions();
        }
      }
    },
    closeAll(){
      [tpTop, tpTopX, tpFull, tpPreview].forEach(el => el && closePanel(el));
      if (toggleIcon) toggleIcon.textContent = 'open_in_full';
    }
  };

  window.ProductPreview = {
    setProduct(productCode){
      if (!DefaultProductMedia[productCode]) return;
      currentProductCode = productCode;
      updatePreview();
      refreshAreaOptions();
    },
    setSide(side){
      const norm = side === 'back' ? 'back' : 'front';
      currentSide = norm;
      updatePreview();
      refreshAreaOptions();
    },
    getMedia(){
      return { media: ProductMediaAreas, defaults: DefaultProductMedia };
    }
  };

})();