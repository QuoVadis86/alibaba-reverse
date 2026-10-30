const { chromium } = require('playwright');
const fs = require('fs');
const ch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3] || '/tmp/ppprobe/webgl_full.json';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true,
    ignoreDefaultArgs: ['--enable-automation'], args: ['--disable-blink-features=AutomationControlled'] });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 780 } });
  await ctx.addCookies(ch.cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path })));
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__gl = { params: {}, ext: null, calls: [] };
    const proto = WebGLRenderingContext.prototype;
    const proto2 = window.WebGL2RenderingContext ? WebGL2RenderingContext.prototype : null;
    const ser = v => {
      if (v === null || v === undefined) return null;
      if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') return v;
      if (Array.isArray(v)) return v.slice(0, 64).map(Number);
      if (typeof v === 'object' && typeof v.length === 'number') return Array.from(v).slice(0, 64).map(Number);
      return String(v);
    };
    for (const P of [proto, proto2].filter(Boolean)) {
      const gp = P.getParameter;
      if (gp && !gp.__wrapped) {
        const w = function (p) {
          const v = gp.call(this, p);
          try { if (window.__gl.calls.length < 500) window.__gl.calls.push({ p, v: ser(v) }); window.__gl.params[p] = ser(v); } catch (e) {}
          return v;
        };
        w.__wrapped = true; P.getParameter = w;
      }
      const ge = P.getSupportedExtensions;
      if (ge && !ge.__wrapped) {
        const w = function () { const r = ge.call(this); try { window.__gl.ext = Array.from(r || []); } catch (e) {} return r; };
        w.__wrapped = true; P.getSupportedExtensions = w;
      }
    }
  });
  await page.route(u => /\/(slide|newslidevalidate)(\/|\?|$)/.test(u.pathname + u.search), r => r.abort().catch(()=>{}));
  await page.goto(ch.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('.btn_slide'), { timeout: 30000 });
  await page.waitForTimeout(500);
  const g = await page.evaluate(() => { const b = document.querySelector('.btn_slide').getBoundingClientRect(); return { sx: b.x+b.width/2, sy: b.y+b.height/2 }; });
  const cdp = await ctx.newCDPSession(page);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await cdp.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:g.sx, y:g.sy, buttons:0 });
  await sleep(40);
  await cdp.send('Input.dispatchMouseEvent', { type:'mousePressed', x:g.sx, y:g.sy, button:'left', clickCount:1, buttons:1 });
  for (let i=1;i<=20;i++){ await sleep(16); await cdp.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:g.sx+12*i, y:g.sy, button:'left', buttons:1 }); }
  await page.waitForTimeout(1500);
  const gl = await page.evaluate(() => window.__gl);
  fs.writeFileSync(out, JSON.stringify(gl, null, 1));
  console.log("params:", Object.keys(gl.params).length, "calls:", gl.calls.length, "ext:", (gl.ext||[]).length);
  console.log(JSON.stringify(gl.params).slice(0, 500));
  console.log("ext:", JSON.stringify(gl.ext).slice(0, 300));
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 300)); process.exit(1); });
