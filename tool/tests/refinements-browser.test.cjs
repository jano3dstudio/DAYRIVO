const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);
  await page.locator('#welcomeForm [type=submit]').click();
  const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('jsOfficeWeek_v1')));
  await page.locator('#progressDay').selectOption('Montag');await page.locator('#capturePlanButton').click();await page.locator('#startDayCommit').click();
  const frozen=(await stored()).weeks[(await stored()).selectedWeek].daySnapshots.Montag;
  assert.match(await page.locator('.day-lock-state').textContent(),/festgehalten/);
  assert.equal(await page.locator('.day-lock-badge').count(),1);
  await page.evaluate(()=>{data.weeks[data.selectedWeek].reminders=[{id:'test-reminder',day:'Montag',text:'Call back',done:false}];persist();render();});
  const lock=await page.locator('.day-lock-badge').boundingBox(),todoCount=await page.locator('[data-reminder-day=Montag] .reminder-count').boundingBox();
  assert.ok(lock.x>=todoCount.x+todoCount.width||lock.x+lock.width<=todoCount.x,'lock must not cover quick-todo controls');
  const card=page.locator('[data-day=Montag] .item').first();
  await card.locator('.item-main').click();await page.locator('#manageTitles').click();
  const count=await page.locator('#titleRecords .title-record').count();assert.ok(count<=8);
  await page.locator('#titleRecordName').fill('Meine Fokuszeit');await page.locator('#titleRecordCategory').selectOption('Kunde');await page.locator('#titleRecordForm [type=submit]').click();
  assert.equal(await page.locator('#titleRecords .title-record').count(),count+1);
  const row=page.locator('.title-record').filter({hasText:'Meine Fokuszeit'});await row.getByRole('button',{name:'Ausblenden',exact:true}).click();assert.equal(await row.count(),0);
  await page.screenshot({path:path.join(__dirname,'artifacts/refinements-titles.png')});
  await page.locator('#showHiddenTitles').check();await row.getByRole('button',{name:'Zurückholen',exact:true}).click();await page.keyboard.press('Escape');
  await page.locator('#itemTitleType').selectOption({label:'Meine Fokuszeit'});await page.locator('#itemTitle').fill('Fokus am Morgen');await page.locator('#itemForm [type=submit]').click();
  await page.locator('.day-lock-badge').click();assert.match(await page.locator('.day-deviation').textContent(),/Bewegung/);assert.match(await page.locator('.day-deviation').textContent(),/Fokus am Morgen/);await page.screenshot({path:path.join(__dirname,'artifacts/refinements-baseline.png')});await page.keyboard.press('Escape');
  const check=card.locator('.item-check');await check.scrollIntoViewIfNeeded();const box=await check.boundingBox();const x=box.x+8,y=box.y+10;await page.mouse.click(x,y);
  const pieces=await page.locator('.completion-confetti').evaluateAll(nodes=>nodes.map(n=>[parseFloat(n.style.left),parseFloat(n.style.top)]));assert.equal(pieces.length,24);assert.ok(pieces.every(p=>Math.abs(p[0]-x)<1&&Math.abs(p[1]-y)<1));
  assert.equal(await page.locator('.progress-ring').evaluate(e=>e.getAnimations().length>0),true);
  await page.waitForTimeout(800);assert.equal(await page.locator('[role=progressbar]').getAttribute('aria-valuenow'),'7');
  await check.uncheck();await check.focus();await page.keyboard.press('Space');
  const keyboardOrigin=await page.locator('.completion-confetti').first().evaluate(n=>[parseFloat(n.style.left),parseFloat(n.style.top)]);
  const keyboardBox=await check.boundingBox();assert.ok(Math.abs(keyboardOrigin[0]-keyboardBox.x-keyboardBox.width/2)<1);assert.ok(Math.abs(keyboardOrigin[1]-keyboardBox.y-keyboardBox.height/2)<1);
  await page.waitForTimeout(800);await page.emulateMedia({reducedMotion:'reduce'});await check.uncheck();await check.check();assert.equal(await page.locator('.completion-confetti').count(),0);await page.emulateMedia({reducedMotion:'no-preference'});
  assert.deepEqual((await stored()).weeks[(await stored()).selectedWeek].daySnapshots.Montag,frozen);
  await page.locator('#progressDay').selectOption('Dienstag');await page.locator('#capturePlanButton').click();await page.locator('#startDayCommit').click();
  assert.equal((await page.locator('.progress-ring strong').textContent()).trim(),'0%');
  assert.equal(await page.locator('[role=progressbar]').getAttribute('aria-valuenow'),'3');
  await page.locator('#progressDay').selectOption('Montag');
  assert.equal((await page.locator('.progress-ring strong').textContent()).trim(),'7%');
  assert.equal(await page.locator('[role=progressbar]').getAttribute('aria-valuenow'),'3');
  await page.screenshot({path:path.join(__dirname,'artifacts/day-ring-week-bar.png')});
  await page.locator('#planningShortcut').click();await page.locator('#planningStart').fill('06:00');await page.locator('#planningEnd').fill('21:00');await page.locator('#planningForm [type=submit]').click();await page.keyboard.press('Escape');await page.reload();
  assert.deepEqual((await stored()).settings.planningHours,{start:'06:00',end:'21:00'});
  assert.match(await page.locator('.hour-label').first().textContent(),/06:00/);assert.match(await page.locator('.hour-label').last().textContent(),/21:00/);
  await page.locator('#looksButton').click();assert.equal(await page.locator('#lookSelect option[value=jano]').count(),0);assert.ok(await page.locator('#lookSelect option').count()>=7);await page.keyboard.press('Escape');
  // Mock only the browser folder capability, checking nested paths and payload round trip.
  await page.evaluate(()=>{
   globalThis.savedFiles=[];
   const folder=prefix=>({name:'project',queryPermission:async()=>'granted',getDirectoryHandle:async name=>folder(prefix+name+'/'),getFileHandle:async name=>({createWritable:async()=>({write:async text=>savedFiles.push({path:prefix+name,text}),close:async()=>{}})})});
   directoryHandle=folder('');
  });
  await page.locator('#backupButton').click();const files=await page.evaluate(()=>savedFiles);assert.equal(files.length,1);assert.ok(files[0].path.startsWith('tool/backup/'));assert.deepEqual(JSON.parse(files[0].text).data,await stored());
  await page.locator('.calendar').evaluate(e=>e.scrollTop=0);await page.screenshot({path:path.join(__dirname,'artifacts/refinements-desktop.png')});
  const alignment=await page.evaluate(()=>[document.querySelector('.brand h1').getBoundingClientRect().left,document.querySelector('.sidebar-label').getBoundingClientRect().left+parseFloat(getComputedStyle(document.querySelector('.sidebar-label')).paddingLeft)]);assert.ok(Math.abs(alignment[0]-alignment[1])<1);
  await page.locator('#languageButton').click();await page.locator('#languageMenu [data-language=en]').click();
  assert.match(await page.locator('#sidebarProgress').textContent(),/WEEKLY PROGRESS/);
  for(const width of [1100,768,390]){await page.setViewportSize({width,height:900});await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  await page.screenshot({path:path.join(__dirname,'artifacts/refinements-mobile.png')});
  assert.deepEqual(errors,[]);console.log('PASS: title library, immutable baseline differences, pointer confetti, daily animation/weekly progress, planning hours, look removal, nested backup, alignment, responsive EN.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
