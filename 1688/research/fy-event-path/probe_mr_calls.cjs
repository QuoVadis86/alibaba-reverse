// 采集浏览器里 mr 的调用次数与 xF 序列。
const { chromium } = require('playwright');
const fs = require('fs');
const ch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const NEEDLE = 'C[4]=function mr(xF,QO,z,FL,eo){var d=[];';
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
        body = body.split(NEEDLE).join('C[4]=function mr(xF,QO,z,FL,eo){window.__mr.push(xF);var d=[];');
        patched += 1;
      }
      await route.fulfill({ response: resp, body, headers: { ...resp.headers(), 'content-type': 'application/javascript' } });
    } catch (e) { await route.continue().catch(()=>{}); }
  });
  await page.route(u => /\/(slide|newslidevalidate)(\/|\?|$)/.test(u.pathname + u.search), r => r.abort().catch(()=>{}));
  await page.goto(ch.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('.btn_slide'), { timeout: 30000 });
  await page.waitForTimeout(600);
  const g = await page.evaluate(() => { const b=document.querySelector('.btn_slide').getBoundingClientRect(); return {sx:b.x+b.width/2, sy:b.y+b.height/2}; });
  await page.evaluate(() => { window.__mr = []; });
  const cdp = await ctx.newCDPSession(page);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await cdp.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:g.sx, y:g.sy, buttons:0 });
  await sleep(40);
  await cdp.send('Input.dispatchMouseEvent', { type:'mousePressed', x:g.sx, y:g.sy, button:'left', clickCount:1, buttons:1 });
  for (let i=1;i<=20;i++){ await sleep(16); await cdp.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:g.sx+12*i, y:g.sy, button:'left', buttons:1 }); }
  await page.waitForTimeout(800);
  const calls = await page.evaluate(() => window.__mr);
  const dist = {};
  for (const c of calls) dist[c] = (dist[c]||0)+1;
  console.log("patched", patched, "mr calls:", calls.length, JSON.stringify(dist));
  console.log("first 20 xF:", calls.slice(0,20).join(","));
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 200)); process.exit(1); });
