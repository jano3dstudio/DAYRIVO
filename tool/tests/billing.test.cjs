const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const B=require('../clockodo/billing.cjs'),{createBridge}=require('../clockodo/bridge.cjs');
const account='a'.repeat(64),credentials={email:'test@example.com',key:'fake-only'};
const entry=(id,extra={})=>({id,customers_id:7,projects_id:9,projects_name:'Visualisierung',services_name:'3D',type:1,billable:1,time_since:'2026-09-10T08:00:00Z',time_until:'2026-09-10T10:00:00Z',duration:7200,clocked:true,revenue:240,hourly_rate:120,text:'Entwurf',time_last_change:'2026-09-10T10:00:00Z',...extra});
const response=rows=>({ok:true,json:async()=>({entries:rows,paging:{current_page:1,count_pages:1,count_items:rows.length}})});
test('Berlin billing months include DST and exact month boundaries',()=>{
 const march=B.monthRange('2026-03');assert.equal(new Date(march.start).toISOString(),'2026-02-28T23:00:00.000Z');assert.equal(new Date(march.end).toISOString(),'2026-03-31T22:00:00.000Z');
 const oct=B.monthRange('2026-10');assert.equal(new Date(oct.end).toISOString(),'2026-10-31T23:00:00.000Z');
 for(const value of ['2026-13','2026-1','../../x','2026-00'])assert.throws(()=>B.monthRange(value));
});
test('only completed customer entries qualify; missing money differs from zero',async()=>{
 const range=B.monthRange('2026-09');
 const manual=B.normalize(entry(1,{clocked:false,time_until:null}),7,range);assert.equal(manual.running,false);assert.equal(manual.seconds,7200);
 assert.equal(B.normalize(entry(2,{time_until:null}),7,range).running,true);
 assert.equal(B.normalize(entry(3,{revenue:undefined,hourly_rate:undefined}),7,range).revenueCents,null);
 assert.equal(B.normalize(entry(4,{revenue:0}),7,range).revenueCents,0);
 assert.equal(B.normalize(entry(7,{type:2,duration:undefined,revenue:500}),7,range).seconds,null);
 assert.equal(B.normalize(entry(5,{time_until:'2026-10-01T03:00:00Z'}),7,range).boundary,true);
 assert.throws(()=>B.normalize(entry(6,{customers_id:8}),7,range));
 assert.throws(()=>B.normalize(entry(6,{duration:-1}),7,range));
 const fetched=await B.readMonth(credentials,7,'2026-09',async(url,options)=>{assert.equal(options.method,'GET');assert.equal(url.pathname,'/api/v2/entries');assert.equal(url.searchParams.get('filter[customers_id]'),'7');assert.equal(url.searchParams.get('time_until'),'2026-09-30T21:59:59.000Z');return response([entry(1)]);});
 assert.equal(fetched.rows[0].revenueCents,24000);assert.ok(!JSON.stringify(fetched).includes(credentials.key));
 await assert.rejects(B.readMonth(credentials,7,'2026-09',async()=>response([entry(1),entry(1)])));
 await assert.rejects(B.readMonth(credentials,7,'2026-09',async()=>({ok:true,json:async()=>({entries:[],paging:{current_page:1,count_pages:2,count_items:2}})})));
});
test('durable reservations, atomic rollback, account isolation and backups',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dayrivo-billing-'));let store=B.createStore(account,dir);
 const rows=[entry(1),entry(2),entry(3,{billable:2}),entry(4,{billable:0}),entry(5,{time_until:null}),entry(6,{time_until:'2026-10-02T10:00:00Z'})].map(r=>B.normalize(r,7,B.monthRange('2026-09'))),snapshot={rows,month:'2026-09',customerId:7,zone:'Europe/Berlin',fetchedAt:new Date().toISOString()};
 try{
  const draft=store.save(snapshot,[1],'Rechnung A');assert.equal(draft.backupSaved,true);assert.equal(fs.readdirSync(path.join(dir,'backup')).length,1);
  assert.throws(()=>store.save(snapshot,[2,1],'Conflict'));assert.equal(store.reservations().has(2),false);assert.equal(store.list().length,1);
  for(const ids of [[],[1,1],[3],[4],[5],[6],[999]])assert.throws(()=>store.save(snapshot,ids,'Blocked'));
  store.close();store=B.createStore(account,dir);assert.equal(store.reservations().get(1),draft.id);
  const other=B.createStore('b'.repeat(64),dir);assert.equal(other.list().length,0);other.close();
  store.release(draft.id);assert.equal(store.reservations().size,0);assert.equal(store.list()[0].status,'released');store.save(snapshot,[1,2],'Rechnung B');
 }finally{store.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('authenticated preview rechecks upstream before drafts and never writes to Clockodo',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dayrivo-billing-'));let changed=false,calls=[];
 const bridge=createBridge({...credentials},{billingDirectory:dir,fetcher:async(url,options)=>{
  calls.push(options.method);if(url.pathname.includes('customers'))return {ok:true,json:async()=>({data:[{id:7,name:'Test',active:true}],paging:{current_page:1,count_pages:1,count_items:1}})};
  return response([entry(1,{duration:changed?3600:7200})]);
 }});await new Promise(r=>bridge.server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${bridge.server.address().port}`,headers={Origin:'null',Authorization:'Bearer '+bridge.token};
 const get=route=>fetch(base+route,{headers}),post=(route,body)=>fetch(base+route,{method:'POST',headers,body:JSON.stringify(body)});
 try{
  assert.equal((await get('/billing/month?customerId=7&month=2026-09')).status,400);await get('/customers');
  const snapshot=await(await get('/billing/month?customerId=7&month=2026-09')).json();changed=true;
  const body={snapshotId:snapshot.snapshotId,entryIds:[1],title:'Test draft'};
  assert.equal((await post('/billing/drafts',body)).status,409);changed=false;
  const saved=await(await post('/billing/drafts',body)).json();assert.ok(saved.id);assert.equal(saved.backupSaved,true);
  assert.equal((await post('/billing/drafts',body)).status,409);
  const refresh=await(await get('/billing/month?customerId=7&month=2026-09')).json();assert.equal(refresh.rows[0].reservedBy,saved.id);
  assert.equal((await post('/billing/drafts',{...body,snapshotId:refresh.snapshotId})).status,409);
  assert.equal((await fetch(base+'/billing/drafts',{headers:{...headers,Origin:'https://evil.example'}})).status,403);
  assert.equal((await fetch(base+'/billing/drafts',{headers:{Origin:'null'}})).status,401);
  assert.equal((await post('/entries',{})).status,405);
  const listing=await(await get('/billing/drafts')).json();assert.equal(listing.drafts.length,1);assert.ok(!JSON.stringify(listing).includes(credentials.key));
  assert.equal((await post('/billing/release',{id:saved.id})).status,200);assert.ok(calls.every(method=>method==='GET'));
 }finally{bridge.stop();bridge.server.closeAllConnections();await new Promise(r=>bridge.server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
});
module.exports={entry,response};
