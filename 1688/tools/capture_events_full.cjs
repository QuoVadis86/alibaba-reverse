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
    window.__ev = [];
    const types = ['mousedown','mousemove','mouseup','pointerdown','pointermove','pointerup',
                   'touchstart','touchmove','touchend','focus','focusin','blur','deviceorientation',
                   'devicemotion','visibilitychange','keydown','keyup','scroll','resize'];
    for (const t of types) {
      document.addEventListener(t, (e) => {
        if (window.__ev.length > 2000) return;
        window.__ev.push({ type: t, x: e.clientX ?? null, y: e.clientY ?? null,
          pageX: e.pageX ?? null, pageY: e.pageY ?? null, ts: e.timeStamp,
          trust: e.isTrusted, target: e.target && e.target.tagName,
          id: e.target && e.target.id, cls: e.target && e.target.className });
      }, true);
    }
  });
  await page.route(u => /\/(slide|newslidevalidate)(\/|\?|$)/.test(u.pathname + u.search), r => r.abort().catch(()=>{}));
  await page.goto(ch.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('.btn_slide'), { timeout: 30000 });
  await page.waitForTimeout(400);
  const g = await page.evaluate(() => { const b=document.querySelector('.btn_slide').getBoundingClientRect(); return {sx:b.x+b.width/2, sy:b.y+b.height/2, rect:{x:b.x,y:b.y,left:b.left,top:b.top,right:b.right,bottom:b.bottom,width:b.width,height:b.height}}; });
  await page.evaluate(() => { window.__ev = []; });
  const cdp = await ctx.newCDPSession(page);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await cdp.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:g.sx, y:g.sy, buttons:0 });
  await sleep(40);
  await cdp.send('Input.dispatchMouseEvent', { type:'mousePressed', x:g.sx, y:g.sy, button:'left', clickCount:1, buttons:1 });
  for (let i=1;i<=20;i++){ await sleep(16); await cdp.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:g.sx+12*i, y:g.sy, button:'left', buttons:1 }); }
  await page.waitForTimeout(800);
  const ev = await page.evaluate(() => window.__ev);
  fs.writeFileSync('/tmp/ppprobe/events_full.json', JSON.stringify({ rect: g.rect, events: ev }, null, 1));
  console.log("events:", ev.length);
  const byType = {};
  for (const e of ev) byType[e.type] = (byType[e.type]||0)+1;
  console.log(JSON.stringify(byType));
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 200)); process.exit(1); });
