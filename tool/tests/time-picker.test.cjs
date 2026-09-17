const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const {pathToFileURL} = require('node:url');

(async () => {
  const browser = await chromium.launch({headless:true,channel:'msedge'});
  try {
    const page = await browser.newPage({viewport:{width:1366,height:768}}), errors = [];
    page.on('pageerror',e => errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);
    async function choose(id,time) {
      await page.locator('#'+id+'Button').click();
      await page.locator('#'+id+'List').getByRole('option',{name:time,exact:true}).click();
    }
    async function assertCentered(id) {
      const result = await page.locator('#'+id+'List').evaluate(list => {
        const bounds = list.getBoundingClientRect(), selected = list.querySelector('[aria-selected=true]').getBoundingClientRect();
        return {delta:selected.top + selected.height/2 - bounds.top - bounds.height/2,
          height:bounds.height,top:bounds.top,bottom:bounds.bottom,
          visible:[...list.children].filter(row => {
            const r = row.getBoundingClientRect(); return r.top >= bounds.top && r.bottom <= bounds.bottom;
          }).map(row => row.textContent)};
      });
      assert.ok(Math.abs(result.delta) < 2,JSON.stringify(result));
      assert.ok(result.height <= 376 && result.top >= 0 && result.bottom <= (await page.viewportSize()).height);
      return result.visible;
    }
    // Merely opening an existing exception must not change its times.
    await page.locator('.item-main').filter({hasText:'Kinder zur Schule'}).first().click();
    assert.equal(await page.locator('#itemEnd').inputValue(),'08:20');
    await page.locator('#itemEndButton').click();
    await assertCentered('itemEnd');
    await page.keyboard.press('Escape');
    assert.ok(await page.locator('#itemDialog').isVisible());
    assert.equal(await page.locator('#itemEnd').inputValue(),'08:20');
    await page.locator('#itemDialog [data-close]').first().click();
    await page.locator('#menuButton').click(); await page.locator('#menuAdd').click();
    await choose('itemStart','12:00');
    assert.equal(await page.locator('#itemEnd').inputValue(),'13:00');
    assert.equal(await page.locator('#itemDuration').textContent(),'1:00 h');
    await page.locator('#itemEndButton').click();
    const visible = await assertCentered('itemEnd');
    assert.equal(visible[0],'11:00'); assert.equal(visible.at(-1),'15:00'); assert.equal(visible.length,17);
    const out = path.resolve(__dirname,'artifacts'); fs.mkdirSync(out,{recursive:true});
    await page.screenshot({path:path.join(out,'time-picker-desktop.png')});
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
    assert.equal(await page.locator('#itemEnd').inputValue(),'13:15');
    // Same start selected again preserves the manually adjusted duration.
    await choose('itemStart','12:00');
    assert.equal(await page.locator('#itemEnd').inputValue(),'13:15');
    // Regression from the user's screenshot; the old end must be replaced.
    await choose('itemStart','22:15');
    assert.equal(await page.locator('#itemEnd').inputValue(),'23:15');
    await page.locator('#itemEndButton').click(); await assertCentered('itemEnd');
    await page.keyboard.press('ArrowUp'); await page.keyboard.press('Escape');
    assert.equal(await page.locator('#itemEnd').inputValue(),'23:15');
    await choose('itemStart','23:30');
    assert.equal(await page.locator('#itemEnd').inputValue(),'23:45');
    await choose('itemStart','00:00');
    assert.equal(await page.locator('#itemEnd').inputValue(),'01:00');
    await page.locator('#itemStartButton').click(); await assertCentered('itemStart');
    await page.keyboard.press('PageDown'); await page.keyboard.press('Enter');
    assert.equal(await page.locator('#itemStart').inputValue(),'02:00');
    await page.locator('#itemEndButton').click();
    await page.keyboard.press('Tab');
    assert.ok(await page.locator('#itemEndList').isHidden());
    assert.ok(await page.locator('#itemDescription').evaluate(el => el === document.activeElement));
    await page.setViewportSize({width:390,height:844});
    await choose('itemStart','12:00');
    await page.locator('#itemEndButton').click(); await assertCentered('itemEnd');
    await page.screenshot({path:path.join(out,'time-picker-mobile.png')});
    await page.locator('#itemTitle').click({position:{x:10,y:10}});
    assert.ok(await page.locator('#itemEndList').isHidden());
    await page.locator('#itemTitle').fill('Dropdown-Test');
    await page.locator('#itemForm button[type=submit]').click();
    await page.reload();
    const stored = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('jsOfficeWeek_v1')).weeks).flatMap(w => w.items).find(i => i.title === 'Dropdown-Test'));
    assert.equal(stored.start,'12:00'); assert.equal(stored.end,'13:00');
    assert.deepEqual(errors,[]);
    console.log('PASS: automatic end, centered ±2h window, full-day scrolling, keyboard, cancellation, existing exceptions, midnight/end-of-day, mobile, persistence.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
