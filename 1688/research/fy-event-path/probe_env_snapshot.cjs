// 在浏览器里用与 runtime 相同的 environment_snapshot.js 采集环境快照。
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3] || '/tmp/ppprobe/env_snapshot_browser.json';
const SNAP = fs.readFileSync(path.resolve(__dirname, '../../tools/probes/environment_snapshot.js'), 'utf8');
const QZ = 'function Qz(OA,P,EL,Kt,M,v,Z){';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true,
    ignoreDefaultArgs: ['--enable-automation'], args: ['--disable-blink-features=AutomationControlled'] });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 780 } });
  await ctx.addCookies(ch.cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path })));
  const page = await ctx.newPage();
  await page.addInitScript((snapSource) => {
    window.__nonceEnvironmentProbe = true;
    try { eval(snapSource); } catch (e) { window.__snapErr = String(e).slice(0, 200); }
  }, SNAP);
  await page.route('**/*.js', async route => {
    try {
      const resp = await route.fetch(); let body = await resp.text();
      if (body.includes(QZ)) body = 'try{window.__snapAtStart=window.__snapshotEnvironment&&window.__snapshotEnvironment();}catch(e){}\n' + body;
      await route.fulfill({ response: resp, body, headers: { ...resp.headers(), 'content-type': 'application/javascript' } });
    } catch (e) { await route.continue().catch(()=>{}); }
  });
  await page.route(u => /\/(slide|newslidevalidate)(\/|\?|$)/.test(u.pathname + u.search), r => r.abort().catch(()=>{}));
  await page.goto(ch.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('.btn_slide'), { timeout: 30000 });
  await page.waitForTimeout(900);
  const info = await page.evaluate(() => ({
    err: window.__snapErr || null,
    start: window.__snapAtStart || null,
    now: window.__snapshotEnvironment ? window.__snapshotEnvironment() : null,
  }));
  fs.writeFileSync(out, JSON.stringify(info, null, 1));
  console.log("err:", info.err, "| start keys:", info.start ? Object.keys(info.start).length : 0, "| now keys:", info.now ? Object.keys(info.now).length : 0);
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 300)); process.exit(1); });
