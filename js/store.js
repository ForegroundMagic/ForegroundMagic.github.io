import { EVT_STATE_CHANGED } from "./events.js";

const LS_KEY = "designer.state.v1";

const defaults = {
  project: { name: "demo", version: 1 },
  theme: { palette: "dark", primaryColor: "#7dd3fc" },
  design: { name: "waves", scale: 100, rotation: 0, density: "regular", fxNoise: false, fxGlow: false },
  text: { content: "", fontFamily: "Inter", fontSize: 32, color: "#e6e9ef" },
  color: { productCode: "3001C_BC_UJSST", productId: 1, selectedColorCode: "black", side: "front" },
  product: { id: 1, code: "3001C_BC_UJSST", name: "3001C Bella + Canvas Unisex Jersey Short-Sleeve T-Shirt" }
};

function mergeWithDefaults(saved) {
  const base = structuredClone(defaults);
  if (!saved || typeof saved !== "object") return base;
  return {
    ...base,
    ...saved,
    project: { ...base.project, ...saved.project },
    theme: { ...base.theme, ...saved.theme },
    design: { ...base.design, ...saved.design },
    text: { ...base.text, ...saved.text },
    color: { ...base.color, ...saved.color },
    product: { ...base.product, ...saved.product }
  };
}

function load() {
  try {
    const stored = JSON.parse(localStorage.getItem(LS_KEY));
    return mergeWithDefaults(stored);
  }
  catch {
    return structuredClone(defaults);
  }
}
function save(s) { localStorage.setItem(LS_KEY, JSON.stringify(s)); }

const listeners = new Set();
const state = load();

export function getState() { return JSON.parse(JSON.stringify(state)); }

export function setAt(path, value) {
  const parts = path.split(".");
  let ref = state;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in ref)) ref[parts[i]] = {};
    ref = ref[parts[i]];
  }
  ref[parts.at(-1)] = value;
  save(state);
  const evt = new CustomEvent(EVT_STATE_CHANGED, { detail: { path, value, state: getState() } });
  listeners.forEach((el) => el.dispatchEvent(evt));
}

export function subscribe(el) { listeners.add(el); return () => listeners.delete(el); }
