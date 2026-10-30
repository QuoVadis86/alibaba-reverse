const { chromium } = require('playwright');
const fs = require('fs');
const ch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const NEEDLE = 'd[7]=P?352:293;break;case 19:var mr=0;';
const PATCH = 'window.__p18=(window.__p18||[]).concat([{v:String(P),t:typeof P,dm:typeof d[m]!=="undefined"?String(d[m]):null,d8:Object.prototype.toString.call(d[8]),d5:Object.prototype.toString.call(d[5]),g:typeof C!=="undefined"?String(C[27]):null}]),d[7]=P?352:293;break;case 19:var mr=0;';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true,
    ignoreDefaultArgs: ['--enable-automation'], args: ['--disable-blink-features=AutomationControlled'] });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 780 } });
  await ctx.addCookies(ch.cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path })));
  const page = await ctx.newPage();
  await page.addInitScript(() => { window.__p18 = []; });
  let patched = 0, found = false;
  await page.route('**/*.js', async route => {
    try {
      const resp = await route.fetch(); let body = await resp.text();
      if (body.includes(NEEDLE)) { body = body.split(NEEDLE).join(PATCH); patched += 1; found = true; }
      await route.fulfill({ response: resp, body, headers: { ...resp.headers(), 'content-type': 'application/javascript' } });
    } catch (e) { await route.continue().catch(()=>{}); }
  });
  await page.route(u => /\/(slide|newslidevalidate)(\/|\?|$)/.test(u.pathname + u.search), r => r.abort().catch(()=>{}));
  await page.goto(ch.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('.btn_slide'), { timeout: 30000 });
  await page.waitForTimeout(1000);
  const info = await page.evaluate(() => window.__p18 || []);
  console.log("patched", patched, "hits", info.length);
  console.log(JSON.stringify(info.slice(0, 4)));
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 200)); process.exit(1); });
