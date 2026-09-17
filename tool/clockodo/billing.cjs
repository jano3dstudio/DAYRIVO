'use strict';
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const positive=n=>Number.isSafeInteger(n)&&n>0;
const clean=s=>typeof s==='string'?s.replace(/[\x00-\x1f\x7f-\x9f]/g,' ').slice(0,2000):'';
const fingerprint=row=>crypto.createHash('sha256').update(JSON.stringify(row)).digest('hex');
// Billing months use an explicit zone, never the workstation's implicit timezone.
function monthRange(month){
 if(!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))throw Error('Invalid month');
 const [year,m]=month.split('-').map(Number);
 function midnight(y,m){
  const wall=Date.UTC(y,m,1),format=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',timeZoneName:'longOffset'});
  const offset=format.formatToParts(new Date(wall)).find(p=>p.type==='timeZoneName').value.match(/GMT([+-])(\d{2}):(\d{2})/);
  if(!offset)throw Error('Timezone unavailable');
  return wall-(offset[1]==='+'?1:-1)*(Number(offset[2])*60+Number(offset[3]))*60000;
 }
 return {start:midnight(year,m-1),end:midnight(year,m),zone:'Europe/Berlin'};
}
function normalize(row,customerId,range){
 if(!positive(row?.id)||row.customers_id!==customerId||![1,2,3].includes(row.type)||![0,1,2].includes(row.billable)||
  !(row.projects_id===null||positive(row.projects_id))||!Number.isFinite(Date.parse(row.time_since)))throw Error('Unexpected entry');
 const seconds=row.type===1?row.duration:null;
 const running=row.type===1&&row.clocked===true&&row.time_until===null;
 if(row.type===1&&!running&&(!Number.isSafeInteger(seconds)||seconds<0))throw Error('Invalid duration');
 const start=Date.parse(row.time_since),end=row.time_until==null?null:Date.parse(row.time_until);
 if(end!==null&&!Number.isFinite(end))throw Error('Invalid end');
 const money=value=>{if(value==null)return null;if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1e9)throw Error('Invalid amount');return Math.round(value*100);};
 return {id:row.id,customerId,projectId:row.projects_id,project:clean(row.projects_name)|| (row.projects_id?`#${row.projects_id}`:''),
  service:clean(row.services_name),description:clean(row.text),type:row.type,billable:row.billable,
  start:row.time_since,end:row.time_until??null,seconds:running?null:seconds,running,
  boundary:start<range.start||start>=range.end||(end!==null&&end>range.end),
  revenueCents:money(row.revenue),hourlyRateCents:money(row.hourly_rate),changedAt:clean(row.time_last_change)};
}
async function readMonth(credentials,customerId,month,fetcher=fetch){
 if(!positive(customerId))throw Error('Invalid customer');
 const range=monthRange(month),rows=[],ids=new Set(),deadline=Date.now()+120000;let count=null,pages=null;
 for(let page=1;page<=100;page++){
  if(Date.now()>deadline)throw Error('Month fetch timed out');
  const url=new URL('https://my.clockodo.com/api/v2/entries');
  for(const [key,value] of Object.entries({time_since:new Date(range.start).toISOString(),time_until:new Date(range.end-1000).toISOString(),enhanced_list:'true',items_per_page:1000,page,'filter[customers_id]':customerId}))url.searchParams.set(key,String(value));
  const response=await fetcher(url,{method:'GET',redirect:'error',signal:AbortSignal.timeout(20000),headers:{Accept:'application/json','X-ClockodoApiUser':credentials.email,'X-ClockodoApiKey':credentials.key,'X-Clockodo-External-Application':`DAYRIVO billing preview;${credentials.email}`}});
  if(!response.ok)throw Error('Clockodo unavailable');
  const body=await response.json(),p=body?.paging;
  if(!p||p.current_page!==page||!Number.isSafeInteger(p.count_pages)||p.count_pages<0||p.count_pages>100||!Number.isSafeInteger(p.count_items)||p.count_items<0||!Array.isArray(body.entries)||body.entries.length>1000)throw Error('Incomplete month');
  if(count!==null&&(count!==p.count_items||pages!==p.count_pages))throw Error('Month changed during fetch');
  count=p.count_items;pages=p.count_pages;
  for(const raw of body.entries){const row=normalize(raw,customerId,range);if(ids.has(row.id))throw Error('Duplicate entry');ids.add(row.id);rows.push(row);}
  if(page>=pages)break;
 }
 if(rows.length!==count)throw Error('Incomplete month');
 return {month,customerId,zone:range.zone,fetchedAt:new Date().toISOString(),rows};
}
function createStore(account,directory){
 const {DatabaseSync}=require('node:sqlite');
 if(!/^[a-f0-9]{64}$/.test(account))throw Error('Invalid account');
 fs.mkdirSync(directory,{recursive:true});
 const file=path.join(directory,account+'.sqlite'),db=new DatabaseSync(file);
 db.exec('PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS drafts(id TEXT PRIMARY KEY, created TEXT NOT NULL, status TEXT NOT NULL, payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS reservations(entry INTEGER PRIMARY KEY, draft TEXT NOT NULL);');
 function list(){return db.prepare('SELECT id,created,status,payload FROM drafts ORDER BY created DESC').all().map(r=>({...JSON.parse(r.payload),id:r.id,createdAt:r.created,status:r.status}));}
 function reservations(){return new Map(db.prepare('SELECT entry,draft FROM reservations').all().map(r=>[r.entry,r.draft]));}
 function backup(){
  const folder=path.join(directory,'backup');fs.mkdirSync(folder,{recursive:true});
  const target=path.join(folder,account+'-'+Date.now()+'-'+crypto.randomUUID()+'.json');
  fs.writeFileSync(target+'.tmp',JSON.stringify({app:'DAYRIVO billing preview',version:1,account,drafts:list()},null,2),{flag:'wx'});
  fs.renameSync(target+'.tmp',target);
 }
 function save(snapshot,entryIds,title){
  if(!Array.isArray(entryIds)||!entryIds.length||entryIds.length>10000||entryIds.some(id=>!positive(id))||new Set(entryIds).size!==entryIds.length||typeof title!=='string'||!title.trim()||title.length>120)throw Error('Invalid draft');
  const selected=entryIds.map(id=>snapshot.rows.find(r=>r.id===id));
  if(selected.some(r=>!r||r.billable!==1||r.running||r.boundary))throw Error('Entry not eligible');
  const id=crypto.randomUUID(),payload={title:title.trim(),month:snapshot.month,customerId:snapshot.customerId,zone:snapshot.zone,sourceFetchedAt:snapshot.fetchedAt,rows:selected};
  db.exec('BEGIN IMMEDIATE');
  try{db.prepare('INSERT INTO drafts VALUES(?,?,?,?)').run(id,new Date().toISOString(),'draft',JSON.stringify(payload));for(const row of selected)db.prepare('INSERT INTO reservations VALUES(?,?)').run(row.id,id);db.exec('COMMIT');}
  catch(error){db.exec('ROLLBACK');throw error;}
  let backupSaved=true;try{backup();}catch{backupSaved=false;}
  return {id,backupSaved};
 }
 function release(id){
  if(typeof id!=='string'||id.length>100)throw Error('Invalid draft');
  db.exec('BEGIN IMMEDIATE');
  try{const result=db.prepare("UPDATE drafts SET status='released' WHERE id=? AND status='draft'").run(id);if(!result.changes)throw Error('Unknown draft');db.prepare('DELETE FROM reservations WHERE draft=?').run(id);db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}
  let backupSaved=true;try{backup();}catch{backupSaved=false;}return {backupSaved};
 }
 return {list,reservations,save,release,close:()=>db.close(),file};
}
module.exports={monthRange,normalize,readMonth,createStore,fingerprint};
