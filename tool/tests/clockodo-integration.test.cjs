const {test}=require('node:test'),assert=require('node:assert/strict');
const {createBridge}=require('../clockodo/bridge.cjs'),Model=require('../js/clockodo-model.js'),Master=require('../js/master-data-model.js');
const customer={id:7,name:'Test client',active:true},project={id:9,name:'Test project',active:true,customerId:7};
function catalog(){return {version:1,categories:[{id:'Kunde',name:'Client',group:'work',active:true}],customers:[{id:'manual',name:'Test client',active:true}],projects:[],services:[]};}
test('services keep external identity, reject inactive rows and survive catalog validation',()=>{
 let id=0;const source=catalog(),service={id:30,name:'Animation',active:true};
 const selected=Model.select(source,null,null,()=>`s-${++id}`,service);
 assert.equal(source.services.length,0);Master.validate(selected.catalog);
 assert.equal(selected.service.externalIds.clockodo,'30');
 const again=Model.select(selected.catalog,null,null,()=>assert.fail(),{...service,name:'Animation 3D'});
 assert.equal(again.catalog.services.length,1);assert.equal(again.service.id,selected.service.id);
 assert.throws(()=>Model.select(source,null,null,()=>'',{...service,active:false}));
 assert.throws(()=>Model.select(source,null,null,()=>''));
});
test('direct pairing accepts only a strong bounded session token',()=>{
 for(const sessionToken of ['', 'abc', 'a'.repeat(63), 'A'.repeat(64), 'a'.repeat(64)+'\n'])assert.throws(()=>createBridge({email:'test@example.com',key:'fake'},{sessionToken}));
 const token='b'.repeat(64),bridge=createBridge({email:'test@example.com',key:'fake'},{sessionToken:token});
 assert.equal(bridge.token,token);bridge.stop();
});
test('customer-only import preserves local records, external identity and customer/project association',()=>{
 let id=0;const source=catalog(),before=JSON.stringify(source);
 let selected=Model.select(source,customer,project,()=>`new-${++id}`);
 assert.equal(JSON.stringify(source),before);assert.equal(selected.customer.name,'Test client [Clockodo 7]');
 Master.validate(selected.catalog);assert.equal(selected.project.customerId,selected.customer.id);
 const again=Model.select(selected.catalog,{...customer,name:'Renamed client'},project,()=>assert.fail());
 assert.equal(again.customer.id,selected.customer.id);assert.equal(again.project.id,selected.project.id);
 assert.throws(()=>Model.select(source,customer,{...project,customerId:8},()=>''));
 assert.throws(()=>Model.select(source,{...customer,active:false},null,()=>''));
 assert.equal(Model.eligible('Kunde'),true);
 for(const cat of ['AI / Firma','Spiel','Admin','Familie','Schule','Sport','Routine','Pause','work'])assert.equal(Model.eligible(cat),false);
});
test('loopback bridge rejects unpaired/web-origin/write requests and filters projects',async()=>{
 const calls=[];
 const bridge=createBridge({email:'tester@example.com',key:'fake-test-value'}, {fetcher:async(url,options)=>{
  calls.push({url:String(url),method:options.method});
  const projects=url.pathname.includes('projects');
  return {ok:true,json:async()=>({data:projects?[{...project,customers_id:7}]:[customer],paging:{current_page:1,count_pages:1,count_items:1}})};
 }});
 await new Promise(r=>bridge.server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${bridge.server.address().port}`,headers={Origin:'null',Authorization:`Bearer ${bridge.token}`};
 try{
  assert.equal((await fetch(base+'/status',{headers:{Origin:'null'}})).status,401);
  assert.equal((await fetch(base+'/status',{headers:{...headers,Origin:'https://example.com'}})).status,403);
  const badHost=await new Promise((resolve,reject)=>{require('node:http').get(base+'/status',{headers:{...headers,Host:'evil.example'}},res=>{res.resume();resolve(res.statusCode);}).on('error',reject);});
  assert.equal(badHost,403);
  assert.equal((await fetch(base+'/entries',{headers})).status,404);
  assert.equal((await fetch(base+'/customers',{method:'POST',headers})).status,405);
  assert.equal((await fetch(base+'/projects?customerId=7',{headers})).status,400);
  const clients=await(await fetch(base+'/customers',{headers})).json();assert.equal(clients.rows[0].id,7);
  const projects=await(await fetch(base+'/projects?customerId=7',{headers})).json();assert.equal(projects.customerId,7);assert.equal(projects.rows[0].id,9);
  assert.equal(calls.length,2);assert.ok(calls.every(c=>c.method==='GET'));assert.match(calls[1].url,/customers_id%5D=7/);
  assert.ok(!JSON.stringify(projects).includes('fake-test-value'));
  const options=await fetch(base+'/customers',{method:'OPTIONS',headers:{Origin:'null','Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'authorization'}});assert.equal(options.status,204);
  assert.equal((await fetch(base+'/disconnect',{method:'POST',headers})).status,200);
 }finally{bridge.stop();bridge.server.closeAllConnections();}
});
