#!/usr/bin/env node
'use strict';

/**
 * x5sec 本地参数计算 + 本地发送（浏览器只负责采集拖拽事件）。
 *
 * 用法：
 *   NODE_PATH=$(npm root -g) node pp_local_send.cjs --challenge <json> --mode local|browser --out <json>
 *   NODE_PATH=$(npm root -g) node pp_local_send.cjs --self-test <capture.json>
 *
 * 模式：
 *   local   拦截验证请求 → 本地计算 ppSign → 用本地 Node https 发出 → 用本地响应回填页面
 *   browser 拦截验证请求 → 本地计算 ppSign 并只做比对 → 放行浏览器自己的请求（对照组）
 *
 * 退出码：0 成功（local 模式下要求 result.code === 0）；1 失败；2 环境/版本不匹配。
 */

const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const RUNTIME = path.resolve(__dirname, '../core/x5sec/runtime/pp_vm_runtime.cjs');
const ASSETS = path.resolve(__dirname, '../core/x5sec/assets');
const VM_NEEDLE = 'for(i=r;;i++){var g=4*i';
const VERIFY_RE = /\/(slide|newslidevalidate)(\/|\?|$)/;
const PC_INIT_CALL = 5320;   // VM 内部：初始化命令写入点
const PC_TRACK = 4117;       // VM 内部：轨迹编码入口
const TRACK_COMMAND = '_$PS';

const log = (...args) => console.log(new Date().toISOString().slice(11, 19), ...args);

function parseArgs(argv) {
  const out = { mode: 'local', headless: false };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const name = key.slice(2);
    if (name === 'headless') { out.headless = true; continue; }
    out[name] = argv[i + 1];
    i += 1;
  }
  return out;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function versionFingerprint() {
  const vmPath = path.join(ASSETS, 'punish-inline-vm.js');
  const wasmPath = path.join(ASSETS, 'punish-program.wasm');
  const source = fs.readFileSync(vmPath, 'utf8');
  if (!source.includes(VM_NEEDLE)) {
    throw Object.assign(new Error('归档 VM 版本不匹配：缺少 needle'), { exitCode: 2 });
  }
  return {
    vmSha256: sha256(vmPath),
    vmBytes: Buffer.byteLength(source),
    wasmSha256: sha256(wasmPath),
    wasmBytes: fs.statSync(wasmPath).size,
  };
}

function computeLocal(payload) {
  const result = spawnSync('node', [RUNTIME], {
    input: JSON.stringify(payload), encoding: 'utf8', timeout: 20000,
  });
  if (result.status !== 0) {
    throw new Error(`本地 VM 执行失败: ${(result.stderr || '').slice(0, 300)}`);
  }
  const parsed = JSON.parse(result.stdout);
  if (typeof parsed.ppSign !== 'string' || !parsed.ppSign) {
    throw new Error('本地 VM 未返回 ppSign');
  }
  return parsed.ppSign;
}

function localSend(url, headers) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const outgoing = { ...headers };
    for (const name of ['host', 'content-length', 'connection', 'accept-encoding']) delete outgoing[name];
    const request = https.request({
      hostname: target.hostname,
      port: target.port || 443,
      path: target.pathname + target.search,
      method: 'GET',
      headers: outgoing,
      servername: target.hostname,
    }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({
        status: response.statusCode,
        headers: response.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      }));
    });
    request.on('error', reject);
    request.setTimeout(20000, () => request.destroy(new Error('本地发送超时')));
    request.end();
  });
}

function resultCode(body) {
  try {
    return JSON.parse(body)?.result?.code;
  } catch {
    return null;
  }
}

async function selfTest(capturePath) {
  const capture = JSON.parse(fs.readFileSync(capturePath, 'utf8'));
  const browserSign = Array.isArray(capture.writes) && capture.writes[0]
    ? capture.writes[0]
    : (capture.verifyRequests?.[0]?.pp || '');
  if (!browserSign) throw new Error('采集文件缺少浏览器侧 ppSign');
  const base = {
    page: capture.page,
    initCommands: capture.initCommands,
    dragCalls: capture.dragCalls,
  };
  const withTrack = computeLocal({ ...base, track: capture.track ?? null });
  const selfTrack = computeLocal({ ...base, track: null });
  const report = {
    mode: 'self-test',
    browserLength: browserSign.length,
    withTrackLength: withTrack.length,
    withTrackEqual: withTrack === browserSign,
    selfTrackLength: selfTrack.length,
    selfTrackEqual: selfTrack === browserSign,
    version: versionFingerprint(),
  };
  console.log(JSON.stringify(report, null, 1));
  return report.withTrackEqual ? 0 : 1;
}

async function runCapture(options) {
  const { chromium } = require('playwright');
  const challenge = JSON.parse(fs.readFileSync(options.challenge, 'utf8'));
  const fingerprint = versionFingerprint();

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: options.headless,
    ignoreDefaultArgs: ['--enable-automation'],
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const context = await browser.newContext({ viewport: { width: 1180, height: 780 } });
  await context.addCookies(challenge.cookies.map((cookie) => ({
    name: cookie.name, value: cookie.value, domain: cookie.domain, path: cookie.path,
  })));
  const page = await context.newPage();

  await page.addInitScript(() => {
    window.__ppVmCalls = [];
    window.__ppVmWrites = [];
    window.__ppVmCommand = '';
    window.__ppVmInitCalls = [];
    window.__ppVmTrack = [];
  });

  await page.route('**/_____tmd_____/punish?**', async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    if (!body.includes(VM_NEEDLE)) {
      await route.fulfill({ response, body });
      return;
    }
    const replacement = `for(i=r;;i++){`
      + `if(i===${PC_INIT_CALL}&&typeof p[1]==="string")globalThis.__ppVmInitCalls.push(p[1]);`
      + `if(i===${PC_TRACK}&&globalThis.__ppVmCommand==="${TRACK_COMMAND}"&&globalThis.__ppVmTrack.length===0)globalThis.__ppVmTrack.push(String(f[4]));`
      + `var g=4*i`;
    await route.fulfill({ response, body: body.replace(VM_NEEDLE, replacement) });
  });

  let profile = null;
  let initCommands = [];
  let outcome = null;

  await page.route((url) => VERIFY_RE.test(url.pathname + url.search), async (route) => {
    const request = route.request();
    const headers = await request.allHeaders();
    try {
      const capture = await page.evaluate(() => ({
        dragCalls: window.__ppVmCalls,
        writes: window.__ppVmWrites,
        track: window.__ppVmTrack[0] ?? null,
      }));
      log(`采集 dragCalls=${capture.dragCalls.length} writes=${capture.writes.map((v) => v.length).join('/')}`
        + ` track=${(capture.track || '').length} init=${initCommands.length} base=${(profile?.ppSign || '').length}`);
      if (!capture.dragCalls.length) {
        throw new Error(`未采集到拖拽事件（init=${initCommands.length}），请确认滑块已拖动且 VM 插桩生效`);
      }
      const localSign = computeLocal({
        page: profile,
        initCommands,
        dragCalls: capture.dragCalls,
        track: null,
      });
      const browserSign = capture.writes[0] || '';
      headers['bx-pp'] = localSign;
      log(`本地 ppSign=${localSign.length} 浏览器=${browserSign.length} 一致=${localSign === browserSign}`
        + ` dragCalls=${capture.dragCalls.length} track=${(capture.track || '').length}`);

      if (options.mode === 'browser') {
        await route.continue({ headers });
        outcome = { mode: 'browser', localLength: localSign.length, browserLength: browserSign.length,
          equal: localSign === browserSign, sentBy: 'browser' };
        return;
      }

      const sent = await localSend(request.url(), headers);
      outcome = {
        mode: 'local',
        localLength: localSign.length,
        browserLength: browserSign.length,
        equal: localSign === browserSign,
        sentBy: 'node-https',
        status: sent.status,
        code: resultCode(sent.body),
        body: sent.body.slice(0, 400),
        setCookie: sent.headers['set-cookie'] || null,
        dragCalls: capture.dragCalls.length,
        trackLength: (capture.track || '').length,
      };
      log(`本地发送 status=${sent.status} code=${outcome.code}`);
      await route.fulfill({
        status: sent.status,
        headers: { 'content-type': 'application/json;charset=UTF-8', 'access-control-allow-credentials': 'true' },
        body: sent.body,
      }).catch(() => {});
    } catch (error) {
      log(`本地计算/发送失败: ${String(error).slice(0, 300)}`);
      outcome = { mode: options.mode, error: String(error).slice(0, 400) };
      await route.continue().catch(() => {});
    }
  });

  await page.goto(challenge.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('.btn_slide') || document.querySelector('.scratch-captcha-slider'), { timeout: 30000 });

  const webdriver = await page.evaluate(() => navigator.webdriver);
  if (webdriver !== false) {
    await browser.close();
    throw Object.assign(new Error('navigator.webdriver 不为 false，验证会被拒绝'), { exitCode: 2 });
  }

  profile = await page.evaluate(() => ({
    url: location.href,
    token: _config_.NCTOKENSTR,
    appKey: _config_.NCAPPKEY,
    x5secdata: _config_.SECDATA,
    host: _config_.HOST,
    path: _config_.PATH,
    action: _config_.action,
    pp: _config_.pp,
    ppSign: _config_.ppSign,
    ppt: _config_.ppt,
    cookie: document.cookie,
    referrer: document.referrer,
    title: document.title,
    userAgent: navigator.userAgent,
    sliderRect: document.querySelector('.btn_slide, .scratch-captcha-slider')?.getBoundingClientRect().toJSON(),
  }));
  initCommands = await page.evaluate(() => window.__ppVmInitCalls.slice());
  log(`action=${profile.action} 基础ppSign=${(profile.ppSign || '').length} init=${initCommands.length}`);

  await page.evaluate(() => {
    const original = crypto.randemUUID;
    crypto.randemUUID = function (...args) {
      const event = args[0] instanceof Event ? args[0] : null;
      window.__ppVmCommand = args[1];
      window.__ppVmCalls.push({
        command: args[1],
        event: event && {
          type: event.type,
          x: event.clientX,
          y: event.clientY,
          timeStamp: event.timeStamp,
          buttons: event.buttons,
          targetTag: event.target?.tagName,
          targetClass: String(event.target?.className || ''),
          targetRect: event.target?.getBoundingClientRect?.().toJSON(),
          currentTargetTag: event.currentTarget?.tagName,
        },
      });
      return original.apply(this, args);
    };
    const descriptor = Object.getOwnPropertyDescriptor(window._config_, 'ppSign')
      || { value: window._config_.ppSign };
    let current = descriptor.value;
    Object.defineProperty(window._config_, 'ppSign', {
      configurable: true,
      enumerable: true,
      get() { return descriptor.get ? descriptor.get() : current; },
      set(value) {
        window.__ppVmWrites.push(value);
        if (descriptor.set) descriptor.set(value); else current = value;
      },
    });
  });

  await page.bringToFront();
  log('READY —— 请手动拖动滑块（180 秒）');

  const deadline = Date.now() + 180000;
  while (!outcome && Date.now() < deadline) await page.waitForTimeout(500);
  await page.waitForTimeout(2000);

  const finalUrl = await page.evaluate(() => location.href).catch(() => null);
  const report = {
    action: profile.action,
    finalUrl,
    outcome,
    version: fingerprint,
  };
  if (options.out) fs.writeFileSync(options.out, JSON.stringify(report, null, 1));
  log('RESULT', JSON.stringify(report, null, 1));
  await page.waitForTimeout(2000);
  await browser.close();

  if (!outcome) return 1;
  if (outcome.error) return 1;
  if (options.mode === 'local') return outcome.code === 0 ? 0 : 1;
  return 0;
}

(async () => {
  const options = parseArgs(process.argv);
  if (options['self-test']) {
    process.exitCode = await selfTest(options['self-test']);
    return;
  }
  if (!options.challenge) {
    console.error('缺少 --challenge（或使用 --self-test <capture.json>）');
    process.exitCode = 2;
    return;
  }
  process.exitCode = await runCapture(options);
})().catch((error) => {
  console.error('ERR', String(error.stack || error).slice(0, 800));
  process.exitCode = error.exitCode || 1;
});
