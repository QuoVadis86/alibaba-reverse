const { chromium } = require('playwright');
const fs = require('fs');
const ch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3] || '/tmp/ppprobe/fy_pc.json';
const NEEDLE = 'for(d[x]=EL,d[i]=Kt,d[$]=a;d[$]!==U;){var JY=d[$]&o,wZ,O=d[$]>>5&o;';
const PATCH = NEEDLE + 'if(window.__pcs&&window.__pcs.length<800)window.__pcs.push(d[$]);';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true,
    ignoreDefaultArgs: ['--enable-automation'], args: ['--disable-blink-features=AutomationControlled'] });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 780 } });
  await ctx.addCookies(ch.cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path })));
  const page = await ctx.newPage();
  let patched = 0;
  await page.addInitScript(() => { window.__pcs = []; });
  await page.route('**/*.js', async route => {
    try {
      const resp = await route.fetch();
      let body = await resp.text();
      if (body.includes(NEEDLE)) { body = body.split(NEEDLE).join(PATCH); patched += 1; }
      await route.fulfill({ response: resp, body, headers: { ...resp.headers(), 'content-type': 'application/javascript' } });
    } catch (e) { await route.continue().catch(()=>{}); }
  });
  await page.route(u => /\/(slide|newslidevalidate)(\/|\?|$)/.test(u.pathname + u.search), r => r.abort().catch(()=>{}));
  await page.goto(ch.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('.btn_slide'), { timeout: 30000 });
  await page.waitForTimeout(400);
  await page.evaluate(() => { window.__pcs = []; });
  const g = await page.evaluate(() => {
    const b = document.querySelector('.btn_slide').getBoundingClientRect();
    return { sx: b.x + b.width/2, sy: b.y + b.height/2 };
  });
  const cdp = await ctx.newCDPSession(page);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await cdp.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:g.sx, y:g.sy, buttons:0 });
  await sleep(40);
  await cdp.send('Input.dispatchMouseEvent', { type:'mousePressed', x:g.sx, y:g.sy, button:'left', clickCount:1, buttons:1 });
  await page.waitForTimeout(400);
  const pcs = await page.evaluate(() => window.__pcs.slice(0, 200));
  fs.writeFileSync(out, JSON.stringify({ patched, pcs }, null, 1));
  console.log("patched", patched, "pcs", pcs.length);
  console.log(pcs.slice(0, 60).join(","));
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 300)); process.exit(1); });
