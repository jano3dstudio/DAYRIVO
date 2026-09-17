const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url'),P=require('../js/planner.js');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const data=P.createData();P.ensureWeek(data,'2026-09-14');data.settings.view={mode:'manual',scale:3};
  await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);
  await page.evaluate(data=>localStorage.setItem('jsOfficeWeek_v1',JSON.stringify(data)),data);await page.reload();
  const stored=()=>page.evaluate(()=>localStorage.getItem('jsOfficeWeek_v1')),before=await stored();
  const metrics=()=>page.evaluate(()=>{const cal=document.querySelector('.calendar');return {hour:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hour')),overflow:cal.scrollHeight-cal.clientHeight,pageOverflow:document.documentElement.scrollWidth-innerWidth};});
  assert.equal(await page.locator('#fitDay,#zoomIn,#zoomOut,.toolbar-tools').count(),0);
  const out=path.join(__dirname,'artifacts');fs.mkdirSync(out,{recursive:true});
  const scales=[];
  const minimumHour=40/Math.max(15,Math.min(30,...data.weeks[data.selectedWeek].items.map(P.duration)))*60;
  for(const [width,height] of [[1366,768],[1920,1080],[2560,1440],[390,844]]){
    await page.setViewportSize({width,height});
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const m=await metrics();scales.push(m.hour);assert.ok(m.hour>=minimumHour&&m.hour<=Math.max(84,minimumHour),JSON.stringify(m));assert.equal(m.pageOverflow,0);
    if(width===2560)assert.equal(m.hour,Math.max(84,minimumHour));
    const lunch=page.locator('.day-track:visible .item').filter({has:page.locator('.item-title',{hasText:'Essen + Spaziergang'})}).first();
    const cardBox=await lunch.boundingBox(),titleBox=await lunch.locator('.item-title').boundingBox();
    assert.ok(titleBox.y+titleBox.height<=cardBox.y+cardBox.height,JSON.stringify({cardBox,titleBox}));
    assert.equal(await stored(),before);
    await page.screenshot({path:path.join(out,`auto-layout-${width}.png`)});
  }
  assert.ok(scales[1]>=scales[0],JSON.stringify(scales));
  // A quarter-hour item keeps its icon and two text rows; all columns share noon.
  await page.setViewportSize({width:1366,height:768});
  const dense=P.clone(data);dense.weeks['2026-09-14'].items=[
    {id:'short',day:'Montag',cat:'Kunde',title:'Kurzer Call',start:'12:00',end:'12:15'},
    {id:'noon',day:'Dienstag',cat:'Kunde',title:'Gleiche Uhrzeit',start:'12:00',end:'14:00'},
    {id:'late',day:'Mittwoch',cat:'Kunde',title:'Später Termin',start:'22:00',end:'23:45'}
  ];
  await page.evaluate(data=>localStorage.setItem('jsOfficeWeek_v1',JSON.stringify(data)),dense);await page.reload();
  const short=await page.locator('[data-id=short]').boundingBox(),noon=await page.locator('[data-id=noon]').boundingBox();
  assert.ok(short.height>=38);assert.ok(Math.abs(short.y-noon.y)<1);assert.ok((await metrics()).overflow>0);
  const time=await page.locator('[data-id=short] .item-time').boundingBox(),title=await page.locator('[data-id=short] .item-title').boundingBox(),icon=await page.locator('[data-id=short] .item-icon').boundingBox();
  assert.equal(icon.width,32);assert.ok(title.y>=time.y+time.height);assert.ok(title.y+title.height<=short.y+short.height);assert.ok(icon.y+icon.height<=short.y+short.height);
  assert.ok((await metrics()).hour<=160);const denseBefore=await stored();
  await page.locator('.calendar').evaluate(el=>el.scrollTop=300);
  const anchor=await page.evaluate(()=>document.querySelector('.calendar').scrollTop/parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hour')));
  await page.setViewportSize({width:1920,height:1080});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const nextAnchor=await page.evaluate(()=>document.querySelector('.calendar').scrollTop/parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hour')));
  assert.ok(Math.abs(anchor-nextAnchor)<.02);assert.equal(await stored(),denseBefore);
  await page.locator('[data-section=month]').click();await page.locator('[data-section=week]').click();
  assert.deepEqual(errors,[]);console.log('PASS: automatic bounded scale, old manual setting ignored, no resize writes, short-block readability, cross-day alignment, scroll anchor and responsive views.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
