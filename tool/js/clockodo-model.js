(function(root){
 'use strict';
 const eligible=cat=>cat==='Kunde'; // Stable built-in ID survives category renaming.
 function select(catalog,customer,project,uid,service=null){
  if(project&&project.customerId!==customer?.id)throw Error('Das Projekt gehört zu einem anderen Kunden.');
  const next=JSON.parse(JSON.stringify(catalog));
  function upsert(kind,row,customerId){
   if(!row||!Number.isSafeInteger(row.id)||row.id<1||typeof row.name!=='string'||!row.name.trim()||row.name.length>200||row.active!==true)throw Error('Ungültige Clockodo-Auswahl.');
   let record=next[kind].find(r=>r.externalIds?.clockodo===String(row.id));
   if(record&&kind==='projects'&&record.customerId!==customerId)throw Error('Das Projekt gehört zu einem anderen Kunden.');
   // Do not relink local records just because names happen to match.
   const sameScope=r=>r.id!==record?.id&&(kind!=='projects'||r.customerId===customerId);
   let name=row.name.trim();
   if(next[kind].some(r=>sameScope(r)&&r.name.toLowerCase()===name.toLowerCase()))name=name.slice(0,160)+` [Clockodo ${row.id}]`;
   if(next[kind].some(r=>sameScope(r)&&r.name.toLowerCase()===name.toLowerCase()))throw Error('Clockodo-Name kollidiert mit lokalen Stammdaten.');
   if(!record){record={id:uid()};next[kind].push(record);}
   Object.assign(record,{name,active:true,externalIds:{clockodo:String(row.id)}});
   if(kind==='projects')record.customerId=customerId;
   return record;
  }
  const localCustomer=customer?upsert('customers',customer):null,localProject=project?upsert('projects',project,localCustomer.id):null;
  if(!localCustomer&&!service)throw Error('Ungültige Clockodo-Auswahl.');
  const localService=service?upsert('services',service):null;
  return {catalog:next,customer:localCustomer,project:localProject,service:localService};
 }
 const api={eligible,select};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ClockodoModel=api;
})(globalThis);
