import { getState, setAt } from "../store.js";
import { EVT_READY } from "../events.js";
const host = document.getElementById("tab-host");
host.addEventListener(EVT_READY, (e) => {
  if (e.detail.tab !== "pick-design") return;
  const s = getState();
  host.querySelectorAll('input[name="design"]').forEach(r => {
    r.checked = (r.value === s.design.name);
    r.addEventListener("change", () => setAt("design.name", r.value));
  });
});