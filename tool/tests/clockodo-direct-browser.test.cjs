const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createBridge}=require('../clockodo/bridge.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});
 let bridge,launches=0;
 try{
  const page=await browser.newPage({viewport:{width:1300,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  // Replace only the OS handoff. The app generates the nonce and performs real HTTP pairing.
  await page.exposeFunction('testDirectHandoff',async token=>{
   launches++;assert.match(token,/^[a-f0-9]{64}$/);
   bridge=createBridge({email:'tester@example.com',key:'fake-only'},{sessionToken:token,fetcher:async()=>({ok:true,json:async()=>({data:[],paging:{current_page:1,count_pages:1,count_items:0}})})});
   await new Promise((resolve,reject)=>{bridge.server.once('error',reject);bridge.server.listen(18744,'127.0.0.1',resolve);});
  });
  await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);
  await page.locator('#welcomeForm [type=submit]').click();
  const initial=await page.evaluate(()=>localStorage.getItem('jsOfficeWeek_v1'));
  await page.evaluate(()=>{launchClockodoProtocol=token=>{window.testDirectHandoff(token);};});
  await page.locator('#menuButton').click();await page.locator('#menuClockodo').click();
  await page.locator('#clockodoConnectionStatus').filter({hasText:'Bereit'}).waitFor();
  await page.locator('#clockodoStart').click();
  await page.locator('#clockodoConnectionStatus').filter({hasText:'Verbunden'}).waitFor();
  assert.equal(launches,1);assert.ok(await page.locator('#clockodoStart').isDisabled());
  assert.equal(await page.locator('#clockodoPairCode').isVisible(),false);
  assert.equal(await page.evaluate(()=>localStorage.getItem('jsOfficeWeek_v1')),initial);
  await page.screenshot({path:path.join(__dirname,'artifacts/clockodo-direct-connected.png')});
  await page.reload();await page.locator('#menuButton').click();await page.locator('#menuClockodo').click();
  await page.locator('#clockodoConnectionStatus').filter({hasText:'Verbunden'}).waitFor();
  await page.locator('#clockodoDisconnect').click();
  await page.locator('#clockodoConnectionStatus').filter({hasText:'getrennt'}).waitFor();
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('dayrivo.clockodo.session')),null);
  assert.ok(await page.locator('#clockodoStart').isEnabled());
  assert.equal(bridge.server.listening,false);
  await page.keyboard.press('Escape');await page.locator('#languageButton').click();await page.locator('#languageMenu [data-language=en]').click();
  await page.locator('#menuButton').click();await page.locator('#menuClockodo').click();
  assert.equal(await page.locator('#clockodoStart').textContent(),'Start Clockodo');
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:path.join(__dirname,'artifacts/clockodo-direct-mobile.png')});
  assert.deepEqual(errors,[]);
  console.log('PASS: direct-start button, random pairing, real loopback on 18744, reload, disconnect, preserved planner, EN/mobile; OS handoff simulated.');
 }finally{await browser.close();if(bridge){bridge.stop();bridge.server.closeAllConnections();}}
})().catch(error=>{console.error(error);process.exitCode=1;});
