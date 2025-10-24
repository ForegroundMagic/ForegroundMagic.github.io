import { EVT_READY } from "../events.js";
const host = document.getElementById("tab-host");
host.addEventListener(EVT_READY, (e) => {
  if (e.detail.tab !== "welcome") return;
  // placeholder: nothing to wire yet
});