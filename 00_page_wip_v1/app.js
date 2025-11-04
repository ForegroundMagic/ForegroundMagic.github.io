/* ============================================================
   Dark UI Demo — Interaction Logic
   Mirrors original inline script from basic_responsive_44.html
   ============================================================ */

// Safety: noop if JS fails early
(function(){ if(!document || !document.documentElement) return; })();

/* ============================================================
   SECTION SWITCHING — Explore / Customize / Order
   ============================================================ */
const headerButtons = document.querySelectorAll('.header-tools .tool');
function setActive(section){
  document.documentElement.setAttribute('data-active-section', section);
  headerButtons.forEach(btn => {
    const isActive = btn.dataset.section === section;
    btn.toggleAttribute('aria-current', isActive);
    btn.setAttribute('aria-pressed', isActive);
    btn.classList.toggle('is-active', isActive);
  });
  if(section === 'customize'){ setActivePage('customize', 'editor'); }
  else{ setActivePage(section, ''); }
  updatePreviewLock();
}
headerButtons.forEach(btn => {
  btn.addEventListener('click', (e) => { e.preventDefault(); setActive(btn.dataset.section); });
  btn.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); setActive(btn.dataset.section); }
  });
});

/* ============================================================
   VIEW TOOLBAR — exclusive groups + independent toggles
   ============================================================ */
const viewToolbarEl = document.querySelector('.view-mode-toolbar');
function makeExclusiveWithin(container, groupName){
  const buttons = [...container.querySelectorAll(`[data-group="${groupName}"]`)];
  buttons.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    updatePreviewLock();
    updateEditViewBox();
    updateSelectionOverlay();
    if(groupName === 'side'){
      applyImageForSide(btn.getAttribute('data-value'));
      updateSelectionOverlay();
    }
  }));
}
function wireToggles(container){
  container.querySelectorAll('[data-toggle]')
    .forEach(b => b.addEventListener('click', (e) => {
      e.preventDefault();
      const next = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(next));
      if(b.dataset.toggle === 'design') updateDesignOverlay();
      if(b.dataset.toggle === 'frame')  updateFrameOverlay();
    }));
}
makeExclusiveWithin(viewToolbarEl, 'side');
makeExclusiveWithin(viewToolbarEl, 'mode');
wireToggles(viewToolbarEl);

/* ============================================================
   MAIN CONTENT PAGES — per-section subpages
   ============================================================ */
function setActivePage(section, page){
  const block = document.querySelector(`.content-block[data-section="${section}"]`);
  if(!block) return;
  // Toggle empty-state
  const empty = block.querySelector(`.empty-state[data-empty-for="${section}"]`);
  if(empty) empty.style.display = page ? 'none' : 'grid';

  // Toggle pages
  block.querySelectorAll('.content-page').forEach(p => {
    p.classList.toggle('is-active', p.getAttribute('data-page') === page && !!page);
  });

  // Update aria-pressed on toolbar buttons within this section
  const toolbar = document.querySelector(`.toolbar[data-section="${section}"]`);
  if(toolbar){
    toolbar.querySelectorAll('[data-page]').forEach(btn => {
      const isActive = btn.getAttribute('data-page') === page && !!page;
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }
}

// Wire Explore & Order toolbar buttons -> content pages
document.querySelectorAll('.toolbar[data-section="explore"] [data-page], .toolbar[data-section="order"] [data-page]')
  .forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const toolbar = btn.closest('.toolbar');
      const section = toolbar ? toolbar.getAttribute('data-section') : '';
      const page = btn.getAttribute('data-page') || '';
      setActivePage(section, page);
    });
  });

/* ============================================================
   PREVIEW LOCK — match reference: disable ALL header toolbars during Preview
   ============================================================ */
const headerToolbarDeck = document.querySelector('.header-row-toolbar .toolbar-deck');
function setDeckDisabled(disabled){
  if(!headerToolbarDeck) return;
  const buttons = headerToolbarDeck.querySelectorAll('.tool');
  buttons.forEach(b => {
    b.disabled = !!disabled;
    b.setAttribute('aria-disabled', String(!!disabled));
  });
}
function isPreviewActive(){
  const previewBtn = viewToolbarEl && viewToolbarEl.querySelector('[data-group="mode"][data-value="preview"]');
  return previewBtn && previewBtn.getAttribute('aria-pressed') === 'true';
}
function isEditActive(){
  const editBtn = viewToolbarEl && viewToolbarEl.querySelector('[data-group="mode"][data-value="edit"]');
  return editBtn && editBtn.getAttribute('aria-pressed') === 'true';
}
function updatePreviewLock(){ setDeckDisabled(false); }

/* ============================================================
   PANELS — Customize toolbar -> Panels (restored behavior)
   ============================================================ */
const customizeToolbar = document.querySelector('.toolbar[data-section="customize"]');
const panelNames = ['designs', 'elements', 'text', 'color', 'properties', 'layers'];
const galleryControllers = new Map();
function getCustomizeButtonByName(name){
  return customizeToolbar && customizeToolbar.querySelector(`.tool[data-tool="${name}"]`);
}
function openPanel(name){
  if(!panelNames.includes(name)) return;
  // Turn on current pressed state and clear others
  panelNames.forEach(n => {
    const b = getCustomizeButtonByName(n);
    if(b) b.setAttribute('aria-pressed', String(n === name));
  });
  document.documentElement.setAttribute('data-open-panel', name);
  const controller = galleryControllers.get(name);
  if(controller){
    controller.open();
  }
  if(name === 'properties'){
    updatePropertiesPanel();
  }
  if(name === 'color'){
    if(layerState.activeLayerId){
      colorPanelTargetId = layerState.activeLayerId;
    }
    updateColorPanel();
  }
  if(name === 'layers'){
    updateLayersPanelCollapsedHeight();
    setLayersPanelExpanded(false);
    refreshLayerList();
  }
}
function closePanel(){
  document.documentElement.setAttribute('data-open-panel', '');
  panelNames.forEach(n => {
    const b = getCustomizeButtonByName(n);
    if(b) b.setAttribute('aria-pressed', 'false');
  });
  setLayersPanelExpanded(false);
}
if(customizeToolbar){
  customizeToolbar.querySelectorAll('.tool[data-tool]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const name = btn.getAttribute('data-tool');
      // Toggle same-panel click -> close; otherwise open requested panel
      const currentlyOpen = document.documentElement.getAttribute('data-open-panel') || '';
      if(currentlyOpen === name){ closePanel(); }
      else { openPanel(name); }
    });
  });
}
document.querySelectorAll('[data-close-panel]').forEach(b => b.addEventListener('click', (e) => {
  e.preventDefault();
  closePanel();
}));

/* ============================================================
   GALLERY DATA + LOGIC
   ============================================================ */
const GALLERY_PAGE_SIZE = 10;
const svgCache = new Map();
const svgNS = 'http://www.w3.org/2000/svg';
const DESIGN_BOUNDS = { x: 361, y: 180, width: 440, height: 583 };
const DESIGN_CENTER = {
  x: DESIGN_BOUNDS.x + DESIGN_BOUNDS.width / 2,
  y: DESIGN_BOUNDS.y + DESIGN_BOUNDS.height / 2
};
const MIN_SCALE = 0.01;
const MAX_SCALE = 10;
const MAX_LAYER_SLOTS = 9;

const dropdownPanelsEl = document.querySelector('.dropdown-panels');
const designLayersGroup = document.getElementById('designLayers');
const productColorOverlay = document.getElementById('productColorOverlay');
const layerListEl = document.getElementById('layerList');
const layerCountEl = document.getElementById('layerCount');
const layersPanelEl = document.querySelector('.panel[data-panel="layers"]');
const layersExpandToggle = document.getElementById('layersExpandToggle');
const layerColorInput = document.getElementById('layerColorInput');
const colorPanelSubtitle = document.getElementById('colorPanelSubtitle');
const colorSwatches = Array.from(document.querySelectorAll('.color-swatch'));
const selectionOverlay = document.getElementById('selectionOverlay');
const selectionFrame = document.getElementById('selectionFrame');
const selectionHandles = Array.from(document.querySelectorAll('.selection-handle'));
const selectionRotateHandle = document.querySelector('.selection-rotate');
const sceneSvg = document.getElementById('sceneSvg');
const designAreaRect = document.getElementById('frameRectDesign');

const propertyInputs = {
  name: document.getElementById('propName'),
  x: document.getElementById('propX'),
  y: document.getElementById('propY'),
  scale: document.getElementById('propScale'),
  rotation: document.getElementById('propRotation'),
  text: document.getElementById('propText'),
  font: document.getElementById('propFont'),
  fontSize: document.getElementById('propFontSize'),
  bold: document.getElementById('propBold'),
  italic: document.getElementById('propItalic')
};

const propertySliders = {
  x: document.getElementById('propXSlider'),
  y: document.getElementById('propYSlider'),
  scale: document.getElementById('propScaleSlider'),
  rotation: document.getElementById('propRotationSlider')
};

const PROPERTY_LIMITS = {
  x: { min: -1000, max: 1000 },
  y: { min: -1000, max: 1000 },
  scale: { min: 1, max: 1000 },
  rotation: { min: 0, max: 360 }
};

const PROPERTY_DEFAULTS = {
  x: 0,
  y: 0,
  scale: 100,
  rotation: 0
};

const textPropertiesFieldset = document.getElementById('textProperties');
const propertiesEmptyEl = document.getElementById('propertiesEmpty');

const layerState = {
  layers: [],
  activeLayerId: null,
  counters: { Design: 0, Element: 0, Text: 0 },
  baseLayerId: 'layer-0',
  idCounter: 1,
  pendingSlot: null
};

let colorPanelTargetId = null;
let layersPanelExpanded = false;

const interactionState = {
  type: null,
  pointerId: null,
  startPointer: null,
  startLayer: null
};

const colorCanvas = document.createElement('canvas');
colorCanvas.width = colorCanvas.height = 1;
const colorCtx = colorCanvas.getContext('2d');

async function fetchSvg(assetPath){
  if(!assetPath) throw new Error('Asset path is required to load an SVG.');
  if(svgCache.has(assetPath)){
    return svgCache.get(assetPath).cloneNode(true);
  }
  const response = await fetch(assetPath);
  if(!response.ok){
    throw new Error(`Failed to load SVG asset at ${assetPath} (${response.status})`);
  }
  const svgText = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const svg = doc.documentElement;
  svgCache.set(assetPath, svg);
  return svg.cloneNode(true);
}

function preparePreviewSvg(svg){
  const previewSvg = svg.cloneNode(true);
  previewSvg.classList.add('gallery-svg-preview');
  previewSvg.removeAttribute('width');
  previewSvg.removeAttribute('height');
  previewSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  return previewSvg;
}

function createSvgTemplate(type, config){
  const {
    key,
    name,
    tags = [],
    width,
    height,
    assetPath,
    colorAttribute = 'fill',
    baseColor,
    accentColor
  } = config;

  return {
    type,
    key,
    name,
    tags,
    width,
    height,
    assetPath,
    colorAttribute,
    baseColor,
    accentColor,
    async renderPreview(container){
      if(!container) return;
      container.innerHTML = '';
      try{
        const svg = await fetchSvg(assetPath);
        container.appendChild(preparePreviewSvg(svg));
      }catch(error){
        console.error(error);
        const fallback = document.createElement('div');
        fallback.className = 'gallery-item-preview-error';
        fallback.textContent = 'Preview unavailable';
        container.appendChild(fallback);
      }
    },
    async createContent(container){
      if(!container) return { colorElement: null };
      const svg = await fetchSvg(assetPath);
      const instance = svg.cloneNode(true);
      instance.removeAttribute('id');
      instance.setAttribute('width', width);
      instance.setAttribute('height', height);
      if(!instance.getAttribute('viewBox')){
        instance.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }
      instance.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      container.appendChild(instance);
      const colorTarget = instance.querySelector(`[${colorAttribute}]`) ||
        instance.querySelector('path, rect, circle, ellipse, polygon, polyline, line');
      if(colorTarget && (baseColor || accentColor)){
        colorTarget.setAttribute(colorAttribute, baseColor || accentColor);
      }
      return { colorElement: colorTarget };
    }
  };
}

function createTextTemplate(config){
  const {
    key,
    name,
    tags = [],
    width,
    height,
    previewAsset,
    text,
    fontFamily,
    fontSize,
    fontWeight = 600,
    fontStyle = 'normal',
    fill = '#ffffff'
  } = config;

  return {
    type: 'Text',
    key,
    name,
    tags,
    width,
    height,
    text,
    fontFamily,
    fontSize,
    fontWeight,
    fontStyle,
    fill,
    async renderPreview(container){
      if(!container) return;
      container.innerHTML = '';
      if(!previewAsset){
        const fallback = document.createElement('div');
        fallback.className = 'gallery-text-preview';
        fallback.textContent = text;
        container.appendChild(fallback);
        return;
      }
      try{
        const svg = await fetchSvg(previewAsset);
        container.appendChild(preparePreviewSvg(svg));
      }catch(error){
        console.error(error);
        const fallback = document.createElement('div');
        fallback.className = 'gallery-text-preview';
        fallback.textContent = text;
        container.appendChild(fallback);
      }
    }
  };
}

function collectGalleryTags(templates){
  const tags = new Map();
  templates.forEach(template => {
    (template.tags || []).forEach(tag => {
      const key = String(tag).toLowerCase();
      tags.set(key, tag);
    });
  });
  return Array.from(tags.values()).sort();
}

function createGalleryController(panel, type, templates, templateNode){
  if(!panel || !templateNode) return null;
  const searchField = panel.querySelector('.search-field');
  const searchInput = panel.querySelector('.gallery-search-input');
  const suggestionsEl = panel.querySelector('.gallery-suggestions');
  const activeTagsEl = panel.querySelector('.gallery-active-tags');
  const matchModeButton = panel.querySelector('.gallery-match-mode');
  const clearTagsButton = panel.querySelector('.gallery-clear-tags');
  const tagExplorer = panel.querySelector('.gallery-tag-explorer');
  const tagToggleButton = panel.querySelector('.gallery-tag-toggle');
  const tagStrip = panel.querySelector('.gallery-tag-strip');
  const grid = panel.querySelector('.gallery-grid');
  const panelBody = panel.querySelector('.panel__body--gallery');
  const prevButton = panel.querySelector('.gallery-prev');
  const nextButton = panel.querySelector('.gallery-next');
  const pageIndicator = panel.querySelector('.page-indicator');
  const addButton = panel.querySelector('.gallery-add-button');
  const statusLabel = panel.querySelector('.gallery-selection-status');
  const panelName = panel.getAttribute('data-panel') || type || 'gallery';

  if(suggestionsEl){
    const listId = suggestionsEl.id || `gallery-suggestions-${panelName}`;
    suggestionsEl.id = listId;
    if(searchInput){
      searchInput.setAttribute('aria-controls', listId);
    }
  }

  const state = {
    type,
    templates: templates.slice(),
    tags: collectGalleryTags(templates),
    textTerm: '',
    selectedTags: new Set(),
    filtered: templates.slice(),
    page: 1,
    activeTemplate: null,
    matchAny: false,
    suggestions: [],
    activeSuggestionIndex: -1,
    tagsExpanded: false
  };

  function resolveTag(raw){
    if(!raw) return null;
    const lookup = raw.trim().replace(/^#/, '').toLowerCase();
    if(!lookup) return null;
    return state.tags.find(tag => tag.toLowerCase() === lookup) || null;
  }

  function setTagsExpanded(expanded){
    state.tagsExpanded = !!expanded;
    if(tagExplorer){
      tagExplorer.classList.toggle('is-expanded', state.tagsExpanded);
    }
    if(panelBody){
      panelBody.classList.toggle('tags-expanded', state.tagsExpanded);
    }
    if(tagToggleButton){
      tagToggleButton.setAttribute('aria-expanded', state.tagsExpanded ? 'true' : 'false');
      const label = tagToggleButton.querySelector('.toggle-label');
      if(label){
        label.textContent = state.tagsExpanded ? 'Hide tags' : 'See All tags';
      }
    }
    if(tagStrip){
      tagStrip.setAttribute('aria-hidden', state.tagsExpanded ? 'false' : 'true');
      if(state.tagsExpanded){
        tagStrip.scrollTop = 0;
        if(typeof tagStrip.scrollTo === 'function'){
          tagStrip.scrollTo({ top: 0 });
        }
      }
    }
  }

  function updateCombobox(expanded){
    if(!searchField) return;
    searchField.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  }

  function hideSuggestions(){
    if(!suggestionsEl) return;
    suggestionsEl.classList.remove('is-visible');
    suggestionsEl.innerHTML = '';
    state.suggestions = [];
    state.activeSuggestionIndex = -1;
    updateCombobox(false);
    if(searchInput){
      searchInput.removeAttribute('aria-activedescendant');
    }
  }

  function renderSuggestions(){
    if(!suggestionsEl) return;
    suggestionsEl.innerHTML = '';
    if(!state.suggestions.length){
      hideSuggestions();
      return;
    }
    suggestionsEl.classList.add('is-visible');
    updateCombobox(true);
    let activeId = '';
    state.suggestions.forEach((tag, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'gallery-suggestion';
      button.setAttribute('role', 'option');
      const optionId = `${suggestionsEl.id}-option-${index}`;
      button.id = optionId;
      if(index === state.activeSuggestionIndex){
        button.classList.add('is-active');
        activeId = optionId;
      }
      button.innerHTML = `<span>${tag}</span><span class="pill">Add tag</span>`;
      button.addEventListener('mousedown', (event) => {
        event.preventDefault();
        addTag(tag);
      });
      suggestionsEl.appendChild(button);
    });
    if(searchInput){
      if(activeId){
        searchInput.setAttribute('aria-activedescendant', activeId);
      }else{
        searchInput.removeAttribute('aria-activedescendant');
      }
    }
  }

  function buildSuggestions(query){
    const q = query.trim().replace(/^#/, '').toLowerCase();
    if(!q) return [];
    const matches = state.tags
      .filter(tag => !state.selectedTags.has(tag) && tag.toLowerCase().includes(q))
      .map(tag => ({
        tag,
        priority: tag.toLowerCase().startsWith(q) ? 0 : 1
      }));
    matches.sort((a, b) => a.priority - b.priority || a.tag.localeCompare(b.tag));
    return matches.slice(0, 8).map(entry => entry.tag);
  }

  function updateSuggestions(){
    if(!searchInput) return;
    const value = searchInput.value;
    state.textTerm = value;
    state.suggestions = buildSuggestions(value);
    state.activeSuggestionIndex = state.suggestions.length ? 0 : -1;
    if(state.suggestions.length){
      renderSuggestions();
    }else{
      hideSuggestions();
    }
  }

  function addTag(tag){
    const canonical = resolveTag(tag);
    if(!canonical || state.selectedTags.has(canonical)) return;
    state.selectedTags.add(canonical);
    state.page = 1;
    if(searchInput){
      searchInput.value = '';
    }
    state.textTerm = '';
    hideSuggestions();
    applyGalleryFilters();
    if(searchInput){
      searchInput.focus();
    }
  }

  function updateControls(){
    if(clearTagsButton){
      clearTagsButton.disabled = state.selectedTags.size === 0;
    }
    if(matchModeButton){
      matchModeButton.dataset.mode = state.matchAny ? 'any' : 'all';
      matchModeButton.textContent = state.matchAny ? 'Match Any' : 'Match All';
      matchModeButton.classList.toggle('is-any', state.matchAny);
      matchModeButton.setAttribute('aria-pressed', state.matchAny ? 'true' : 'false');
    }
  }

  function updateStatus(message){
    if(statusLabel){
      statusLabel.textContent = message;
    }
  }

  function updateAddButton(){
    const hasSelection = Boolean(state.activeTemplate);
    const limitReached = !canAddMoreLayers();
    const enabled = hasSelection && !limitReached;
    if(addButton){
      addButton.disabled = !enabled;
      if(limitReached){
        addButton.setAttribute('aria-disabled', 'true');
        addButton.title = 'Layer limit reached (9 max)';
      }else{
        addButton.removeAttribute('aria-disabled');
        addButton.removeAttribute('title');
      }
    }
    if(limitReached){
      updateStatus('Layer limit reached (9 max)');
    }else{
      updateStatus(hasSelection ? `${state.activeTemplate.name} selected` : 'Select an item to enable');
    }
  }

  function updateTagSelectionClasses(){
    if(!tagStrip) return;
    tagStrip.querySelectorAll('[data-tag]').forEach(button => {
      const tag = button.dataset.tag;
      button.classList.toggle('active', state.selectedTags.has(tag));
    });
  }

  function renderTags(){
    if(!tagStrip) return;
    tagStrip.innerHTML = '';
    if(!state.tags.length){
      const placeholder = document.createElement('span');
      placeholder.className = 'tag-placeholder';
      placeholder.textContent = 'No tags available';
      tagStrip.appendChild(placeholder);
      return;
    }
    state.tags.forEach(tag => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tag-pill';
      button.dataset.tag = tag;
      button.textContent = tag;
      tagStrip.appendChild(button);
    });
    updateTagSelectionClasses();
  }

  function renderActiveTags(){
    if(!activeTagsEl) return;
    activeTagsEl.innerHTML = '';
    if(!state.selectedTags.size){
      const empty = document.createElement('span');
      empty.className = 'active-tags-empty';
      empty.textContent = 'No tags selected';
      activeTagsEl.appendChild(empty);
      updateControls();
      return;
    }
    state.selectedTags.forEach(tag => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'active-tag';
      chip.dataset.tag = tag;
      chip.setAttribute('aria-label', `Remove tag ${tag}`);
      chip.textContent = tag;
      activeTagsEl.appendChild(chip);
    });
    updateControls();
  }

  function renderGalleryList(){
    if(!grid) return;
    grid.innerHTML = '';
    if(!state.filtered.length){
      state.activeTemplate = null;
      const empty = document.createElement('p');
      empty.className = 'gallery-empty';
      empty.textContent = 'No matching templates found.';
      grid.appendChild(empty);
      updateAddButton();
      return;
    }
    const start = (state.page - 1) * GALLERY_PAGE_SIZE;
    const pageItems = state.filtered.slice(start, start + GALLERY_PAGE_SIZE);
    const activeKey = state.activeTemplate?.key || null;
    let selectionFound = false;
    pageItems.forEach(template => {
      const clone = templateNode.content.firstElementChild.cloneNode(true);
      clone.dataset.templateKey = template.key;
      clone.dataset.templateType = template.type;
      const nameEl = clone.querySelector('.gallery-name');
      const tagEl = clone.querySelector('.gallery-tag-list');
      if(nameEl) nameEl.textContent = template.name;
      if(tagEl){
        tagEl.innerHTML = '';
        if(Array.isArray(template.tags) && template.tags.length){
          tagEl.setAttribute('role', 'list');
          template.tags.forEach(tag => {
            const wrapper = document.createElement('span');
            wrapper.setAttribute('role', 'listitem');
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'gallery-tag-chip';
            chip.dataset.tag = tag;
            chip.textContent = tag;
            chip.addEventListener('click', (event) => {
              event.preventDefault();
              event.stopPropagation();
              addTag(tag);
            });
            chip.addEventListener('keydown', (event) => {
              if(event.key === 'Enter' || event.key === ' '){
                event.preventDefault();
                addTag(tag);
              }
            });
            wrapper.appendChild(chip);
            tagEl.appendChild(wrapper);
          });
        }else{
          tagEl.removeAttribute('role');
        }
      }
      const preview = clone.querySelector('.gallery-item-preview');
      template.renderPreview(preview);
      clone.addEventListener('click', () => selectTemplate(template, clone));
      clone.addEventListener('keydown', (event) => {
        if(event.key === 'Enter' || event.key === ' '){
          event.preventDefault();
          selectTemplate(template, clone);
        }
      });
      if(activeKey && template.key === activeKey){
        clone.classList.add('active');
        selectionFound = true;
      }
      grid.appendChild(clone);
    });
    if(activeKey && !selectionFound){
      state.activeTemplate = null;
    }
    updateAddButton();
  }

  function renderGalleryPage(){
    const pageCount = Math.max(1, Math.ceil(state.filtered.length / GALLERY_PAGE_SIZE));
    if(state.page > pageCount){
      state.page = pageCount;
    }
    if(prevButton) prevButton.disabled = state.page <= 1;
    if(nextButton) nextButton.disabled = state.page >= pageCount;
    if(pageIndicator) pageIndicator.textContent = `Page ${state.page} of ${pageCount}`;
    renderGalleryList();
    if(grid){
      grid.scrollTop = 0;
      if(typeof grid.scrollTo === 'function'){
        grid.scrollTo({ top: 0, behavior: 'auto' });
      }
    }
  }

  function applyGalleryFilters(){
    const term = state.textTerm.trim().toLowerCase();
    state.filtered = state.templates.filter(template => {
      const templateTags = template.tags || [];
      const matchesTerm = !term || template.name.toLowerCase().includes(term) || templateTags.some(tag => tag.toLowerCase().includes(term));
      let matchesTags = true;
      if(state.selectedTags.size){
        if(state.matchAny){
          matchesTags = templateTags.some(tag => state.selectedTags.has(tag));
        }else{
          matchesTags = Array.from(state.selectedTags).every(tag => templateTags.includes(tag));
        }
      }
      return matchesTerm && matchesTags;
    });
    if(state.page !== 1 && state.filtered.length <= (state.page - 1) * GALLERY_PAGE_SIZE){
      state.page = 1;
    }
    renderActiveTags();
    updateTagSelectionClasses();
    renderGalleryPage();
  }

  function selectTemplate(template, element){
    state.activeTemplate = template;
    if(grid){
      grid.querySelectorAll('.gallery-item').forEach(item => item.classList.remove('active'));
    }
    if(element){
      element.classList.add('active');
    }
    updateAddButton();
  }

  if(searchInput){
    searchInput.addEventListener('input', () => {
      state.page = 1;
      updateSuggestions();
      applyGalleryFilters();
    });

    searchInput.addEventListener('keydown', (event) => {
      if(state.suggestions.length){
        if(event.key === 'ArrowDown'){
          event.preventDefault();
          state.activeSuggestionIndex = (state.activeSuggestionIndex + 1) % state.suggestions.length;
          renderSuggestions();
          return;
        }
        if(event.key === 'ArrowUp'){
          event.preventDefault();
          state.activeSuggestionIndex = (state.activeSuggestionIndex - 1 + state.suggestions.length) % state.suggestions.length;
          renderSuggestions();
          return;
        }
      }
      if(event.key === 'Enter'){
        if(state.suggestions.length){
          event.preventDefault();
          const selected = state.suggestions[state.activeSuggestionIndex >= 0 ? state.activeSuggestionIndex : 0];
          if(selected){
            addTag(selected);
          }
        }else{
          const direct = resolveTag(searchInput.value);
          if(direct){
            event.preventDefault();
            addTag(direct);
          }
        }
      }
      if(event.key === 'Escape'){
        if(state.suggestions.length){
          event.preventDefault();
          hideSuggestions();
        }
      }
    });

    searchInput.addEventListener('focus', () => {
      if(state.suggestions.length){
        renderSuggestions();
      }
    });

    searchInput.addEventListener('blur', () => {
      setTimeout(() => {
        hideSuggestions();
      }, 120);
    });
  }

  if(panel){
    panel.addEventListener('click', (event) => {
      if(searchField && searchField.contains(event.target)) return;
      if(suggestionsEl && suggestionsEl.contains(event.target)) return;
      hideSuggestions();
    });
  }

  if(tagStrip){
    tagStrip.addEventListener('click', (event) => {
      const button = event.target.closest('[data-tag]');
      if(!button) return;
      const { tag } = button.dataset;
      if(state.selectedTags.has(tag)){
        state.selectedTags.delete(tag);
      }else{
        state.selectedTags.add(tag);
      }
      state.page = 1;
      applyGalleryFilters();
    });
  }

  if(activeTagsEl){
    activeTagsEl.addEventListener('click', (event) => {
      const chip = event.target.closest('.active-tag');
      if(!chip) return;
      const { tag } = chip.dataset;
      state.selectedTags.delete(tag);
      state.page = 1;
      applyGalleryFilters();
    });
  }

  if(matchModeButton){
    matchModeButton.addEventListener('click', () => {
      state.matchAny = !state.matchAny;
      state.page = 1;
      updateControls();
      applyGalleryFilters();
    });
  }

  if(clearTagsButton){
    clearTagsButton.addEventListener('click', () => {
      if(!state.selectedTags.size) return;
      state.selectedTags.clear();
      state.page = 1;
      applyGalleryFilters();
    });
  }

  if(tagToggleButton){
    tagToggleButton.addEventListener('click', () => {
      setTagsExpanded(!state.tagsExpanded);
    });
  }

  if(prevButton){
    prevButton.addEventListener('click', () => {
      if(state.page <= 1) return;
      state.page -= 1;
      renderGalleryPage();
    });
  }

  if(nextButton){
    nextButton.addEventListener('click', () => {
      const pageCount = Math.max(1, Math.ceil(state.filtered.length / GALLERY_PAGE_SIZE));
      if(state.page >= pageCount) return;
      state.page += 1;
      renderGalleryPage();
    });
  }

  if(addButton){
    addButton.addEventListener('click', async () => {
      if(!state.activeTemplate) return;
      const previousLabel = addButton.textContent;
      addButton.disabled = true;
      addButton.textContent = 'Adding…';
      try{
        const layer = await addTemplateToCanvas(state.activeTemplate);
        if(layer){
          updateStatus(`${state.activeTemplate.name} added to canvas`);
          closePanel();
        }
      }catch(error){
        console.error('Failed to add template to canvas', error);
        const message = typeof error?.message === 'string' && error.message.includes('Layer limit')
          ? 'Layer limit reached (9 max)'
          : 'Unable to add to canvas';
        updateStatus(message);
      }finally{
        addButton.disabled = false;
        addButton.textContent = previousLabel;
      }
    });
  }

  document.addEventListener('layers:count-changed', () => {
    updateAddButton();
  });

  return {
    open(){
      state.textTerm = '';
      state.selectedTags.clear();
      state.filtered = state.templates.slice();
      state.page = 1;
      state.activeTemplate = null;
      state.tags = collectGalleryTags(state.templates);
      state.matchAny = false;
      hideSuggestions();
      setTagsExpanded(false);
      updateControls();
      if(searchInput){
        searchInput.value = '';
        searchInput.placeholder = 'Search by name or #tag';
        searchInput.setAttribute('aria-label', 'Search by name or #tag');
      }
      renderTags();
      renderActiveTags();
      renderGalleryPage();
      updateAddButton();
    }
  };
}

/* ============================================================
   LAYER STATE + MANAGEMENT
   ============================================================ */

function clamp(value, min, max){
  return Math.min(Math.max(value, min), max);
}

function toHexColor(value){
  if(!colorCtx) return value || '#ffffff';
  try{
    colorCtx.clearRect(0, 0, 1, 1);
    colorCtx.fillStyle = value || '#ffffff';
    return colorCtx.fillStyle || '#ffffff';
  }catch(error){
    console.warn('Color conversion failed', error);
    return '#ffffff';
  }
}

function getDesignLayers(){
  return layerState.layers.filter(layer => !layer.isBase);
}

function getDesignLayerCount(){
  return getDesignLayers().length;
}

function canAddMoreLayers(){
  return getDesignLayerCount() < MAX_LAYER_SLOTS;
}

function updateLayerCountDisplay(){
  if(!layerCountEl) return;
  const used = getDesignLayerCount();
  layerCountEl.textContent = `(${used}/${MAX_LAYER_SLOTS} max)`;
  document.dispatchEvent(new CustomEvent('layers:count-changed', {
    detail: { used, max: MAX_LAYER_SLOTS }
  }));
}

function updateLayersPanelCollapsedHeight(){
  if(!layersPanelEl) return;
  let available = 320;
  if(viewToolbarEl && dropdownPanelsEl){
    const toolbarRect = viewToolbarEl.getBoundingClientRect();
    const panelsRect = dropdownPanelsEl.getBoundingClientRect();
    const delta = toolbarRect.bottom - panelsRect.top - 16;
    if(Number.isFinite(delta)){
      available = Math.max(260, delta);
    }
  }
  layersPanelEl.style.setProperty('--layers-collapsed-max', `${Math.round(available)}px`);
}

function setLayersPanelExpanded(expanded){
  if(!layersPanelEl) return;
  layersPanelExpanded = !!expanded;
  layersPanelEl.classList.toggle('is-expanded', layersPanelExpanded);
  if(layersExpandToggle){
    layersExpandToggle.setAttribute('aria-expanded', String(layersPanelExpanded));
    layersExpandToggle.setAttribute('aria-label', layersPanelExpanded ? 'Collapse layers panel' : 'Expand layers panel');
  }
}

function createLayerId(){
  const id = `layer-${layerState.idCounter++}`;
  return id;
}

function getLayerById(id){
  if(!id) return null;
  return layerState.layers.find(layer => layer.id === id) || null;
}

function generateLayerName(type){
  layerState.counters[type] = (layerState.counters[type] || 0) + 1;
  return `${type}-${layerState.counters[type]}`;
}

function ensureBaseLayer(){
  if(layerState.layers.length) return;
  const baseLayer = {
    id: layerState.baseLayerId,
    name: 'Product Base',
    type: 'Product',
    isBase: true,
    colorAttribute: 'fill',
    colorElement: productColorOverlay || null,
    fill: productColorOverlay ? productColorOverlay.getAttribute('fill') || '#ffffff' : '#ffffff'
  };
  layerState.layers.push(baseLayer);
  layerState.activeLayerId = baseLayer.id;
}

function syncLayerDomOrder(){
  if(!designLayersGroup) return;
  const fragment = document.createDocumentFragment();
  layerState.layers.forEach(layer => {
    if(layer.isBase || !layer.group) return;
    fragment.appendChild(layer.group);
  });
  designLayersGroup.appendChild(fragment);
}

function updateLayerTransform(layer){
  if(!layer || layer.isBase || !layer.group) return;
  layer.group.setAttribute('transform', `translate(${layer.cx} ${layer.cy}) rotate(${layer.rotation}) scale(${layer.scale})`);
}

function getSvgPoint(clientX, clientY){
  if(!sceneSvg || typeof sceneSvg.createSVGPoint !== 'function'){
    return { x: DESIGN_CENTER.x, y: DESIGN_CENTER.y };
  }
  const point = sceneSvg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const ctm = sceneSvg.getScreenCTM();
  if(!ctm){
    return { x: DESIGN_CENTER.x, y: DESIGN_CENTER.y };
  }
  const transformed = point.matrixTransform(ctm.inverse());
  return { x: transformed.x, y: transformed.y };
}

function getDesignPointer(event){
  const raw = getSvgPoint(event.clientX, event.clientY);
  return {
    x: raw.x,
    y: raw.y
  };
}

function updatePropertyInputsFromLayer(layer){
  if(!layer || layer.isBase) return;
  writePropertyValue('x', Math.round(layer.cx - DESIGN_CENTER.x));
  writePropertyValue('y', Math.round(layer.cy - DESIGN_CENTER.y));
  writePropertyValue('scale', Math.round(layer.scale * 100));
  writePropertyValue('rotation', Math.round(layer.rotation));
}

function updateActiveLayerHighlight(){
  const activeId = layerState.activeLayerId;
  layerState.layers.forEach(layer => {
    if(!layer || !layer.group) return;
    const isActive = layer.id === activeId;
    layer.group.classList.toggle('is-active', isActive);
    layer.group.setAttribute('aria-selected', String(isActive));
  });
}

function updateSelectionOverlay(){
  if(!selectionOverlay || !sceneSvg || !designAreaRect){
    return;
  }
  const activeSection = document.documentElement.getAttribute('data-active-section');
  if(activeSection !== 'customize' || !isEditActive()){
    selectionOverlay.hidden = true;
    return;
  }
  const layer = getActiveLayer();
  if(!layer || layer.isBase){
    selectionOverlay.hidden = true;
    return;
  }

  const areaRect = designAreaRect.getBoundingClientRect();
  const containerRect = sceneSvg.getBoundingClientRect();
  if(areaRect.width === 0 || areaRect.height === 0){
    selectionOverlay.hidden = true;
    return;
  }
  const scaleX = areaRect.width / DESIGN_BOUNDS.width;
  const scaleY = areaRect.height / DESIGN_BOUNDS.height;
  const widthPx = layer.width * layer.scale * scaleX;
  const heightPx = layer.height * layer.scale * scaleY;
  const centerX = areaRect.left + (layer.cx - DESIGN_BOUNDS.x) * scaleX;
  const centerY = areaRect.top + (layer.cy - DESIGN_BOUNDS.y) * scaleY;

  selectionOverlay.hidden = false;
  selectionOverlay.style.width = `${widthPx}px`;
  selectionOverlay.style.height = `${heightPx}px`;
  selectionOverlay.style.left = `${centerX - containerRect.left - widthPx / 2}px`;
  selectionOverlay.style.top = `${centerY - containerRect.top - heightPx / 2}px`;
  selectionOverlay.style.transformOrigin = 'center center';
  selectionOverlay.style.transform = `rotate(${layer.rotation}deg)`;

  if(selectionFrame){
    selectionFrame.style.borderRadius = layer.type === 'Text' ? '8px' : '12px';
  }
}

function startLayerInteraction(type, event){
  if(!isEditActive()) return;
  if(document.documentElement.getAttribute('data-active-section') !== 'customize') return;
  const layer = getActiveLayer();
  if(!layer || layer.isBase) return;
  event.preventDefault();
  event.stopPropagation();
  const pointer = getDesignPointer(event);
  interactionState.type = type;
  interactionState.pointerId = event.pointerId;
  interactionState.startPointer = pointer;
  interactionState.startLayer = { cx: layer.cx, cy: layer.cy, scale: layer.scale, rotation: layer.rotation };
  if(sceneSvg && typeof sceneSvg.setPointerCapture === 'function'){
    try{
      sceneSvg.setPointerCapture(event.pointerId);
    }catch(error){
      console.warn('Pointer capture failed', error);
    }
  }
}

function endLayerInteraction(event){
  if(!interactionState.type) return;
  if(event && interactionState.pointerId !== null && event.pointerId !== interactionState.pointerId){
    return;
  }
  if(sceneSvg && interactionState.pointerId !== null && typeof sceneSvg.releasePointerCapture === 'function'){
    try{
      sceneSvg.releasePointerCapture(interactionState.pointerId);
    }catch(error){
      // ignore release errors
    }
  }
  interactionState.type = null;
  interactionState.pointerId = null;
  interactionState.startPointer = null;
  interactionState.startLayer = null;
  updateSelectionOverlay();
  updatePropertiesPanel();
}

function updateLayerInteraction(event){
  if(!interactionState.type) return;
  if(interactionState.pointerId !== null && event.pointerId !== interactionState.pointerId) return;
  const layer = getActiveLayer();
  if(!layer || layer.isBase) return;
  const pointer = getDesignPointer(event);
  const startPointer = interactionState.startPointer;
  const startLayer = interactionState.startLayer;
  if(!startPointer || !startLayer) return;

  if(interactionState.type === 'move'){
    const dx = pointer.x - startPointer.x;
    const dy = pointer.y - startPointer.y;
    const xLimits = getAxisAbsoluteLimits('x');
    const yLimits = getAxisAbsoluteLimits('y');
    const nextCx = startLayer.cx + dx;
    const nextCy = startLayer.cy + dy;
    layer.cx = xLimits ? clamp(nextCx, xLimits.min, xLimits.max) : nextCx;
    layer.cy = yLimits ? clamp(nextCy, yLimits.min, yLimits.max) : nextCy;
  }else if(interactionState.type === 'scale'){
    const center = { x: startLayer.cx, y: startLayer.cy };
    const startDistance = Math.hypot(startPointer.x - center.x, startPointer.y - center.y) || 1;
    const currentDistance = Math.hypot(pointer.x - center.x, pointer.y - center.y) || 1;
    const ratio = currentDistance / startDistance;
    layer.scale = clamp(startLayer.scale * ratio, MIN_SCALE, MAX_SCALE);
  }else if(interactionState.type === 'rotate'){
    const center = { x: startLayer.cx, y: startLayer.cy };
    const startAngle = Math.atan2(startPointer.y - center.y, startPointer.x - center.x);
    const currentAngle = Math.atan2(pointer.y - center.y, pointer.x - center.x);
    const delta = (currentAngle - startAngle) * (180 / Math.PI);
    const rotation = startLayer.rotation + delta;
    layer.rotation = ((rotation % 360) + 360) % 360;
  }

  updateLayerTransform(layer);
  updateSelectionOverlay();
  updatePropertyInputsFromLayer(layer);
  updateColorPanel();
}
function renameLayer(layer){
  if(!layer || layer.isBase) return;
  if(typeof window === 'undefined' || typeof window.prompt !== 'function') return;
  const currentName = layer.name || '';
  const result = window.prompt('Rename layer', currentName);
  if(result === null) return;
  const trimmed = result.trim();
  if(!trimmed || trimmed === currentName) return;
  layer.name = trimmed;
  const active = getActiveLayer();
  if(active && active.id === layer.id && propertyInputs.name){
    propertyInputs.name.value = trimmed;
  }
  refreshLayerList();
  updateColorPanel();
}

function refreshLayerList(){
  if(!layerListEl) return;
  layerListEl.innerHTML = '';
  const fragment = document.createDocumentFragment();

  updateLayerCountDisplay();

  const baseLayer = layerState.layers.find(layer => layer.isBase) || null;
  const designLayers = getDesignLayers();
  const visibleLayers = designLayers.slice(-MAX_LAYER_SLOTS).reverse();

  function createIndexElement(label){
    const badge = document.createElement('div');
    badge.className = 'layer-index';
    badge.textContent = label;
    return badge;
  }

  function iconMarkup(name){
    switch(name){
      case 'properties':
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l3-1 12-12-2-2L4 18l-1 3z"/><path d="M14 4l2 2"/></svg>';
      case 'color':
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18h2a2.5 2.5 0 0 0 0-5h-1a3 3 0 0 1-3-3v-1a9 9 0 0 1 2-9Z"/><circle cx="7.5" cy="10.5" r="1.2"/><circle cx="9.5" cy="6.8" r="1.2"/><circle cx="14.5" cy="6.8" r="1.2"/><circle cx="16.5" cy="10.5" r="1.2"/></svg>';
      case 'up':
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5l-5 5"/><path d="M12 5l5 5"/><path d="M12 5v14"/></svg>';
      case 'down':
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l-5-5"/><path d="M12 19l5-5"/><path d="M12 5v14"/></svg>';
      case 'delete':
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12"/><path d="M6 18L18 6"/></svg>';
      default:
        return '';
    }
  }

  function createContentShell(nameText, options = {}){
    const { renameable = false } = options;
    const content = document.createElement('div');
    content.className = 'layer-content';
    const header = document.createElement('div');
    header.className = 'layer-header';
    let nameElement;
    if(renameable){
      nameElement = document.createElement('button');
      nameElement.type = 'button';
      nameElement.className = 'layer-name-button';
      nameElement.textContent = nameText;
      nameElement.setAttribute('aria-label', `Rename ${nameText}`);
    }else{
      nameElement = document.createElement('div');
      nameElement.className = 'layer-name-label';
      nameElement.textContent = nameText;
    }
    header.appendChild(nameElement);
    const actions = document.createElement('div');
    actions.className = 'layer-actions';
    content.append(header, actions);
    return { content, actions, nameElement };
  }

  function createActionButton(className, iconName, ariaLabel){
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `layer-action ${className}`;
    if(ariaLabel){
      button.setAttribute('aria-label', ariaLabel);
      button.title = ariaLabel;
    }
    const iconWrapper = document.createElement('span');
    iconWrapper.className = 'layer-action-icon';
    iconWrapper.innerHTML = iconMarkup(iconName);
    button.appendChild(iconWrapper);
    return button;
  }

  function appendPlaceholder(actions){
    const placeholder = document.createElement('span');
    placeholder.className = 'layer-action-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    actions.appendChild(placeholder);
  }

  if(baseLayer){
    const row = document.createElement('li');
    row.className = 'layer-row';
    row.dataset.layerId = baseLayer.id;
    row.dataset.layerType = baseLayer.type;
    row.dataset.layerSlot = 'base';
    if(baseLayer.id === layerState.activeLayerId){
      row.classList.add('is-active');
    }
    row.appendChild(createIndexElement('10'));
    const { content, actions } = createContentShell(baseLayer.name);

    appendPlaceholder(actions);

    const colorBtn = createActionButton('layer-color', 'color', 'Edit base color');
    colorBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      setActiveLayer(baseLayer.id);
      setColorTarget(baseLayer.id);
      openPanel('color');
    });
    actions.appendChild(colorBtn);

    appendPlaceholder(actions);
    appendPlaceholder(actions);
    appendPlaceholder(actions);

    row.appendChild(content);
    row.addEventListener('click', () => setActiveLayer(baseLayer.id));
    fragment.appendChild(row);
  }

  for(let slot = 0; slot < MAX_LAYER_SLOTS; slot += 1){
    const layer = visibleLayers[slot] || null;
    const slotNumber = slot + 1;
    const row = document.createElement('li');
    row.className = 'layer-row';
    row.dataset.layerSlot = String(slotNumber);
    row.appendChild(createIndexElement(String(slotNumber)));

    if(layer){
      row.dataset.layerId = layer.id;
      row.dataset.layerType = layer.type;
      row.title = `${layer.name} (${layer.type})`;
      if(layer.id === layerState.activeLayerId){
        row.classList.add('is-active');
      }

      const { content, actions, nameElement } = createContentShell(layer.name, { renameable: true });
      if(nameElement){
        nameElement.textContent = layer.name;
        nameElement.setAttribute('aria-label', `Rename ${layer.name}`);
        nameElement.addEventListener('click', (event) => {
          event.stopPropagation();
          renameLayer(layer);
        });
      }

      const propertiesBtn = createActionButton('layer-properties', 'properties', 'Edit properties');
      propertiesBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        setActiveLayer(layer.id, { openProperties: true });
      });
      actions.appendChild(propertiesBtn);

      const colorBtn = createActionButton('layer-color', 'color', 'Edit layer color');
      colorBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        setActiveLayer(layer.id);
        setColorTarget(layer.id);
        openPanel('color');
      });
      actions.appendChild(colorBtn);

      const moveUp = createActionButton('layer-move layer-move-up', 'up', 'Move layer forward');
      moveUp.addEventListener('click', (event) => {
        event.stopPropagation();
        moveLayer(layer.id, 1);
      });
      const moveDown = createActionButton('layer-move layer-move-down', 'down', 'Move layer backward');
      moveDown.addEventListener('click', (event) => {
        event.stopPropagation();
        moveLayer(layer.id, -1);
      });
      const designIndex = designLayers.indexOf(layer);
      moveUp.disabled = designIndex === designLayers.length - 1;
      moveDown.disabled = designIndex === 0;
      actions.appendChild(moveUp);
      actions.appendChild(moveDown);

      const deleteBtn = createActionButton('layer-delete', 'delete', 'Remove layer');
      deleteBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        deleteLayer(layer.id);
      });
      actions.appendChild(deleteBtn);

      row.appendChild(content);
      row.addEventListener('click', () => setActiveLayer(layer.id));
    }else{
      row.classList.add('is-empty');
      row.dataset.layerType = 'Empty';
      const { content, actions } = createContentShell('Empty slot');
      actions.classList.add('is-empty');
      const addGroup = document.createElement('div');
      addGroup.className = 'layer-add-group';

      function createAddButton(label, panelName){
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'layer-add';
        btn.textContent = `+ ${label}`;
        btn.setAttribute('aria-label', `Add ${label} to slot ${slotNumber}`);
        if(!canAddMoreLayers()){
          btn.disabled = true;
          btn.setAttribute('aria-disabled', 'true');
          btn.title = 'Layer limit reached (9 max)';
        }
        btn.addEventListener('click', (event) => {
          event.stopPropagation();
          layerState.pendingSlot = slotNumber;
          openPanel(panelName);
        });
        return btn;
      }

      addGroup.append(
        createAddButton('Design', 'designs'),
        createAddButton('Element', 'elements'),
        createAddButton('Text', 'text')
      );

      actions.appendChild(addGroup);
      row.appendChild(content);
      row.addEventListener('click', () => {
        layerState.pendingSlot = slotNumber;
      });
    }

    fragment.appendChild(row);
  }

  layerListEl.appendChild(fragment);
  syncLayerDomOrder();
  updateSelectionOverlay();
  updateActiveLayerHighlight();
}

function getActiveLayer(){
  return getLayerById(layerState.activeLayerId);
}

function setActiveLayer(id, options = {}){
  const layer = getLayerById(id);
  if(layer){
    layerState.activeLayerId = layer.id;
    colorPanelTargetId = layer.id;
  }
  refreshLayerList();
  updatePropertiesPanel();
  updateColorPanel();
  if(layer && layer.group && typeof layer.group.focus === 'function'){
    try{
      layer.group.focus({ preventScroll: true });
    }catch(error){
      layer.group.focus();
    }
  }
  if(options.openProperties){
    openPanel('properties');
  }
}

function setColorTarget(id){
  if(!id) return;
  const layer = getLayerById(id);
  if(layer){
    colorPanelTargetId = layer.id;
  }
}

function clampPropertyValue(key, value){
  const limits = PROPERTY_LIMITS[key];
  if(!limits) return value;
  return clamp(value, limits.min, limits.max);
}

function getAxisAbsoluteLimits(axis){
  const limits = PROPERTY_LIMITS[axis];
  if(!limits) return null;
  const center = axis === 'x' ? DESIGN_CENTER.x : DESIGN_CENTER.y;
  return {
    min: center + limits.min,
    max: center + limits.max
  };
}

function writePropertyValue(key, value, options = {}){
  if(typeof value === 'undefined' || value === null) return;
  let numeric = Number(value);
  if(Number.isNaN(numeric)) return;
  if(!options.skipClamp){
    numeric = clampPropertyValue(key, numeric);
  }
  numeric = Math.round(numeric);
  const slider = propertySliders[key];
  if(slider && !options.fromSlider){
    slider.value = String(numeric);
  }
  const input = propertyInputs[key];
  if(input && !options.fromInput){
    input.value = String(numeric);
  }
}

function resetPropertyControls(){
  Object.entries(PROPERTY_DEFAULTS).forEach(([key, defaultValue]) => {
    writePropertyValue(key, defaultValue, { skipClamp: true });
  });
}

function updatePropertiesPanel(){
  if(!propertyInputs.name) return;
  const layer = getActiveLayer();
  const hasLayer = !!layer && !layer.isBase;

  Object.entries(propertyInputs).forEach(([key, input]) => {
    if(!input) return;
    if(key === 'name'){
      input.disabled = !layer || !!(layer && layer.isBase);
    }else{
      input.disabled = !hasLayer;
    }
  });

  Object.values(propertySliders).forEach(slider => {
    if(!slider) return;
    slider.disabled = !hasLayer;
  });

  if(propertiesEmptyEl){
    if(!layer){
      propertiesEmptyEl.hidden = false;
      propertiesEmptyEl.textContent = 'Select a layer to adjust its properties.';
    }else if(layer.isBase){
      propertiesEmptyEl.hidden = false;
      propertiesEmptyEl.textContent = 'Product Base cannot be transformed. Use the Color panel to adjust its color.';
    }else{
      propertiesEmptyEl.hidden = true;
    }
  }

  if(!layer){
    if(textPropertiesFieldset){
      textPropertiesFieldset.hidden = true;
      textPropertiesFieldset.querySelectorAll('input, textarea, select').forEach(el => {
        el.disabled = true;
      });
    }
    if(propertyInputs.name) propertyInputs.name.value = '';
    if(propertyInputs.text) propertyInputs.text.value = '';
    resetPropertyControls();
    return;
  }

  if(propertyInputs.name) propertyInputs.name.value = layer.name;

  const isTextLayer = layer.type === 'Text';
  if(textPropertiesFieldset){
    const showTextControls = !layer.isBase && isTextLayer;
    textPropertiesFieldset.hidden = !showTextControls;
    textPropertiesFieldset.querySelectorAll('input, textarea, select').forEach(el => {
      el.disabled = !showTextControls;
    });
  }

  if(layer.isBase){
    resetPropertyControls();
    if(propertyInputs.text) propertyInputs.text.value = '';
    return;
  }

  const offsetX = Math.round(layer.cx - DESIGN_CENTER.x);
  const offsetY = Math.round(layer.cy - DESIGN_CENTER.y);
  writePropertyValue('x', offsetX);
  writePropertyValue('y', offsetY);
  writePropertyValue('scale', Math.round(layer.scale * 100));
  writePropertyValue('rotation', Math.round(layer.rotation));

  if(isTextLayer){
    if(propertyInputs.text) propertyInputs.text.value = layer.text || '';
    if(propertyInputs.font) propertyInputs.font.value = layer.fontFamily || propertyInputs.font.value;
    if(propertyInputs.fontSize) propertyInputs.fontSize.value = Math.round(layer.fontSize || 48);
    if(propertyInputs.bold) propertyInputs.bold.checked = (layer.fontWeight || 400) >= 600;
    if(propertyInputs.italic) propertyInputs.italic.checked = (layer.fontStyle || 'normal') === 'italic';
  }else{
    if(propertyInputs.text) propertyInputs.text.value = '';
  }
}

function getColorTargetLayer(){
  const activeTarget = getLayerById(colorPanelTargetId);
  if(activeTarget) return activeTarget;
  return getActiveLayer();
}

function updateColorPanel(){
  if(!layerColorInput) return;
  const layer = getColorTargetLayer();
  const hasLayer = !!layer;
  layerColorInput.disabled = !hasLayer;
  if(!hasLayer){
    if(colorPanelSubtitle) colorPanelSubtitle.textContent = 'Select a layer to edit its color.';
    return;
  }
  if(colorPanelSubtitle) colorPanelSubtitle.textContent = `Editing ${layer.name}`;
  const current = toHexColor(layer.fill || '#ffffff');
  layerColorInput.value = current;
}

function applyLayerColor(layer, color){
  if(!layer) return;
  const normalized = toHexColor(color);
  layer.fill = normalized;
  if(layer.isBase){
    if(productColorOverlay){
      productColorOverlay.setAttribute('fill', normalized);
    }
    return;
  }

  if(layer.type === 'Text' && layer.textElement){
    layer.textElement.setAttribute('fill', normalized);
    return;
  }

  const target = layer.colorElement || (layer.inner ? layer.inner.querySelector('*') : null);
  if(target){
    target.setAttribute(layer.colorAttribute || 'fill', normalized);
    layer.colorElement = target;
  }
}

async function createLayerFromTemplate(template){
  if(!template || !designLayersGroup) return null;
  if(!canAddMoreLayers()){
    layerState.pendingSlot = null;
    throw new Error('Layer limit reached');
  }
  const id = createLayerId();
  const outer = document.createElementNS(svgNS, 'g');
  outer.classList.add('layer');
  outer.dataset.layerId = id;
  outer.dataset.layerType = template.type;
  outer.setAttribute('tabindex', '0');

  const inner = document.createElementNS(svgNS, 'g');
  inner.classList.add('layer-inner');
  inner.setAttribute('transform', `translate(${-template.width / 2} ${-template.height / 2})`);
  outer.appendChild(inner);

  let colorElement = null;

  if(template.type === 'Text'){
    const textEl = document.createElementNS(svgNS, 'text');
    textEl.setAttribute('x', template.width / 2);
    textEl.setAttribute('y', template.height / 2);
    textEl.setAttribute('text-anchor', 'middle');
    textEl.setAttribute('dominant-baseline', 'middle');
    textEl.setAttribute('font-family', template.fontFamily || "'Montserrat', sans-serif");
    textEl.setAttribute('font-size', template.fontSize || 48);
    textEl.setAttribute('font-weight', template.fontWeight || 600);
    textEl.setAttribute('font-style', template.fontStyle || 'normal');
    textEl.setAttribute('fill', template.fill || '#ffffff');
    textEl.textContent = template.text || 'Text';
    inner.appendChild(textEl);
    colorElement = textEl;
  }else{
    try{
      const result = await template.createContent(inner);
      colorElement = result?.colorElement || null;
    }catch(error){
      console.error('Failed to create SVG content', error);
      return null;
    }
  }

  designLayersGroup.appendChild(outer);

  const layer = {
    id,
    name: generateLayerName(template.type),
    type: template.type,
    group: outer,
    inner,
    width: template.width,
    height: template.height,
    cx: DESIGN_CENTER.x,
    cy: DESIGN_CENTER.y,
    scale: 1,
    rotation: 0,
    colorAttribute: template.colorAttribute || 'fill',
    colorElement,
    fill: template.fill || template.baseColor || '#ffffff'
  };

  if(template.type === 'Text'){
    layer.text = template.text || '';
    layer.fontFamily = template.fontFamily || "'Montserrat', sans-serif";
    layer.fontSize = template.fontSize || 48;
    layer.fontWeight = template.fontWeight || 600;
    layer.fontStyle = template.fontStyle || 'normal';
    layer.textElement = colorElement;
  }

  if(colorElement && !template.baseColor && !template.fill && !template.accentColor){
    const attr = layer.colorAttribute || 'fill';
    const attrValue = colorElement.getAttribute(attr) || '#ffffff';
    layer.fill = toHexColor(attrValue);
  }

  if(colorElement){
    colorElement.setAttribute(layer.colorAttribute || 'fill', layer.fill);
  }

  const designLayers = getDesignLayers();
  let insertIndex = layerState.layers.length;
  if(typeof layerState.pendingSlot === 'number'){
    const slotPosition = Math.max(0, Math.min(MAX_LAYER_SLOTS - 1, layerState.pendingSlot - 1));
    const currentLength = designLayers.length;
    const indexFromBottom = clamp(currentLength - slotPosition, 0, currentLength);
    insertIndex = 1 + indexFromBottom;
  }
  layerState.pendingSlot = null;
  layerState.layers.splice(insertIndex, 0, layer);
  layerState.activeLayerId = layer.id;
  updateLayerTransform(layer);
  refreshLayerList();
  return layer;
}

function moveLayer(id, direction){
  const index = layerState.layers.findIndex(layer => layer.id === id);
  if(index <= 0) return; // base layer is index 0
  const targetIndex = index + direction;
  if(targetIndex <= 0 || targetIndex >= layerState.layers.length) return;
  const [layer] = layerState.layers.splice(index, 1);
  layerState.layers.splice(targetIndex, 0, layer);
  refreshLayerList();
  updateSelectionOverlay();
}

function deleteLayer(id){
  const layer = getLayerById(id);
  if(!layer || layer.isBase) return;
  if(layer.group && layer.group.parentNode){
    layer.group.parentNode.removeChild(layer.group);
  }
  const index = layerState.layers.findIndex(l => l.id === id);
  if(index >= 0){
    layerState.layers.splice(index, 1);
  }
  if(layerState.activeLayerId === id){
    const fallback = layerState.layers[layerState.layers.length - 1] || null;
    layerState.activeLayerId = fallback ? fallback.id : null;
  }
  if(colorPanelTargetId === id){
    colorPanelTargetId = layerState.activeLayerId;
  }
  refreshLayerList();
  updatePropertiesPanel();
  updateColorPanel();
  updateSelectionOverlay();
}

async function addTemplateToCanvas(template){
  if(!canAddMoreLayers()){
    throw new Error('Layer limit reached');
  }
  const layer = await createLayerFromTemplate(template);
  if(layer){
    setActiveLayer(layer.id);
    setColorTarget(layer.id);
  }
  return layer;
}

function handleNameChange(){
  const layer = getActiveLayer();
  if(!layer || layer.isBase || !propertyInputs.name) return;
  const next = propertyInputs.name.value.trim();
  if(!next) return;
  layer.name = next;
  refreshLayerList();
  updateColorPanel();
}

function applyOffset(axis, rawValue){
  const layer = getActiveLayer();
  if(!layer || layer.isBase) return;
  const value = Number(rawValue);
  if(Number.isNaN(value)) return;
  const limits = PROPERTY_LIMITS[axis] || null;
  const clampedOffset = limits ? clamp(value, limits.min, limits.max) : value;
  if(axis === 'x'){
    layer.cx = DESIGN_CENTER.x + clampedOffset;
  }else{
    layer.cy = DESIGN_CENTER.y + clampedOffset;
  }
  updateLayerTransform(layer);
  updateSelectionOverlay();
  updatePropertyInputsFromLayer(layer);
}

function applyScale(rawValue){
  const layer = getActiveLayer();
  if(!layer || layer.isBase) return;
  const value = Number(rawValue);
  if(Number.isNaN(value)) return;
  const limits = PROPERTY_LIMITS.scale;
  const clamped = limits ? clamp(value, limits.min, limits.max) : value;
  layer.scale = clamp(clamped / 100, MIN_SCALE, MAX_SCALE);
  updateLayerTransform(layer);
  updateSelectionOverlay();
  updatePropertyInputsFromLayer(layer);
}

function applyRotation(rawValue){
  const layer = getActiveLayer();
  if(!layer || layer.isBase) return;
  const value = Number(rawValue);
  if(Number.isNaN(value)) return;
  const normalized = ((value % 360) + 360) % 360;
  const limits = PROPERTY_LIMITS.rotation;
  const clamped = limits ? clamp(normalized, limits.min, limits.max) : normalized;
  layer.rotation = clamped;
  updateLayerTransform(layer);
  updateSelectionOverlay();
  updatePropertyInputsFromLayer(layer);
}

function applyTextProperties(updates){
  const layer = getActiveLayer();
  if(!layer || layer.type !== 'Text' || !layer.textElement) return;
  if(typeof updates.text === 'string'){
    layer.text = updates.text;
    layer.textElement.textContent = updates.text;
  }
  if(typeof updates.fontFamily === 'string'){
    layer.fontFamily = updates.fontFamily;
    layer.textElement.setAttribute('font-family', updates.fontFamily);
  }
  if(typeof updates.fontSize === 'number' && !Number.isNaN(updates.fontSize)){
    layer.fontSize = updates.fontSize;
    layer.textElement.setAttribute('font-size', updates.fontSize);
  }
  if(typeof updates.fontWeight !== 'undefined'){
    layer.fontWeight = updates.fontWeight;
    layer.textElement.setAttribute('font-weight', updates.fontWeight);
  }
  if(typeof updates.fontStyle === 'string'){
    layer.fontStyle = updates.fontStyle;
    layer.textElement.setAttribute('font-style', updates.fontStyle);
  }
}

if(propertyInputs.name){
  propertyInputs.name.addEventListener('change', handleNameChange);
}

if(propertyInputs.x){
  propertyInputs.x.addEventListener('change', () => applyOffset('x', propertyInputs.x.value));
}

if(propertySliders.x){
  propertySliders.x.addEventListener('input', () => applyOffset('x', propertySliders.x.value));
}

if(propertyInputs.y){
  propertyInputs.y.addEventListener('change', () => applyOffset('y', propertyInputs.y.value));
}

if(propertySliders.y){
  propertySliders.y.addEventListener('input', () => applyOffset('y', propertySliders.y.value));
}

if(propertyInputs.scale){
  propertyInputs.scale.addEventListener('change', () => applyScale(propertyInputs.scale.value));
}

if(propertySliders.scale){
  propertySliders.scale.addEventListener('input', () => applyScale(propertySliders.scale.value));
}

if(propertyInputs.rotation){
  propertyInputs.rotation.addEventListener('change', () => applyRotation(propertyInputs.rotation.value));
}

if(propertySliders.rotation){
  propertySliders.rotation.addEventListener('input', () => applyRotation(propertySliders.rotation.value));
}

if(propertyInputs.text){
  propertyInputs.text.addEventListener('input', () => applyTextProperties({ text: propertyInputs.text.value }));
}

if(propertyInputs.font){
  propertyInputs.font.addEventListener('change', () => applyTextProperties({ fontFamily: propertyInputs.font.value }));
}

if(propertyInputs.fontSize){
  propertyInputs.fontSize.addEventListener('change', () => applyTextProperties({ fontSize: Number(propertyInputs.fontSize.value) }));
}

if(propertyInputs.bold){
  propertyInputs.bold.addEventListener('change', () => applyTextProperties({ fontWeight: propertyInputs.bold.checked ? 700 : 400 }));
}

if(propertyInputs.italic){
  propertyInputs.italic.addEventListener('change', () => applyTextProperties({ fontStyle: propertyInputs.italic.checked ? 'italic' : 'normal' }));
}

if(layerColorInput){
  layerColorInput.addEventListener('input', () => {
    const layer = getColorTargetLayer();
    if(!layer) return;
    applyLayerColor(layer, layerColorInput.value);
  });
}

colorSwatches.forEach(btn => {
  const color = btn.getAttribute('data-color');
  if(color){
    btn.style.setProperty('--swatch-color', color);
    btn.addEventListener('click', () => {
      const layer = getColorTargetLayer();
      if(!layer) return;
      applyLayerColor(layer, color);
      if(layerColorInput){
        layerColorInput.value = toHexColor(color);
      }
      updateColorPanel();
    });
  }
});

if(selectionFrame){
  selectionFrame.addEventListener('pointerdown', (event) => {
    if(!isEditActive()) return;
    startLayerInteraction('move', event);
  });
}

selectionHandles.forEach(handle => {
  handle.addEventListener('pointerdown', (event) => {
    if(!isEditActive()) return;
    startLayerInteraction('scale', event);
  });
});

if(selectionRotateHandle){
  selectionRotateHandle.addEventListener('pointerdown', (event) => {
    if(!isEditActive()) return;
    startLayerInteraction('rotate', event);
  });
}

if(layersExpandToggle){
  layersExpandToggle.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    setLayersPanelExpanded(!layersPanelExpanded);
  });
}

if(sceneSvg){
  sceneSvg.addEventListener('pointermove', updateLayerInteraction);
  sceneSvg.addEventListener('pointerup', endLayerInteraction);
  sceneSvg.addEventListener('pointercancel', endLayerInteraction);
  sceneSvg.addEventListener('pointerleave', (event) => {
    if(interactionState.type === 'move'){
      endLayerInteraction(event);
    }
  });
}

window.addEventListener('resize', () => {
  updateSelectionOverlay();
  updateLayersPanelCollapsedHeight();
});

updateLayersPanelCollapsedHeight();
setLayersPanelExpanded(false);

if(designLayersGroup){
  designLayersGroup.addEventListener('pointerdown', (event) => {
    const group = event.target.closest('.layer');
    if(!group) return;
    const { layerId } = group.dataset;
    if(layerId){
      setActiveLayer(layerId);
      if(isEditActive()){
        startLayerInteraction('move', event);
      }
    }
  });
}

const designTemplates = [
  createSvgTemplate('Design', {
    key: 'solar-burst',
    name: 'Solar Burst',
    tags: ['sun', 'bright', 'energy'],
    width: 240,
    height: 240,
    assetPath: 'assets/img/svg_designs/solar_burst.svg',
    baseColor: '#ffb545'
  }),
  createSvgTemplate('Design', {
    key: 'mountain-peaks',
    name: 'Mountain Peaks',
    tags: ['nature', 'mountain', 'outdoor'],
    width: 240,
    height: 220,
    assetPath: 'assets/img/svg_designs/mountain_peaks.svg',
    baseColor: '#3a556a'
  }),
  createSvgTemplate('Design', {
    key: 'ocean-swirl',
    name: 'Ocean Swirl',
    tags: ['water', 'wave', 'calm'],
    width: 240,
    height: 220,
    assetPath: 'assets/img/svg_designs/ocean_swirl.svg',
    baseColor: '#4d8dff'
  }),
  createSvgTemplate('Design', {
    key: 'retro-sunrise',
    name: 'Retro Sunrise',
    tags: ['sunset', 'retro', 'gradient'],
    width: 240,
    height: 240,
    assetPath: 'assets/img/svg_designs/retro_sunrise.svg',
    baseColor: '#ff6b6b'
  }),
  createSvgTemplate('Design', {
    key: 'botanical-wreath',
    name: 'Botanical Wreath',
    tags: ['floral', 'organic', 'frame'],
    width: 240,
    height: 240,
    assetPath: 'assets/img/svg_designs/botanical_wreath.svg',
    baseColor: '#4caf50'
  }),
  createSvgTemplate('Design', {
    key: 'galactic-orbit',
    name: 'Galactic Orbit',
    tags: ['space', 'cosmic', 'orbit'],
    width: 240,
    height: 240,
    assetPath: 'assets/img/svg_designs/galactic_orbit.svg',
    baseColor: '#7c5cff'
  }),
  createSvgTemplate('Design', {
    key: 'urban-grid',
    name: 'Urban Grid',
    tags: ['city', 'lines', 'modern'],
    width: 240,
    height: 240,
    assetPath: 'assets/img/svg_designs/urban_grid.svg',
    baseColor: '#9aa5b1'
  }),
  createSvgTemplate('Design', {
    key: 'wild-wave',
    name: 'Wild Wave',
    tags: ['ocean', 'flow', 'dynamic'],
    width: 240,
    height: 220,
    assetPath: 'assets/img/svg_designs/wild_wave.svg',
    baseColor: '#0099c6'
  }),
  createSvgTemplate('Design', {
    key: 'crystal-facet',
    name: 'Crystal Facet',
    tags: ['geometric', 'crystal', 'sharp'],
    width: 240,
    height: 240,
    assetPath: 'assets/img/svg_designs/crystal_facet.svg',
    baseColor: '#58a6ff'
  }),
  createSvgTemplate('Design', {
    key: 'paint-strokes',
    name: 'Paint Strokes',
    tags: ['art', 'brush', 'abstract'],
    width: 240,
    height: 220,
    assetPath: 'assets/img/svg_designs/paint_strokes.svg',
    baseColor: '#ff8a65'
  }),
  createSvgTemplate('Design', {
    key: 'festival-mask',
    name: 'Festival Mask',
    tags: ['mask', 'festival', 'bold'],
    width: 240,
    height: 240,
    assetPath: 'assets/img/svg_designs/festival_mask.svg',
    baseColor: '#ff6f91'
  }),
  createSvgTemplate('Design', {
    key: 'feather-plume',
    name: 'Feather Plume',
    tags: ['feather', 'soft', 'organic'],
    width: 240,
    height: 240,
    assetPath: 'assets/img/svg_designs/feather_plume.svg',
    baseColor: '#7db9a6'
  }),
  createSvgTemplate('Design', {
    key: 'forest-emblem',
    name: 'Forest Emblem',
    tags: ['forest', 'badge', 'adventure'],
    width: 240,
    height: 240,
    assetPath: 'assets/img/svg_designs/forest_emblem.svg',
    baseColor: '#2f6f4e'
  }),
  createSvgTemplate('Design', {
    key: 'winged-badge',
    name: 'Winged Badge',
    tags: ['badge', 'wing', 'retro'],
    width: 240,
    height: 160,
    assetPath: 'assets/img/svg_designs/winged_badge.svg',
    baseColor: '#f4a259'
  }),
  createSvgTemplate('Design', {
    key: 'cosmic-flow',
    name: 'Cosmic Flow',
    tags: ['space', 'fluid', 'dreamy'],
    width: 240,
    height: 220,
    assetPath: 'assets/img/svg_designs/cosmic_flow.svg',
    baseColor: '#8a4fff'
  }),
  createSvgTemplate('Design', {
    key: 'desert-dunes',
    name: 'Desert Dunes',
    tags: ['desert', 'sunset', 'warm'],
    width: 240,
    height: 220,
    assetPath: 'assets/img/svg_designs/desert_dunes.svg',
    baseColor: '#ffb86c'
  }),
  createSvgTemplate('Design', {
    key: 'aurora-ribbon',
    name: 'Aurora Ribbon',
    tags: ['aurora', 'gradient', 'night'],
    width: 240,
    height: 240,
    assetPath: 'assets/img/svg_designs/aurora_ribbon.svg',
    baseColor: '#68d391'
  }),
  createSvgTemplate('Design', {
    key: 'kaleidoscope',
    name: 'Kaleidoscope',
    tags: ['pattern', 'colorful', 'geometric'],
    width: 240,
    height: 240,
    assetPath: 'assets/img/svg_designs/kaleidoscope.svg',
    baseColor: '#f87171'
  }),
  createSvgTemplate('Design', {
    key: 'stargazer',
    name: 'Stargazer',
    tags: ['stars', 'cosmic', 'night'],
    width: 240,
    height: 240,
    assetPath: 'assets/img/svg_designs/stargazer.svg',
    baseColor: '#60a5fa'
  }),
  createSvgTemplate('Design', {
    key: 'floral-mandala',
    name: 'Floral Mandala',
    tags: ['mandala', 'floral', 'intricate'],
    width: 240,
    height: 240,
    assetPath: 'assets/img/svg_designs/floral_mandala.svg',
    baseColor: '#ef6c9c'
  })
];

const elementTemplates = [
  createSvgTemplate('Element', {
    key: 'sparkle-star',
    name: 'Sparkle Star',
    tags: ['sparkle', 'highlight', 'accent'],
    width: 140,
    height: 140,
    assetPath: 'assets/img/svg_elements/sparkle_star.svg',
    baseColor: '#f9f871'
  }),
  createSvgTemplate('Element', {
    key: 'orbit-ring',
    name: 'Orbit Ring',
    tags: ['orbit', 'outline', 'accent'],
    width: 180,
    height: 120,
    assetPath: 'assets/img/svg_elements/orbit_ring.svg',
    colorAttribute: 'stroke',
    baseColor: '#7c5cff'
  }),
  createSvgTemplate('Element', {
    key: 'heart-shine',
    name: 'Heart Shine',
    tags: ['love', 'romantic', 'accent'],
    width: 160,
    height: 140,
    assetPath: 'assets/img/svg_elements/heart_shine.svg',
    baseColor: '#ff4d6d'
  }),
  createSvgTemplate('Element', {
    key: 'bolt-arrow',
    name: 'Bolt Arrow',
    tags: ['arrow', 'energy', 'bold'],
    width: 180,
    height: 120,
    assetPath: 'assets/img/svg_elements/bolt_arrow.svg',
    baseColor: '#ffd166'
  }),
  createSvgTemplate('Element', {
    key: 'brush-swash',
    name: 'Brush Swash',
    tags: ['brush', 'stroke', 'organic'],
    width: 200,
    height: 120,
    assetPath: 'assets/img/svg_elements/brush_swash.svg',
    baseColor: '#ff7b9c'
  }),
  createSvgTemplate('Element', {
    key: 'badge-shield',
    name: 'Badge Shield',
    tags: ['badge', 'shield', 'solid'],
    width: 180,
    height: 200,
    assetPath: 'assets/img/svg_elements/badge_shield.svg',
    baseColor: '#4f46e5'
  }),
  createSvgTemplate('Element', {
    key: 'leaf-branch',
    name: 'Leaf Branch',
    tags: ['nature', 'leaf', 'organic'],
    width: 200,
    height: 120,
    assetPath: 'assets/img/svg_elements/leaf_branch.svg',
    baseColor: '#38a169'
  }),
  createSvgTemplate('Element', {
    key: 'geo-triangle',
    name: 'Geo Triangle',
    tags: ['geometric', 'triangle', 'minimal'],
    width: 160,
    height: 160,
    assetPath: 'assets/img/svg_elements/geo_triangle.svg',
    baseColor: '#60a5fa'
  }),
  createSvgTemplate('Element', {
    key: 'twinkle',
    name: 'Twinkle',
    tags: ['sparkle', 'star', 'tiny'],
    width: 140,
    height: 140,
    assetPath: 'assets/img/svg_elements/twinkle.svg',
    baseColor: '#fde68a'
  }),
  createSvgTemplate('Element', {
    key: 'bubble-cluster',
    name: 'Bubble Cluster',
    tags: ['bubble', 'soft', 'playful'],
    width: 180,
    height: 140,
    assetPath: 'assets/img/svg_elements/bubble_cluster.svg',
    baseColor: '#9ae6b4'
  }),
  createSvgTemplate('Element', {
    key: 'paint-drop',
    name: 'Paint Drop',
    tags: ['paint', 'drop', 'drip'],
    width: 160,
    height: 180,
    assetPath: 'assets/img/svg_elements/paint_drop.svg',
    baseColor: '#f472b6'
  }),
  createSvgTemplate('Element', {
    key: 'glow-circle',
    name: 'Glow Circle',
    tags: ['glow', 'circle', 'halo'],
    width: 160,
    height: 160,
    assetPath: 'assets/img/svg_elements/glow_circle.svg',
    baseColor: '#fbbf24'
  }),
  createSvgTemplate('Element', {
    key: 'ribbon-banner',
    name: 'Ribbon Banner',
    tags: ['banner', 'ribbon', 'label'],
    width: 220,
    height: 140,
    assetPath: 'assets/img/svg_elements/ribbon_banner.svg',
    baseColor: '#f97316'
  }),
  createSvgTemplate('Element', {
    key: 'scribble-loop',
    name: 'Scribble Loop',
    tags: ['scribble', 'sketch', 'playful'],
    width: 200,
    height: 140,
    assetPath: 'assets/img/svg_elements/scribble_loop.svg',
    colorAttribute: 'stroke',
    baseColor: '#f472b6'
  }),
  createSvgTemplate('Element', {
    key: 'wing-accent',
    name: 'Wing Accent',
    tags: ['wing', 'feather', 'motion'],
    width: 200,
    height: 140,
    assetPath: 'assets/img/svg_elements/wing_accent.svg',
    baseColor: '#93c5fd'
  }),
  createSvgTemplate('Element', {
    key: 'royal-crown',
    name: 'Royal Crown',
    tags: ['crown', 'royal', 'badge'],
    width: 180,
    height: 140,
    assetPath: 'assets/img/svg_elements/royal_crown.svg',
    baseColor: '#facc15'
  }),
  createSvgTemplate('Element', {
    key: 'burst-star',
    name: 'Burst Star',
    tags: ['burst', 'star', 'impact'],
    width: 160,
    height: 160,
    assetPath: 'assets/img/svg_elements/burst_star.svg',
    baseColor: '#fb7185'
  }),
  createSvgTemplate('Element', {
    key: 'diamond-prism',
    name: 'Diamond Prism',
    tags: ['diamond', 'gem', 'shine'],
    width: 160,
    height: 180,
    assetPath: 'assets/img/svg_elements/diamond_prism.svg',
    baseColor: '#34d399'
  }),
  createSvgTemplate('Element', {
    key: 'hex-tile',
    name: 'Hex Tile',
    tags: ['hexagon', 'tile', 'pattern'],
    width: 160,
    height: 160,
    assetPath: 'assets/img/svg_elements/hex_tile.svg',
    baseColor: '#818cf8'
  }),
  createSvgTemplate('Element', {
    key: 'underline-swish',
    name: 'Underline Swish',
    tags: ['underline', 'swish', 'accent'],
    width: 200,
    height: 120,
    assetPath: 'assets/img/svg_elements/underline_swish.svg',
    colorAttribute: 'stroke',
    baseColor: '#f59e0b'
  })
];

const textTemplates = [
  createTextTemplate({
    key: 'dream-big',
    name: 'Dream Big',
    tags: ['motivational', 'bold'],
    width: 220,
    height: 120,
    previewAsset: 'assets/img/svg_text/dream_big.svg',
    text: 'Dream Big',
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 48,
    fontWeight: 700,
    fill: '#ff6b6b'
  }),
  createTextTemplate({
    key: 'stay-wild',
    name: 'Stay Wild',
    tags: ['adventure', 'script'],
    width: 220,
    height: 120,
    previewAsset: 'assets/img/svg_text/stay_wild.svg',
    text: 'Stay Wild',
    fontFamily: "'Pacifico', cursive",
    fontSize: 44,
    fontWeight: 600,
    fill: '#2dd4bf'
  }),
  createTextTemplate({
    key: 'be-kind',
    name: 'Be Kind',
    tags: ['kindness', 'rounded'],
    width: 200,
    height: 110,
    previewAsset: 'assets/img/svg_text/be_kind.svg',
    text: 'Be Kind',
    fontFamily: "'Baloo 2', cursive",
    fontSize: 50,
    fontWeight: 700,
    fill: '#facc15'
  }),
  createTextTemplate({
    key: 'shine-on',
    name: 'Shine On',
    tags: ['shine', 'script'],
    width: 220,
    height: 120,
    previewAsset: 'assets/img/svg_text/shine_on.svg',
    text: 'Shine On',
    fontFamily: "'Great Vibes', cursive",
    fontSize: 52,
    fontWeight: 600,
    fill: '#fbbf24'
  }),
  createTextTemplate({
    key: 'bold-moves',
    name: 'Bold Moves',
    tags: ['bold', 'stacked'],
    width: 220,
    height: 140,
    previewAsset: 'assets/img/svg_text/bold_moves.svg',
    text: 'Bold\nMoves',
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 60,
    fontWeight: 700,
    fill: '#f97316'
  }),
  createTextTemplate({
    key: 'good-vibes',
    name: 'Good Vibes',
    tags: ['retro', 'sunset'],
    width: 220,
    height: 120,
    previewAsset: 'assets/img/svg_text/good_vibes.svg',
    text: 'Good Vibes',
    fontFamily: "'Fredoka One', cursive",
    fontSize: 48,
    fontWeight: 700,
    fill: '#60a5fa'
  }),
  createTextTemplate({
    key: 'chill-mode',
    name: 'Chill Mode',
    tags: ['casual', 'script'],
    width: 220,
    height: 120,
    previewAsset: 'assets/img/svg_text/chill_mode.svg',
    text: 'Chill Mode',
    fontFamily: "'Lobster', cursive",
    fontSize: 46,
    fontWeight: 600,
    fill: '#38bdf8'
  }),
  createTextTemplate({
    key: 'rise-up',
    name: 'Rise Up',
    tags: ['inspire', 'block'],
    width: 200,
    height: 120,
    previewAsset: 'assets/img/svg_text/rise_up.svg',
    text: 'Rise Up',
    fontFamily: "'Oswald', sans-serif",
    fontSize: 58,
    fontWeight: 700,
    fill: '#fb7185'
  }),
  createTextTemplate({
    key: 'sun-chaser',
    name: 'Sun Chaser',
    tags: ['sun', 'script'],
    width: 220,
    height: 120,
    previewAsset: 'assets/img/svg_text/sun_chaser.svg',
    text: 'Sun Chaser',
    fontFamily: "'Sacramento', cursive",
    fontSize: 52,
    fontWeight: 600,
    fill: '#f59e0b'
  }),
  createTextTemplate({
    key: 'wander-more',
    name: 'Wander More',
    tags: ['travel', 'sans'],
    width: 220,
    height: 120,
    previewAsset: 'assets/img/svg_text/wander_more.svg',
    text: 'Wander More',
    fontFamily: "'Raleway', sans-serif",
    fontSize: 42,
    fontWeight: 700,
    fill: '#22d3ee'
  }),
  createTextTemplate({
    key: 'love-wins',
    name: 'Love Wins',
    tags: ['love', 'script'],
    width: 200,
    height: 110,
    previewAsset: 'assets/img/svg_text/love_wins.svg',
    text: 'Love Wins',
    fontFamily: "'Dancing Script', cursive",
    fontSize: 48,
    fontWeight: 600,
    fill: '#fb7185'
  }),
  createTextTemplate({
    key: 'brave-soul',
    name: 'Brave Soul',
    tags: ['brave', 'block'],
    width: 220,
    height: 120,
    previewAsset: 'assets/img/svg_text/brave_soul.svg',
    text: 'Brave Soul',
    fontFamily: "'Anton', sans-serif",
    fontSize: 56,
    fontWeight: 700,
    fill: '#6366f1'
  }),
  createTextTemplate({
    key: 'make-waves',
    name: 'Make Waves',
    tags: ['ocean', 'script'],
    width: 220,
    height: 120,
    previewAsset: 'assets/img/svg_text/make_waves.svg',
    text: 'Make Waves',
    fontFamily: "'Satisfy', cursive",
    fontSize: 50,
    fontWeight: 600,
    fill: '#0ea5e9'
  }),
  createTextTemplate({
    key: 'keep-going',
    name: 'Keep Going',
    tags: ['motivational', 'rounded'],
    width: 220,
    height: 120,
    previewAsset: 'assets/img/svg_text/keep_going.svg',
    text: 'Keep Going',
    fontFamily: "'Nunito', sans-serif",
    fontSize: 46,
    fontWeight: 800,
    fill: '#14b8a6'
  }),
  createTextTemplate({
    key: 'just-create',
    name: 'Just Create',
    tags: ['creative', 'script'],
    width: 220,
    height: 120,
    previewAsset: 'assets/img/svg_text/just_create.svg',
    text: 'Just Create',
    fontFamily: "'Courgette', cursive",
    fontSize: 48,
    fontWeight: 600,
    fill: '#f472b6'
  }),
  createTextTemplate({
    key: 'think-big',
    name: 'Think Big',
    tags: ['bold', 'block'],
    width: 200,
    height: 120,
    previewAsset: 'assets/img/svg_text/think_big.svg',
    text: 'Think Big',
    fontFamily: "'Exo 2', sans-serif",
    fontSize: 54,
    fontWeight: 700,
    fill: '#f97316'
  }),
  createTextTemplate({
    key: 'stay-cozy',
    name: 'Stay Cozy',
    tags: ['comfort', 'script'],
    width: 200,
    height: 110,
    previewAsset: 'assets/img/svg_text/stay_cozy.svg',
    text: 'Stay Cozy',
    fontFamily: "'Cookie', cursive",
    fontSize: 50,
    fontWeight: 600,
    fill: '#fb923c'
  }),
  createTextTemplate({
    key: 'fresh-start',
    name: 'Fresh Start',
    tags: ['fresh', 'sans'],
    width: 220,
    height: 120,
    previewAsset: 'assets/img/svg_text/fresh_start.svg',
    text: 'Fresh Start',
    fontFamily: "'Poppins', sans-serif",
    fontSize: 48,
    fontWeight: 700,
    fill: '#84cc16'
  }),
  createTextTemplate({
    key: 'wild-heart',
    name: 'Wild Heart',
    tags: ['wild', 'script'],
    width: 220,
    height: 120,
    previewAsset: 'assets/img/svg_text/wild_heart.svg',
    text: 'Wild Heart',
    fontFamily: "'Allura', cursive",
    fontSize: 54,
    fontWeight: 600,
    fill: '#f472b6'
  }),
  createTextTemplate({
    key: 'night-owl',
    name: 'Night Owl',
    tags: ['night', 'rounded'],
    width: 200,
    height: 120,
    previewAsset: 'assets/img/svg_text/night_owl.svg',
    text: 'Night Owl',
    fontFamily: "'Rubik', sans-serif",
    fontSize: 50,
    fontWeight: 700,
    fill: '#6366f1'
  })
];

const galleryTemplate = document.getElementById('gallery-item-template');
if(galleryTemplate){
  document.querySelectorAll('.panel--gallery').forEach(panel => {
    const panelName = panel.dataset.panel;
    const type = panel.dataset.galleryType;
    let templates = [];
    if(type === 'design') templates = designTemplates;
    else if(type === 'element') templates = elementTemplates;
    else if(type === 'text') templates = textTemplates;
    if(!templates.length || !panelName) return;
    const controller = createGalleryController(panel, type, templates, galleryTemplate);
    if(controller){
      galleryControllers.set(panelName, controller);
    }
  });
}

/* ============================================================
   IMAGE STAGE (SVG): front/back + preview/edit viewBox + overlays
   ============================================================ */
const svg = document.getElementById('sceneSvg');
const raster = document.getElementById('raster');
const frontURL = raster ? raster.getAttribute('data-front-src') : '';
const backURL  = raster ? raster.getAttribute('data-back-src')  : '';
function applyImageForSide(side){
  if(!raster) return;
  const url = side === 'back' ? backURL : frontURL;
  if(url){ raster.setAttribute('href', url); raster.setAttribute('xlink:href', url); }
}

const VIEWBOX_PREVIEW = { x:0, y:0, w:1155, h:1155 };
const DESIGN_RECT     = { x:361, y:180, w:440, h:583 };
const IMAGE_BOUNDS    = { x:0, y:0, w:1155, h:1155 };
const PADDING_RATIO   = 0.05;
function clampRect(rect,b){
  let {x,y,w,h} = rect;
  if(w>b.w) w=b.w; if(h>b.h) h=b.h;
  if(x<b.x) x=b.x; if(y<b.y) y=b.y;
  if(x+w>b.x+b.w) x=b.x+b.w-w;
  if(y+h>b.y+b.h) y=b.y+b.h-h;
  return {x,y,w,h};
}
function expandRect(r){
  const padX = r.w * PADDING_RATIO;
  const padY = r.h * PADDING_RATIO;
  return clampRect({ x:r.x-padX, y:r.y-padY, w:r.w+2*padX, h:r.h+2*padY }, IMAGE_BOUNDS);
}
function setViewBox({x,y,w,h}){ if(svg) svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`); }
function updateEditViewBox(){
  const inCustomize = document.documentElement.getAttribute('data-active-section') === 'customize';
  const editPressed = isEditActive();
  if(inCustomize && editPressed){ setViewBox(expandRect(DESIGN_RECT)); }
  else { setViewBox(VIEWBOX_PREVIEW); }
}

// Overlays
const designToggle = document.querySelector('.view-mode-toolbar [data-toggle="design"]');
const frameToggle  = document.querySelector('.view-mode-toolbar [data-toggle="frame"]');
const designOverlay= document.getElementById('designOverlay');
const frameOverlay = document.getElementById('frameOverlay');
function updateDesignOverlay(){ if(designOverlay && designToggle){ designOverlay.style.display = designToggle.getAttribute('aria-pressed') === 'true' ? 'block' : 'none'; } }
function updateFrameOverlay(){ if(frameOverlay && frameToggle){ frameOverlay.style.display = frameToggle.getAttribute('aria-pressed') === 'true' ? 'block' : 'none'; } }

// React to section changes
const sectionObserver = new MutationObserver(() => {
  const section = document.documentElement.getAttribute('data-active-section');
  if(section === 'customize'){
    applyImageForSide((document.querySelector('.view-mode-toolbar [data-group="side"][aria-pressed="true"]') || {}).dataset?.value || 'front');
  }
  updatePreviewLock();
  updateEditViewBox();
  updateDesignOverlay();
  updateFrameOverlay();
  updateSelectionOverlay();
});
sectionObserver.observe(document.documentElement, { attributes:true, attributeFilter:['data-active-section'] });

// INITIAL STATE
ensureBaseLayer();
refreshLayerList();
updatePropertiesPanel();
updateColorPanel();
setActive('explore'); // app loads on Explore, empty content until a tool is chosen
updatePreviewLock();
updateEditViewBox();
updateDesignOverlay();
updateFrameOverlay();
updateSelectionOverlay();
