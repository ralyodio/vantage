/* Screenshot driver: captures every page + key interaction states. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '../screenshots');
fs.mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:3000';
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844, deviceScaleFactor: 2 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(ctx, page, name) {
  await sleep(800); // let animations settle
  await page.screenshot({ path: path.join(OUT, name), fullPage: !!ctx.fullPage });
  console.log('  ✓', name);
}

async function run() {
  const browser = await chromium.launch();

  for (const vp of [
    { label: 'desktop', cfg: DESKTOP },
    { label: 'mobile', cfg: MOBILE },
  ]) {
    const ctx = await browser.newContext({ viewport: vp.cfg });
    const page = await ctx.newPage();
    console.log(`\n== ${vp.label} ==`);

    // 1. Home
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await shot(ctx, page, `home-${vp.label}.png`);

    // 2. Profile (full page)
    await page.goto(`${BASE}/profile/aebu`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1', { timeout: 30000 });
    await sleep(2500); // framer-motion sections
    await shot({ ...ctx, fullPage: true }, page, `profile-${vp.label}.png`);

    // 3. First viewport of profile (hero + KPIs)
    await shot(ctx, page, `profile-hero-${vp.label}.png`);

    // 4. Expanded match card — click the first match row
    const rows = page.locator('article').filter({ hasText: /:/ });
    if (await rows.count()) {
      const expandable = vp.label === 'desktop' ? rows.first() : rows.first();
      await expandable.click({ timeout: 5000 }).catch(() => {});
      await sleep(1200);
      // scroll expanded card into view
      await expandable.scrollIntoViewIfNeeded().catch(() => {});
      await shot(ctx, page, `match-expanded-${vp.label}.png`);
    }

    // 5. Scoreboard modal — open from the same card
    const boardBtn = page
      .locator('button', { hasText: /scoreboard|board/i })
      .first();
    if (await boardBtn.count()) {
      await boardBtn.scrollIntoViewIfNeeded().catch(() => {});
      await boardBtn.click({ timeout: 5000 }).catch(() => {});
      await sleep(3000); // full-match fetch + avatar enrichment
      await shot(ctx, page, `scoreboard-modal-${vp.label}.png`);
      await page.keyboard.press('Escape');
      await sleep(600);
    }

    // 6. 404
    await page.goto(`${BASE}/this-page-does-not-exist`, { waitUntil: 'networkidle' });
    await shot(ctx, page, `404-${vp.label}.png`);

    await ctx.close();
  }

  await browser.close();
  console.log('\nDone →', OUT);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
