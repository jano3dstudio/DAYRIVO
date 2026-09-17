'use strict';
const completionSVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><path class="completion-tick" d="m7 12 3.4 3.4L17 8.5"/></svg>';
function syncDayFooters(){
 const host=$('dayFooters'),cal=document.querySelector('.calendar');
 host.hidden=activeSection!=='week';
 if(host.hidden)return;
 const b=cal.getBoundingClientRect();
 host.style.left=b.left+'px';host.style.top=b.bottom-27+'px';host.style.width=b.width+'px';
 host.replaceChildren();
 for(const track of document.querySelectorAll('.day-track')){
  const r=track.getBoundingClientRect();if(!r.width)continue;
  const stripe=document.createElement('span');
  stripe.style.left=r.left-b.left+6+'px';stripe.style.width=Math.max(0,r.width-12)+'px';
  stripe.style.background=getComputedStyle(track).getPropertyValue('--day-color');host.append(stripe);
 }
}
function celebrateCompletion(card,previousPercent,origin){
 celebrateRhythm(card);
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const control=card?.querySelector('.item-completion'),r=control?.getBoundingClientRect();
 control?.animate([{transform:'scale(.75)'},{transform:'scale(1.18)',offset:.65},{transform:'scale(1)'}],{duration:300,easing:'ease-out'});
 if(r&&r.bottom>0&&r.top<innerHeight){
  const color=getComputedStyle(card).getPropertyValue('--day-color');
  for(let i=0;i<24;i++){
   const piece=document.createElement('i');piece.className='completion-confetti';
   piece.style.left=(origin?.x??r.left+r.width/2)+'px';piece.style.top=(origin?.y??r.top+r.height/2)+'px';piece.style.background=i%4===0?'#e2efaf':i%4===1?'var(--accent)':color;
   document.body.append(piece);
   const angle=i*2.399963,radius=45+(i%7)*13,x=Math.cos(angle)*radius,y=Math.sin(angle)*radius;
   piece.style.width=(3+i%3)+'px';piece.style.height=(4+i%5)+'px';
   const animation=piece.animate([{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${x}px,${y}px) rotate(${i*43}deg)`,opacity:.9,offset:.7},{transform:`translate(${x*1.12}px,${y+18}px) rotate(${i*65}deg)`,opacity:0}],{duration:620+(i%7)*24,easing:'cubic-bezier(.15,.6,.3,1)'});
   animation.onfinish=()=>piece.remove();animation.oncancel=()=>piece.remove();
  }
 }
 const ring=$('sidebarProgress').querySelector('.progress-ring'),percent=P.dayMetrics(data.weeks[data.selectedWeek],activeDay,data.masterData)?.percent??null;
 if(ring&&percent!==null&&previousPercent!==null&&percent>previousPercent){
  ring.animate([{'--progress':previousPercent+'%',transform:'scale(1)'},{'--progress':percent+'%',transform:'scale(1.045)',offset:.8},{'--progress':percent+'%',transform:'scale(1)'}],{duration:650,easing:'ease-out'});
  const number=ring.querySelector('strong'),begin=performance.now();
  const step=now=>{if(!number.isConnected)return;const f=Math.min(1,(now-begin)/600),value=Math.round(previousPercent+(percent-previousPercent)*(1-(1-f)**3));number.innerHTML=value+'<small>%</small>';if(f<1)requestAnimationFrame(step);};
  requestAnimationFrame(step);
 }
}
function fillTitleLibrary(item){
 const select=$('itemTitleType');
 select.replaceChildren(new Option(t('Eigener Titel'),''));
 for(const record of data.standardTitles.filter(r=>!r.archived||r.id===item?.titleId))select.add(new Option(record.name,record.id));
 select.value=item?.titleId||'';$('newStandardTitle').checked=false;updateTitleHint();
}
function updateTitleHint(){
 const id=$('itemTitleType').value,record=data.standardTitles.find(r=>r.id===id);
 $('newStandardLabel').hidden=!!record;
 const count=record?P.editableItems(data).filter(i=>i.titleId===id).length:0;
 $('titleScopeHint').textContent=record?tr`Standardtitel: Titel und Kategorie werden für ${count} verknüpfte Einträge und Vorlagen gemeinsam geändert. Zeiten und Beschreibungen bleiben individuell.`:t('Eigener Titel: Änderungen gelten nur für diesen Eintrag.');
}
function dayReviewHTML(week){
 const rows=P.days.filter(day=>week.daySnapshots?.[day]).map(day=>{
  const m=P.dayMetrics(week,day,data.masterData),difference=m.actual-m.estimated;
  return `<div><span>${dayLabel(day)}</span><strong>${m.percent===null?'—':m.percent+'%'}</strong><small>${m.measuredCount?tr`Zeitabweichung: ${difference>0?'+':''}${difference} Min.`:t('Noch keine vergleichbaren Ist-Zeiten.')}</small></div>`;
 }).join('');
 return rows?`<section><h3>${t('Deine gestarteten Tage')}</h3><div class="day-review-grid">${rows}</div><p class="daily-status-note">${t('Zeitvergleich nur für erledigte Arbeit mit eingetragener Ist-Zeit. Spontane Aufgaben zählen separat.')}</p></section>`:'';
}
function openDayStart(day=activeDay){
 if(!P.days.includes(day))day=activeDay;
 closeMenu();const select=$('startDaySelect');
 select.replaceChildren(...P.days.map(day=>new Option(dayLabel(day),day)));select.value=day;
 updateDayStart();$('dayStartDialog').showModal();
}
function updateDayStart(){
 const week=data.weeks[data.selectedWeek],day=$('startDaySelect').value,snapshot=week.daySnapshots?.[day],items=week.items.filter(i=>i.day===day);
 $('startDayInfo').textContent=snapshot?tr`Festgehalten am ${new Date(snapshot.capturedAt).toLocaleString(I18N.locale)}.`:tr`${items.length} Einträge · ${P.durationLabel(items.reduce((n,i)=>n+P.duration(i),0))} geplant.`;
 $('startDayCommit').disabled=!!snapshot||items.some(i=>i.done);
 $('startDayMessage').textContent=items.some(i=>i.done)&&!snapshot?t('Bitte den Tagesplan vor dem ersten Abhaken festhalten.'):t('Der Startplan bleibt erhalten, auch wenn du später verschiebst oder kürzt. Bereits an einem anderen Tag festgehaltene Aufgaben werden nicht doppelt gezählt.');
 $('dayStartReview').innerHTML=dayDeviationHTML(week,day);
 $('startDayInfo').classList.toggle('is-locked',!!snapshot);
 $('dayStartTitle').textContent=t(snapshot?'Tagesplan ansehen':'Tag starten')+' · '+dayLabel(day);
 $('startDayCommit').textContent=t(snapshot?'Ausgangsplan gesperrt':'Tagesplan festhalten');
}
function refreshResetInfo(){
 const scope=$('resetScope').value,weeks=scope==='all'?Object.values(data.weeks):[data.weeks[data.selectedWeek]];
 const count=weeks.reduce((n,w)=>n+w.items.length,0),reminders=weeks.reduce((n,w)=>n+(w.reminders?.length||0),0);
 $('resetInfo').textContent=tr`${weeks.length} Woche(n), ${count} Einträge und ${reminders} Quick-To-dos. Erfasste Zeiten und Ausgangspläne dieser Wochen werden ebenfalls gelöscht. Presets, Standardtitel, Stammdaten und Looks bleiben erhalten.`;
 $('resetConfirm').value='';$('resetCommit').disabled=true;$('settingsMessage').textContent='';
}
function openSettings(){
 closeMenu();$('resetScope').value='week';refreshResetInfo();
 $('planningStart').value=data.settings.planningHours.start;$('planningEnd').value=data.settings.planningHours.end;$('planningStatus').textContent='';
 $('undoReset').hidden=!localStorage.getItem(STORAGE_KEY+'_beforeReset');$('settingsDialog').showModal();
}
function renderWelcome(){
 const host=$('welcomeChoices');host.replaceChildren();
 const selected=$('welcomePreset').value||'df-balance';
 for(const preset of Object.values(data.presets).filter(p=>p.builtin)){
  const button=document.createElement('button');button.type='button';button.dataset.preset=preset.id;
  button.setAttribute('aria-pressed',String(selected===preset.id));
  button.innerHTML=`<b>${esc(t(preset.name))}</b><span>${preset.items.length} ${t('Einträge')} · ${P.durationLabel(preset.items.reduce((n,i)=>n+P.duration(i),0))}</span>`;
  button.onclick=()=>{$('welcomePreset').value=preset.id;renderWelcome();};host.append(button);
 }
 $('welcomePreset').value=selected;
}
function initializeDayform(){
 const menuSymbol=dropdown=>`<svg class="menu-symbol" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${dropdown?'m5 8 5 5 5-5':'M5 15 15 5M6 5h9v9'}"/></svg>`;
 for(const id of ['nextWeekButton','looksButton','menuButton','languageButton']){
  const target=$(id).querySelector('span[aria-hidden]');target.innerHTML=menuSymbol($(id).getAttribute('aria-haspopup')==='menu');target.classList.add('menu-symbol-wrap');
 }
 for(const button of $('menu').querySelectorAll('button')){
  button.querySelector('span')?.remove();const arrow=document.createElement('span');arrow.innerHTML=menuSymbol(false);arrow.setAttribute('aria-hidden','true');button.append(arrow);button.setAttribute('aria-haspopup','dialog');
 }
 document.querySelector('.calendar').addEventListener('scroll',syncDayFooters,{passive:true});
 $('itemTitleType').onchange=()=>{
  const record=data.standardTitles.find(r=>r.id===$('itemTitleType').value);
  if(record){$('itemTitle').value=record.name;refreshCategoryOptions(record.categoryId,true);updateCustomerDetails();}
  updateTitleHint();
 };
 $('menuSettings').onclick=openSettings;
 $('startDaySelect').onchange=updateDayStart;
 $('dayStartForm').onsubmit=event=>{
  event.preventDefault();const before=P.clone(data);
  try{P.captureDay(data.weeks[data.selectedWeek],$('startDaySelect').value);activeDay=$('startDaySelect').value;if(!persist())throw new Error('Speichern fehlgeschlagen. Bitte erneut versuchen.');$('dayStartDialog').close();render();}
  catch(error){data=before;$('startDayMessage').textContent=t(error.message);}
 };
 $('settingsBackup').onclick=backup;
 $('resetScope').onchange=refreshResetInfo;
 $('resetConfirm').oninput=()=>{$('resetCommit').disabled=$('resetConfirm').value.trim()!=='RESET';};
 $('resetForm').onsubmit=event=>{
  event.preventDefault();if($('resetConfirm').value.trim()!=='RESET')return;
  const before=P.clone(data);
  try{
   localStorage.setItem(STORAGE_KEY+'_beforeReset',JSON.stringify(before));
   data=P.clearPlanning(before,$('resetScope').value);if(!persist())throw new Error('Speichern fehlgeschlagen. Bitte erneut versuchen.');
   editingPresetId=null;activeSection='week';render();refreshResetInfo();$('undoReset').hidden=false;$('settingsMessage').textContent=t('Planungsdaten gelöscht. Der letzte Stand kann hier wiederhergestellt werden.');
  }catch(error){data=before;$('settingsMessage').textContent=t(error.message);}
 };
 $('undoReset').onclick=()=>{
  if(!confirm(t('Stand vor dem letzten Zurücksetzen wiederherstellen? Änderungen seitdem werden ersetzt.')))return;
  const before=data;
  try{data=P.ensureDayform(P.validateData(JSON.parse(localStorage.getItem(STORAGE_KEY+'_beforeReset'))));if(!persist())throw new Error('Speichern fehlgeschlagen. Bitte erneut versuchen.');refreshLanguageUI();render();refreshResetInfo();$('settingsMessage').textContent=t('Stand wiederhergestellt.');}
  catch(error){data=before;$('settingsMessage').textContent=t(error.message);}
 };
 $('welcomeForm').onsubmit=event=>{
  event.preventDefault();const before=P.clone(data);
  try{
   const id=$('welcomePreset').value;P.applyPreset(data,id,data.selectedWeek);data.defaultPresetId=id;data.settings.needsWelcome=false;
   if(!persist())throw new Error('Speichern fehlgeschlagen. Bitte erneut versuchen.');$('welcomeDialog').close();render();
  }catch(error){data=before;$('welcomeError').textContent=t(error.message);}
 };
 if(data.settings.needsWelcome&&!loadError){renderWelcome();$('welcomeDialog').showModal();}
}
