#!/usr/bin/env node
'use strict';

/**
 * 批量采集真人拖拽轨迹。
 *
 * 用法：
 *   NODE_PATH=$(npm root -g) node collect_trajectory.cjs \
 *     --challenge <json> --out <json> --runs 50 [--max-failures 5]
 *
 * 每轮：加载挑战页 → 等待人工拖动 → abort 验证请求（token 不消费）→ 落盘 → 重载。
 * 结果每轮增量写入 --out，中途中断不丢数据。
 */

const fs = require('node:fs');
const { chromium } = require('playwright');

const args = { runs: 50, 'max-failures': 5, headless: false };
for (let i = 2; i < process.argv.length; i += 1) {
  const key = process.argv[i];
  if (!key.startsWith('--')) continue;
  const name = key.slice(2);
  if (name === 'headless') { args.headless = true; continue; }
  args[name] = process.argv[i + 1];
  i += 1;
}

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const RUNS = Number(args.runs);
const MAX_FAILURES = Number(args['max-failures']);

const RECORD_SCRIPT = () => {
  window.__traj = [];
  window.__trajDone = false;
  const snap = (event) => {
    window.__traj.push({
      type: event.type,
      t: event.timeStamp,
      x: event.clientX,
      y: event.clientY,
      buttons: event.buttons,
      button: event.button,
      pressure: event.pressure,
      movementX: event.movementX,
      movementY: event.movementY,
      width: event.width,
      height: event.height,
      pointerType: event.pointerType,
      pointerId: event.pointerId,
      isPrimary: event.isPrimary,
      coalesced: typeof event.getCoalescedEvents === 'function'
        ? event.getCoalescedEvents().length : null,
      srcCaps: event.sourceCapabilities
        ? Object.keys(event.sourceCapabilities).length : null,
      target: event.target?.className ? String(event.target.className).slice(0, 40) : null,
    });
    if (event.type === 'pointerup') window.__trajDone = true;
  };
  for (const name of ['pointerdown', 'pointermove', 'pointerup', 'mousedown', 'mousemove', 'mouseup']) {
    document.addEventListener(name, snap, true);
  }
};

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
  await page.addInitScript(RECORD_SCRIPT);

  let aborted = 0;
  await page.route((url) => /\/(slide|newslidevalidate)(\/|\?|$)/.test(url.pathname + url.search),
    async (route) => { aborted += 1; await route.abort().catch(() => {}); });

  const samples = [];
  const save = () => {
    fs.writeFileSync(args.out, JSON.stringify({
      source: args.challenge, aborted, collectedAt: new Date().toISOString(), samples,
    }));
  };

  let failures = 0;
  for (let run = 0; run < RUNS; run += 1) {
    try {
      await page.goto(challenge.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForFunction(
        () => document.querySelector('.btn_slide') || document.querySelector('.scratch-captcha-slider'),
        { timeout: 20000 });
    } catch (error) {
      failures += 1;
      log(`第 ${run + 1} 轮加载失败 (${failures}/${MAX_FAILURES}): ${String(error).slice(0, 120)}`);
      if (failures >= MAX_FAILURES) { log('连续失败过多，停止'); break; }
      continue;
    }
    failures = 0;

    const geometry = await page.evaluate(() => {
      const button = document.querySelector('.btn_slide, .scratch-captcha-slider');
      const scale = document.querySelector('.nc_scale');
      const b = button.getBoundingClientRect();
      const s = scale ? scale.getBoundingClientRect() : b;
      return {
        action: window._config_?.action,
        button: b.toJSON(),
        scale: s.toJSON(),
        viewport: { w: innerWidth, h: innerHeight },
      };
    });
    await page.bringToFront();
    log(`READY ${run + 1}/${RUNS} —— 请拖动滑块`);

    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
      const done = await page.evaluate(() => window.__trajDone).catch(() => false);
      if (done) break;
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(250);

    const events = await page.evaluate(() => window.__traj).catch(() => []);
    const moves = events.filter((e) => e.type === 'pointermove');
    if (moves.length >= 20) {
      const down = events.find((e) => e.type === 'pointerdown');
      const up = events.find((e) => e.type === 'pointerup');
      samples.push({
        run, geometry, events,
        summary: {
          duration_ms: down && up ? Math.round((up.t - down.t) * 100) / 100 : null,
          moves: moves.length,
        },
      });
      save();
      log(`记录 ${moves.length} 条移动，时长 ${samples[samples.length - 1].summary.duration_ms}ms（累计 ${samples.length}）`);
    } else {
      log(`第 ${run + 1} 轮无有效拖动（${moves.length} 条移动），跳过`);
    }
  }

  save();
  log(`完成：${samples.length} 条轨迹 → ${args.out}`);
  await browser.close();
})().catch((error) => { console.log('ERR', String(error).slice(0, 500)); process.exit(1); });
