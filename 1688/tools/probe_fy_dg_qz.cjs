const { chromium } = require('playwright');
const fs = require('fs');
const ch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const QZ = 'function Qz(OA,P,EL,Kt,M,v,Z){';
const DG = 'function DG(zU,dC,eM,Kt,wZ,Hj){';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true,
    ignoreDefaultArgs: ['--enable-automation'], args: ['--disable-blink-features=AutomationControlled'] });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 780 } });
  await ctx.addCookies(ch.cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path })));
  const page = await ctx.newPage();
  await page.addInitScript(() => { window.__stat = { qz: 0, dg: 0, dgPcs: [] }; });
  await page.route('**/*.js', async route => {
    try {
      const resp = await route.fetch(); let body = await resp.text();
      if (body.includes(QZ)) body = body.split(QZ).join(QZ + 'window.__stat.qz++;');
      if (body.includes(DG)) body = body.split(DG).join(DG + 'window.__stat.dg++;');
      const loop = 'var aE=d[7]&o,dn,O=d[7]>>5&o;switch(aE){';
      if (body.includes(loop)) body = body.split(loop).join('var aE=d[7]&o,dn,O=d[7]>>5&o;if(window.__stat.dgPcs.length<400)window.__stat.dgPcs.push(d[7]);switch(aE){');
      await route.fulfill({ response: resp, body, headers: { ...resp.headers(), 'content-type': 'application/javascript' } });
    } catch (e) { await route.continue().catch(()=>{}); }
  });
  await page.route(u => /\/(slide|newslidevalidate)(\/|\?|$)/.test(u.pathname + u.search), r => r.abort().catch(()=>{}));
  await page.goto(ch.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('.btn_slide'), { timeout: 30000 });
  await page.waitForTimeout(400);
  const g = await page.evaluate(() => { const b=document.querySelector('.btn_slide').getBoundingClientRect(); return {sx:b.x+b.width/2, sy:b.y+b.height/2}; });
  const cdp = await ctx.newCDPSession(page);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await cdp.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:g.sx, y:g.sy, buttons:0 });
  await sleep(40);
  await cdp.send('Input.dispatchMouseEvent', { type:'mousePressed', x:g.sx, y:g.sy, button:'left', clickCount:1, buttons:1 });
  for (let i=1;i<=10;i++){ await sleep(16); await cdp.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:g.sx+10*i, y:g.sy, button:'left', buttons:1 }); }
  await page.waitForTimeout(1200);
  const st = await page.evaluate(() => window.__stat);
  console.log("qz:", st.qz, "dg:", st.dg, "dgPcs:", (st.dgPcs||[]).slice(0,40).join(","));
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 200)); process.exit(1); });
