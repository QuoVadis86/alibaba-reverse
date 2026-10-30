// 导出 FY 的 C[9] 字符串表全量（用于离线解析命令码）。
const { chromium } = require('playwright');
const fs = require('fs');
const ch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const NEEDLE = 'd[c]=d[K][yj],d[m]=d[c]?720:750';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true,
    ignoreDefaultArgs: ['--enable-automation'], args: ['--disable-blink-features=AutomationControlled'] });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 780 } });
  await ctx.addCookies(ch.cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path })));
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__c9full = null;
    window.__c9dump = (t) => {
      try {
        if (!t) return;
        const n = Object.keys(t).length;
        if (window.__c9full && window.__c9full.n >= n) return;
        const snap = {};
        for (const k in t) { try { snap[k] = JSON.stringify(t[k]); } catch (e) {} }
        window.__c9full = { n, snap };
      } catch (e) {}
    };
  });
  let patched = 0;
  await page.route('**/*.js', async route => {
    try {
      const resp = await route.fetch(); let body = await resp.text();
      if (body.includes(NEEDLE)) {
        body = body.split(NEEDLE).join('window.__c9dump(C[9]),' + NEEDLE);
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
  const cdp = await ctx.newCDPSession(page);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await cdp.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:g.sx, y:g.sy, buttons:0 });
  await sleep(40);
  await cdp.send('Input.dispatchMouseEvent', { type:'mousePressed', x:g.sx, y:g.sy, button:'left', clickCount:1, buttons:1 });
  for (let i=1;i<=20;i++){ await sleep(16); await cdp.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:g.sx+12*i, y:g.sy, button:'left', buttons:1 }); }
  await page.waitForTimeout(900);
  const full = await page.evaluate(() => window.__c9full);
  fs.writeFileSync('/tmp/ppprobe/c9_full.json', JSON.stringify(full));
  console.log("patched", patched, "entries:", full && full.n);
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 200)); process.exit(1); });
