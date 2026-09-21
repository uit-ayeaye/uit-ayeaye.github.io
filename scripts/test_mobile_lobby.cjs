/* Real touch gestures, disclosure layout and constrained-device media regression. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({isMobile:true,hasTouch:true,viewport:{width:390,height:844},deviceScaleFactor:2});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.PORTFOLIO_URL||'http://127.0.0.1:4173',{waitUntil:'networkidle'});
 const cdp=await page.context().newCDPSession(page);
 const lobby=page.locator('.character-select'),stage=page.locator('.hero-art-window');
 async function swipe(dx,dy){
  await lobby.scrollIntoViewIfNeeded();
  const box=await stage.boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=8;i++){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/8,y:y+dy*i/8}]});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&scrollX===0),true,'No sideways overflow during touch drag');
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }
 await swipe(-100,0);await page.waitForFunction(()=>document.querySelector('.character-select').dataset.character==='ship');
 await swipe(-100,0);await page.waitForFunction(()=>document.querySelector('.character-select').dataset.character==='bounty');
 await swipe(100,0);await page.waitForFunction(()=>document.querySelector('.character-select').dataset.character==='ship');
 const before=await page.evaluate(()=>scrollY);await swipe(5,-110);
 assert.equal(await lobby.getAttribute('data-character'),'ship','Vertical gesture preserves character');
 assert.ok(await page.evaluate(()=>scrollY)>before+30,'Native vertical page scroll works');
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});
  for(const theme of ['dark','light']){
   await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   const skills=page.locator('.skill');
   for(let i=0;i<await skills.count();i++){
    const skill=skills.nth(i);await skill.locator('summary').click();
    assert.equal(await skill.getAttribute('open')!==null,true);
    assert.equal(await skill.locator('.scroll-sheet').count(),0,'Toolkit does not inherit parchment');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,`No overflow ${width} ${theme}`);
    assert.equal(await skill.evaluate(el=>el.getAnimations({subtree:true}).some(a=>a.effect.getKeyframes().some(f=>'height'in f))),false,'No layout animation');
    await skill.locator('summary').click();
   }
  }
 }
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>document.documentElement.dataset.theme='dark');
 await page.locator('.skill').nth(4).locator('summary').click();
 await page.waitForFunction(()=>getComputedStyle(document.querySelectorAll('.skill-detail')[4]).opacity==='1');
 await page.locator('.skill').nth(4).screenshot({animations:'disabled',path:'/tmp/portfolio-toolkit-mobile.png'});
 await lobby.scrollIntoViewIfNeeded();await lobby.screenshot({animations:'disabled',path:'/tmp/portfolio-lobby-mobile.png'});
 assert.equal(await page.locator('.preview-loop').evaluateAll(videos=>videos.every(v=>v.paused)),true,'Touch devices keep inline previews still');
 await page.locator('.project-cover[data-project-id="endgame"]').click();
 const video=page.locator('#preview-loop');
 assert.equal(await video.evaluate(v=>v.paused),true,'Viewer waits for play on touch');
 await page.locator('.preview-motion').click();
 await page.waitForFunction(()=>!document.querySelector('#preview-loop').paused);
 await page.locator('.preview-motion').click();
 await page.waitForFunction(()=>document.querySelector('#preview-loop').paused);
 await page.locator('.preview-close').click();
 await page.emulateMedia({reducedMotion:'reduce'});
 await lobby.scrollIntoViewIfNeeded();await page.locator('[data-art="captain"]').click();
 await page.waitForFunction(()=>document.querySelector('.character-select').dataset.character==='captain');
 assert.equal(await stage.evaluate(el=>el.getAnimations({subtree:true}).length),0,'Reduced motion stops character animation');
 assert.deepEqual(errors,[]);
 await browser.close();console.log('PASS: real touch swipes, vertical scroll, drag overflow, all toolkit panels at four widths in both themes, no height animations, mobile previews paused.');
})().catch(e=>{console.error(e);process.exit(1)});
