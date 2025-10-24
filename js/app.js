import { getState } from "./store.js";
import { EVT_READY } from "./events.js";

const host = document.getElementById("tab-host");
const nav = document.querySelector(".tab-nav");
const nextBtn = document.querySelector('[data-edge-nav="next"]');
const prevBtn = document.querySelector('[data-edge-nav="prev"]');

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
  updateEdgeNavState(order.indexOf(id));

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

function goToNext() {
  const i = order.indexOf(current);
  if (i < order.length - 1) {
    current = order[i + 1];
    loadTab(current);
  }
}

function goToPrevious() {
  const i = order.indexOf(current);
  if (i > 0) {
    current = order[i - 1];
    loadTab(current);
  }
}

nextBtn?.addEventListener("click", goToNext);
prevBtn?.addEventListener("click", goToPrevious);

// keyboard shortcuts
window.addEventListener("keydown", (e) => {
  if (e.altKey && e.key === "ArrowRight") goToNext();
  if (e.altKey && e.key === "ArrowLeft") goToPrevious();
});

function updateEdgeNavState(index) {
  if (prevBtn) {
    const disabled = index <= 0;
    prevBtn.disabled = disabled;
    prevBtn.setAttribute("aria-disabled", String(disabled));
    prevBtn.classList.toggle("is-disabled", disabled);
  }
  if (nextBtn) {
    const disabled = index >= order.length - 1;
    nextBtn.disabled = disabled;
    nextBtn.setAttribute("aria-disabled", String(disabled));
    nextBtn.classList.toggle("is-disabled", disabled);
  }
}

// bootstrap
loadTab(current);
