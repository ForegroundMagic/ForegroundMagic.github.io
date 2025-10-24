import { getState } from "../store.js";
import { EVT_READY, EVT_STATE_CHANGED } from "../events.js";
const host = document.getElementById("tab-host");

function render() {
  const state = getState();
  host.querySelector("#summary").textContent = JSON.stringify(state, null, 2);
}

host.addEventListener(EVT_READY, (e) => { if (e.detail.tab === "export") render(); });
host.addEventListener(EVT_STATE_CHANGED, () => { if (host.dataset.activeTab === "export") render(); });

host.addEventListener("click", (e) => {
  if (e.target.id === "copy") {
    navigator.clipboard.writeText(JSON.stringify(getState(), null, 2));
  }
  if (e.target.id === "download") {
    const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    const name = (getState().project?.name || "design") + "-settings.json";
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    URL.revokeObjectURL(a.href);
  }
});