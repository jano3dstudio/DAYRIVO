'use strict';
let clockodoSession=null,clockodoAccount=null,clockodoPending=null,clockodoGeneration=0,clockodoCustomers=[],clockodoProjects=[],clockodoCustomer=null,clockodoCustomerPage=1,clockodoProjectPage=1;
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
function clockodoPageText(result){return tr`Seite ${result.page} von ${Math.max(1,result.pages)} · ${result.total} insgesamt`;}
function clockodoOptions(select,rows,placeholder){
 select.replaceChildren(new Option(t(placeholder),''));
 for(const row of rows){const option=new Option(`${row.name} · #${row.id}${row.active?'':' · '+t('Archiviert')}`,String(row.id));option.disabled=!row.active;select.add(option);}
}
function clearClockodoProject(){clockodoProjects=[];clockodoOptions($('clockodoProject'),[], 'Ohne Projekt');$('clockodoProject').disabled=true;$('clockodoProjectsNext').disabled=true;$('clockodoProjectsPrevious').disabled=true;$('clockodoProjectsPage').textContent='';}
async function loadClockodoCustomers(page=1){
 const generation=++clockodoGeneration;
 clockodoCustomer=null;clearClockodoProject();$('clockodoUse').disabled=true;$('clockodoCustomer').disabled=true;$('clockodoPickerStatus').textContent=t('Kunden werden geladen …');
 $('clockodoCustomersNext').disabled=$('clockodoCustomersPrevious').disabled=true;
 try{
  const result=await clockodoRequest('/customers?page='+page);if(generation!==clockodoGeneration)return;
  clockodoCustomers=result.rows;clockodoCustomerPage=page;clockodoOptions($('clockodoCustomer'),result.rows,'Kunde auswählen');$('clockodoCustomer').disabled=false;
  $('clockodoCustomersPage').textContent=clockodoPageText(result);$('clockodoCustomersPrevious').disabled=page<=1;$('clockodoCustomersNext').disabled=page>=result.pages;
  $('clockodoPickerStatus').textContent=t(result.total?'Kunde wählen. Danach erscheinen dessen Projekte.':'Keine Kunden in Clockodo vorhanden.');
 }catch(error){if(generation===clockodoGeneration)$('clockodoPickerStatus').textContent=t(error.message);}
}
async function loadClockodoProjects(page=1){
 const generation=++clockodoGeneration,customer=clockodoCustomers.find(r=>String(r.id)===$('clockodoCustomer').value);
 clockodoCustomer=customer;clearClockodoProject();$('clockodoUse').disabled=true;if(!customer)return;
 $('clockodoPickerStatus').textContent=t('Projekte werden geladen …');
 try{
  const result=await clockodoRequest(`/projects?customerId=${customer.id}&page=${page}`);if(generation!==clockodoGeneration)return;
  if(result.customerId!==customer.id)throw Error('Das Projekt gehört zu einem anderen Kunden.');
  clockodoProjects=result.rows.map(row=>({...row,customerId:customer.id}));clockodoProjectPage=page;
  clockodoOptions($('clockodoProject'),clockodoProjects,'Ohne Projekt');$('clockodoProject').disabled=false;$('clockodoUse').disabled=false;
  $('clockodoProjectsPage').textContent=clockodoPageText(result);$('clockodoProjectsPrevious').disabled=page<=1;$('clockodoProjectsNext').disabled=page>=result.pages;
  $('clockodoPickerStatus').textContent=t('Auswahl wird mit dem Eintrag lokal gespeichert. Keine Zeitübertragung.');
 }catch(error){if(generation===clockodoGeneration)$('clockodoPickerStatus').textContent=t(error.message);}
}
function openClockodoPicker(){
 if(!clockodoEligible())return;
 $('clockodoCustomersPage').textContent='';$('clockodoPickerDialog').showModal();loadClockodoCustomers();
}
function prepareClockodoEntry(item){
 if(!clockodoPending||!ClockodoModel.eligible(item.cat))return;
 if(item.customer!==clockodoPending.customerName||item.project!==clockodoPending.projectName)return;
 if(data.settings.clockodoAccount&&data.settings.clockodoAccount!==clockodoPending.account)throw Error('Diese Planung ist mit einem anderen Clockodo-Benutzer verknüpft.');
 const selected=ClockodoModel.select(data.masterData,clockodoPending.customer,clockodoPending.project,P.uid);
 MasterData.validate(selected.catalog,MasterData.allItems(data));
 data.masterData=selected.catalog;data.settings.clockodoAccount=clockodoPending.account;
 item.customer=selected.customer.name;item.project=selected.project?.name||'';
 entryMasterRefs.customerId=selected.customer.id;
 if(selected.project)entryMasterRefs.projectId=selected.project.id;else delete entryMasterRefs.projectId;
}
function initializeClockodo(){
 try{
  const match=location.hash.match(/^#clockodo=(\d{1,5})\.([a-f0-9]{64})$/);
  if(match&&Number(match[1])>0&&Number(match[1])<=65535){clockodoSession={port:Number(match[1]),token:match[2]};sessionStorage.setItem('dayrivo.clockodo.session',JSON.stringify(clockodoSession));history.replaceState(null,'',location.href.split('#')[0]);}
  else{const saved=JSON.parse(sessionStorage.getItem('dayrivo.clockodo.session')||'null');if(saved&&Number.isInteger(saved.port)&&saved.port>0&&saved.port<=65535&&/^[a-f0-9]{64}$/.test(saved.token))clockodoSession=saved;}
 }catch{/* Session pairing is optional; the offline planner still works. */}
 $('menuClockodo').onclick=openClockodoSettings;$('clockodoChoose').onclick=openClockodoPicker;
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
 $('clockodoCustomersNext').onclick=()=>loadClockodoCustomers(clockodoCustomerPage+1);$('clockodoCustomersPrevious').onclick=()=>loadClockodoCustomers(clockodoCustomerPage-1);
 $('clockodoProjectsNext').onclick=()=>loadClockodoProjects(clockodoProjectPage+1);$('clockodoProjectsPrevious').onclick=()=>loadClockodoProjects(clockodoProjectPage-1);
 $('clockodoUse').onclick=()=>{
  if(!clockodoEligible()||!clockodoCustomer||!clockodoAccount)return;
  const project=clockodoProjects.find(p=>String(p.id)===$('clockodoProject').value)||null;
  try{
   const selected=ClockodoModel.select(data.masterData,clockodoCustomer,project,P.uid);
   clockodoPending={customer:clockodoCustomer,project,account:clockodoAccount,customerName:selected.customer.name,projectName:selected.project?.name||''};
   $('itemCustomer').value=clockodoPending.customerName;$('itemProject').value=clockodoPending.projectName;
   delete entryMasterRefs.customerId;delete entryMasterRefs.projectId;refreshMasterSuggestions();
   $('clockodoPickerDialog').close();$('customerDetails').open=true;$('clockodoEntryState').textContent=t('Auswahl bereit · Eintrag speichern');
  }catch(error){$('clockodoPickerStatus').textContent=t(error.message);}
 };
 $('clockodoDisconnect').onclick=async()=>{
  ++clockodoLaunchGeneration;clockodoStarting=false;$('clockodoStart').disabled=true;
  try{await clockodoRequest('/disconnect','POST');$('clockodoConnectionStatus').textContent=t('Clockodo getrennt. Gespeicherte Zuordnungen bleiben erhalten.');}
  catch{$('clockodoConnectionStatus').textContent=t('Lokal getrennt. Ein noch offenes Anmeldefenster bitte schließen.');}
  clockodoSession=null;clockodoAccount=null;sessionStorage.removeItem('dayrivo.clockodo.session');$('clockodoDisconnect').disabled=true;updateClockodoEntry();
  $('clockodoStart').disabled=$('clockodoPairSubmit').disabled=$('clockodoPairCode').disabled=false;
 };
 updateClockodoEntry();
}
