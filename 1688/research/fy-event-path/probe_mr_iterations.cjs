// 统计浏览器里 mr 的 VM 循环迭代次数（每个 pc 一行）。
const { chromium } = require('playwright');
const fs = require('fs');
const ch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const NEEDLE = 'for(d[38]=QO,d[m]=b;d[m]!==U;){var Kz=d[m]&o,yn=d[m]>>5,O=yn&o;';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true,
    ignoreDefaultArgs: ['--enable-automation'], args: ['--disable-blink-features=AutomationControlled'] });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 780 } });
  await ctx.addCookies(ch.cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path })));
  const page = await ctx.newPage();
  await page.addInitScript(() => { window.__mrIter = []; });
  let patched = 0;
  await page.route('**/*.js', async route => {
    try {
      const resp = await route.fetch(); let body = await resp.text();
      if (body.includes(NEEDLE)) {
        body = body.split(NEEDLE).join(NEEDLE + 'if(window.__mrIter.length<5000)window.__mrIter.push(d[m]);');
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
  await page.evaluate(() => { window.__mrIter = []; });
  const cdp = await ctx.newCDPSession(page);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await cdp.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:g.sx, y:g.sy, buttons:0 });
  await sleep(40);
  await cdp.send('Input.dispatchMouseEvent', { type:'mousePressed', x:g.sx, y:g.sy, button:'left', clickCount:1, buttons:1 });
  for (let i=1;i<=20;i++){ await sleep(16); await cdp.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:g.sx+12*i, y:g.sy, button:'left', buttons:1 }); }
  await page.waitForTimeout(800);
  const it = await page.evaluate(() => window.__mrIter);
  fs.writeFileSync('/tmp/ppprobe/mr_iter_browser.json', JSON.stringify(it));
  console.log("patched", patched, "mr iterations:", it.length);
  console.log("first 40 pcs:", it.slice(0,40).join(","));
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 200)); process.exit(1); });
