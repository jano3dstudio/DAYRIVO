const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1560,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);await page.locator('#welcomeForm [type=submit]').click();
  await page.locator('#progressDay').selectOption('Montag');
  await page.locator('#dayHighlightButton').click();await page.locator('#highlightChoice').selectOption({index:1});await page.locator('#highlightForm [type=submit]').click();
  const card=page.locator('[data-day=Montag] .item').first();assert.equal(await card.evaluate(n=>n.classList.contains('is-highlight')),true);
  await page.locator('#capturePlanButton').click();await page.locator('#startDayCommit').click();await card.locator('.item-check').check();
  assert.equal(await page.locator('[data-rhythm-day=Montag] .sun-ray.lit').count(),1);assert.equal(await page.locator('[data-rhythm-day=Montag] .sun-star').count(),1);
  assert.match(await page.locator('#toast').textContent(),/Tageshighlight/);await page.waitForTimeout(900);
  await page.locator('#weekReviewButton').click();await page.locator('#reviewReflection').fill('Sport und Familie waren wichtig');await page.locator('#reviewNext').fill('Freitag freihalten');await page.locator('#weekReviewCommit').click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jsOfficeWeek_v1')));assert.equal(saved.weeks[saved.selectedWeek].review.summary.doneCount,1);
  await page.waitForTimeout(1000);await page.screenshot({path:path.join(__dirname,'artifacts/rhythm-review.png')});await page.keyboard.press('Escape');
  await card.locator('.item-check').uncheck();assert.equal(await page.locator('[data-rhythm-day=Montag] .sun-star').count(),0);
  await page.locator('#weekReviewButton').click();assert.equal(await page.locator('.review-numbers b').first().textContent(),'1');await page.keyboard.press('Escape');await page.reload();
  await page.locator('#progressDay').selectOption('Montag');assert.match(await page.locator('#dayHighlightButton b').textContent(),/Bewegung/);
  await card.locator('.item-main').click();assert.equal(await page.locator('#itemHighlight').isChecked(),true);await page.locator('#itemHighlight').uncheck();await page.locator('#itemForm [type=submit]').click();assert.equal(await page.locator('.item.is-highlight').count(),0);
  await page.locator('#languageButton').click();await page.locator('#languageMenu [data-language=en]').click();await page.locator('#weekReviewButton').click();assert.equal(await page.locator('#weekReviewHeading').textContent(),'Your week reflection');assert.equal(await page.locator('#reviewNext').inputValue(),'Freitag freihalten');
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.join(__dirname,'artifacts/rhythm-mobile.png')});await page.keyboard.press('Escape');
  await page.locator('#menuButton').click();await page.locator('#menuReview').click();assert.equal(await page.locator('#weekReviewDialog').evaluate(n=>n.open),true);
  assert.deepEqual(errors,[]);console.log('PASS: highlight selection/editor/undo, sun growth, milestone, persistent frozen reflection, DE/EN and mobile menu.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
