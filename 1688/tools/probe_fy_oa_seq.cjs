const { chromium } = require('playwright');
const fs = require('fs');
const ch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const QZ = 'function Qz(OA,P,EL,Kt,M,v,Z){';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true,
    ignoreDefaultArgs: ['--enable-automation'], args: ['--disable-blink-features=AutomationControlled'] });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 780 } });
  await ctx.addCookies(ch.cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path })));
  const page = await ctx.newPage();
  await page.addInitScript(() => { window.__oa = []; });
  await page.route('**/*.js', async route => {
    try {
      const resp = await route.fetch(); let body = await resp.text();
      if (body.includes(QZ)) body = body.split(QZ).join(QZ + 'if(window.__oa.length<60)window.__oa.push(OA);');
      await route.fulfill({ response: resp, body, headers: { ...resp.headers(), 'content-type': 'application/javascript' } });
    } catch (e) { await route.continue().catch(()=>{}); }
  });
  await page.route(u => /\/(slide|newslidevalidate)(\/|\?|$)/.test(u.pathname + u.search), r => r.abort().catch(()=>{}));
  await page.goto(ch.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('.btn_slide'), { timeout: 30000 });
  await page.waitForTimeout(1000);
  const oa = await page.evaluate(() => window.__oa.slice(0, 40));
  console.log("browser OA seq:", oa.join(","));
  const cfg = await page.evaluate(() => window._config_ ? { NCTOKENSTR: window._config_.NCTOKENSTR, NCAPPKEY: window._config_.NCAPPKEY, SECDATA: window._config_.SECDATA } : null);
  fs.writeFileSync('/tmp/ppprobe/oa_cfg.json', JSON.stringify(cfg));
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 200)); process.exit(1); });
