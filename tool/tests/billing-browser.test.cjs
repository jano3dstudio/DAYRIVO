const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),os=require('node:os');
const {pathToFileURL}=require('node:url'),{createBridge}=require('../clockodo/bridge.cjs');
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dayrivo-billing-ui-'));
 const rows=[{id:1,customers_id:7,projects_id:9,projects_name:'Visualisierung',services_name:'3D-Visualisierung',type:1,billable:1,time_since:'2026-09-10T08:00:00Z',time_until:'2026-09-10T10:00:00Z',duration:7200,clocked:true,revenue:240,hourly_rate:120,text:'Korrekturen und Rendering'},
 {id:2,customers_id:7,projects_id:10,projects_name:'Animation',services_name:'Animation',type:1,billable:1,time_since:'2026-09-11T08:00:00Z',time_until:'2026-09-11T09:00:00Z',duration:3600,clocked:true,text:'Fehlender Betrag'},
 {id:3,customers_id:7,projects_id:9,projects_name:'Visualisierung',type:1,billable:2,time_since:'2026-09-12T08:00:00Z',time_until:'2026-09-12T09:00:00Z',duration:3600,clocked:true,revenue:120}];
 const bridge=createBridge({email:'test@example.com',key:'fake-only'},{billingDirectory:dir,fetcher:async url=>({ok:true,json:async()=>url.pathname.includes('customers')?{data:[{id:7,name:'Studio Beispiel',active:true}],paging:{current_page:1,count_pages:1,count_items:1}}:{entries:rows,paging:{current_page:1,count_pages:1,count_items:rows.length}}})});
 await new Promise(r=>bridge.server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href+`#clockodo=${bridge.server.address().port}.${bridge.token}`);await page.locator('#welcomeForm [type=submit]').click();
  const before=await page.evaluate(()=>localStorage.getItem('jsOfficeWeek_v1'));
  await page.locator('#billingButton').click();await page.locator('#billingCustomer').selectOption('7');await page.locator('#billingMonth').fill('2026-09');await page.locator('#billingLoad').click();await page.locator('#billingStatus').filter({hasText:'Vollständig'}).waitFor();
  assert.equal(await page.locator('.billing-project').count(),2);assert.match(await page.locator('#billingProjects').innerText(),/Betrag unvollständig/);
  await page.locator('.billing-project-check').first().check();await page.locator('#billingTitle').fill('September · Visualisierung');
  fs.mkdirSync(path.join(__dirname,'artifacts'),{recursive:true});await page.screenshot({path:path.join(__dirname,'artifacts/billing-desktop.png')});
  await page.locator('#billingSave').click();await page.locator('#billingStatus').filter({hasText:'Entwurf und Backup gespeichert'}).waitFor();assert.equal(await page.locator('.billing-draft').count(),1);
  await page.reload();await page.locator('#billingButton').click();await page.locator('.billing-draft').waitFor();await page.locator('#billingCustomer').selectOption('7');await page.locator('#billingMonth').fill('2026-09');await page.locator('#billingLoad').click();await page.locator('#billingStatus').filter({hasText:'Vollständig'}).waitFor();
  assert.equal(await page.locator('.billing-project-check').first().isDisabled(),true);
  assert.equal(await page.evaluate(()=>localStorage.getItem('jsOfficeWeek_v1')),before);
  await page.keyboard.press('Escape');await page.locator('#languageButton').click();await page.locator('#languageMenu [data-language=en]').click();await page.locator('#billingButton').click();await page.locator('.billing-draft').waitFor();assert.match(await page.locator('#billingDialog h2').innerText(),/Month close/);
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(__dirname,'artifacts/billing-mobile.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.locator('.billing-draft button').click();await page.locator('#billingStatus').filter({hasText:'Selection released'}).waitFor();assert.equal(await page.locator('.billing-draft').count(),0);
  assert.deepEqual(errors,[]);console.log('PASS: month close, missing amounts, draft persistence, duplicate prevention, plan unchanged, EN/mobile, release.');
 }finally{await browser.close();bridge.stop();bridge.server.closeAllConnections();await new Promise(r=>bridge.server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
