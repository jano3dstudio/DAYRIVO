/* Optional personal milestones. Never change planning weights or actual time. */
(function(root){
 'use strict';
 const P=typeof module!=='undefined'&&module.exports?require('./refinements-model.js'):root.Planner;
 const validateBefore=P.validateDayform;
 function setHighlight(week,day,id){
  if(!P.days.includes(day))throw new Error('Ungültiger Tag.');
  if(!id){if(week.highlights)delete week.highlights[day];return;}
  const item=week.items.find(i=>i.id===id&&i.day===day);
  if(!item)throw new Error('Eintrag für diesen Tag nicht gefunden.');
  week.highlights||={};
  for(const key of P.days)if(week.highlights[key]?.itemId===id)delete week.highlights[key];
  week.highlights[day]={itemId:id,title:item.title};
 }
 function dayRhythm(week,day,catalog){
  const chosen=week.highlights?.[day],item=chosen&&week.items.find(i=>i.id===chosen.itemId),metrics=P.dayMetrics(week,day,catalog);
  return {day,percent:metrics?.percent??null,rays:metrics?.percent>0?Math.max(1,Math.floor(metrics.percent*12/100)):0,highlight:chosen?{itemId:chosen.itemId,title:item?.title||chosen.title,done:!!item?.done,missing:!item,moved:!!item&&item.day!==day,currentDay:item?.day}:null};
 }
 function weekRhythm(week,catalog){
  const days=P.days.map(day=>dayRhythm(week,day,catalog)),done=week.items.filter(i=>i.done);
  const groups=P.summaryGroups(done,catalog).map(group=>({id:group.id,label:group.label,count:done.filter(i=>P.summaryGroups([i],catalog).some(g=>g.id===group.id)).length}));
  return {days,doneCount:done.length,highlightCount:days.filter(d=>d.highlight?.done).length,areas:groups};
 }
 function captureWeekReview(week,catalog,reflection,next){
  if(typeof reflection!=='string'||typeof next!=='string'||reflection.length>2000||next.length>2000)throw new Error('Bitte höchstens 2000 Zeichen pro Rückblick-Feld eingeben.');
  week.review={savedAt:new Date().toISOString(),reflection:reflection.trim(),next:next.trim(),summary:P.clone(weekRhythm(week,catalog))};return week.review;
 }
 function validateRhythm(data){
  validateBefore(data);
  const fail=()=>{throw new Error('Ungültige Tageshighlights oder Wochenrückblicke.');};
  const text=v=>typeof v==='string'&&v.length<=2000;
  const integer=v=>Number.isInteger(v)&&v>=0&&v<=10000;
  const validDay=d=>d&&P.days.includes(d.day)&&(d.percent===null||(integer(d.percent)&&d.percent<=100))&&integer(d.rays)&&d.rays<=12&&(!d.highlight||(typeof d.highlight.itemId==='string'&&text(d.highlight.title)&&typeof d.highlight.done==='boolean'&&typeof d.highlight.missing==='boolean'&&typeof d.highlight.moved==='boolean'));
  for(const week of Object.values(data.weeks)){
   if(week.highlights!==undefined){
    if(!week.highlights||typeof week.highlights!=='object'||Array.isArray(week.highlights))fail();
    const ids=new Set();
    for(const [day,h] of Object.entries(week.highlights)){
     if(!P.days.includes(day)||!h||typeof h.itemId!=='string'||!h.itemId||ids.has(h.itemId)||!text(h.title))fail();ids.add(h.itemId);
    }
   }
   if(week.review!==undefined){
    const r=week.review,s=r?.summary;
    if(!r||typeof r.savedAt!=='string'||!Number.isFinite(Date.parse(r.savedAt))||!text(r.reflection)||!text(r.next)||!s||!Array.isArray(s.days)||s.days.length!==5||!s.days.every((d,i)=>validDay(d)&&d.day===P.days[i])||!integer(s.doneCount)||!integer(s.highlightCount)||s.highlightCount>5||!Array.isArray(s.areas)||s.areas.length>6||!s.areas.every(a=>a&&['family','private','sport','break','work','other'].includes(a.id)&&text(a.label)&&integer(a.count)))fail();
   }
  }
  return data;
 }
 Object.assign(P,{setHighlight,dayRhythm,weekRhythm,captureWeekReview,validateDayform:validateRhythm});
 if(typeof module!=='undefined'&&module.exports)module.exports=P;
})(globalThis);
