const {chromium}=require('playwright'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {buildPublic}=require('../scripts/build-public.cjs');
(async()=>{
 const html=fs.readFileSync(buildPublic()),server=http.createServer((req,res)=>{if(req.url!=='/'&&req.url!=='/index.html'){res.writeHead(404);return res.end();}res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1450,height:950}}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.locator('#welcomeForm [type=submit]').click();
  assert.ok(await page.locator('.item-main').count()>0);
  await page.locator('.item-main').first().click();
  await page.locator('#itemTitle').fill('Public preview test');await page.locator('#itemForm [type=submit]').click();
  await page.reload();assert.ok((await page.locator('.item-main').allTextContents()).some(t=>t.includes('Public preview test')));
  await page.locator('#menuButton').click();await page.locator('#menuClockodo').click();
  assert.match(await page.locator('#clockodoConnectionDialog').textContent(),/Desktop-Version/);
  assert.equal(await page.locator('#clockodoStart').count(),0);await page.keyboard.press('Escape');
  await page.locator('#languageButton').click();await page.locator('#languageMenu [data-language=en]').click();
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  fs.mkdirSync(path.join(__dirname,'artifacts'),{recursive:true});await page.screenshot({path:path.join(__dirname,'artifacts/public-mobile.png')});
  assert.deepEqual(errors,[]);assert.ok(requests.every(url=>url===`http://127.0.0.1:${server.address().port}/`));
  console.log('PASS: self-contained HTTP web edition, onboarding, editing, persistence, clear Clockodo boundary, EN/mobile, no external assets.');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
