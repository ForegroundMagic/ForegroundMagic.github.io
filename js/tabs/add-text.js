import { getState, setAt } from "../store.js";
import { EVT_READY } from "../events.js";
const host = document.getElementById("tab-host");
function applyPreview(preview, s){
  preview.textContent = s.text.content || "Live text preview";
  preview.style.fontFamily = s.text.fontFamily;
  preview.style.fontSize = s.text.fontSize + "px";
  preview.style.color = s.text.color;
}
host.addEventListener(EVT_READY, (e) => {
  if (e.detail.tab !== "add-text") return;
  let s = getState();
  const content = host.querySelector("#textContent");
  const fontFamily = host.querySelector("#fontFamily");
  const fontSize = host.querySelector("#fontSize");
  const color = host.querySelector("#textColor");
  const preview = host.querySelector("#textPreview");

  content.value = s.text.content;
  fontFamily.value = s.text.fontFamily;
  fontSize.value = s.text.fontSize;
  color.value = s.text.color;
  applyPreview(preview, s);

  content.addEventListener("input", ()=> { setAt("text.content", content.value); s = getState(); applyPreview(preview, s); });
  fontFamily.addEventListener("change", ()=> { setAt("text.fontFamily", fontFamily.value); s = getState(); applyPreview(preview, s); });
  fontSize.addEventListener("input", ()=> { setAt("text.fontSize", Number(fontSize.value)); s = getState(); applyPreview(preview, s); });
  color.addEventListener("input", ()=> { setAt("text.color", color.value); s = getState(); applyPreview(preview, s); });
});