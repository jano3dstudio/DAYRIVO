// Run with PLAYWRIGHT_MODULE pointing to an installed Playwright package if not on NODE_PATH.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const {pathToFileURL} = require('node:url');
const P = require('../js/planner.js');
(async () => {
  const browser = await chromium.launch({headless:true,channel:'msedge'});
  const context = await browser.newContext({viewport:{width:1560,height:1080}});
  const page = await context.newPage(), errors = [];
  async function chooseTime(id,time) {
    await page.locator('#'+id+'Button').click();
    await page.locator('#'+id+'List').getByRole('option',{name:time,exact:true}).click();
  }
  page.on('pageerror',e=>errors.push(e.message));
  const url = pathToFileURL(path.resolve(__dirname,'../../index.html')).href;
  await page.goto(url);
  const legacy = {weekStart:'2026-09-14',items:P.defaultItems()};
  legacy.items[0].actual = 'Bestehende Kundennotiz';
  await page.evaluate(value => { localStorage.removeItem('jsOfficeWeek_v1'); localStorage.setItem('jonaWeek_v3',JSON.stringify(value)); },legacy);
  await page.reload();
  assert.equal(await page.locator('.day-head').count(),5);
  assert.equal(await page.locator('.item').count(),33);
  assert.equal(await page.locator('#weekNumber').textContent(),'/ KW 38');
  const noonTops = await page.locator('.item').evaluateAll(cards => cards.filter(c=>c.querySelector('.item-time').textContent.startsWith('12:00')).map(c=>c.getBoundingClientRect().top));
  assert.equal(noonTops.length,5); assert.ok(noonTops.every(top=>top===noonTops[0]));
  const align = await page.evaluate(()=>({header:document.querySelector('.header-inner').getBoundingClientRect().toJSON(),main:document.querySelector('main').getBoundingClientRect().toJSON()}));
  assert.equal(align.header.left,align.main.left); assert.equal(align.header.right,align.main.right);
  await page.getByRole('button',{name:'Dienstag: Farbe und Subline bearbeiten',exact:true}).click();
  await page.locator('#daySubtitle').fill('AI / Studio'); await page.locator('#dayColor').fill('#55bba0');
  await page.locator('#dayForm button[type=submit]').click();
  assert.match(await page.locator('.day-head').nth(1).textContent(),/AI \/ Studio/);
  await page.locator('[data-day="Dienstag"] .day-add').click();
  assert.equal(await page.locator('#itemStart').inputValue(),'15:00');
  await page.locator('#itemTitle').fill('Review <test>'); await page.locator('#itemDescription').fill('Details & nächste Schritte');
  await chooseTime('itemStart','15:00'); await chooseTime('itemEnd','14:00'); await page.locator('#itemForm button[type=submit]').click();
  assert.ok(await page.locator('#itemError').isVisible());
  await chooseTime('itemEnd','16:00'); await page.locator('#itemForm button[type=submit]').click();
  const card = page.locator('.item').filter({has:page.locator('.item-title',{hasText:'Review <test>'})});
  assert.equal(await card.count(),1);
  await card.locator('.item-main').click();
  assert.equal(await page.locator('#itemDescription').inputValue(),'Details & nächste Schritte');
  await page.locator('#itemCategory').selectOption('Kunde');
  await page.locator('#customerDetails summary').click(); await page.locator('#itemCustomer').fill('Testkunde');
  await page.locator('#itemProject').fill('Testprojekt'); await page.locator('#itemService').fill('Visualisierung');
  await page.locator('#itemForm button[type=submit]').click();
  await card.locator('.item-check').check();
  await page.locator('#followingWeek').click();
  assert.equal(await card.count(),0);
  await page.locator('#previousWeek').click(); await page.reload();
  assert.equal(await card.count(),1); assert.ok(await card.locator('.item-check').isChecked());
  assert.match(await page.locator('.day-head').nth(1).textContent(),/AI \/ Studio/);
  await card.locator('.resize-handle').scrollIntoViewIfNeeded();
  let bounds = await card.locator('.resize-handle').boundingBox();
  const scale = await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hour'))/60);
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+3); await page.mouse.down(); await page.mouse.move(bounds.x+bounds.width/2,bounds.y+3+30*scale,{steps:5}); await page.mouse.up();
  assert.match(await card.locator('.item-time').textContent(),/16:30/);
  // Move horizontally across two days, then vertically on the quarter-hour grid.
  await page.getByRole('button',{name:'Donnerstag: Farbe und Subline bearbeiten',exact:true}).click();
  await page.locator('#dayColor').fill('#bb66aa'); await page.locator('#dayForm button[type=submit]').click();
  async function dragCard(targetDay, deltaMinutes, cancel = false) {
    const deltaY = deltaMinutes * await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hour'))/60);
    await card.evaluate(el => { const scroller = document.querySelector('.calendar'); scroller.scrollTop = parseFloat(el.style.top) - 220; });
    const from = await card.locator('.item-main').boundingBox();
    const to = await page.locator(`[data-day="${targetDay}"]`).boundingBox();
    await page.mouse.move(from.x+from.width/2,from.y+20); await page.mouse.down();
    await page.mouse.move(to.x+to.width/2,from.y+20+deltaY,{steps:5});
    const color = await page.locator('.drag-preview').evaluate(el=>getComputedStyle(el).getPropertyValue('--day-color').trim());
    if (cancel) await page.keyboard.press('Escape');
    await page.mouse.up();
    assert.ok(await page.locator('#itemDialog').isHidden());
    return color;
  }
  const idBefore = await card.getAttribute('data-id');
  assert.equal(await dragCard('Donnerstag',0),'#bb66aa');
  assert.equal(await card.evaluate(el=>el.parentElement.dataset.day),'Donnerstag');
  assert.equal(await card.evaluate(el=>getComputedStyle(el).getPropertyValue('--day-color').trim()),'#bb66aa');
  assert.match(await card.locator('.item-time').textContent(),/15:00 – 16:30/);
  await dragCard('Donnerstag',19);
  assert.match(await card.locator('.item-time').textContent(),/15:15 – 16:45/);
  await dragCard('Montag',0,true);
  assert.equal(await card.evaluate(el=>el.parentElement.dataset.day),'Donnerstag');
  // Releasing outside the calendar leaves the entry untouched.
  const outsideStart = await card.locator('.item-main').boundingBox();
  await page.mouse.move(outsideStart.x+40,outsideStart.y+20); await page.mouse.down();
  await page.mouse.move(5,outsideStart.y+20,{steps:4}); await page.mouse.up();
  assert.ok(await page.locator('#itemDialog').isHidden());
  assert.equal(await card.evaluate(el=>el.parentElement.dataset.day),'Donnerstag');
  assert.equal(await card.getAttribute('data-id'),idBefore);
  await page.reload();
  assert.equal(await card.evaluate(el=>el.parentElement.dataset.day),'Donnerstag');
  assert.match(await card.locator('.item-time').textContent(),/15:15 – 16:45/);
  assert.ok(await card.locator('.item-check').isChecked());
  await card.locator('.item-main').click();
  assert.equal(await page.locator('#itemDescription').inputValue(),'Details & nächste Schritte');
  assert.equal(await page.locator('#itemCustomer').inputValue(),'Testkunde');
  assert.equal(await page.locator('#itemStart option').count(),95);
  assert.equal(await page.locator('#itemStart option[value="15:22"]').count(),0);
  assert.equal(await page.locator('#itemStart').inputValue(),'15:15');
  await page.locator('#itemForm button[type=submit]').click();
  // Escape cancels a resize without touching the persisted end time.
  await card.locator('.resize-handle').scrollIntoViewIfNeeded();
  bounds = await card.locator('.resize-handle').boundingBox();
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+4); await page.mouse.down(); await page.mouse.move(bounds.x+bounds.width/2,bounds.y+34); await page.keyboard.press('Escape'); await page.mouse.up();
  assert.match(await card.locator('.item-time').textContent(),/16:45/);
  await page.locator('#menuButton').click(); assert.ok(await page.locator('#menu').isVisible());
  await page.keyboard.press('Escape'); assert.ok(await page.locator('#menu').isHidden());
  // Directory API boundary is simulated; writes go to a test artifact, never user data.
  let backupText, backupName, downloads = 0;
  page.on('download',()=>downloads++);
  await page.exposeFunction('captureBackup',({text,name})=>{backupText=text;backupName=name;});
  await page.evaluate(()=>{
    window.showDirectoryPicker = async()=>({name:'JS_Office_Week',queryPermission:async()=> 'granted',
      getFileHandle:async()=>({getFile:async()=>({text:async()=>'<title>JS OFFICE WEEK 1.0</title>'})}),
      getDirectoryHandle:async(name)=>{if(name!=='backup')throw Error('Wrong directory');return {getFileHandle:async(fileName)=>({createWritable:async()=>({write:async(text)=>window.captureBackup({text,name:fileName}),close:async()=>{},abort:async()=>{}})})};}
    });
  });
  await page.locator('#backupButton').click();
  await page.waitForFunction(()=>document.querySelector('#toast').textContent.startsWith('Backup gespeichert:'));
  assert.equal(downloads,0); assert.match(backupName,/^js-office-week-.*\.json$/); P.parseBackup(JSON.parse(backupText));
  await card.locator('.item-main').click(); await page.locator('#deleteItem').click(); assert.equal(await card.count(),0);
  await page.locator('#restoreFile').setInputFiles({name:'test-backup.json',mimeType:'application/json',buffer:Buffer.from(backupText)});
  await page.locator('#restoreForm button[type=submit]').click(); assert.equal(await card.count(),1);
  await page.reload(); assert.equal(await card.count(),1);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('jonaWeek_v3')).items[0].actual),'Bestehende Kundennotiz');
  // Branding uses the original asset and stays centered independently of side controls.
  assert.equal(await page.locator('.studio-logo').evaluate(img=>img.complete && img.naturalWidth===284),true);
  assert.equal(await page.locator('html').evaluate(el=>getComputedStyle(el).getPropertyValue('--accent').trim()),'#3cff91');
  const logoBox = await page.locator('.studio-logo').boundingBox();
  assert.ok(Math.abs(logoBox.x+logoBox.width/2-780)<1);
  // Presets have their own editing surface; editing and defaults cannot alter existing weeks.
  const liveBefore = await page.evaluate(()=>JSON.parse(localStorage.getItem('jsOfficeWeek_v1')).weeks);
  await page.locator('#presetsButton').click();
  await page.locator('#presetName').fill('Urlaub');
  await page.locator('#createPresetForm button[type=submit]').click();
  assert.ok(await page.locator('#presetBanner').isVisible());
  assert.equal(await page.locator('#weekLabel').textContent(),'Urlaub');
  assert.equal(await page.locator('.item').count(),0);
  await page.locator('[data-day="Donnerstag"] .day-add').click();
  await page.locator('#itemTitle').fill('Urlaubstag');
  await page.locator('#itemCategory').selectOption('Familie');
  await chooseTime('itemStart','09:00'); await chooseTime('itemEnd','17:00');
  await page.locator('#itemForm button[type=submit]').click();
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('jsOfficeWeek_v1')).weeks),liveBefore);
  await page.locator('#finishPreset').click();
  assert.equal(await card.count(),1);
  await page.locator('#presetsButton').click();
  const vacationId = await page.locator('#presetSelect option').filter({hasText:'Urlaub'}).getAttribute('value');
  await page.locator('#presetSelect').selectOption(vacationId); await page.locator('#presetDefault').check();
  await page.locator('#presetsDialog [data-close]').click();
  await page.locator('#followingWeek').click();
  assert.equal(await page.locator('.item').count(),33); // Already existed before changing the default.
  await page.locator('#followingWeek').click();
  assert.equal(await page.locator('.item').count(),1);
  assert.equal(await page.locator('.item-title').textContent(),'Urlaubstag');
  await page.locator('#previousWeek').click(); await page.locator('#previousWeek').click();
  await page.reload(); await page.locator('#presetsButton').click();
  assert.equal(await page.locator('#presetSelect').inputValue(),vacationId);
  page.once('dialog',dialog=>dialog.dismiss()); await page.locator('#applyPreset').click();
  assert.equal(await card.count(),1);
  page.once('dialog',dialog=>dialog.accept()); await page.locator('#applyPreset').click();
  assert.equal(await page.locator('.item').count(),1);
  await page.locator('.item-main').click(); await page.locator('#itemTitle').fill('Nur diese Woche'); await page.locator('#itemForm button[type=submit]').click();
  await page.locator('#presetsButton').click(); await page.locator('#editPreset').click();
  assert.equal(await page.locator('.item-title').textContent(),'Urlaubstag');
  await page.locator('#finishPreset').click();
  assert.equal(errors.length,0,errors.join('\n'));
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Di',exact:true}).click();
  assert.equal(await page.locator('.day-track:visible').count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth),true);
  const mobileLogo = await page.locator('.studio-logo').boundingBox();
  assert.ok(Math.abs(mobileLogo.x+mobileLogo.width/2-195)<1);
  // Clean baseline screenshots for visual inspection.
  const clean = await browser.newContext({viewport:{width:1560,height:1080}});
  const preview = await clean.newPage(); await preview.goto(url);
  const out = path.resolve(__dirname,'artifacts'); fs.mkdirSync(out,{recursive:true});
  await preview.screenshot({path:path.join(out,'desktop.png'),fullPage:true});
  await preview.locator('.item-main').filter({hasText:'Kundenprojekte'}).first().click();
  await preview.screenshot({path:path.join(out,'editor.png'),fullPage:true});
  await preview.locator('#itemDialog [data-close]').first().click();
  await preview.locator('#presetsButton').click();
  await preview.screenshot({path:path.join(out,'presets.png'),fullPage:true});
  await preview.locator('#presetsDialog [data-close]').click();
  assert.equal(await preview.locator('.view-controls').count(),0);
  for (const [width,height] of [[1920,1080],[1366,768],[2560,1440],[390,844]]) {
    await preview.setViewportSize({width,height});
    await preview.waitForTimeout(150);
    const metrics = await preview.evaluate(()=>{
      const cal = document.querySelector('.calendar'), shell = document.querySelector('main').getBoundingClientRect();
      return {overflow:cal.scrollHeight-cal.clientHeight,pageOverflow:document.documentElement.scrollWidth-innerWidth,width:shell.width,bottom:cal.getBoundingClientRect().bottom};
    });
    assert.equal(metrics.pageOverflow,0);
    assert.ok(metrics.width >= width - 33);
    assert.ok(metrics.bottom <= height);
    if (width >= 1920) assert.ok(metrics.overflow <= 2,JSON.stringify(metrics));
    else assert.ok(metrics.overflow < 200,JSON.stringify(metrics));
    await preview.screenshot({path:path.join(out,`responsive-${width}.png`),fullPage:true});
  }
  await browser.close(); console.log('PASS: migration, alignment, day settings, CRUD, validation, independent weeks, reload, drag across days/within day, target color, quarter-hour snapping, drag Escape/outside cancellation, resize/cancel, menu, backup/restore (directory API simulated), mobile, no browser errors.');
})().catch(error=>{console.error(error);process.exit(1);});
