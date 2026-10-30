// 在 FY 脚本开始执行的那一刻，抓取 window 上已有的关键全局对象。
const { chromium } = require('playwright');
const fs = require('fs');
const ch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const QZ = 'function Qz(OA,P,EL,Kt,M,v,Z){';
const PRE = 'try{var __ks=["AWSC","AWSCInner","AWSCFY","etrprtrt","ncLanguage","__awsc_et__","__etModule","etSign","AWSC_SPECIFY_FYMODULE_ADDRESSES","AWSC_SPECIFY_NCMODULE_ADDRESSES","loadAplusJsAFunc","g_aplus_grey_launched"];var __vals={};for(var __i=0;__i<__ks.length;__i++){var __k=__ks[__i];var __v=window[__k];try{__vals[__k]=typeof __v==="object"&&__v?Object.prototype.toString.call(__v)+"|"+JSON.stringify(__v).slice(0,200):String(__v).slice(0,200);}catch(e){__vals[__k]="ERR";}}window.__pre={count:Object.keys(window).length,vals:__vals};}catch(e){}\n';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true,
    ignoreDefaultArgs: ['--enable-automation'], args: ['--disable-blink-features=AutomationControlled'] });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 780 } });
  await ctx.addCookies(ch.cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path })));
  const page = await ctx.newPage();
  await page.addInitScript(() => { window.__pre = null; });
  let patched = 0;
  await page.route('**/*.js', async route => {
    try {
      const resp = await route.fetch(); let body = await resp.text();
      if (body.includes(QZ)) { body = PRE + body; patched += 1; }
      await route.fulfill({ response: resp, body, headers: { ...resp.headers(), 'content-type': 'application/javascript' } });
    } catch (e) { await route.continue().catch(()=>{}); }
  });
  await page.route(u => /\/(slide|newslidevalidate)(\/|\?|$)/.test(u.pathname + u.search), r => r.abort().catch(()=>{}));
  await page.goto(ch.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('.btn_slide'), { timeout: 30000 });
  await page.waitForTimeout(1200);
  const pre = await page.evaluate(() => window.__pre);
  fs.writeFileSync('/tmp/ppprobe/preload_globals.json', JSON.stringify(pre, null, 1));
  console.log("patched", patched, "| window count at FY start:", pre && pre.count);
  console.log("keys:", JSON.stringify(pre && pre.keys));
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 200)); process.exit(1); });
