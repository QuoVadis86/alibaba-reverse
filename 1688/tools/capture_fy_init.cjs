const { chromium } = require('playwright');
const fs = require('fs');
const ch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3] || '/tmp/ppprobe/fy_init.json';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true,
    ignoreDefaultArgs: ['--enable-automation'], args: ['--disable-blink-features=AutomationControlled'] });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 780 } });
  await ctx.addCookies(ch.cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path })));
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__initCalls = [];
    let mod = null;
    const wrap = (obj) => {
      if (!obj || obj.__wrappedInit) return obj;
      try {
        const orig = obj.init;
        if (typeof orig === 'function') {
          obj.init = function (...args) {
            try {
              const a0 = args[0];
              window.__initCalls.push({
                argCount: args.length,
                opts: a0 && typeof a0 === 'object' ? JSON.parse(JSON.stringify(a0)) : String(a0),
                arg1: typeof args[1],
              });
            } catch (e) { window.__initCalls.push({ err: String(e).slice(0, 120) }); }
            return orig.apply(this, args);
          };
          obj.__wrappedInit = true;
        }
      } catch (e) { window.__initCalls.push({ wrapErr: String(e).slice(0, 120) }); }
      return obj;
    };
    for (const name of ['__fyModule', 'FYModule', 'AWSCFY']) {
      let v = window[name];
      Object.defineProperty(window, name, {
        configurable: true,
        get() { return v; },
        set(nv) { v = wrap(nv); },
      });
      if (v) wrap(v);
    }
  });
  await page.route(u => /\/(slide|newslidevalidate)(\/|\?|$)/.test(u.pathname + u.search), r => r.abort().catch(()=>{}));
  await page.goto(ch.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('.btn_slide'), { timeout: 30000 });
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => ({ calls: window.__initCalls, fyType: typeof window.__fyModule }));
  fs.writeFileSync(out, JSON.stringify(info, null, 1));
  console.log("fyType:", info.fyType, "initCalls:", (info.calls || []).length);
  for (const c of (info.calls || []).slice(0, 3)) console.log(JSON.stringify(c).slice(0, 600));
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 300)); process.exit(1); });
