const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const {pathToFileURL} = require('node:url');
const P = require('../js/planner.js');

(async () => {
  const browser = await chromium.launch({headless:true,channel:'msedge'});
  try {
    const page = await browser.newPage({viewport:{width:1560,height:1000}}), errors = [];
    page.on('pageerror',e => errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);
    if(await page.locator('#welcomeDialog').evaluate(e=>e.open))await page.locator('#welcomeForm [type=submit]').click();
    const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('jsOfficeWeek_v1')));
    const css = name => page.evaluate(name => getComputedStyle(document.documentElement).getPropertyValue(name).trim(),name);
    const pickColor = async (selector,hex) => {await page.locator(selector).click();await page.locator('#colorHex').fill(hex);await page.locator('#colorApply').click();};
    const original = await stored();
    assert.equal(await css('--frame-style'),'dashed');
    await page.locator('#looksButton').click();
    await pickColor('#lookAccent','#fa88dd');
    await pickColor('#lookDay0','#99ccff');
    await page.locator('#lookFrame').selectOption('solid');
    assert.equal(await css('--accent'),'#fa88dd');
    assert.equal(await page.locator('[data-day="Montag"]').evaluate(el => el.style.getPropertyValue('--day-color')),'#99ccff');
    assert.deepEqual(await stored(),original);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() === '#3cff91');
    assert.equal(await css('--accent'),original.settings.appearance.accent);
    assert.equal(await css('--frame-style'),'dashed');
    await page.locator('#looksButton').click();
    await pickColor('#lookAccent','#fa88dd');
    await pickColor('#lookDay0','#99ccff');
    await page.locator('#lookFrame').selectOption('solid');
    await page.locator('.look-management summary').click();
    await page.locator('#lookName').fill('Neon Studio'); await page.locator('#lookCreate').click();
    const id = await page.locator('#lookSelect').inputValue();
    await page.locator('#looksForm button[type=submit]').click(); await page.reload();
    assert.equal(await css('--accent'),'#fa88dd');
    assert.equal(await css('--frame-style'),'solid');
    const saved = await stored();
    assert.deepEqual(saved.weeks,original.weeks); assert.deepEqual(saved.presets,original.presets);
    assert.equal(saved.settings.days.Montag.subtitle,original.settings.days.Montag.subtitle);
    assert.equal(saved.looks.find(p => p.id === id).name,'Neon Studio');
    assert.deepEqual(P.parseBackup({app:'JS OFFICE WEEK',data:saved}),saved);
    await page.locator('#looksButton').click();
    await page.locator('.look-management summary').click();
    await page.locator('#lookName').fill('Neon Pink'); await page.locator('#lookUpdate').click();
    await page.locator('#lookSelect').selectOption('jano');
    assert.equal(await css('--accent'),'#3cff91');
    await page.locator('#lookSelect').selectOption(id);
    assert.equal(await css('--accent'),'#fa88dd');
    // Export through the same directory API as backups: no download, only palette data.
    let exported, filename, folder, downloads = 0;
    page.on('download',() => downloads++);
    await page.exposeFunction('captureLook',value => { exported = value.text; filename = value.name; folder = value.folder; });
    await page.evaluate(() => {
      window.showDirectoryPicker = async () => ({name:'JS_Office_Week',queryPermission:async () => 'granted',
        getFileHandle:async () => ({getFile:async () => ({text:async () => 'JS OFFICE WEEK'})}),
        getDirectoryHandle:async folder => ({getFileHandle:async name => ({createWritable:async () => ({
          write:async text => window.captureLook({folder,name,text}),close:async () => {}
        })})})});
    });
    await page.locator('#lookExport').click();
    await page.waitForFunction(() => document.querySelector('#lookMessage').textContent.startsWith('Export gespeichert:'));
    assert.equal(downloads,0); assert.equal(folder,'looks'); assert.match(filename,/Neon-Pink-.*\.json$/);
    const payload = JSON.parse(exported);
    assert.equal(payload.presets.length,1); assert.equal(payload.presets[0].accent,'#fa88dd');
    assert.equal(payload.presets[0].name,'Neon Pink'); assert.equal(exported.includes('weekStart'),false);
    await page.locator('#looksExport').click();
    await page.waitForFunction(() => document.querySelector('#lookMessage').textContent.includes('looks/Alle-Looks-'));
    assert.equal(JSON.parse(exported).presets.length,original.looks.length+1);
    const out = path.resolve(__dirname,'artifacts'); fs.mkdirSync(out,{recursive:true});
    await page.screenshot({path:path.join(out,'looks-desktop.png')});
    await page.locator('#lookFile').setInputFiles({name:'look.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(payload))});
    await page.waitForFunction(() => document.querySelector('#lookMessage').textContent.includes('1 Looks importiert'));
    assert.equal(await page.locator('#lookName').inputValue(),'Neon Pink (2)');
    const count = await page.locator('#lookSelect option').count();
    payload.presets[0].days.Montag = 'url(evil)';
    await page.locator('#lookFile').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(payload))});
    await page.waitForFunction(() => document.querySelector('#lookMessage').textContent.startsWith('Import fehlgeschlagen:'));
    assert.equal(await page.locator('#lookSelect option').count(),count);
    await page.locator('#lookDelete').click();
    assert.equal(await page.locator('#lookSelect option').count(),count-1);
    await page.locator('#lookFrame').selectOption('none');
    await pickColor('#lookAccent','#080808');
    assert.equal(await css('--accent-ink'),'#ffffff');
    await page.locator('#lookSelect').selectOption(id);
    await page.locator('#looksForm button[type=submit]').click();
    await page.screenshot({path:path.join(out,'looks-workspace.png')});
    await page.setViewportSize({width:390,height:844});
    assert.ok(await page.locator('#looksButton').isVisible());
    assert.ok(await page.evaluate(() => document.body.scrollWidth <= innerWidth));
    await page.locator('#looksButton').click();
    await page.screenshot({path:path.join(out,'looks-mobile.png')});
    const bounds = await page.locator('#looksDialog').boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390);
    await page.locator('#lookSelect').selectOption('jano');
    await page.locator('#looksForm button[type=submit]').click();
    assert.equal(await css('--accent'),'#3cff91');
    await page.setViewportSize({width:1560,height:1000});
    await page.screenshot({path:path.join(out,'looks-default-frame.png')});
    assert.deepEqual((await stored()).weeks,original.weeks);
    assert.deepEqual(errors,[]);
    console.log('PASS: live/cancel, accent and day colors, frame, create/rename/update/delete, persistence, safe import, collision handling, JSON export (directory API simulated), backup roundtrip, mobile, existing plans unchanged.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
