'use strict';
let nextWeekTarget = null;
function updateNextWeekPreview() {
  const id = $('nextWeekPreset').value, existing = data.weeks[nextWeekTarget];
  const preset = data.presets[id], items = id === '__keep__' ? existing.items : preset.items;
  $('nextWeekInfo').textContent = items.length + ' ' + t('Einträge') + ' · ' + t('Planzeiten');
  const totals = new Map();
  for (const item of items) totals.set(item.cat,(totals.get(item.cat) || 0) + P.duration(item));
  const rows = [...totals].map(([category,minutes])=>({category,minutes,group:P.timeGroup(category,data.masterData)}));
  $('nextWeekBreakdown').innerHTML = [['life','Leben'],['work','Arbeit']].map(([section,label])=>{
    const entries = rows.filter(row=>section === 'work' ? row.group === 'work' : row.group !== 'work');
    entries.sort((a,b)=>categoryLabel(a.category).localeCompare(categoryLabel(b.category),I18N.locale));
    const total = entries.reduce((sum,row)=>sum+row.minutes,0);
    return `<section class="next-week-area" data-time-area="${section}"><div class="next-week-area-heading"><h3>${t(label)}</h3><strong>${P.durationLabel(total)}</strong></div>${entries.length ? `<dl>${entries.map(row=>`<div><dt><i class="group-dot group-${row.group}" aria-hidden="true"></i><span>${esc(categoryLabel(row.category))}</span></dt><dd>${P.durationLabel(row.minutes)}</dd></div>`).join('')}</dl>` : `<p class="next-week-empty">${t('Keine Zeit geplant.')}</p>`}</section>`;
  }).join('');
  const note = document.createElement('p'); note.className = 'dialog-note next-week-note';
  note.textContent = id === '__keep__' ? t('Einträge und Fortschritt bleiben erhalten.') : existing ? t('Ersetzt diese Woche nach Bestätigung.') : t('Neue Woche mit dieser Vorlage anlegen.');
  $('nextWeekBreakdown').append(note);
}
function openNextWeek() {
  closeMenu(); nextWeekTarget = P.addDays(data.selectedWeek,7);
  $('nextWeekError').textContent = '';
  $('nextWeekDate').textContent = tr`KW ${P.weekNumber(nextWeekTarget)} · ${new Date(nextWeekTarget+'T12:00:00').toLocaleDateString(I18N.locale)} – ${new Date(P.addDays(nextWeekTarget,4)+'T12:00:00').toLocaleDateString(I18N.locale)}`;
  const select = $('nextWeekPreset'); select.replaceChildren();
  if (data.weeks[nextWeekTarget]) select.add(new Option(t('Bestehende Woche beibehalten'),'__keep__'));
  for (const preset of Object.values(data.presets)) select.add(new Option(preset.name,preset.id));
  select.value = data.weeks[nextWeekTarget] ? '__keep__' : data.defaultPresetId;
  select.onchange = updateNextWeekPreview; updateNextWeekPreview();
  $('nextWeekForm').onsubmit = event => {
    event.preventDefault();
    const id = select.value, existing = data.weeks[nextWeekTarget];
    if (id !== '__keep__' && existing && !confirm(tr`„${data.presets[id].name}“ auf KW ${P.weekNumber(nextWeekTarget)} anwenden? Die ${existing.items.length} bisherigen Einträge${(existing.planSnapshot || Object.keys(existing.daySnapshots || {}).length) ? t(' und der festgehaltene Ausgangsplan') : ''} werden ersetzt.`)) return;
    const before = P.clone(data);
    try {
      if (id !== '__keep__') P.applyPreset(data,id,nextWeekTarget);
      data.selectedWeek = nextWeekTarget;
      if (!persist()) throw new Error('Speichern fehlgeschlagen. Bitte erneut versuchen.');
      editingPresetId = null; activeSection = 'week'; $('nextWeekDialog').close(); render();
    } catch (error) { data = before; $('nextWeekError').textContent = t(error.message); }
  };
  $('nextWeekDialog').showModal(); select.focus();
}
