import { EVT_READY } from "../events.js";
import { getState, setAt } from "../store.js";
import { getAllProducts } from "../utils/sqlite.js";

const host = document.getElementById("tab-host");

host.addEventListener(EVT_READY, (event) => {
  if (event.detail.tab !== "pick-product") return;
  initializePickProduct().catch((error) => {
    console.error(error);
    const section = host.querySelector(".tab-pick-product");
    const statusEl = section?.querySelector("[data-status]");
    const errorEl = section?.querySelector("[data-error]");
    const listEl = section?.querySelector("[data-product-list]");
    if (statusEl) {
      statusEl.textContent = "";
      statusEl.classList.add("hidden");
    }
    if (listEl) {
      listEl.hidden = true;
      listEl.innerHTML = "";
    }
    if (errorEl) {
      errorEl.textContent = "Unable to load products right now. Please try again later.";
      errorEl.classList.remove("hidden");
    }
  });
});

async function initializePickProduct() {
  const section = host.querySelector(".tab-pick-product");
  if (!section) return;

  const filtersForm = section.querySelector("[data-product-filters]");
  const searchInput = section.querySelector("[data-product-search]");
  const typeSelect = section.querySelector("[data-product-type]");
  const statusEl = section.querySelector("[data-status]");
  const errorEl = section.querySelector("[data-error]");
  const listEl = section.querySelector("[data-product-list]");
  if (!listEl) return;

  const state = getState();
  const products = await getAllProducts();

  if (!products.length) {
    throw new Error("No products found in database");
  }

  const productMap = new Map(products.map((product) => [product.product_code, product]));
  let activeCode = state.color?.productCode;

  if (!activeCode || !productMap.has(activeCode)) {
    activeCode = products[0].product_code;
    const fallbackProduct = productMap.get(activeCode);
    if (fallbackProduct) {
      ensureProductState(fallbackProduct, state);
    }
  }

  if (statusEl) {
    statusEl.textContent = "";
    statusEl.classList.add("hidden");
  }
  if (errorEl) errorEl.classList.add("hidden");
  listEl.hidden = false;

  let filteredProducts = [...products];

  filtersForm?.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  const renderProducts = (items) => {
    const buttons = [];
    listEl.innerHTML = "";

    if (!items.length) {
      if (statusEl) {
        statusEl.textContent = "No products match your filters. Try adjusting your search.";
        statusEl.classList.remove("hidden");
      }
      return;
    }

    if (statusEl) {
      statusEl.textContent = "";
      statusEl.classList.add("hidden");
    }

    items.forEach((product) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "product-card";
      button.dataset.productCode = product.product_code;
      button.dataset.productId = String(product.product_id);

      const media = document.createElement("span");
      media.className = "product-card__media";
      if (product.default_preview_front_path) {
        const img = document.createElement("img");
        img.src = product.default_preview_front_path;
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        media.append(img);
      }
      else {
        const fallback = document.createElement("span");
        fallback.className = "product-card__media--empty";
        fallback.textContent = "No preview";
        media.append(fallback);
      }

      const body = document.createElement("span");
      body.className = "product-card__body";

      const typeEl = document.createElement("span");
      typeEl.className = "product-card__type";
      typeEl.textContent = product.product_type_name ?? "Product";

      const nameEl = document.createElement("span");
      nameEl.className = "product-card__name";
      nameEl.textContent = product.product_name;

      const codeEl = document.createElement("span");
      codeEl.className = "product-card__code";
      codeEl.textContent = product.product_code;

      const descriptionEl = document.createElement("span");
      descriptionEl.className = "product-card__description";
      descriptionEl.textContent = product.description?.trim() || "No description provided.";

      body.append(typeEl, nameEl, codeEl, descriptionEl);
      button.append(media, body);

      buttons.push(button);
      item.appendChild(button);
      listEl.appendChild(item);
    });

    const updateActive = (code) => {
      buttons.forEach((button) => {
        const isActive = button.dataset.productCode === code;
        button.setAttribute("aria-pressed", String(isActive));
        button.classList.toggle("is-active", isActive);
      });
    };

    updateActive(activeCode);

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const code = button.dataset.productCode;
        if (!code || code === activeCode) return;
        activeCode = code;
        updateActive(activeCode);
        const nextProduct = productMap.get(code);
        if (nextProduct) {
          ensureProductState(nextProduct, getState());
        }
      });
    });
  };

  const applyFilters = () => {
    const query = searchInput?.value.trim().toLowerCase() ?? "";
    const selectedType = typeSelect?.value ?? "all";

    filteredProducts = products.filter((product) => {
      if (selectedType !== "all" && String(product.product_type_id ?? "") !== selectedType) {
        return false;
      }

      if (!query) return true;
      const haystack = [
        product.product_name,
        product.product_code,
        product.product_type_name,
        product.description
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

    if (
      filteredProducts.length &&
      !filteredProducts.some((product) => product.product_code === activeCode)
    ) {
      const nextActive = filteredProducts[0];
      if (nextActive && nextActive.product_code !== activeCode) {
        activeCode = nextActive.product_code;
        ensureProductState(nextActive, getState());
      }
    }

    renderProducts(filteredProducts);
  };

  if (typeSelect) {
    const uniqueTypes = Array.from(
      new Map(
        products
          .filter((product) => product.product_type_id && product.product_type_name)
          .map((product) => [product.product_type_id, product.product_type_name])
      ).entries()
    )
      .sort((a, b) => String(a[1]).localeCompare(String(b[1])));

    uniqueTypes.forEach(([id, name]) => {
      const option = document.createElement("option");
      option.value = String(id);
      option.textContent = name;
      typeSelect.append(option);
    });

    typeSelect.addEventListener("change", applyFilters);
  }

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }

  applyFilters();
}

function ensureProductState(product, state) {
  const currentCode = state.color?.productCode;
  const currentId = state.color?.productId;
  const desiredCode = product.product_code;
  const desiredId = Number(product.product_id);
  const desiredColorCode = product.default_color_code ?? null;

  if (currentCode !== desiredCode) {
    setAt("color.productCode", desiredCode);
  }
  if (currentId !== desiredId) {
    setAt("color.productId", desiredId);
  }

  const productState = state.product || {};
  if (productState.code !== desiredCode || productState.id !== desiredId || productState.name !== product.product_name) {
    setAt("product", {
      id: desiredId,
      code: desiredCode,
      name: product.product_name
    });
  }

  const currentColorSelection = state.color?.selectedColorCode ?? null;
  if (currentColorSelection !== desiredColorCode) {
    setAt("color.selectedColorCode", desiredColorCode);
  }
}
