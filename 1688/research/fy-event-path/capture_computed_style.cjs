const { chromium } = require('playwright');
const fs = require('fs');
const ch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true,
    ignoreDefaultArgs: ['--enable-automation'], args: ['--disable-blink-features=AutomationControlled'] });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 780 } });
  await ctx.addCookies(ch.cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path })));
  const page = await ctx.newPage();
  await page.route(u => /\/(slide|newslidevalidate)(\/|\?|$)/.test(u.pathname + u.search), r => r.abort().catch(()=>{}));
  await page.goto(ch.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('.btn_slide'), { timeout: 30000 });
  await page.waitForTimeout(800);
  const profile = await page.evaluate(() => {
    const body = document.body;
    const style = getComputedStyle(body);
    const allKeys = [];
    const nonEmpty = {};
    const computedProperties = {};
    for (let i = 0; i < style.length; i += 1) {
      const key = style[i];
      allKeys.push(key);
      const value = style.getPropertyValue(key);
      computedProperties[key] = value;
      if (value) nonEmpty[key] = value;
    }
    // 也覆盖所有 camelCase 属性（FY 可能直接读属性）
    for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(style))) {
      if (key === 'constructor') continue;
      try {
        const v = style[key];
        if (typeof v === 'string' && v && !Object.hasOwn(computedProperties, key)) {
          computedProperties[key] = v;
          if (!allKeys.includes(key)) allKeys.push(key);
        }
      } catch (e) {}
    }
    return { allKeys, nonEmpty, computedProperties, count: allKeys.length };
  });
  fs.writeFileSync('/tmp/ppprobe/computed_style.json', JSON.stringify(profile));
  console.log("keys:", profile.count, "nonEmpty:", Object.keys(profile.nonEmpty).length);
  console.log("sample:", JSON.stringify(Object.entries(profile.nonEmpty).slice(0, 8)));
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 200)); process.exit(1); });
