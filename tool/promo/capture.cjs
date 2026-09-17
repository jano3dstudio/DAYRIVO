// Isolated demo data only. Never opens the user's browser profile.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const P=require('../js/dayform-model.js');
const out=path.join(__dirname,'media');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
  page.on('pageerror',e=>{throw e;});
  const d=P.createDayformData();d.settings.needsWelcome=false;d.settings.language='en';P.ensureWeek(d,'2026-09-14');
  const week=d.weeks[d.selectedWeek];week.items=[];
  const blocks=[['08:00','08:30','Familie','School run','home'],['08:30','09:00','Routine','Coffee & a clear head','coffee'],['09:00','11:00','Kunde','Brand exploration','briefcase'],['11:00','12:00','Kunde','Make something great','sparkles'],['12:00','13:00','Pause','Lunch & a little fresh air','coffee'],['13:00','14:30','Kunde','Design in focus','briefcase'],['15:00','16:00','Sport','Time to move','bike']];
  for(const day of P.days)for(const [start,end,cat,title,icon] of blocks)week.items.push({id:P.uid(),day,start,end,cat,title,icon,description:'',done:false});
  for(const [i,day]of P.days.entries())d.settings.days[day].subtitle=['A fresh start','Create space','Find your focus','Make it happen','Finish feeling good'][i];
  for(const day of P.days)P.captureDay(week,day);
  week.items.filter(i=>i.day==='Montag').slice(0,3).forEach(i=>i.done=true);
  await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);
  await page.evaluate(d=>localStorage.setItem('jsOfficeWeek_v1',JSON.stringify(d)),d);await page.reload();
  await page.locator('.calendar').evaluate(e=>e.scrollTop=60);await page.waitForTimeout(100);
  const shot=async name=>{await page.screenshot({path:path.join(out,name+'.jpg'),type:'jpeg',quality:95});};
  await shot('week');
  const item=week.items.find(i=>i.day==='Dienstag'&&i.start==='09:00'),card=page.locator(`[data-id="${item.id}"] .item-main`),b=await card.boundingBox();
  const track=await page.locator('[data-day=Mittwoch]').boundingBox();
  const drag=[];await page.mouse.move(b.x+70,b.y+32);await page.mouse.down();
  for(let i=0;i<36;i++){
   const f=i/35,e=f*f*(3-2*f),x=b.x+70+(track.x+90-b.x-70)*e,y=b.y+32+78*e;
   await page.mouse.move(x,y);await page.waitForTimeout(18);await shot('drag-'+i);drag.push({x,y});
  }
  await page.mouse.up();await page.waitForTimeout(100);await shot('moved');
  const doneItem=week.items.find(i=>i.day==='Dienstag'&&i.start==='11:00');
  const done=page.locator(`[data-id="${doneItem.id}"] .item-check`),box=await done.boundingBox();
  await shot('before-done');await done.check();
  for(let i=0;i<18;i++){await shot('done-'+i);await page.waitForTimeout(16);}
  await page.waitForTimeout(800);await shot('done');
  for(const theme of ['rainbow','arcade','glacier']){
   await page.evaluate(id=>{const p=data.looks.find(x=>x.id==='df-'+id);data.settings.appearance={accent:p.accent,frame:p.frame};for(const day of P.days)data.settings.days[day].color=p.days[day];render();},theme);await shot(theme);
  }
  await page.setViewportSize({width:700,height:1080});await page.locator('#mobileTabs button').nth(0).click();
  await page.locator('.calendar').evaluate(e=>e.scrollTop=70);await page.waitForTimeout(100);await shot('mobile');
  for(const theme of ['rainbow','arcade','glacier']){
   await page.evaluate(id=>{const p=data.looks.find(x=>x.id==='df-'+id);data.settings.appearance={accent:p.accent,frame:p.frame};for(const day of P.days)data.settings.days[day].color=p.days[day];render();},theme);await shot('mobile-'+theme);
  }
  fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify({drag,done:{x:box.x+16,y:box.y+16},size:[1600,1000]},null,2));
  console.log('Captured real DAYRIVO UI: week, cross-day drag, completion, three looks, mobile.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
