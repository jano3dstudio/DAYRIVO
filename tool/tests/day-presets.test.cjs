const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const {pathToFileURL} = require('node:url');

(async () => {
  const browser = await chromium.launch({headless:true,channel:'msedge'});
  try {
    const page = await browser.newPage({viewport:{width:1560,height:1000}}), errors = [];
    page.on('pageerror',e => errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);
    const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('jsOfficeWeek_v1')));
    const openDay = day => page.getByRole('button',{name:day+': Farbe und Subline bearbeiten',exact:true}).click();
    const original = await stored(), weekId = original.selectedWeek;
    await openDay('Montag');
    assert.equal(await page.locator('#dayPresetSelect option').count(),6);
    await page.locator('#dayPresetManage summary').click();
    await page.locator('#dayPresetName').fill('Kundentag'); await page.locator('#saveDayPreset').click();
    const preset = (await stored()).dayPresets.find(p => p.name === 'Kundentag');
    assert.ok(preset); assert.equal(await page.locator('#dayPresetSelect').inputValue(),'');
    await page.locator('#dayDialog [data-close]').first().click();
    assert.deepEqual((await stored()).weeks,original.weeks);
    await openDay('Donnerstag'); await page.locator('#dayPresetSelect').selectOption(preset.id);
    assert.equal(await page.locator('#dayPresetPreview>div').count(),preset.items.length);
    const out = path.resolve(__dirname,'artifacts'); fs.mkdirSync(out,{recursive:true});
    await page.screenshot({path:path.join(out,'day-presets-desktop.png')});
    // Cancelling the dialog and declining replacement both preserve existing entries.
    await page.keyboard.press('Escape');
    assert.deepEqual((await stored()).weeks,original.weeks);
    await openDay('Donnerstag'); await page.locator('#dayPresetSelect').selectOption(preset.id);
    page.once('dialog',dialog => dialog.dismiss());
    await page.locator('#dayForm button[type=submit]').click();
    assert.deepEqual((await stored()).weeks,original.weeks);
    page.once('dialog',dialog => dialog.accept());
    await page.locator('#dayForm button[type=submit]').click();
    const changed = await stored(), thursday = changed.weeks[weekId].items.filter(item => item.day === 'Donnerstag');
    assert.equal(thursday.length,preset.items.length);
    assert.deepEqual(changed.weeks[weekId].items.filter(item => item.day !== 'Donnerstag'),original.weeks[weekId].items.filter(item => item.day !== 'Donnerstag'));
    assert.deepEqual(changed.presets,original.presets); assert.deepEqual(changed.settings,original.settings);
    assert.equal(await page.locator('[data-day="Donnerstag"]').evaluate(el => el.style.getPropertyValue('--day-color')),original.settings.days.Donnerstag.color);
    assert.ok(thursday.every(item => !item.done && !preset.items.some(saved => saved.id === item.id)));
    await page.reload(); assert.equal((await stored()).dayPresets.find(p => p.id === preset.id).name,'Kundentag');
    // Existing weekly templates can also be assembled from day presets, without changing live weeks.
    await page.locator('#presetsButton').click(); await page.locator('#editPreset').click();
    await openDay('Dienstag'); await page.locator('#dayPresetSelect').selectOption(preset.id);
    page.once('dialog',dialog => dialog.accept()); await page.locator('#dayForm button[type=submit]').click();
    assert.deepEqual((await stored()).weeks,changed.weeks);
    assert.equal((await stored()).presets[original.defaultPresetId].items.filter(item => item.day === 'Dienstag').length,preset.items.length);
    await page.locator('#finishPreset').click();
    await page.setViewportSize({width:390,height:844});
    await page.locator('#mobileTabs button').filter({hasText:'Do'}).click();
    await openDay('Donnerstag'); await page.locator('#dayPresetSelect').selectOption(preset.id);
    await page.screenshot({path:path.join(out,'day-presets-mobile.png')});
    await page.locator('#dayPresetManage summary').click();
    page.once('dialog',dialog => dialog.accept()); await page.locator('#deleteDayPreset').click();
    assert.ok(!(await stored()).dayPresets.some(p => p.id === preset.id));
    assert.deepEqual((await stored()).weeks,changed.weeks);
    const bounds = await page.locator('#dayDialog').boundingBox(); assert.ok(bounds.x >= 0 && bounds.x+bounds.width <= 390);
    assert.deepEqual(errors,[]);
    console.log('PASS: day preset creation, preview/cancel, confirmed single-day replacement, target colors, fresh IDs, persistence, weekly template mode, delete, mobile.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
