'use strict';
let colorEdit = null;
function colorInk(hex) {
  const rgb = hex.slice(1).match(/../g).map(part => {
    const c = parseInt(part,16)/255; return c <= .04045 ? c/12.92 : ((c+.055)/1.055)**2.4;
  });
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722 > .179 ? '#080d0f' : '#ffffff';
}
function paintColorField(element,hex,code = false) {
  element.style.backgroundColor = hex; element.style.color = colorInk(hex);
  if (code) element.textContent = hex.toUpperCase();
}
function colorToHSV(hex) {
  const [r,g,b] = hex.slice(1).match(/../g).map(c => parseInt(c,16)/255), max = Math.max(r,g,b), min = Math.min(r,g,b), d = max-min;
  let h = d === 0 ? 0 : max === r ? ((g-b)/d)%6 : max === g ? (b-r)/d+2 : (r-g)/d+4;
  return {h:(h*60+360)%360,s:max === 0 ? 0 : d/max,v:max};
}
function colorFromHSV({h,s,v}) {
  const f = n => {const k = (n+h/60)%6;return Math.round(255*(v-v*s*Math.max(0,Math.min(k,4-k,1)))).toString(16).padStart(2,'0');};
  return '#'+f(5)+f(3)+f(1);
}
function normalizedColor(value) {
  const hex = value.trim().replace(/^#/,'');
  return /^[0-9a-f]{6}$/i.test(hex) ? '#'+hex.toLowerCase() : null;
}
function colorValidity(valid) {
  $('colorHex').setAttribute('aria-invalid',String(!valid));
  $('colorApply').disabled = $('colorRemember').disabled = $('colorCopy').disabled = !valid;
  $('colorMessage').classList.toggle('form-error',!valid);
  $('colorMessage').textContent = valid ? 'RGB  '+colorEdit.hex.slice(1).match(/../g).map(c => parseInt(c,16)).join(' / ') : t('Bitte 6 HEX-Zeichen eingeben, z. B. #3CFF91.');
}
function syncColorEditor(updateCode = true) {
  const {h,s,v} = colorEdit.hsv;
  $('colorPlane').style.backgroundColor = colorFromHSV({h,s:1,v:1});
  $('colorCursor').style.left = s*100+'%'; $('colorCursor').style.top = (1-v)*100+'%';
  $('colorHue').value = Math.round(h);
  paintColorField($('colorAfter'),colorEdit.hex);
  if (updateCode) $('colorHex').value = colorEdit.hex.toUpperCase();
  colorValidity(true);
}
function setEditorColor(hex,updateCode = true) {
  const hsv = colorToHSV(hex);
  // Gray and black have no hue; retain the selected hue for the next gesture.
  if (!hsv.s || !hsv.v) hsv.h = colorEdit.hsv.h;
  colorEdit.hex = hex; colorEdit.hsv = hsv; syncColorEditor(updateCode);
}
function renderColorPalette() {
  $('colorPalette').replaceChildren();
  for (let i=0;i<16;i++) {
    const color = colorEdit.palette[i], button = document.createElement('button');
    button.type = 'button'; button.disabled = !color;
    button.setAttribute('aria-label',color ? color.toUpperCase() : t('Freier Farbplatz'));
    if (color) {
      paintColorField(button,color); button.title = color.toUpperCase();
      button.onclick = () => setEditorColor(color);
    }
    $('colorPalette').append(button);
  }
}
function openColorEditor(field,label) {
  colorEdit = {field,initial:field.value,hex:field.value,hsv:colorToHSV(field.value),palette:[...lookPaletteDraft]};
  $('colorTitle').textContent = label; paintColorField($('colorBefore'),field.value);
  syncColorEditor(); renderColorPalette(); $('colorDialog').showModal(); $('colorHex').focus(); $('colorHex').select();
}
function initializeColorEditor() {
  const plane = $('colorPlane'), hue = $('colorHue');
  const applyHSV = () => {colorEdit.hex = colorFromHSV(colorEdit.hsv);syncColorEditor();};
  const point = event => {
    const rect = plane.getBoundingClientRect();
    colorEdit.hsv.s = Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width));
    colorEdit.hsv.v = 1-Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height)); applyHSV();
  };
  plane.onpointerdown = event => {if (event.button !== 0) return; plane.focus();plane.setPointerCapture(event.pointerId);point(event);};
  plane.onpointermove = event => {if (plane.hasPointerCapture(event.pointerId)) point(event);};
  plane.onpointerup = event => {if (plane.hasPointerCapture(event.pointerId)) plane.releasePointerCapture(event.pointerId);};
  plane.onkeydown = event => {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
    event.preventDefault(); const step = event.shiftKey ? .1 : .01;
    const key = ['ArrowLeft','ArrowRight'].includes(event.key) ? 's' : 'v', sign = ['ArrowRight','ArrowUp'].includes(event.key) ? 1 : -1;
    colorEdit.hsv[key] = Math.max(0,Math.min(1,colorEdit.hsv[key]+step*sign)); applyHSV();
  };
  hue.oninput = () => {colorEdit.hsv.h = Number(hue.value);applyHSV();};
  $('colorHex').oninput = () => {
    const hex = normalizedColor($('colorHex').value); if (hex) setEditorColor(hex,false); else colorValidity(false);
  };
  $('colorBefore').onclick = () => setEditorColor(colorEdit.initial);
  $('colorRemember').onclick = () => {
    colorEdit.palette = [colorEdit.hex,...colorEdit.palette.filter(c => c.toLowerCase() !== colorEdit.hex)].slice(0,16);
    renderColorPalette(); $('colorMessage').textContent = t('Farbe gemerkt. Kachel anklicken zum Wiederverwenden.');
  };
  $('colorCopy').onclick = async () => {
    const active = colorEdit;
    try {await navigator.clipboard.writeText(active.hex.toUpperCase()); if (colorEdit === active) $('colorMessage').textContent = t('Farbcode kopiert.');}
    catch {if (colorEdit === active) {$('colorHex').focus();$('colorHex').select();$('colorMessage').textContent = t('Zwischenablage nicht verfügbar. Den HEX-Code bitte direkt kopieren oder einfügen.');}}
  };
  $('colorPaste').onclick = async () => {
    const active = colorEdit;
    try {
      const hex = normalizedColor(await navigator.clipboard.readText()); if (colorEdit !== active) return;
      if (hex) setEditorColor(hex); else $('colorMessage').textContent = t('Kein gültiger HEX-Farbcode in der Zwischenablage.');
    } catch {if (colorEdit === active) {$('colorHex').focus();$('colorHex').select();$('colorMessage').textContent = t('Zwischenablage nicht verfügbar. Den HEX-Code bitte direkt kopieren oder einfügen.');}}
  };
  $('colorForm').onsubmit = event => {
    event.preventDefault(); const hex = normalizedColor($('colorHex').value); if (!hex) {colorValidity(false);return;}
    lookPaletteDraft = [...colorEdit.palette]; colorEdit.field.value = hex; colorEdit.field.dispatchEvent(new Event('input'));
    $('colorDialog').close();
  };
  $('colorDialog').addEventListener('close',() => {const field = colorEdit?.field;colorEdit = null;if ($('looksDialog').open) field?.focus();});
}
