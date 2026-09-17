const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url'),P=require('../js/planner.js');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const seed=P.createData();P.ensureWeek(seed,'2026-09-14');
  seed.weeks[seed.selectedWeek].items=seed.weeks[seed.selectedWeek].items.filter(i=>i.day!=='Montag');
  seed.weeks[seed.selectedWeek].items.push({id:'drag-test',day:'Montag',title:'Fokusarbeit',cat:'Kunde',start:'09:30',end:'11:00',done:false});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);
  await page.evaluate(seed=>localStorage.setItem('jsOfficeWeek_v1',JSON.stringify(seed)),seed);await page.reload();
  const card=page.locator('[data-id=drag-test]'),hint=page.locator('.drag-time-hint');
  const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('jsOfficeWeek_v1')));
  const original=await stored();
  async function startDrag(day,delta){
    await card.scrollIntoViewIfNeeded();
    const b=await card.boundingBox(),target=await page.locator('[data-day="'+day+'"]').boundingBox();
    const ppm=await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hour'))/60);
    await page.mouse.move(b.x+b.width-40,b.y+22);await page.mouse.down();
    await page.mouse.move(target.x+target.width-45,b.y+22+delta*ppm,{steps:5});
  }
  await card.locator('.item-main').click();assert.equal(await hint.count(),0);
  await page.locator('#itemDialog [data-close]').first().click();
  await startDrag('Montag',44);
  assert.equal(await hint.locator('strong').textContent(),'10:15');assert.equal(await hint.locator('span').textContent(),'+45 Min.');
  assert.deepEqual(await stored(),original);
  const out=path.join(__dirname,'artifacts');fs.mkdirSync(out,{recursive:true});
  await page.screenshot({path:path.join(out,'drag-time-preview.png')});
  await page.keyboard.press('Escape');await page.mouse.up();assert.equal(await hint.count(),0);assert.deepEqual(await stored(),original);
  await startDrag('Donnerstag',0);
  assert.equal(await hint.locator('strong').textContent(),'Do · 09:30');assert.equal(await hint.locator('span').textContent(),'±0 Min.');
  await page.mouse.up();assert.equal(await hint.count(),0);
  assert.equal((await stored()).weeks[seed.selectedWeek].items.find(i=>i.id==='drag-test').day,'Donnerstag');
  await startDrag('Donnerstag',-29);
  assert.equal(await hint.locator('strong').textContent(),'09:00');assert.equal(await hint.locator('span').textContent(),'−30 Min.');
  await page.mouse.up();
  assert.equal((await stored()).weeks[seed.selectedWeek].items.find(i=>i.id==='drag-test').start,'09:00');
  const beforeCancel=await stored();
  await startDrag('Freitag',15);
  const cal=await page.locator('.calendar').boundingBox();
  await page.mouse.move(1900,cal.y+cal.height-5);
  await page.evaluate(()=>new Promise(resolve=>{let n=0;function tick(){if(++n===8)resolve();else requestAnimationFrame(tick);}requestAnimationFrame(tick);}));
  const preview=await page.locator('.drag-preview .item-time').textContent(),shown=await hint.locator('strong').textContent();
  assert.ok(shown.endsWith(preview.slice(0,5)));
  const delta=P.minutes(preview.slice(0,5))-P.minutes('09:00');assert.equal(await hint.locator('span').textContent(),'+'+delta+' Min.');
  const hb=await hint.boundingBox();assert.ok(hb.x>=0&&hb.x+hb.width<=1920&&hb.y>=0&&hb.y+hb.height<=1080);
  await page.mouse.move(2,cal.y+100);assert.ok(await hint.isHidden());await page.mouse.up();
  assert.equal(await hint.count(),0);assert.deepEqual(await stored(),beforeCancel);
  await page.locator('#languageButton').click();await page.getByRole('menuitemradio',{name:'English'}).click();
  await startDrag('Donnerstag',15);assert.equal(await hint.locator('span').textContent(),'+15 min');
  await card.locator('.item-main').dispatchEvent('pointercancel');await page.mouse.up();assert.equal(await hint.count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: no hint on click, snapped +/- delta, target day, no draft writes, commit, Escape/outside/pointer cancellation, autoscroll, edge placement, EN.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
