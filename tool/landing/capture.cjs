// Public-facing screenshots use synthetic data and an isolated browser profile.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const P=require('../js/dayform-model.js');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  page.on('pageerror',error=>{throw error;});
  const d=P.createDayformData();d.settings.needsWelcome=false;d.settings.language='en';P.ensureWeek(d,'2026-09-14');
  const week=d.weeks[d.selectedWeek];week.items=[];
  const blocks=[
   ['08:00','08:30','Familie','School run','home'],['08:30','09:00','Routine','Coffee & a clear head','coffee'],
   ['09:00','11:00','Kunde','Brand exploration','briefcase'],['11:00','12:00','Kunde','Make something great','sparkles'],
   ['12:00','13:00','Pause','Lunch & a little fresh air','coffee'],['13:00','14:30','Kunde','Design in focus','briefcase'],
   ['15:00','16:00','Sport','Time to move','bike']
  ];
  for(const day of P.days)for(const [start,end,cat,title,icon]of blocks)week.items.push({id:P.uid(),day,start,end,cat,title,icon,description:'',done:false});
  for(const [i,day]of P.days.entries()){d.settings.days[day].subtitle=['A fresh start','Create space','Find your focus','Make it happen','Finish feeling good'][i];P.captureDay(week,day);}
  week.items.filter(item=>item.day==='Montag').slice(0,4).forEach(item=>item.done=true);
  const out=path.join(__dirname,'assets');fs.mkdirSync(out,{recursive:true});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);
  for(const look of ['rainbow','arcade','glacier']){
   const theme=d.looks.find(x=>x.id==='df-'+look);
   d.settings.appearance={accent:theme.accent,frame:theme.frame};
   for(const day of P.days)d.settings.days[day].color=theme.days[day];
   await page.evaluate(d=>localStorage.setItem('jsOfficeWeek_v1',JSON.stringify(d)),d);
   await page.setViewportSize({width:1600,height:1000});await page.reload();
   await page.locator('.calendar').evaluate(e=>e.scrollTop=60);
   await page.screenshot({path:path.join(out,'week-'+look+'.jpg'),type:'jpeg',quality:90});
   await page.setViewportSize({width:520,height:880});
   await page.locator('#mobileTabs button').nth(1).click();
   await page.locator('.calendar').evaluate(e=>e.scrollTop=40);
   await page.screenshot({path:path.join(out,'week-'+look+'-mobile.jpg'),type:'jpeg',quality:90});
  }
  console.log('Captured six clean DAYRIVO previews with synthetic data.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
