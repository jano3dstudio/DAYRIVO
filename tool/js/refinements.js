'use strict';
const lockSVG='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="4" y="9" width="12" height="8" rx="2"/><path d="M6.5 9V6a3.5 3.5 0 0 1 7 0v3"/></svg>';
function renderScopeProgress(week,metrics){
 const percent=metrics.percent,day=activeDay,snapshot=week.daySnapshots?.[day],daily=P.dayMetrics(week,day,data.masterData),diff=P.dayDeviation(week,day);
 const count=diff?.changes.length||0;
 $('sidebarProgress').innerHTML=`<div class="sidebar-kicker"><label for="progressDay">${t('DEIN TAG')}</label></div><div class="day-progress-heading"><select id="progressDay">${P.days.map(d=>`<option value="${d}" ${d===day?'selected':''}>${dayLabel(d)}</option>`).join('')}</select></div><div class="progress-ring" data-scope="day" style="--progress:${daily?.percent??0}%" aria-label="${esc(dayLabel(day)+' · '+t('Planerfüllung'))}"><div><strong>${daily?.percent==null?'—':daily.percent+'<small>%</small>'}</strong><span>${dayLabel(day)}</span></div></div><div class="side-pair"><span>${t('Vom Tagesplan geschafft')}</span><b>${P.durationLabel(daily?.credited||0)}</b></div><div class="side-pair"><span>${t('Zusätzlich geschafft')}</span><b>${P.durationLabel(daily?.extraDoneMinutes||0)}</b></div><p class="day-lock-state ${snapshot?'is-locked':''}">${snapshot?lockSVG:''}${t(snapshot?'Ausgangsplan festgehalten':'Noch nicht gestartet')}</p>${snapshot?`<button type="button" id="showDayChanges" class="day-changes-link">${count?tr`${count} Änderungen · ${diff.delta>0?'+':''}${diff.delta} Min.`:t('Planung unverändert')}</button>`:`<p class="metric-note">${t('Halte morgens deinen Tagesplan fest, um später fair zu vergleichen.')}</p>`}<div class="weekly-progress"><div class="week-progress-heading"><span class="sidebar-kicker">${t('WOCHENFORTSCHRITT')} · ${t('KW')} ${P.weekNumber(data.selectedWeek)}</span><strong>${percent==null?'—':percent+'%'}</strong></div><div class="day-progress-track" role="progressbar" aria-label="${esc(t('WOCHENFORTSCHRITT')+' · '+t('KW')+' '+P.weekNumber(data.selectedWeek))}" aria-valuemin="0" aria-valuemax="100" ${percent==null?'':`aria-valuenow="${percent}"`}><span style="width:${percent??0}%"></span></div><p class="metric-note">${metrics.scope==='day'?tr`${metrics.capturedDays} von 5 Tagesplänen festgehalten.`:metrics.hasPlan?t('Gespeicherter Wochenplan'):t('Noch kein Ausgangsplan.')}</p></div>`;
 $('progressDay').onchange=event=>{activeDay=event.target.value;render();};
 $('showDayChanges')?.addEventListener('click',()=>openDayStart(activeDay));
 $('capturePlanButton').textContent=t(snapshot?'Tagesplan ansehen':'Tag starten');
 $('capturePlanButton').title=t('Ausgangszeiten bleiben die Basis der Planerfüllung.');
 renderRhythm(week);
}
function renderGroupedSummary(){
 const items=currentWeek().items,groups=P.summaryGroups(items,data.masterData),total=items.reduce((n,i)=>n+P.duration(i),0);
 $('summary').innerHTML=`<div class="sidebar-kicker">${t('WOCHE · GEPLANT')}</div><div class="summary-total"><strong>${P.durationLabel(total)}</strong></div>${groups.map(g=>`<div class="stat ${g.id==='work'?'summary-work':''}"><span>${t(g.label)}</span><b>${P.durationLabel(g.minutes)}</b></div>`).join('')}<p class="metric-note">${t('Planstunden aller Einträge. Erfasste Arbeitszeit steht in der Auswertung.')}</p>`;
}
function dayDeviationHTML(week,day){
 const diff=P.dayDeviation(week,day);if(!diff)return `<p class="dialog-note">${t('Nach dem Start siehst du hier Änderungen gegenüber deinem Morgenplan.')}</p>`;
 const when=item=>`${dayLabel(item.day)} · ${item.start}–${item.end}`;
 return `<section class="day-deviation"><div class="deviation-totals"><div><span>${t('Ausgangsplan')}</span><b>${P.durationLabel(diff.planned)}</b></div><div><span>${t('Aktuell geplant')}</span><b>${P.durationLabel(diff.current)}</b></div><div><span>${t('Differenz')}</span><b>${diff.delta>0?'+':''}${diff.delta} ${t('Min.')}</b></div></div><h3>${t('Änderungen seit Tagesstart')}</h3>${diff.changes.length?`<ul>${diff.changes.map(change=>`<li><b>${esc((change.after||change.before).title)}</b><span class="change-kind">${t(change.kind==='added'?'Hinzugekommen':change.kind==='removed'?'Entfernt':'Geändert')}</span>${change.before?`<small>${t('Vorher')}: ${esc(when(change.before))} · ${esc(change.before.title)} · ${esc(categoryLabel(change.before.cat))}</small>`:''}${change.after?`<small>${t('Jetzt')}: ${esc(when(change.after))} · ${esc(categoryLabel(change.after.cat))}</small>`:''}</li>`).join('')}</ul>`:`<p>${t('Planung unverändert')}</p>`}<p class="dialog-note">${t('Du kannst weiter umplanen. Die gesperrten Ausgangszeiten bleiben die Basis der Planerfüllung; Abhaken zählt nicht als Planänderung.')}</p></section>`;
}
function appendDayLock(head,day){
 const snapshot=data.weeks[data.selectedWeek].daySnapshots?.[day];if(!snapshot)return;
 const button=document.createElement('button');button.type='button';button.className='day-lock-badge';
 const changes=P.dayDeviation(data.weeks[data.selectedWeek],day).changes.length;
 button.title=t('Ausgangsplan festgehalten')+(changes?' · '+tr`${changes} Änderungen`:'');button.setAttribute('aria-label',dayLabel(day)+' · '+button.title);
 button.innerHTML=lockSVG+(changes?`<span>${changes}</span>`:'');button.onclick=()=>openDayStart(day);head.append(button);
}
function renderHeaderContext(){
 const week=data.weeks[data.selectedWeek],iso=P.addDays(data.selectedWeek,P.days.indexOf(activeDay));
 const next=week.items.filter(i=>i.day===activeDay&&!i.done).sort((a,b)=>P.minutes(a.start)-P.minutes(b.start))[0];
 const host=$('headerContext');host.replaceChildren();
 if(!editingPresetId&&next){
  const button=document.createElement('button');button.type='button';button.className='next-focus';
  button.innerHTML=`<span>${t('ALS NÄCHSTES')} · ${dayLabel(activeDay)} ${new Date(iso+'T12:00:00').toLocaleDateString(I18N.locale,{day:'2-digit',month:'2-digit'})}</span><b>${next.start} · ${esc(next.title)}</b>`;button.title=t('Eintrag bearbeiten');button.onclick=()=>openItem(next);host.append(button);
 }else if(!editingPresetId){host.textContent=t('Raum für deinen Tag.');}
 const h=data.settings.planningHours;
 $('planningShortcut').textContent=`${t('Tagesansicht')} ${h.start}–${h.end} ↗`;
 $('planningShortcut').title=t('Tageszeitraum unter Settings anpassen');
}
function renderTitleRecords(){
 const host=$('titleRecords'),selected=$('titleRecordId').value;host.replaceChildren();
 const records=data.standardTitles.filter(r=>!r.archived||$('showHiddenTitles').checked);
 for(const record of records){
  const row=document.createElement('div');row.className='title-record'+(record.archived?' archived':'');
  const edit=document.createElement('button');edit.type='button';edit.className='title-record-edit';edit.setAttribute('aria-pressed',String(selected===record.id));edit.innerHTML=`<b>${esc(record.name)}</b><small>${esc(categoryLabel(record.categoryId))}</small>`;edit.onclick=()=>selectTitleRecord(record);
  const toggle=document.createElement('button');toggle.type='button';toggle.textContent=t(record.archived?'Zurückholen':'Ausblenden');toggle.onclick=()=>{
   const before=record.archived;record.archived=!record.archived;if(!persist()){record.archived=before;return;}
   renderTitleRecords();refreshOpenTitleLibrary();$('titleRecordStatus').textContent=t(record.archived?'Vorschlag ausgeblendet. Bestehende Einträge bleiben erhalten.':'Titel wieder in der Auswahl.');
  };
  row.append(edit,toggle);host.append(row);
 }
 if(!records.length)host.textContent=t('Noch keine Titel. Lege deinen ersten Basic an.');
}
function selectTitleRecord(record){
 $('titleRecordId').value=record?.id||'';$('titleRecordName').value=record?.name||'';
 const categories=data.masterData.categories.filter(r=>r.active||r.id===record?.categoryId);
 $('titleRecordCategory').replaceChildren(...categories.map(r=>new Option(categoryLabel(r.id),r.id)));
 if(record)$('titleRecordCategory').value=record.categoryId;
 $('titleRecordStatus').textContent='';renderTitleRecords();
}
function refreshOpenTitleLibrary(){
 if(!$('itemDialog').open)return;
 const id=$('itemTitleType').value,create=$('newStandardTitle').checked;
 fillTitleLibrary({titleId:id});$('newStandardTitle').checked=create;
 const record=data.standardTitles.find(r=>r.id===id);
 if(record){$('itemTitle').value=record.name;refreshCategoryOptions(record.categoryId,true);updateCustomerDetails();}
}
function openTitleManager(){closeMenu();$('showHiddenTitles').checked=false;selectTitleRecord();$('titlesDialog').showModal();}
function initializeRefinements(){
 $('planningShortcut').onclick=openSettings;$('manageTitles').onclick=openTitleManager;$('menuTitles').onclick=openTitleManager;
 $('showHiddenTitles').onchange=renderTitleRecords;$('newTitleRecord').onclick=()=>selectTitleRecord();
 $('titleRecordForm').onsubmit=event=>{
  event.preventDefault();const before=P.clone(data),id=$('titleRecordId').value;
  try{
   const item={title:$('titleRecordName').value.trim(),cat:$('titleRecordCategory').value};
   P.assignTitle(data,item,id,!id);if(!persist())throw new Error('Speichern fehlgeschlagen. Bitte erneut versuchen.');
   selectTitleRecord(data.standardTitles.find(r=>r.id===item.titleId));refreshOpenTitleLibrary();render();$('titleRecordStatus').textContent=t('Titel gespeichert.');
  }catch(error){data=before;$('titleRecordStatus').textContent=t(error.message);}
 };
 $('planningForm').onsubmit=event=>{
  event.preventDefault();const before=P.clone(data.settings.planningHours);
  try{
   data.settings.planningHours={start:$('planningStart').value,end:$('planningEnd').value};P.validateDayform(data);
   if(!persist())throw new Error('Speichern fehlgeschlagen. Bitte erneut versuchen.');render();$('planningStatus').textContent=t('Tageszeitraum gespeichert.');
  }catch(error){data.settings.planningHours=before;$('planningStatus').textContent=t(error.message);}
 };
}
