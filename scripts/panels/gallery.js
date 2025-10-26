import { GALLERY_PAGE_SIZE } from '../core/constants.js';
import { state, getGalleryState, setGalleryState } from '../core/state.js';

export function initGallery(dom, drawerApi, layerManager) {
  let currentUi = null;

  function getUiForType(type) {
    if (!dom.galleryPanels || dom.galleryPanels.size === 0) return null;
    return dom.galleryPanels.get(type.toLowerCase()) || null;
  }

  function updateAddButtonState() {
    if (!currentUi?.addButton) return;
    const isEnabled = Boolean(state.activeTemplate) && state.layers.length < 9;
    currentUi.addButton.disabled = !isEnabled;
    currentUi.addButton.classList.toggle('is-enabled', isEnabled);
  }

  function collectGalleryTags(templates) {
    const tags = new Map();
    templates.forEach((template) => {
      template.tags?.forEach((tag) => {
        const key = tag.toLowerCase();
        tags.set(key, tag);
      });
    });
    return Array.from(tags.values()).sort();
  }

  function renderGalleryTags() {
    const galleryState = getGalleryState();
    if (!galleryState || !currentUi?.tagStrip) return;
    currentUi.tagStrip.innerHTML = '';
    if (!galleryState.tags.length) {
      const placeholder = document.createElement('span');
      placeholder.className = 'tag-placeholder';
      placeholder.textContent = 'No tags available';
      currentUi.tagStrip.appendChild(placeholder);
      return;
    }
    galleryState.tags.forEach((tag) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tag-pill';
      button.dataset.tag = tag;
      button.textContent = `#${tag}`;
      currentUi.tagStrip.appendChild(button);
    });
    updateTagSelectionClasses();
  }

  function renderGalleryActiveTags() {
    const galleryState = getGalleryState();
    if (!galleryState || !currentUi?.activeTags) return;
    currentUi.activeTags.innerHTML = '';
    if (!galleryState.selectedTags.size) {
      const empty = document.createElement('span');
      empty.className = 'active-tags-empty';
      empty.textContent = 'No tags selected';
      currentUi.activeTags.appendChild(empty);
      return;
    }
    galleryState.selectedTags.forEach((tag) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'active-tag';
      chip.dataset.tag = tag;
      chip.textContent = `#${tag}`;
      currentUi.activeTags.appendChild(chip);
    });
  }

  function updateTagSelectionClasses() {
    const galleryState = getGalleryState();
    if (!galleryState || !currentUi?.tagStrip) return;
    const buttons = currentUi.tagStrip.querySelectorAll('[data-tag]');
    buttons.forEach((button) => {
      const { tag } = button.dataset;
      button.classList.toggle('active', galleryState.selectedTags.has(tag));
    });
  }

  function applyGalleryFilters() {
    const galleryState = getGalleryState();
    if (!galleryState) return;
    const term = galleryState.searchTerm.trim().toLowerCase();
    galleryState.filtered = galleryState.templates.filter((template) => {
      const matchesTerm =
        !term ||
        template.name.toLowerCase().includes(term) ||
        template.tags?.some((tag) => `#${tag.toLowerCase()}`.includes(term));
      const matchesTags =
        !galleryState.selectedTags.size ||
        template.tags?.some((tag) => galleryState.selectedTags.has(tag));
      return matchesTerm && matchesTags;
    });
    renderGalleryActiveTags();
    updateTagSelectionClasses();
    renderGalleryPage();
  }

  function renderGalleryPage() {
    const galleryState = getGalleryState();
    if (!galleryState || !currentUi) return;
    const pageCount = Math.max(1, Math.ceil(galleryState.filtered.length / GALLERY_PAGE_SIZE));
    if (galleryState.page > pageCount) {
      galleryState.page = pageCount;
    }
    if (currentUi.prevButton) {
      currentUi.prevButton.disabled = galleryState.page <= 1;
    }
    if (currentUi.nextButton) {
      currentUi.nextButton.disabled = galleryState.page >= pageCount;
    }
    if (currentUi.pageIndicator) {
      currentUi.pageIndicator.textContent = `Page ${galleryState.page} of ${pageCount}`;
    }
    renderGalleryList();
  }

  function renderGalleryList() {
    const galleryState = getGalleryState();
    if (!galleryState || !currentUi?.grid || !dom.galleryTemplate) return;
    currentUi.grid.innerHTML = '';
    const start = (galleryState.page - 1) * GALLERY_PAGE_SIZE;
    const pageItems = galleryState.filtered.slice(start, start + GALLERY_PAGE_SIZE);
    if (!pageItems.length) {
      if (state.activeTemplate) {
        state.activeTemplate = null;
      }
      const empty = document.createElement('p');
      empty.className = 'gallery-empty';
      empty.textContent = 'No matching templates found.';
      currentUi.grid.appendChild(empty);
      updateAddButtonState();
      return;
    }
    let selectionFound = false;
    pageItems.forEach((template) => {
      const clone = dom.galleryTemplate.content.firstElementChild.cloneNode(true);
      clone.dataset.templateKey = template.key;
      clone.dataset.templateType = template.type;
      clone.querySelector('.gallery-name').textContent = template.name;
      clone.querySelector('.gallery-tag-list').textContent = template.tags.map((tag) => `#${tag}`).join(' ');
      const preview = clone.querySelector('.gallery-item-preview');
      template.renderPreview(preview);
      clone.addEventListener('click', () => selectGalleryTemplate(template, clone));
      if (state.activeTemplate?.key === template.key) {
        clone.classList.add('active');
        selectionFound = true;
      }
      currentUi.grid.appendChild(clone);
    });
    if (state.activeTemplate && !selectionFound) {
      state.activeTemplate = null;
    }
    updateAddButtonState();
  }

  function selectGalleryTemplate(template, element) {
    const galleryState = getGalleryState();
    if (!galleryState) return;
    state.activeTemplate = template;
    updateAddButtonState();
    if (currentUi?.grid) {
      currentUi.grid.querySelectorAll('.gallery-item').forEach((item) => item.classList.remove('active'));
    }
    element.classList.add('active');
  }

  function syncActiveTemplateAvailability() {
    const galleryState = getGalleryState();
    if (!galleryState || !currentUi?.addButton) return;
    updateAddButtonState();
  }

  function openGallery(type, templates) {
    const ui = getUiForType(type);
    if (!ui) {
      console.warn(`No gallery panel found for type: ${type}`);
      return;
    }
    currentUi = ui;
    state.galleryType = type;
    state.activeTemplate = null;
    if (currentUi.addButton) {
      currentUi.addButton.disabled = true;
      currentUi.addButton.classList.remove('is-enabled');
    }
    setGalleryState({
      type,
      templates: templates.slice(),
      tags: collectGalleryTags(templates),
      searchTerm: '',
      selectedTags: new Set(),
      page: 1,
      filtered: templates.slice()
    });
    if (currentUi.searchInput) {
      currentUi.searchInput.value = '';
      currentUi.searchInput.placeholder = `Search ${type.toLowerCase()} by name or #tag`;
    }
    renderGalleryTags();
    applyGalleryFilters();
    drawerApi.openDrawerPanel(currentUi.panel, { title: `${type} Gallery` });
  }

  function bindEvents() {
    dom.galleryPanels?.forEach((ui) => {
      if (ui.searchInput) {
        ui.searchInput.addEventListener('input', () => {
          if (currentUi !== ui) return;
          const galleryState = getGalleryState();
          if (!galleryState) return;
          galleryState.searchTerm = ui.searchInput.value;
          galleryState.page = 1;
          applyGalleryFilters();
        });
      }

      if (ui.tagStrip) {
        ui.tagStrip.addEventListener('click', (event) => {
          if (currentUi !== ui) return;
          const button = event.target.closest('[data-tag]');
          const galleryState = getGalleryState();
          if (!button || !galleryState) return;
          const { tag } = button.dataset;
          if (galleryState.selectedTags.has(tag)) {
            galleryState.selectedTags.delete(tag);
          } else {
            galleryState.selectedTags.add(tag);
          }
          galleryState.page = 1;
          applyGalleryFilters();
        });
      }

      if (ui.activeTags) {
        ui.activeTags.addEventListener('click', (event) => {
          if (currentUi !== ui) return;
          const chip = event.target.closest('.active-tag');
          const galleryState = getGalleryState();
          if (!chip || !galleryState) return;
          const { tag } = chip.dataset;
          galleryState.selectedTags.delete(tag);
          galleryState.page = 1;
          applyGalleryFilters();
        });
      }

      if (ui.prevButton) {
        ui.prevButton.addEventListener('click', () => {
          if (currentUi !== ui) return;
          const galleryState = getGalleryState();
          if (!galleryState || galleryState.page <= 1) return;
          galleryState.page -= 1;
          renderGalleryPage();
        });
      }

      if (ui.nextButton) {
        ui.nextButton.addEventListener('click', () => {
          if (currentUi !== ui) return;
          const galleryState = getGalleryState();
          if (!galleryState) return;
          const pageCount = Math.max(1, Math.ceil(galleryState.filtered.length / GALLERY_PAGE_SIZE));
          if (galleryState.page >= pageCount) return;
          galleryState.page += 1;
          renderGalleryPage();
        });
      }

      if (ui.addButton) {
        ui.addButton.addEventListener('click', () => {
          if (currentUi !== ui) return;
          if (!state.activeTemplate) return;
          if (state.layers.length >= 9) {
            alert('Maximum of 9 layers reached.');
            return;
          }
          layerManager.createLayerFromTemplate(state.activeTemplate);
          state.activeTemplate = null;
          if (currentUi?.grid) {
            currentUi.grid.querySelectorAll('.gallery-item').forEach((item) => item.classList.remove('active'));
          }
          updateAddButtonState();
          drawerApi.closeDrawer();
        });
      }
    });
  }

  bindEvents();

  return {
    openGallery,
    applyGalleryFilters,
    renderGalleryPage,
    syncActiveTemplateAvailability
  };
}
