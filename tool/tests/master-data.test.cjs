const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url'),P=require('../js/planner.js');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1560,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const data=P.createData();P.ensureWeek(data,'2026-09-14');delete data.masterData;
  const first=data.weeks[data.selectedWeek].items.find(i=>i.cat==='Kunde');Object.assign(first,{title:'Pilot',customer:'Studio',project:'Film',service:'Animation'});
  const source=JSON.stringify(data.weeks);
  await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);
  await page.evaluate(data=>localStorage.setItem('jsOfficeWeek_v1',JSON.stringify(data)),data);await page.reload();
  const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('jsOfficeWeek_v1')));
  assert.equal(JSON.stringify((await stored()).weeks),source);
  async function open(){await page.locator('#menuButton').click();await page.locator('#menuMasterData').click();}
  const save=()=>page.locator('#masterForm button[type=submit]').click();
  const close=()=>page.locator('#masterDataDialog [data-close]').click();
  await open();await page.locator('#masterList button[data-record-id="Kunde"]').click();
  await page.locator('#masterName').fill('Kundenarbeit');await save();
  assert.equal((await stored()).masterData.categories.find(c=>c.id==='Kunde').name,'Kundenarbeit');
  assert.equal(JSON.stringify((await stored()).weeks),source);
  await page.locator('#masterNew').click();await page.locator('#masterName').fill('Beratung');await save();
  const category=(await stored()).masterData.categories.find(c=>c.name==='Beratung');assert.equal(category.group,'work');
  await page.locator('#masterNew').click();await page.locator('#masterName').fill('beratung');await save();
  assert.match(await page.locator('#masterError').textContent(),/Name/);
  // Existing text becomes reusable master data; projects are filtered by customer.
  await page.locator('[data-master-kind=customers]').click();await page.locator('#masterName').fill('Neukunde');await save();
  const customer=(await stored()).masterData.customers.find(c=>c.name==='Neukunde');
  await page.locator('[data-master-kind=projects]').click();await page.locator('#masterName').fill('Webinar');await page.locator('#masterCustomer').selectOption(customer.id);await save();
  await page.locator('[data-master-kind=services]').click();await page.locator('#masterName').fill('3D Visualisierung');await save();await close();
  await page.locator('[data-id="'+first.id+'"] .item-main').click();await page.locator('#itemCategory').selectOption(category.id);
  await page.locator('#customerDetails summary').click();await page.locator('#itemCustomer').fill('Neukunde');
  assert.deepEqual(await page.locator('#projectSuggestions option').evaluateAll(options=>options.map(o=>o.value)),['Webinar']);
  await page.locator('#itemProject').fill('Webinar');await page.locator('#itemService').fill('3D Visualisierung');
  if(!await page.locator('#itemActualTime').isVisible())await page.locator('#actualTimeDetails summary').click();
  await page.locator('#itemActualTime').fill('1:15');await page.locator('#feeDetails summary').click();await page.locator('#itemHourlyRate').fill('120');await page.locator('#itemDone').check();
  await page.locator('#itemForm button[type=submit]').click();
  let item=(await stored()).weeks[data.selectedWeek].items.find(i=>i.id===first.id);
  assert.equal(item.customerId,customer.id);assert.ok(item.projectId);assert.ok(item.serviceId);assert.equal(item.actualMinutes,75);
  await page.locator('[data-section=insights]').click();assert.match(await page.locator('[data-finance=done]').textContent(),/150/);
  // Renaming a linked customer updates displayed names, never the stored entry snapshot.
  await open();await page.locator('[data-master-kind=customers]').click();await page.locator('#masterList button[data-record-id="'+customer.id+'"]').click();
  await page.locator('#masterName').fill('Neukunde Studio');await save();await close();
  await page.locator('[data-section=week]').click();await page.locator('[data-id="'+first.id+'"] .item-main').click();
  assert.equal(await page.locator('#itemCustomer').inputValue(),'Neukunde Studio');
  // Management also opens directly from the entry; archive remains selectable here.
  await page.locator('#manageCategories').click();await page.locator('#masterList button[data-record-id="'+category.id+'"]').click();await page.locator('#masterArchive').click();await close();
  assert.equal(await page.locator('#itemCategory').inputValue(),category.id);assert.match(await page.locator('#itemCategory option:checked').textContent(),/Archiviert/);
  await page.locator('#itemDialog [data-close]').first().click();await page.locator('#menuButton').click();await page.locator('#menuAdd').click();
  assert.equal(await page.locator('#itemCategory option[value="'+category.id+'"]').count(),0);
  await page.locator('#itemDialog [data-close]').first().click();
  // Failed writes roll back the catalog in memory as well as persisted storage.
  await open();await page.locator('#masterList button[data-record-id="Kunde"]').click();
  const before=(await stored()).masterData;
  await page.evaluate(()=>{window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new Error('disk full');};});
  await page.locator('#masterName').fill('Nicht gespeichert');await save();assert.match(await page.locator('#masterError').textContent(),/Speichern/);
  await page.evaluate(()=>Storage.prototype.setItem=window.originalSetItem);assert.deepEqual((await stored()).masterData,before);
  await close();await page.reload();await open();
  const out=path.join(__dirname,'artifacts');fs.mkdirSync(out,{recursive:true});
  await page.locator('#masterList button[data-record-id="Kunde"]').click();await page.screenshot({path:path.join(out,'master-data-desktop.png')});
  await close();await page.locator('#languageButton').click();await page.getByRole('menuitemradio',{name:'English'}).click();await open();
  assert.equal(await page.locator('#masterDataTitle').textContent(),'Master data');assert.equal(await page.locator('[data-master-kind=categories]').textContent(),'Categories');
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'master-data-mobile.png')});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);console.log('PASS: migration without entry mutation, category CRUD/archive, duplicate rejection, customer/project/service linking, actual-time metrics, rename, archived selection, rollback, reload, DE/EN, responsive master data.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
