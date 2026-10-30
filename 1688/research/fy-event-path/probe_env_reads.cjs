// 记录 FY 运行期间对浏览器环境的所有属性读取（路径 -> 最后读到的值）。
const { chromium } = require('playwright');
const fs = require('fs');
const ch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3] || '/tmp/ppprobe/env_reads_browser.json';
const QZ = 'function Qz(OA,P,EL,Kt,M,v,Z){';

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
    window.__reads = {};
    window.__rec = false;
    const ser = (v) => {
      try {
        if (v === null || v === undefined) return String(v);
        if (typeof v === 'number' || typeof v === 'boolean') return v;
        if (typeof v === 'string') return v.length > 120 ? v.slice(0, 120) + '…' : v;
        if (typeof v === 'function') return `[fn ${v.name}/${v.length}]`;
        if (Array.isArray(v)) return `[array ${v.length}]`;
        return Object.prototype.toString.call(v);
      } catch (e) { return 'ERR'; }
    };
    const record = (path, value) => {
      if (!window.__rec) return;
      if (Object.keys(window.__reads).length > 4000) return;
      window.__reads[path] = ser(value);
    };
    const wrapProto = (label, proto) => {
      if (!proto) return;
      for (const key of Object.getOwnPropertyNames(proto)) {
        const desc = Object.getOwnPropertyDescriptor(proto, key);
        if (!desc || !desc.get) continue;
        try {
          Object.defineProperty(proto, key, {
            configurable: true, enumerable: desc.enumerable,
            get() { const v = desc.get.call(this); record(`${label}.${key}`, v); return v; },
            set: desc.set,
          });
        } catch (e) {}
      }
    };
    wrapProto('navigator', Navigator.prototype);
    wrapProto('screen', Screen.prototype);
    wrapProto('document', Document.prototype);
    wrapProto('performance', Performance.prototype);
    for (const key of ['innerWidth', 'innerHeight', 'outerWidth', 'outerHeight', 'devicePixelRatio',
                       'screenX', 'screenY', 'scrollX', 'scrollY', 'location', 'name', 'length',
                       'localStorage', 'sessionStorage', 'crypto', 'history']) {
      try {
        const desc = Object.getOwnPropertyDescriptor(window, key);
        if (desc && desc.get) {
          Object.defineProperty(window, key, {
            configurable: true, enumerable: desc.enumerable,
            get() { const v = desc.get.call(this); record(`window.${key}`, v); return v; },
            set: desc.set,
          });
        } else if (!desc) {
          const v = window[key];
          Object.defineProperty(window, key, {
            configurable: true, enumerable: true,
            get() { record(`window.${key}`, v); return v; },
          });
        }
      } catch (e) {}
    }
  });

  await page.route('**/*.js', async route => {
    try {
      const resp = await route.fetch();
      let body = await resp.text();
      if (body.includes(QZ)) body = 'window.__rec=true;' + body;
      await route.fulfill({ response: resp, body, headers: { ...resp.headers(), 'content-type': 'application/javascript' } });
    } catch (e) { await route.continue().catch(() => {}); }
  });
  await page.route(u => /\/(slide|newslidevalidate)(\/|\?|$)/.test(u.pathname + u.search), r => r.abort().catch(() => {}));
  await page.goto(ch.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('.btn_slide'), { timeout: 30000 });
  await page.waitForTimeout(600);

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
  await page.waitForTimeout(900);
  await page.evaluate(() => { window.__rec = false; });

  const reads = await page.evaluate(() => window.__reads);
  fs.writeFileSync(out, JSON.stringify({ count: Object.keys(reads).length, reads }, null, 1));
  console.log('paths:', Object.keys(reads).length);
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 300)); process.exit(1); });
