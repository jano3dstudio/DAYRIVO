/* Sidebar, month view and transparent completion reporting. No external services. */
'use strict';
let monthGroup = 'all';
function hoursLabel(minutes) { return (minutes/60).toLocaleString(I18N.locale,{maximumFractionDigits:1}) + ' h'; }
function setSection(section) {
  editingPresetId = null; activeSection = section;
  if (section === 'month') monthCursor = data.selectedWeek.slice(0,7);
  render();
}
function navigatePeriod(direction) {
  if (activeSection === 'month') {
    const date = new Date(monthCursor+'-01T12:00:00'); date.setMonth(date.getMonth()+direction);
    monthCursor = P.dateISO(date).slice(0,7); render();
  } else changeWeek(P.addDays(data.selectedWeek,direction*7));
}
function renderOverview() {
  const isMonth = activeSection === 'month', isWeek = activeSection === 'week';
  document.querySelectorAll('[data-section]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.section===activeSection)));
  document.querySelector('.calendar').hidden = !isWeek;
  $('mobileTabs').hidden = !isWeek;
  $('monthPanel').hidden = !isMonth;
  $('insightsPanel').hidden = activeSection !== 'insights';
  $('summary').hidden = !isWeek;
  $('capturePlanButton').hidden = isMonth || !!editingPresetId;
  $('nextWeekButton').hidden = !isWeek || !!editingPresetId;
  $('previousWeek').setAttribute('aria-label',isMonth ? t("Vorheriger Monat") : t("Vorherige Woche"));
  $('followingWeek').setAttribute('aria-label',isMonth ? t("Nächster Monat") : t("Nächste Woche"));
  if (isMonth) {
    monthCursor ||= data.selectedWeek.slice(0,7);
    $('weekLabel').textContent = new Date(monthCursor+'-01T12:00:00').toLocaleDateString(I18N.locale,{month:'long',year:'numeric'});
    $('weekNumber').textContent = t("/ Monat");
    const month = P.monthMetrics(data,monthCursor);
    $('sidebarProgress').innerHTML = `<div class="sidebar-kicker">${t("MONAT IM BLICK")}</div><div class="month-total">${P.durationLabel(month.planned)}</div><p>${t("Alle Bereiche · geplant")}</p><div class="side-pair"><span>${t("Abgehakt")}</span><b>${P.durationLabel(month.done)}</b></div><div class="side-pair"><span>${t("Einträge")}</span><b>${month.count}</b></div><p class="metric-note">${t("Nur gespeicherte Wochen. Abgehakte Planstunden sind keine gemessene Arbeitszeit.")}</p>`;
    renderMonth(month); return;
  }
  const week = data.weeks[data.selectedWeek], metrics = P.weekMetrics(week);
  $('capturePlanButton').disabled = false;
  $('capturePlanButton').textContent = t('Tag starten');
  if (editingPresetId) {
    $('sidebarProgress').innerHTML = `<div class="sidebar-kicker">${t("VORLAGE")}</div><h3>${t("Deine Basiswoche.")}</h3><p>${t("Hier bearbeitest du ein Preset. Deine Kalenderwochen und ihr Fortschritt bleiben davon unabhängig.")}</p>`;
    return;
  }
  renderScopeProgress(week,metrics);
  if (activeSection === 'insights') { $('weekNumber').textContent = t("/ KW ")+P.weekNumber(data.selectedWeek)+t(" · Auswertung"); renderInsights(week,metrics); }
}
function renderMonth(month) {
  const first = (new Date(monthCursor+'-01T12:00:00').getDay()+6)%7;
  const groups = month.groups.filter(group => group.id !== 'other' || group.count || monthGroup === 'other');
  const selected = month.groups.find(group => group.id === monthGroup);
  const totals = groups.map(group => `<button class="month-group-card" data-month-group="${group.id}" aria-pressed="${monthGroup===group.id}"><span class="month-group-title"><i class="group-dot group-${group.id}" aria-hidden="true"></i>${t(group.label)}</span><strong>${P.durationLabel(group.planned)}</strong><span class="month-group-done">${t("Abgehakt")} <b>${P.durationLabel(group.done)}</b></span><span class="month-group-meter group-${group.id}" style="--share:${group.planned ? Math.round(group.done/group.planned*100) : 0}%"></span></button>`).join('');
  const cells = [], cellCount = Math.ceil((first+month.dates.length)/7)*7;
  for (let cell=0;cell<cellCount;cell++) {
    if (cell%7===0) {
      const iso = P.addDays(monthCursor+'-01',cell-first);
      cells.push(`<div class="month-week-index" aria-label="${t('KW')} ${P.weekNumber(iso)}">${P.weekNumber(iso)}</div>`);
    }
    const day = month.dates[cell-first];
    if (!day) { cells.push('<div class="month-empty" aria-hidden="true"></div>'); continue; }
    const weekend = day.dayIndex>=5, isToday = day.iso===P.dateISO(new Date());
    const visibleGroups = day.groups.filter(group => group.planned && (monthGroup === 'all' || group.id === monthGroup));
    const buckets = visibleGroups.map(group => `<span class="month-bucket group-${group.id}" title="${t(group.label)}: ${P.durationLabel(group.planned)} · ${t('Abgehakt')}: ${P.durationLabel(group.done)}"><i class="group-dot" aria-hidden="true"></i><span class="bucket-label">${t(group.label)}</span><b>${P.durationLabel(group.planned)}</b></span>`).join('');
    const accessible = visibleGroups.map(group => `${t(group.label)}: ${P.durationLabel(group.planned)}`).join(', ');
    const blank = weekend ? '' : !day.recorded ? t('Ungeplant') : day.planned ? '—' : t('Keine Einträge');
    cells.push(`<button class="month-day${weekend ? ' weekend' : ''}${isToday ? ' today' : ''}${!visibleGroups.length ? ' month-day-quiet' : ''}" data-date="${day.iso}" ${weekend ? 'disabled' : ''} aria-label="${esc(tr`${day.iso}, ${day.items.length} Einträge, Woche öffnen`)}${accessible ? ', '+esc(accessible) : ''}"><span class="month-day-number">${Number(day.iso.slice(-2))}</span><span class="month-buckets">${buckets || `<span class="month-blank-label">${blank}</span>`}</span></button>`);
  }
  const assignment = P.timeGroups.map(group => `<span><b><i class="group-dot group-${group.id}" aria-hidden="true"></i>${t(group.label)}</b>${data.masterData.categories.filter(record=>record.group === group.id).map(record=>categoryLabel(record.id)).map(esc).join(' · ')}</span>`).join('');
  $('monthPanel').innerHTML = `<div class="panel-intro"><div><h2>${t("Der Monat auf einen Blick.")}</h2><p>${t('Deine Planzeiten, nach Lebensbereichen getrennt.')}</p></div><span class="quiet-badge">${t('Stunden : Minuten')}</span></div><div class="month-group-cards" aria-label="${t('Bereiche filtern')}">${totals}</div><div class="month-filter-line"><button data-month-group="all" aria-pressed="${monthGroup==='all'}">${t('Alle Bereiche')}</button><span>${selected ? t(selected.label)+' · '+P.durationLabel(selected.planned) : t('Bereich anklicken, um den Kalender zu filtern.')}</span></div><div class="month-grid month-grid-grouped"><div class="month-week-heading">${t('KW')}</div>${['Mo','Di','Mi','Do','Fr','Sa','So'].map(day=>`<div class="month-weekday">${t(day)}</div>`).join('')}${cells.join('')}</div><div class="month-footer"><p>${t('Planzeiten pro Eintrag · Abgehakte Zeiten sind keine gemessene Arbeitszeit. Ein Klick auf einen Tag öffnet seine Woche.')}</p><details class="month-assignment"><summary>${t('So sind die Kategorien zugeordnet')}</summary><div>${assignment}<span><b>${t('Sonstiges')}</b>${t('Weitere Kategorien aus importierten Einträgen.')}</span></div></details></div>`;
  $('monthPanel').querySelector('.month-group-cards').insertAdjacentHTML('afterend',financeSummary(month.dates.flatMap(day=>day.items),'Dieser Monat'));
  $('monthPanel').querySelectorAll('[data-month-group]').forEach(button => {
    button.onclick = () => {
      const group = button.dataset.monthGroup;
      monthGroup = monthGroup === group ? 'all' : group;
      const scrollTop = $('monthPanel').scrollTop;
      renderMonth(month); $('monthPanel').scrollTop = scrollTop;
      $('monthPanel').querySelector(`[data-month-group="${group}"]`)?.focus({preventScroll:true});
    };
  });
  $('monthPanel').querySelectorAll('[data-date]:not(:disabled)').forEach(button=>{
    button.onclick = () => {
      const iso = button.dataset.date; activeDay = P.days[(new Date(iso+'T12:00:00').getDay()+6)%7];
      activeSection = 'week'; changeWeek(P.mondayISO(iso));
    };
  });
}
function renderInsights(week,metrics) {
  renderPlanComparison(week,metrics);
  const comparison = dayReviewHTML(week) + $('insightsPanel').innerHTML;
  const done = week.items.filter(item=>item.done), groups = P.groupedTime(done,data.masterData).filter(group=>group.count);
  const actual = P.recordedWorkMetrics(done,data.masterData);
  const groupCards = groups.map(group=>`<article class="group-${group.id}"><span>${t(group.label)}</span><strong>${P.durationLabel(group.id==='work' ? actual.minutes : group.done)}</strong><small>${group.id==='work' ? t('Erfasst · abgehakte Jobs') : t('Planzeit · abgehakt')}</small></article>`).join('');
  const rows = [...new Set(done.map(item=>item.cat))].map(cat=>{
    const entries = done.filter(item=>item.cat===cat);
    const work = P.timeGroup(cat,data.masterData)==='work', values = P.recordedWorkMetrics(entries,data.masterData);
    return `<tr><th>${esc(categoryLabel(cat))}</th><td>${entries.length}</td><td>${P.durationLabel(work ? values.minutes : entries.reduce((sum,item)=>sum+P.duration(item),0))}<span class="completed-time-kind">${work ? t('Erfasst') : t('Planzeit')}${values.missingTimeCount ? ' · '+tr`Noch nicht erfasst: ${values.missingTimeCount}` : ''}</span></td></tr>`;
  }).join('');
  $('insightsPanel').innerHTML = `<div class="panel-intro"><div><span class="sidebar-kicker">${t('DEIN WOCHENRÜCKBLICK')}</span><h2>${t('Das hast du erledigt.')}</h2><p>${t('Nur abgehakte Einträge dieser Woche.')}</p></div><span class="quiet-badge">${done.length} ${t('Einträge')}</span></div>${financeSummary(done,'Diese Woche')}<div class="insight-cards completed-cards">${groupCards}</div>${done.length ? `<section class="analysis-table-wrap"><div class="section-heading"><h3>${t('Erledigt nach Kategorie')}</h3></div><table class="analysis-table"><thead><tr><th>${t('Bereich')}</th><th>${t('Einträge')}</th><th>${t('Zeit')}</th></tr></thead><tbody>${rows}</tbody></table></section>` : `<p class="analysis-explanation">${t('Noch nichts abgehakt. Erledigte Einträge erscheinen hier automatisch.')}</p>`}<details class="plan-comparison"><summary>${t('Vergleich mit dem Ausgangsplan')}</summary>${comparison}</details>`;
  const capture = $('analysisCapture'); if (capture) capture.onclick = openCaptureDialog;
}
function renderPlanComparison(week,metrics) {
  const snapshot = metrics.snapshot || week.planSnapshot;
  if (!snapshot) {
    $('insightsPanel').innerHTML = `<div class="analysis-empty"><span class="sidebar-kicker">${t("DEIN AUSGANGSPUNKT")}</span><h2>${t("Was du vorhattest.")}<br>${t("Was du geschafft hast.")}</h2><p>${t('Halte morgens deinen Tagesplan fest, bevor du Aufgaben abhakst. Deine Woche fasst die gestarteten Tage zusammen.')}</p><button id="analysisCapture" class="primary">${t('Tag starten')}</button><small>${t("Der Vergleich beginnt mit dem jetzt gespeicherten Stand. Frühere Wochenanfänge werden nicht rekonstruiert.")}</small></div>`;
    $('analysisCapture').onclick = openCaptureDialog; return;
  }
  const date = new Date(snapshot.capturedAt).toLocaleString(I18N.locale,{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const cards = [[t("Ausgangsplan"),hoursLabel(metrics.planned),t("festgehaltener Umfang")],[t("Davon geschafft"),hoursLabel(metrics.credited),tr`${metrics.percent === null ? '—' : metrics.percent+' %'} des Ausgangsplans`],[t("Noch offen"),hoursLabel(metrics.openMinutes),t("inklusive gelöschter Plan-Einträge")],[t("Zusätzlich geschafft"),hoursLabel(metrics.extraDoneMinutes),t("neue Einträge nach dem Festhalten")]];
  $('insightsPanel').innerHTML = `<div class="panel-intro"><div><span class="sidebar-kicker">${t("DEIN WOCHENRÜCKBLICK")}</span><h2>${t("Wie viel von deinem Plan ist geschafft?")}</h2><p>${t("Ausgangsplan vom")} ${date}${snapshot.preset ? t(" · Vergleich: ")+esc(snapshot.preset.name) : t(" · ohne Preset-Vergleich")}.</p></div></div><div class="insight-cards">${cards.map(([title,value,note])=>`<article><span>${title}</span><strong>${value}</strong><small>${note}</small></article>`).join('')}</div><section class="analysis-table-wrap"><div class="section-heading"><h3>${t("Deine Bereiche")}</h3><span>${t("Stunden nach ursprünglicher Zuordnung")}</span></div><table class="analysis-table"><thead><tr><th>${t("Bereich")}</th><th>Preset</th><th>${t("Ausgangsplan")}</th><th>${t("Davon geschafft")}</th><th>${t("Jetzt geplant")}</th></tr></thead><tbody>${metrics.categories.map(row=>`<tr><th>${esc(categoryLabel(row.cat))}</th><td>${row.preset===null ? '—' : hoursLabel(row.preset)}</td><td>${hoursLabel(row.planned)}</td><td class="achievement">${hoursLabel(row.credited)}<span class="table-progress" style="--progress:${row.planned ? Math.round(row.credited/row.planned*100) : 0}%"></span></td><td>${hoursLabel(row.current)}</td></tr>`).join('')}</tbody></table></section><div class="plan-changes"><span><b>${metrics.changedCount}</b> ${t("Plan-Einträge verändert")}</span><span><b>${metrics.removedCount}</b> ${t("Plan-Einträge gelöscht")}</span><span><b>${metrics.extraCount}</b> ${t("Einträge hinzugekommen")}</span></div><p class="analysis-explanation">${t("Planerfüllung = ursprüngliche Plandauer der abgehakten Plan-Einträge ÷ gesamte ursprüngliche Plandauer. Verschieben und Kürzen ändern das Gewicht nicht; Löschen verkleinert das Wochenziel nicht. Zusätzliche Aufgaben stehen separat. Das misst erledigte Planung, keine tatsächlichen Arbeitsstunden. Der gespeicherte Preset-Stand bleibt auch nach späteren Preset-Änderungen erhalten.")}</p>`;
}
function openCaptureDialog() {
  openDayStart();
}
function initializeOverview() {
  document.querySelectorAll('[data-section]').forEach(button=>{button.onclick = ()=>setSection(button.dataset.section);});
  $('capturePlanButton').onclick = openCaptureDialog;
  $('captureForm').onsubmit = event => {
    event.preventDefault();
    const week = data.weeks[data.selectedWeek], id = $('capturePreset').value;
    try {
      P.capturePlan(week,id==='source' ? week.sourcePreset : id==='none' ? null : data.presets[id]);
      persist(); $('captureDialog').close(); render(); notify(t("Ausgangsplan festgehalten. Spätere Änderungen werden damit verglichen."));
    } catch (error) { notify(t(error.message),true); }
  };
}
