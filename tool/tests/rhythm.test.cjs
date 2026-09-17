const {test}=require('node:test'),assert=require('node:assert/strict'),P=require('../js/rhythm-model.js');
const fixture=()=>{const d=P.createDayformData();P.applyPreset(d,'df-balance',d.selectedWeek);return d;};
test('optional highlight has one entry per day; deleted/moved references stay honest',()=>{
 const d=fixture(),w=d.weeks[d.selectedWeek],items=w.items.filter(i=>i.day==='Montag');
 P.setHighlight(w,'Montag',items[0].id);P.setHighlight(w,'Montag',items[1].id);assert.equal(w.highlights.Montag.itemId,items[1].id);
 items[1].day='Dienstag';assert.equal(P.dayRhythm(w,'Montag',d.masterData).highlight.moved,true);
 P.setHighlight(w,'Dienstag',items[1].id);assert.equal(w.highlights.Montag,undefined);
 w.items=w.items.filter(i=>i.id!==items[1].id);assert.equal(P.dayRhythm(w,'Dienstag',d.masterData).highlight.missing,true);assert.equal(P.dayRhythm(w,'Dienstag',d.masterData).highlight.done,false);
 assert.doesNotThrow(()=>P.validateData(P.clone(d)));assert.throws(()=>P.setHighlight(w,'Montag','missing'));
});
test('daily symbols follow frozen plan, not hours worked; highlight works without a baseline',()=>{
 const d=fixture(),w=d.weeks[d.selectedWeek],first=w.items[0];P.setHighlight(w,first.day,first.id);first.done=true;
 assert.equal(P.dayRhythm(w,first.day,d.masterData).percent,null);assert.equal(P.dayRhythm(w,first.day,d.masterData).highlight.done,true);
 first.done=false;P.captureDay(w,'Montag');const frozen=P.clone(w.daySnapshots.Montag);first.done=true;
 assert.equal(P.dayRhythm(w,'Montag',d.masterData).rays,1);first.end='20:00';assert.equal(P.dayRhythm(w,'Montag',d.masterData).percent,7);
 assert.deepEqual(w.daySnapshots.Montag,frozen);first.done=false;assert.equal(P.dayRhythm(w,'Montag',d.masterData).rays,0);
});
test('saved reflection is immutable until explicit update, portable and resettable',()=>{
 const d=fixture(),w=d.weeks[d.selectedWeek];P.setHighlight(w,'Montag',w.items[0].id);w.items[0].done=true;
 P.captureWeekReview(w,d.masterData,'Mehr Bewegung','Weniger Termine');const saved=P.clone(w.review);
 w.items[1].done=true;assert.deepEqual(w.review,saved);assert.equal(saved.summary.doneCount,1);assert.equal(saved.summary.highlightCount,1);
 assert.deepEqual(P.validateData(P.clone(d)),d);assert.equal(P.clearPlanning(d,'week').weeks[d.selectedWeek].review,undefined);
 P.ensureWeek(d,P.addDays(d.selectedWeek,7));assert.equal(d.weeks[d.selectedWeek].highlights,undefined);assert.equal(d.weeks[d.selectedWeek].review,undefined);
 const bad=P.clone(d);Object.values(bad.weeks)[0].review.summary.days[0].percent=1000;assert.throws(()=>P.validateData(bad));
 assert.throws(()=>P.captureWeekReview(w,d.masterData,'x'.repeat(2001),''));
});
