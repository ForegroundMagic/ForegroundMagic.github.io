(function () {
  window.PanelModules = window.PanelModules || {};

  const VARIANT_LABELS = {
    "all-wares": "All Wares",
    hot: "Hot",
    new: "New"
  };

  const DATA_PATH = "assets/data/product_catalog.json";
  let catalogPromise;

  function loadCatalog() {
    if (!catalogPromise) {
      catalogPromise = fetch(DATA_PATH)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load catalog data");
          return res.json();
        })
        .then((payload) => {
          return (payload.products || []).map((product) => ({
            ...product,
            createdTs: Date.parse(product.created_at),
            hero: product.hero || "assets/img/products/fallback.png"
          }));
        });
    }
    return catalogPromise;
  }

  function normalizeFilter(value) {
    if (value === "hot" || value === "new") return value;
    return "all-wares";
  }

  function renderSwatches(colors = []) {
    return colors
      .slice(0, 6)
      .map(
        (color) =>
          `<span class="product-card__color-swatch" title="${color.name}" style="background:${color.code || "#222"}"></span>`
      )
      .join("");
  }

  function buildCard(product) {
    const tags = [];
    if (product._isHot) tags.push(`<span class="product-tag product-tag--hot">Hot</span>`);
    if (product._isNew) tags.push(`<span class="product-tag product-tag--new">New</span>`);

    return `
      <article class="product-card">
        <div class="product-card__media">
          <img src="${product.hero}" alt="${product.product_name}" loading="lazy" />
        </div>
        <div class="product-card__body">
          <div class="product-card__type">${product.type || "Apparel"}</div>
          <h3 class="product-card__title">${product.product_name}</h3>
          <div class="product-card__meta">
            <span>❤ ${product.favorites ?? 0}</span>
            <div class="product-card__tags">${tags.join("")}</div>
          </div>
          <div class="product-card__colors">${renderSwatches(product.colors)}</div>
        </div>
      </article>
    `;
  }

  function applyFilters(state) {
    const query = state.search.trim().toLowerCase();
    let items = state.catalog || [];

    if (query) {
      items = items.filter((item) => {
        return (
          item.product_name.toLowerCase().includes(query) ||
          (item.product_code && item.product_code.toLowerCase().includes(query)) ||
          (item.type && item.type.toLowerCase().includes(query)) ||
          (item.description && item.description.toLowerCase().includes(query))
        );
      });
    }

    if (state.activeFilter === "hot") {
      const threshold = 45;
      items = items
        .filter((item) => (item.favorites || 0) >= threshold)
        .map((item) => ({ ...item, _isHot: true }))
        .sort((a, b) => (b.favorites || 0) - (a.favorites || 0));
      return items.slice(0, 12);
    }

    if (state.activeFilter === "new") {
      const windowSize = state.newLimit || 10;
      const sorted = [...items]
        .sort((a, b) => (b.createdTs || 0) - (a.createdTs || 0))
        .map((item, index) => ({
          ...item,
          _isNew: index < windowSize
        }));
      return sorted.slice(0, windowSize);
    }

    // All wares
    return items.map((item) => ({
      ...item,
      _isHot: (item.favorites || 0) >= 55,
      _isNew: (Date.now() - (item.createdTs || 0)) < 14 * 24 * 60 * 60 * 1000
    }));
  }

  window.PanelModules.catalog = function initCatalogPanel(root, context = {}) {
    if (!root) return;

    const galleryRoot = root.querySelector("[data-gallery-root]");
    const statusEl = root.querySelector("[data-gallery-status]");
    const gridEl = root.querySelector("[data-gallery-grid]");
    const searchInput = root.querySelector("[data-gallery-search]");
    const limitControl = root.querySelector("[data-gallery-limit]");
    const limitWrap = root.querySelector("[data-limit-control]");
    const filterButtons = root.querySelectorAll("[data-filter-button]");

    const state = {
      activeFilter: normalizeFilter(context.variant),
      search: "",
      newLimit: Number(limitControl?.value) || 10,
      catalog: null
    };

    function updateFilterButtons() {
      filterButtons.forEach((btn) => {
        const filter = btn.getAttribute("data-gallery-filter");
        btn.classList.toggle("is-active", filter === state.activeFilter);
      });
      if (limitWrap) {
        limitWrap.hidden = state.activeFilter !== "new";
      }
      if (statusEl) {
        statusEl.textContent = `Showing ${VARIANT_LABELS[state.activeFilter]}${state.search ? " · filtered" : ""}`;
      }
    }

    function render() {
      if (!state.catalog) return;
      const results = applyFilters(state);
      if (gridEl) {
        gridEl.innerHTML = results.map(buildCard).join("");
      }
      if (statusEl) {
        const total = state.catalog.length;
        statusEl.textContent = results.length
          ? `Showing ${results.length} of ${total} products`
          : `No products match “${state.search}”`;
      }
    }

    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        state.activeFilter = normalizeFilter(btn.getAttribute("data-gallery-filter"));
        updateFilterButtons();
        render();
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", (event) => {
        state.search = event.target.value || "";
        render();
      });
    }

    if (limitControl) {
      limitControl.addEventListener("change", () => {
        state.newLimit = Number(limitControl.value) || 10;
        render();
      });
    }

    updateFilterButtons();
    loadCatalog()
      .then((items) => {
        state.catalog = items;
        if (searchInput) {
          searchInput.value = "";
          state.search = "";
        }
        render();
      })
      .catch((error) => {
        console.error(error);
        if (gridEl) {
          gridEl.innerHTML = "";
        }
        if (statusEl) {
          statusEl.textContent = "Unable to load catalog data.";
        }
        if (galleryRoot) {
          galleryRoot.classList.add("is-error");
        }
      });
  };
})();
