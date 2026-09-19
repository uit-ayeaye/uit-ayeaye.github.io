/* Run against a local preview. PLAYWRIGHT_MODULE may point to a bundled runtime. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.PORTFOLIO_URL || 'http://127.0.0.1:4173';
const projects = require('../data/projects.json');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'chrome' });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.project-card').count(), 25);
  assert.equal(await page.locator('.project-card:visible').count(), 9);
  await page.getByRole('button', { name: /Unroll the complete/ }).click();
  assert.equal(await page.locator('.project-card:visible').count(), 25);
  assert.match(page.url(), /view=all/);
  for (const cat of ['Games','Platforms','Commerce','People & Culture','Tools','Immersive']) {
    await page.locator(`[data-filter="${cat}"]`).click();
    assert.equal(await page.locator('.project-card:visible').count(), projects.filter(p => p.category === cat).length, cat);
  }
  await page.locator('[data-filter="All"]').click();
  await page.getByRole('searchbox').fill('myanmar fonts');
  assert.equal(await page.locator('.project-card:visible').count(), 1);
  assert.match(await page.locator('.project-card:visible h3').innerText(), /Glyph/);
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.getByRole('searchbox').inputValue(), 'myanmar fonts');
  assert.equal(await page.locator('.project-card:visible').count(), 1);
  await page.getByRole('searchbox').fill('no-such-voyage');
  assert.equal(await page.locator('.project-card:visible').count(), 0);
  assert.equal(await page.locator('.empty-state').isVisible(), true);
  await page.locator('#reset-search').click();
  assert.equal(await page.locator('.project-card:visible').count(), 9);
  assert.equal(await page.getByRole('searchbox').inputValue(), '');
  await page.locator('h1').click();
  await page.keyboard.press('/');
  assert.equal(await page.getByRole('searchbox').evaluate(el => el === document.activeElement), true);
  await page.locator('.motion-toggle').click();
  assert.equal(await page.locator('html').evaluate(el => el.classList.contains('motion-paused')), true);
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('.motion-toggle').getAttribute('aria-pressed'), 'true');
  await page.locator('[data-set-filter="Commerce"]').click();
  assert.equal(await page.locator('.project-card:visible').count(), 5);

  const axeSource = process.env.AXE_SOURCE;
  const accessibility = [];
  async function audit(p, label) {
    if (!axeSource) return;
    await p.addScriptTag({ path: axeSource });
    const result = await p.evaluate(async () => await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }));
    accessibility.push({ label, violations: result.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description, nodes: v.nodes.map(n => ({target:n.target,summary:n.failureSummary})).slice(0,8) })) });
  }
  await page.goto(base+'/?view=all', {waitUntil:'networkidle'});
  await audit(page, 'Desktop home, all projects');
  await page.locator('.gear-toggle').click();
  assert.equal(await page.locator('html').evaluate(el => el.classList.contains('gear-five')), true);
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('.gear-toggle').getAttribute('aria-pressed'), 'true');
  await page.locator('.gear-toggle').click();
  assert.equal(await page.locator('html').evaluate(el => el.classList.contains('gear-five')), false);
  for (const tab of await page.getByRole('tab').all()) {
    await tab.click();
    const panel = page.getByRole('tabpanel');
    assert.equal(await panel.count(), 1);
    assert.equal(await tab.getAttribute('aria-selected'), 'true');
    assert.ok(await panel.locator('a[href*="github.com/"]').count() >= 1);
    assert.equal(await panel.getByRole('link', {name:/Enter this world/}).count(), 1);
  }
  await page.getByRole('tab').last().press('ArrowRight');
  assert.equal(await page.getByRole('tab').first().getAttribute('aria-selected'), 'true');
  await page.getByRole('tab').first().press('End');
  assert.equal(await page.getByRole('tab').last().getAttribute('aria-selected'), 'true');
  await page.getByRole('tab').last().press('Home');
  await page.locator('.captain-memory summary').click();
  assert.equal(await page.locator('.captain-memory').getAttribute('open'), '');
  await page.locator('.captain-memory summary').click();
  for (const theme of ['dark','light']) {
    if (theme === 'light') await page.locator('.day-toggle').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
    for (const layout of ['cards','list']) {
      await page.locator(`[data-layout="${layout}"]`).click();
      assert.equal(await page.locator(`[data-layout="${layout}"]`).getAttribute('aria-pressed'), 'true');
      for (const width of [320,375,390,650,768,1024,1440,2560]) {
        await page.setViewportSize({width,height:width===650?375:900});
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${theme} ${layout} overflow at ${width}`);
      }
      await audit(page, `${theme} theme, ${layout} layout`);
    }
  }
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('.project-grid').evaluate(el=>el.classList.contains('manifest')),true);
  await page.locator('[data-layout="cards"]').click();
  await page.locator('.day-toggle').click();
  await page.setViewportSize({width:390,height:844});
  await page.locator('.menu-toggle').click();
  assert.equal(await page.locator('.main-nav').isVisible(), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');
  assert.equal(await page.locator('.main-nav').isVisible(), false);
  await page.locator('.menu-toggle').click();
  await page.locator('.main-nav a[href$="#about"]').click();
  assert.equal(await page.locator('.main-nav').isVisible(), false);
  await audit(page, 'Mobile home');

  for (const project of projects) {
    const response = await page.goto(base+'/projects/'+project.id+'/', {waitUntil:'domcontentloaded'});
    assert.equal(response.status(),200,project.id);
    assert.equal(await page.locator('h1').innerText(),project.title);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),false,project.id+' mobile overflow');
    await page.setViewportSize({width:320,height:740});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),false,project.id+' narrow mobile overflow');
    await page.setViewportSize({width:390,height:844});
  }
  await page.goto(base+'/projects/som-bi/', {waitUntil:'networkidle'});
  await audit(page,'SOM BI case study');
  assert.equal(await page.locator('a[href*="som.mlbb"]').count(),0);
  await page.goto(base+'/resume/',{waitUntil:'networkidle'});
  assert.equal(await page.locator('#print-resume').isVisible(),true);
  await audit(page,'Résumé');
  await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).color),'rgb(0, 0, 0)');
  assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)');
  await page.emulateMedia({media:'screen'});

  const noJS = await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
  await noJS.goto(base,{waitUntil:'networkidle'});
  assert.equal(await noJS.locator('.project-card:visible').count(),25);
  assert.equal(await noJS.locator('.main-nav').isVisible(),true);
  assert.equal(await noJS.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),false);
  const reduce = await browser.newPage({reducedMotion:'reduce'});
  await reduce.goto(base,{waitUntil:'networkidle'});
  assert.equal(await reduce.locator('html').evaluate(el => el.classList.contains('motion-paused')),true);
  assert.equal(await reduce.locator('.hero-ship').evaluate(el=>getComputedStyle(el).animationName),'none');
  assert.deepEqual(errors,[]);
  if (accessibility.length) console.log(JSON.stringify(accessibility,null,2));
  console.log('PASS: filters, search, URL state, keyboard controls, mobile menu, theme/motion/Gear 5/layout persistence, six showcase tabs and source links, 25 case routes, eight widths in both themes/layouts, no-JS fallback, and reduced motion.');
  await browser.close();
  if(accessibility.some(x=>x.violations.length)) process.exitCode=1;
})().catch(error=>{console.error(error);process.exit(1);});
