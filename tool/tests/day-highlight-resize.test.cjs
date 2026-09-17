const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url'),P=require('../js/planner.js');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1560,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.setFixedTime(new Date('2026-09-16T12:00:00'));
  const data=P.createData();P.ensureWeek(data,'2026-09-14');
  data.weeks['2026-09-14'].items=[
   {id:'resize-test',day:'Mittwoch',start:'09:00',end:'11:00',cat:'Kunde',title:'Design & Produktion',description:'Konzept ausarbeiten',done:true,actualMinutes:75,hourlyRateCents:12000},
   {id:'early-test',day:'Mittwoch',start:'07:00',end:'08:00',cat:'Routine',title:'Tagesstart',description:'',done:false},
   {id:'tiny-test',day:'Mittwoch',start:'12:00',end:'12:15',cat:'Pause',title:'Kurze Pause',description:'',done:false}
  ];
  await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);
  await page.evaluate(data=>localStorage.setItem('jsOfficeWeek_v1',JSON.stringify(data)),data);await page.reload();
  const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('jsOfficeWeek_v1')).weeks['2026-09-14'].items);
  assert.equal(await page.locator('.day-head.today').count(),1);assert.equal(await page.locator('.day-track.today').getAttribute('data-day'),'Mittwoch');
  assert.equal(await page.locator('.day-head.today').getAttribute('aria-current'),'date');
  const style=await page.locator('.day-head.today').evaluate(el=>{const s=getComputedStyle(el);return [s.borderTopWidth,s.borderBottomWidth,s.borderTopColor,s.borderBottomColor,s.borderLeftWidth,s.borderRightWidth];});
  assert.deepEqual(style.slice(0,2),['4px','4px']);assert.equal(style[2],style[3]);assert.deepEqual(style.slice(4),['4px','4px']);
  await page.locator('#followingWeek').click();assert.equal(await page.locator('.day-head.today,.day-track.today').count(),0);
  await page.locator('#previousWeek').click();
  const card=page.locator('[data-id="resize-test"]'),handle=card.locator('.resize-start-handle');
  const scale=()=>page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hour'))/60);
  async function drag(grip,minutes,cancel=false){
   await grip.scrollIntoViewIfNeeded();const b=await grip.boundingBox(),ppm=await scale();
   await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();
   await page.mouse.move(b.x+b.width/2,b.y+b.height/2+minutes*ppm,{steps:8});
   if(cancel)await page.keyboard.press('Escape');await page.mouse.up();
  }
  await drag(handle,-30);let item=(await saved())[0];assert.equal(item.start,'08:30');assert.equal(item.end,'11:00');assert.equal(item.actualMinutes,75);
  await drag(handle,15);assert.equal((await saved())[0].start,'08:45');
  const before=await saved();await drag(handle,-30,true);assert.deepEqual(await saved(),before);
  await handle.focus();await page.keyboard.press('ArrowUp');assert.equal((await saved())[0].start,'08:30');
  await page.keyboard.press('ArrowDown');assert.equal((await saved())[0].start,'08:45');
  await drag(card.locator('.resize-handle'),15);assert.equal((await saved())[0].end,'11:15');assert.equal((await saved())[0].actualMinutes,75);
  // Extending above the fitted day's first hour must expose earlier hours.
  const early=page.locator('[data-id="early-test"] .resize-start-handle');await early.scrollIntoViewIfNeeded();
  const unchanged=await saved();await early.click({delay:220});assert.deepEqual(await saved(),unchanged);
  const b=await early.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+2);await page.mouse.down();
  const scrollBefore=await page.locator('.calendar').evaluate(el=>el.scrollTop);assert.ok(scrollBefore>0);
  await page.mouse.move(b.x+b.width/2,b.y-4);await page.waitForTimeout(220);await page.mouse.up();
  assert.ok(P.minutes((await saved())[1].start)<420);assert.equal((await saved())[1].end,'08:00');
  await page.reload();assert.equal((await saved())[0].start,'08:45');
  await card.hover();const out=path.join(__dirname,'artifacts');fs.mkdirSync(out,{recursive:true});
  await page.screenshot({path:path.join(out,'day-highlight-resize-desktop.png')});
  await card.screenshot({path:path.join(out,'day-resize-handle.png')});
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);
  assert.equal(await page.locator('.day-track.today:visible').count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:path.join(out,'day-highlight-resize-mobile.png')});
  assert.deepEqual(errors,[]);
  console.log('PASS: today only in matching week; header bars; start resize earlier/later, bounds, keyboard, Escape, early-hour autoscroll; end resize and actual time preserved; mobile.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
