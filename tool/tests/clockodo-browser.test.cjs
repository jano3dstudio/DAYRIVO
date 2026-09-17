const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createBridge}=require('../clockodo/bridge.cjs');
(async()=>{
 const bridge=createBridge({email:'tester@example.com',key:'fake-only'},{fetcher:async url=>({ok:true,json:async()=>({
  data:url.pathname.includes('customers')?[{id:7,name:'Studio Testkunde',active:true},{id:8,name:'Zweiter Kunde',active:true}]:[{id:9,name:'Visualisierung',active:true,customers_id:Number(url.searchParams.get('filter[customers_id]'))}],
  paging:{current_page:1,count_pages:1,count_items:url.pathname.includes('customers')?2:1}
 })})});
 await new Promise(r=>bridge.server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);
  await page.locator('#welcomeForm [type=submit]').click();
  await page.locator('#menuButton').click();await page.locator('#menuClockodo').click();
  assert.equal(await page.locator('#clockodoPairCode').isVisible(),false);
  await page.screenshot({path:path.join(__dirname,'artifacts/clockodo-connect.png')});
  await page.locator('.clockodo-help summary').click();
  await page.locator('#clockodoPairCode').fill(`${bridge.server.address().port}.${bridge.token}`);await page.locator('#clockodoPairSubmit').click();
  await page.locator('#clockodoConnectionStatus').filter({hasText:'Verbunden'}).waitFor();await page.keyboard.press('Escape');
  await page.locator('.item-main').first().click();await page.locator('#itemCategory').selectOption('Kunde');await page.locator('#customerDetails summary').click();
  await page.locator('#clockodoChoose').click();await page.locator('#clockodoCustomer').selectOption('7');await page.locator('#clockodoProject').selectOption('9');
  await page.screenshot({path:path.join(__dirname,'artifacts/clockodo-picker.png')});
  await page.locator('#clockodoUse').click();assert.equal(await page.locator('#itemCustomer').inputValue(),'Studio Testkunde');
  const before=await page.evaluate(()=>localStorage.getItem('jsOfficeWeek_v1'));
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>localStorage.getItem('jsOfficeWeek_v1')),before);
  await page.locator('.item-main').first().click();await page.locator('#itemCategory').selectOption('Kunde');await page.locator('#customerDetails summary').click();
  await page.locator('#clockodoChoose').click();await page.locator('#clockodoCustomer').selectOption('7');await page.locator('#clockodoProject').selectOption('9');await page.locator('#clockodoUse').click();
  await page.locator('#itemForm [type=submit]').click();
  let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jsOfficeWeek_v1')));
  const customer=saved.masterData.customers.find(c=>c.externalIds?.clockodo==='7'),project=saved.masterData.projects.find(p=>p.externalIds?.clockodo==='9');
  assert.ok(customer&&project);assert.equal(project.customerId,customer.id);assert.ok(saved.weeks[saved.selectedWeek].items.some(i=>i.customerId===customer.id&&i.projectId===project.id));
  assert.ok(!JSON.stringify(saved).includes(bridge.token));assert.ok(!JSON.stringify(saved).includes('fake-only'));assert.equal(await page.evaluate(()=>location.hash),'');
  await page.reload();await page.locator('.item-main').first().click();await page.locator('#customerDetails summary').click();assert.equal(await page.locator('#itemProject').inputValue(),'Visualisierung');
  await page.screenshot({path:path.join(__dirname,'artifacts/clockodo-entry.png')});
  await page.locator('#clockodoChoose').click();await page.locator('#clockodoCustomer').selectOption('8');await page.locator('#clockodoUse').click();
  await page.locator('#itemForm [type=submit]').click();
  saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jsOfficeWeek_v1')));
  const second=saved.masterData.customers.find(c=>c.externalIds?.clockodo==='8'),changed=saved.weeks[saved.selectedWeek].items.find(i=>i.customerId===second.id);
  assert.equal(changed.projectId,undefined);assert.equal(changed.project,'');
  await page.locator('.item-main').first().click();await page.locator('#customerDetails summary').click();
  await page.locator('#itemCategory').selectOption('AI / Firma');assert.equal(await page.locator('#clockodoChoose').isVisible(),false);
  await page.keyboard.press('Escape');await page.locator('#languageButton').click();await page.locator('#languageMenu [data-language=en]').click();
  await page.locator('#menuButton').click();await page.locator('#menuClockodo').click();await page.locator('#clockodoConnectionStatus').filter({hasText:'Connected'}).waitFor();
  await page.locator('#clockodoDisconnect').click();assert.match(await page.locator('#clockodoConnectionStatus').textContent(),/disconnected/i);
  await page.keyboard.press('Escape');await page.locator('.item-main').first().click();await page.locator('#customerDetails summary').click();await page.locator('#clockodoChoose').click();
  await page.locator('#clockodoPickerStatus').filter({hasText:'Click Start Clockodo'}).waitFor();
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.join(__dirname,'artifacts/clockodo-mobile.png')});
  assert.deepEqual(errors,[]);console.log('PASS: real loopback bridge with fake upstream, customer/project selection, cancel/save, stable links, reload, scope, disconnect, offline, EN/mobile.');
 }finally{await browser.close();bridge.stop();bridge.server.closeAllConnections();}
})().catch(error=>{console.error(error);process.exitCode=1;});
