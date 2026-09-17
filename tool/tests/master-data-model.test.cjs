const test=require('node:test'),assert=require('node:assert/strict');
const P=require('../js/planner.js'),M=require('../js/master-data-model.js');
test('legacy catalogs import free text without changing weeks, snapshots or IDs',()=>{
 const data=P.createData();P.ensureWeek(data,'2026-09-14');delete data.masterData;
 Object.assign(data.weeks[data.selectedWeek].items[0],{customer:'Studio',project:'Film',service:'Animation'});
 Object.assign(data.weeks[data.selectedWeek].items[1],{customer:'studio',project:'Film',service:'Animation'});
 P.capturePlan(data.weeks[data.selectedWeek]);
 const weeks=P.clone(data.weeks);P.validateData(data);
 assert.deepEqual(data.weeks,weeks);assert.equal(data.masterData.customers.length,1);assert.equal(data.masterData.projects.length,1);assert.equal(data.masterData.services.length,1);
 const catalog=P.clone(data.masterData);P.validateData(data);assert.deepEqual(data.masterData,catalog);
 assert.deepEqual(P.parseBackup({app:'JS OFFICE WEEK',data}),data);
});
test('rename/archive preserve category identity; groups control actual work and monthly totals',()=>{
 const data=P.createData();P.ensureWeek(data,'2026-09-14');
 data.masterData=M.save(data.masterData,'categories',{id:'consulting',name:'Beratung',group:'work',active:true});
 const item={id:'job',day:'Montag',start:'09:00',end:'11:00',cat:'consulting',title:'Job',description:'',done:true,actualMinutes:75,hourlyRateCents:12000};
 data.weeks[data.selectedWeek].items=[item];
 assert.equal(P.recordedWorkMetrics([item],data.masterData).earnedCents,15000);
 data.masterData=M.save(data.masterData,'categories',{...data.masterData.categories.at(-1),name:'Consulting',active:false});
 assert.equal(item.cat,'consulting');assert.equal(P.monthMetrics(data,'2026-09').groups.find(g=>g.id==='work').planned,120);
 data.masterData=M.save(data.masterData,'categories',{...data.masterData.categories.at(-1),group:'private'});
 assert.equal(P.recordedWorkMetrics([item],data.masterData).minutes,0);
 assert.equal(P.monthMetrics(data,'2026-09').groups.find(g=>g.id==='private').planned,120);
 assert.deepEqual(P.parseBackup(data),data);
});
test('validate links, duplicate names/external IDs, last active category and corrupt imports',()=>{
 const data=P.createData();P.ensureWeek(data,data.selectedWeek);
 data.masterData=M.save(data.masterData,'customers',{id:'client',name:'Studio',active:true,externalIds:{clockodo:'123'}});
 data.masterData=M.save(data.masterData,'projects',{id:'project',customerId:'client',name:'Film',active:true});
 data.masterData=M.save(data.masterData,'services',{id:'service',name:'Animation',active:true});
 const item=data.weeks[data.selectedWeek].items[0];Object.assign(item,{customerId:'client',projectId:'project',serviceId:'service'});
 assert.deepEqual(P.parseBackup(data),data);
 assert.throws(()=>M.save(data.masterData,'customers',{id:'two',name:' studio ',active:true}),/Name/);
 assert.throws(()=>M.save(data.masterData,'customers',{id:'two',name:'Other',active:true,externalIds:{clockodo:'123'}}));
 assert.throws(()=>M.save(data.masterData,'projects',{id:'two',name:'Other',active:true,customerId:'missing'}));
 const corrupt=P.clone(data);corrupt.weeks[data.selectedWeek].items[0].customerId='missing';assert.throws(()=>P.validateData(corrupt));
 const archived=P.clone(data.masterData);archived.categories.forEach(c=>c.active=false);assert.throws(()=>M.validate(archived),/aktiv/);
});
