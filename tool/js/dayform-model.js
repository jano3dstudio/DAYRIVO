/* DAYFORM additions: shared labels, starter weeks and immutable daily baselines. */
(function(root){
 'use strict';
 const P=typeof module!=='undefined'&&module.exports?require('./planner.js'):root.Planner;
 const baseMetrics=P.weekMetrics;
 const editableItems=data=>[data.template,...Object.values(data.presets).map(p=>p.items),...(data.dayPresets||[]).map(p=>p.items),...Object.values(data.weeks).map(w=>w.items)].flat();
 function starterPresets(){
  const definitions=[
   ['df-focus','Fokuswoche',[['09:00','12:00','Kunde','Fokusarbeit'],['12:00','13:00','Pause','Pause & Bewegung'],['13:00','15:00','Kunde','Projektarbeit'],['15:00','15:30','Admin','Tagesabschluss']]],
   ['df-balance','Balance',[['08:00','08:30','Sport','Bewegung'],['09:00','12:00','Kunde','Fokusarbeit'],['12:00','13:00','Pause','Pause & Bewegung'],['13:00','15:00','Kunde','Projektarbeit'],['15:00','16:00','Familie','Zeit für mich & Familie']]],
   ['df-deadline','Projekt-Endspurt',[['08:30','12:00','Kunde','Projektarbeit'],['12:00','13:00','Pause','Pause & Bewegung'],['13:00','16:00','Kunde','Projektarbeit'],['16:00','16:30','Admin','Review & nächste Schritte']]],
   ['df-timeoff','Urlaub',[['09:00','10:00','Routine','Entspannt starten'],['10:00','12:00','Familie','Freie Zeit'],['14:00','16:00','Familie','Draußen sein']]],
   ['df-blank','Leere Woche',[]]
  ];
  return definitions.map(([id,name,blocks])=>({id,name,builtin:true,items:P.days.flatMap(day=>blocks.map(([start,end,cat,title])=>({id:P.uid(),day,start,end,cat,title,description:'',done:false})))}));
 }
 function ensureDayform(data){
  if(!data.settings.lookCollectionV2){
   const palettes=[
    ['rainbow','Rainbow','#ff77b7',['#ff6b8a','#ffad5c','#f1df6f','#63e6b5','#ab8aff']],
    ['arcade','Neon Arcade','#66ffcc',['#ff47a6','#bd6aff','#48d9ff','#b5ff46','#ffca4b']],
    ['sunset','Electric Sunset','#ff9862',['#ff657d','#ff9e64','#fbd477','#cc83d5','#888bff']],
    ['glacier','Glacier','#6ee7ed',['#75aaff','#6dd4ed','#70ebca','#91bbeb','#bba2ee']],
    ['candy','Candy Pop','#ff8bd7',['#fa87b8','#b4a0ff','#79d9fa','#ffcf79','#92e5b1']],
    ['acid','Acid Night','#dbff53',['#e4ff59','#7af78f','#48dfb4','#c8a0ff','#ff759b']]
   ];
   for(const [key,name,accent,colors] of palettes){
    if(data.looks.length>=100)break;
    if(!data.looks.some(p=>p.id==='df-'+key))data.looks.push({id:'df-'+key,name,accent,frame:'dashed',days:Object.fromEntries(P.days.map((day,i)=>[day,colors[i]]))});
   }
   data.settings.lookCollectionV2=true;
  }
  if(!data.settings.dayformSetup){
   for(const preset of starterPresets()) if(!Object.hasOwn(data.presets,preset.id)) data.presets[preset.id]=preset;
   data.standardTitles||=[];
   const items=editableItems(data),groups=new Map();
   for(const item of items){
    const key=item.title.trim()+'\n'+item.cat;
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);
   }
   for(const list of groups.values()){
    if(list.length<2||!list[0].title.trim())continue;
    let record=data.standardTitles.find(r=>r.name===list[0].title&&r.categoryId===list[0].cat);
    if(!record){record={id:P.uid(),name:list[0].title,categoryId:list[0].cat};data.standardTitles.push(record);}
    for(const item of list)if(!item.titleId)item.titleId=record.id;
   }
   data.settings.dayformSetup=1;
  }
  data.standardTitles||=[];
  if(!data.settings.titleLibraryV2){
   const basics=new Set(['Kinder zur Schule','Dusche / Kaffee','Dusche + Kaffee','Fokusarbeit','Projektarbeit','Bewegung','Pause & Bewegung','Tagesabschluss']);
   for(const record of data.standardTitles)record.archived=!basics.has(record.name);
   data.settings.titleLibraryV2=true;
  }
  data.looks=data.looks.filter(look=>!(look.id==='jano'&&look.name==='JANO Studio'));
  data.settings.planningHours||={start:'07:00',end:'18:00'};
  return data;
 }
 function createDayformData(){
  const data=P.createData();data.presets={};data.dayPresets=[];data.template=[];data.weeks={};
  data.defaultPresetId='df-blank';data.settings.needsWelcome=true;
  for(const day of P.days)data.settings.days[day].subtitle='';
  ensureDayform(data);P.ensureWeek(data,data.selectedWeek);return data;
 }
 function validateDayform(data){
  const hours=data.settings.planningHours;
  if(hours&&(!P.validTime(hours.start)||!P.validTime(hours.end)||P.minutes(hours.end)-P.minutes(hours.start)<60))throw new Error('Der Tageszeitraum muss mindestens eine Stunde umfassen.');
  if(data.standardTitles!==undefined){
   if(!Array.isArray(data.standardTitles)||data.standardTitles.length>1000)throw new Error('Ungültige Standardtitel.');
   const ids=new Set();
   for(const r of data.standardTitles){
    if(!r||typeof r.id!=='string'||!r.id||ids.has(r.id)||typeof r.name!=='string'||!r.name.trim()||r.name.length>200||typeof r.categoryId!=='string'||!r.categoryId)throw new Error('Ungültige Standardtitel.');
    if(r.archived!==undefined&&typeof r.archived!=='boolean')throw new Error('Ungültige Standardtitel.');
    ids.add(r.id);
   }
   for(const item of editableItems(data))if(item.titleId!==undefined&&(typeof item.titleId!=='string'||!ids.has(item.titleId)))throw new Error('Ungültige Standardtitel-Verknüpfung.');
  }
  for(const week of Object.values(data.weeks)){
   if(week.daySnapshots===undefined)continue;
   if(!week.daySnapshots||typeof week.daySnapshots!=='object'||Array.isArray(week.daySnapshots))throw new Error('Ungültiger Tagesplan.');
   const seen=new Set();
   for(const [day,snapshot] of Object.entries(week.daySnapshots)){
    if(!P.days.includes(day)||!snapshot||!Number.isFinite(Date.parse(snapshot.capturedAt))||snapshot.date!==P.addDays(week.weekStart,P.days.indexOf(day)))throw new Error('Ungültiger Tagesplan.');
    P.validateItems(snapshot.items);
    for(const item of snapshot.items){if(item.day!==day||seen.has(item.id))throw new Error('Ungültiger Tagesplan.');seen.add(item.id);}
   }
  }
  return data;
 }
 function assignTitle(data,item,id,create=false){
  if(!id&&!create){delete item.titleId;return;}
  const name=item.title.trim();
  if(!name||name.length>200)throw new Error('Ungültige Standardtitel.');
  let record=data.standardTitles.find(r=>r.id===id);
  if(!record&&create){
   record=data.standardTitles.find(r=>r.name===name&&r.categoryId===item.cat);
   if(!record){
    if(data.standardTitles.length>=1000)throw new Error('Ungültige Standardtitel.');
    record={id:P.uid(),name,categoryId:item.cat};data.standardTitles.push(record);
   }
  }
  if(!record)throw new Error('Ungültige Standardtitel-Verknüpfung.');
  record.name=name;record.categoryId=item.cat;item.titleId=record.id;
  if(create)record.archived=false;
  for(const linked of editableItems(data))if(linked.titleId===record.id){linked.title=name;linked.cat=item.cat;}
 }
 function captureDay(week,day){
  if(!P.days.includes(day)||week.daySnapshots?.[day])throw new Error('Dieser Tag wurde bereits gestartet.');
  const previous=new Set(Object.values(week.daySnapshots||{}).flatMap(s=>s.items.map(i=>i.id)));
  const items=week.items.filter(i=>i.day===day&&!previous.has(i.id));
  if(items.some(i=>i.done))throw new Error('Bitte den Tagesplan vor dem ersten Abhaken festhalten.');
  week.daySnapshots||={};
  week.daySnapshots[day]={capturedAt:new Date().toISOString(),date:P.addDays(week.weekStart,P.days.indexOf(day)),items:P.clone(items)};
  return week.daySnapshots[day];
 }
 function weekMetrics(week){
  const snapshots=Object.values(week.daySnapshots||{});
  if(!snapshots.length)return {...baseMetrics(week),scope:week.planSnapshot?'week':'none',capturedDays:0};
  const items=snapshots.flatMap(s=>s.items),ids=new Set(items.map(i=>i.id)),days=Object.keys(week.daySnapshots);
  const snapshot={capturedAt:snapshots.map(s=>s.capturedAt).sort()[0],items,preset:null};
  const scoped=week.items.filter(i=>days.includes(i.day)||ids.has(i.id));
  return {...baseMetrics({...week,items:scoped,planSnapshot:snapshot}),scope:'day',capturedDays:days.length,snapshot};
 }
 function dayMetrics(week,day,masterData){
  const snapshot=week.daySnapshots?.[day];
  if(!snapshot)return null;
  const current=new Map(week.items.map(i=>[i.id,i])),ids=new Set(snapshot.items.map(i=>i.id));
  const otherIds=new Set(Object.entries(week.daySnapshots).filter(([key])=>key!==day).flatMap(([,s])=>s.items.map(i=>i.id)));
  const items=week.items.filter(i=>ids.has(i.id)||(i.day===day&&!otherIds.has(i.id)));
  const metrics=baseMetrics({...week,items,planSnapshot:{...snapshot,preset:null}});
  const measured=snapshot.items.filter(i=>P.timeGroup(i.cat,masterData)==='work'&&current.get(i.id)?.done&&current.get(i.id)?.actualMinutes!=null);
  return {...metrics,estimated:measured.reduce((n,i)=>n+P.duration(i),0),actual:measured.reduce((n,i)=>n+current.get(i.id).actualMinutes,0),measuredCount:measured.length};
 }
 function clearPlanning(data,scope){
  const next=P.clone(data);
  if(scope==='week')next.weeks[next.selectedWeek]={weekStart:next.selectedWeek,items:[]};
  else if(scope==='all')next.weeks={[next.selectedWeek]:{weekStart:next.selectedWeek,items:[]}};
  else throw new Error('Ungültiger Löschumfang.');
  return next;
 }
 Object.assign(P,{ensureDayform,createDayformData,validateDayform,editableItems,assignTitle,captureDay,weekMetrics,dayMetrics,clearPlanning,starterPresets});
 if(typeof module!=='undefined'&&module.exports)module.exports=P;
})(globalThis);
