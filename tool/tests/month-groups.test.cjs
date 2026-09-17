const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');const P=require('../js/planner.js');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1560,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const seed=P.createData();
  for(const iso of ['2026-08-31','2026-09-07','2026-09-14','2026-09-21','2026-09-28']){
   const week=P.ensureWeek(seed,iso);week.items=[];
   P.days.forEach((day,index)=>{
    const entries=[['Schule','07:30','08:00'],['Sport','08:00','08:30'],[index===3?'Spiel':'Kunde','09:00',index===4?'12:00':'15:00'],['Pause','15:00','15:30'],['Familie','17:00','18:00']];
    entries.forEach(([cat,start,end])=>week.items.push({id:P.uid(),day,cat,start,end,title:cat,done:iso<'2026-09-14'}));
   });
  }
  seed.selectedWeek='2026-09-14';
  await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);
  await page.evaluate(seed=>localStorage.setItem('jsOfficeWeek_v1',JSON.stringify(seed)),seed);await page.reload();
  const stored=()=>page.evaluate(()=>localStorage.getItem('jsOfficeWeek_v1'));
  const before=await stored(),month=P.monthMetrics(seed,'2026-09');
  await page.locator('[data-section=month]').click();
  assert.equal(await page.locator('.month-day').count(),30);
  assert.equal(await page.locator('.month-week-index').count(),5);
  assert.equal(await page.locator('.month-group-card').count(),4);
  for(const group of month.groups.filter(g=>g.id!=='other'))assert.equal(await page.locator(`.month-group-card[data-month-group=${group.id}]>strong`).textContent(),P.durationLabel(group.planned));
  assert.equal(await page.locator('[data-date="2026-09-14"] .month-bucket').count(),4);
  const out=path.resolve(__dirname,'artifacts');fs.mkdirSync(out,{recursive:true});
  await page.screenshot({path:path.join(out,'month-groups-desktop.png')});
  await page.locator('[data-month-group=sport]').click();
  assert.equal(await page.locator('[data-month-group=sport]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.month-bucket:not(.group-sport)').count(),0);
  assert.match(await page.locator('[data-date="2026-09-14"] .month-bucket').textContent(),/0:30 h/);
  assert.equal(await stored(),before);
  await page.locator('#followingWeek').click();assert.match(await page.locator('#weekLabel').textContent(),/Oktober/);
  assert.equal(await stored(),before);
  await page.locator('#previousWeek').click();
  await page.locator('[data-month-group=all]').click();
  assert.equal(await page.locator('[data-date="2026-09-14"] .month-bucket').count(),4);
  await page.locator('.month-assignment summary').click();
  assert.match(await page.locator('.month-assignment').textContent(),/Schule/);
  await page.locator('.month-assignment summary').click();
  await page.setViewportSize({width:1366,height:768});
  await page.locator('#monthPanel').evaluate(panel=>panel.scrollTop=0);
  await page.screenshot({path:path.join(out,'month-groups-laptop.png')});
  await page.setViewportSize({width:390,height:844});
  await page.locator('#monthPanel').evaluate(panel=>panel.scrollTop=0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:path.join(out,'month-groups-mobile.png')});
  await page.locator('.month-grid').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(out,'month-groups-mobile-calendar.png')});
  await page.locator('[data-month-group=private]').click();assert.equal(await page.locator('.month-bucket:not(.group-private)').count(),0);
  await page.locator('#languageButton').click();await page.getByRole('menuitemradio',{name:'English',exact:true}).click();
  assert.match(await page.locator('[data-month-group=private]').textContent(),/Personal/);
  assert.match(await page.locator('.month-filter-line').textContent(),/Personal/);
  await page.locator('[data-month-group=all]').click();
  await page.locator('[data-date="2026-09-17"]').click();
  assert.ok(await page.locator('.calendar').isVisible());
  assert.match(await page.locator('.day-head.mobile-show .day-name').textContent(),/Thursday/);
  assert.deepEqual(errors,[]);
  console.log('PASS: separate area totals and completion, daily buckets, filters without writes, month navigation, assignment explanation, desktop/laptop/mobile, EN, day navigation.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
