#!/usr/bin/env node
'use strict';

/**
 * 采集真人拖拽轨迹（只记录指针事件，不提交验证）。
 *
 * 用法：
 *   NODE_PATH=$(npm root -g) node collect_trajectory.cjs --challenge <json> --out <json> --runs 5
 *
 * 每次拖动后立即 abort 验证请求，token 不会被消费；页面随后 reload 进入下一轮。
 */

const fs = require('node:fs');
const { chromium } = require('playwright');

const args = { runs: 5, headless: false };
for (let i = 2; i < process.argv.length; i += 1) {
  const key = process.argv[i];
  if (!key.startsWith('--')) continue;
  const name = key.slice(2);
  if (name === 'headless') { args.headless = true; continue; }
  args[name] = process.argv[i + 1];
  i += 1;
}

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

(async () => {
  const challenge = JSON.parse(fs.readFileSync(args.challenge, 'utf8'));
  const browser = await chromium.launch({
    channel: 'chrome', headless: args.headless,
    ignoreDefaultArgs: ['--enable-automation'],
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const context = await browser.newContext({ viewport: { width: 1180, height: 780 } });
  await context.addCookies(challenge.cookies.map((c) => ({
    name: c.name, value: c.value, domain: c.domain, path: c.path,
  })));
  const page = await context.newPage();

  await page.addInitScript(() => {
    window.__traj = [];
    window.__trajDone = false;
    const record = (event) => {
      window.__traj.push({
        type: event.type,
        t: event.timeStamp,
        x: event.clientX,
        y: event.clientY,
        buttons: event.buttons,
        target: event.target?.className ? String(event.target.className).slice(0, 40) : null,
      });
      if (event.type === 'mouseup' || event.type === 'pointerup') window.__trajDone = true;
    };
    for (const name of ['mousedown', 'mousemove', 'mouseup', 'pointerdown', 'pointermove', 'pointerup']) {
      document.addEventListener(name, record, true);
    }
  });

  let aborted = 0;
  await page.route((url) => /\/(slide|newslidevalidate)(\/|\?|$)/.test(url.pathname + url.search), async (route) => {
    aborted += 1;
    await route.abort().catch(() => {});
  });

  const samples = [];
  for (let run = 0; run < Number(args.runs); run += 1) {
    await page.goto(challenge.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(() => document.querySelector('.btn_slide') || document.querySelector('.scratch-captcha-slider'),
      { timeout: 30000 });
    const geometry = await page.evaluate(() => {
      const el = document.querySelector('.btn_slide, .scratch-captcha-slider');
      const scale = document.querySelector('.nc_scale');
      return {
        slider: el?.getBoundingClientRect().toJSON(),
        scale: scale?.getBoundingClientRect().toJSON(),
        action: window._config_?.action,
        viewport: { w: innerWidth, h: innerHeight },
      };
    });
    await page.bringToFront();
    log(`READY ${run + 1}/${args.runs} —— 请拖动滑块`);
    const deadline = Date.now() + 120000;
    while (Date.now() < deadline) {
      const done = await page.evaluate(() => window.__trajDone).catch(() => false);
      if (done) break;
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(300);
    const events = await page.evaluate(() => window.__traj);
    const usable = events.filter((e) => e.type === 'mousemove' || e.type === 'pointermove');
    if (events.length && usable.length) {
      samples.push({ run, geometry, events });
      log(`记录 ${events.length} 条事件（移动 ${usable.length}）`);
    } else {
      log('本轮未记录到拖动，跳过');
    }
  }

  const output = { source: args.challenge, aborted, samples };
  fs.writeFileSync(args.out, JSON.stringify(output, null, 1));
  log(`写出 ${samples.length} 条轨迹到 ${args.out}（abort ${aborted} 次）`);
  await browser.close();
})().catch((error) => { console.log('ERR', String(error).slice(0, 500)); process.exit(1); });
