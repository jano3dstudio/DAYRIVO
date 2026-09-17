'use strict';
let clockodoSession=null,clockodoAccount=null,clockodoPending=null,clockodoGeneration=0,clockodoCustomers=[],clockodoProjects=[],clockodoCustomer=null,clockodoCustomerPage=1,clockodoProjectPage=1;
let clockodoServices=[],clockodoPickerMode='entry',clockodoProjectSelection=new Set(),clockodoServiceSelection=new Set();
let clockodoStarting=false,clockodoLaunchGeneration=0;
function launchClockodoProtocol(token){location.href='dayrivo-clockodo://connect/'+token;}
async function startClockodoDirect(){
 if(clockodoStarting)return;
 const generation=++clockodoLaunchGeneration;
 const token=clockodoSession?.port===18744?clockodoSession.token:Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
 const session={port:18744,token};
 clockodoSession=session;clockodoStarting=true;
 try{sessionStorage.setItem('dayrivo.clockodo.session',JSON.stringify(session));}catch{/* Current tab still connects. */}
 $('clockodoStart').disabled=$('clockodoPairSubmit').disabled=$('clockodoPairCode').disabled=true;$('clockodoDisconnect').disabled=false;
 $('clockodoConnectionStatus').textContent=t('Warte auf die Windows-Anmeldung … Öffnen bestätigen und dort anmelden.');
 let connected=false;
 try{
  launchClockodoProtocol(token);
  const deadline=Date.now()+120000;
  while(Date.now()<deadline&&generation===clockodoLaunchGeneration){
   try{
    await clockodoRequest('/status','GET',session,1500);
    if(generation!==clockodoLaunchGeneration)return;
    connected=true;$('clockodoConnectionStatus').textContent=t('Verbunden · Kunden und Projekte lesen');updateClockodoEntry();return;
   }catch(error){
    if(error.message==='Diese Planung ist mit einem anderen Clockodo-Benutzer verknüpft.')throw error;
   }
   await new Promise(resolve=>setTimeout(resolve,800));
  }
  if(generation===clockodoLaunchGeneration)$('clockodoConnectionStatus').textContent=t('Noch nicht verbunden. Anmeldung abschließen oder die Hilfe unter dem Startbutton öffnen.');
 }catch(error){if(generation===clockodoLaunchGeneration)$('clockodoConnectionStatus').textContent=t(error.message);}
 finally{if(generation===clockodoLaunchGeneration){clockodoStarting=false;$('clockodoStart').disabled=connected;$('clockodoPairSubmit').disabled=$('clockodoPairCode').disabled=false;}}
}
function clockodoEligible(){return ClockodoModel.eligible($('itemCategory').value)&&!editingPresetId;}
function updateClockodoEntry(){
 $('clockodoEntryTools').hidden=!clockodoEligible();
 $('clockodoEntryState').textContent=t(clockodoSession?'Lokale Clockodo-Sitzung':'Lokaler Dienst benötigt');
}
function resetClockodoEntry(){clockodoPending=null;updateClockodoEntry();}
function parseClockodoSession(value){
 const match=value.trim().match(/^(\d{1,5})\.([a-f0-9]{64})$/);
 return match&&Number(match[1])>0&&Number(match[1])<=65535?{port:Number(match[1]),token:match[2]}:null;
}
async function clockodoRequest(route,method='GET',session=clockodoSession,timeout=25000){
 if(!session)throw Error('Bitte unter Settings → Clockodo auf Clockodo starten klicken.');
 let response;
 try{response=await fetch(`http://127.0.0.1:${session.port}${route}`,{method,headers:{Authorization:'Bearer '+session.token},signal:AbortSignal.timeout(timeout),cache:'no-store',redirect:'error'});}
 catch{throw Error('Lokaler Dienst nicht erreichbar. Bitte Clockodo erneut starten.');}
 if(!response.ok)throw Error(response.status===401?'Die lokale Sitzung ist abgelaufen. Bitte neu verbinden.':response.status===502?'Clockodo-Abfrage fehlgeschlagen. Bitte Verbindung und Zugang prüfen.':'Clockodo-Auswahl konnte nicht geladen werden.');
 const result=await response.json();
 if(method==='GET'){
  if(typeof result.account!=='string'||!/^[a-f0-9]{64}$/.test(result.account))throw Error('Ungültige Clockodo-Antwort.');
  if(data.settings.clockodoAccount&&data.settings.clockodoAccount!==result.account)throw Error('Diese Planung ist mit einem anderen Clockodo-Benutzer verknüpft.');
  clockodoAccount=result.account;
 }
 return result;
}
async function openClockodoSettings(){
 $('clockodoPairCode').value='';
 if(clockodoStarting){closeMenu();$('clockodoConnectionDialog').showModal();return;}
 closeMenu();$('clockodoConnectionStatus').textContent=t('Verbindung wird geprüft …');$('clockodoConnectionDialog').showModal();
 try{await clockodoRequest('/status','GET',clockodoSession,1500);$('clockodoConnectionStatus').textContent=t('Verbunden · Kunden und Projekte lesen');$('clockodoStart').disabled=true;}
 catch{$('clockodoConnectionStatus').textContent=t('Bereit zum Verbinden.');$('clockodoStart').disabled=false;}
 $('clockodoDisconnect').disabled=!clockodoSession;
}
function clockodoOptions(select,rows,placeholder){
 select.replaceChildren(new Option(t(placeholder),''));
 for(const row of rows){const option=new Option(`${row.name} · #${row.id}${row.active?'':' · '+t('Archiviert')}`,String(row.id));option.disabled=!row.active;select.add(option);}
 select.value='';
}
async function clockodoAll(route,generation){
 const rows=[],ids=new Set();let pages=1,total=null;const deadline=Date.now()+120000;
 for(let page=1;page<=pages;page++){
  if(generation!==clockodoGeneration)return null;
  if(page>100||Date.now()>deadline)throw Error('Die Liste ist zu groß oder wurde während des Ladens geändert. Bitte neu laden.');
  const result=await clockodoRequest(route+(route.includes('?')?'&':'?')+'page='+page);
  if(generation!==clockodoGeneration)return null;
  if(result.page!==page||!Number.isSafeInteger(result.pages)||result.pages<0||result.pages>100||!Number.isSafeInteger(result.total)||result.total<0||!Array.isArray(result.rows)||result.rows.length>100)throw Error('Ungültige Clockodo-Antwort.');
  if(total!==null&&(total!==result.total||pages!==Math.max(1,result.pages)))throw Error('Die Liste ist zu groß oder wurde während des Ladens geändert. Bitte neu laden.');
  total=result.total;pages=Math.max(1,result.pages);
  if(route.startsWith('/projects?')&&result.customerId!==clockodoCustomer?.id)throw Error('Das Projekt gehört zu einem anderen Kunden.');
  for(const row of result.rows){if(!Number.isSafeInteger(row.id)||ids.has(row.id)||typeof row.name!=='string'||typeof row.active!=='boolean')throw Error('Ungültige Clockodo-Antwort.');ids.add(row.id);rows.push(row);}
 }
 if(rows.length!==total)throw Error('Die Liste ist zu groß oder wurde während des Ladens geändert. Bitte neu laden.');
 return rows.sort((a,b)=>a.name.localeCompare(b.name));
}
function clockodoMatches(row,query){return (row.name+' '+row.id).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());}
function filterClockodo(kind){
 const rows=kind==='Customer'?clockodoCustomers:kind==='Project'?clockodoProjects:clockodoServices;
 const search=$('clockodo'+kind+'Search'),select=$('clockodo'+kind),previous=select.value;
 const visible=rows.filter(row=>clockodoMatches(row,search.value));
 clockodoOptions(select,visible,kind==='Customer'?'Kunde auswählen':kind==='Project'?'Ohne Projekt':'Ohne Leistung');
 if(visible.some(row=>String(row.id)===previous&&row.active))select.value=previous;
 if(kind==='Customer'&&previous&&select.value!==previous){clockodoCustomer=null;clearClockodoProject();updateClockodoUse();}
 if(kind!=='Customer'){
  const box=$('clockodo'+kind+'Checks'),selected=kind==='Project'?clockodoProjectSelection:clockodoServiceSelection;box.replaceChildren();
  for(const row of visible){
   const label=document.createElement('label'),check=document.createElement('input'),text=document.createElement('span');check.type='checkbox';check.value=String(row.id);check.checked=selected.has(row.id);check.disabled=!row.active;
   text.textContent=`${row.name} · #${row.id}${row.active?'':' · '+t('Archiviert')}`;
   check.onchange=()=>{if(check.checked)selected.add(row.id);else selected.delete(row.id);updateClockodoUse();};label.append(check,text);box.append(label);
  }
  if(!visible.length){const note=document.createElement('p');note.textContent=t('Keine Treffer.');box.append(note);}
 }
}
function updateClockodoUse(){
 $('clockodoUse').disabled=clockodoPickerMode==='master'?(!clockodoCustomer&&!clockodoServiceSelection.size):!clockodoCustomer;
 if(clockodoPickerMode==='master')$('clockodoUse').textContent=t('In Stammdaten übernehmen')+` (${clockodoProjectSelection.size+clockodoServiceSelection.size+(clockodoCustomer?1:0)})`;
}
function clearClockodoProject(){clockodoProjects=[];clockodoProjectSelection.clear();$('clockodoProjectSearch').value='';filterClockodo('Project');$('clockodoProject').disabled=$('clockodoProjectSearch').disabled=true;}
async function loadClockodoCustomers(){
 const generation=++clockodoGeneration;
 clockodoCustomers=[];clockodoCustomer=null;clockodoServices=[];clockodoServiceSelection.clear();clearClockodoProject();filterClockodo('Customer');filterClockodo('Service');
 $('clockodoUse').disabled=true;$('clockodoCustomer').disabled=$('clockodoCustomerSearch').disabled=true;$('clockodoService').disabled=$('clockodoServiceSearch').disabled=true;
 $('clockodoPickerStatus').textContent=t('Kunden werden geladen …');$('clockodoServiceStatus').textContent='';
 try{
  const rows=await clockodoAll('/customers',generation);if(!rows)return;clockodoCustomers=rows;filterClockodo('Customer');
  // Serial requests: the local bridge deliberately allows one upstream request at a time.
  try{const services=await clockodoAll('/services',generation);if(!services)return;clockodoServices=services;filterClockodo('Service');$('clockodoService').disabled=$('clockodoServiceSearch').disabled=false;}
  catch{if(generation!==clockodoGeneration)return;$('clockodoServiceStatus').textContent=t('Leistungen konnten nicht geladen werden. Dienst aktualisieren oder Leserechte prüfen.');}
  if(generation!==clockodoGeneration)return;
  $('clockodoCustomer').disabled=$('clockodoCustomerSearch').disabled=false;
  $('clockodoPickerStatus').textContent=t(rows.length?'Kunde wählen. Danach erscheinen dessen Projekte.':'Keine Kunden in Clockodo vorhanden.');$('clockodoCustomerSearch').focus();
 }catch(error){if(generation===clockodoGeneration)$('clockodoPickerStatus').textContent=t(error.message);}
}
async function loadClockodoProjects(){
 const generation=++clockodoGeneration,customer=clockodoCustomers.find(r=>String(r.id)===$('clockodoCustomer').value&&r.active);
 clockodoCustomer=customer;clearClockodoProject();$('clockodoUse').disabled=true;if(!customer){updateClockodoUse();return;}
 $('clockodoCustomer').disabled=$('clockodoCustomerSearch').disabled=true;$('clockodoPickerStatus').textContent=t('Projekte werden geladen …');
 try{
  const rows=await clockodoAll(`/projects?customerId=${customer.id}`,generation);if(!rows)return;
  clockodoProjects=rows.map(row=>({...row,customerId:customer.id}));filterClockodo('Project');$('clockodoProject').disabled=$('clockodoProjectSearch').disabled=false;
  updateClockodoUse();$('clockodoPickerStatus').textContent=t(clockodoPickerMode==='master'?'Projekte und Leistungen auswählen. Bereits importierte IDs werden aktualisiert.':'Auswahl wird mit dem Eintrag lokal gespeichert. Keine Zeitübertragung.');
 }catch(error){if(generation===clockodoGeneration){clockodoCustomer=null;$('clockodoPickerStatus').textContent=t(error.message);}}
 finally{if(generation===clockodoGeneration)$('clockodoCustomer').disabled=$('clockodoCustomerSearch').disabled=false;}
}
function openClockodoPicker(mode='entry'){
 if(mode==='entry'&&!clockodoEligible())return;
 clockodoPickerMode=mode;$('clockodoPickerTitle').textContent=t(mode==='master'?'Aus Clockodo importieren':'Kunde, Projekt und Leistung');$('clockodoImportHint').hidden=mode!=='master';
 for(const kind of ['Customer','Project','Service'])$('clockodo'+kind+'Search').value='';
 for(const kind of ['Project','Service']){$('clockodo'+kind).hidden=mode==='master';$('clockodo'+kind+'Checks').hidden=mode!=='master';}
 $('clockodoUse').textContent=t(mode==='master'?'In Stammdaten übernehmen':'Auswahl übernehmen');$('clockodoPickerDialog').showModal();loadClockodoCustomers();
}
function prepareClockodoEntry(item){
 if(!clockodoPending||!ClockodoModel.eligible(item.cat))return;
 if(item.customer!==clockodoPending.customerName||item.project!==clockodoPending.projectName)return;
 if(data.settings.clockodoAccount&&data.settings.clockodoAccount!==clockodoPending.account)throw Error('Diese Planung ist mit einem anderen Clockodo-Benutzer verknüpft.');
 const service=item.service===clockodoPending.serviceName?clockodoPending.service:null;
 const selected=ClockodoModel.select(data.masterData,clockodoPending.customer,clockodoPending.project,P.uid,service);
 MasterData.validate(selected.catalog,MasterData.allItems(data));
 data.masterData=selected.catalog;data.settings.clockodoAccount=clockodoPending.account;
 item.customer=selected.customer.name;item.project=selected.project?.name||'';
 entryMasterRefs.customerId=selected.customer.id;
 if(selected.project)entryMasterRefs.projectId=selected.project.id;else delete entryMasterRefs.projectId;
 if(selected.service){item.service=selected.service.name;entryMasterRefs.serviceId=selected.service.id;}
}
function useClockodoSelection(){
 if(!clockodoAccount)return;
 try{
  if(data.settings.clockodoAccount&&data.settings.clockodoAccount!==clockodoAccount)throw Error('Diese Planung ist mit einem anderen Clockodo-Benutzer verknüpft.');
  if(clockodoPickerMode==='master'){
   if(!clockodoCustomer&&!clockodoServiceSelection.size)return;
   let catalog=data.masterData;
   if(clockodoCustomer)catalog=ClockodoModel.select(catalog,clockodoCustomer,null,P.uid).catalog;
   for(const project of clockodoProjects.filter(row=>clockodoProjectSelection.has(row.id)))catalog=ClockodoModel.select(catalog,clockodoCustomer,project,P.uid).catalog;
   for(const service of clockodoServices.filter(row=>clockodoServiceSelection.has(row.id)))catalog=ClockodoModel.select(catalog,null,null,P.uid,service).catalog;
   const previous=data.settings.clockodoAccount;data.settings.clockodoAccount=clockodoAccount;
   try{commitMasterData(catalog);}catch(error){if(previous===undefined)delete data.settings.clockodoAccount;else data.settings.clockodoAccount=previous;throw error;}
   $('clockodoPickerDialog').close();$('masterStatus').textContent=t('Clockodo-Auswahl gespeichert. Im Wochenplan unter Kundendetails verfügbar.');return;
  }
  if(!clockodoEligible()||!clockodoCustomer)return;
  const project=clockodoProjects.find(row=>String(row.id)===$('clockodoProject').value)||null,service=clockodoServices.find(row=>String(row.id)===$('clockodoService').value)||null;
  const selected=ClockodoModel.select(data.masterData,clockodoCustomer,project,P.uid,service);
  clockodoPending={customer:clockodoCustomer,project,service,account:clockodoAccount,customerName:selected.customer.name,projectName:selected.project?.name||'',serviceName:selected.service?.name||''};
  $('itemCustomer').value=clockodoPending.customerName;$('itemProject').value=clockodoPending.projectName;
  $('itemService').value=clockodoPending.serviceName;delete entryMasterRefs.serviceId;
  delete entryMasterRefs.customerId;delete entryMasterRefs.projectId;refreshMasterSuggestions();
  $('clockodoPickerDialog').close();$('customerDetails').open=true;$('clockodoEntryState').textContent=t('Auswahl bereit · Eintrag speichern');
 }catch(error){$('clockodoPickerStatus').textContent=t(error.message);}
}

function initializeClockodo(){
 try{
  const match=location.hash.match(/^#clockodo=(\d{1,5})\.([a-f0-9]{64})$/);
  if(match&&Number(match[1])>0&&Number(match[1])<=65535){clockodoSession={port:Number(match[1]),token:match[2]};sessionStorage.setItem('dayrivo.clockodo.session',JSON.stringify(clockodoSession));history.replaceState(null,'',location.href.split('#')[0]);}
  else{const saved=JSON.parse(sessionStorage.getItem('dayrivo.clockodo.session')||'null');if(saved&&Number.isInteger(saved.port)&&saved.port>0&&saved.port<=65535&&/^[a-f0-9]{64}$/.test(saved.token))clockodoSession=saved;}
 }catch{/* Session pairing is optional; the offline planner still works. */}
 $('menuClockodo').onclick=openClockodoSettings;$('clockodoChoose').onclick=()=>openClockodoPicker();
 $('masterClockodoImport').hidden=false;$('masterClockodoImport').onclick=()=>openClockodoPicker('master');
 for(const kind of ['Customer','Project','Service'])$('clockodo'+kind+'Search').oninput=()=>filterClockodo(kind);
 $('clockodoStart').onclick=startClockodoDirect;
 $('clockodoPairForm').onsubmit=async event=>{
  event.preventDefault();const next=parseClockodoSession($('clockodoPairCode').value),previous=clockodoSession;
  if(!next){$('clockodoConnectionStatus').textContent=t('Bitte den Verbindungscode aus dem lokalen Fenster einfügen.');return;}
  $('clockodoPairSubmit').disabled=true;clockodoSession=next;
  try{await clockodoRequest('/status');sessionStorage.setItem('dayrivo.clockodo.session',JSON.stringify(next));$('clockodoPairCode').value='';$('clockodoConnectionStatus').textContent=t('Verbunden · Kunden und Projekte lesen');$('clockodoDisconnect').disabled=false;$('clockodoStart').disabled=true;updateClockodoEntry();}
  catch(error){clockodoSession=previous;$('clockodoConnectionStatus').textContent=t(error.message);}
  finally{$('clockodoPairSubmit').disabled=false;}
 };
 $('clockodoPickerDialog').addEventListener('close',()=>++clockodoGeneration);
 $('clockodoCustomer').onchange=()=>loadClockodoProjects();
 $('clockodoUse').onclick=useClockodoSelection;
 $('clockodoDisconnect').onclick=async()=>{
  ++clockodoLaunchGeneration;clockodoStarting=false;$('clockodoStart').disabled=true;
  try{await clockodoRequest('/disconnect','POST');$('clockodoConnectionStatus').textContent=t('Clockodo getrennt. Gespeicherte Zuordnungen bleiben erhalten.');}
  catch{$('clockodoConnectionStatus').textContent=t('Lokal getrennt. Ein noch offenes Anmeldefenster bitte schließen.');}
  clockodoSession=null;clockodoAccount=null;sessionStorage.removeItem('dayrivo.clockodo.session');$('clockodoDisconnect').disabled=true;updateClockodoEntry();
  $('clockodoStart').disabled=$('clockodoPairSubmit').disabled=$('clockodoPairCode').disabled=false;
 };
 updateClockodoEntry();
}
