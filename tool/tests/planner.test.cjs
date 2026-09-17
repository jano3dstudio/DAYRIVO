const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../js/planner.js');

test('local dates and ISO weeks work across DST and year boundaries', () => {
  assert.equal(P.mondayISO('2026-09-16'),'2026-09-14');
  assert.equal(P.mondayISO('2026-03-29'),'2026-03-23');
  assert.equal(P.addDays('2026-03-23',7),'2026-03-30');
  assert.equal(P.weekNumber('2025-12-29'),1);
  assert.equal(P.weekNumber('2026-09-14'),38);
});
test('legacy migration retains current state, archives and work notes without contaminating template', () => {
  const items = P.defaultItems(); items[0].done = true; items[0].actual = 'Kunde · Projekt'; items[0].title = 'Edited';
  const current = {weekStart:'2026-09-14',items};
  const archive = [{weekStart:'2026-09-07',items:P.defaultItems()}];
  const data = P.migrateLegacy(current,archive);
  assert.equal(data.weeks['2026-09-14'].items[0].actual,'Kunde · Projekt');
  assert.equal(data.weeks['2026-09-14'].items[0].done,true);
  P.ensureWeek(data,'2026-09-21');
  assert.equal(data.weeks['2026-09-21'].items[0].title,'Kinder zur Schule');
  P.ensureWeek(data,'2026-09-14');
  assert.equal(data.weeks['2026-09-14'].items[0].title,'Edited');
  assert.notEqual(data.weeks['2026-09-21'].items[0].id,data.template[0].id);
  assert.equal(current.items[0].title,'Edited');
});
test('overlap layout separates concurrent entries and reuses full width afterwards', () => {
  const rows = P.layout([{id:'a',start:'09:00',end:'12:00'},{id:'b',start:'10:00',end:'11:00'},{id:'c',start:'11:00',end:'12:30'},{id:'d',start:'12:30',end:'13:00'}]);
  assert.deepEqual(rows.map(({lane,lanes})=>[lane,lanes]),[[0,2],[1,2],[1,2],[0,1]]);
});
test('entry icons survive presets, moves and backups without altering legacy entries', () => {
  const data=P.createData();P.ensureWeek(data,'2026-09-14');
  const item=data.weeks[data.selectedWeek].items[0];item.icon='bike';
  assert.equal(P.moveItem(item,'Freitag',15).icon,'bike');
  const preset=P.createPreset(data,'Icons',[item]);P.applyPreset(data,preset.id,'2026-09-21');
  assert.equal(data.weeks['2026-09-21'].items[0].icon,'bike');
  assert.deepEqual(P.parseBackup(data),data);
  assert.equal(data.weeks[data.selectedWeek].items[1].icon,undefined);
  item.icon='<svg onload=bad>';assert.throws(()=>P.validateData(data),/Icon/);
});
test('resize snaps to quarter hours and respects same-day boundaries', () => {
  assert.equal(P.resizeStart({start:'09:00',end:'11:00'},-18),'08:45');
  assert.equal(P.resizeStart({start:'09:00',end:'11:00'},2000),'10:45');
  assert.equal(P.resizeStart({start:'09:00',end:'11:00'},-2000),'00:00');
  assert.equal(P.resizeStart({start:'08:00',end:'08:20'},2000),'08:15');
  assert.equal(P.resizeStart({start:'00:00',end:'00:05'},15),'00:00');
  const item = {start:'12:00',end:'12:30'};
  assert.equal(P.resizeEnd(item,18),'12:45');
  assert.equal(P.resizeEnd(item,-100),'12:15');
  assert.equal(P.resizeEnd(item,2000),'23:45');
  assert.equal(P.resizeEnd({start:'23:50',end:'23:59'},15),'23:59');
});
test('moving changes day and snaps time while preserving duration, identity and details', () => {
  const item = {id:'a',day:'Dienstag',start:'12:00',end:'13:30',description:'Keep me',done:true,cat:'Kunde'};
  assert.deepEqual(P.moveItem(item,'Donnerstag',0),{...item,day:'Donnerstag'});
  assert.deepEqual(P.moveItem(item,'Donnerstag',19),{...item,day:'Donnerstag',start:'12:15',end:'13:45'});
  assert.equal(P.moveItem(item,'Montag',-2000).start,'00:00');
  assert.equal(P.moveItem(item,'Freitag',2000).end,'23:45');
  const legacy = {...item,start:'08:20',end:'08:50'};
  assert.equal(P.moveItem(legacy,'Donnerstag',0).start,'08:20');
  assert.equal(P.duration(P.moveItem(legacy,'Donnerstag',19)),30);
  assert.equal(item.day,'Dienstag');
});
test('backup round trip and validation reject corrupt data before restore', () => {
  const data = P.createData(); P.ensureWeek(data,'2026-09-14');
  assert.deepEqual(P.parseBackup({app:'JS OFFICE WEEK',data}),data);
  const invalid = P.clone(data); invalid.weeks['2026-09-14'].items[0].end = '01:00';
  assert.throws(()=>P.parseBackup(invalid));
  assert.throws(()=>P.parseBackup({foo:'bar'}));
  const badColor = P.clone(data); badColor.settings.days.Montag.color = 'red;position:fixed';
  assert.throws(()=>P.parseBackup(badColor));
});
test('old data gains presets without changing its existing weeks', () => {
  const data = P.createData(); P.ensureWeek(data,'2026-09-14');
  delete data.presets; delete data.defaultPresetId;
  const before = P.clone(data.weeks);
  P.validateData(data);
  assert.equal(data.presets[data.defaultPresetId].name,'Standardwoche');
  assert.deepEqual(data.weeks,before);
});
test('presets and instantiated weeks stay independent and survive backup restore', () => {
  const data = P.createData(); P.ensureWeek(data,'2026-09-14');
  const preset = P.createPreset(data,'Urlaub',[]);
  const original = P.clone(data.weeks['2026-09-14']);
  preset.items.push({...P.defaultItems()[0],done:true,actual:'Not a template note'});
  data.defaultPresetId = preset.id;
  P.ensureWeek(data,'2026-09-21');
  assert.deepEqual(data.weeks['2026-09-14'],original);
  const next = data.weeks['2026-09-21'].items[0];
  assert.equal(next.done,false); assert.equal(next.actual,''); assert.notEqual(next.id,preset.items[0].id);
  next.title = 'Only this week';
  assert.notEqual(next.title,preset.items[0].title);
  assert.throws(()=>P.createPreset(data,'urlaub',[]));
  const restored = P.parseBackup({app:'JS OFFICE WEEK',data});
  assert.equal(restored.defaultPresetId,preset.id);
  assert.equal(restored.presets[preset.id].items.length,1);
  P.applyPreset(restored,preset.id,'2026-09-14');
  assert.equal(restored.weeks['2026-09-14'].items.length,1);
  assert.notEqual(restored.weeks['2026-09-14'].items[0].id,preset.items[0].id);
});
test('completion keeps the original weights after edits and deletions, extras do not inflate it', () => {
  const a = {id:'a',day:'Montag',start:'09:00',end:'11:00',cat:'Kunde',title:'A',done:false};
  const b = {...a,id:'b',start:'11:00',end:'12:00',title:'B'};
  const week = {weekStart:'2026-09-14',items:[a,b]};
  assert.equal(P.weekMetrics(week).percent,null);
  const preset = {id:'p',name:'Original',items:P.clone(week.items)};
  P.capturePlan(week,preset);
  preset.items[0].end = '17:00';
  week.items[0].end = '09:30'; week.items[0].day = 'Donnerstag'; week.items[0].done = true;
  week.items.splice(1,1);
  week.items.push({...a,id:'extra',start:'12:00',end:'15:00',done:true});
  const metrics = P.weekMetrics(week);
  assert.equal(metrics.planned,180); assert.equal(metrics.credited,120); assert.equal(metrics.percent,67);
  assert.equal(metrics.openMinutes,60); assert.equal(metrics.extraDoneMinutes,180);
  assert.equal(metrics.removedCount,1); assert.equal(metrics.changedCount,1);
  assert.equal(week.planSnapshot.preset.items[0].end,'11:00');
  assert.throws(()=>P.capturePlan(week));
});
test('empty snapshots have no percentage and old weeks do not acquire fabricated history', () => {
  const data = P.createData(); P.ensureWeek(data,'2026-09-14');
  assert.equal(data.weeks['2026-09-14'].planSnapshot,undefined);
  P.validateData(data);
  assert.equal(data.weeks['2026-09-14'].planSnapshot,undefined);
  const week = {weekStart:'2026-09-14',items:[]};
  P.capturePlan(week); assert.equal(P.weekMetrics(week).percent,null);
  P.capturePlan(data.weeks['2026-09-14']);
  assert.deepEqual(P.parseBackup({app:'JS OFFICE WEEK',data}).weeks['2026-09-14'].planSnapshot,data.weeks['2026-09-14'].planSnapshot);
});
test('month totals split weeks at calendar month boundaries and do not create missing weeks', () => {
  const data = P.createData(), week = P.ensureWeek(data,'2026-08-31');
  week.items = [
    {id:'aug',day:'Montag',start:'09:00',end:'10:00',cat:'Kunde',title:'August',done:true},
    {id:'sep',day:'Dienstag',start:'09:00',end:'10:30',cat:'Kunde',title:'September',done:true}
  ];
  const before = JSON.stringify(data);
  const september = P.monthMetrics(data,'2026-09');
  assert.equal(september.planned,90); assert.equal(september.done,90); assert.equal(september.count,1);
  assert.equal(september.dates.length,30);
  assert.equal(P.monthMetrics(data,'2026-08').planned,60);
  assert.equal(P.monthMetrics(data,'2027-02').dates.length,28);
  assert.equal(P.monthMetrics(data,'2028-02').dates.length,29);
  assert.equal(JSON.stringify(data),before);
});
test('looks migrate without changing day settings and reject invalid backups/imports', () => {
  const old = P.createData(); P.ensureWeek(old,old.selectedWeek);
  old.settings.days.Montag.color = '#123456';
  delete old.settings.appearance; delete old.looks;
  const weeks = P.clone(old.weeks), daySettings = P.clone(old.settings.days);
  const migrated = P.validateData(old);
  assert.deepEqual(migrated.weeks,weeks); assert.deepEqual(migrated.settings.days,daySettings);
  assert.equal(P.currentLook(migrated).days.Montag,'#123456');
  assert.equal(migrated.settings.appearance.frame,'dashed');
  const invalid = P.clone(migrated); invalid.settings.appearance.accent = '#bad';
  assert.throws(() => P.validateData(invalid));
  assert.throws(() => P.parseLooks({app:'JS OFFICE WEEK LOOKS',version:1,presets:[{id:'a',name:'Bad',...P.defaultLook(),frame:'url(evil)'}]}));
  assert.throws(() => P.parseLooks({app:'JS OFFICE WEEK',data:migrated}));
  const preset = {id:'a',name:'Test',...P.defaultLook(),weeks:'discard this'};
  const imported = P.parseLooks({app:'JS OFFICE WEEK LOOKS',version:1,presets:[preset]});
  assert.equal(imported[0].weeks,undefined);
});
test('day presets copy one day with fresh IDs and leave other days and the captured plan untouched', () => {
  const data = P.createData(), week = P.ensureWeek(data,data.selectedWeek);
  const source = week.items.filter(item => item.day === 'Montag');
  source[0].done = true; source[0].actual = 'Do not reuse'; source[0].description = 'Keep description';
  const preset = P.createDayPreset(data,'Kundentag',source);
  assert.equal(preset.items[0].done,false); assert.equal(preset.items[0].actual,'');
  P.capturePlan(week);
  const snapshot = P.clone(week.planSnapshot), otherDays = P.clone(week.items.filter(item => item.day !== 'Donnerstag'));
  const daySettings = P.clone(data.settings.days);
  P.applyDayPreset(data,preset.id,week,'Donnerstag');
  const result = week.items.filter(item => item.day === 'Donnerstag');
  assert.equal(result.length,source.length);
  assert.ok(result.every(item => !source.some(original => original.id === item.id) && !preset.items.some(original => original.id === item.id)));
  assert.equal(result[0].description,'Keep description'); assert.equal(result[0].done,false);
  assert.deepEqual(week.items.filter(item => item.day !== 'Donnerstag'),otherDays);
  assert.deepEqual(week.planSnapshot,snapshot); assert.deepEqual(data.settings.days,daySettings);
  result[0].title = 'Independent'; assert.notEqual(preset.items[0].title,'Independent');
  assert.deepEqual(P.parseBackup({app:'JS OFFICE WEEK',data}),data);
  const empty = P.createDayPreset(data,'Frei',[]); P.applyDayPreset(data,empty.id,week,'Donnerstag');
  assert.equal(week.items.filter(item => item.day === 'Donnerstag').length,0);
  assert.throws(() => P.createDayPreset(data,'Kundentag',[]));
  assert.throws(() => P.createDayPreset(data,'Gemischt',week.items));
});

test('older backups gain day presets without modifying the week or its source preset', () => {
  const old = P.createData(); P.ensureWeek(old,old.selectedWeek); delete old.dayPresets;
  const weeks = P.clone(old.weeks), presets = P.clone(old.presets);
  P.validateData(old);
  assert.equal(old.dayPresets.length,5); assert.deepEqual(old.weeks,weeks); assert.deepEqual(old.presets,presets);
  const invalid = P.clone(old); invalid.dayPresets[0].items[0].end = 'invalid';
  assert.throws(() => P.validateData(invalid));
  old.dayPresets = []; assert.equal(P.validateData(old).dayPresets.length,0);
});
test('language survives backups while legacy and future language choices remain readable', () => {
  const data = P.createData(); P.ensureWeek(data,data.selectedWeek);
  data.settings.language = 'en';
  assert.equal(P.parseBackup({app:'JS OFFICE WEEK',data}).settings.language,'en');
  delete data.settings.language; assert.doesNotThrow(() => P.validateData(data));
  data.settings.language = 'fr-CA'; assert.doesNotThrow(() => P.validateData(data));
  data.settings.language = {}; assert.throws(() => P.validateData(data));
});
test('day reminders survive backups and replacing timed presets without entering metrics or new weeks', () => {
  const data=P.createData(),week=P.ensureWeek(data,'2026-09-14');
  const original=P.weekMetrics(week),money=P.financialMetrics(week.items);
  week.reminders=[{id:'quick1',day:'Dienstag',text:'Angebot senden',done:true}];
  assert.deepEqual(P.weekMetrics(week),original);assert.deepEqual(P.financialMetrics(week.items),money);
  const roundtrip=P.parseBackup({app:'JS OFFICE WEEK',data});assert.deepEqual(roundtrip.weeks[week.weekStart].reminders,week.reminders);
  P.applyPreset(data,data.defaultPresetId,week.weekStart);assert.deepEqual(data.weeks[week.weekStart].reminders,week.reminders);
  const next=P.ensureWeek(data,'2026-09-21');assert.equal(next.reminders,undefined);
  for(const patch of [{day:'Sonntag'},{text:''},{text:'x'.repeat(161)},{done:'yes'},{id:''}]) {
    const bad=P.clone(data);Object.assign(bad.weeks[week.weekStart].reminders[0],patch);assert.throws(()=>P.validateData(bad),/Quick-To-do/);
  }
  assert.throws(()=>P.validateReminders([week.reminders[0],week.reminders[0]]),/Quick-To-do/);
  assert.doesNotThrow(()=>P.validateReminders(undefined));
});

test('recorded work never falls back to planned duration and survives backups but not preset copies', () => {
  assert.equal(P.parseActualTime('1:07'),67);assert.equal(P.parseActualTime('0:00'),0);assert.equal(P.parseActualTime('24:00'),1440);assert.equal(P.parseActualTime(''),null);
  for(const value of ['1.5','1:60','-1:00','24:01','100:00'])assert.throws(()=>P.parseActualTime(value));
  const item=(id,actualMinutes,hourlyRateCents,done=true,cat='Kunde')=>({id,title:id,day:'Dienstag',start:'09:00',end:'11:00',cat,actualMinutes,hourlyRateCents,done});
  const entries=[item('a',45,12000),item('b',null,12000),item('c',30,null),item('d',0,0),item('e',60,12000,false),item('f',60,12000,true,'Sport')];
  const expected={minutes:75,recordedCount:3,missingTimeCount:1,missingRateCount:1,missingRateMinutes:30,valuedMinutes:45,earnedCents:9000};
  assert.deepEqual(P.recordedWorkMetrics(entries),expected);
  entries[0].end='16:00';assert.deepEqual(P.recordedWorkMetrics(entries),expected);
  const data=P.createData(),week=P.ensureWeek(data,'2026-08-31');week.items=entries;
  assert.deepEqual(P.recordedWorkMetrics(P.monthMetrics(data,'2026-09').dates.flatMap(d=>d.items)),expected);
  const restored=P.parseBackup({app:'JS OFFICE WEEK',data});assert.equal(restored.weeks[week.weekStart].items[0].actualMinutes,45);
  for(const value of [-1,1.5,1441,'45',Infinity]){const bad=P.clone(data);bad.weeks[week.weekStart].items[0].actualMinutes=value;assert.throws(()=>P.validateData(bad),/Arbeitszeit/);}
  const preset=P.createPreset(data,'Recorded source',entries);assert.ok(preset.items.every(i=>i.actualMinutes===undefined));
  P.applyPreset(data,preset.id,'2026-09-14');assert.ok(data.weeks['2026-09-14'].items.every(i=>i.actualMinutes===undefined));
  const day=P.createDayPreset(data,'Recorded day',entries);assert.ok(day.items.every(i=>i.actualMinutes===undefined));
  assert.equal(week.items[0].actualMinutes,45);
});

test('hourly rates accept German and English decimals and reject invalid precision and ranges', () => {
  assert.equal(P.parseRate(' 120,50 '),12050);assert.equal(P.parseRate('120.50'),12050);
  assert.equal(P.parseRate('0'),0);assert.equal(P.parseRate(''),null);
  for (const value of ['-1','NaN','Infinity','1.234','1,000.00','1e3','1000001']) assert.throws(()=>P.parseRate(value));
});

test('fees exclude personal time and missing rates; round each entry and separate done from open', () => {
  const item=(id,cat,rate,done=false,end='10:15')=>({id,title:id,day:'Dienstag',cat,start:'09:00',end,done,hourlyRateCents:rate});
  const items=[item('job','Kunde',12050,true),item('admin','Admin',10000),item('free','Spiel',0),item('unrated','AI / Firma',null),item('private','Sport',99999,true)];
  const before=JSON.stringify(items),money=P.financialMetrics(items);
  assert.deepEqual(money,{plannedCents:27563,doneCents:15063,openCents:12500,ratedCount:3,unratedCount:1,unratedMinutes:75});
  assert.equal(JSON.stringify(items),before);
  const data=P.createData(),week=P.ensureWeek(data,'2026-08-31');week.items=items;
  week.items.push({...item('outside','Kunde',90000),day:'Montag'});
  assert.deepEqual(P.financialMetrics(P.monthMetrics(data,'2026-09').dates.flatMap(d=>d.items)),money);
  assert.equal(P.parseBackup({app:'JS OFFICE WEEK',data}).weeks['2026-08-31'].items[0].hourlyRateCents,12050);
  P.capturePlan(week,null);week.items[0].hourlyRateCents=20000;
  assert.equal(week.planSnapshot.items[0].hourlyRateCents,12050);
  const preset=P.createPreset(data,'Paid week',week.items);P.applyPreset(data,preset.id,'2026-09-14');
  assert.equal(data.weeks['2026-09-14'].items[0].hourlyRateCents,20000);
  const dayPreset=P.createDayPreset(data,'Paid day',week.items.filter(i=>i.day==='Dienstag'));
  P.applyDayPreset(data,dayPreset.id,data.weeks['2026-09-14'],'Donnerstag');
  assert.ok(data.weeks['2026-09-14'].items.some(i=>i.day==='Donnerstag'&&i.hourlyRateCents===20000));
  for(const rate of [-1,1.5,'120',Infinity,100000001]) {const bad=P.clone(data);bad.weeks['2026-08-31'].items[0].hourlyRateCents=rate;assert.throws(()=>P.validateData(bad),/Stundensatz/);}
});

test('month areas partition all minutes and completion, including month edges and unknown categories', () => {
  const data = P.createData(), early = P.ensureWeek(data,'2026-08-31'), late = P.ensureWeek(data,'2026-09-28');
  const item = (id,day,cat,start,end,done=false) => ({id,day,cat,start,end,done,title:id});
  early.items = [item('outside','Montag','Kunde','09:00','11:00'),item('work','Dienstag','Kunde','09:00','10:15',true),item('sport','Dienstag','Sport','08:00','08:30'),item('private','Mittwoch','Schule','07:00','07:45',true)];
  late.items = [item('game','Montag','Spiel','09:00','11:00'),item('break','Dienstag','Pause','12:00','12:30'),item('other','Mittwoch','Imported category','11:00','11:15',true),item('outside2','Donnerstag','Sport','08:00','09:00')];
  const before = JSON.stringify(data), month = P.monthMetrics(data,'2026-09');
  assert.deepEqual(month.groups.map(g=>[g.id,g.planned,g.done]),[['work',195,75],['sport',30,0],['private',45,45],['break',30,0],['other',15,15]]);
  assert.equal(month.groups.reduce((sum,g)=>sum+g.planned,0),month.planned);
  assert.equal(month.groups.reduce((sum,g)=>sum+g.done,0),month.done);
  assert.equal(month.groups.reduce((sum,g)=>sum+g.count,0),month.count);
  for (const day of month.dates) assert.equal(day.groups.reduce((sum,g)=>sum+g.planned,0),day.planned);
  assert.equal(P.timeGroup('AI / Firma'),'work');assert.equal(P.timeGroup('Routine'),'private');assert.equal(P.timeGroup('Puffer'),'break');
  assert.equal(JSON.stringify(data),before);
});
