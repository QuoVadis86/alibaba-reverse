const { chromium } = require('playwright');
const fs = require('fs');
const ch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const NEEDLE = 'for(d[38]=QO,d[m]=b;d[m]!==U;){var Kz=d[m]&o,yn=d[m]>>5,O=yn&o;switch(Kz){';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true,
    ignoreDefaultArgs: ['--enable-automation'], args: ['--disable-blink-features=AutomationControlled'] });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 780 } });
  await ctx.addCookies(ch.cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path })));
  const page = await ctx.newPage();
  await page.addInitScript(() => { window.__mr = []; });
  let patched = 0;
  await page.route('**/*.js', async route => {
    try {
      const resp = await route.fetch(); let body = await resp.text();
      if (body.includes(NEEDLE)) {
        body = body.split(NEEDLE).join('for(d[38]=QO,d[m]=b;d[m]!==U;){var Kz=d[m]&o,yn=d[m]>>5,O=yn&o;if(window.__mr.length<300)window.__mr.push(d[m]);switch(Kz){');
        patched += 1;
      }
      await route.fulfill({ response: resp, body, headers: { ...resp.headers(), 'content-type': 'application/javascript' } });
    } catch (e) { await route.continue().catch(()=>{}); }
  });
  await page.route(u => /\/(slide|newslidevalidate)(\/|\?|$)/.test(u.pathname + u.search), r => r.abort().catch(()=>{}));
  await page.goto(ch.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('.btn_slide'), { timeout: 30000 });
  await page.waitForTimeout(1200);
  const pcs = await page.evaluate(() => window.__mr.slice(0, 60));
  console.log("patched", patched, "mr steps", pcs.length);
  console.log(pcs.join(","));
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 200)); process.exit(1); });
