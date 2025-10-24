import { getState, setAt } from "../store.js";
import { EVT_READY } from "../events.js";
import { getProductWithColors } from "../utils/sqlite.js";

const host = document.getElementById("tab-host");

function setButtonPressed(button, pressed) {
  button.setAttribute("aria-pressed", String(pressed));
  button.classList.toggle("is-active", pressed);
}

host.addEventListener(EVT_READY, (e) => {
  if (e.detail.tab !== "pick-color") return;
  initializePickColor().catch((err) => {
    console.error(err);
    const section = host.querySelector(".tab-pick-color");
    const errorEl = section?.querySelector("[data-error]");
    section?.querySelector("[data-loading]")?.remove();
    const grid = section?.querySelector("[data-color-grid]");
    if (grid) grid.innerHTML = "";
    if (errorEl) {
      errorEl.textContent = "Unable to load color data. Please refresh to try again.";
      errorEl.classList.remove("hidden");
    }
  });
});

async function initializePickColor() {
  const section = host.querySelector(".tab-pick-color");
  if (!section) return;

  const productNameEl = section.querySelector("[data-product-name]");
  const productCodeEl = section.querySelector("[data-product-code]");
  const colorNameEl = section.querySelector("[data-color-name]");
  const previewImg = section.querySelector("[data-preview-image]");
  const paletteGrid = section.querySelector("[data-color-grid]");
  const loadingEl = section.querySelector("[data-loading]");
  const errorEl = section.querySelector("[data-error]");
  const sideButtons = Array.from(section.querySelectorAll("[data-side-button]"));

  const state = getState();
  const desiredCode = state.color?.productCode || "3001C_BC_UJSST";
  let selectedSide = state.color?.side || "front";
  const defaultColorCode = state.color?.selectedColorCode || "black";

  const { product, colors } = await getProductWithColors(desiredCode);
  if (!colors.length) {
    throw new Error("No colors available for product.");
  }

  productNameEl.textContent = product.product_name;
  productCodeEl.textContent = product.product_code;

  if (state.color?.productCode !== product.product_code) {
    setAt("color.productCode", product.product_code);
  }
  if (state.color?.productId !== product.product_id) {
    setAt("color.productId", product.product_id);
  }

  let selectedColor =
    colors.find((color) => color.color_code === defaultColorCode) ||
    colors.find((color) => color.color_code === "black") ||
    colors[0];

  if (selectedSide !== "front" && selectedSide !== "back") {
    selectedSide = "front";
  }

  if (state.color?.selectedColorCode !== selectedColor.color_code) {
    setAt("color.selectedColorCode", selectedColor.color_code);
  }
  if (state.color?.side !== selectedSide) {
    setAt("color.side", selectedSide);
  }

  if (loadingEl) loadingEl.remove();
  if (errorEl) errorEl.classList.add("hidden");

  renderPalette(colors, paletteGrid, selectedColor.color_code);
  renderSideButtons(sideButtons, selectedSide);
  updatePreview({
    colorNameEl,
    previewImg,
    productName: product.product_name,
    selectedColor,
    side: selectedSide
  });

  paletteGrid.addEventListener("click", (event) => {
    const swatch = event.target.closest("[data-color-code]");
    if (!swatch) return;
    const code = swatch.dataset.colorCode;
    if (!code || code === selectedColor.color_code) return;

    const nextColor = colors.find((color) => color.color_code === code);
    if (!nextColor) return;

    selectedColor = nextColor;
    setAt("color.selectedColorCode", code);
    renderPalette(colors, paletteGrid, code);
    const active = paletteGrid.querySelector(`[data-color-code="${code}"]`);
    active?.focus();
    updatePreview({
      colorNameEl,
      previewImg,
      productName: product.product_name,
      selectedColor,
      side: selectedSide
    });
  });

  sideButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const side = button.dataset.sideButton;
      if (!side || side === selectedSide) return;
      selectedSide = side;
      setAt("color.side", selectedSide);
      renderSideButtons(sideButtons, selectedSide);
      updatePreview({
        colorNameEl,
        previewImg,
        productName: product.product_name,
        selectedColor,
        side: selectedSide
      });
    });
  });
}

function renderPalette(colors, container, activeCode) {
  container.innerHTML = "";
  colors.forEach((color) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "color-swatch";
    button.dataset.colorCode = color.color_code;
    button.setAttribute("aria-pressed", String(color.color_code === activeCode));
    button.title = color.color_name;
    button.innerHTML = `
      <span class="color-swatch__chip">
        <img src="${color.button_96_path}" alt="" loading="lazy" />
      </span>
      <span class="color-swatch__label">${color.color_name}</span>
    `;
    if (color.color_code === activeCode) {
      button.classList.add("is-active");
    }
    container.appendChild(button);
  });
}

function renderSideButtons(buttons, activeSide) {
  buttons.forEach((button) => {
    const side = button.dataset.sideButton;
    setButtonPressed(button, side === activeSide);
  });
}

function updatePreview({ colorNameEl, previewImg, productName, selectedColor, side }) {
  const sideLabel = side === "back" ? "Back" : "Front";
  colorNameEl.textContent = `${selectedColor.color_name} · ${sideLabel}`;
  const src = side === "back" ? selectedColor.preview_back_path : selectedColor.preview_front_path;
  previewImg.src = src;
  previewImg.alt = `${selectedColor.color_name} ${side} view of ${productName}`;
}
