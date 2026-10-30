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
  await page.waitForTimeout(1000);
  const entries = await page.evaluate(() => performance.getEntriesByType('resource').map(e => ({
    name: e.name, entryType: e.entryType, startTime: e.startTime, duration: e.duration,
    initiatorType: e.initiatorType, nextHopProtocol: e.nextHopProtocol,
    workerStart: e.workerStart, redirectStart: e.redirectStart, redirectEnd: e.redirectEnd,
    fetchStart: e.fetchStart, domainLookupStart: e.domainLookupStart, domainLookupEnd: e.domainLookupEnd,
    connectStart: e.connectStart, connectEnd: e.connectEnd, secureConnectionStart: e.secureConnectionStart,
    requestStart: e.requestStart, responseStart: e.responseStart, responseEnd: e.responseEnd,
    transferSize: e.transferSize, encodedBodySize: e.encodedBodySize, decodedBodySize: e.decodedBodySize,
    responseStatus: e.responseStatus, renderBlockingStatus: e.renderBlockingStatus,
  })));
  fs.writeFileSync('/tmp/ppprobe/resources.json', JSON.stringify(entries, null, 1));
  console.log("entries:", entries.length);
  for (const e of entries.slice(0, 10)) console.log(" ", e.initiatorType, e.name.slice(0, 90), e.transferSize);
  await browser.close();
})().catch(e => { console.log('ERR', String(e).slice(0, 200)); process.exit(1); });
