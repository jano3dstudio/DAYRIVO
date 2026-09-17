'use strict';
function rhythmSun(state){
 const rays=Array.from({length:12},(_,i)=>`<path class="sun-ray ${i<state.rays?'lit':''}" d="M24 4v5" transform="rotate(${i*30} 24 24)"/>`).join('');
 return `<svg class="rhythm-sun" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">${rays}<circle class="sun-core ${state.highlight?.done?'lit':''}" cx="24" cy="24" r="9"/>${state.highlight?.done?'<path class="sun-star" d="m24 17 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/>':''}</svg>`;
}
function renderRhythm(week){
 const state=P.dayRhythm(week,activeDay,data.masterData),weekly=$('sidebarProgress').querySelector('.weekly-progress');if(!weekly)return;
 const highlight=document.createElement('button');highlight.type='button';highlight.id='dayHighlightButton';highlight.className='day-highlight'+(state.highlight?.done?' achieved':'');
 highlight.innerHTML=`<span>✦ ${t('DEIN TAGESHIGHLIGHT')}</span><b>${esc(state.highlight?.title||t('Was ist dir heute wichtig?'))}</b><small>${state.highlight?t(state.highlight.done?'Geschafft. Das zählt.':state.highlight.missing?'Eintrag entfernt · neu wählen':state.highlight.moved?'Verschoben · bleibt dein Highlight':'Ein Highlight. Dein Fokus.') :t('Optional · einen Eintrag wählen')}</small>`;
 highlight.onclick=()=>openHighlight(activeDay);weekly.before(highlight);
 const strip=document.createElement('div');strip.className='rhythm-strip';strip.setAttribute('aria-label',t('Deine Tageszeichen'));
 for(const day of P.days){
  const rhythm=P.dayRhythm(week,day,data.masterData),button=document.createElement('button');button.type='button';button.dataset.rhythmDay=day;
  button.title=dayLabel(day)+' · '+(rhythm.percent===null?t('Noch kein Tagesplan'):rhythm.percent+'%')+(rhythm.highlight?.done?' · '+t('Highlight geschafft'):'');button.setAttribute('aria-label',button.title);button.setAttribute('aria-pressed',String(day===activeDay));
  button.innerHTML=rhythmSun(rhythm)+`<span>${shortDay(day)}</span>`;button.onclick=()=>{activeDay=day;render();};strip.append(button);
 }
 weekly.append(strip);
 const review=document.createElement('button');review.type='button';review.id='weekReviewButton';review.className='week-review-button';review.textContent=t(week.review?'Wochenrückblick ansehen':'Woche abschließen')+' ↗';review.onclick=openWeekReview;weekly.append(review);
}
function openHighlight(day){
 closeMenu();$('highlightDay').value=day;
 $('highlightHeading').textContent=t('Dein Tageshighlight')+' · '+dayLabel(day);
 const week=data.weeks[data.selectedWeek],chosen=week.highlights?.[day],select=$('highlightChoice');
 select.replaceChildren(new Option(t('Kein Highlight'),''),...week.items.filter(i=>i.day===day).sort((a,b)=>P.minutes(a.start)-P.minutes(b.start)).map(i=>new Option(i.start+' · '+i.title,i.id)));
 if(chosen&&!week.items.some(i=>i.id===chosen.itemId&&i.day===day))select.add(new Option(chosen.title+' · '+t('Verschoben oder entfernt'),chosen.itemId));
 select.value=chosen?.itemId||'';$('highlightError').textContent='';$('highlightDialog').showModal();
}
function weekReviewSummary(summary){
 return `<div class="review-suns">${summary.days.map(d=>`<div>${rhythmSun(d)}<b>${dayLabel(d.day)}</b><small>${d.percent==null?'—':d.percent+'%'} ${t('vom Tagesplan')}</small></div>`).join('')}</div><div class="review-numbers"><div><b>${summary.doneCount}</b><span>${t('Einträge erledigt')}</span></div><div><b>${summary.highlightCount}</b><span>${t('Highlights geschafft')}</span></div></div><h3>${t('Dafür hast du dir Zeit genommen')}</h3><div class="review-areas">${summary.areas.map(a=>`<span>${t(a.label)} <b>${a.count}</b></span>`).join('')||`<p>${t('Noch nichts abgehakt. Auch eine freie Woche darf sein.')}</p>`}</div><p class="dialog-note">${t('Die Zahlen zählen erledigte Einträge. Sonnenstrahlen folgen dem festgehaltenen Tagesplan, der Stern deinem Highlight.')}</p>`;
}
function openWeekReview(){
 closeMenu();const week=data.weeks[data.selectedWeek],saved=week.review;
 $('weekReviewSummary').innerHTML=weekReviewSummary(saved?.summary||P.weekRhythm(week,data.masterData));
 $('reviewWeek').textContent=t('KW')+' '+P.weekNumber(data.selectedWeek)+' · '+data.selectedWeek;
 $('reviewReflection').value=saved?.reflection||'';$('reviewNext').value=saved?.next||'';
 $('reviewStatus').textContent=saved?tr`Gespeicherter Stand vom ${new Date(saved.savedAt).toLocaleString(I18N.locale)}. Erneutes Speichern aktualisiert den Rückblick.`:t('Ein kurzer Blick zurück. Du musst keine perfekte Woche haben.');
 $('weekReviewCommit').textContent=t(saved?'Rückblick aktualisieren':'Woche festhalten');$('weekReviewDialog').showModal();
}
function celebrateRhythm(card){
 const id=card?.dataset.id,highlight=P.dayRhythm(data.weeks[data.selectedWeek],activeDay,data.masterData).highlight;
 if(!highlight?.done||highlight.itemId!==id)return;
 notify(t('Dein Tageshighlight ist geschafft. Das zählt!'));
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 for(const element of [card,$('dayHighlightButton'),document.querySelector(`[data-rhythm-day="${activeDay}"]`)])element?.animate([{filter:'brightness(1)',transform:'scale(1)'},{filter:'brightness(1.45)',transform:'scale(1.025)',offset:.45},{filter:'brightness(1)',transform:'scale(1)'}],{duration:700,easing:'ease-out'});
}
function initializeRhythm(){
 $('menuReview').onclick=openWeekReview;
 $('highlightForm').onsubmit=event=>{
  event.preventDefault();const week=data.weeks[data.selectedWeek],before=week.highlights?P.clone(week.highlights):null,day=$('highlightDay').value,id=$('highlightChoice').value;
  try{if(week.highlights?.[day]?.itemId!==id)P.setHighlight(week,day,id);if(!persist())throw new Error('Speichern fehlgeschlagen. Bitte erneut versuchen.');activeDay=day;$('highlightDialog').close();render();}
  catch(error){if(before)week.highlights=before;else delete week.highlights;$('highlightError').textContent=t(error.message);}
 };
 $('weekReviewForm').onsubmit=event=>{
  event.preventDefault();const week=data.weeks[data.selectedWeek],before=week.review;
  try{
   P.captureWeekReview(week,data.masterData,$('reviewReflection').value,$('reviewNext').value);if(!persist())throw new Error('Speichern fehlgeschlagen. Bitte erneut versuchen.');
   $('weekReviewSummary').innerHTML=weekReviewSummary(week.review.summary);$('reviewStatus').textContent=t('Deine Woche ist festgehalten. Nimm mit, was dir gutgetan hat.');$('weekReviewCommit').textContent=t('Rückblick aktualisieren');render();
   if(!matchMedia('(prefers-reduced-motion: reduce)').matches)$('weekReviewSummary').querySelectorAll('.rhythm-sun').forEach((sun,i)=>sun.animate([{transform:'scale(.8)',opacity:.5},{transform:'scale(1.08)',opacity:1,offset:.7},{transform:'scale(1)',opacity:1}],{duration:650,delay:i*70,easing:'ease-out'}));
  }catch(error){if(before)week.review=before;else delete week.review;$('reviewStatus').textContent=t(error.message);}
 };
}
