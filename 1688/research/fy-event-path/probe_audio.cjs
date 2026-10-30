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
    window.__audio = [];
    const origAC = window.AudioContext;
    if (origAC) {
      window.AudioContext = function (...a) {
        window.__audio.push({ op: 'new AudioContext' });
        const inst = new origAC(...a);
        for (const m of ['createScriptProcessor','createAnalyser','createOscillator','createGain','createMediaStreamSource','createBuffer']) {
          const orig = inst[m];
          if (typeof orig === 'function') inst[m] = function (...b) { window.__audio.push({ op: m }); return orig.apply(this, b); };
        }
        return inst;
      };
      window.AudioContext.prototype = origAC.prototype;
    }
    const origSP = window.ScriptProcessorNode;
    if (origSP) {
      const desc = Object.getOwnPropertyDescriptor(origSP.prototype, 'onaudioprocess');
      if (desc && desc.set) Object.defineProperty(origSP.prototype, 'onaudioprocess', {
        configurable: true,
        get: desc.get,
        set(fn) { window.__audio.push({ op: 'set onaudioprocess' }); return desc.set.call(this, fn); },
      });
    }
  });
  await page.route(u => /\/(slide|newslidevalidate)(\/|\?|$)/.test(u.pathname + u.search), r => r.abort().catch(()=>{}));
  await page.goto(ch.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('.btn_slide'), { timeout: 30000 });
  await page.waitForTimeout(600);
  const g = await page.evaluate(() => { const b=document.querySelector('.btn_slide').getBoundingClientRect(); return {sx:b.x+b.width/2, sy:b.y+b.height/2}; });
  await page.evaluate(() => { window.__audio = []; });
  const cdp = await ctx.newCDPSession(page);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await cdp.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:g.sx, y:g.sy, buttons:0 });
  await sleep(40);
  await cdp.send('Input.dispatchMouseEvent', { type:'mousePressed', x:g.sx, y:g.sy, button:'left', clickCount:1, buttons:1 });
  for (let i=1;i<=20;i++){ await sleep(16); await cdp.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:g.sx+12*i, y:g.sy, button:'left', buttons:1 }); }
  await page.waitForTimeout(800);
  const a = await page.evaluate(() => window.__audio);
  console.log("browser audio ops:", a.length, JSON.stringify(a.slice(0,10)));
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 200)); process.exit(1); });
