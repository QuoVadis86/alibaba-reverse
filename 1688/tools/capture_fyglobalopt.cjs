const { chromium } = require('playwright');
const fs = require('fs');
const ch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true,
    ignoreDefaultArgs: ['--enable-automation'], args: ['--disable-blink-features=AutomationControlled'] });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 780 } });
  await ctx.addCookies(ch.cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path })));
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__optTrace = [];
    let v;
    Object.defineProperty(window, 'fyglobalopt', {
      configurable: true,
      get() { return v; },
      set(nv) { v = nv; try { window.__optTrace.push({ set: JSON.parse(JSON.stringify(nv)) }); } catch (e) { window.__optTrace.push({ set: String(nv) }); } },
    });
  });
  await page.route(u => /\/(slide|newslidevalidate)(\/|\?|$)/.test(u.pathname + u.search), r => r.abort().catch(()=>{}));
  await page.goto(ch.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('.btn_slide'), { timeout: 30000 });
  await page.waitForTimeout(1200);
  const info = await page.evaluate(() => ({ trace: window.__optTrace, final: (() => { try { return JSON.parse(JSON.stringify(window.fyglobalopt)); } catch (e) { return String(window.fyglobalopt); } })() }));
  console.log(JSON.stringify(info, null, 1).slice(0, 1500));
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 300)); process.exit(1); });
