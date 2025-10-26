import { GALLERY_PAGE_SIZE } from '../core/constants.js';
import { state, getGalleryState, setGalleryState } from '../core/state.js';

export function initGallery(dom, drawerApi, layerManager) {
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
    if (!galleryState || !dom.galleryTagStrip) return;
    dom.galleryTagStrip.innerHTML = '';
    if (!galleryState.tags.length) {
      const placeholder = document.createElement('span');
      placeholder.className = 'tag-placeholder';
      placeholder.textContent = 'No tags available';
      dom.galleryTagStrip.appendChild(placeholder);
      return;
    }
    galleryState.tags.forEach((tag) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tag-pill';
      button.dataset.tag = tag;
      button.textContent = `#${tag}`;
      dom.galleryTagStrip.appendChild(button);
    });
    updateTagSelectionClasses();
  }

  function renderGalleryActiveTags() {
    const galleryState = getGalleryState();
    if (!galleryState || !dom.galleryActiveTags) return;
    dom.galleryActiveTags.innerHTML = '';
    if (!galleryState.selectedTags.size) {
      const empty = document.createElement('span');
      empty.className = 'active-tags-empty';
      empty.textContent = 'No tags selected';
      dom.galleryActiveTags.appendChild(empty);
      return;
    }
    galleryState.selectedTags.forEach((tag) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'active-tag';
      chip.dataset.tag = tag;
      chip.textContent = `#${tag}`;
      dom.galleryActiveTags.appendChild(chip);
    });
  }

  function updateTagSelectionClasses() {
    const galleryState = getGalleryState();
    if (!galleryState || !dom.galleryTagStrip) return;
    const buttons = dom.galleryTagStrip.querySelectorAll('[data-tag]');
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
    if (!galleryState) return;
    const pageCount = Math.max(1, Math.ceil(galleryState.filtered.length / GALLERY_PAGE_SIZE));
    if (galleryState.page > pageCount) {
      galleryState.page = pageCount;
    }
    if (dom.galleryPrevButton) {
      dom.galleryPrevButton.disabled = galleryState.page <= 1;
    }
    if (dom.galleryNextButton) {
      dom.galleryNextButton.disabled = galleryState.page >= pageCount;
    }
    if (dom.galleryPageIndicator) {
      dom.galleryPageIndicator.textContent = `Page ${galleryState.page} of ${pageCount}`;
    }
    renderGalleryList();
  }

  function renderGalleryList() {
    const galleryState = getGalleryState();
    if (!galleryState || !dom.galleryGrid || !dom.galleryTemplate) return;
    dom.galleryGrid.innerHTML = '';
    const start = (galleryState.page - 1) * GALLERY_PAGE_SIZE;
    const pageItems = galleryState.filtered.slice(start, start + GALLERY_PAGE_SIZE);
    if (!pageItems.length) {
      const empty = document.createElement('p');
      empty.className = 'gallery-empty';
      empty.textContent = 'No matching templates found.';
      dom.galleryGrid.appendChild(empty);
      return;
    }
    pageItems.forEach((template) => {
      const clone = dom.galleryTemplate.content.firstElementChild.cloneNode(true);
      clone.dataset.templateKey = template.key;
      clone.dataset.templateType = template.type;
      clone.querySelector('.gallery-name').textContent = template.name;
      clone.querySelector('.gallery-tag-list').textContent = template.tags.map((tag) => `#${tag}`).join(' ');
      const preview = clone.querySelector('.gallery-item-preview');
      template.renderPreview(preview);
      clone.addEventListener('click', () => selectGalleryTemplate(template, clone));
      dom.galleryGrid.appendChild(clone);
    });
  }

  function selectGalleryTemplate(template, element) {
    const galleryState = getGalleryState();
    if (!galleryState) return;
    state.activeTemplate = template;
    dom.galleryButton.disabled = false;
    if (dom.galleryGrid) {
      dom.galleryGrid.querySelectorAll('.gallery-item').forEach((item) => item.classList.remove('active'));
    }
    element.classList.add('active');
  }

  function syncActiveTemplateAvailability() {
    const galleryState = getGalleryState();
    if (!galleryState || !dom.galleryButton) return;
    dom.galleryButton.disabled = !state.activeTemplate || state.layers.length >= 9;
  }

  function openGallery(type, templates) {
    state.galleryType = type;
    state.activeTemplate = null;
    dom.galleryButton.disabled = true;
    setGalleryState({
      type,
      templates: templates.slice(),
      tags: collectGalleryTags(templates),
      searchTerm: '',
      selectedTags: new Set(),
      page: 1,
      filtered: templates.slice()
    });
    if (dom.gallerySearchInput) {
      dom.gallerySearchInput.value = '';
      dom.gallerySearchInput.placeholder = `Search ${type.toLowerCase()} by name or #tag`;
    }
    renderGalleryTags();
    applyGalleryFilters();
    drawerApi.openDrawerPanel(dom.galleryPanel, { title: `${type} Gallery` });
  }

  function bindEvents() {
    if (dom.gallerySearchInput) {
      dom.gallerySearchInput.addEventListener('input', () => {
        const galleryState = getGalleryState();
        if (!galleryState) return;
        galleryState.searchTerm = dom.gallerySearchInput.value;
        galleryState.page = 1;
        applyGalleryFilters();
      });
    }

    if (dom.galleryTagStrip) {
      dom.galleryTagStrip.addEventListener('click', (event) => {
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

    if (dom.galleryActiveTags) {
      dom.galleryActiveTags.addEventListener('click', (event) => {
        const chip = event.target.closest('.active-tag');
        const galleryState = getGalleryState();
        if (!chip || !galleryState) return;
        const { tag } = chip.dataset;
        galleryState.selectedTags.delete(tag);
        galleryState.page = 1;
        applyGalleryFilters();
      });
    }

    if (dom.galleryPrevButton) {
      dom.galleryPrevButton.addEventListener('click', () => {
        const galleryState = getGalleryState();
        if (!galleryState || galleryState.page <= 1) return;
        galleryState.page -= 1;
        renderGalleryPage();
      });
    }

    if (dom.galleryNextButton) {
      dom.galleryNextButton.addEventListener('click', () => {
        const galleryState = getGalleryState();
        if (!galleryState) return;
        const pageCount = Math.max(1, Math.ceil(galleryState.filtered.length / GALLERY_PAGE_SIZE));
        if (galleryState.page >= pageCount) return;
        galleryState.page += 1;
        renderGalleryPage();
      });
    }

    if (dom.galleryButton) {
      dom.galleryButton.addEventListener('click', () => {
        if (!state.activeTemplate) return;
        if (state.layers.length >= 9) {
          alert('Maximum of 9 layers reached.');
          return;
        }
        layerManager.createLayerFromTemplate(state.activeTemplate);
        state.activeTemplate = null;
        dom.galleryButton.disabled = true;
        if (dom.galleryGrid) {
          dom.galleryGrid.querySelectorAll('.gallery-item').forEach((item) => item.classList.remove('active'));
        }
        drawerApi.closeDrawer();
      });
    }
  }

  bindEvents();

  return {
    openGallery,
    applyGalleryFilters,
    renderGalleryPage,
    syncActiveTemplateAvailability
  };
}
