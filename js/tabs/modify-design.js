import { getState, setAt } from "../store.js";
import { EVT_READY } from "../events.js";
const host = document.getElementById("tab-host");
host.addEventListener(EVT_READY, (e) => {
  if (e.detail.tab !== "modify-design") return;
  const s = getState();
  const scale = host.querySelector("#scale");
  const rotation = host.querySelector("#rotation");
  const density = host.querySelector("#density");
  const fxNoise = host.querySelector("#fxNoise");
  const fxGlow = host.querySelector("#fxGlow");

  scale.value = s.design.scale;
  rotation.value = s.design.rotation;
  density.value = s.design.density;
  fxNoise.checked = s.design.fxNoise;
  fxGlow.checked = s.design.fxGlow;

  scale.addEventListener("input", ()=> setAt("design.scale", Number(scale.value)));
  rotation.addEventListener("input", ()=> setAt("design.rotation", Number(rotation.value)));
  density.addEventListener("change", ()=> setAt("design.density", density.value));
  fxNoise.addEventListener("change", ()=> setAt("design.fxNoise", fxNoise.checked));
  fxGlow.addEventListener("change", ()=> setAt("design.fxGlow", fxGlow.checked));
});