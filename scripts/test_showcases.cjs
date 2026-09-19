/* Smoke checks for the preserved showcase engines, not a full game playthrough. */
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.PORTFOLIO_URL || 'http://127.0.0.1:4173';
const slugs = ['hledan','elbaf','onigashima','one-piece','naruto','jjk'];
(async () => {
  const browser = await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL || 'chrome',args:['--enable-unsafe-swiftshader']});
  const results = [];
  for (const mobile of process.env.GALLERY_ONLY ? [] : [false,true]) {
    for (const slug of slugs) {
      const context = await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
      // Keep optional audio off during automated scene interaction.
      await context.addInitScript(() => {try {localStorage.setItem('oni.audio','0');} catch (_) {}});
      const page = await context.newPage();
      const errors = [], failures = [];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('request',r=>{if(new URL(r.url()).pathname.endsWith('/models/'))failures.push('Empty model filename: '+r.url())});
      page.on('response',r=>{if(r.status()>=400)failures.push(`${r.status()} ${r.url()}`)});
      const response = await page.goto(`${base}/showcase/${slug}/`,{waitUntil:'domcontentloaded',timeout:45000});
      assert.equal(response.status(),200);
      await page.locator('canvas:visible').first().waitFor({state:'visible',timeout:45000});
      await page.waitForTimeout(2500);
      if (slug === 'hledan') {
        await page.locator('[data-sky="night"]').click();
        await page.waitForTimeout(700);
        assert.match(await page.locator('[data-sky="night"]').getAttribute('class'),/on/);
        await page.locator('[data-mode="walk"]').click();
        assert.match(await page.locator('[data-mode="walk"]').getAttribute('class'),/on/);
        if (!mobile) await page.keyboard.press('Escape');
        await page.locator('[data-mode="orbit"]').click();
        await page.locator('#reset').click();
      }
      if (slug === 'elbaf') {
        await page.getByRole('button',{name:'Performance',exact:true}).click();
        await page.getByRole('button',{name:'BEGIN THE DESCENT',exact:true}).click();
        await page.waitForTimeout(3500);
        assert.equal(await page.getByRole('button',{name:'BEGIN THE DESCENT',exact:true}).count(),0);
      }
      if (slug === 'onigashima') {
        await page.getByRole('button',{name:/TAKE THE HELM/}).click();
        await page.waitForTimeout(2500);
        assert.equal(await page.getByRole('button',{name:/TAKE THE HELM/}).count(),0);
      }
      if (slug === 'one-piece') {
        const next = page.getByRole('button',{name:'Next Drink',exact:true});
        await next.scrollIntoViewIfNeeded();
        await next.click();
        await page.waitForTimeout(700);
        assert.ok(await page.locator('canvas').count()>=1);
      }
      if (slug === 'naruto' || slug === 'jjk') {
        await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight*.8));
        await page.waitForTimeout(700);
        assert.equal(await page.getByRole('link',{name:/Return to the showcase gallery/}).count(),1);
      }
      assert.deepEqual(errors,[],`${slug} script errors`);
      assert.deepEqual(failures,[],`${slug} failed resources`);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${slug} overflow`);
      results.push({slug,viewport:mobile?'390×844 touch':'1280×800 desktop',canvas:await page.locator('canvas').count(),errors:0,failedResources:0});
      console.log('PASS',slug,mobile?'touch':'desktop');
      await context.close();
    }
  }
  const page = await browser.newPage({viewport:{width:390,height:844}});
  await page.goto(base+'/showcase/',{waitUntil:'networkidle'});
  await page.locator('#preloader').waitFor({state:'hidden',timeout:10000});
  assert.equal(await page.locator('.showcase-sources a[href*="github.com"]').count(),9);
  for (const width of [320,390,768,1024,1440]) {
    await page.setViewportSize({width,height:900});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`Gallery at ${width}`);
  }
  await page.setViewportSize({width:390,height:844});
  await page.locator('#navToggle').click();
  assert.equal(await page.locator('#navToggle').getAttribute('aria-expanded'),'true');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#navToggle').getAttribute('aria-expanded'),'false');
  console.log(JSON.stringify(results,null,2));
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
