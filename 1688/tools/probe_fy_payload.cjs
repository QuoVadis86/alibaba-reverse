const { chromium } = require('playwright');
const fs = require('fs');
const ch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3] || '/tmp/ppprobe/fy_ser.json';
const NEEDLE = 'd[p]=W(C[l],null,1,d[i],d[m],d[2],d[4],d[5]),d[i]=d[p]';
const PATCH = 'd[p]=W(C[l],null,1,d[i],d[m],d[2],d[4],d[5]),(globalThis.__fySer=globalThis.__fySer||[]).push({arr:Array.isArray(d[p])?Array.from(d[p]):null,type:Object.prototype.toString.call(d[p]),len:d[p]&&d[p].length}),d[i]=d[p]';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true,
    ignoreDefaultArgs: ['--enable-automation'], args: ['--disable-blink-features=AutomationControlled'] });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 780 } });
  await ctx.addCookies(ch.cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path })));
  const page = await ctx.newPage();
  if (process.env.UA_SUFFIX) {
    await page.addInitScript((suffix) => {
      const orig = Object.getOwnPropertyDescriptor(Navigator.prototype, 'userAgent');
      Object.defineProperty(Navigator.prototype, 'userAgent', {
        configurable: true, get() { return orig.get.call(this) + suffix; },
      });
    }, process.env.UA_SUFFIX);
  }
  let patched = 0, scanned = 0;
  await page.route('**/*.js', async route => {
    try {
      const resp = await route.fetch();
      let body = await resp.text();
      scanned += 1;
      if (body.includes(NEEDLE)) {
        body = body.split(NEEDLE).join(PATCH);
        patched += 1;
        await route.fulfill({ response: resp, body, headers: { ...resp.headers(), 'content-type': 'application/javascript' } });
        return;
      }
      await route.fulfill({ response: resp, body });
    } catch (e) { await route.continue().catch(()=>{}); }
  });
  await page.route(u => /\/(slide|newslidevalidate)(\/|\?|$)/.test(u.pathname + u.search), r => r.abort().catch(()=>{}));
  await page.goto(ch.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('.btn_slide'), { timeout: 30000 });
  await page.waitForTimeout(500);
  const g = await page.evaluate(() => {
    const b = document.querySelector('.btn_slide').getBoundingClientRect();
    const s = document.querySelector('.nc_scale').getBoundingClientRect();
    return { sx: b.x + b.width/2, sy: b.y + b.height/2, travel: Math.max(s.width,1)+16 };
  });
  const cdp = await ctx.newCDPSession(page);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await cdp.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:g.sx, y:g.sy, buttons:0 });
  await sleep(40);
  await cdp.send('Input.dispatchMouseEvent', { type:'mousePressed', x:g.sx, y:g.sy, button:'left', clickCount:1, buttons:1 });
  for (let i=1;i<=60;i++){ await sleep(16); await cdp.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:g.sx+800*i/60, y:g.sy, button:'left', buttons:1 }); }
  await cdp.send('Input.dispatchMouseEvent', { type:'mouseReleased', x:g.sx+800, y:g.sy, button:'left', clickCount:1, buttons:0 });
  await page.waitForTimeout(4000);
  const info = await page.evaluate(() => {
    let tok = null; try { tok = window.__fyModule.getFYToken(); } catch (e) { tok = 'ERR'; }
    let cfg = null; try { cfg = window._config_ ? { NCTOKENSTR: window._config_.NCTOKENSTR, NCAPPKEY: window._config_.NCAPPKEY, SECDATA: window._config_.SECDATA, HOST: window._config_.HOST, PATH: window._config_.PATH } : null; } catch (e) {}
    const ser = window.__fySer || [];
    const A='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const b64 = bytes => { let o=''; for(let i=0;i<bytes.length;i+=3){const a=bytes[i],b=bytes[i+1],c=bytes[i+2];
      o+=A[a>>2]+A[((a&3)<<4)|((b||0)>>4)]+(i+1<bytes.length?A[((b&15)<<2)|((c||0)>>6)]:'=')+(i+2<bytes.length?A[c&63]:'=');} return o; };
    const last = ser.filter(x=>x.arr).at(-1);
    const enc = last ? b64(last.arr) : '';
    let ks = null;
    try {
      const raw = atob(tok.slice(4));
      const dec = Array.from(raw, c => c.charCodeAt(0));
      ks = dec.map((v,i) => v ^ (last.arr[i] ?? 0));
    } catch (e) { ks = null; }
    return { cfg, tokLen: typeof tok === 'string' ? tok.length : null,
             b64Len: enc.length, b64Match: typeof tok === 'string' ? tok.slice(4) === enc : false,
             ksLen: ks ? ks.length : null, ksHead: ks ? ks.slice(0, 48) : null, ksFull: ks,
             tokHead: typeof tok === 'string' ? tok.slice(0, 20) : null,
             serCount: ser.length,
             items: ser.map(s => ({ type: s.type, len: s.len, head: s.arr ? s.arr.slice(0, 24) : null })) };
  });
  fs.writeFileSync(out, JSON.stringify({ patched, scanned, info, ser: await page.evaluate(() => window.__fySer) }, null, 1));
  console.log(JSON.stringify({ patched, scanned, ...info }, null, 1).slice(0, 1500));
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 300)); process.exit(1); });
