'use strict';
function dayPresetMessage(message,error = false) {
  $('dayPresetMessage').textContent = message; $('dayPresetMessage').classList.toggle('form-error',error);
}
function refreshDayPresets(selected = '') {
  $('dayPresetSelect').replaceChildren(new Option(t("Einträge beibehalten"),''),...data.dayPresets.map(p => new Option(p.name,p.id)));
  $('dayPresetSelect').value = selected;
  previewDayPreset();
}
function previewDayPreset() {
  const preset = data.dayPresets.find(p => p.id === $('dayPresetSelect').value);
  const current = currentWeek().items.filter(item => item.day === editingDay);
  $('deleteDayPreset').disabled = !preset;
  $('dayPresetPreview').hidden = !preset;
  if (!preset) {
    $('dayPresetInfo').textContent = tr`${current.length} Einträge am ${dayLabel(editingDay)}. Ein Preset ersetzt nur diesen Tag${editingPresetId ? t(" im geöffneten Wochenpreset") : t(" in dieser Kalenderwoche")}.`;
    $('dayPresetPreview').replaceChildren(); return;
  }
  const duration = preset.items.reduce((sum,item) => sum + P.duration(item),0);
  $('dayPresetInfo').textContent = tr`${preset.items.length} Einträge · ${P.durationLabel(duration)} · wird beim Speichern auf ${dayLabel(editingDay)} übernommen.`;
  $('dayPresetPreview').innerHTML = preset.items.length ? [...preset.items].sort((a,b) => P.minutes(a.start)-P.minutes(b.start)).map(item => `<div><span>${esc(item.start)}–${esc(item.end)}</span><strong>${esc(item.title)}</strong></div>`).join('') : `<p>${t("Freier Tag – keine Einträge.")}</p>`;
}
function openDayPresets() {
  $('dayPresetName').value = ''; $('dayPresetManage').open = false;
  dayPresetMessage(''); refreshDayPresets();
}
function saveDaySettings() {
  const target = currentWeek(), id = $('dayPresetSelect').value;
  const preset = data.dayPresets.find(p => p.id === id), count = target.items.filter(item => item.day === editingDay).length;
  if (preset && count) {
    const plan = target.planSnapshot ? t("\nDer festgehaltene Ausgangsplan bleibt unverändert. Die neuen Einträge zählen in der Auswertung als zusätzlich.") : '';
    if (!confirm(tr`„${preset.name}“ auf ${dayLabel(editingDay)} anwenden? Die ${count} bisherigen Einträge dieses Tages werden ersetzt.${plan}`)) return;
  }
  const previousItems = target.items, previousSettings = P.clone(data.settings.days[editingDay]);
  try {
    if (id) P.applyDayPreset(data,id,target,editingDay);
    data.settings.days[editingDay] = {subtitle:$('daySubtitle').value.trim(),color:$('dayColor').value};
    if (!persist()) throw new Error(t("Speichern fehlgeschlagen. Bitte erneut versuchen."));
    $('dayDialog').close(); render();
    if (preset) notify(tr`„${preset.name}“ auf ${dayLabel(editingDay)} angewendet.`);
  } catch (error) {
    target.items = previousItems; data.settings.days[editingDay] = previousSettings;
    dayPresetMessage(t(error.message),true);
  }
}
function initializeDayPresets() {
  $('dayPresetSelect').onchange = () => { previewDayPreset(); dayPresetMessage(''); };
  $('saveDayPreset').onclick = () => {
    const before = P.clone(data.dayPresets);
    try {
      const preset = P.createDayPreset(data,$('dayPresetName').value,currentWeek().items.filter(item => item.day === editingDay));
      if (!persist()) throw new Error(t("Tagespreset konnte nicht gespeichert werden."));
      // Saving a copy must not schedule a replacement of the original entries.
      refreshDayPresets(); $('dayPresetName').value = '';
      dayPresetMessage(tr`„${preset.name}“ gespeichert. Jetzt in jedem Tageskopf auswählbar.`);
    } catch (error) { data.dayPresets = before; dayPresetMessage(t(error.message),true); }
  };
  $('deleteDayPreset').onclick = () => {
    const id = $('dayPresetSelect').value, preset = data.dayPresets.find(p => p.id === id);
    if (!preset || !confirm(tr`Tagespreset „${preset.name}“ löschen? Bereits geplante Tage bleiben erhalten.`)) return;
    const before = data.dayPresets;
    data.dayPresets = data.dayPresets.filter(p => p.id !== id);
    if (!persist()) { data.dayPresets = before; dayPresetMessage(t("Löschen fehlgeschlagen."),true); return; }
    refreshDayPresets(); dayPresetMessage(t("Tagespreset gelöscht."));
  };
}
