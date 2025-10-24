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

  const productCodeEl = section.querySelector("[data-product-code]");
  const productNameEl = section.querySelector("[data-product-name]");
  const colorNameEl = section.querySelector("[data-color-name]");
  const previewImg = section.querySelector("[data-preview-image]");
  const paletteGrid = section.querySelector("[data-color-grid]");
  const loadingEl = section.querySelector("[data-loading]");
  const errorEl = section.querySelector("[data-error]");
  const sideButtons = Array.from(section.querySelectorAll("[data-side-button]"));
  const colorNavButtons = Array.from(section.querySelectorAll("[data-color-nav]"));
  const stepNavButtons = Array.from(section.querySelectorAll("[data-preview-step]"));
  const paletteToggle = section.querySelector("[data-palette-toggle]");
  const paletteContent = section.querySelector("[data-palette-content]");

  const syncPaletteHeight = () => {
    if (!paletteContent || !paletteToggle) return;
    if (paletteToggle.getAttribute("aria-expanded") === "true") {
      paletteContent.style.height = `${paletteContent.scrollHeight}px`;
    }
  };

  const state = getState();
  const desiredCode = state.color?.productCode || "3001C_BC_UJSST";
  let selectedSide = state.color?.side || "front";
  const storedColorCode = state.color?.selectedColorCode ?? null;

  const { product, colors, defaultColorCode } = await getProductWithColors(desiredCode);
  if (!colors.length) {
    throw new Error("No colors available for product.");
  }

  if (productCodeEl) {
    productCodeEl.textContent = `[${product.product_code}]`;
  }
  if (productNameEl) {
    productNameEl.textContent = product.product_name;
  }

  if (state.color?.productCode !== product.product_code) {
    setAt("color.productCode", product.product_code);
  }
  if (state.color?.productId !== product.product_id) {
    setAt("color.productId", product.product_id);
  }

  const defaultColorFromDb = defaultColorCode
    ? colors.find((color) => color.color_code === defaultColorCode)
    : null;

  let selectedColor =
    (storedColorCode && colors.find((color) => color.color_code === storedColorCode)) ||
    defaultColorFromDb ||
    colors.find((color) => color.color_code === "black") ||
    colors[0];

  let selectedColorIndex = colors.findIndex((color) => color.color_code === selectedColor.color_code);
  if (selectedColorIndex < 0) {
    selectedColorIndex = 0;
  }

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
  syncPaletteHeight();

  paletteGrid.addEventListener("click", (event) => {
    const swatch = event.target.closest("[data-color-code]");
    if (!swatch) return;
    const code = swatch.dataset.colorCode;
    if (!code || code === selectedColor.color_code) return;

    const nextColor = colors.find((color) => color.color_code === code);
    if (!nextColor) return;

    selectedColor = nextColor;
    selectedColorIndex = colors.findIndex((color) => color.color_code === code);
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
    syncPaletteHeight();
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

  colorNavButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!colors.length) return;
      const direction = button.dataset.colorNav === "next" ? 1 : -1;
      selectedColorIndex = (selectedColorIndex + direction + colors.length) % colors.length;
      selectedColor = colors[selectedColorIndex];
      setAt("color.selectedColorCode", selectedColor.color_code);
      renderPalette(colors, paletteGrid, selectedColor.color_code);
      updatePreview({
        colorNameEl,
        previewImg,
        productName: product.product_name,
        selectedColor,
        side: selectedSide
      });
      syncPaletteHeight();
    });
  });

  stepNavButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const direction = button.dataset.previewStep;
      const triggerId = direction === "prev" ? "prev" : "next";
      document.getElementById(triggerId)?.click();
    });
  });

  if (paletteToggle && paletteContent) {
    paletteToggle.addEventListener("click", () => {
      const expanded = paletteToggle.getAttribute("aria-expanded") === "true";
      if (expanded) {
        paletteContent.style.height = `${paletteContent.scrollHeight}px`;
        paletteToggle.setAttribute("aria-expanded", "false");
        requestAnimationFrame(() => {
          paletteContent.style.height = "0px";
        });
      }
      else {
        paletteToggle.setAttribute("aria-expanded", "true");
        paletteContent.style.height = `${paletteContent.scrollHeight}px`;
      }
    });

    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(syncPaletteHeight);
      observer.observe(paletteContent);
    }
  }

  requestAnimationFrame(syncPaletteHeight);
}

function renderPalette(colors, container, activeCode) {
  container.innerHTML = "";
  colors.forEach((color) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "color-swatch";
    button.dataset.colorCode = color.color_code;
    button.setAttribute("aria-pressed", String(color.color_code === activeCode));
    button.setAttribute("aria-label", color.color_name);
    button.title = color.color_name;
    const buttonImage = color.button_300x80_path || color.button_96_path;
    button.innerHTML = `
      <span class="color-swatch__chip">
        <img src="${buttonImage}" alt="" loading="lazy" />
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
  colorNameEl.textContent = selectedColor.color_name;
  const src = side === "back" ? selectedColor.preview_back_path : selectedColor.preview_front_path;
  previewImg.src = src;
  previewImg.alt = `${selectedColor.color_name} ${side} view of ${productName}`;
}
