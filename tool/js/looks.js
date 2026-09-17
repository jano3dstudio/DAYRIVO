'use strict';
let lookDraft = null, lookPresetsDraft = null, lookPaletteDraft = null;
let ownLookDraft = null;
function rememberOwnLook() {
 ownLookDraft = P.clone(lookDraft);
 const option=$('lookSelect').selectedOptions[0];
 if(option && option.value)option.textContent=$('lookSelect').dataset.presetName+' · '+t('angepasst');
 lookMessage(t('Deine Mischung bleibt unter Eigener Look erhalten. Übernehmen speichert sie dauerhaft.'));
}
function displayLook() { return lookDraft || P.currentLook(data); }
function applyLookVisual() {
  const look = displayLook(), root = document.documentElement;
  root.style.setProperty('--accent',look.accent);
  root.style.setProperty('--accent-hover',`color-mix(in srgb, ${look.accent} 82%, white)`);
  // Choose readable text for both very bright and very dark custom accents.
  const channels = look.accent.slice(1).match(/../g).map(hex => {
    const value = parseInt(hex,16)/255; return value <= .04045 ? value/12.92 : ((value+.055)/1.055)**2.4;
  });
  const light = channels[0]*.2126 + channels[1]*.7152 + channels[2]*.0722;
  root.style.setProperty('--accent-ink',light > .179 ? '#000000' : '#ffffff');
  root.style.setProperty('--accent-readable',light > .179 ? look.accent : `color-mix(in srgb, ${look.accent} 45%, white)`);
  root.style.setProperty('--frame-style',look.frame);
}
function refreshLookFields() {
  $('lookAccent').value = lookDraft.accent; $('lookFrame').value = lookDraft.frame;
  P.days.forEach((day,i) => $('lookDay'+i).value = lookDraft.days[day]);
  for (const field of [$('lookAccent'),...P.days.map((day,i) => $('lookDay'+i))]) paintColorField(field,field.value,true);
  $('lookPreview').innerHTML = `<div class="look-preview-heading"><span>DAYRIVO</span><span class="look-preview-badge">${t('Vorschau')}</span></div><div class="look-preview-week">${P.days.map(day => `<div class="look-preview-day" style="--swatch:${lookDraft.days[day]}"><strong>${shortDay(day)}</strong><span class="look-preview-entry"><i></i><b></b><em></em></span><span class="look-preview-entry short"><i></i><b></b></span><div class="look-preview-end"></div></div>`).join('')}</div>`;
  render();
}
function refreshLookList(id = '') {
  $('lookSelect').replaceChildren(new Option(t("Eigener Look"), ''),...lookPresetsDraft.map(preset => new Option(preset.name,preset.id)));
  $('lookSelect').value = id;
  $('lookSelect').dataset.presetName = lookPresetsDraft.find(p=>p.id===id)?.name || t('Eigener Look');
  const selected = lookPresetsDraft.find(preset => preset.id === id);
  $('lookName').value = selected?.name || '';
  $('lookUpdate').disabled = $('lookDelete').disabled = !selected;
  $('looksExport').disabled = lookPresetsDraft.length === 0;
}
function lookMessage(message,error = false) { $('lookMessage').textContent = message; $('lookMessage').classList.toggle('form-error',error); }
function lookName(exceptId = '') {
  const name = $('lookName').value.trim();
  if (!name || name.length > 80) throw new Error(t("Bitte einen Namen mit maximal 80 Zeichen eingeben."));
  if (lookPresetsDraft.some(preset => preset.id !== exceptId && preset.name.toLocaleLowerCase() === name.toLocaleLowerCase())) throw new Error(t("Dieser Preset-Name ist schon vergeben."));
  return name;
}
async function exportLooks(all) {
  try {
    const selected = lookPresetsDraft.find(preset => preset.id === $('lookSelect').value);
    const presets = all ? lookPresetsDraft : [{id:selected?.id || P.uid(),name:$('lookName').value.trim() || t("Eigener Look"),...P.clone(lookDraft)}];
    const contents = JSON.stringify({app:'JS OFFICE WEEK LOOKS',version:1,presets:P.validateLookPresets(presets)},null,2);
    let handle = directoryHandle;
    if (!handle) handle = await connectFolder();
    else if (await handle.queryPermission({mode:'readwrite'}) !== 'granted' && await handle.requestPermission({mode:'readwrite'}) !== 'granted') throw new Error(t("Keine Schreibfreigabe. Bitte den Projektordner im Menü erneut verbinden."));
    const folder = await (await handle.getDirectoryHandle('tool',{create:true})).getDirectoryHandle('looks',{create:true});
    const stamp = new Date().toISOString().replace(/[:.]/g,'-');
    const filename = (all ? 'Alle-Looks' : presets[0].name.replace(/[^a-z0-9äöüß_-]+/gi,'-').slice(0,60)) + '-' + stamp + '-' + P.uid().slice(-6) + '.json';
    const file = await folder.getFileHandle(filename,{create:true}), writable = await file.createWritable();
    try { await writable.write(contents); await writable.close(); }
    catch (error) { try { await writable.abort(); } catch {} throw error; }
    lookMessage(t("Export gespeichert: tool/looks/") + filename);
  } catch (error) { if (error.name !== 'AbortError') lookMessage(t(error.message),true); }
}
function initializeLooks() {
  $('lookDays').innerHTML = P.days.map((day,i) => `<label>${shortDay(day)}<button type="button" class="color-field" id="lookDay${i}" aria-label="${tr`Farbe ${dayLabel(day)}`}"></button></label>`).join('');
  initializeColorEditor();
  $('looksButton').onclick = () => {
    closeMenu(); lookDraft = P.currentLook(data); lookPresetsDraft = P.clone(data.looks);
    try { ownLookDraft = P.validateLook(data.settings.customLook || lookDraft); } catch { ownLookDraft = P.clone(lookDraft); }
    lookPaletteDraft = [...(data.settings.savedColors || [])];
    const matching = lookPresetsDraft.find(preset => JSON.stringify(P.validateLook(preset)) === JSON.stringify(lookDraft));
    if (!matching) ownLookDraft = P.clone(lookDraft);
    refreshLookList(matching?.id); refreshLookFields(); lookMessage('');
    $('looksDialog').querySelector('details').open = false;
    $('looksDialog').showModal();
  };
  $('lookSelect').onchange = () => {
    const id = $('lookSelect').value, preset = lookPresetsDraft.find(p => p.id === id);
    lookDraft = preset ? P.validateLook(preset) : P.clone(ownLookDraft);
    refreshLookList(id); refreshLookFields(); lookMessage('');
  };
  $('lookAccent').oninput = () => { lookDraft.accent = $('lookAccent').value; rememberOwnLook(); refreshLookFields(); };
  $('lookAccent').onclick = () => openColorEditor($('lookAccent'),t('Akzent'));
  $('lookFrame').onchange = () => { lookDraft.frame = $('lookFrame').value; rememberOwnLook(); refreshLookFields(); };
  P.days.forEach((day,i) => {
    $('lookDay'+i).oninput = () => { lookDraft.days[day] = $('lookDay'+i).value; rememberOwnLook(); refreshLookFields(); };
    $('lookDay'+i).onclick = () => openColorEditor($('lookDay'+i),dayLabel(day));
  });
  $('lookReset').onclick = () => { lookDraft = P.defaultLook(); refreshLookList(); refreshLookFields(); lookMessage(''); };
  $('lookCreate').onclick = () => {
    try {
      const name = lookName();
      if (lookPresetsDraft.length >= 100) throw new Error(t("Maximal 100 Looks sind möglich."));
      const preset = {id:P.uid(),name,...P.clone(lookDraft)};
      lookPresetsDraft.push(preset); refreshLookList(preset.id); lookMessage(t("Neues Preset vorbereitet. Mit Übernehmen speichern."));
    } catch (error) { lookMessage(t(error.message),true); }
  };
  $('lookUpdate').onclick = () => {
    try {
      const id = $('lookSelect').value, name = lookName(id), index = lookPresetsDraft.findIndex(p => p.id === id);
      if (index < 0) return;
      lookPresetsDraft[index] = {id,name,...P.clone(lookDraft)};
      refreshLookList(id); lookMessage(t("Preset aktualisiert. Mit Übernehmen speichern."));
    } catch (error) { lookMessage(t(error.message),true); }
  };
  $('lookDelete').onclick = () => {
    lookPresetsDraft = lookPresetsDraft.filter(p => p.id !== $('lookSelect').value);
    refreshLookList(); lookMessage(t("Preset entfernt. Abbrechen macht die Änderung rückgängig."));
  };
  $('lookExport').onclick = () => exportLooks(false);
  $('looksExport').onclick = () => exportLooks(true);
  $('lookImport').onclick = () => $('lookFile').click();
  $('lookFile').onchange = async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 1024*1024) throw new Error(t("Looks-Dateien dürfen maximal 1 MB groß sein."));
      const imported = P.parseLooks(JSON.parse(await file.text()));
      if (!lookPresetsDraft) return;
      if (lookPresetsDraft.length + imported.length > 100) throw new Error(t("Maximal 100 Looks sind möglich."));
      const names = new Set(lookPresetsDraft.map(p => p.name.toLocaleLowerCase()));
      const additions = imported.map(preset => {
        let name = preset.name, n = 2;
        while (names.has(name.toLocaleLowerCase())) name = preset.name.slice(0,70) + ' (' + n++ + ')';
        names.add(name.toLocaleLowerCase()); return {...preset,id:P.uid(),name};
      });
      lookPresetsDraft.push(...additions); lookDraft = P.validateLook(additions[0]);
      refreshLookList(additions[0].id); refreshLookFields(); lookMessage(tr`${additions.length} Looks importiert. Mit Übernehmen speichern.`);
    } catch (error) { lookMessage(t("Import fehlgeschlagen: ")+t(error.message),true); }
    event.target.value = '';
  };
  $('looksForm').onsubmit = event => {
    event.preventDefault();
    const look = P.validateLook(lookDraft), before = {settings:P.clone(data.settings),looks:data.looks};
    data.settings.appearance = {accent:look.accent,frame:look.frame};
    data.settings.savedColors = [...lookPaletteDraft];
    data.settings.customLook = P.clone(ownLookDraft);
    P.days.forEach(day => { data.settings.days[day].color = look.days[day]; });
    data.looks = P.validateLookPresets(lookPresetsDraft);
    if (!persist()) { data.settings = before.settings; data.looks = before.looks; lookMessage(t("Speichern fehlgeschlagen. Bitte erneut versuchen."),true); return; }
    $('looksDialog').close();
  };
  $('looksDialog').addEventListener('close',() => { if ($('colorDialog').open) $('colorDialog').close(); lookDraft = null; lookPresetsDraft = null; lookPaletteDraft = null; render(); });
}
