// 一次运行采集浏览器侧全部轨迹，供 fy_diff.py 与本地对比。
// 用法：NODE_PATH=$(npm root -g) node probe_traces.cjs <challenge.json> <out.json>
const { chromium } = require('playwright');
const fs = require('fs');

const ch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3] || '/tmp/ppprobe/traces_browser.json';

const DG_LOOP = 'for(d[1]=dC,d[2]=eM,d[7]=x;d[7]!==U;){var aE=d[7]&o,dn,O=d[7]>>5&o;';
const MR_LOOP = 'for(d[38]=QO,d[m]=b;d[m]!==U;){var Kz=d[m]&o,yn=d[m]>>5,O=yn&o;';
const QZ_LOOP = 'for(d[x]=EL,d[i]=Kt,d[$]=a;d[$]!==U;){var JY=d[$]&o,wZ,O=d[$]>>5&o;';
const SER = 'd[p]=W(C[l],null,1,d[i],d[m],d[2],d[4],d[5]),d[i]=d[p]';
const DG_ENTRY = 'function DG(zU,dC,eM,Kt,wZ,Hj){';
const V38 = '(P=38===v)&&(d[a]=DG(0,Z,B))';
const V56 = '(P=56===v)&&(d[a]=DG(S,z,s,AN,Z,B))';
const MR_ENTRY = 'C[4]=function mr(xF,QO,z,FL,eo){';
const QZ_ENTRY = 'function Qz(OA,P,EL,Kt,M,v,Z){';

(async () => {
  const browser = await chromium.launch({
    channel: 'chrome', headless: true,
    ignoreDefaultArgs: ['--enable-automation'],
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 780 } });
  await ctx.addCookies(ch.cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path })));
  const page = await ctx.newPage();

  await page.addInitScript(() => {
    window.__workerMsgs = [];
    const OrigWorker = window.Worker;
    if (OrigWorker) {
      window.Worker = function (url, opts) {
        const worker = new OrigWorker(url, opts);
        worker.addEventListener('message', (event) => {
          try {
            window.__workerMsgs.push({ data: event.data, type: typeof event.data,
              len: Array.isArray(event.data) ? event.data.length : null });
          } catch (e) {}
        });
        return worker;
      };
      window.Worker.prototype = OrigWorker.prototype;
    }
    window.__t = { dg: [], mr: [], qz: [], ser: [], events: [], c9: null, v: [], v0: [], calls: { dg: [], mr: [], qz: [] } };
    window.__c9hook = (t) => {
      try {
        if (!t) return;
        const n = Object.keys(t).length;
        if (!window.__t.c9 || n > window.__t.c9.n) {
          const snap = {};
          for (const k of Object.keys(t)) { try { snap[k] = JSON.stringify(t[k]).slice(0, 80); } catch (e) {} }
          window.__t.c9 = { n, snap };
        }
      } catch (e) {}
    };
    const types = ['mousedown', 'mousemove', 'mouseup', 'pointerdown', 'pointermove', 'pointerup', 'focus', 'focusin'];
    for (const t of types) {
      document.addEventListener(t, (e) => {
        if (window.__t.events.length > 3000) return;
        window.__t.events.push({
          type: t, x: e.clientX ?? null, y: e.clientY ?? null,
          pageX: e.pageX ?? null, pageY: e.pageY ?? null, ts: e.timeStamp,
          target: e.target && e.target.tagName, id: e.target && e.target.id,
          cls: e.target && e.target.className,
        });
      }, true);
    }
  });

  let patched = { dg: 0, mr: 0, qz: 0, ser: 0 };
  await page.route('**/*.js', async route => {
    try {
      const resp = await route.fetch();
      let body = await resp.text();
      if (body.includes(DG_ENTRY)) { body = body.split(DG_ENTRY).join(DG_ENTRY + 'window.__t.calls.dg.push(zU);window.__dgCall=window.__t.calls.dg.length-1;'); patched.dgEntry = 1; }
      if (body.includes(MR_ENTRY)) { body = body.split(MR_ENTRY).join(MR_ENTRY + 'window.__t.calls.mr.push(xF);window.__mrCall=window.__t.calls.mr.length-1;'); patched.mrEntry = 1; }
      if (body.includes(QZ_ENTRY)) { body = body.split(QZ_ENTRY).join(QZ_ENTRY + 'window.__t.calls.qz.push(OA);window.__qzCall=window.__t.calls.qz.length-1;'); patched.qzEntry = 1; }
      if (body.includes(V38)) { body = body.split(V38).join('window.__t.v.push(["38",v]),' + V38); patched.v38 = 1; }
      if (body.includes(V56)) { body = body.split(V56).join('window.__t.v.push(["56",v]),' + V56); patched.v56 = 1; }
      if (body.includes(DG_LOOP)) { body = body.split(DG_LOOP).join(DG_LOOP + 'if(window.__t.dg.length<4000)window.__t.dg.push([d[7],aE,O,window.__dgCall]);'); patched.dg += 1; }
      if (body.includes(MR_LOOP)) { body = body.split(MR_LOOP).join(MR_LOOP + 'if(window.__t.mr.length<4000)window.__t.mr.push([d[m],Kz,O,window.__mrCall]);if(d[m]===20&&window.__t.v0.length<200)window.__t.v0.push([window.__mrCall,xF,QO,typeof v==="undefined"?null:v]);'); patched.mr += 1; }
      if (body.includes(QZ_LOOP)) { body = body.split(QZ_LOOP).join(QZ_LOOP + 'if(window.__t.qz.length<4000)window.__t.qz.push([d[$],JY,O,window.__qzCall]);'); patched.qz += 1; }
      if (body.includes(SER)) { body = body.split(SER).join('window.__t.ser.push(Array.isArray(d[p])?d[p].slice():null),' + SER); patched.ser += 1; }
      const C9NEEDLE = 'd[c]=d[K][yj],d[m]=d[c]?720:750';
      if (body.includes(C9NEEDLE)) { body = body.split(C9NEEDLE).join('window.__c9hook(C[9]),' + C9NEEDLE); patched.c9 = (patched.c9 || 0) + 1; }
      await route.fulfill({ response: resp, body, headers: { ...resp.headers(), 'content-type': 'application/javascript' } });
    } catch (e) { await route.continue().catch(() => {}); }
  });
  await page.route(u => /\/(slide|newslidevalidate)(\/|\?|$)/.test(u.pathname + u.search), r => r.abort().catch(() => {}));
  await page.goto(ch.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('.btn_slide'), { timeout: 30000 });
  await page.waitForTimeout(600);

  const g = await page.evaluate(() => {
    const b = document.querySelector('.btn_slide').getBoundingClientRect();
    return { sx: b.x + b.width / 2, sy: b.y + b.height / 2,
      rect: { x: b.x, y: b.y, left: b.left, top: b.top, right: b.right, bottom: b.bottom, width: b.width, height: b.height } };
  });
  await page.evaluate(() => { window.__t = { dg: [], mr: [], qz: [], ser: [], events: [], v: [], v0: [], calls: { dg: [], mr: [], qz: [] } }; });

  const cdp = await ctx.newCDPSession(page);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: g.sx, y: g.sy, buttons: 0 });
  await sleep(40);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: g.sx, y: g.sy, button: 'left', clickCount: 1, buttons: 1 });
  for (let i = 1; i <= 20; i++) {
    await sleep(16);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: g.sx + 12 * i, y: g.sy, button: 'left', buttons: 1 });
  }
  await page.waitForTimeout(1600);

  const t = await page.evaluate(() => window.__t);
  const fyState = await page.evaluate(() => ({
    fy: typeof window.__fyModule,
    token: (() => { try { return typeof window.__fyModule?.getFYToken === 'function' ? String(window.__fyModule.getFYToken()) : null; } catch (e) { return 'ERR'; } })(),
  }));
  const cfg = await page.evaluate(() => window._config_ ? {
    NCTOKENSTR: window._config_.NCTOKENSTR,
    NCAPPKEY: window._config_.NCAPPKEY,
    SECDATA: window._config_.SECDATA,
    HOST: window._config_.HOST,
    PATH: window._config_.PATH,
  } : null);

  fs.writeFileSync(out, JSON.stringify({
    patched, rect: g.rect, cfg, fyState,
    dg: t.dg, mr: t.mr, qz: t.qz, calls: t.calls, v: t.v,
    workerMessages: await page.evaluate(() => window.__workerMsgs || []),
    v0: t.v0,
    payload: t.ser.length ? t.ser[t.ser.length - 1] : null,
    events: t.events,
    c9: t.c9,
  }));
  console.log('fy', JSON.stringify(fyState));
  console.log('patched', JSON.stringify(patched),
    '| dg', t.dg.length, 'mr', t.mr.length, 'qz', t.qz.length,
    'ser', t.ser.length, 'events', t.events.length);
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 300)); process.exit(1); });
