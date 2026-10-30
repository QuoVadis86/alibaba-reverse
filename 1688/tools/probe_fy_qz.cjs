const { chromium } = require('playwright');
const fs = require('fs');
const ch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3] || '/tmp/ppprobe/fy_qz.json';
const QZ = 'function Qz(OA,P,EL,Kt,M,v,Z){';
const QZ_PATCH = QZ + `(function(){if(!window.__qz)window.__qz=[];if(window.__qz.length<12){const d=(o,k)=>{try{return o&&o[k]}catch(e){return 'ERR'}};window.__qz.push({oa:OA,pType:d(P,'type'),pX:d(P,'clientX'),pY:d(P,'clientY'),pOffX:d(P,'offsetX'),pOffY:d(P,'offsetY'),pTs:d(P,'timeStamp'),pTrust:d(P,'isTrusted'),pTargetTag:P&&P.target&&P.target.tagName,pTargetId:P&&P.target&&P.target.id,pTargetClass:P&&P.target&&P.target.className,elTag:EL&&EL.tagName,elId:EL&&EL.id,elClass:EL&&EL.className,elType:Object.prototype.toString.call(EL),ktType:Object.prototype.toString.call(Kt),mType:Object.prototype.toString.call(M),vType:typeof v,zType:typeof Z});}})();`;
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
      if (body.includes(QZ)) { body = body.split(QZ).join(QZ_PATCH); patched += 1; }
      await route.fulfill({ response: resp, body, headers: { ...resp.headers(), 'content-type': 'application/javascript' } });
    } catch (e) { await route.continue().catch(()=>{}); }
  });
  await page.route(u => /\/(slide|newslidevalidate)(\/|\?|$)/.test(u.pathname + u.search), r => r.abort().catch(()=>{}));
  await page.goto(ch.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('.btn_slide'), { timeout: 30000 });
  await page.waitForTimeout(500);
  const g = await page.evaluate(() => {
    const b = document.querySelector('.btn_slide').getBoundingClientRect();
    return { sx: b.x + b.width/2, sy: b.y + b.height/2, rect: { x:b.x, y:b.y, left:b.left, top:b.top, right:b.right, bottom:b.bottom, width:b.width, height:b.height } };
  });
  const cdp = await ctx.newCDPSession(page);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await cdp.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:g.sx, y:g.sy, buttons:0 });
  await sleep(40);
  await cdp.send('Input.dispatchMouseEvent', { type:'mousePressed', x:g.sx, y:g.sy, button:'left', clickCount:1, buttons:1 });
  for (let i=1;i<=20;i++){ await sleep(16); await cdp.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:g.sx+12*i, y:g.sy, button:'left', buttons:1 }); }
  await page.waitForTimeout(1500);
  const qz = await page.evaluate(() => window.__qz || []);
  fs.writeFileSync(out, JSON.stringify({ patched, rect: g.rect, qz }, null, 1));
  console.log("patched", patched, "qz", qz.length);
  for (const q of qz.slice(0, 6)) console.log(JSON.stringify(q));
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 300)); process.exit(1); });
