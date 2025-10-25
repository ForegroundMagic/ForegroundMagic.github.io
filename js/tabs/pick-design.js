import { setAt } from "../store.js";
import { EVT_READY } from "../events.js";
import { getDesignLibrary, getProductWithColors } from "../utils/sqlite.js";

const host = document.getElementById("tab-host");
const PER_PAGE = 10;

function formatLikes(value) {
  const parsed = Number(value);
  const likes = Number.isFinite(parsed) ? parsed : 0;
  return likes.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

host.addEventListener(EVT_READY, (e) => {
  if (e.detail.tab !== "pick-design") return;
  initializePickDesign(e.detail.state).catch((error) => {
    console.error(error);
    const gallery = host.querySelector("[data-gallery]");
    if (gallery) {
      gallery.innerHTML = "";
      gallery.setAttribute("aria-busy", "false");
      const message = document.createElement("p");
      message.className = "design-gallery__error";
      message.textContent = "We couldn't load the design catalog. Please refresh to try again.";
      gallery.appendChild(message);
    }
  });
});

async function initializePickDesign(state) {
  const gallery = host.querySelector("[data-gallery]");
  const template = host.querySelector("#design-card-template");
  const searchInput = host.querySelector("[data-filter-name]");
  const tagContainer = host.querySelector("[data-filter-tags]");
  const clearTagsBtn = host.querySelector("[data-clear-tags]");
  const pagination = host.querySelector("[data-pagination]");
  const filtersForm = host.querySelector(".design-filters");

  if (!gallery || !template) return;

  gallery.innerHTML = "";
  const loading = document.createElement("p");
  loading.className = "design-gallery__loading";
  loading.textContent = "Loading designs…";
  gallery.appendChild(loading);
  gallery.setAttribute("aria-busy", "true");

  const [{ designs, availableTags }, previewInfo] = await Promise.all([
    getDesignLibrary(),
    getSelectedProductPreview(state)
  ]);

  if (!designs.length) {
    gallery.innerHTML = "";
    gallery.setAttribute("aria-busy", "false");
    const empty = document.createElement("p");
    empty.className = "design-gallery__empty";
    empty.textContent = "No designs are available yet. Please check back later.";
    gallery.appendChild(empty);
    if (pagination) {
      pagination.hidden = true;
      pagination.setAttribute("aria-hidden", "true");
    }
    return;
  }

  designs.sort((a, b) => b.likeCount - a.likeCount);

  const activeTags = new Set();
  const tagButtons = new Map();
  let currentPage = 1;
  let selectedDesignId = normalizeSelectedDesign(state?.design, designs);
  const selectedDesign = designs.find((design) => design.id === selectedDesignId) ?? designs[0];
  selectedDesignId = selectedDesign?.id ?? null;

  ensureDesignState(selectedDesign);

  function syncClearButton() {
    if (!clearTagsBtn) return;
    if (activeTags.size === 0) {
      clearTagsBtn.hidden = true;
      clearTagsBtn.setAttribute("aria-hidden", "true");
    }
    else {
      clearTagsBtn.hidden = false;
      clearTagsBtn.setAttribute("aria-hidden", "false");
    }
  }

  function getFilteredDesigns() {
    const query = (searchInput?.value ?? "").trim().toLowerCase();
    return designs.filter((design) => {
      const matchesQuery =
        !query ||
        design.description.toLowerCase().includes(query) ||
        design.filename.toLowerCase().includes(query);
      if (!matchesQuery) return false;
      if (activeTags.size === 0) return true;
      return Array.from(activeTags).every((tag) => design.tags.includes(tag));
    });
  }

  function selectDesign(design) {
    if (!design) return;
    if (selectedDesignId === design.id) return;
    selectedDesignId = design.id;
    ensureDesignState(design);
    updateSelectionState();
  }

  function updateSelectionState() {
    gallery.querySelectorAll("[data-design-card]").forEach((card) => {
      const cardId = Number(card.dataset.designId);
      const isSelected = cardId === selectedDesignId;
      card.classList.toggle("is-selected", isSelected);
      card.setAttribute("aria-checked", String(isSelected));
      card.tabIndex = isSelected ? 0 : -1;
    });
  }

  function createCard(design) {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.designId = String(design.id);

    const previewProduct = node.querySelector(".design-card__product");
    if (previewProduct) {
      previewProduct.src = previewInfo.src;
      previewProduct.alt = previewInfo.alt;
    }

    const overlay = node.querySelector(".design-card__overlay");
    if (overlay) {
      overlay.src = design.filePath;
      overlay.alt = `${design.description} design preview`;
    }

    const title = node.querySelector(".design-card__title");
    if (title) title.textContent = design.description;

    const likes = node.querySelector(".design-card__like-count");
    if (likes) likes.textContent = formatLikes(design.likeCount);

    const tagsList = node.querySelector("[data-tag-list]");
    if (tagsList) {
      tagsList.replaceChildren(...design.tags.map((tag) => {
        const tagEl = document.createElement("span");
        tagEl.className = "design-card__tag";
        tagEl.textContent = `#${tag}`;
        return tagEl;
      }));
    }

    const isSelected = design.id === selectedDesignId;
    node.classList.toggle("is-selected", isSelected);
    node.setAttribute("aria-checked", String(isSelected));
    node.tabIndex = isSelected ? 0 : -1;

    const handleSelect = () => selectDesign(design);
    node.addEventListener("click", handleSelect);
    node.addEventListener("keydown", (ev) => {
      if (ev.key === " " || ev.key === "Enter") {
        ev.preventDefault();
        handleSelect();
      }
    });

    return node;
  }

  function renderPagination(totalPages) {
    if (!pagination) return;
    pagination.innerHTML = "";
    if (totalPages <= 1) {
      pagination.hidden = true;
      pagination.setAttribute("aria-hidden", "true");
      return;
    }

    pagination.hidden = false;
    pagination.setAttribute("aria-hidden", "false");

    const makeButton = (label, { disabled = false, ariaLabel, isCurrent = false, onClick }) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pagination__button";
      btn.innerHTML = label;
      if (ariaLabel) btn.setAttribute("aria-label", ariaLabel);
      if (disabled) btn.disabled = true;
      if (isCurrent) btn.setAttribute("aria-current", "true");
      btn.addEventListener("click", () => {
        if (disabled) return;
        onClick();
      });
      return btn;
    };

    const prevBtn = makeButton("‹", {
      disabled: currentPage === 1,
      ariaLabel: "Previous page",
      onClick: () => {
        if (currentPage > 1) {
          currentPage -= 1;
          render();
        }
      }
    });
    pagination.appendChild(prevBtn);

    for (let page = 1; page <= totalPages; page += 1) {
      const btn = makeButton(String(page), {
        ariaLabel: `Page ${page}`,
        isCurrent: page === currentPage,
        onClick: () => {
          if (currentPage !== page) {
            currentPage = page;
            render();
          }
        }
      });
      pagination.appendChild(btn);
    }

    const nextBtn = makeButton("›", {
      disabled: currentPage === totalPages,
      ariaLabel: "Next page",
      onClick: () => {
        if (currentPage < totalPages) {
          currentPage += 1;
          render();
        }
      }
    });
    pagination.appendChild(nextBtn);
  }

  function render() {
    gallery.setAttribute("aria-busy", "true");
    const filtered = getFilteredDesigns();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;

    gallery.innerHTML = "";

    if (filtered.length === 0) {
      const empty = document.createElement("p");
      empty.className = "design-gallery__empty";
      empty.textContent = "No designs match your search just yet. Try a different name or tag.";
      gallery.appendChild(empty);
      renderPagination(0);
      gallery.setAttribute("aria-busy", "false");
      return;
    }

    const start = (currentPage - 1) * PER_PAGE;
    const pageItems = filtered.slice(start, start + PER_PAGE);
    const fragment = document.createDocumentFragment();
    pageItems.forEach((design) => {
      fragment.appendChild(createCard(design));
    });
    gallery.appendChild(fragment);
    renderPagination(totalPages);
    gallery.setAttribute("aria-busy", "false");
  }

  if (filtersForm) {
    filtersForm.addEventListener("submit", (event) => event.preventDefault());
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      currentPage = 1;
      render();
    });
  }

  if (tagContainer) {
    tagContainer.innerHTML = "";
    availableTags.forEach((tag) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tag-filter__chip";
      btn.textContent = `#${tag}`;
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", () => {
        const isActive = btn.getAttribute("aria-pressed") === "true";
        if (isActive) {
          btn.setAttribute("aria-pressed", "false");
          activeTags.delete(tag);
        }
        else {
          btn.setAttribute("aria-pressed", "true");
          activeTags.add(tag);
        }
        currentPage = 1;
        syncClearButton();
        render();
      });
      tagButtons.set(tag, btn);
      tagContainer.appendChild(btn);
    });
  }

  if (clearTagsBtn) {
    clearTagsBtn.addEventListener("click", () => {
      if (activeTags.size === 0) return;
      activeTags.clear();
      tagButtons.forEach((btn) => btn.setAttribute("aria-pressed", "false"));
      currentPage = 1;
      syncClearButton();
      render();
    });
  }

  syncClearButton();
  render();
  gallery.setAttribute("aria-busy", "false");
}

function ensureDesignState(design) {
  if (!design) return;
  setAt("design.id", design.id);
  setAt("design.name", design.filename);
  setAt("design.filePath", design.filePath);
  setAt("design.description", design.description);
  setAt("design.likeCount", design.likeCount);
  setAt("design.tags", design.tags);
}

function normalizeSelectedDesign(designState, designs) {
  if (!Array.isArray(designs) || designs.length === 0) return null;
  const stateId = Number(designState?.id);
  const byId = Number.isFinite(stateId) ? designs.find((d) => d.id === stateId) : null;
  if (byId) return byId.id;

  if (typeof designState?.name === "string") {
    const byName = designs.find((d) => d.filename === designState.name);
    if (byName) return byName.id;
  }

  return designs[0].id;
}

async function getSelectedProductPreview(state) {
  const productCode = state?.color?.productCode ?? "3001C_BC_UJSST";
  const selectedSide = state?.color?.side === "back" ? "back" : "front";
  const desiredColorCode = state?.color?.selectedColorCode ?? null;

  try {
    const { product, colors, defaultColorCode } = await getProductWithColors(productCode);
    if (!colors.length) throw new Error("No colors for product");

    const fallbackColor = defaultColorCode
      ? colors.find((color) => color.color_code === defaultColorCode)
      : null;

    let selectedColor = desiredColorCode
      ? colors.find((color) => color.color_code === desiredColorCode)
      : null;

    if (!selectedColor) {
      selectedColor =
        fallbackColor ||
        colors.find((color) => color.color_code === "black") ||
        colors[0];
    }

    const src = selectedSide === "back" ? selectedColor.preview_back_path : selectedColor.preview_front_path;
    const alt = `${selectedColor.color_name} ${selectedSide} view of ${product.product_name}`;
    return { src, alt };
  }
  catch (error) {
    console.warn("Falling back to default preview image", error);
    return {
      src: "/assets/img/products/3001C_BC_UJSST/preview/17_white_front.png",
      alt: "Product preview image"
    };
  }
}
