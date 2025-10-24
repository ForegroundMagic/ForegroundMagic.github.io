import { getState } from "./store.js";
import { EVT_READY } from "./events.js";

const host = document.getElementById("tab-host");
const nav = document.querySelector(".tab-nav");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");

const order = ["welcome","pick-product","pick-color","pick-design","modify-design","add-text","export"];
let current = order[0];

async function loadTab(id) {
  // load CSS per tab
  const cssId = `css-${id}`;
  if (!document.getElementById(cssId)) {
    const link = document.createElement("link");
    link.id = cssId;
    link.rel = "stylesheet";
    link.href = `/css/tab-${id}.css`;
    document.head.appendChild(link);
  }
  // fetch partial
  const html = await fetch(`/tabs/${id}.html`).then(r => r.text());
  host.innerHTML = html;
  host.dataset.activeTab = id;

  // lazy load tab JS
  try {
    await import(`/js/tabs/${id}.js`);
  }
  catch (err) {
    console.error(`Failed loading script for ${id} tab`, err);
  }

  // update nav state
  nav.querySelectorAll('[role="tab"]').forEach(btn => btn.setAttribute("aria-selected", String(btn.dataset.tab === id)));

  // notify ready
  host.dispatchEvent(new CustomEvent(EVT_READY, { detail: { tab: id, state: getState() } }));
  host.focus();
}

nav.addEventListener("click", (e) => {
  const btn = e.target.closest('[role="tab"]');
  if (!btn) return;
  current = btn.dataset.tab;
  loadTab(current);
});

nextBtn.addEventListener("click", () => {
  const i = order.indexOf(current); if (i < order.length - 1) { current = order[i+1]; loadTab(current); }
});
prevBtn.addEventListener("click", () => {
  const i = order.indexOf(current); if (i > 0) { current = order[i-1]; loadTab(current); }
});

// keyboard shortcuts
window.addEventListener("keydown", (e) => {
  if (e.altKey && e.key === "ArrowRight") nextBtn.click();
  if (e.altKey && e.key === "ArrowLeft") prevBtn.click();
});

// bootstrap
loadTab(current);
