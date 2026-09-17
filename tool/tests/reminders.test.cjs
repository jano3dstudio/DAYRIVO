const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url'),P=require('../js/planner.js');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const data=P.createData();P.ensureWeek(data,'2026-09-14');
  await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);
  await page.evaluate(data=>localStorage.setItem('jsOfficeWeek_v1',JSON.stringify(data)),data);await page.reload();
  const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('jsOfficeWeek_v1')));
  const before=await saved();const head=()=>page.locator('.day-head[data-reminder-day="Dienstag"]');
  await head().locator('.reminder-add').click();assert.ok(await page.locator('#dayDialog').isHidden());
  for(const text of ['Angebot verschicken','Mara zurückrufen','Belege hochladen']){await page.locator('#reminderText').fill(text);await page.locator('#reminderSave').click();}
  assert.equal(await page.locator('.reminder-row').count(),3);
  assert.deepEqual((await saved()).weeks['2026-09-14'].items,before.weeks['2026-09-14'].items);
  await page.locator('.reminder-text').first().click();await page.locator('#reminderText').fill('Angebot IFM verschicken');await page.locator('#reminderSave').click();
  await page.locator('.reminder-row input').first().check();
  assert.equal((await saved()).weeks['2026-09-14'].reminders.filter(r=>r.done).length,1);
  const out=path.join(__dirname,'artifacts');fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'reminders-dialog.png')});
  await page.locator('#reminderDialog [data-close]').click();
  assert.equal(await head().locator('.mini-reminder').count(),2);assert.equal(await head().locator('.reminder-count').textContent(),'2');
  await head().locator('.mini-reminder input').first().check();assert.equal(await head().locator('.reminder-count').textContent(),'1');
  await page.reload();assert.equal(await head().locator('.reminder-count').textContent(),'1');
  await page.screenshot({path:path.join(out,'reminders-desktop.png')});
  await page.setViewportSize({width:3440,height:1440});await page.screenshot({path:path.join(out,'reminders-wide.png')});
  await page.setViewportSize({width:1366,height:768});
  assert.ok(await head().locator('.reminder-preview').isHidden());assert.ok(await head().locator('.reminder-count').isVisible());
  await page.screenshot({path:path.join(out,'reminders-laptop.png')});
  await head().locator('.day-meta').click();assert.ok(await page.locator('#dayDialog').isVisible());await page.locator('#dayDialog [data-close]').first().click();
  await page.locator('#followingWeek').click();assert.equal((await saved()).weeks['2026-09-21'].reminders,undefined);await page.locator('#previousWeek').click();
  await page.setViewportSize({width:390,height:844});await page.locator('#mobileTabs button').nth(1).click();
  assert.equal(await page.locator('.day-head:visible').count(),1);assert.ok(await head().locator('.reminder-add').isVisible());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:path.join(out,'reminders-mobile.png')});
  await page.locator('#languageButton').click();await page.getByRole('menuitemradio',{name:'English',exact:true}).click();await head().locator('.reminder-count').click();
  assert.equal(await page.locator('#reminderTitle').textContent(),'Quick to-dos');assert.match(await page.locator('#reminderList').textContent(),/Angebot IFM verschicken/);
  await page.locator('.reminder-delete').first().click();assert.equal((await saved()).weeks['2026-09-14'].reminders.length,2);
  await page.locator('#reminderText').fill('<img src=x onerror=alert(1)>');await page.locator('#reminderSave').click();assert.equal(await page.locator('#reminderList img').count(),0);
  const snapshot=await saved();await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error('quota');};});
  await page.locator('#reminderText').fill('Nicht speichern');await page.locator('#reminderSave').click();
  assert.match(await page.locator('#reminderError').textContent(),/Saving failed/);assert.deepEqual(await saved(),snapshot);
  assert.deepEqual(errors,[]);console.log('PASS: reminder CRUD, header checks, 2-row preview, independent weeks, unchanged timed entries, reload, mobile/laptop/wide, EN, escaping and failed-save rollback.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
