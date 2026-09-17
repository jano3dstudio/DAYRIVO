'use strict';
function initializeBilling(){
 const button=$('billingButton'),dialog=document.createElement('dialog');dialog.id='billingDialog';document.body.append(dialog);
 const b=(de,en)=>I18N.language==='en'?en:de;
 const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!=null)el.textContent=text;if(className)el.className=className;return el;};
 const number=n=>new Intl.NumberFormat(I18N.locale,{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
 const hours=rows=>number(rows.reduce((n,r)=>n+(r.seconds||0),0)/3600)+' h';
 const amount=rows=>rows.some(r=>r.revenueCents===null)?b('Betrag unvollständig','Amount incomplete'):number(rows.reduce((n,r)=>n+r.revenueCents,0)/100);
 let generation=0,snapshot=null,selected=new Set(),busy=false;
 let status,month,customer,projects,title,save,drafts,summary,loadButton,connectButton;
 function message(text){status.textContent=text;}
 async function request(route,body){
  if(!clockodoSession)throw Error(b('Bitte zuerst Clockodo verbinden.','Please connect Clockodo first.'));
  let response;try{response=await fetch(`http://127.0.0.1:${clockodoSession.port}${route}`,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+clockodoSession.token},body:body?JSON.stringify(body):undefined,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(180000)});}catch{throw Error(b('Dienst nicht erreichbar. Clockodo neu starten.','Service unavailable. Restart Clockodo.'));}
  if(!response.ok)throw Error(b('Nicht gespeichert oder geladen. Monat neu laden; Verbindung und Auswahl prüfen.','Could not save or load. Reload the month and check your connection and selection.'));
  const result=await response.json();if(typeof result.account!=='string'||(clockodoAccount&&clockodoAccount!==result.account)||(data.settings.clockodoAccount&&data.settings.clockodoAccount!==result.account))throw Error(b('Anderer Clockodo-Benutzer.','Different Clockodo account.'));
  return result;
 }
 const eligible=r=>r.billable===1&&!r.running&&!r.boundary&&!r.reservedBy;
 function setBusy(value){busy=value;loadButton.disabled=customer.disabled=month.disabled=connectButton.disabled=value;save.disabled=value||!selected.size||!snapshot;projects.querySelectorAll('input').forEach(input=>input.disabled=value||input.dataset.blocked==='true');drafts.querySelectorAll('button').forEach(el=>el.disabled=value);}
 function selectionSummary(){const rows=(snapshot?.rows||[]).filter(r=>selected.has(r.id));summary.textContent=`${b('Ausgewählt','Selected')}: ${rows.length} · ${hours(rows)} · ${b('Betrag laut Clockodo','Amount from Clockodo')}: ${amount(rows)}`;save.disabled=busy||!rows.length;}
 function reason(row){return row.reservedBy?b('In Entwurf reserviert','Reserved in draft'):row.running?b('Uhr läuft','Timer running'):row.boundary?b('Monatsgrenze prüfen','Review month boundary'):row.billable===2?b('Bereits abgerechnet','Already billed'):row.billable===0?b('Nicht abrechenbar','Not billable'):b('Offen','Open');}
 function renderRows(){
  projects.replaceChildren();selected.clear();
  if(!snapshot?.rows.length){projects.append(node('p',b('Keine Buchungen für diesen Kunden im Monat.','No entries for this customer in this month.')));selectionSummary();return;}
  const groups=new Map();for(const row of snapshot.rows){const key=row.projectId??0;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}
  for(const rows of groups.values()){
   const box=node('section',null,'billing-project'),head=node('div',null,'billing-project-head'),label=node('label'),check=node('input');check.type='checkbox';check.className='billing-project-check';
   const available=rows.filter(eligible);check.disabled=!available.length;check.dataset.blocked=String(!available.length);
   label.append(check,node('strong',rows[0].project||b('Ohne Projekt','No project')));head.append(label,node('span',b('Erfasst: ','Recorded: ')+hours(rows)));box.append(head);
   box.append(node('p',`${available.length} ${b('offene Buchungen','open entries')} · ${hours(available)} · ${b('Betrag offen','Open amount')}: ${amount(available)}`));
   const details=node('details'),caption=node('summary',b('Buchungen ansehen / einzeln wählen','View entries / select individually'));details.append(caption);
   const children=[];
   for(const row of rows){const line=node('label',null,'billing-entry'),input=node('input');input.type='checkbox';input.className='billing-entry-check';input.disabled=!eligible(row);input.dataset.blocked=String(!eligible(row));
    const desc=node('span'),date=new Intl.DateTimeFormat(I18N.locale,{timeZone:'Europe/Berlin',day:'2-digit',month:'2-digit'}).format(new Date(row.start));
    desc.append(node('strong',`${date} · ${row.service||row.project||'#'+row.id}`),node('small',row.description),node('small',`${row.seconds==null?'—':hours([row])} · ${reason(row)} · ${row.revenueCents==null?b('Betrag fehlt','Amount missing'):number(row.revenueCents/100)}`));
    input.onchange=()=>{input.checked?selected.add(row.id):selected.delete(row.id);check.checked=available.length>0&&available.every(r=>selected.has(r.id));check.indeterminate=available.some(r=>selected.has(r.id))&&!check.checked;selectionSummary();};children.push({input,row});line.append(input,desc);details.append(line);
   }
   check.onchange=()=>{for(const {input,row} of children)if(eligible(row)){input.checked=check.checked;check.checked?selected.add(row.id):selected.delete(row.id);}check.indeterminate=false;selectionSummary();};
   box.append(details);projects.append(box);
  }
  selectionSummary();
 }
 async function refreshDrafts(gen){
  const result=await request('/billing/drafts');if(gen!==generation)return;drafts.replaceChildren();
  const active=result.drafts.filter(d=>d.status==='draft');
  if(!active.length)drafts.append(node('p',b('Noch keine Entwürfe.','No drafts yet.')));
  for(const draft of active){const line=node('article',null,'billing-draft');line.append(node('strong',draft.title),node('p',`${draft.month} · ${b('Kunde','Customer')} #${draft.customerId} · ${hours(draft.rows)} · ${amount(draft.rows)}`));
   const detail=node('details');detail.append(node('summary',b('Gespeicherte Auswahl','Saved selection')));for(const row of draft.rows)detail.append(node('p',`${row.project||b('Ohne Projekt','No project')} · ${row.service} · ${row.description}`));line.append(detail);
   const release=node('button',b('Entwurf auflösen','Release draft'));release.type='button';release.onclick=async()=>{if(busy)return;setBusy(true);try{const result=await request('/billing/release',{id:draft.id});if(gen!==generation)return;snapshot=null;selected.clear();projects.replaceChildren();selectionSummary();await refreshDrafts(gen);message(result.backupSaved?b('Auswahl freigegeben. Monat neu laden.','Selection released. Reload the month.'):b('Freigegeben, aber Backup fehlgeschlagen.','Released, but backup failed.'));}catch(error){message(error.message);}finally{if(gen===generation)setBusy(false);}};
   line.append(release);drafts.append(line);
  }
 }
 async function loadMonth(){if(busy||!customer.value)return;const gen=generation;setBusy(true);snapshot=null;selected.clear();projects.replaceChildren();selectionSummary();message(b('Kundenzeiten werden gelesen …','Reading customer entries …'));
  try{const result=await request(`/billing/month?customerId=${encodeURIComponent(customer.value)}&month=${encodeURIComponent(month.value)}`);if(gen!==generation)return;snapshot=result;title.value=customer.selectedOptions[0].textContent+' · '+month.value;renderRows();await refreshDrafts(gen);message(b('Vollständig geladen · Europe/Berlin · Beträge laut Clockodo, Währung vor Abrechnung prüfen.','Loaded completely · Europe/Berlin · amounts from Clockodo; verify currency before billing.'));}catch(error){if(gen===generation)message(error.message);}finally{if(gen===generation)setBusy(false);}}
 function field(label,input){const wrap=node('label',label);wrap.append(input);return wrap;}
 button.onclick=async()=>{
  closeMenu();const gen=++generation;busy=false;snapshot=null;selected.clear();dialog.replaceChildren();
  const heading=node('div',null,'dialog-heading'),close=node('button','×');close.setAttribute('aria-label',t('Schließen'));close.onclick=()=>dialog.close();heading.append(node('h2',b('Monatsabschluss','Month close')),close);
  dialog.append(heading,node('p',b('Kundenzeiten prüfen und Projekte für eigene Rechnungen zusammenstellen. Die PDF-Erzeugung wird vorbereitet; aktuell speicherst du nur Entwürfe.','Review customer time and select projects for your own invoices. PDF generation is being prepared; currently you can save drafts only.')));
  const controls=node('div',null,'billing-controls');month=node('input');month.type='month';month.value=data.selectedWeek.slice(0,7);month.id='billingMonth';customer=node('select');customer.id='billingCustomer';customer.append(new Option(b('Kunde auswählen','Select customer'),''));
  loadButton=node('button',b('Monat laden','Load month'));loadButton.id='billingLoad';loadButton.onclick=loadMonth;
  connectButton=node('button',b('Clockodo verbinden','Connect Clockodo'));connectButton.onclick=()=>{dialog.close();openClockodoSettings();};
  controls.append(field(b('Monat','Month'),month),field(b('Kunde','Customer'),customer),loadButton,connectButton);dialog.append(controls);
  status=node('p',null,'billing-status');status.id='billingStatus';status.setAttribute('role','status');projects=node('div');projects.id='billingProjects';summary=node('p');summary.id='billingSummary';
  title=node('input');title.id='billingTitle';title.maxLength=120;save=node('button',b('Auswahl als Entwurf speichern','Save selection as draft'),'primary');save.id='billingSave';save.disabled=true;
  dialog.append(status,projects,summary,field(b('Entwurfsname','Draft name'),title),save,node('h3',b('Gespeicherte Entwürfe','Saved drafts')));drafts=node('div');drafts.id='billingDrafts';dialog.append(drafts,node('p',b('Lokale Datenbank und separate Backups unter %LOCALAPPDATA%/DAYRIVO/billing. Kein Rechnungsversand, keine Rechnungsnummer, keine Abgerechnet-Markierung.','Local database and separate backups in %LOCALAPPDATA%/DAYRIVO/billing. No sending, invoice number or billed-status updates.'),'dialog-note'));
  const invalidate=()=>{snapshot=null;selected.clear();projects.replaceChildren();selectionSummary();message(b('Monat laden, um diese Auswahl zu prüfen.','Load the month to review this selection.'));};month.onchange=customer.onchange=invalidate;
  save.onclick=async()=>{if(busy||!snapshot)return;setBusy(true);try{const result=await request('/billing/drafts',{snapshotId:snapshot.snapshotId,entryIds:[...selected],title:title.value});if(gen!==generation)return;snapshot=null;selected.clear();projects.replaceChildren();selectionSummary();await refreshDrafts(gen);message(result.backupSaved?b('Entwurf und Backup gespeichert. Für eine weitere Rechnung den Monat neu laden.','Draft and backup saved. Reload the month for another invoice.'):b('Entwurf gespeichert, aber Backup fehlgeschlagen. Nicht erneut speichern.','Draft saved, but backup failed. Do not save again.'));}catch(error){if(gen===generation)message(error.message);}finally{if(gen===generation)setBusy(false);}};
  dialog.showModal();message(b('Verbindung wird geprüft …','Checking connection …'));setBusy(true);
  try{const result=await clockodoRequest('/status');if(!result.billingPreview)throw Error(b('Clockodo-Dienst bitte neu starten: Monatsabschluss benötigt die neue Version.','Restart the Clockodo service: month close requires the new version.'));
   for(let page=1;page<=100;page++){const result=await clockodoRequest('/customers?page='+page);if(gen!==generation)return;for(const row of result.rows)customer.add(new Option(`${row.name} · #${row.id}`,String(row.id)));if(page>=result.pages)break;if(page===100)throw Error(b('Kundenliste zu groß.','Customer list too large.'));}
   if(gen!==generation)return;await refreshDrafts(gen);message(b('Kunde und Monat wählen. Archivierte Kunden sind ebenfalls verfügbar.','Choose a customer and month. Archived customers are also available.'));
  }catch(error){if(gen===generation)message(t(error.message));}finally{if(gen===generation)setBusy(false);}
 };
 dialog.addEventListener('close',()=>{++generation;snapshot=null;selected.clear();});
}
