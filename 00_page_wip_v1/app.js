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
    if(groupName === 'side'){ applyImageForSide(btn.getAttribute('data-value')); }
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
}
function closePanel(){
  document.documentElement.setAttribute('data-open-panel', '');
  panelNames.forEach(n => {
    const b = getCustomizeButtonByName(n);
    if(b) b.setAttribute('aria-pressed', 'false');
  });
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
  const matchToggle = panel.querySelector('.gallery-match-toggle');
  const clearTagsButton = panel.querySelector('.gallery-clear-tags');
  const tagExplorer = panel.querySelector('.gallery-tag-explorer');
  const tagToggleButton = panel.querySelector('.gallery-tag-toggle');
  const tagStrip = panel.querySelector('.gallery-tag-strip');
  const grid = panel.querySelector('.gallery-grid');
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
    if(tagToggleButton){
      tagToggleButton.setAttribute('aria-expanded', state.tagsExpanded ? 'true' : 'false');
      const label = tagToggleButton.querySelector('.toggle-label');
      if(label){
        label.textContent = state.tagsExpanded ? 'Hide tags' : 'See All tags';
      }
    }
    if(tagStrip){
      if(state.tagsExpanded){
        tagStrip.removeAttribute('hidden');
      }else{
        tagStrip.setAttribute('hidden', '');
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
      button.innerHTML = `<span>#${tag}</span><span class="pill">Add tag</span>`;
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
    if(matchToggle){
      matchToggle.checked = state.matchAny;
    }
  }

  function updateStatus(message){
    if(statusLabel){
      statusLabel.textContent = message;
    }
  }

  function updateAddButton(){
    const enabled = Boolean(state.activeTemplate);
    if(addButton){
      addButton.disabled = !enabled;
    }
    updateStatus(enabled ? `${state.activeTemplate.name} selected` : 'Select an item to enable');
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
      button.textContent = `#${tag}`;
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
      chip.textContent = `#${tag}`;
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
      if(tagEl) tagEl.textContent = template.tags.map(tag => `#${tag}`).join(' ');
      const preview = clone.querySelector('.gallery-item-preview');
      template.renderPreview(preview);
      clone.addEventListener('click', () => selectTemplate(template, clone));
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

  if(matchToggle){
    matchToggle.addEventListener('change', () => {
      state.matchAny = matchToggle.checked;
      state.page = 1;
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
    addButton.addEventListener('click', () => {
      if(!state.activeTemplate) return;
      updateStatus(`${state.activeTemplate.name} added to canvas (demo)`);
    });
  }

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
        const label = type === 'design' ? 'designs' : type === 'element' ? 'elements' : 'text';
        searchInput.value = '';
        searchInput.placeholder = `Search ${label} by name or #tag`;
      }
      renderTags();
      renderActiveTags();
      renderGalleryPage();
      updateAddButton();
    }
  };
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
});
sectionObserver.observe(document.documentElement, { attributes:true, attributeFilter:['data-active-section'] });

// INITIAL STATE
setActive('explore'); // app loads on Explore, empty content until a tool is chosen
updatePreviewLock();
updateEditViewBox();
updateDesignOverlay();
updateFrameOverlay();
