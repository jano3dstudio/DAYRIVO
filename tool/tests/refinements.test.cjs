const {test}=require('node:test'),assert=require('node:assert/strict');
const P=require('../js/refinements-model.js');
test('day deviations distinguish changes, moves, additions and removals without rebasing',()=>{
 const d=P.createDayformData();P.applyPreset(d,'df-balance',d.selectedWeek);const w=d.weeks[d.selectedWeek];
 P.captureDay(w,'Montag');const original=P.clone(w.daySnapshots.Montag),mon=w.items.filter(i=>i.day==='Montag');
 mon[0].done=true;assert.equal(P.dayDeviation(w,'Montag').changes.length,0);
 mon[0].start='07:00';mon[0].day='Dienstag';w.items=w.items.filter(i=>i.id!==mon[1].id);
 w.items.push({...mon[2],id:P.uid(),title:'Extra',day:'Montag'});
 const diff=P.dayDeviation(w,'Montag');assert.deepEqual(diff.changes.map(c=>c.kind),['changed','removed','added']);
 assert.equal(diff.delta,-150);assert.deepEqual(w.daySnapshots.Montag,original);
 assert.equal(P.weekMetrics(w).percent,7); // Completed original 30 minutes / original 450, even after lengthening.
});
test('library migration is small, reversible and keeps linked records and current colors',()=>{
 const d=P.createData();P.ensureWeek(d,d.selectedWeek);const before=P.clone(d.weeks),look=P.currentLook(d);
 P.ensureDayform(d);assert.ok(d.standardTitles.filter(r=>!r.archived).length<=8);
 assert.ok(d.standardTitles.some(r=>r.archived));assert.ok(!d.looks.some(l=>l.id==='jano'));
 assert.deepEqual(P.currentLook(d),look);
 for(const [key,w] of Object.entries(before))assert.deepEqual(d.weeks[key].items.map(({titleId,...i})=>i),w.items);
 const r=d.standardTitles.find(r=>r.archived),entry=P.editableItems(d).find(i=>i.titleId===r.id);
 assert.ok(entry);P.assignTitle(d,{title:'My basic',cat:r.categoryId},r.id);assert.equal(entry.title,'My basic');
 assert.equal(r.archived,true);r.archived=false;assert.deepEqual(P.validateData(P.clone(d)),d);
});
test('planning hours validate and grouping preserves every minute',()=>{
 const d=P.createDayformData();P.applyPreset(d,'df-balance',d.selectedWeek);const items=d.weeks[d.selectedWeek].items;
 assert.equal(P.summaryGroups(items,d.masterData).reduce((n,g)=>n+g.minutes,0),items.reduce((n,i)=>n+P.duration(i),0));
 assert.ok(P.summaryGroups(items,d.masterData).find(g=>g.id==='family'));
 d.settings.planningHours={start:'08:00',end:'21:00'};assert.deepEqual(P.validateData(P.clone(d)),d);
 for(const end of ['07:00','08:15','bad']){d.settings.planningHours.end=end;assert.throws(()=>P.validateData(P.clone(d)));}
});
