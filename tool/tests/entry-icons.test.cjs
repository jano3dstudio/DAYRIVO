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
  const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('jsOfficeWeek_v1')));
  const verifyAlignment=async()=>{
    const rows=await page.locator('.day-track:visible .item').evaluateAll(cards=>cards.map(card=>{
      const r=el=>{const b=el.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom};};
      const time=card.querySelector('.item-time'),title=card.querySelector('.item-title');
      return {card:r(card),icon:r(card.querySelector('.item-icon')),check:r(card.querySelector('.item-check')),time:r(time),title:r(title),after:getComputedStyle(time,':after').content,wrap:getComputedStyle(time).whiteSpace};
    }));
    assert.ok(rows.length);
    for(const row of rows){
      assert.equal(row.icon.width,32);assert.equal(row.icon.height,32);
      assert.equal(row.check.width,32);assert.equal(row.check.height,32);
      assert.ok(Math.abs(row.card.bottom-row.check.bottom-4)<2,'completion at lower edge');
      for(const part of ['time','title']){
        assert.ok(Math.abs((row[part].x-row.card.x)-(rows[0][part].x-rows[0].card.x))<.1,part+' horizontal alignment');
        assert.ok(Math.abs((row[part].y-row.card.y)-(rows[0][part].y-rows[0].card.y))<.1,part+' vertical alignment');
      }
      assert.ok(row.title.y>=row.time.bottom,'time above title');
      assert.ok(row.title.bottom<=row.card.bottom,'both rows fit');
      assert.ok(row.icon.bottom<=row.card.bottom,'large icon fits');
      assert.equal(row.wrap,'nowrap');assert.equal(row.after,'none');
    }
  };
  await verifyAlignment();
  const first=data.weeks[data.selectedWeek].items[0],card=page.locator('[data-id="'+first.id+'"]');
  const icon=card.locator('.item-icon'),check=card.locator('.item-check');
  const ib=await icon.boundingBox(),cb=await check.boundingBox();assert.ok(cb.x>ib.x+ib.width);
  const original=await stored();
  assert.ok(await icon.locator('svg').count());
  await icon.click();assert.equal(await page.locator('#entryIconPicker').getAttribute('open'),'');
  const out=path.join(__dirname,'artifacts');fs.mkdirSync(out,{recursive:true});
  await page.screenshot({path:path.join(out,'entry-icon-picker.png')});
  await page.locator('[data-icon=heart]').click();assert.equal(await page.locator('#entryIconPicker').getAttribute('open'),null);
  await page.locator('#itemDialog [data-close]').first().click();assert.deepEqual(await stored(),original);
  await icon.click();await page.locator('[data-icon=bike]').click();await page.locator('#itemForm [type=submit]').click();
  assert.equal((await stored()).weeks[data.selectedWeek].items[0].icon,'bike');
  await page.reload();await check.check();assert.equal((await stored()).weeks[data.selectedWeek].items[0].icon,'bike');
  await icon.click();assert.equal(await page.locator('[data-icon=bike]').getAttribute('aria-pressed'),'true');
  await page.keyboard.press('Escape');assert.equal(await page.locator('#entryIconPicker').getAttribute('open'),null);assert.equal(await page.locator('#itemDialog').getAttribute('open'),'');
  await page.locator('#entryIconSummary').click();await page.locator('[data-icon=none]').click();await page.locator('#itemForm [type=submit]').click();
  assert.match(await icon.getAttribute('class'),/is-empty/);
  await verifyAlignment();
  await card.locator('.item-main').click();await page.locator('#entryIconSummary').click();await page.locator('[data-icon=auto]').click();
  await page.locator('#itemCategory').selectOption('Sport');await page.locator('#itemForm [type=submit]').click();
  assert.equal((await stored()).weeks[data.selectedWeek].items[0].icon,'auto');
  await page.screenshot({path:path.join(out,'entry-icons-desktop.png')});
  await page.setViewportSize({width:390,height:844});await page.locator('#mobileTabs button').first().click();
  await verifyAlignment();
  await page.screenshot({path:path.join(out,'entry-icons-mobile.png')});
  await page.locator('#languageButton').click();await page.getByRole('menuitemradio',{name:'English'}).click();
  await icon.click();assert.equal(await page.locator('[data-icon=auto]').textContent(),'Automatic');
  await page.screenshot({path:path.join(out,'entry-icons-mobile-picker.png')});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);console.log('PASS: icon next to checkbox, direct picker, draft cancellation, manual/automatic/hidden choice, save/reload, done preserved, Escape, mobile and EN.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
