// 采集浏览器里 FY 注册的监听器：target、type、capture、注册顺序。
// 用法：NODE_PATH=$(npm root -g) node probe_listeners.cjs <challenge.json> [out.json]
const { chromium } = require('playwright');
const fs = require('fs');

const ch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3] || '/tmp/ppprobe/listeners.json';

(async () => {
  const browser = await chromium.launch({
    channel: 'chrome', headless: true,
    ignoreDefaultArgs: ['--enable-automation'],
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 780 } });
  await ctx.addCookies(ch.cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path })));
  const page = await ctx.newPage();

  await page.addInitScript(() => {
    window.__listeners = [];
    const orig = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, fn, opts) {
      try {
        const capture = typeof opts === 'boolean' ? opts : !!(opts && opts.capture);
        const targetKind = this === window ? 'window'
          : this === document ? 'document'
          : (this && this.tagName) ? `element:${this.tagName}${this.id ? '#' + this.id : ''}`
          : Object.prototype.toString.call(this);
        if (window.__listeners.length < 500) {
          window.__listeners.push({ targetKind, type: String(type), capture,
            fnName: fn && fn.name || '', fnLen: fn && fn.length });
        }
      } catch (e) {}
      return orig.call(this, type, fn, opts);
    };
  });

  await page.route(u => /\/(slide|newslidevalidate)(\/|\?|$)/.test(u.pathname + u.search),
    r => r.abort().catch(() => {}));
  await page.goto(ch.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('.btn_slide'), { timeout: 30000 });
  await page.waitForTimeout(1000);

  const before = await page.evaluate(() => window.__listeners.length);
  const g = await page.evaluate(() => {
    const b = document.querySelector('.btn_slide').getBoundingClientRect();
    return { sx: b.x + b.width / 2, sy: b.y + b.height / 2 };
  });
  const cdp = await ctx.newCDPSession(page);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: g.sx, y: g.sy, buttons: 0 });
  await sleep(40);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: g.sx, y: g.sy, button: 'left', clickCount: 1, buttons: 1 });
  for (let i = 1; i <= 20; i++) {
    await sleep(16);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: g.sx + 12 * i, y: g.sy, button: 'left', buttons: 1 });
  }
  await page.waitForTimeout(800);

  const listeners = await page.evaluate(() => window.__listeners);
  fs.writeFileSync(out, JSON.stringify({ before, total: listeners.length, listeners }, null, 1));

  const summary = {};
  for (const l of listeners) {
    const k = `${l.targetKind}|${l.type}|${l.capture ? 'capture' : 'bubble'}`;
    summary[k] = (summary[k] || 0) + 1;
  }
  console.log('total:', listeners.length, '| before drag:', before);
  for (const [k, v] of Object.entries(summary)) console.log(`  ${k} x${v}`);
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 300)); process.exit(1); });
