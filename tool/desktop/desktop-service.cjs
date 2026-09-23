'use strict';
// Private child process. A closed stdin means the owning desktop app has exited.
const readline=require('node:readline');
const {createBridge}=require('./bridge.cjs'),{probe}=require('./client.cjs');
const input=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
let bridge,starting=false;
input.on('close',()=>{if(bridge)bridge.stop();else process.exit(0);});
input.once('line',async line=>{
 if(starting)return;starting=true;
 try{
  if(line.length>4096)throw Error('size');
  const credentials=JSON.parse(line);line='';
  const testing=process.argv.includes('--self-test');
  const fetcher=testing?async url=>({ok:true,json:async()=>({data:url.pathname.includes('customers')?[{id:7,name:'Demo Studio',active:true}]:url.pathname.includes('services')?[{id:30,name:'3D Visualisierung',active:true}]:[{id:9,name:'Desktop-Testprojekt',active:true,customers_id:7}],paging:{current_page:1,count_pages:1,count_items:1}})}):fetch;
  await probe({...credentials,kind:'customers'},fetcher);
  bridge=createBridge(credentials,{fetcher});
  bridge.server.once('error',()=>{process.stdout.write(JSON.stringify({ok:false})+'\n');bridge.stop();});
  bridge.server.listen(0,'127.0.0.1',()=>process.stdout.write(JSON.stringify({ok:true,port:bridge.server.address().port,token:bridge.token})+'\n'));
 }catch{process.stdout.write(JSON.stringify({ok:false})+'\n');input.close();}
});
