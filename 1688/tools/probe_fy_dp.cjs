const { chromium } = require('playwright');
const fs = require('fs');
const ch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3] || '/tmp/ppprobe/fy_dp.json';
const TARGET = 'd[I]=d[p][C[S]],d[g]=d[I]<0,d[$]=d[g]?263:593';
const PATCH = 'd[I]=(function(){try{if(!window.__dp)window.__dp=[];if(window.__dp.length<20)window.__dp.push({p:String(p),dpType:typeof d[p],dpKeys:d[p]&&typeof d[p]==="object"?Object.keys(d[p]).slice(0,20):null,key:C[S],keyType:typeof C[S],dKeys:Object.keys(d).length,oa:typeof OA!=="undefined"?OA:null,pc:typeof d[$]!=="undefined"?d[$]:null});}catch(e){window.__dpErr=String(e).slice(0,200);}return d[p]?d[p][C[S]]:undefined})(),d[g]=d[I]<0,d[$]=d[g]?263:593';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true,
    ignoreDefaultArgs: ['--enable-automation'], args: ['--disable-blink-features=AutomationControlled'] });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 780 } });
  await ctx.addCookies(ch.cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path })));
  const page = await ctx.newPage();
  let patched = 0;
  await page.route('**/*.js', async route => {
    try {
      const resp = await route.fetch();
      let body = await resp.text();
      if (body.includes(TARGET)) { body = body.split(TARGET).join(PATCH); patched += 1; }
      await route.fulfill({ response: resp, body, headers: { ...resp.headers(), 'content-type': 'application/javascript' } });
    } catch (e) { await route.continue().catch(()=>{}); }
  });
  await page.route(u => /\/(slide|newslidevalidate)(\/|\?|$)/.test(u.pathname + u.search), r => r.abort().catch(()=>{}));
  await page.goto(ch.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('.btn_slide'), { timeout: 30000 });
  await page.waitForTimeout(500);
  const g = await page.evaluate(() => {
    const b = document.querySelector('.btn_slide').getBoundingClientRect();
    return { sx: b.x + b.width/2, sy: b.y + b.height/2 };
  });
  const cdp = await ctx.newCDPSession(page);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await cdp.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:g.sx, y:g.sy, buttons:0 });
  await sleep(40);
  await cdp.send('Input.dispatchMouseEvent', { type:'mousePressed', x:g.sx, y:g.sy, button:'left', clickCount:1, buttons:1 });
  for (let i=1;i<=20;i++){ await sleep(16); await cdp.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:g.sx+12*i, y:g.sy, button:'left', buttons:1 }); }
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => ({ dp: window.__dp || [], err: window.__dpErr || null }));
  fs.writeFileSync(out, JSON.stringify({ patched, info }, null, 1));
  console.log("patched", patched, "hits", info.dp.length, "err", info.err);
  for (const d of info.dp.slice(0, 8)) console.log(JSON.stringify(d));
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 300)); process.exit(1); });
