const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url'),P=require('../js/planner.js');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try {
  const page=await browser.newPage({viewport:{width:1560,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const data=P.createData();P.ensureWeek(data,'2026-09-14');
  const preset=P.createPreset(data,'Urlaub',[{id:'holiday',title:'Sport im Urlaub',cat:'Sport',day:'Montag',start:'09:00',end:'10:00',done:true}]);
  data.masterData.categories.push({id:'consulting',name:'Beratung',group:'work',active:true});
  const mixed=P.createPreset(data,'Leben und Arbeit',[
    {id:'family',title:'Schulweg',cat:'Schule',day:'Montag',start:'08:00',end:'08:45',done:false},
    {id:'sport',title:'Laufen',cat:'Sport',day:'Montag',start:'09:00',end:'09:30',done:true},
    {id:'work',title:'Beratung',cat:'consulting',day:'Montag',start:'12:00',end:'13:30',done:false}
  ]);
  await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);
  await page.evaluate(data=>localStorage.setItem('jsOfficeWeek_v1',JSON.stringify(data)),data);await page.reload();
  const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('jsOfficeWeek_v1')));
  const before=await saved();await page.locator('#nextWeekButton').click();
  assert.ok(await page.locator('#nextWeekPreset').isVisible());assert.deepEqual(await saved(),before);
  const out=path.join(__dirname,'artifacts');fs.mkdirSync(out,{recursive:true});
  assert.deepEqual(await page.locator('#nextWeekBreakdown h3').allTextContents(),['Leben','Arbeit']);
  await page.screenshot({path:path.join(out,'next-week-life-work.png')});
  await page.locator('#nextWeekPreset').selectOption(mixed.id);
  assert.equal(await page.locator('[data-time-area=life] strong').textContent(),'1:15 h');
  assert.equal(await page.locator('[data-time-area=work] strong').textContent(),'1:30 h');
  assert.deepEqual(await page.locator('[data-time-area=life] dt').allTextContents(),['Schule','Sport']);
  assert.equal(await page.locator('[data-time-area=work] dt').textContent(),'Beratung');
  assert.deepEqual(await saved(),before);
  await page.locator('#nextWeekPreset').selectOption(preset.id);
  assert.equal(await page.locator('[data-time-area=life] strong').textContent(),'1:00 h');
  assert.equal(await page.locator('[data-time-area=work] strong').textContent(),'0:00 h');
  await page.screenshot({path:path.join(out,'next-week-preset.png')});
  await page.locator('#nextWeekForm [data-close]').first().click();assert.deepEqual(await saved(),before);
  await page.locator('#nextWeekButton').click();await page.locator('#nextWeekPreset').selectOption(preset.id);await page.locator('#nextWeekForm [type=submit]').click();
  const created=await saved(),week=created.weeks['2026-09-21'];
  assert.equal(created.selectedWeek,'2026-09-21');assert.equal(week.sourcePreset.id,preset.id);assert.equal(week.items.length,1);
  assert.equal(week.items[0].done,false);assert.notEqual(week.items[0].id,preset.items[0].id);assert.equal(created.defaultPresetId,before.defaultPresetId);
  assert.deepEqual(created.weeks['2026-09-14'],before.weeks['2026-09-14']);
  await page.locator('.item-check').check();await page.locator('#capturePlanButton').click();await page.locator('#captureForm [type=submit]').click();
  const existing=(await saved()).weeks['2026-09-21'];
  await page.locator('#previousWeek').click();await page.locator('#nextWeekButton').click();
  assert.equal(await page.locator('#nextWeekPreset').inputValue(),'__keep__');await page.locator('#nextWeekForm [type=submit]').click();assert.deepEqual((await saved()).weeks['2026-09-21'],existing);
  await page.locator('#previousWeek').click();await page.locator('#nextWeekButton').click();await page.locator('#nextWeekPreset').selectOption(preset.id);
  page.once('dialog',dialog=>dialog.dismiss());await page.locator('#nextWeekForm [type=submit]').click();assert.deepEqual((await saved()).weeks['2026-09-21'],existing);
  assert.equal((await saved()).selectedWeek,'2026-09-14');
  page.once('dialog',dialog=>dialog.accept());await page.locator('#nextWeekForm [type=submit]').click();assert.equal((await saved()).weeks['2026-09-21'].planSnapshot,undefined);
  await page.locator('[data-section=insights]').click();assert.match(await page.locator('#insightsPanel [data-finance=done]').textContent(),/^0,00/);
  assert.equal(await page.locator('.completed-cards article').count(),0);assert.equal(await page.locator('.plan-comparison').getAttribute('open'),null);
  await page.setViewportSize({width:390,height:844});await page.locator('#languageButton').click();await page.getByRole('menuitemradio',{name:'English',exact:true}).click();
  await page.locator('#menuButton').click();await page.locator('#menuNextWeek').click();
  assert.ok(await page.locator('#nextWeekPreset').isVisible());assert.match(await page.locator('#nextWeekTitle').textContent(),/Next week/);
  assert.deepEqual(await page.locator('#nextWeekBreakdown h3').allTextContents(),['Life','Work']);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:path.join(out,'next-week-mobile.png')});
  await page.keyboard.press('Escape');assert.equal((await saved()).selectedWeek,'2026-09-21');
  assert.deepEqual(errors,[]);console.log('PASS: selection before writes, cancel, preset copy/fresh IDs/default preservation, existing-week keep and replacement confirmation, empty completed-only insights, mobile and EN.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
