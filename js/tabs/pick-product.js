import { EVT_READY } from "../events.js";
import { getState, setAt } from "../store.js";
import { getAllProducts } from "../utils/sqlite.js";

const host = document.getElementById("tab-host");

host.addEventListener(EVT_READY, (event) => {
  if (event.detail.tab !== "pick-product") return;
  initializePickProduct().catch((error) => {
    console.error(error);
    const section = host.querySelector(".tab-pick-product");
    const loadingEl = section?.querySelector("[data-loading]");
    const errorEl = section?.querySelector("[data-error]");
    const listEl = section?.querySelector("[data-product-list]");
    if (loadingEl) loadingEl.remove();
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

  const summaryNameEl = section.querySelector("[data-product-summary-name]");
  const loadingEl = section.querySelector("[data-loading]");
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

  const updateSummary = (code) => {
    if (!summaryNameEl) return;
    const product = code ? productMap.get(code) : null;
    if (!product) return;
    summaryNameEl.textContent = `${product.product_name} [${product.product_code}]`;
  };

  if (!activeCode || !productMap.has(activeCode)) {
    activeCode = products[0].product_code;
    const fallbackProduct = productMap.get(activeCode);
    if (fallbackProduct) {
      ensureProductState(fallbackProduct, state);
    }
  }

  if (loadingEl) loadingEl.remove();
  if (errorEl) errorEl.classList.add("hidden");
  listEl.hidden = false;
  renderProductButtons({
    listEl,
    products,
    activeCode,
    onSelect: (code) => {
      const nextProduct = productMap.get(code);
      if (!nextProduct) return;
      activeCode = code;
      ensureProductState(nextProduct, getState());
    },
    onActiveChange: updateSummary
  });

  updateSummary(activeCode);
}

function renderProductButtons({ listEl, products, activeCode, onSelect, onActiveChange }) {
  const buttons = [];
  listEl.innerHTML = "";

  products.forEach((product) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "product-card";
    button.dataset.productCode = product.product_code;
    button.dataset.productId = String(product.product_id);
    const previewMarkup = product.default_preview_front_path
      ? `<span class="product-card__preview"><img src="${product.default_preview_front_path}" alt="" loading="lazy" decoding="async" /></span>`
      : "";
    button.innerHTML = `
      <span class="product-card__code">${product.product_code}</span>
      <span class="product-card__name">${product.product_name}</span>
      ${previewMarkup}
    `;
    buttons.push(button);
    item.appendChild(button);
    listEl.appendChild(item);
  });

  function updateActive(code) {
    buttons.forEach((button) => {
      const isActive = button.dataset.productCode === code;
      button.setAttribute("aria-pressed", String(isActive));
      button.classList.toggle("is-active", isActive);
    });
    if (typeof onActiveChange === "function") {
      onActiveChange(code);
    }
  }

  updateActive(activeCode);

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const code = button.dataset.productCode;
      if (!code || code === activeCode) return;
      activeCode = code;
      updateActive(activeCode);
      onSelect(code);
    });
  });
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
