// 采集浏览器里 FY 监听器实际收到的 MouseEvent 形状（自有属性 + 关键字段）。
// 用法：NODE_PATH=$(npm root -g) node probe_event_shape.cjs <challenge.json> [out.json]
const { chromium } = require('playwright');
const fs = require('fs');

const ch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3] || '/tmp/ppprobe/event_shape.json';

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
    window.__shape = [];
    const orig = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, fn, opts) {
      if (typeof fn !== 'function') return orig.call(this, type, fn, opts);
      const wrapped = function (event) {
        try {
          if (window.__shape.length < 200 && /mouse|touch|focus|pointer/.test(String(type))) {
            const proto = Object.getPrototypeOf(event);
            window.__shape.push({
              listenerType: String(type),
              eventType: event.type,
              ctor: event.constructor && event.constructor.name,
              protoTag: Object.prototype.toString.call(event),
              own: Object.getOwnPropertyNames(event).slice(0, 24),
              isTrusted: event.isTrusted,
              clientX: event.clientX, clientY: event.clientY,
              pageX: event.pageX, pageY: event.pageY,
              offsetX: event.offsetX, offsetY: event.offsetY,
              timeStamp: event.timeStamp,
              targetTag: event.target && event.target.tagName,
              targetId: event.target && event.target.id,
              targetClass: event.target && event.target.className,
              protoOwn: proto ? Object.getOwnPropertyNames(proto).slice(0, 40) : null,
            });
          }
        } catch (e) {}
        return fn.call(this, event);
      };
      return orig.call(this, type, wrapped, opts);
    };
  });

  await page.route(u => /\/(slide|newslidevalidate)(\/|\?|$)/.test(u.pathname + u.search),
    r => r.abort().catch(() => {}));
  await page.goto(ch.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('.btn_slide'), { timeout: 30000 });
  await page.waitForTimeout(800);
  const g = await page.evaluate(() => {
    const b = document.querySelector('.btn_slide').getBoundingClientRect();
    return { sx: b.x + b.width / 2, sy: b.y + b.height / 2 };
  });
  await page.evaluate(() => { window.__shape = []; });
  const cdp = await ctx.newCDPSession(page);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: g.sx, y: g.sy, buttons: 0 });
  await sleep(40);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: g.sx, y: g.sy, button: 'left', clickCount: 1, buttons: 1 });
  for (let i = 1; i <= 10; i++) {
    await sleep(16);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: g.sx + 12 * i, y: g.sy, button: 'left', buttons: 1 });
  }
  await page.waitForTimeout(600);

  const shape = await page.evaluate(() => window.__shape);
  fs.writeFileSync(out, JSON.stringify(shape, null, 1));
  console.log('captured:', shape.length);
  const seen = new Set();
  for (const s of shape) {
    const key = `${s.listenerType}|${s.eventType}`;
    if (seen.has(key)) continue;
    seen.add(key);
    console.log(JSON.stringify(s).slice(0, 500));
  }
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 300)); process.exit(1); });
