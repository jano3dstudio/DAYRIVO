const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const browser = await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL || 'msedge'});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => {
      // Switching responsive image sources can cancel a now-unneeded download.
      if (request.resourceType()==='image' && request.failure().errorText==='net::ERR_ABORTED') return;
      errors.push(request.url()+': '+request.failure().errorText);
    });
    await page.goto(process.env.LANDING_URL || pathToFileURL(path.resolve(__dirname,'../landing/index.html')).href);
    await page.evaluate(() => Promise.all([...document.images].map(img => img.decode())));
    assert.equal(await page.title(), 'DAYRIVO — Your day. Your rhythm.');
    await page.locator('[data-look=arcade]').click();
    await page.locator('#weekPreview').evaluate(img => img.decode());
    assert.match(await page.locator('#weekPreview').getAttribute('src'), /arcade/);
    assert.equal(await page.locator('[data-look=arcade]').getAttribute('aria-pressed'),'true');
    await page.locator('#winButton').click();
    assert.equal(await page.locator('#winButton').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('.confetti-piece').count(),24);
    await page.locator('#winButton').click();
    assert.equal(await page.locator('#winButton').getAttribute('aria-pressed'),'false');
    await page.locator('[data-film]').first().click();
    await page.waitForFunction(() => document.getElementById('filmVideo').readyState >= 2);
    assert.equal(await page.locator('#filmDialog').evaluate(d => d.open),true);
    assert.ok(Math.abs(await page.locator('#filmVideo').evaluate(v => v.duration)-22)<.1);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.getElementById('filmDialog').open && document.getElementById('filmVideo').paused);
    assert.equal(await page.locator('#filmVideo').evaluate(v => v.paused),true);
    assert.equal(await page.locator('#filmDialog').evaluate(d => d.open),false);
    await page.locator('summary').first().click();
    assert.equal(await page.locator('details').first().getAttribute('open'),'');
    await page.locator('summary').first().click();
    const output = path.join(__dirname,'artifacts');
    fs.mkdirSync(output,{recursive:true});
    await page.locator('[data-look=rainbow]').click();
    for (const language of ['en','de']) {
      if (language === 'de') await page.locator('#language').click();
      for (const width of [1440,768,390,360]) {
        await page.setViewportSize({width,height:1000});
        await page.locator('#weekPreview').evaluate(img => img.decode());
        await page.evaluate(() => scrollTo(0,0));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false, language+' overflow at '+width);
        await page.screenshot({path:path.join(output,'landing-'+language+'-'+width+'.png'),fullPage:true});
        if (width===390 || width===1440) await page.screenshot({path:path.join(output,'landing-'+language+'-'+width+'-hero.png')});
      }
    }
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('lang'),'de');
    assert.match(await page.locator('h1').textContent(),/Leben zuerst/);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.locator('#winButton').click();
    assert.equal(await page.locator('.confetti-piece').count(),0);
    assert.equal(await page.evaluate(() => localStorage.getItem('jsOfficeWeek_v1')),null,'landing must not create or alter planner data');
    const badLinks = await page.locator('a[href]').evaluateAll(links => links.map(a => a.getAttribute('href')).filter(h => !h || h==='#'));
    assert.deepEqual(badLinks,[]);
    assert.deepEqual(errors,[]);
    console.log('PASS: landing images, looks, completion/reduced motion, video/Escape, FAQ, persisted DE/EN, desktop/tablet/mobile overflow, isolated storage.');
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode=1;});
