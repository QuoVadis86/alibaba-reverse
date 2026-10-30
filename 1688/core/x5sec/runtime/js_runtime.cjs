const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const hostProcess = process;

(async () => {
const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const page = input.page || {};
const FY_REPLAY = Symbol('fyMouseReplay');
global.__fyTrace = input.traceFy ? { canvas: [], webgl: [] } : null;
const pageUrl = new URL(page.url || 'https://h5api.m.1688.com/');
delete global.navigator;
const report = value => fs.writeSync(1, `${value}\n`);
console.log = () => {};
global.__etDateCalls = [];
function replayStartup() {
  const originalRandom = Math.random;
  const originalNow = Date.now;
  const originalDate = Date;
  let dateConstructCount = 0;
  let randomConsumed = 0;
  let timeConsumed = 0;
  const initRandomFrames = [];
  const initRandomRegisterCounts = [];
  if (Number.isFinite(input.initTimestamp)) {
    global.Date = new Proxy(originalDate, {
      construct(target, args, newTarget) {
        if (args.length) return Reflect.construct(target, args, newTarget);
        const timestamp = input.initDateTape?.[dateConstructCount] ?? input.initTimestamp;
        global.__etDateCalls.push({ index: dateConstructCount, timestamp,
          stack: input.traceFy ? new Error().stack?.split('\n').slice(1, 4) : undefined });
        dateConstructCount++;
        return Reflect.construct(target, [timestamp], newTarget);
      },
    });
  }
  if (Array.isArray(input.initRandomTape)) {
    Math.random = () => {
      if (input.traceFy) {
        const frames = new Error().stack?.split('\n').slice(1, 4);
        initRandomFrames.push(frames);
        initRandomRegisterCounts.push(global.__fyRegisterCount || 0);
        if (initRandomFrames.length === 3 && !global.__fyEvalSnapshot) {
          global.__fyEvalSnapshot = global.__snapshotEnvironment?.();
        }
      }
      return input.initRandomTape[randomConsumed++] ?? originalRandom();
    };
  }
  if (Array.isArray(input.initTimeTape)) {
    Date.now = () => input.initTimeTape[timeConsumed++] ?? originalNow();
  }
  return {
    restore() {
      Math.random = originalRandom;
      Date.now = originalNow;
      global.Date = originalDate;
      return { initRandomConsumed: randomConsumed, initTimeConsumed: timeConsumed,
        initRandomFrames, initRandomRegisterCounts };
    },
  };
}
const cookieJar = new Map();
function loadCookieSnapshot(cookie) {
  cookieJar.clear();
  for (const item of (cookie || '').split(';')) {
    const separator = item.indexOf('=');
    if (separator > 0) cookieJar.set(item.slice(0, separator).trim(), item.slice(separator + 1).trim());
  }
}
loadCookieSnapshot(input.mode === 'et' ? page.etInitCookie ?? page.cookie
  : input.fyInitCookie ?? page.cookie);
function readCookie() { return [...cookieJar].map(([name, value]) => `${name}=${value}`).join('; '); }
function writeCookie(value) {
  const item = String(value).split(';', 1)[0];
  const separator = item.indexOf('=');
  if (separator > 0) cookieJar.set(item.slice(0, separator).trim(), item.slice(separator + 1).trim());
}
let nonceEventListeners;

if (input.mode === 'et') {
  delete global.process;
  global.window = global;
  global.self = global;
  global.top = global;
  global.Window = class Window {};
  Object.defineProperty(global, 'constructor', { configurable: true, value: Window });
  Object.defineProperty(global, Symbol.toStringTag, { configurable: true, value: 'Window' });
  global.chrome = {};
  global.AWSCInner = {
    register(name, type, module) {
      if (type === 'et' && typeof module?.getETToken === 'function') {
        global.etSign = url => module.getETToken(url);
      }
    },
  };
  const nativeShape = (name, implementation) => {
    const value = new Proxy(implementation, {});
    Object.defineProperty(value, 'name', { value: name });
    return value;
  };
  let currentWindowNameCount = page.etWindowNameCount;
  if (Number.isInteger(currentWindowNameCount)) {
    const originalGetOwnPropertyNames = Object.getOwnPropertyNames;
    Object.getOwnPropertyNames = nativeShape('getOwnPropertyNames', function getOwnPropertyNames(value) {
      const names = originalGetOwnPropertyNames(value);
      if (value !== global) return names;
      const targetCount = currentWindowNameCount;
      if (names.length >= targetCount) return names.slice(0, targetCount);
      return names.concat(Array.from({ length: targetCount - names.length }, (_, index) => `__window_property_${index}`));
    });
  }
  if (Number.isInteger(page.etResourceCount)) {
    const hostPerformance = global.performance;
    const resourceEntries = page.etResourceEntries || Array.from({ length: page.etResourceCount }, () => ({}));
    for (const [index, entry] of resourceEntries.entries()) {
      hostPerformance.markResourceTiming(
        { startTime: entry.startTime ?? index, duration: entry.duration ?? 0 },
        entry.name || `https://resource.invalid/${index}`,
        entry.initiatorType || 'script',
        global,
        '',
      );
    }
  }
  let currentDivCount = page.etInitDivCount ?? page.divCount ?? 28;
  global.alert = nativeShape('alert', () => {});
  global.webkitRTCPeerConnection = class webkitRTCPeerConnection {};
  global.PointerEvent = class PointerEvent {};
  PointerEvent.prototype.getCoalescedEvents = nativeShape('getCoalescedEvents', function getCoalescedEvents() { return [this]; });
  PointerEvent.prototype.getPredictedEvents = nativeShape('getPredictedEvents', () => []);
  global.FormDataEvent = class FormDataEvent {};
  const etListeners = new Map();
  function addEtListener(type, callback) {
    if (typeof callback !== 'function') return;
    const callbacks = etListeners.get(type) || [];
    callbacks.push(callback);
    etListeners.set(type, callbacks);
  }
  function removeEtListener(type, callback) {
    etListeners.set(type, (etListeners.get(type) || []).filter(item => item !== callback));
  }
  global.Image = class Image { set src(value) { this._src = String(value); } };
  global.HTMLAnchorElement = class HTMLAnchorElement {};
  global.HTMLMediaElement = class HTMLMediaElement {};
  Object.defineProperty(HTMLAnchorElement.prototype, 'hrefTranslate', {
    configurable: true,
    get: nativeShape('get hrefTranslate', () => ''),
    set: nativeShape('set hrefTranslate', () => {}),
  });
  global.HTMLFormElement = class HTMLFormElement {};
  global.HTMLScriptElement = class HTMLScriptElement {};
  HTMLScriptElement.prototype.setAttribute = nativeShape('setAttribute', function setAttribute(name, value) {
    this[name] = String(value);
  });
  Object.defineProperty(HTMLScriptElement.prototype, 'src', {
    configurable: true,
    get: nativeShape('get src', function getSrc() { return this._src || ''; }),
    set: nativeShape('set src', function setSrc(value) { this._src = String(value); }),
  });
  global.XMLHttpRequest = class XMLHttpRequest {
    open() {}
    send() {}
    setRequestHeader() {}
  };
  global.Document = function Document() {};
  const head = { appendChild() {}, onwheel: null };
  Object.defineProperty(Document.prototype, 'head', { get() { return head; } });
  Object.defineProperty(Document.prototype, 'cookie', {
    get: readCookie,
    set: writeCookie,
  });
  const rendererInfo = { UNMASKED_VENDOR_WEBGL: 37445, UNMASKED_RENDERER_WEBGL: 37446 };
  global.WebGLRenderingContext = class WebGLRenderingContext {
    getExtension(name) {
      if (name === 'WEBGL_debug_renderer_info') return rendererInfo;
      if (name === 'WEBGL_lose_context') return { loseContext() {}, restoreContext() {} };
      return null;
    }
    getParameter(name) {
      if (name === 37445) return 'Google Inc. (Apple)';
      if (name === 37446) return 'ANGLE (Apple, ANGLE Metal Renderer: Apple M4, Unspecified Version)';
      return null;
    }
    getSupportedExtensions() { return page.webglExtensions || []; }
  };
  const webglContext = new WebGLRenderingContext();
  const canvasContext = new Proxy({
    getImageData() { return { data: new Uint8ClampedArray(4) }; },
    measureText() { return { width: 0 }; },
    createLinearGradient() { return { addColorStop() {} }; },
  }, {
    get(target, key) { return key in target ? target[key] : () => {}; },
  });
  global.HTMLCanvasElement = class HTMLCanvasElement {
    constructor() { this.style = {}; this.width = 300; this.height = 150; }
    getContext(type) { return type === '2d' ? canvasContext : webglContext; }
    toDataURL() { return input.canvasData || 'data:image/png;base64,'; }
  };
  const anchorUrls = new WeakMap();
  function etElement(tag) {
    if (tag === 'canvas') return new HTMLCanvasElement();
    if (tag !== 'a') return { style: {}, appendChild() {}, removeChild() {}, getContext() { return { getExtension() { return null; } }; } };
    const anchor = new HTMLAnchorElement();
    Object.defineProperty(anchor, 'href', {
      set(value) { anchorUrls.set(this, new URL(value, pageUrl)); },
      get() { return anchorUrls.get(this)?.href || ''; },
    });
    for (const key of ['host', 'hostname', 'pathname', 'search', 'hash', 'protocol', 'origin']) {
      Object.defineProperty(anchor, key, { get() { return anchorUrls.get(this)?.[key] || ''; } });
    }
    return anchor;
  }
  const documentState = { readyState: page.etInitReadyState || 'complete' };
  const bodyElement = etElement('body');
  const rootElement = etElement('html');
  const currentScript = {
    src: 'https://g.alicdn.com/AWSC/et/1.83.8/et_f.js',
    dataset: {},
    getAttribute(name) { return name === 'src' ? this.src : null; },
  };
  for (const [name, getter] of Object.entries({
    readyState: () => documentState.readyState,
    visibilityState: () => 'visible',
    hidden: () => false,
    referrer: () => page.referrer || '',
    title: () => '',
    URL: () => pageUrl.href,
    body: () => bodyElement,
    documentElement: () => rootElement,
    currentScript: () => currentScript,
  })) {
    Object.defineProperty(Document.prototype, name, {
      configurable: true,
      get: nativeShape(`get ${name}`, getter),
    });
  }
  Document.prototype.addEventListener = nativeShape('addEventListener', addEtListener);
  Document.prototype.removeEventListener = nativeShape('removeEventListener', removeEtListener);
  Document.prototype.querySelector = nativeShape('querySelector', () => null);
  Document.prototype.createEvent = nativeShape('createEvent', () => ({ initEvent() {}, initMouseEvent() {} }));
  Document.prototype.hasFocus = nativeShape('hasFocus', () => true);
  Document.prototype.createElement = nativeShape('createElement', etElement);
  Document.prototype.getElementsByTagName = nativeShape('getElementsByTagName', function getElementsByTagName(name) {
    if (name === 'head') return [head];
    if (name === 'div') return Array.from({ length: currentDivCount }, () => etElement('div'));
    return [];
  });
  Object.defineProperty(Document.prototype, Symbol.toStringTag, { configurable: true, value: 'HTMLDocument' });
  const etDocument = new Document();
  Object.defineProperty(global, 'document', {
    configurable: true,
    enumerable: true,
    get: nativeShape('get document', () => etDocument),
    set: nativeShape('set document', () => {}),
  });
  Object.defineProperty(document, 'location', {
    configurable: true,
    enumerable: true,
    get: nativeShape('get location', () => global.location),
  });
  const etNavigatorData = {
    userAgent: page.userAgent || 'Mozilla/5.0', platform: 'MacIntel',
    appName: 'Netscape', appVersion: (page.userAgent || '').split('/').at(-1),
    language: 'zh-CN', languages: ['zh-CN', 'zh'], vendor: page.navigatorVendor ?? 'Google Inc.',
    hardwareConcurrency: 10, deviceMemory: 16, webdriver: false,
    vibrate() { return true; },
    getBattery: nativeShape('getBattery', () => Promise.resolve({ charging: true, level: 1 })),
    plugins: page.plugins?.map(plugin => Object.assign({ length: plugin.mimeTypes?.length ?? 0 }, plugin, plugin.mimeTypes || [])) || Array.from({ length: 5 }, () => ({})),
    mimeTypes: Array.from({ length: 2 }, () => ({})),
  };
  let etNavigator;
  Object.defineProperty(global, 'navigator', {
    configurable: true, enumerable: true,
    get: nativeShape('get navigator', () => etNavigator),
  });
  global.Screen = class Screen {};
  global.MouseEvent = class MouseEvent {};
  global.Navigator = class Navigator {};
  global.TouchEvent = class TouchEvent {};
  for (const [name, value] of Object.entries(etNavigatorData)) {
    Object.defineProperty(Navigator.prototype, name, {
      configurable: true,
      enumerable: true,
      get: nativeShape(`get ${name}`, () => value),
    });
  }
  Object.defineProperty(Navigator.prototype, Symbol.toStringTag, { configurable: true, value: 'Navigator' });
  etNavigator = new Navigator();
  for (const [prototype, name, implementation] of [
    [Screen.prototype, 'width', () => page.screen?.width ?? 1280],
    [MouseEvent.prototype, 'x', () => 0],
    [MouseEvent.prototype, 'movementX', () => 0],
    [Navigator.prototype, 'platform', () => 'MacIntel'],
    [Navigator.prototype, 'appName', () => 'Netscape'],
    [Navigator.prototype, 'webdriver', () => false],
    [TouchEvent.prototype, 'touches', () => []],
  ]) {
    Object.defineProperty(prototype, name, {
      configurable: true,
      get: nativeShape(`get ${name}`, implementation),
    });
  }
  for (const [name, value] of Object.entries({
    colorDepth: 24, pixelDepth: 24,
    width: page.screen?.width ?? 1280,
    height: page.screen?.height ?? 720,
    availWidth: page.screen?.availWidth ?? 1280,
    availHeight: page.screen?.availHeight ?? 720,
    availLeft: page.screenProfile?.values?.availLeft ?? page.screen?.availLeft ?? 0,
    availTop: page.screenProfile?.values?.availTop ?? page.screen?.availTop ?? 0,
  })) {
    Object.defineProperty(Screen.prototype, name, {
      configurable: true,
      get: nativeShape(`get ${name}`, () => value),
    });
  }
  global.screen = new Screen();
  global.innerWidth = page.viewport?.innerWidth ?? 1280;
  global.innerHeight = page.viewport?.innerHeight ?? 720;
  global.outerWidth = page.viewport?.outerWidth ?? 1280;
  global.outerHeight = page.viewport?.outerHeight ?? 720;
  global.screenTop = page.windowPosition?.screenTop ?? 0;
  global.screenLeft = page.windowPosition?.screenLeft ?? 0;
  global.screenX = page.windowPosition?.screenX ?? global.screenLeft;
  global.screenY = page.windowPosition?.screenY ?? global.screenTop;
  global.devicePixelRatio = page.screen?.devicePixelRatio ?? 1;
  global.location = {
    href: pageUrl.href, origin: pageUrl.origin, hostname: pageUrl.hostname,
    host: pageUrl.host, protocol: pageUrl.protocol, pathname: pageUrl.pathname,
    search: pageUrl.search, hash: pageUrl.hash,
  };
  global.origin = pageUrl.origin;
  global.history = { length: page.historyLength ?? 2 };
  const values = new Map();
  const storageTrace = [];
  const storage = {
    getItem(key) {
      const value = values.get(key) ?? null;
      if (input.trace) storageTrace.push({ method: 'getItem', key, valueLength: value?.length ?? null });
      return value;
    },
    setItem(key, value) {
      if (input.trace) storageTrace.push({ method: 'setItem', key, valueLength: String(value).length });
      values.set(key, String(value));
    },
  };
  global.localStorage = storage;
  global.sessionStorage = storage;
  global._config_ = {
    NCTOKENSTR: page.token || '', NCAPPKEY: page.appKey || '',
    SECDATA: page.x5secdata || '', HOST: pageUrl.origin, PATH: pageUrl.pathname,
  };
  global.addEventListener = addEtListener;
  global.removeEventListener = removeEtListener;
  global.matchMedia = media => ({ media, matches: false });
  const traceReads = {};
  const traceCalls = [];
  if (input.trace) {
    for (const name of ['navigator', 'screen', 'document', 'location', 'history', 'localStorage', 'sessionStorage']) {
      global[name] = new Proxy(global[name], {
        get(target, key) {
          const path = `${name}.${String(key)}`;
          traceReads[path] = (traceReads[path] || 0) + 1;
          const value = Reflect.get(target, key, target);
          if (typeof value === 'function' && name === 'document') {
            return (...args) => {
              if (traceCalls.length < 60) {
                traceCalls.push({ method: String(key), args: args.map(value => String(value).slice(0, 120)) });
              }
              return value.apply(target, args);
            };
          }
          return value;
        },
      });
    }
  }
  try {
    const startup = replayStartup();
    if (input.tracePc) {
      eval(fs.readFileSync(path.join(__dirname, '../../../tools/probes/environment_snapshot.js'), 'utf8'));
    }
    let etSource = fs.readFileSync(path.join(__dirname, '..', 'assets', 'et_f.js'), 'utf8');
    global.__etVmTrace = [];
    global.__etM23Trace = [];
    global.__etScTrace = [];
    global.__etVmState = { count: 0, hash: 2166136261, checkpoints: [] };
    global.__etVmDivergence = [];
    global.__etVmProperties = [];
    global.__etVmFlags = [];
    global.__etVmNative = [];
    global.__etReturnTrace = [];
    global.__etBranchTrace = [];
    global.__etCaTrace = [];
    global.__etAaTrace = [];
    global.__etStartupFingerprint = null;
    global.__etWTrace = [];
    global.__etW89Trace = [];
    global.__etW28Trace = [];
    global.__etWWriteTrace = [];
    global.__etRaTrace = [];
    global.__etHashInputs = [];
    global.__etEnvironmentChecks = [];
    global.__etHashLoop2 = [];
    global.__etArithmeticProbe = [];
    global.__etPayloadBytes = null;
    global.__etInitProbe = [];
    global.__etPcTrace = [];
    global.__etPcMetadata = [];
    global.__etValueTrace = [];
    global.__etSeedTrace = [];
    if (input.tracePc) {
      const loop = 'for(var Sc=82624;void 0!==Sc;){';
      if (!etSource.includes(loop)) throw new Error('ET VM 入口不匹配');
      const probe = fs.readFileSync(path.join(__dirname, '../../../tools/probes/et_pc_probe.txt'), 'utf8').trim();
      etSource = etSource.replace(loop, loop + probe);
    }
    if (input.traceVm) {
      const entry = 'function M(t, h, v, d, p, w) {';
      if (!etSource.includes(entry)) throw new Error('ET VM 入口不匹配');
      etSource = etSource.replace(entry, `${entry} if (globalThis.__etTraceActive && globalThis.__etVmTrace.length < 100) globalThis.__etVmTrace.push([t, h, v, d, p, w].map(value => typeof value === 'string' ? {type: 'string', length: value.length} : typeof value === 'number' ? {type: 'number', value} : {type: typeof value}));`);
      const m23 = 'S = M(23), K = void 0';
      if (!etSource.includes(m23)) throw new Error('ET M23 入口不匹配');
      etSource = etSource.replace(m23, "S = M(23), globalThis.__etM23Trace.push({type: typeof S, value: typeof S === 'number' ? S : null, length: typeof S === 'string' ? S.length : null, keys: S && typeof S === 'object' ? Object.keys(S) : []}), K = void 0");
      const loop = 'for (var Sc = 82624; void 0 !== Sc;) {';
      if (!etSource.includes(loop)) throw new Error('ET VM 循环入口不匹配');
      etSource = etSource.replace(loop, `${loop} if (t === 23 && globalThis.__etTraceActive) { const state = globalThis.__etVmState; state.hash = (Math.imul(state.hash, 16777619) ^ Sc) >>> 0; state.count++; if (state.count % 1000 === 0) state.checkpoints.push(state.hash); if (globalThis.__etScTrace.length < 2000) globalThis.__etScTrace.push(Sc); if (Sc === 128385 && globalThis.__etVmDivergence.length < 20) { const item = Xe[je], first = item && item[0]; globalThis.__etVmDivergence.push({je, xType: typeof Xe, xLength: Xe && Xe.length, itemType: typeof item, itemLength: item && item.length, firstType: typeof first, firstTruthy: !!first, firstName: typeof first === 'function' ? first.name : null}); } if (Sc === 111873 && globalThis.__etVmProperties.length < 20) globalThis.__etVmProperties.push({constructorName: sa && sa.name, property: Ce && Ce[1], helper: String(H).slice(0, 220)}); if (Sc === 119170 && globalThis.__etVmFlags.length < 20) { const flag = Xe[me]; globalThis.__etVmFlags.push({me, xType: typeof Xe, xLength: Xe && Xe.length, itemType: typeof flag, itemName: typeof flag === 'function' ? flag.name : null, itemValue: typeof flag === 'boolean' || typeof flag === 'number' || typeof flag === 'string' ? flag : null, names: me === 0 ? Xe.map(value => value && value.name) : null}); } if (Sc === 30081 && globalThis.__etVmNative.length < 20) globalThis.__etVmNative.push({name: ga && ga.name, Ke, sa, Ee, Ar, je, rendering: String(ga).slice(0, 90)}); }`);
      const returnNeedle = 'return Vr;';
      etSource = etSource.replace('if (t === 23 && globalThis.__etTraceActive)', "if (t === 4 && W.length > 110 && globalThis.__etWLast !== W[110]) { globalThis.__etWLast = W[110]; if (globalThis.__etWTrace.length < 30) globalThis.__etWTrace.push({sc: Sc, length: W.length, value: W[110]}); } if ((t === 14 || t === 23) && globalThis.__etTraceActive)");
      etSource = etSource.replace('if (Sc === 128385', "if (t === 14 && Array.isArray(Aa) && Aa.length > 110 && globalThis.__etAaLast !== Aa[110]) { globalThis.__etAaLast = Aa[110]; if (globalThis.__etAaTrace.length < 30) globalThis.__etAaTrace.push({sc: Sc, length: Aa.length, value: Aa[110]}); } if (Sc === 128385");
      etSource = etSource.replace('if (Sc === 128385', "if (t === 14 && Array.isArray(Ca) && Ca.length > 110 && globalThis.__etCaLast !== Ca[110]) { globalThis.__etCaLast = Ca[110]; if (globalThis.__etCaTrace.length < 30) globalThis.__etCaTrace.push({sc: Sc, length: Ca.length, value: Ca[110]}); } if (Sc === 128385");
      etSource = etSource.replace('if (Sc === 128385', "if (Sc === 123072 && globalThis.__etBranchTrace.length < 20) globalThis.__etBranchTrace.push({caType: typeof Ca, caLength: Ca && Ca.length, ca: Ca && Ca.map(value => typeof value === 'string' ? { type: 'string', length: value.length } : value && typeof value === 'object' ? { type: 'object', keys: Object.keys(value).slice(0, 5) } : value), saType: typeof sa, saTruthy: !!sa}); if (Sc === 128385");
      etSource = etSource.replace('if ((t === 14 || t === 23) && globalThis.__etTraceActive)', 'if ((t === 4 || t === 14) && globalThis.__etScTrace.length < 20000) globalThis.__etScTrace.push(Sc); if (t === 23 && globalThis.__etTraceActive)');
      etSource = etSource.replace('__etScTrace.length < 2000', '__etScTrace.length < 20000');
      etSource = etSource.replace('if (t === 4 && W.length > 110', "if (t === 4 && W.length > 89 && globalThis.__etW89Last !== W[89]) { globalThis.__etW89Last = W[89]; if (globalThis.__etW89Trace.length < 30) globalThis.__etW89Trace.push({sc: Sc, length: W.length, value: W[89]}); } if (t === 4 && W.length > 110");
      etSource = etSource.replace('if (t === 4 && W.length > 89', "if (t === 4 && W.length > 28 && globalThis.__etW28Last !== W[28]) { globalThis.__etW28Last = W[28]; if (globalThis.__etW28Trace.length < 30) globalThis.__etW28Trace.push({sc: Sc, length: W.length, value: W[28]}); } if (t === 4 && W.length > 89");
      etSource = etSource.replace('if (t === 4 && W.length > 28', "if (Sc === 120833 && globalThis.__etHashLoop2.length < 3) globalThis.__etHashLoop2.push({ t, sourceLength: ye && ye.length, limit: Fe, index: $e }); if (Sc === 136577) globalThis.__etInitProbe.push({ pc: Sc, t, needle: qe, haystackLength: ue && ue.length, index: ue && ue.indexOf(qe), cookieLength: document.cookie.length, equalsCookie: ue === document.cookie }); if (t === 14 && [128064, 26176, 45376, 110849, 4737, 38272].includes(Sc)) globalThis.__etEnvironmentChecks.push({ Sc, ve: typeof ve === 'string' ? ve.slice(0, 80) : ve, Fa, ie, Pe, me, ge, Oe }); if (Sc === 145537 && globalThis.__etHashInputLast !== we && globalThis.__etHashInputs.length < 10) { globalThis.__etHashInputLast = we; let hash = 2166136261; for (let index = 0; index < we.length; index++) hash = (Math.imul(hash, 16777619) ^ we.charCodeAt(index)) >>> 0; globalThis.__etHashInputs.push({ t, length: we.length, hash, input: we }); } if (t === 4 && W.length > 28");
      etSource = etSource.replace('if (Sc === 128385', "if (t === 4 && Sc === 74176) globalThis.__etInitProbe.push({pc: Sc, object: Ae, property: D, valueType: typeof (document[Ae] && document[Ae][D])}); if (Sc === 128385");
      etSource = etSource.replace('if (Sc === 128385', "if (t === 4 && Sc === 79360) globalThis.__etInitProbe.push({pc: Sc, objectType: typeof Ae, objectIsWindow: Ae === globalThis, property: 'WASCInner', valueType: typeof (Ae && Ae.WASCInner)}); if (Sc === 128385");
      etSource = etSource.replace('if (Sc === 128385', "if (t === 4 && Sc === 71616) globalThis.__etInitProbe.push({pc: Sc, property: Ge, objectType: typeof Ae, valueType: typeof (Ae && Ae[Ge])}); if (Sc === 128385");
      etSource = etSource.replace('if (Sc === 128385', "if (Sc === 59009) globalThis.__etInitProbe.push({pc: Sc, t, property: ar, objectType: typeof fe, constructor: fe && fe.constructor && fe.constructor.name, keys: fe && typeof fe === 'object' ? Object.keys(fe).slice(0, 20) : null, valueType: typeof (fe && fe[ar]), truthy: !!(fe && fe[ar])}); if (Sc === 128385");
      etSource = etSource.replace('if (Sc === 128385', "if (Sc === 136257) globalThis.__etInitProbe.push({pc: Sc, t, targetType: typeof Ze, targetConstructor: Ze && Ze.constructor && Ze.constructor.name, targetIsNavigator: Ze === globalThis.navigator, targetIsDocument: Ze === globalThis.document, property: fa, method: sr}); if (Sc === 128385");
      etSource = etSource.replace('if (Sc === 128385', "if (Sc === 106880) globalThis.__etInitProbe.push({pc: Sc, t, property: fa, objectType: typeof pe, objectConstructor: pe && pe.constructor && pe.constructor.name, objectIsNavigator: pe === globalThis.navigator, valueType: typeof (pe && pe[fa])}); if (Sc === 128385");
      etSource = etSource.replace('if (Sc === 128385', "if (Sc === 20994) globalThis.__etInitProbe.push({pc: Sc, t, property: Ma, objectType: typeof pe, objectConstructor: pe && pe.constructor && pe.constructor.name, valueType: typeof (pe && pe[Ma])}); if (Sc === 128385");
      etSource = etSource.replace('if (Sc === 128385', "if (Sc === 124993) globalThis.__etInitProbe.push({pc: Sc, t, property: Xr, charAtProperty: 'charAt'.charAt[Xr], charAtLength: 'charAt'.charAt.length}); if (Sc === 128385");
      etSource = etSource.replace('if (Sc === 128385', "if (Sc === 86848) globalThis.__etInitProbe.push({pc: Sc, t, ra, jeLength: Je && Je.length}); if (Sc === 128385");
      etSource = etSource.replace('if (Sc === 128385', "if (Sc === 145537 && globalThis.__etHashInputLast !== we && globalThis.__etHashInputs.length < 10) { globalThis.__etHashInputLast = we; let hash = 2166136261; for (let index = 0; index < we.length; index++) hash = (Math.imul(hash, 16777619) ^ we.charCodeAt(index)) >>> 0; globalThis.__etHashInputs.push({ t, length: we.length, hash }); } if (Sc === 128385");
      etSource = etSource.replace('if (Sc === 128385', "if (Sc === 53314) { if (globalThis.__etPayloadBytes === null) globalThis.__etPayloadBytes = Array.from(ye); globalThis.__etArithmeticProbe.push({t, S, U, j, yeLength: ye && ye.length}); } if (Sc === 128385");
      etSource = etSource.replace('if (Sc === 128385', "if (t === 4 && Sc === 66432) globalThis.__etInitProbe.push({pc: Sc, property: Ie, objectType: typeof We, valueType: typeof (We && We[Ie]), valueTruthy: !!(We && We[Ie])}); if (t === 4 && Sc === 111234) globalThis.__etInitProbe.push({pc: Sc, property: or, objectType: typeof We, valueType: typeof (We && We[or]), valueTruthy: !!(We && We[or])}); if (t === 4 && Sc === 119169) globalThis.__etInitProbe.push({pc: Sc, property: Ee, objectType: typeof ue, valueType: typeof (ue && ue[Ee]), valueTruthy: !!(ue && ue[Ee])}); if (Sc === 136577) globalThis.__etInitProbe.push({pc: Sc, t, needle: qe, haystackLength: ue && ue.length, index: ue && ue.indexOf(qe), cookieLength: document.cookie.length, equalsCookie: ue === document.cookie}); if (Sc === 128385");
      if (!etSource.includes(returnNeedle)) throw new Error('ET VM 返回点不匹配');
      etSource = etSource.replace(returnNeedle, `if (globalThis.__etTraceActive && globalThis.__etReturnTrace.length < 100) { const value = Vr; let hash = 2166136261; if (typeof value === 'string') for (let index = 0; index < value.length; index++) hash = (Math.imul(hash, 16777619) ^ value.charCodeAt(index)) >>> 0; globalThis.__etReturnTrace.push({ t, kind: typeof value, length: typeof value === 'string' ? value.length : null, hash: typeof value === 'string' ? hash : null, number: typeof value === 'number' ? value : null, keys: value && typeof value === 'object' ? Object.keys(value).slice(0, 20) : null }); } return Vr;`);
      const initNeedle = 'M(4)';
      if (!etSource.includes(initNeedle)) throw new Error('ET 初始化入口不匹配');
      etSource = etSource.replace(initNeedle, `M(4); globalThis.__etStartupFingerprint = W.map(value => typeof value === 'string' ? { type: 'string', length: value.length } : value && typeof value === 'object' ? { type: 'object', keys: Object.keys(value).slice(0, 5) } : value);`);
      if (input.trackW) {
        etSource = etSource.replace('if (t === 4 && W.length > 28', "const previousPc = globalThis.__etCurrentPc; globalThis.__etCurrentPc = { t, Sc }; if (t === 14 && typeof ra === 'number' && globalThis.__etLastRa !== ra) { globalThis.__etLastRa = ra; if (globalThis.__etRaTrace.length < 500) globalThis.__etRaTrace.push({ Sc, previousPc, ra }); } if (t === 4 && W.length > 28");
        etSource = etSource.replace('M(4); globalThis.__etStartupFingerprint', "W = new Proxy(W, { set(target, key, value) { if (['28', '56', '62', '72', '88', '138', '161'].includes(String(key))) globalThis.__etWWriteTrace.push({ key: String(key), valueType: typeof value, value: typeof value === 'number' || typeof value === 'boolean' ? value : null, pc: globalThis.__etCurrentPc }); return Reflect.set(target, key, value); } }); M(4); globalThis.__etStartupFingerprint");
      }
    }
    if (input.captureFingerprint && !input.traceVm) {
      const initNeedle = 'M(4)';
      if (!etSource.includes(initNeedle)) throw new Error('ET 初始化入口不匹配');
      const wProbe = input.tracePc ? fs.readFileSync(path.join(__dirname, '../../../tools/probes/et_w_probe.txt'), 'utf8').trim() : '';
      etSource = etSource.replace(initNeedle, `M(4); globalThis.__etStartupFingerprint = W.map(value => typeof value === 'string' ? { type: 'string', length: value.length } : value && typeof value === 'object' ? { type: 'object', keys: Object.keys(value).slice(0, 5) } : value);${wProbe}`);
    }
    if (input.replayResourceOrigin) {
      etSource = etSource.replace('M(4)', 'globalThis.__etM=M;M(4)');
    }
    eval(`${etSource}\n//# sourceURL=https://g.alicdn.com/AWSC/et/1.83.8/et_f.js`);
    for (const [name, descriptor] of Object.entries(page.etCallDocumentHooks || {})) {
      if (!descriptor || descriptor.type !== 'function') continue;
      const callback = () => {};
      Object.defineProperty(callback, 'name', { value: descriptor.name || '' });
      Object.defineProperty(document, name, {
        configurable: true, enumerable: descriptor.enumerable,
        writable: true, value: callback,
      });
    }
    currentWindowNameCount = page.etCallWindowNameCount ?? currentWindowNameCount;
    if (Number.isInteger(page.etCallResourceCount)) {
      const callEntries = page.etCallResourceEntries || [];
      const existingCount = performance.getEntriesByType('resource').length;
      for (let index = existingCount; index < page.etCallResourceCount; index++) {
        const entry = callEntries[index] || {};
        performance.markResourceTiming(
          { startTime: entry.startTime ?? index, duration: entry.duration ?? 0 },
          entry.name || `https://resource.invalid/${index}`,
          entry.initiatorType || 'script',
          global,
          '',
        );
      }
    }
    currentDivCount = page.etCallDivCount ?? page.divCount ?? currentDivCount;
    documentState.readyState = page.readyState || 'complete';
    if (input.initDelayMs) await new Promise(resolve => setTimeout(resolve, input.initDelayMs));
    const startupCounts = startup.restore();
    loadCookieSnapshot(page.cookie);
    for (let index = 0; index < (input.etWarmupInitCalls || 0); index++) global.__etM(4);
    if (input.replayResourceOrigin) global.__etM(12, input.replayResourceOrigin);
    for (let index = 0; index < (input.etWarmupM14Calls || 0); index++) {
      global.__etM(14, '', 0);
    }
    for (const call of input.etWarmupM14Requests || []) {
      global.__etM(14, call.url, call.v, call.d, call.p, call.w);
    }
    const etWarmupUrls = input.etWarmupUrls || Array(input.etWarmupCalls || 0).fill(page.url || input.url);
    for (const url of etWarmupUrls) global.etSign(url);
    if (input.replayMessageEvent) {
      const message = new MessageEvent('message', { data: input.replayMessageData });
      Object.defineProperty(message, 'isTrusted', { value: true, enumerable: true });
      global.event = message;
      for (const callback of etListeners.get('message') || []) callback.call(global, message);
      delete global.event;
    }
    for (const event of input.events || []) {
      const target = {
        tagName: event.target?.tag || 'DIV',
        id: event.target?.id || '',
        className: event.target?.className || '',
      };
      const value = {
        type: event.type, clientX: event.x, clientY: event.y,
        pageX: event.x, pageY: event.y, timeStamp: event.timeStamp,
        buttons: event.buttons ?? 1, isTrusted: true,
        button: 0, target, srcElement: target, currentTarget: document,
        preventDefault() {}, stopPropagation() {},
      };
      for (const callback of etListeners.get(value.type) || []) callback.call(document, value);
    }
    const originalRandom = Math.random;
    const originalNow = Date.now;
    let randomConsumed = 0;
    let timeConsumed = 0;
    if (Array.isArray(input.randomTape)) {
      Math.random = () => input.randomTape[randomConsumed++] ?? originalRandom();
    }
    if (Array.isArray(input.timeTape)) {
      Date.now = () => input.timeTape[timeConsumed++] ?? originalNow();
    }
    if (input.tracePc) {
      global.__etInitPcMetadata = global.__etPcMetadata;
      global.__etPcMetadata = [];
      for (const name of ['__etByte125Last', '__etMe125Last', '__etFlagSLast']) global[name] = undefined;
      for (const name of ['__etByte125Trace', '__etMe125Trace', '__etFlagTrace', '__etFlagSTrace', '__et1664Trace']) global[name] = [];
      for (const name of ['__etPcTrace', '__etEncodeSteps', '__etRoundStates',
        '__etBeforeRounds', '__etJeLengths', '__etCallInputs', '__etSeedTrace',
        '__etValueTrace']) {
        global[name] = [];
      }
      global.__etJ166Trace = [];
      global.__etJ166Last = undefined;
      global.__etCa166Trace = [];
      global.__etCa166Last = undefined;
      global.__etCallFingerprint = null;
      global.__etJeLastLength = undefined;
    }
    if (input.callFingerprintOverrides && global.__etWRef) {
      for (const [index, value] of Object.entries(input.callFingerprintOverrides)) {
        if (value === '__array_with_object__') {
          const event = new MessageEvent('message');
          Object.defineProperty(event, 'isTrusted', { value: true, enumerable: true });
          global.__etWRef[Number(index)] = [event];
        } else if (value === '__crypto_key__') {
          global.__etWRef[Number(index)] = await require('node:crypto').webcrypto.subtle.importKey(
            'raw', new Uint8Array(16), { name: 'AES-CBC' }, false, ['decrypt'],
          );
        } else {
          global.__etWRef[Number(index)] = value;
        }
      }
    }
    if (Array.isArray(input.callTimingSamples) && global.__etDollarRef) {
      global.__etDollarRef.length = 0;
      global.__etDollarRef.push(...input.callTimingSamples);
    }
    const callNativeDate = global.Date;
    if (Number.isFinite(input.callTimestamp)) {
      let callDateCount = 0;
      global.Date = new Proxy(callNativeDate, {
        construct(target, args, newTarget) {
          if (args.length) return Reflect.construct(target, args, newTarget);
          const timestamp = input.callDateTape?.[callDateCount] ?? input.callTimestamp;
          global.__etDateCalls.push({ phase: 'call', index: callDateCount, timestamp });
          callDateCount++;
          return Reflect.construct(target, [timestamp], newTarget);
        },
      });
    }
    global.__etTraceActive = true;
    if (typeof input.charAtValue === 'number') String.prototype.charAt.value = input.charAtValue;
    const originalPrepareStackTrace = Error.prepareStackTrace;
    if (input.etCallStackMode === 'playwright') {
      Error.prepareStackTrace = () => 'Error\n    at https://g.alicdn.com/AWSC/et/1.83.8/et_f.js:111:132667\n    at object.<computed> (eval at evaluate (:368:30), <anonymous>:68:35)\n    at n.onDragEnd (https://g.alicdn.com/bsop-static/sufei-punish/0.1.129/build/punishpage.min.js:1:1)';
    }
    const et = global.etSign(input.url);
    global.__etTraceActive = false;
    Error.prepareStackTrace = originalPrepareStackTrace;
    global.Date = callNativeDate;
    Math.random = originalRandom;
    Date.now = originalNow;
    if ((typeof et !== 'string' || et.length < 100) && !input.debugAllowInvalidEt) throw new Error(`ET 输出无效: ${et}`);
    report(JSON.stringify({ et, randomConsumed, timeConsumed, dateCalls: global.__etDateCalls, ...startupCounts, listenerTypes: [...etListeners].map(([type, callbacks]) => ({ type, count: callbacks.length })), m12Inputs: global.__etM12Inputs, m12PcCalls: global.__etM12PcCalls, m12Regex: global.__etM12Regex, m14Inputs: global.__etM14Inputs, traceReads, traceCalls, storageTrace, vmTrace: global.__etVmTrace, m23Trace: global.__etM23Trace, scTrace: global.__etScTrace, pcTrace: global.__etPcTrace, pcMetadata: global.__etPcMetadata, encodeSteps: global.__etEncodeSteps, roundStates: global.__etRoundStates, beforeRounds: global.__etBeforeRounds, jeLengths: global.__etJeLengths, callInputs: global.__etCallInputs, environmentSnapshot: global.__etEnvironmentSnapshot, valueTrace: global.__etValueTrace, seedTrace: global.__etSeedTrace, vmState: global.__etVmState, vmDivergence: global.__etVmDivergence, vmProperties: global.__etVmProperties, vmFlags: global.__etVmFlags, vmNative: global.__etVmNative, returnTrace: global.__etReturnTrace, branchTrace: global.__etBranchTrace, caTrace: global.__etCaTrace, aaTrace: global.__etAaTrace, startupFingerprint: global.__etStartupFingerprint, wTrace: global.__etWTrace, w89Trace: global.__etW89Trace, w28Trace: global.__etW28Trace, wWriteTrace: global.__etWWriteTrace, w61Trace: global.__etW61Trace, raTrace: global.__etRaTrace, hashInputs: global.__etHashInputs, hashLoop2: global.__etHashLoop2, environmentChecks: global.__etEnvironmentChecks, initProbe: global.__etInitProbe, arithmeticProbe: global.__etArithmeticProbe, payloadBytes: global.__etPayloadBytes }));
  } catch (error) {
    hostProcess.stderr.write(`${error.stack || error}\n`);
    hostProcess.exitCode = 1;
  }
  hostProcess.exit(hostProcess.exitCode || 0);
}

if (input.mode === 'fy_nonce' || input.mode === 'nonce_only') {
  const hostFetch = global.fetch;
  if (input.traceNonceGt) {
    const digest = SubtleCrypto.prototype.digest;
    let digestIndex = 0;
    SubtleCrypto.prototype.digest = function (algorithm, data) {
      const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) :
        new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      let hash = 2166136261;
      for (const byte of bytes) hash = (Math.imul(hash, 16777619) ^ byte) >>> 0;
      (global.__nonceDigestTrace ||= []).push({ algorithm: String(algorithm),
        length: bytes.length, hash });
      const replay = input.nonceReplayDigestResults?.[digestIndex++];
      if (replay) return Promise.resolve(Uint8Array.from(replay).buffer);
      if (String(algorithm).toUpperCase() === 'SHA-256') {
        const result = createHash('sha256').update(bytes).digest();
        return Promise.resolve(result.buffer.slice(result.byteOffset,
          result.byteOffset + result.byteLength));
      }
      return digest.call(this, algorithm, data);
    };
  }
  nonceEventListeners = new WeakMap();
  global.fetch = async () => ({ ok: true, status: 200,
    text: async () => '', json: async () => ({}),
    arrayBuffer: async () => new ArrayBuffer(0) });
  global.EventTarget = class EventTarget {
    addEventListener(type, listener) {
      const registry = nonceEventListeners.get(this) || new Map();
      nonceEventListeners.set(this, registry);
      const listeners = registry.get(type) || [];
      listeners.push(listener);
      registry.set(type, listeners);
    }
    removeEventListener(type, listener) {
      const registry = nonceEventListeners.get(this);
      registry?.set(type, (registry.get(type) || []).filter(item => item !== listener));
    }
    dispatchEvent(event) {
      if (!(input.mode === 'fy_nonce' && (event[FY_REPLAY] || event.__fyMouseReplay))) {
        if (!Object.hasOwn(event, 'target')) {
          Object.defineProperty(event, 'target', { configurable: true, value: this });
        }
        Object.defineProperty(event, 'currentTarget', { configurable: true, value: this });
        Object.defineProperty(event, 'srcElement', { configurable: true, value: this });
      }
      for (const listener of nonceEventListeners.get(this)?.get(event.type) || []) {
        listener.call(this, event);
      }
      this[`on${event.type}`]?.call(this, event);
      return true;
    }
  };
  global.Worker = class Worker extends EventTarget {
    constructor(url) {
      super();
      this.url = String(url);
      hostFetch(this.url).then(response => response.text()).then(source => {
        global.__nonceWorkerScript = source;
      }).catch(error => { global.__nonceWorkerError = error.name; });
    }
    postMessage(value) {
      (global.__nonceWorkerMessages ||= []).push({ argumentCount: arguments.length,
        type: typeof value,
        length: typeof value === 'string' ? value.length : null,
        stack: String(new Error().stack).split('\n').slice(1, 5) });
      if (typeof value === 'string') {
        const events = input.nonceWorkerEvents?.length
          ? input.nonceWorkerEvents : [{ data: [0] }];
        if (input.nonceWorkerCountsByPhase) {
          let delivered = 0;
          global.__nonceDeliverWorkerEvents = count => {
            while (delivered < count && delivered < events.length) {
              const event = events[delivered++];
              global.__nonceWorkerDelivered = delivered;
              global.__nonceCurrentWorkerKind = event.data?.[0];
              try { this.dispatchEvent(new MessageEvent('message', { data: event.data })); }
              finally { global.__nonceCurrentWorkerKind = null; }
            }
          };
          return;
        }
        for (const event of events) {
          const delay = 240 + (event.data?.[0] === 1
            ? 80 + Math.ceil((event.data[3] || 0) / 1e6) : 0);
          setTimeout(() => {
            global.__nonceWorkerDelivered = (global.__nonceWorkerDelivered || 0) + 1;
            global.__nonceCurrentWorkerKind = event.data?.[0];
            try { this.dispatchEvent(new MessageEvent('message', { data: event.data })); }
            finally { global.__nonceCurrentWorkerKind = null; }
          }, delay);
        }
      }
    }
    terminate() {}
  };
  global.RTCPeerConnection = class RTCPeerConnection extends EventTarget {
    constructor() {
      super();
      (global.__nonceRtcCalls ||= []).push({ method: 'constructor', argumentCount: arguments.length });
      this.iceGatheringState = 'complete';
      this.localDescription = null;
    }
    createDataChannel() {
      global.__nonceRtcCalls.push({ method: 'createDataChannel', argumentCount: arguments.length });
      return { close() {} };
    }
    createOffer() {
      global.__nonceRtcCalls.push({ method: 'createOffer', argumentCount: arguments.length });
      return Promise.resolve(input.nonceRtcOffer || { type: 'offer', sdp: '' });
    }
    setLocalDescription(description) {
      global.__nonceRtcCalls.push({ method: 'setLocalDescription', argumentCount: arguments.length });
      this.localDescription = description;
      for (const [index, item] of (input.nonceIceEvents || []).entries()) {
        setTimeout(() => this.dispatchEvent(new RTCPeerConnectionIceEvent(
          'icecandidate', { candidate: item.candidate
            ? new RTCIceCandidate(item.candidate) : null })), 220 + index * 5);
      }
      return Promise.resolve();
    }
    close() {}
  };
  Object.defineProperty(RTCPeerConnection.prototype, Symbol.toStringTag, {
    configurable: true, value: 'RTCPeerConnection',
  });
  global.webkitRTCPeerConnection = global.RTCPeerConnection;
  global.RTCIceCandidate = class RTCIceCandidate {
    constructor(candidate) { this._candidate = candidate; }
    get candidate() { return this._candidate; }
  };
  global.RTCPeerConnectionIceEvent = class RTCPeerConnectionIceEvent extends Event {
    constructor(type, options) {
      super(type);
      this._candidate = options.candidate;
    }
    get candidate() { return this._candidate; }
  };
}

global.window = global;
global.self = global;
global.top = global;
global.length = 0;
const nativeFunctionSources = new WeakMap();
if (input.mode === 'fy_nonce') delete Error.prepareStackTrace;
if (input.mode === 'nonce_only' || input.mode === 'fy_nonce') {
  const originalFunctionToString = Function.prototype.toString;
  const patchedToString = {
    toString() {
      return nativeFunctionSources.get(this) || originalFunctionToString.call(this);
    },
  }.toString;
  nativeFunctionSources.set(patchedToString, 'function toString() { [native code] }');
  Object.defineProperty(Function.prototype, 'toString', {
    configurable: true, writable: true, value: patchedToString,
  });
}
const browserNative = (name, implementation) => {
  const value = new Proxy(implementation, {});
  Object.defineProperty(value, 'name', { value: name });
  nativeFunctionSources.set(value, `function ${name}() { [native code] }`);
  return value;
};
if (global.RTCPeerConnection) Object.defineProperty(global.RTCPeerConnection, 'generateCertificate', {
  configurable: true, enumerable: true, writable: true,
  value: browserNative('generateCertificate', async function generateCertificate() { return {}; }),
});
if (input.mode === 'fy_nonce') global.Touch = browserNative('Touch', class Touch {});
if (input.mode === 'fy_nonce') global.AudioContext = browserNative(
  'AudioContext', class AudioContext {});
if (input.mode === 'fy_nonce') global.Bluetooth = browserNative('Bluetooth', class Bluetooth {});
if (input.mode === 'fy_nonce') global.BluetoothDevice = browserNative('BluetoothDevice', class BluetoothDevice {});
if (input.mode === 'fy_nonce') global.BlobEvent = browserNative('BlobEvent', class BlobEvent {});
if (input.mode === 'fy_nonce') {
  global.BluetoothUUID = browserNative('BluetoothUUID', class BluetoothUUID {});
  for (const name of ['canonicalUUID', 'getCharacteristic', 'getDescriptor', 'getService']) {
    Object.defineProperty(global.BluetoothUUID, name, {
      configurable: true, enumerable: true, writable: true,
      value: browserNative(name, function () {}),
    });
  }
}
if (input.mode === 'fy_nonce') {
  class OfflineAudioContext {
    constructor(channels) { this.channels = channels; }
  }
  Object.defineProperty(OfflineAudioContext.prototype, Symbol.toStringTag, {
    configurable: true, value: 'OfflineAudioContext',
  });
  for (const [name, value] of [['oncomplete', null], ['length', 0]]) {
    Object.defineProperty(OfflineAudioContext.prototype, name, {
      configurable: true, enumerable: true,
      get: browserNative(`get ${name}`, function () { return value; }),
      set: browserNative(`set ${name}`, function () {}),
    });
  }
  for (const [name, implementation] of [
    ['resume', function () {}],
    ['startRendering', function () {}],
    ['suspend', function (when) {}],
  ]) {
    Object.defineProperty(OfflineAudioContext.prototype, name, {
      configurable: true, enumerable: true, writable: true,
      value: browserNative(name, implementation),
    });
  }
  global.OfflineAudioContext = browserNative('OfflineAudioContext', OfflineAudioContext);
  global.PerformanceServerTiming = browserNative(
    'PerformanceServerTiming', class PerformanceServerTiming {},
  );
  class PerformanceTiming {}
  Object.defineProperty(PerformanceTiming.prototype, Symbol.toStringTag, {
    configurable: true, value: 'PerformanceTiming',
  });
  for (const name of ['navigationStart', 'unloadEventStart', 'unloadEventEnd',
    'redirectStart', 'redirectEnd', 'fetchStart', 'domainLookupStart',
    'domainLookupEnd', 'connectStart', 'connectEnd', 'secureConnectionStart',
    'requestStart', 'responseStart', 'responseEnd', 'domLoading', 'domInteractive',
    'domContentLoadedEventStart', 'domContentLoadedEventEnd', 'domComplete',
    'loadEventStart', 'loadEventEnd']) {
    Object.defineProperty(PerformanceTiming.prototype, name, {
      configurable: true, enumerable: true,
      get: browserNative(`get ${name}`, function () {
        if (this === PerformanceTiming.prototype) throw new TypeError('Illegal invocation');
        return 0;
      }),
    });
  }
  Object.defineProperty(PerformanceTiming.prototype, 'toJSON', {
    configurable: true, enumerable: true, writable: true,
    value: browserNative('toJSON', function () { return {}; }),
  });
  global.PerformanceTiming = browserNative('PerformanceTiming', PerformanceTiming);
  global.OffscreenCanvas = browserNative('OffscreenCanvas', class OffscreenCanvas {});
  global.FormDataEvent = browserNative('FormDataEvent', class FormDataEvent extends Event {});
  global.isSecureContext = true;
  class DOMTokenList {}
  Object.defineProperty(DOMTokenList.prototype, Symbol.toStringTag, {
    configurable: true, value: 'DOMTokenList',
  });
  for (const name of ['entries', 'keys', 'values', 'forEach', 'length', 'value',
    'add', 'contains', 'item', 'remove', 'replace', 'supports', 'toggle', 'toString']) {
    const descriptor = name === 'length' || name === 'value'
      ? {
        get: browserNative(`get ${name}`, function () {
          if (this === DOMTokenList.prototype) throw new TypeError('Illegal invocation');
          return name === 'length' ? 0 : '';
        }),
        set: name === 'value' ? browserNative('set value', function () {
          if (this === DOMTokenList.prototype) throw new TypeError('Illegal invocation');
        }) : undefined,
      }
      : { writable: true, value: browserNative(name, function () { return undefined; }) };
    Object.defineProperty(DOMTokenList.prototype, name, {
      configurable: true, enumerable: true, ...descriptor,
    });
  }
  const tokenListConstructor = Object.getOwnPropertyDescriptor(
    DOMTokenList.prototype, 'constructor');
  delete DOMTokenList.prototype.constructor;
  Object.defineProperty(DOMTokenList.prototype, 'constructor', tokenListConstructor);
  global.DOMTokenList = browserNative('DOMTokenList', DOMTokenList);
  global.WindVane = {
    version: '3.0.6',
    isAvailable: false,
    isNewBridgeAvailable: false,
    call2(a, b, c, d, e) {},
    call(a, b, c, d, e, f) {},
    fireEvent(a, b, c) {},
    getParam(a) {},
    setData(a, b) {},
    find(a, b) {},
    onSuccess(a, b, c) {},
    onFailure(a, b) {},
  };
}
global.Document = input.mode === 'et' ? function Document() {} : class Document extends EventTarget {};
if (input.mode === 'fy_nonce') Object.defineProperty(Document.prototype, 'wasDiscarded', {
  configurable: true, enumerable: true,
  get: browserNative('get wasDiscarded', function () { return false; }),
});
global.Element = class Element extends EventTarget {};
if (input.mode === 'fy_nonce') {
  const makeRect = (left, top, width, height) => ({
    x: left, y: top, left, top, right: left + width, bottom: top + height,
    width, height, toJSON() { return { x: left, y: top, left, top, right: left + width,
      bottom: top + height, width, height }; },
  });
  Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
    configurable: true, enumerable: true, writable: true,
    value: browserNative('getBoundingClientRect', function () {
      const width = Number(this.clientWidth) || 0;
      const height = Number(this.clientHeight) || 0;
      return makeRect(0, 0, width, height);
    }),
  });
  Object.defineProperty(Element.prototype, 'getClientRects', {
    configurable: true, enumerable: true,
    value: browserNative('getClientRects', function () {
      return [this.getBoundingClientRect()];
    }),
  });
  const classLists = new WeakMap();
  Object.defineProperty(Element.prototype, 'classList', {
    configurable: true, enumerable: true,
    get: browserNative('get classList', function () {
      if (!classLists.has(this)) classLists.set(this, new global.DOMTokenList());
      return classLists.get(this);
    }),
  });
  for (const [name, viewportName] of [
    ['clientWidth', 'innerWidth'], ['clientHeight', 'innerHeight'],
  ]) {
    Object.defineProperty(Element.prototype, name, {
      configurable: true, enumerable: true,
      get: browserNative(`get ${name}`, function () {
        return this === rootElement || this === bodyElement
          ? page.viewport?.[viewportName] ?? 0 : 0;
      }),
    });
  }
}
Object.defineProperty(Element.prototype, 'getAttributeNames', {
  configurable: true, enumerable: true, writable: true,
  value: browserNative('getAttributeNames', function () { return []; }),
});
Object.defineProperty(Element.prototype, 'webkitMatchesSelector', {
  configurable: true, enumerable: true, writable: true,
  value: browserNative('webkitMatchesSelector', function (selector) {
    return false;
  }),
});
Object.defineProperty(Element.prototype, Symbol.toStringTag, {
  configurable: true, value: 'Element',
});
global.HTMLElement = class HTMLElement extends Element {};
if (input.mode === 'fy_nonce') {
  global.HTMLMediaElement = class HTMLMediaElement extends HTMLElement {
    canPlayType(mime) { return input.fyAudioCanPlayTypes?.[String(mime)] ?? ''; }
  };
  Object.defineProperty(HTMLMediaElement.prototype, 'canPlayType', {
    configurable: true, enumerable: true, writable: true,
    value: browserNative('canPlayType', HTMLMediaElement.prototype.canPlayType),
  });
  global.HTMLAudioElement = class HTMLAudioElement extends HTMLMediaElement {};
  Object.defineProperty(HTMLAudioElement.prototype, Symbol.toStringTag, {
    configurable: true, value: 'HTMLAudioElement',
  });
}
HTMLElement.prototype.click = function click() {};
global.HTMLAnchorElement = class HTMLAnchorElement {};
for (const name of ['href', 'hrefTranslate']) {
  Object.defineProperty(HTMLAnchorElement.prototype, name, {
    enumerable: true, configurable: true,
    get: browserNative(`get ${name}`, function () {
      if (!(this instanceof HTMLAnchorElement)) throw new TypeError('Illegal invocation');
      return this.url?.[name] || '';
    }),
    set: browserNative(`set ${name}`, function (value) {
      if (!(this instanceof HTMLAnchorElement)) throw new TypeError('Illegal invocation');
      if (name === 'href') this.url = new URL(value, pageUrl);
    }),
  });
}
global.HTMLScriptElement = class HTMLScriptElement {};
if (input.traceFy) {
  const scriptUrls = new WeakMap();
  Object.defineProperty(HTMLScriptElement.prototype, 'src', {
    enumerable: true, configurable: true,
    get: browserNative('get src', function () { return scriptUrls.get(this) || ''; }),
    set: browserNative('set src', function (value) { scriptUrls.set(this, String(value)); }),
  });
}
global.HTMLStyleElement = class HTMLStyleElement {};
global.HTMLHeadElement = class HTMLHeadElement {};
global.HTMLBodyElement = class HTMLBodyElement {};
if (input.mode === 'fy_nonce') {
  HTMLBodyElement.prototype.scrollLeft = 0;
  HTMLBodyElement.prototype.scrollTop = 0;
}
global.HTMLHtmlElement = class HTMLHtmlElement {};
global.HTMLDivElement = class HTMLDivElement {};
global.HTMLSpanElement = class HTMLSpanElement {};
global.HTMLCanvasElement = class HTMLCanvasElement {};
for (const name of ['HTMLCanvasElement', 'HTMLDivElement', 'HTMLScriptElement']) {
  Object.defineProperty(global[name].prototype, Symbol.toStringTag, {
    configurable: true, value: name,
  });
}
for (const name of ['HTMLStyleElement', 'HTMLHeadElement', 'HTMLSpanElement']) {
  Object.defineProperty(global[name].prototype, Symbol.toStringTag, {
    configurable: true, value: name,
  });
}
Object.defineProperties(HTMLCanvasElement.prototype, {
  width: {
    get() { return this._width ?? 300; },
    set(value) { this._width = Number(value); },
    configurable: true,
  },
  height: {
    get() { return this._height ?? 150; },
    set(value) { this._height = Number(value); },
    configurable: true,
  },
});
global.HTMLLinkElement = class HTMLLinkElement {};
Object.defineProperty(HTMLLinkElement.prototype, Symbol.toStringTag, {
  configurable: true, value: 'HTMLLinkElement',
});
for (const name of ['HTMLAnchorElement', 'HTMLScriptElement', 'HTMLStyleElement',
  'HTMLHeadElement', 'HTMLBodyElement', 'HTMLHtmlElement', 'HTMLDivElement',
  'HTMLSpanElement', 'HTMLCanvasElement', 'HTMLLinkElement']) {
  Object.setPrototypeOf(global[name].prototype, HTMLElement.prototype);
}
const webglFlags = new WeakMap();
global.WebGLBuffer = browserNative('WebGLBuffer', class WebGLBuffer {});
Object.defineProperty(global.WebGLBuffer.prototype, Symbol.toStringTag, {
  configurable: true, value: 'WebGLBuffer',
});
for (const name of ['WebGLProgram', 'WebGLShader', 'WebGLUniformLocation']) {
  global[name] = browserNative(name, class WebGLObject {});
  Object.defineProperty(global[name].prototype, Symbol.toStringTag, {
    configurable: true, value: name,
  });
}
const shaderPrecisionValues = new WeakMap();
global.WebGLShaderPrecisionFormat = browserNative('WebGLShaderPrecisionFormat',
  class WebGLShaderPrecisionFormat {});
for (const name of ['rangeMin', 'rangeMax', 'precision']) {
  Object.defineProperty(global.WebGLShaderPrecisionFormat.prototype, name, {
    configurable: true, enumerable: true,
    get() { return shaderPrecisionValues.get(this)?.[name] ?? 0; },
  });
}
Object.defineProperty(global.WebGLShaderPrecisionFormat.prototype, Symbol.toStringTag, {
  configurable: true, value: 'WebGLShaderPrecisionFormat',
});
global.WebGLRenderingContext = class WebGLRenderingContext {
  createBuffer() { return new global.WebGLBuffer(); }
  createProgram() { return new global.WebGLProgram(); }
  createShader() { return new global.WebGLShader(); }
  getUniformLocation() { return new global.WebGLUniformLocation(); }
  getAttribLocation(_program, name) {
    return input.webglProfile?.attribLocations?.[name] ?? -1;
  }
  getContextAttributes() { return { ...(input.webglProfile?.contextAttributes || {}) }; }
  getExtension(name) {
    if (!input.webglProfile?.ext?.includes(name)) return null;
    if (name === 'WEBGL_debug_renderer_info') {
      webglFlags.set(this, { ...webglFlags.get(this), debugRenderer: true });
      return Object.defineProperty({ UNMASKED_VENDOR_WEBGL: 37445,
        UNMASKED_RENDERER_WEBGL: 37446 }, Symbol.toStringTag, {
        configurable: true, value: 'WebGLDebugRendererInfo',
      });
    }
    if (name === 'EXT_texture_filter_anisotropic') {
      webglFlags.set(this, { ...webglFlags.get(this), anisotropy: true });
      return Object.defineProperty({ MAX_TEXTURE_MAX_ANISOTROPY_EXT: 34047 },
        Symbol.toStringTag, { configurable: true, value: 'EXTTextureFilterAnisotropic' });
    }
    if (name === 'WEBGL_lose_context') return Object.defineProperty(
      { loseContext() {}, restoreContext() {} }, Symbol.toStringTag,
      { configurable: true, value: 'WebGLLoseContext' });
    return {};
  }
  getParameter(name) {
    if (name === 37445) return webglFlags.get(this)?.debugRenderer ? 'Google Inc. (Apple)' : null;
    if (name === 37446) {
      return webglFlags.get(this)?.debugRenderer
        ? 'ANGLE (Apple, ANGLE Metal Renderer: Apple M4, Unspecified Version)' : null;
    }
    if (name === 34047) return webglFlags.get(this)?.anisotropy ? 16 : null;
    const value = input.webglProfile?.params?.[name];
    if (value === undefined && input.webglProfile) {
      (global.__fyNullParams ||= []).push(name);
    }
    const tag = input.webglProfile?.paramTypes?.[name];
    if (tag === '[object Int32Array]') return Int32Array.from(Object.values(value));
    if (tag === '[object Float32Array]') return Float32Array.from(Object.values(value));
    return value ?? null;
  }
  getSupportedExtensions() { return input.webglProfile?.ext || []; }
  getShaderPrecisionFormat(type, precision) {
    const recorded = input.webglProfile?.precision?.find(item => item.a === type && item.b === precision);
    const result = new global.WebGLShaderPrecisionFormat();
    shaderPrecisionValues.set(result, recorded || { rangeMin: 0, rangeMax: 0, precision: 0 });
    return result;
  }
};
for (const [name, descriptor] of Object.entries(input.webglProfile?.constants || {})) {
  Object.defineProperty(WebGLRenderingContext.prototype, name, descriptor);
}
if (input.traceFy) {
  for (const method of ['getParameter', 'getExtension', 'getSupportedExtensions']) {
    const original = WebGLRenderingContext.prototype[method];
    WebGLRenderingContext.prototype[method] = function (...args) {
      const value = original.apply(this, args);
      global.__fyTrace.webgl.push({ method, args, value,
        stack: new Error().stack?.split('\n').slice(1, 5) });
      return value;
    };
  }
}
Object.defineProperty(WebGLRenderingContext.prototype, Symbol.toStringTag, {
  configurable: true, value: 'WebGLRenderingContext',
});
let lastNonceSvgImage;
global.Image = class Image extends HTMLElement {
  set src(value) {
    this._src = String(value);
    if (this._src.startsWith('data:image/svg+xml;base64,')) {
      if (input.traceNonceGt) global.__nonceSvgRawSource = this._src;
      const normalized = spawnSync('python3', [path.join(__dirname,
        '../../../tools/render_nonce_svg.py'), '--normalize'], {
        input: this._src, encoding: 'utf8', maxBuffer: 1024 * 1024,
      });
      if (normalized.status !== 0) {
        throw new Error(`SVG normalization failed: ${String(normalized.stderr).slice(0, 500)}`);
      }
      this._src = normalized.stdout;
      if (typeof input.nonceSvgReplaySource === 'string') {
        this._src = input.nonceSvgReplaySource;
      }
      lastNonceSvgImage = this;
      if (input.traceNonceGt) global.__nonceSvgSource = this._src;
    }
    let sourceHash = 2166136261;
    for (const character of this._src) {
      sourceHash = (Math.imul(sourceHash, 16777619) ^ character.charCodeAt(0)) >>> 0;
    }
    (global.__nonceImageAssignments ||= []).push({ length: this._src.length,
      prefix: this._src.slice(0, 45), onload: typeof this.onload,
      listenerTypes: [...(nonceEventListeners.get(this)?.keys() || [])], sourceHash,
      timeMs: Number(hostProcess.hrtime.bigint() / 1000000n) });
    const recorded = input.nonceImageLoads?.find(item => item.src === this._src)
      || input.nonceImageLoads?.find(item => item.loaded && this._src.startsWith('data:')
        && item.src.split(',', 1)[0] === this._src.split(',', 1)[0]);
    if (recorded?.loaded) {
      setTimeout(() => {
        this.naturalWidth = this.width = recorded.width;
        this.naturalHeight = this.height = recorded.height;
        this.complete = true;
        if (input.traceNonceGt) (global.__nonceImageDispatch ||= []).push({
          onload: typeof this.onload,
          listenerTypes: [...(nonceEventListeners.get(this)?.keys() || [])],
          srcLength: this._src.length,
          timeMs: Number(hostProcess.hrtime.bigint() / 1000000n),
        });
        try { this.dispatchEvent(new Event('load')); }
        catch (error) { global.__nonceImageError = String(error.stack || error).slice(0, 1000); }
      }, 0);
    }
  }
  get src() { return this._src; }
};
global.HTMLImageElement = global.Image;
Object.defineProperty(Image.prototype, Symbol.toStringTag, {
  configurable: true, value: 'HTMLImageElement',
});
Object.defineProperty(Image.prototype, 'constructor', {
  configurable: true, writable: true,
  value: browserNative('HTMLImageElement', Image),
});
global.ImageData = class ImageData {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this._data = new Uint8ClampedArray(width * height * 4);
  }
  get data() { return this._data; }
};

const webglContext = new Proxy(new WebGLRenderingContext(), {
  get(target, key) {
    if (key in target) return target[key];
    return (...args) => {
      if (input.traceFy && global.__fyTrace.webgl.length < 1000) {
        global.__fyTrace.webgl.push({ method: String(key),
          args: args.map(value => global.__fyValueSig?.(value) ?? typeof value),
          fallback: true, serializing: !!global.__fySerializing,
          entryCount: global.__fySerialEntryTrace?.length ?? null });
      }
      return [];
    };
  },
});
const svgDraws = new WeakMap();
const smallCanvasPixels = new WeakMap();
const canvas64DataTape = input.canvas64DataTape?.slice() || [];
global.__fySmallCanvasTrace = input.traceFyBranch ? [] : null;
function smallCanvasBuffer(canvas) {
  if (!canvas || canvas.width !== 64 || canvas.height !== 64) return null;
  let pixels = smallCanvasPixels.get(canvas);
  if (!pixels) {
    pixels = new Uint8ClampedArray(64 * 64 * 4);
    smallCanvasPixels.set(canvas, pixels);
  }
  return pixels;
}
global.CanvasRenderingContext2D = class CanvasRenderingContext2D {
  clearRect(x, y, width, height) {
    if (global.__fySmallCanvasTrace && width === 64) global.__fySmallCanvasTrace.push({method:'clearRect',canvasWidth:this.canvas?.width,fillStyle:String(this.fillStyle)});
    const pixels = smallCanvasBuffer(this.canvas);
    if (pixels && x === 0 && y === 0 && width === 64 && height === 64) pixels.fill(0);
  }
  fillRect(x, y, width, height) {
    if (global.__fySmallCanvasTrace && width === 64) global.__fySmallCanvasTrace.push({method:'fillRect',canvasWidth:this.canvas?.width,fillStyle:String(this.fillStyle)});
    const pixels = smallCanvasBuffer(this.canvas);
    if (pixels && x === 0 && y === 0 && width === 64 && height === 64 &&
        ['white', '#ffffff'].includes(String(this.fillStyle).toLowerCase())) pixels.fill(255);
  }
  fillText() {}
  drawImage(image, x, y) {
    const sourceImage = image ?? (this.canvas?.width === 1024 ? lastNonceSvgImage : null);
    if (input.traceNonceGt) (global.__nonceCanvasCalls ||= []).push({
      method: 'drawImage', x, y, sourceLength: image?.src?.length ?? null,
      sourceType: typeof image, sourceTag: Object.prototype.toString.call(image),
      sourceKeys: image && typeof image === 'object' ? Object.keys(image).slice(0, 10) : null,
      resolvedSourceLength: sourceImage?.src?.length ?? null,
      canvasWidth: this.canvas?.width, canvasHeight: this.canvas?.height,
    });
    if (x === 0 && y === 0 && sourceImage?.src?.startsWith('data:image/svg+xml;base64,')) {
      svgDraws.set(this, sourceImage.src);
    }
  }
  getImageData(x, y, width, height) {
    if (input.traceNonceGt) (global.__nonceCanvasCalls ||= []).push({
      method: 'getImageData', x, y, width, height,
      canvasWidth: this.canvas?.width, canvasHeight: this.canvas?.height,
      hasSvg: svgDraws.has(this),
    });
    const data = new ImageData(Math.max(0, Number(width) || 0),
      Math.max(0, Number(height) || 0));
    const smallPixels = smallCanvasBuffer(this.canvas);
    if (global.__fySmallCanvasTrace && width === 64) global.__fySmallCanvasTrace.push({method:'getImageData',canvasWidth:this.canvas?.width,fillStyle:String(this.fillStyle),pixel:smallPixels?.[0]});
    if (smallPixels && x === 0 && y === 0 && width === 64 && height === 64 &&
        canvas64DataTape.length) {
      data._data = new Uint8ClampedArray(canvas64DataTape.shift());
      return data;
    }
    if (smallPixels && x === 0 && y === 0 && width === 64 && height === 64) {
      data._data = new Uint8ClampedArray(smallPixels);
    }
    if (svgDraws.has(this) && x === 0 && y === 0 && width === 1024 && height === 1024) {
      const rendered = spawnSync('python3', [path.join(__dirname,
        '../../../tools/render_nonce_svg.py'), '--raw'], {
        input: svgDraws.get(this), maxBuffer: 5 * 1024 * 1024,
      });
      if (rendered.status !== 0 || rendered.stdout.length !== data._data.length) {
        throw new Error(`SVG renderer failed: ${String(rendered.stderr).slice(0, 1000)}`);
      }
      data._data = new Uint8ClampedArray(rendered.stdout);
    }
    return data;
  }
  measureText() { return { width: 0 }; }
  createLinearGradient() { return { addColorStop() {} }; }
};
Object.defineProperty(CanvasRenderingContext2D.prototype, Symbol.toStringTag, {
  configurable: true, value: 'CanvasRenderingContext2D',
});
const context2d = new Proxy(new CanvasRenderingContext2D(), { get(target, key) {
  if (input.traceNonceGt && typeof key === 'string' && (global.__nonceCanvasReads ||= []).length < 100) {
    global.__nonceCanvasReads.push(key);
  }
  return key in target ? target[key] : () => {};
} });
HTMLCanvasElement.prototype.getContext = function (...args) {
  const type = args[0];
  if (input.traceNonceGt) (global.__nonceCanvasCalls ||= []).push({ method: 'getContext', type });
  if (type === '2d') {
    context2d.canvas = this;
    return context2d;
  }
  return type === 'webgl' && input.webglProfile ? webglContext : null;
};
HTMLCanvasElement.prototype.toDataURL = function () {
  if (input.traceNonceGt) (global.__nonceCanvasCalls ||= []).push({ method: 'toDataURL' });
  return input.nonceCanvasDataTape?.shift() || input.canvasData || 'data:image/png;base64,';
};
if (input.traceFy) {
  for (const method of ['getContext', 'toDataURL']) {
    const original = HTMLCanvasElement.prototype[method];
    HTMLCanvasElement.prototype[method] = function (...args) {
      const value = original.apply(this, args);
      global.__fyTrace.canvas.push(method === 'getContext'
        ? { method, args, found: !!value,
          stack: new Error().stack?.split('\n').slice(1, 5) }
        : { method, args, width: this.width, height: this.height,
          valueLength: value.length, value,
          stack: new Error().stack?.split('\n').slice(1, 5) });
      return value;
    };
  }
}
function normalizeNonceMarkup(source) {
  if (!source.startsWith('<style>') || !source.includes('</style>')) return source;
    const normalized = spawnSync('python3', [path.join(__dirname,
      '../../../tools/render_nonce_svg.py'), '--normalize-markup'], {
      input: source, encoding: 'utf8', maxBuffer: 1024 * 1024,
    });
    if (normalized.status !== 0) {
      throw new Error(`markup normalization failed: ${String(normalized.stderr).slice(0, 500)}`);
    }
    return normalized.stdout;
}
let fyFontWidthIndex = 0;
Object.defineProperty(HTMLElement.prototype, 'innerHTML', {
  get() { return this._innerHTML || ''; },
  set(value) {
    this._innerHTML = input.nonceNormalizeMarkup === false
      ? String(value) : normalizeNonceMarkup(String(value));
    if (input.mode === 'fy_nonce' && this instanceof HTMLSpanElement &&
        this._innerHTML === 'mmmmmmmmmmlli') {
      const widths = (input.fyFontProbes || []).find(entry =>
        Array.isArray(entry.allWidths) && entry.allWidths.length === 300)?.allWidths;
      if (widths) elementWidths.set(this, widths[fyFontWidthIndex++ % widths.length]);
      elementChildren.set(this, [{ textContent: this._innerHTML, nodeType: 3,
        [Symbol.toStringTag]: 'Text' }]);
      return;
    }
    if (input.mode !== 'fy_nonce' || !this._innerHTML.startsWith('<span ')) return;
    const spans = [...this._innerHTML.matchAll(/<span\b[^>]*>(.*?)<\/span>/g)];
    const probe = (input.fyFontProbes || []).find(entry =>
      entry.markup === this._innerHTML && Array.isArray(entry.allWidths));
    if (!probe || spans.length !== probe.allWidths.length) return;
    const children = spans.map((_, index) => {
      const span = new HTMLSpanElement();
      elementWidths.set(span, probe.allWidths[index] ?? 0);
      return span;
    });
    elementChildren.set(this, children);
  },
});

function element(tag) {
  if (tag === 'a') {
    const anchor = new HTMLAnchorElement();
    for (const key of ['host', 'hostname', 'pathname', 'search', 'hash', 'protocol', 'origin']) {
      Object.defineProperty(anchor, key, { get() { return this.url?.[key] || ''; } });
    }
    return anchor;
  }
  if (tag === 'canvas') {
    return new HTMLCanvasElement();
  }
  if (tag === 'audio' && input.mode === 'fy_nonce') return new HTMLAudioElement();
  if (tag === 'img' || tag === 'image') return new Image();
  if (tag === 'script' && input.mode === 'fy_nonce') {
    (global.__fyScriptCreates ||= []).push({ time: performance.now() });
    return new HTMLScriptElement();
  }
  if (tag === 'div') return new HTMLDivElement();
  if (tag === 'span') return new HTMLSpanElement();
  if (tag === 'head') return new HTMLHeadElement();
  if (tag === 'body') return new HTMLBodyElement();
  if (tag === 'html') return new HTMLHtmlElement();
  return {
    tag, style: {}, childNodes: [], appendChild() {}, removeChild() {},
    canPlayType() { return ''; }, getContext() { return webglContext; },
  };
}

const head = element('head');
if (typeof input.nonceWorkerInput === 'string') head.__SECAPT__ = input.nonceWorkerInput;
const elementChildren = new WeakMap();
const elementWidths = new WeakMap();
const elementStyles = new WeakMap();
const styleProfiles = new WeakMap();
class CSSStyleDeclaration {
  constructor(profile) {
    if (!profile) return;
    styleProfiles.set(this, profile);
    for (const key of profile.allKeys || []) {
      Object.defineProperty(this, key, {
        configurable: true, enumerable: true, writable: true,
        value: profile.nonEmpty?.[key] ?? '',
      });
    }
    for (const [key, value] of Object.entries(profile.computedProperties || {})) {
      if (Object.hasOwn(this, key)) continue;
      Object.defineProperty(this, key, {
        configurable: true, writable: true, value,
      });
    }
  }
}
delete CSSStyleDeclaration.prototype.constructor;
for (const [key, getter, setter] of [
  ['cssText', function () { return styleProfiles.get(this)?.cssText ?? ''; }, function () {}],
  ['length', function () { return styleProfiles.get(this)?.styleLength ?? 0; }],
  ['parentRule', function () { return null; }],
  ['cssFloat', function () { return styleProfiles.get(this)?.computedProperties?.float ?? ''; }, function () {}],
]) {
  Object.defineProperty(CSSStyleDeclaration.prototype, key, {
    configurable: true, enumerable: true,
    get: browserNative(`get ${key}`, getter),
    ...(setter ? { set: browserNative(`set ${key}`, setter) } : {}),
  });
}
for (const [key, method] of [
  ['getPropertyPriority', function () { return ''; }],
  ['getPropertyValue', function (name) { return styleProfiles.get(this)?.computedProperties?.[name] ?? ''; }],
  ['item', function (index) { return styleProfiles.get(this)?.allKeys?.[index] ?? ''; }],
  ['removeProperty', function () { return ''; }],
  ['setProperty', function () {}],
]) {
  Object.defineProperty(CSSStyleDeclaration.prototype, key, {
    configurable: true, enumerable: true, writable: true,
    value: browserNative(key, method),
  });
}
Object.defineProperty(CSSStyleDeclaration.prototype, 'constructor', {
  configurable: true, writable: true, value: CSSStyleDeclaration,
});
Object.defineProperty(CSSStyleDeclaration.prototype, Symbol.toStringTag, {
  configurable: true, value: 'CSSStyleDeclaration',
});
if (input.mode === 'fy_nonce') global.CSSStyleDeclaration = CSSStyleDeclaration;
Object.defineProperty(HTMLElement.prototype, 'childNodes', {
  configurable: true, get() {
    if (!elementChildren.has(this)) elementChildren.set(this, []);
    return elementChildren.get(this);
  },
});
if (input.mode === 'fy_nonce') {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get: browserNative('get offsetWidth', function () {
      return elementWidths.get(this) ?? 0;
    }),
  });
}
Object.defineProperty(HTMLElement.prototype, 'style', {
  configurable: true, get() {
    if (!elementStyles.has(this)) elementStyles.set(this,
      input.mode === 'fy_nonce' ? new CSSStyleDeclaration(
        this === rootElement ? input.fyRootStyleProfile : null) : {});
    return elementStyles.get(this);
  },
});
HTMLElement.prototype.appendChild = function (child) {
  this.childNodes.push(child);
  return child;
};
HTMLElement.prototype.removeChild = function (child) {
  const children = this.childNodes;
  const index = children.indexOf(child);
  if (index >= 0) children.splice(index, 1);
  return child;
};
for (const prototype of [HTMLBodyElement.prototype, HTMLHtmlElement.prototype]) {
  Object.defineProperty(prototype, Symbol.toStringTag, {
    configurable: true, value: prototype.constructor.name,
  });
  Object.defineProperty(prototype, 'childNodes', {
    configurable: true, get: browserNative('get childNodes', function () {
      if (!elementChildren.has(this)) elementChildren.set(this, []);
      return elementChildren.get(this);
    }),
  });
  Object.defineProperty(prototype, 'style', {
    configurable: true, get: browserNative('get style', function () {
      if (!elementStyles.has(this)) elementStyles.set(this,
        input.mode === 'fy_nonce' ? new CSSStyleDeclaration(
          this === rootElement ? input.fyRootStyleProfile : null) : {});
      return elementStyles.get(this);
    }),
  });
  prototype.appendChild = browserNative('appendChild', function (child) {
    this.childNodes.push(child);
    if (input.mode === 'fy_nonce' && this === head && child instanceof HTMLScriptElement) {
      const src = child.src || '';
      (global.__fyScriptAppends ||= []).push({ src, time: performance.now() });
      const fixture = (input.dssResponses || []).find(response =>
        response.url === src && typeof response.body === 'string');
      if (fixture) setTimeout(() => {
        eval(fixture.body);
        if (typeof child.onload === 'function') child.onload(new Event('load'));
      }, input.dssDelayMs ?? 180);
    }
    return child;
  });
  prototype.removeChild = browserNative('removeChild', function (child) {
    const children = this.childNodes;
    const index = children.indexOf(child);
    if (index >= 0) children.splice(index, 1);
    return child;
  });
}
global.Node = class Node extends EventTarget {};
Object.setPrototypeOf(Document.prototype, Node.prototype);
global.HTMLDocument = class HTMLDocument extends Document {};
Object.defineProperty(HTMLDocument.prototype, Symbol.toStringTag, {
  configurable: true, value: 'HTMLDocument',
});
let bodyElement = element('body');
const rootElement = element('html');
if (input.mode === 'fy_nonce') global.getComputedStyle = browserNative('getComputedStyle',
  function getComputedStyle() {
    return new CSSStyleDeclaration(input.fyComputedStyleProfile);
  });
const documentState = { readyState: 'complete', currentScript: null };
let domElementQuery = 0;
const domElementIds = new Map();
const domElementReads = new Map();
class NodeList extends Array {}
Object.defineProperty(NodeList.prototype, Symbol.toStringTag, {
  configurable: true, value: 'NodeList',
});
function nodeList(elements) {
  const list = new NodeList();
  list.push(...elements);
  return list;
}
class HTMLCollection {
  constructor(length, tag) {
    Object.defineProperty(this, 'length', { value: length });
    for (let index = 0; index < length; index++) {
      Object.defineProperty(this, index, {
        enumerable: true, get: () => element(tag),
      });
    }
  }
  item(index) { return this[index] ?? null; }
  namedItem() { return null; }
  *[Symbol.iterator]() {
    for (let index = 0; index < this.length; index++) yield this[index];
  }
}
Object.defineProperty(HTMLCollection.prototype, Symbol.toStringTag, {
  configurable: true, value: 'HTMLCollection',
});
if (input.mode === 'fy_nonce') global.HTMLCollection = HTMLCollection;
for (const [name, getter, setter] of [
  ['head', () => head],
  ['cookie', readCookie, writeCookie],
  ['readyState', () => documentState.readyState],
  ['referrer', () => page.referrer || ''],
  ['title', () => ''],
  ['URL', () => pageUrl.href],
  ['visibilityState', () => 'visible'],
  ['hidden', () => false],
  ['currentScript', () => documentState.currentScript],
  ['body', () => bodyElement, value => { bodyElement = value; }],
  ['documentElement', () => rootElement],
]) {
  Object.defineProperty(Document.prototype, name, {
    enumerable: true, configurable: true,
    get: browserNative(`get ${name}`, getter),
    ...(setter ? { set: browserNative(`set ${name}`, setter) } : {}),
  });
}
for (const [name, implementation] of [
  ['createElement', element],
  ['getElementById', identifier => {
    if (input.traceNonceGt) (global.__nonceDomCalls ||= []).push({
      method: 'getElementById', identifier: String(identifier).slice(0, 80),
    });
    const key = String(identifier);
    const profile = input.nonceDomIds?.[key];
    if (Array.isArray(profile) && profile.length) {
      const index = domElementReads.get(key) || 0;
      domElementReads.set(key, index + 1);
      const tag = profile[Math.min(index, profile.length - 1)];
      if (!tag) return null;
      if (!domElementIds.has(key)) domElementIds.set(key,
        tag === '[object HTMLScriptElement]' ? new HTMLScriptElement() : element('div'));
      return domElementIds.get(key);
    }
    if (key === 'scratch-captcha-btn' || key === 'J_Header') return element('div');
    if (key === 'tb-beacon-aplus') return new HTMLScriptElement();
    return null;
  }],
  ['hasFocus', function hasFocus() {
    if (!(this instanceof Document)) throw new TypeError('Illegal invocation');
    return true;
  }],
  ['querySelector', selector => {
    if (input.traceNonceGt) (global.__nonceDomCalls ||= []).push({
      method: 'querySelector', selector: String(selector).slice(0, 80),
    });
    return null;
  }],
  ['querySelectorAll', selector => {
    if (selector === '*') {
      const counts = input.nonceDomElementCounts || [98, 100];
      const count = counts[Math.min(domElementQuery++, counts.length - 1)] || 0;
      return nodeList(Array(count).fill(null));
    }
    return nodeList([]);
  }],
  ['getElementsByTagName', name => {
    const tag = String(name).toLowerCase();
    if (input.mode === 'fy_nonce' && Number.isInteger(input.fyTagQueries?.[tag])) {
      return new HTMLCollection(input.fyTagQueries[tag], tag);
    }
    if (tag === 'head') return nodeList([head]);
    if (tag === 'body') return nodeList([bodyElement]);
    if (tag === 'html') return nodeList([rootElement]);
    if (tag === '*') {
      const counts = input.nonceDomElementCounts || [98, 100];
      const count = counts[Math.min(domElementQuery++, counts.length - 1)] || 0;
      return nodeList(Array(count).fill(null));
    }
    return nodeList([]);
  }],
]) {
  Object.defineProperty(Document.prototype, name, {
    value: browserNative(name, implementation),
    enumerable: true, configurable: true, writable: true,
  });
}
for (const name of ['addEventListener', 'removeEventListener', 'dispatchEvent']) {
  Object.defineProperty(EventTarget.prototype, name, {
    value: browserNative(name, EventTarget.prototype[name]),
    enumerable: true, configurable: true, writable: true,
  });
}
if (input.mode === 'nonce_only') {
  const addListener = EventTarget.prototype.addEventListener;
  const tracedAddListener = function (type, listener, options) {
    return addListener.call(this, type, listener, options);
  };
  Object.defineProperty(tracedAddListener, 'name', { value: '' });
  EventTarget.prototype.addEventListener = tracedAddListener;
}
const nonceDocument = new HTMLDocument();
Object.defineProperty(global, 'document', {
  enumerable: true, configurable: false,
  get: browserNative('get document', () => nonceDocument),
});
Object.defineProperty(nonceDocument, 'location', {
  enumerable: true, configurable: false,
  get: browserNative('get location', () => global.location),
  set: browserNative('set location', value => { global.location.href = String(value); }),
});
for (const hook of input.nonceDocumentHooks || []) {
  if (hook === '__update_info' || hook === '__update_pos') nonceDocument[hook] = () => {};
}
document.body.childNodes.push(element('div'));

global.StorageManager = class StorageManager {};
Object.defineProperty(StorageManager.prototype, 'estimate', {
  configurable: true, enumerable: true, writable: true,
  value: browserNative('estimate', () => Promise.resolve(input.storageEstimate || {
    quota: 10737418240, usage: 0, usageDetails: {},
  })),
});
Object.defineProperty(StorageManager.prototype, Symbol.toStringTag, {
  configurable: true, value: 'StorageManager',
});
const navigatorStorage = new StorageManager();
global.NetworkInformation = class NetworkInformation extends EventTarget {};
delete NetworkInformation.prototype.constructor;
for (const [name, getter] of [
  ['onchange', () => null],
  ['effectiveType', () => page.networkProfile?.values?.effectiveType ?? '4g'],
  ['rtt', () => page.networkProfile?.values?.rtt ?? 50],
  ['downlink', () => page.networkProfile?.values?.downlink ?? 10],
  ['saveData', () => page.networkProfile?.values?.saveData ?? false],
]) {
  Object.defineProperty(NetworkInformation.prototype, name, {
    enumerable: true, configurable: true,
    get: browserNative(`get ${name}`, getter),
  });
}
Object.defineProperty(NetworkInformation.prototype, 'constructor', {
  configurable: true, writable: true, value: NetworkInformation,
});
Object.defineProperty(NetworkInformation.prototype, Symbol.toStringTag, {
  configurable: true, value: 'NetworkInformation',
});
const networkInformation = new NetworkInformation();
global.Navigator = class Navigator {
  get userAgent() { return page.userAgent || 'Mozilla/5.0'; }
  get appName() { return 'Netscape'; }
  get appCodeName() { return 'Mozilla'; }
  get appVersion() { return (page.userAgent || '').replace(/^Mozilla\//, ''); }
  get platform() { return 'MacIntel'; }
  get language() { return 'zh-CN'; }
  get languages() { return ['zh-CN', 'zh']; }
  get vendor() { return 'Google Inc.'; }
  get hardwareConcurrency() { return 10; }
  get deviceMemory() { return 16; }
  get maxTouchPoints() { return 0; }
  get cookieEnabled() { return true; }
  get webdriver() { return false; }
  get plugins() { return Array.from({ length: 5 }, () => ({})); }
  get mimeTypes() { return Array.from({ length: 2 }, () => ({})); }
  get storage() { return navigatorStorage; }
  get connection() { return networkInformation; }
  getBattery() {
    return Promise.resolve(new BatteryManager());
  }
  vibrate() { return false; }
};
for (const name of ['userAgent', 'appName', 'appCodeName', 'appVersion', 'platform', 'language',
  'languages', 'vendor', 'hardwareConcurrency', 'deviceMemory', 'maxTouchPoints', 'cookieEnabled', 'webdriver',
  'plugins', 'mimeTypes', 'storage', 'connection']) {
  const original = Object.getOwnPropertyDescriptor(Navigator.prototype, name);
  Object.defineProperty(Navigator.prototype, name, {
    enumerable: true, configurable: true,
    get: browserNative(`get ${name}`, original.get),
  });
}
for (const name of ['getBattery', 'vibrate']) {
  Object.defineProperty(Navigator.prototype, name, {
    enumerable: true, configurable: true, writable: true,
    value: browserNative(name, Navigator.prototype[name]),
  });
}
class MimeType {
  constructor(profile, plugin) {
    for (const key of ['type', 'suffixes', 'description']) {
      Object.defineProperty(this, key, { get: browserNative(`get ${key}`, () => profile[key] ?? '') });
    }
    Object.defineProperty(this, 'enabledPlugin', { get: browserNative('get enabledPlugin', () => plugin) });
  }
}
Object.defineProperty(MimeType.prototype, Symbol.toStringTag, { value: 'MimeType' });
class Plugin {
  constructor(profile) {
    for (const key of ['name', 'filename', 'description']) {
      Object.defineProperty(this, key, { get: browserNative(`get ${key}`, () => profile[key] ?? '') });
    }
    const mimeTypes = (profile.mimeTypes || []).map(mimeType => new MimeType(mimeType, this));
    mimeTypes.forEach((mimeType, index) => {
      Object.defineProperty(this, index, { enumerable: true, value: mimeType });
      Object.defineProperty(this, mimeType.type, { value: mimeType });
    });
    Object.defineProperty(this, 'length', { get: browserNative('get length', () => mimeTypes.length) });
  }
}
Object.defineProperty(Plugin.prototype, Symbol.toStringTag, { value: 'Plugin' });
class PluginArray {
  constructor(profiles) {
    const plugins = profiles.map(profile => new Plugin(profile));
    plugins.forEach((plugin, index) => {
      Object.defineProperty(this, index, { enumerable: true, value: plugin });
      Object.defineProperty(this, plugin.name, { value: plugin });
    });
    Object.defineProperty(this, 'length', { get: browserNative('get length', () => plugins.length) });
  }
}
Object.defineProperty(PluginArray.prototype, Symbol.toStringTag, { value: 'PluginArray' });
class MimeTypeArray {
  constructor(plugins) {
    const mimeTypes = plugins[0] ? Array.from({ length: plugins[0].length }, (_, index) => plugins[0][index]) : [];
    mimeTypes.forEach((mimeType, index) => {
      Object.defineProperty(this, index, { enumerable: true, value: mimeType });
      Object.defineProperty(this, mimeType.type, { value: mimeType });
    });
    Object.defineProperty(this, 'length', { get: browserNative('get length', () => mimeTypes.length) });
  }
}
Object.defineProperty(MimeTypeArray.prototype, Symbol.toStringTag, { value: 'MimeTypeArray' });
global.Plugin = Plugin;
global.PluginArray = PluginArray;
global.MimeType = MimeType;
global.MimeTypeArray = MimeTypeArray;
const pluginValues = new PluginArray(page.plugins || []);
const mimeTypeValues = new MimeTypeArray(Array.from({ length: pluginValues.length }, (_, index) => pluginValues[index]));
for (const [name, values] of [['plugins', pluginValues], ['mimeTypes', mimeTypeValues]]) {
  Object.defineProperty(Navigator.prototype, name, {
    enumerable: true, configurable: true,
    get: browserNative(`get ${name}`, () => values),
  });
}
Object.defineProperty(Navigator.prototype, Symbol.toStringTag, {
  configurable: true, value: 'Navigator',
});
const nonceNavigator = new Navigator();
Object.defineProperty(global, 'navigator', {
  enumerable: true, configurable: true,
  get: browserNative('get navigator', () => nonceNavigator),
});
global.BatteryManager = class BatteryManager extends EventTarget {
  get charging() { return true; }
  get chargingTime() { return 0; }
  get dischargingTime() { return Infinity; }
  get level() { return 1; }
};
Object.defineProperty(BatteryManager.prototype, Symbol.toStringTag, {
  configurable: true, value: 'BatteryManager',
});
const performanceTimeOrigin = page.performanceTimeOrigin ?? Date.now() - 1000;
let noncePerformanceNow = input.noncePerformanceNow ?? 1000;
const resourcePhases = input.nonceResourceSnapshots || [input.nonceResourceEntries || []];
const fyResourceEntries = (input.fyResourceQueries || [])
  .filter(query => query.first && query.argument === query.first.name)
  .map(query => query.first);
let activeFyResourceEntries = Array.isArray(input.fyResourceEntries)
  ? input.fyResourceEntries : null;
const fyDynamicResources = [];
let activeFyMemoryValues = page.performanceMemory?.values || null;
global.__fyStackTraces = input.fyStackTraces || [];
global.__fyStackTraceIndex = 0;
const performanceMemoryPrototype = {};
for (const name of ['jsHeapSizeLimit', 'totalJSHeapSize', 'usedJSHeapSize']) {
  Object.defineProperty(performanceMemoryPrototype, name, {
    enumerable: true, get: browserNative(`get ${name}`,
      () => activeFyMemoryValues?.[name] ?? 0),
  });
}
Object.defineProperty(performanceMemoryPrototype, Symbol.toStringTag, {
  value: page.performanceMemory?.tag?.slice(8, -1) || 'MemoryInfo',
});
const performanceMemory = Object.create(performanceMemoryPrototype);
global.PerformanceNavigation = class PerformanceNavigation {
  get type() { return page.performanceNavigation?.type ?? 0; }
  get redirectCount() { return page.performanceNavigation?.redirectCount ?? 0; }
};
delete PerformanceNavigation.prototype.constructor;
for (const [name, value] of Object.entries({
  TYPE_NAVIGATE: 0, TYPE_RELOAD: 1, TYPE_BACK_FORWARD: 2, TYPE_RESERVED: 255,
})) {
  Object.defineProperty(PerformanceNavigation, name, {
    configurable: true, enumerable: true, value,
  });
  Object.defineProperty(PerformanceNavigation.prototype, name, {
    configurable: true, enumerable: true, value,
  });
}
for (const name of ['type', 'redirectCount']) {
  const original = Object.getOwnPropertyDescriptor(PerformanceNavigation.prototype, name);
  Object.defineProperty(PerformanceNavigation.prototype, name, {
    enumerable: true, configurable: true,
    get: browserNative(`get ${name}`, original.get),
  });
}
Object.defineProperty(PerformanceNavigation.prototype, 'toJSON', {
  enumerable: true, configurable: true, writable: true,
  value: browserNative('toJSON', function toJSON() {
    return page.performanceNavigation?.json || {
      type: this.type, redirectCount: this.redirectCount,
    };
  }),
});
Object.defineProperty(PerformanceNavigation.prototype, 'constructor', {
  configurable: true, writable: true, value: PerformanceNavigation,
});
Object.defineProperty(PerformanceNavigation.prototype, Symbol.toStringTag, {
  configurable: true, value: 'PerformanceNavigation',
});
const performanceNavigation = new PerformanceNavigation();
global.PerformanceTiming = class PerformanceTiming {};
delete PerformanceTiming.prototype.constructor;
for (const name of page.performanceTiming?.prototypeNames || []) {
  if (name === 'constructor') {
    Object.defineProperty(PerformanceTiming.prototype, name, {
      configurable: true, writable: true, value: PerformanceTiming,
    });
  } else if (name === 'toJSON') {
    Object.defineProperty(PerformanceTiming.prototype, name, {
      configurable: true, enumerable: true, writable: true,
      value: browserNative('toJSON', function toJSON() {
        return page.performanceTiming?.json || page.performanceTiming?.values || {};
      }),
    });
  } else {
    Object.defineProperty(PerformanceTiming.prototype, name, {
      configurable: true, enumerable: true,
      get: browserNative(`get ${name}`,
        () => page.performanceTiming?.values?.[name] ?? 0),
    });
  }
}
Object.defineProperty(PerformanceTiming.prototype, Symbol.toStringTag, {
  configurable: true, value: 'PerformanceTiming',
});
const performanceTiming = new PerformanceTiming();
let resourcePhase = 0;
const resourceValues = new WeakMap();
global.PerformanceEntry = class PerformanceEntry {
  constructor(value) { resourceValues.set(this, value); }
  get name() { return resourceValues.get(this).name; }
  get entryType() { return resourceValues.get(this).entryType; }
  get startTime() { return resourceValues.get(this).startTime; }
  get duration() { return resourceValues.get(this).duration; }
  toJSON() { return resourceValues.get(this); }
};
global.PerformanceResourceTiming = class PerformanceResourceTiming extends PerformanceEntry {
  get [Symbol.toStringTag]() { return 'PerformanceResourceTiming'; }
};
for (const key of Object.keys(resourcePhases.flat()[0] || fyResourceEntries[0] || {})) {
  if (key in PerformanceEntry.prototype) continue;
  Object.defineProperty(PerformanceResourceTiming.prototype, key, {
    get() { return resourceValues.get(this)[key]; }, enumerable: true, configurable: true,
  });
}
global.Performance = class Performance {
  get timeOrigin() { return performanceTimeOrigin; }
  get memory() { return performanceMemory; }
  get navigation() { return performanceNavigation; }
  get timing() { return performanceTiming; }
  now() { return noncePerformanceNow; }
  getEntries() { return this.getEntriesByType('resource'); }
  getEntriesByName(name, type) {
    if (input.mode === 'fy_nonce' && (!type || type === 'resource')) {
      const matched = (activeFyResourceEntries || fyResourceEntries)
        .filter(entry => entry.name === String(name));
      if (matched.length) return matched.map(entry => new PerformanceResourceTiming(entry));
    }
    return (type ? this.getEntriesByType(type) : this.getEntries())
      .filter(entry => entry.name === String(name));
  }
  getEntriesByType(type) {
    if (input.mode === 'fy_nonce' && type === 'resource') {
      return (activeFyResourceEntries || [...fyResourceEntries, ...fyDynamicResources])
        .map(entry => new PerformanceResourceTiming(entry));
    }
    return type === 'resource'
      ? (resourcePhases[resourcePhase] || []).map(entry => new PerformanceResourceTiming(entry))
      : [];
  }
};
for (const name of ['now', 'getEntries', 'getEntriesByName', 'getEntriesByType']) {
  Object.defineProperty(Performance.prototype, name, {
    enumerable: true, configurable: true, writable: true,
    value: browserNative(name, Performance.prototype[name]),
  });
}
Object.defineProperty(Performance.prototype, 'now', {
  enumerable: true, configurable: true, writable: true,
  value: function () { return noncePerformanceNow; },
});
Object.defineProperty(Performance.prototype.now, 'name', { value: '' });
Object.defineProperty(Performance.prototype, 'timeOrigin', {
  enumerable: true, configurable: true,
  get: browserNative('get timeOrigin', () => performanceTimeOrigin),
});
Object.defineProperty(Performance.prototype, 'memory', {
  enumerable: true, configurable: true,
  get: browserNative('get memory', () => performanceMemory),
});
Object.defineProperty(Performance.prototype, 'navigation', {
  enumerable: true, configurable: true,
  get: browserNative('get navigation', () => performanceNavigation),
});
Object.defineProperty(Performance.prototype, 'timing', {
  enumerable: true, configurable: true,
  get: browserNative('get timing', () => performanceTiming),
});
Object.defineProperty(Performance.prototype, Symbol.toStringTag, {
  configurable: true, value: 'Performance',
});
let noncePerformance = new Performance();
Object.defineProperty(global, 'performance', {
  enumerable: true, configurable: true,
  get: browserNative('get performance', () => noncePerformance),
  set: browserNative('set performance', value => { noncePerformance = value; }),
});
global.ScreenOrientation = browserNative('ScreenOrientation', class ScreenOrientation {
  get type() { return page.screenProfile?.orientation?.type || 'landscape-primary'; }
  get angle() { return page.screenProfile?.orientation?.angle ?? 0; }
});
Object.defineProperty(global.ScreenOrientation.prototype, Symbol.toStringTag, {
  configurable: true, value: 'ScreenOrientation',
});
const screenOrientation = new global.ScreenOrientation();
global.Screen = class Screen {
  get colorDepth() { return 24; }
  get pixelDepth() { return 24; }
  get width() { return page.screen?.width ?? 1280; }
  get height() { return page.screen?.height ?? 720; }
  get availWidth() { return page.screen?.availWidth ?? 1280; }
  get availHeight() { return page.screen?.availHeight ?? 720; }
  get availLeft() { return page.screenProfile?.values?.availLeft ?? page.screen?.availLeft ?? 0; }
  get availTop() { return page.screenProfile?.values?.availTop ?? page.screen?.availTop ?? 0; }
  get orientation() { return screenOrientation; }
  get onchange() { return null; }
  get isExtended() { return false; }
};
for (const name of ['colorDepth', 'pixelDepth', 'width', 'height', 'availWidth',
  'availHeight', 'availLeft', 'availTop', 'orientation', 'onchange', 'isExtended']) {
  const original = Object.getOwnPropertyDescriptor(Screen.prototype, name);
  Object.defineProperty(Screen.prototype, name, {
    enumerable: true, configurable: true,
    get: browserNative(`get ${name}`, original.get),
  });
}
Object.defineProperty(Screen.prototype, Symbol.toStringTag, {
  configurable: true, value: 'Screen',
});
let nonceScreen = new Screen();
Object.defineProperty(global, 'screen', {
  enumerable: true, configurable: true,
  get: browserNative('get screen', () => nonceScreen),
  set: browserNative('set screen', value => { nonceScreen = value; }),
});
global.innerWidth = page.viewport?.innerWidth ?? 1280;
global.innerHeight = page.viewport?.innerHeight ?? 720;
global.outerWidth = page.viewport?.outerWidth ?? 1280;
global.outerHeight = page.viewport?.outerHeight ?? 720;
global.devicePixelRatio = page.screen?.devicePixelRatio ?? 1;
for (const name of ['innerWidth', 'innerHeight', 'outerWidth', 'outerHeight',
  'devicePixelRatio', 'screenLeft', 'screenTop', 'screenX', 'screenY']) {
  const initial = name in global ? global[name] : page.windowPosition?.[name] ?? 0;
  let value = initial;
  Object.defineProperty(global, name, {
    enumerable: true, configurable: true,
    get: browserNative(`get ${name}`, () => value),
    set: browserNative(`set ${name}`, next => { value = next; }),
  });
}
global.Location = class Location {};
class DOMStringList {
  get length() { return 0; }
  item() { return null; }
  contains() { return false; }
}
Object.defineProperty(DOMStringList.prototype, Symbol.toStringTag, {
  configurable: true, value: 'DOMStringList',
});
if (input.mode === 'fy_nonce') global.DOMStringList = DOMStringList;
Object.defineProperty(Location.prototype, Symbol.toStringTag, {
  configurable: true, value: 'Location',
});
const nonceLocation = new Location();
for (const [name, value] of Object.entries({
  ancestorOrigins: input.mode === 'fy_nonce' ? new DOMStringList() : [],
  href: pageUrl.href, origin: pageUrl.origin,
  protocol: pageUrl.protocol, host: pageUrl.host, hostname: pageUrl.hostname,
  port: pageUrl.port, pathname: pageUrl.pathname, search: pageUrl.search,
  hash: pageUrl.hash,
})) {
  Object.defineProperty(nonceLocation, name, {
    enumerable: true, configurable: false, writable: true, value,
  });
}
for (const name of ['assign', 'reload', 'replace', 'toString']) {
  Object.defineProperty(nonceLocation, name, {
    enumerable: true, configurable: false, writable: true,
    value: browserNative(name, name === 'toString'
      ? function () { return this.href; }
      : function (value) { if (name !== 'reload') this.href = new URL(value, this.href).href; }),
  });
}
Object.defineProperty(global, 'location', {
  enumerable: true, configurable: false,
  get: browserNative('get location', () => nonceLocation),
  set: browserNative('set location', value => { nonceLocation.href = String(value); }),
});
Object.defineProperty(global, 'origin', {
  enumerable: true, configurable: true,
  get: browserNative('get origin', () => nonceLocation.origin),
});
global.History = class History {};
Object.defineProperty(History.prototype, Symbol.toStringTag, {
  configurable: true, value: 'History',
});
Object.defineProperty(History.prototype, 'length', {
  enumerable: true, configurable: true,
  get: browserNative('get length', () => page.historyLength ?? 2),
});
const nonceHistory = new History();
Object.defineProperty(global, 'history', {
  enumerable: true, configurable: true,
  get: browserNative('get history', () => nonceHistory),
});
global.chrome = {
  loadTimes: browserNative('loadTimes', () => ({})),
  csi: browserNative('csi', () => ({})), app: {},
};
global.AWSCInner = { register(_module, name) {
  if (name === 'fy') global.__fyRegisterCount = (global.__fyRegisterCount || 0) + 1;
} };
const mouseEventState = new WeakMap();
global.MouseEvent = class MouseEvent extends Event {
  constructor(type, options = {}) {
    super(type);
    mouseEventState.set(this, {
      clientX: options.clientX ?? 0, clientY: options.clientY ?? 0,
      screenX: options.screenX ?? 0, screenY: options.screenY ?? 0,
    });
  }
};
for (const [name, source] of [
  ['clientX', 'clientX'], ['clientY', 'clientY'],
  ['screenX', 'screenX'], ['screenY', 'screenY'],
  ['x', 'clientX'], ['y', 'clientY'],
  ['movementX', null], ['movementY', null],
]) {
  Object.defineProperty(MouseEvent.prototype, name, {
    enumerable: true, configurable: true,
    get: browserNative(`get ${name}`, function () {
      return source ? mouseEventState.get(this)?.[source] ?? 0 : 0;
    }),
  });
}
Object.defineProperty(MouseEvent.prototype, Symbol.toStringTag, {
  configurable: true, value: 'MouseEvent',
});
global.PointerEvent = class PointerEvent extends Event {};
Object.setPrototypeOf(PointerEvent.prototype, MouseEvent.prototype);
Object.defineProperty(PointerEvent, 'length', { value: 1 });
Object.defineProperty(PointerEvent.prototype, Symbol.toStringTag, {
  configurable: true, value: 'PointerEvent',
});
for (const [name, defaultValue] of [
  ['pointerId', 0], ['width', 1], ['height', 1], ['pressure', 0],
  ['tiltX', 0], ['tiltY', 0], ['azimuthAngle', 0],
  ['altitudeAngle', Math.PI / 2], ['tangentialPressure', 0],
  ['twist', 0], ['pointerType', ''], ['isPrimary', false],
  ['persistentDeviceId', 0],
]) {
  Object.defineProperty(PointerEvent.prototype, name, {
    configurable: true, enumerable: true,
    get: browserNative(`get ${name}`, function () {
      if (this === PointerEvent.prototype) throw new TypeError('Illegal invocation');
      return defaultValue;
    }),
  });
}
for (const [name, implementation] of [
  ['getPredictedEvents', function () { return []; }],
  ['getCoalescedEvents', function () { return [this]; }],
]) {
  Object.defineProperty(PointerEvent.prototype, name, {
    configurable: true, enumerable: true, writable: true,
    value: browserNative(name, implementation),
  });
}
Object.defineProperty(global, 'Window', {
  configurable: true, value: browserNative('Window', class Window {}),
});
Object.setPrototypeOf(global, Window.prototype);
Object.defineProperty(Window.prototype, 'constructor', {
  configurable: true, writable: true, value: Window,
});
Object.defineProperty(global, Symbol.toStringTag, {
  configurable: true, value: 'Window',
});
for (const name of ['HTMLAnchorElement', 'HTMLCanvasElement',
  'WebGLRenderingContext', 'MouseEvent', 'PointerEvent', 'webkitRTCPeerConnection']) {
  Object.defineProperty(global, name, {
    configurable: true, writable: true, enumerable: false,
    value: browserNative(name === 'webkitRTCPeerConnection'
      ? 'RTCPeerConnection' : name, global[name]),
  });
}
const nonceCrypto = global.crypto;
Object.defineProperty(nonceCrypto, 'randemUUID', {
  configurable: true, enumerable: true, writable: true,
  value: browserNative('randemUUID', () => nonceCrypto.randomUUID()),
});
const nonceCallbacks = new WeakMap();
Object.defineProperty(Object.getPrototypeOf(nonceCrypto), 'genRandomValues', {
  configurable: true,
  get() { return nonceCallbacks.get(this); },
  set(callback) {
    const wrapped = function (...args) { return callback.apply(this, args); };
    Object.defineProperties(wrapped, {
      toString: { configurable: true, value: () => String(callback) },
      length: { configurable: true, value: callback.length },
      name: { configurable: true, value: callback.name },
    });
    nonceCallbacks.set(this, wrapped);
  },
});
Object.defineProperty(global, 'crypto', {
  configurable: true, enumerable: true,
  get: browserNative('get crypto', () => nonceCrypto),
});
global.Storage = class Storage {
  constructor(initial = {}) {
    for (const [key, value] of Object.entries(initial)) this.setItem(key, value);
  }
  get length() { return Object.keys(this).length; }
  key(index) { return Object.keys(this)[index] ?? null; }
  getItem(key) {
    const value = Object.hasOwn(this, String(key)) ? this[String(key)] : null;
    if (input.mode === 'fy_nonce' && String(key) === 'lswucn') {
      (global.__fyStorageOps ||= []).push({ method: 'getItem', valueLength: value?.length ?? null,
        earlyCount: global.__fyEarlyCalls?.length ?? 0 });
    }
    return value;
  }
  setItem(key, value) {
    if (input.mode === 'fy_nonce' && String(key) === 'lswucn') {
      (global.__fyStorageOps ||= []).push({ method: 'setItem', valueLength: String(value).length,
        earlyCount: global.__fyEarlyCalls?.length ?? 0 });
    }
    Object.defineProperty(this, String(key), { configurable: true,
      enumerable: true, writable: true, value: String(value) });
  }
  removeItem(key) { delete this[String(key)]; }
  clear() { for (const key of Object.keys(this)) delete this[key]; }
};
Object.defineProperty(Storage.prototype, Symbol.toStringTag, {
  configurable: true, value: 'Storage',
});
global.localStorage = new Storage(input.nonceLocalStorage || {});
global.sessionStorage = new Storage(input.nonceSessionStorage || {});
if (input.mode !== 'fy_nonce' && !input.nonceLocalStorage && page.umidStorage) {
  localStorage.setItem('lswucn', page.umidStorage);
} else if (input.mode !== 'fy_nonce' && !input.nonceLocalStorage && page.umidToken) {
  localStorage.setItem('lswucn', `${page.umidToken}@@${Math.floor(Date.now() / 1000)}`);
}
global._config_ = input.nonceConfig || {
  renderTo: '#nc_1_nocaptcha',
  NCTOKENSTR: page.token || '', NCAPPKEY: page.appKey || '',
  action: '',
  SECDATA: page.x5secdata || '', HOST: pageUrl.origin, PATH: pageUrl.pathname,
};
if (input.mode === 'nonce_only') {
  for (const name of ['etSign', 'AWSC', 'QRCode', 'html2canvas',
    'g_tb_aplus_loaded', 'aplus_spmact']) {
    if (input.nonceInitialWindowPresence?.[name] === false) {
      delete global[name];
      continue;
    }
    if (!(name in global)) Object.defineProperty(global, name, {
      configurable: true, enumerable: true, writable: true, value: undefined,
    });
  }
}
const windowListeners = new Map();
if (input.mode === 'fy_nonce') {
  const orientationValues = new WeakMap();
  global.ondeviceorientation = null;
  global.DeviceMotionEvent = class DeviceMotionEvent extends Event {
    constructor(type, init = {}) { super(type, init); }
  };
  global.DeviceOrientationEvent = class DeviceOrientationEvent extends Event {
    constructor(type, init = {}) {
      super(type);
      orientationValues.set(this, init);
      Object.defineProperty(this, 'isTrusted', { configurable: true, value: true });
    }
    get alpha() { return orientationValues.get(this)?.alpha ?? null; }
    get beta() { return orientationValues.get(this)?.beta ?? null; }
    get gamma() { return orientationValues.get(this)?.gamma ?? null; }
    get absolute() { return orientationValues.get(this)?.absolute ?? false; }
    get interval() { return orientationValues.get(this)?.interval; }
    get timeStamp() { return orientationValues.get(this)?.timeStamp ?? 0; }
    get target() { return global; }
    get srcElement() { return global; }
    get currentTarget() { return global; }
    get [Symbol.toStringTag]() { return 'DeviceOrientationEvent'; }
  };
}
global.addEventListener = (type, callback) => {
  if (input.mode === 'fy_nonce') (global.__fyListenerOps ||= []).push({ op: 'add',
    type: String(type), time: performance.now() });
  if (typeof callback !== 'function') return;
  const callbacks = windowListeners.get(type) || [];
  callbacks.push(callback);
  windowListeners.set(type, callbacks);
};
global.removeEventListener = (type, callback) => {
  if (input.mode === 'fy_nonce') (global.__fyListenerOps ||= []).push({ op: 'remove',
    type: String(type), time: performance.now() });
  windowListeners.set(type, (windowListeners.get(type) || []).filter(item => item !== callback));
};
global.MediaQueryList = class MediaQueryList extends EventTarget {
  constructor(media) {
    super();
    this._media = String(media);
  }
  get media() { return this._media; }
  get matches() { return this._media === '(display-mode: browser)'; }
  get onchange() { return null; }
  addListener() {}
  removeListener() {}
};
Object.defineProperty(MediaQueryList.prototype, Symbol.toStringTag, {
  configurable: true, value: 'MediaQueryList',
});
global.matchMedia = browserNative('matchMedia', media => new MediaQueryList(media));
const nonceAnimationFrameTimes = input.nonceAnimationFrameTimes || [];
let nonceAnimationFrameIndex = 0;
global.requestAnimationFrame = callback => setTimeout(() => callback(
  nonceAnimationFrameTimes[nonceAnimationFrameIndex++] ?? performance.now()), 16);
global.cancelAnimationFrame = clearTimeout;
const autoEnvironmentApplied = [];
if (Array.isArray(input.nonceWindowNames) || Number.isInteger(input.nonceWindowNameCount)) {
  const originalGetOwnPropertyNames = Object.getOwnPropertyNames;
  Object.getOwnPropertyNames = browserNative('getOwnPropertyNames', function (value) {
    const names = originalGetOwnPropertyNames(value);
    if (value !== global) return names;
    const phaseNames = input.nonceWindowNamesByPhase?.[String(global.__noncePhase)];
    if (Array.isArray(phaseNames)) return [...phaseNames];
    if (Array.isArray(input.nonceWindowNames)) return [...input.nonceWindowNames];
    const count = input.nonceWindowNameCount;
    if (names.length >= count) return names.slice(0, count);
    return names.concat(Array.from({ length: count - names.length },
      (_, index) => `__window_property_${index}`));
  });
}
let activeFyWindowKeys = null;
if (Array.isArray(input.nonceWindowKeys)) {
  const originalKeys = Object.keys;
  Object.keys = browserNative('keys', function (value) {
    if (value !== global) return originalKeys(value);
    if (Array.isArray(activeFyWindowKeys)) return [...activeFyWindowKeys];
    const phaseKeys = input.nonceWindowKeysByPhase?.[String(global.__noncePhase)];
    return Array.isArray(phaseKeys) ? [...phaseKeys] : [...input.nonceWindowKeys];
  });
}
for (const [propertyPath, value] of Object.entries(input.nonceEnvironmentOverrides || {})) {
  if (propertyPath === 'document.cookie') continue;
  const [group, key] = propertyPath.split('.');
  const target = { window: global, document, navigator, screen, performance }[group];
  if (!target || !key) continue;
  const current = target[key];
  if (Object.is(current, value) || JSON.stringify(current) === JSON.stringify(value)) continue;
  let owner = target;
  let descriptor;
  while (owner && !(descriptor = Object.getOwnPropertyDescriptor(owner, key))) {
    owner = Object.getPrototypeOf(owner);
  }
  if (!descriptor) {
    Object.defineProperty(target, key, { value, configurable: true,
      enumerable: true, writable: true });
  } else if ('value' in descriptor && descriptor.writable) {
    owner[key] = value;
  } else if (descriptor.configurable && descriptor.get) {
    Object.defineProperty(owner, key, { ...descriptor, get() { return value; } });
  } else {
    continue;
  }
  autoEnvironmentApplied.push(propertyPath);
}
for (const [name, keys] of Object.entries(input.noncePrototypeKeys || {})) {
  const prototype = global[name]?.prototype;
  if (!prototype || !Array.isArray(keys)) continue;
  const descriptors = new Map(Object.entries(Object.getOwnPropertyDescriptors(prototype)));
  for (const key of Object.keys(prototype)) {
    if (Object.getOwnPropertyDescriptor(prototype, key)?.configurable) delete prototype[key];
  }
  for (const key of keys) {
    const descriptor = descriptors.get(key);
    Object.defineProperty(prototype, key, descriptor
      ? { ...descriptor, configurable: true, enumerable: true }
      : { configurable: true, enumerable: true, writable: true, value: undefined });
  }
}

function reference(name) {
  return fs.readFileSync(path.join(__dirname, '..', 'assets', name), 'utf8');
}

try {
  if (input.mode === 'fy_nonce' || input.mode === 'nonce_only') {
    if (input.traceFy) {
      global.__nonceEnvironmentProbe = true;
      eval(fs.readFileSync(path.join(__dirname,
        '../../../tools/probes/environment_snapshot.js'), 'utf8'));
    }
    const nativeGetOwnPropertyNames = Object.getOwnPropertyNames;
    let activeFyWindowNames = Array.isArray(input.fyEvalWindowNames)
      ? input.fyEvalWindowNames : null;
    const replayWindowNames = new Proxy(nativeGetOwnPropertyNames, {
      apply(target, receiver, args) {
        return args[0] === global && activeFyWindowNames
          ? [...activeFyWindowNames] : Reflect.apply(target, receiver, args);
      },
    });
    if (activeFyWindowNames) Object.getOwnPropertyNames = replayWindowNames;
    if (input.mode === 'fy_nonce') global.fyglobalopt = input.fyInitialOptions || input.fyOptions || {};
    if (typeof input.charAtValue === 'number') String.prototype.charAt.value = input.charAtValue;
    const startup = replayStartup();
    let fySource = reference('fy-index1.js');
    if (input.traceFyBranch) {
      global.__fyFeature77DateTape = Array.isArray(input.fyFeature77DateTape)
        ? input.fyFeature77DateTape : [];
      global.__fyFeature77DateIndex = 0;
      const marker = 'O==E?d[7]=d[9]?520:201:O<E?O==m?';
      if (!fySource.includes(marker)) throw new Error('FY 分支探针位置不存在');
      global.__fyBranchTrace = [];
      global.__fyEntryTrace = [];
      global.__fySerialEntryTrace = [];
      global.__fySerialVxSteps = [];
      global.__fyXf1Steps = [];
      global.__fyMr11Steps = [];
      global.__fyMr11CallCount = 0;
      global.__fyC25Steps = [];
      global.__fyC25CallCount = 0;
      Object.defineProperty(global, '__fySerializing', {
        configurable: true, writable: true, value: false,
      });
      global.__fyPixelTrace = [];
      global.__fyDgSteps = [];
      global.__fyDgWindowChecks = [];
      global.__fyDgObjectChecks = [];
      global.__fyDgStringChecks = [];
      global.__fyDgNavigatorChecks = [];
      global.__fyDgLoadChecks = [];
      global.__fyDgLoadKeyChecks = [];
      global.__fyDgFeatureChecks = [];
      global.__fyDgTopPropertyChecks = [];
      global.__fyDgElementChecks = [];
      global.__fyDgCase18Checks = [];
      global.__fyDgReturns = [];
      global.__fyDgCalls = [];
      global.__fyDg13GateChecks = [];
      global.__fyFeatureWrites = [];
      global.__fy28Context = [];
      global.__fy115Writes = [];
      global.__fy24Context = [];
      global.__fyMr22Steps = [];
      global.__fyMr56Steps = [];
      global.__fyMr3Steps = [];
      global.__fyMr43Steps = [];
      global.__fyMr43Writes = [];
      global.__fyMr43Lookup = [];
      global.__fyQzCalls = [];
      global.__fyQzSteps = [];
      global.__fyRegChanges = [];
      global.__fyR16 = undefined;
      global.__fyR18 = undefined;
    global.__fyQz5Steps = [];
    global.__fyStyleVmInputs = [];
    global.__fyStyleParentSteps = [];
    global.__fyQu3Steps = [];
    global.__fyXf0Writes = [];
    global.__fyQz5CallCount = 0;
      global.__fyJCalls = [];
      global.__fyJSteps = [];
      global.__fyJInvoke = [];
      global.__fyVx7Steps = [];
      global.__fyVx7InnerSteps = [];
      global.__fyVx7Writes = [];
      global.__fyMr22Gate = [];
      global.__fyDg13WCall = [];
      global.__fyDg14Gate = [];
      global.__fyBuilderTrace = [];
      global.__fyEbSteps = [];
      global.__fyEbCallTrace = [];
      global.__fyMr47Steps = [];
    global.__fyMr16Steps = [];
      global.__fyMr47Loop = [];
      global.__fyMr47D6Writes = [];
      global.__fyMr47Writes = [];
      global.__fyMrCalls = [];
      global.__fyUmidInput = input.fyUmidResponse ||
        (page.umidToken ? [0, 'cn', page.umidToken] : null);
      global.__fySerializerCalls = [];
      global.__fySerializerReplayBytes = input.fySerializerReplayBytes || null;
      global.__fyValueSig = value => {
        if (typeof value === 'string') {
          let hash = 2166136261;
          for (let index = 0; index < value.length; index++) {
            hash = (Math.imul(hash, 16777619) ^ value.charCodeAt(index)) >>> 0;
          }
          return ['string', value.length, hash];
        }
        if (value === null || ['number', 'boolean', 'undefined'].includes(typeof value)) {
          return [typeof value, value];
        }
        if (Array.isArray(value)) return ['array', value.length,
          Array.from(value.slice(0, 8), item => typeof item === 'number' ||
            typeof item === 'boolean' ? item : typeof item)];
        const keys = Object.keys(value);
        if (keys.includes('MaxMTLog')) {
          const encoded = JSON.stringify(value);
          let hash = 2166136261;
          for (let index = 0; index < encoded.length; index++) {
            hash = (Math.imul(hash, 16777619) ^ encoded.charCodeAt(index)) >>> 0;
          }
          return [Object.prototype.toString.call(value), keys.length, encoded.length, hash];
        }
        return [Object.prototype.toString.call(value), keys.length];
      };
      global.__fyDeepSig = (value, detail = false) => {
        const seen = new WeakSet();
        const walk = (item, depth) => {
          if (item === null || typeof item !== 'object') return global.__fyValueSig(item);
          if (item === global) return ['window'];
          if (seen.has(item)) return ['cycle'];
          seen.add(item);
          const tag = Object.prototype.toString.call(item);
          const keys = Object.keys(item);
          if (depth === 0) return [tag, keys.length];
          return [tag, keys.length, keys.slice(0, 256).map(key => {
            try { return [key, walk(item[key], depth - 1)]; }
            catch (error) { return [key, 'getter-error']; }
          })];
        };
        const normalized = walk(value, 4);
        if (detail) return normalized;
        const encoded = JSON.stringify(normalized);
        let hash = 2166136261;
        for (let index = 0; index < encoded.length; index++) {
          hash = (Math.imul(hash, 16777619) ^ encoded.charCodeAt(index)) >>> 0;
        }
        return [encoded.length, hash];
      };
      Object.defineProperty(global, '__fyWindowDescriptorSnapshot', {
        configurable: true, writable: true, value: null,
      });
      Object.defineProperty(global, '__fyDescribeWindow', {
        configurable: true, value: () => Object.fromEntries(
          Object.getOwnPropertyNames(global).map(name => {
            const descriptor = Object.getOwnPropertyDescriptor(global, name);
            if (!descriptor) return [name, null];
            return [name, {
              enumerable: descriptor.enumerable,
              configurable: descriptor.configurable,
              writable: 'writable' in descriptor ? descriptor.writable : null,
              value: 'value' in descriptor ? global.__fyValueSig(descriptor.value) : null,
              getter: typeof descriptor.get === 'function'
                ? global.__fyValueSig(descriptor.get) : null,
            }];
          }),
        ),
      });
      global.__fy24AlternateContext = [];
      global.__fyResourceQueries = [];
      fySource = fySource.replace(marker,
        '(globalThis.__fyBranchTrace.length<2000&&globalThis.__fyBranchTrace.push({opcode:O,pc:d[7],flag:!!d[9],stack:new Error().stack.split("\\n").slice(1,5)}),O)==E?d[7]=d[9]?520:201:O<E?O==m?');
      for (const [needle, code] of [
        ['function DG(zU,dC,eM,Kt,wZ,Hj){', 'DG'],
        ['function mr(v,z,s,AN,JY,eo){', 'mr'],
        ['function xf(yg,kZ,dn,uu,h5,L2){', 'xf'],
      ]) {
        if (!fySource.includes(needle)) throw new Error(`FY 入口探针位置不存在: ${code}`);
        const [arg, rest] = code === 'DG' ? ['zU', ['dC', 'eM', 'Kt', 'wZ', 'Hj']]
          : code === 'mr' ? ['v', ['z', 's', 'AN', 'JY', 'eo']]
            : ['yg', ['kZ', 'dn', 'uu', 'h5', 'L2']];
        const types = rest.map(name => `typeof ${name}`).join(',');
        const parts = code === 'DG'
          ? ',parts:[dC,eM].map(value=>({tag:Object.prototype.toString.call(value),keys:Object.getOwnPropertyNames(value).slice(0,30),length:value?.length}))'
          : '';
        const dgCall = code === 'DG'
          ? 'if(globalThis.__fyDgCalls.length<50)globalThis.__fyDgCalls.push({zU,earlyCount:globalThis.__fyEarlyCalls?.length??0,dCLength:dC?.length,dCTag:Object.prototype.toString.call(dC),dCKeys:Object.getOwnPropertyNames(dC).slice(0,20),eMTag:Object.prototype.toString.call(eM),eMName:eM?.name,stack:new Error().stack.split("\\n").slice(1,5)});'
          : code === 'mr'
            ? 'globalThis.__fyLastMr=v;if(input.fyMrSource&&!nativeFunctionSources.has(mr))nativeFunctionSources.set(mr,input.fyMrSource);if(v===10&&globalThis.__fyUmidInput&&!globalThis.__fyUmidReplayed){globalThis.__fyUmidReplayed=true;mr.call(this,28,globalThis.__fyUmidInput)}if(globalThis.__fyMrCalls.length<500)globalThis.__fyMrCalls.push({v:typeof v==="number"||typeof v==="string"?v:null,vType:typeof v,thisTag:Object.prototype.toString.call(this),thisValue:typeof this==="number"?this:null,vTag:Object.prototype.toString.call(v),vKeys:v&&typeof v==="object"?Object.getOwnPropertyNames(v).slice(0,20):null,args:[z,s,AN,JY,eo].map(globalThis.__fyValueSig),eventType:v?.type,eventData:v?.type==="deviceorientation"?{alpha:v.alpha,beta:v.beta,gamma:v.gamma,absolute:v.absolute,interval:v.interval}:null,targetTag:Object.prototype.toString.call(v?.target),dataTag:Object.prototype.toString.call(v?.data),isTrusted:v?.isTrusted,timeStamp:v?.timeStamp,time:performance.now(),earlyCount:globalThis.__fyEarlyCalls?.length??0,stack:new Error().stack.split("\\n").slice(1,5)});'
            : '';
        fySource = fySource.replace(needle, `${needle}${dgCall}if(globalThis.__fyEntryTrace.length<500)globalThis.__fyEntryTrace.push({fn:"${code}",arg:${arg},types:[${types}]${parts},stack:new Error().stack.split("\\n").slice(1,4)});${code === 'xf' ? 'if(globalThis.__fySerializing&&globalThis.__fySerialEntryTrace.length<3000)globalThis.__fySerialEntryTrace.push({arg:yg,argSig:[kZ,dn,uu,h5,L2].map(globalThis.__fyValueSig),argDeep:[kZ,dn,uu,h5,L2].map(globalThis.__fyDeepSig),argRaw:((globalThis.__fySerialEntryTrace.length>=270&&globalThis.__fySerialEntryTrace.length<=285)||(globalThis.__fySerialEntryTrace.length>=450&&globalThis.__fySerialEntryTrace.length<=470))?(Array.isArray(kZ)?kZ.map(v=>typeof v==="string"?v.slice(0,120):typeof v==="number"?v:null):typeof kZ==="string"?kZ.slice(0,120):typeof kZ==="number"?kZ:null):null,jsonState:globalThis.__fySerialEntryTrace.length===458?{source:String(JSON.stringify).slice(0,140),probe:JSON.stringify([1]),sigSource:String(globalThis.__fyDeepSig).slice(0,100)}:null,stack:((globalThis.__fySerialEntryTrace.length>=220&&globalThis.__fySerialEntryTrace.length<240)||(globalThis.__fySerialEntryTrace.length>=538&&globalThis.__fySerialEntryTrace.length<=545))?new Error().stack.split("\\n").slice(1,5):null});' : ''}`);
      }
      const xf1StepNeedle = 'for(d[S]=kZ,d[x]=dn,d[6]=uu,d[8]=h5,d[4]=a;d[4]!==U;){var x$=d[4]&o,eb,O=d[4]>>5&o;switch(x$){';
      if (!fySource.includes(xf1StepNeedle)) throw new Error('FY xf(1) 步进探针位置不存在');
      fySource = fySource.replace(xf1StepNeedle,
        'for(d[S]=kZ,d[x]=dn,d[6]=uu,d[8]=h5,d[4]=a;d[4]!==U;){var x$=d[4]&o,eb,O=d[4]>>5&o;if(globalThis.__fySerializing&&yg===0&&globalThis.__fySerialEntryTrace.length>=443&&globalThis.__fySerialEntryTrace.length<=600&&globalThis.__fyStyleParentSteps.length<1500)globalThis.__fyStyleParentSteps.push({yg,pc:d[4],entryCount:globalThis.__fySerialEntryTrace.length,rSig:globalThis.__fyValueSig(r),qSig:globalThis.__fyValueSig(Q),q0Sig:globalThis.__fyValueSig(Q?.[0]),rRaw:typeof r==="string"||typeof r==="number"?r:null,zDeep:globalThis.__fyDeepSig(z),zTail:Array.isArray(z)?z.slice(-12):null,mrDeep:globalThis.__fyDeepSig(mr),mrTail:Array.isArray(mr)?mr.slice(-12):null,d15Deep:globalThis.__fyDeepSig(d[15]),d15Tail:Array.isArray(d[15])?d[15].slice(-12):null,anSig:globalThis.__fyValueSig(AN),anRaw:typeof AN==="number"?AN:null,focus:[238,291,340,428].includes(d[4])?{B:globalThis.__fyValueSig(B),M:globalThis.__fyValueSig(M),P:globalThis.__fyValueSig(P),v:globalThis.__fyValueSig(v),z:globalThis.__fyValueSig(z),s:globalThis.__fyValueSig(s),EL:globalThis.__fyValueSig(EL),Q:globalThis.__fyValueSig(Q),Z:globalThis.__fyValueSig(Z),memory:globalThis.__fyValueSig(globalThis.performance?.memory)}:null,regSig:Object.keys(d).map(key=>[key,globalThis.__fyValueSig(d[key])])});if(yg===1&&globalThis.__fyXf1Steps.length<5000){var __fyStepIndex=globalThis.__fyXf1Steps.length;globalThis.__fyXf1Steps.push({pc:d[4],branch:x$,opcode:O,entryCount:globalThis.__fySerialEntryTrace.length,regs:__fyStepIndex<=1550?Object.keys(d).map(function(key){return[key,globalThis.__fyValueSig(d[key])]}):null,deep12:__fyStepIndex<=1550?globalThis.__fyDeepSig(d[12]):null,deep9:__fyStepIndex<=1550?globalThis.__fyDeepSig(d[9]):null,raw12:__fyStepIndex>=138&&__fyStepIndex<=142?Array.from(d[12]||[]):null,raw11:__fyStepIndex===230||__fyStepIndex===431?Array.from(d[11]||[]):null,raw24:__fyStepIndex===431?Array.from(d[24]||[]):null,styleValues:__fyStepIndex===230?Array.from(d[11]||[],function(name){return d[5]?.[name]}):null,focus:__fyStepIndex>=1475&&__fyStepIndex<=1500?{OA,B,r,sLen:s?.length,sSig:globalThis.__fyValueSig(s),sBytes:d[4]===551&&OA>650&&Array.isArray(s)?s.slice():null,sSlice:typeof s==="string"?s.slice(Math.max(0,OA-40),OA+80):null,M:globalThis.__fyValueSig(M)}:null,qSig:__fyStepIndex<=1550?globalThis.__fyValueSig(q):null,qDeep:__fyStepIndex<=1550?globalThis.__fyDeepSig(q):null,qDetail:__fyStepIndex>=218&&__fyStepIndex<=222?globalThis.__fyDeepSig(q,true):null,qItems:[231,382].includes(__fyStepIndex)?Array.from(q||[],globalThis.__fyValueSig):null,wZDetail:__fyStepIndex>=218&&__fyStepIndex<=220?globalThis.__fyDeepSig(wZ,true):null})}switch(x$){');
      for (const needle of ['q=q[C[p]](hS)):q[C[E]](0),',
                            'q=q[C[p]](xF)):q[C[E]](0),']) {
        if (!fySource.includes(needle)) throw new Error('FY 样式拼接探针位置不存在');
        fySource = fySource.replaceAll(needle, `${needle}globalThis.__fySerializing&&yg===1&&globalThis.__fyStyleVmInputs.push({kind:"concat",entryCount:globalThis.__fySerialEntryTrace.length,length:q.length,item133:q[133]??null,tail:q.slice(-5)}),`);
      }
      if (!fySource.includes('FL=d[6][C[K]],AN=92,J=C[$][AN],J=FL[AN=J],FL=J&N')) throw new Error('FY pc736 探针位置不存在');
      fySource = fySource.replace('FL=d[6][C[K]],AN=92,J=C[$][AN],J=FL[AN=J],FL=J&N', 'FL=d[6][C[K]],AN=92,J=C[$][AN],J=FL[AN=J],globalThis.__fyStyleVmInputs.push({kind:"pc736",root:C[K],rootTag:Object.prototype.toString.call(FL),key:AN,value:J,valueType:typeof J,rootKeys:Object.getOwnPropertyNames(FL).slice(0,20)}),FL=J&N');
      if (!fySource.includes('(Kt=c7[OA=Kt])&&(AN=4)),d[4]=736')) throw new Error('FY pc749 探针位置不存在');
      fySource = fySource.replace('(Kt=c7[OA=Kt])&&(AN=4)),d[4]=736', '(Kt=c7[OA=Kt])&&(AN=4)),globalThis.__fyStyleVmInputs.push({kind:"pc749",method:W(C[0],null,L,X),argument:EL,resultTag:Object.prototype.toString.call(c7),property:OA,valueSig:globalThis.__fyValueSig(Kt),an:AN}),d[4]=736');
      if (!fySource.includes('(xM=W(C[F],null,S,d[x],d[6],d[8]))?')) throw new Error('FY pc369 探针位置不存在');
      fySource = fySource.replace('(xM=W(C[F],null,S,d[x],d[6],d[8]))?', '(xM=W(C[F],null,S,d[x],d[6],d[8]),globalThis.__fyStyleVmInputs.push({kind:"pc369",mode:S,returnSig:globalThis.__fyValueSig(xM),returnRaw:Array.isArray(xM)?xM.slice():null}))?');
      if (!fySource.includes('d[x]=d[L][eI],d[m]=d[x][C[40]],d[x]=d[m][C[t]],d[m]=d[1],d[m][0]=DG(k,d[x],z,d[L])')) throw new Error('FY vx13 探针位置不存在');
      fySource = fySource.replace('d[x]=d[L][eI],d[m]=d[x][C[40]],d[x]=d[m][C[t]],d[m]=d[1],d[m][0]=DG(k,d[x],z,d[L])', 'd[x]=d[L][eI],d[m]=d[x][C[40]],d[x]=d[m][C[t]],globalThis.__fyStyleVmInputs.push({kind:"vx13input",rootKey:eI,midKey:C[40],leafKey:C[t],targetSig:globalThis.__fyValueSig(d[x]),targetSource:typeof d[x]==="function"?String(d[x]).slice(0,160):null}),d[m]=d[1],d[m][0]=DG(k,d[x],z,d[L]),globalThis.__fyStyleVmInputs.push({kind:"vx13result",value:d[m][0]})');
      if (!fySource.includes('(RK=W(C[F],null,2,d[x],d[6],d[8]))?')) throw new Error('FY vx2 探针位置不存在');
      fySource = fySource.replace('(RK=W(C[F],null,2,d[x],d[6],d[8]))?', '(RK=W(C[F],null,2,d[x],d[6],d[8]),globalThis.__fyStyleVmInputs.push({kind:"vx2result",returnSig:globalThis.__fyValueSig(RK),returnRaw:Array.isArray(RK)?RK.slice():null}))?');
      if (!fySource.includes('d[8]=d[m],d[k]=d[8]?199:47')) throw new Error('FY vx2 pc526 探针位置不存在');
      fySource = fySource.replace('d[8]=d[m],d[k]=d[8]?199:47', 'd[8]=d[m],globalThis.__fyStyleVmInputs.push({kind:"vx2pc526",key:d[3],targetTag:Object.prototype.toString.call(d[9]),targetKeys:d[9]&&typeof d[9]==="object"?Object.getOwnPropertyNames(d[9]).slice(0,20):null,valueSig:globalThis.__fyValueSig(d[8])}),d[k]=d[8]?199:47');
      if (!fySource.includes('d[m]=d[E][d[3]],d[k]=65')) throw new Error('FY vx2 pc13 探针位置不存在');
      fySource = fySource.replace('d[m]=d[E][d[3]],d[k]=65', 'd[m]=d[E][d[3]],globalThis.__fyStyleVmInputs.push({kind:"vx2pc13",key:d[3],targetTag:Object.prototype.toString.call(d[E]),isRoot:d[E]===document.documentElement,isBody:d[E]===document.body,valueSig:globalThis.__fyValueSig(d[m])}),d[k]=65');
      if (!fySource.includes('d[p]=d[i][d[x]],d[k]=d[p]?423:41')) throw new Error('FY mr25 pc39 探针位置不存在');
      fySource = fySource.replace('d[p]=d[i][d[x]],d[k]=d[p]?423:41', 'd[p]=d[i][d[x]],globalThis.__fyStyleVmInputs.push({kind:"mr25pc39",key:d[x],targetTag:Object.prototype.toString.call(d[i]),valueSig:globalThis.__fyValueSig(d[p]),own:Object.prototype.hasOwnProperty.call(d[i],d[x])}),d[k]=d[p]?423:41');
      if (!fySource.includes('d[m]=Error[d[S]],r=d[m]?463:78')) throw new Error('FY Qu14 pc397 探针位置不存在');
      fySource = fySource.replace('d[m]=Error[d[S]],r=d[m]?463:78', 'd[m]=Error[d[S]],globalThis.__fyStyleVmInputs.push({kind:"qu14pc397",key:d[S],valueSig:globalThis.__fyValueSig(d[m]),own:Object.prototype.hasOwnProperty.call(Error,d[S])}),r=d[m]?463:78');
      const styleVmNeedle = 'M=r,r=W(C[F],null,8,M,d[x]),d[E][C[E]](4)';
      if (!fySource.includes(styleVmNeedle)) throw new Error('FY style VM 探针位置不存在');
      fySource = fySource.replace(styleVmNeedle, 'M=r,globalThis.__fySerializing&&globalThis.__fyStyleVmInputs.length<100&&globalThis.__fyStyleVmInputs.push({yg,entryCount:globalThis.__fySerialEntryTrace.length,pc:d[4],mSig:globalThis.__fyValueSig(M),mRaw:typeof M==="number"||typeof M==="string"?M:null,xSig:globalThis.__fyValueSig(d[x]),qLength:q?.length}),r=W(C[F],null,8,M,d[x]),d[E][C[E]](4)');
      const styleWindowNeedle = 'd[k]=W(C[l],null,8,89),d[L]=d[6][d[k]]';
      if (!fySource.includes(styleWindowNeedle)) throw new Error('FY style window 探针位置不存在');
      fySource = fySource.replace(styleWindowNeedle, 'd[k]=W(C[l],null,8,89),d[L]=d[6][d[k]],globalThis.__fyStyleVmInputs.push({kind:"windowCheck",key:d[k],valueSig:globalThis.__fyValueSig(d[L]),truthy:!!d[L],own:Object.prototype.hasOwnProperty.call(d[6],d[k])})');
      const styleNamesNeedle = 'd[2]=Object[Lt](window),d[1]=d[2][C[x]]';
      if (!fySource.includes(styleNamesNeedle)) throw new Error('FY style window names 探针位置不存在');
      fySource = fySource.replace(styleNamesNeedle, 'd[2]=Object[Lt](window),globalThis.__fyStyleVmInputs.push({kind:"windowNames",method:Lt,length:d[2].length,head:d[2].slice(0,5),tail:d[2].slice(-5)}),d[1]=d[2][C[x]]');
      const styleTagNeedle = 'd[1]=Z[RW](d[2]),Z=(Z=d[1])?d[1][C[x]]:0';
      if (!fySource.includes(styleTagNeedle)) throw new Error('FY style tag 探针位置不存在');
      fySource = fySource.replace(styleTagNeedle, 'd[1]=Z[RW](d[2]),globalThis.__fyStyleVmInputs.push({kind:"tagQuery",method:RW,tag:d[2],length:d[1]?.length,valueTag:Object.prototype.toString.call(d[1])}),Z=(Z=d[1])?d[1][C[x]]:0');
      const styleBranchNeedle = 'M=P,d[4]=M?709:303';
      if (!fySource.includes(styleBranchNeedle)) throw new Error('FY style branch 探针位置不存在');
      fySource = fySource.replace(styleBranchNeedle, 'M=P,globalThis.__fyStyleVmInputs.push({kind:"branch453",rootKey:C[K],rootSig:globalThis.__fyValueSig(v[C[K]]),lookupKey:z,resultSig:globalThis.__fyValueSig(M),truthy:!!M}),d[4]=M?709:303');
      const canPlayNeedle = 'd[1]=v[Q],d[0]=z[d[2]](d[1]),P+=d[0]';
      if (!fySource.includes(canPlayNeedle)) throw new Error('FY audio 探针位置不存在');
      fySource = fySource.replace(canPlayNeedle, 'd[1]=v[Q],d[0]=z[d[2]](d[1]),globalThis.__fyStyleVmInputs.push({kind:"canPlayType",mime:d[1],result:d[0],method:d[2]}),P+=d[0]');
      const pc50Needle = 'B=W(C[X],null,3,d[x],d[6]),r=W(C[F],null,8,B,d[x])';
      if (!fySource.includes(pc50Needle)) throw new Error('FY pc50 探针位置不存在');
      fySource = fySource.replace(pc50Needle, 'B=W(C[X],null,3,d[x],d[6]),globalThis.__fyStyleVmInputs.push({kind:"pc50middle",bSig:globalThis.__fyValueSig(B),bRaw:typeof B==="number"||typeof B==="string"?B:Array.isArray(B)?B.slice(0,10):null,xSig:globalThis.__fyValueSig(d[x]),d6Sig:globalThis.__fyValueSig(d[6])}),r=W(C[F],null,8,B,d[x])');
      const qu3Needle = 'C[X]=function Qu(EL,c7,Z,Q,s){var d=[];d[8]=c7;for(var r=G;r!==U;){var vx,JY,O=r>>5&o;switch(r&o){';
      if (!fySource.includes(qu3Needle)) throw new Error('FY Qu3 探针位置不存在');
      fySource = fySource.replace(qu3Needle, 'C[X]=function Qu(EL,c7,Z,Q,s){globalThis.__fyLastQu=EL;var d=[];d[8]=c7;for(var r=G;r!==U;){var vx,JY,O=r>>5&o;if(EL===13&&r===520&&globalThis.__fyStackTraceIndex<globalThis.__fyStackTraces.length)d[1]=d[7]=d[12]=globalThis.__fyStackTraces[globalThis.__fyStackTraceIndex++];if((EL===3||EL===13||EL===14)&&globalThis.__fySerializing&&globalThis.__fyQu3Steps.length<1500)globalThis.__fyQu3Steps.push({el:EL,pc:r,branch:r&o,opcode:O,entryCount:globalThis.__fySerialEntryTrace.length,regs:Object.keys(d).map(key=>[key,globalThis.__fyValueSig(d[key])]),qSig:globalThis.__fyValueSig(Q),zSig:globalThis.__fyValueSig(Z),sSig:globalThis.__fyValueSig(s),raw:EL===13&&[520,172].includes(r)?{d1:d[1],d7:d[7]}:null,audioInfo:r===77?{method:d[7],index:d[m],mime:d[0]?.[d[m]],receiverTag:Object.prototype.toString.call(d[1]),methodType:typeof d[1]?.[d[7]]}:null});switch(r&o){');
      const videoCanPlayNeedle = 'd[E]=d[1][d[7]](d[k]),P+=d[E]';
      if (!fySource.includes(videoCanPlayNeedle)) throw new Error('FY video 探针位置不存在');
      fySource = fySource.replace(videoCanPlayNeedle, 'd[E]=d[1][d[7]](d[k]),globalThis.__fyStyleVmInputs.push({kind:"videoCanPlayType",mime:d[k],result:d[E]}),P+=d[E]');
      const memoryReadNeedle = 'B=P[M],d[4]=291';
      if (!fySource.includes(memoryReadNeedle)) throw new Error('FY memory 探针位置不存在');
      fySource = fySource.replace(memoryReadNeedle, 'B=P[M],globalThis.__fyStyleVmInputs.push({kind:"memoryRead",property:v,memoryTag:Object.prototype.toString.call(P),heapKey:M,heapValue:B,rSig:globalThis.__fyValueSig(r)}),d[4]=291');
      const xf0WriteNeedle = 'var d=[];for(d[S]=kZ,d[x]=dn,d[6]=uu,d[8]=h5,d[4]=a;';
      const xf276Needle = 'Z=d[2]+d[1],d[2]=Q[Z],Q=0|d[2]';
      if (!fySource.includes(xf276Needle)) throw new Error('FY xf276 探针位置不存在');
      fySource = fySource.replace(xf276Needle, 'Z=d[2]+d[1],globalThis.__fySerializing&&yg===1&&globalThis.__fyStyleVmInputs.push({kind:"xf276",key:Z,rootTag:Object.prototype.toString.call(Q),rootKeys:Object.getOwnPropertyNames(Q).slice(0,15),valueSig:globalThis.__fyValueSig(Q[Z]),valueType:typeof Q[Z]}),d[2]=Q[Z],Q=0|d[2]');
      if (!fySource.includes(xf0WriteNeedle)) throw new Error('FY xf0 write 探针位置不存在');
      fySource = fySource.replace(xf0WriteNeedle, 'var d=yg===0&&globalThis.__fySerializing?new Proxy([],{set(t,key,val,receiver){if(key==="2"&&[238,291,340].includes(t[4])&&globalThis.__fyXf0Writes.length<200)globalThis.__fyXf0Writes.push({pc:t[4],oldSig:globalThis.__fyValueSig(t[2]),newSig:globalThis.__fyValueSig(val),oldRaw:typeof t[2]==="string"?t[2]:null,newRaw:typeof val==="string"?val:null,stack:String(new Error().stack).split(String.fromCharCode(10)).slice(1,4)});return Reflect.set(t,key,val,receiver)}}):[];for(d[S]=kZ,d[x]=dn,d[6]=uu,d[8]=h5,d[4]=a;');
      const mr11Needle = 'C[4]=function mr(xF,QO,z,FL,eo){var d=[];for(d[38]=QO,d[m]=b;d[m]!==U;){var Kz=d[m]&o,yn=d[m]>>5,O=yn&o;switch(Kz){';
      if (!fySource.includes(mr11Needle)) throw new Error('FY mr(11) 探针位置不存在');
      fySource = fySource.replace(mr11Needle,
        'C[4]=function mr(xF,QO,z,FL,eo){var d=[];var __fyMr11Call=xF===11&&globalThis.__fySerializing?++globalThis.__fyMr11CallCount:0;for(d[38]=QO,d[m]=b;d[m]!==U;){var Kz=d[m]&o,yn=d[m]>>5,O=yn&o;if(__fyMr11Call&&globalThis.__fyMr11Steps.length<5000){var __fyMr11Index=globalThis.__fyMr11Steps.length;globalThis.__fyMr11Steps.push({call:__fyMr11Call,pc:d[m],branch:Kz,opcode:O,entryCount:globalThis.__fySerialEntryTrace.length,regs:__fyMr11Index<300?Object.keys(d).map(function(key){return[key,globalThis.__fyValueSig(d[key])]}):null})}switch(Kz){');
      const c25Needle = 'C[F]=function vx(yi,OA,z,RK,HZ){var d=[];for(d[L]=RK,d[k]=i;d[k]!==U;){var Qu=d[k]&o,JY,O=d[k]>>5&o;switch(Qu){';
      if (!fySource.includes(c25Needle)) throw new Error('FY C25 探针位置不存在');
      fySource = fySource.replace(c25Needle,
        'C[F]=function vx(yi,OA,z,RK,HZ){var d=[];var __fyPrevD2Length=0,__fyFontCursor=0;var __fyC25Call=(yi===2||yi===3||yi===13||yi===14)&&globalThis.__fySerializing?++globalThis.__fyC25CallCount:0;for(d[L]=RK,d[k]=i;d[k]!==U;){var Qu=d[k]&o,JY,O=d[k]>>5&o;if(__fyC25Call&&globalThis.__fyC25Steps.length<5000)globalThis.__fyC25Steps.push({call:__fyC25Call,yi,pc:d[k],branch:Qu,opcode:O,entryCount:globalThis.__fySerialEntryTrace.length,regs:Object.keys(d).map(function(key){return[key,globalThis.__fyValueSig(d[key])]}),closure:{J:globalThis.__fyValueSig(J),r:globalThis.__fyValueSig(r),P:globalThis.__fyValueSig(P),M:globalThis.__fyValueSig(M),B:globalThis.__fyValueSig(B),v:globalThis.__fyValueSig(v),q:globalThis.__fyValueSig(q),Z:globalThis.__fyValueSig(Z),Q:globalThis.__fyValueSig(Q),s:globalThis.__fyValueSig(s),FL:globalThis.__fyValueSig(FL),EL:globalThis.__fyValueSig(EL),Dh:globalThis.__fyValueSig(Dh),Eb:globalThis.__fyValueSig(Eb)},jDetail:__fyC25Call===1?globalThis.__fyDeepSig(J,true):null,dDetail:__fyC25Call===1?globalThis.__fyDeepSig(d,true):null});if(yi===0&&d[k]===519&&d[7] instanceof HTMLSpanElement&&d[7].innerHTML==="mmmmmmmmmmlli"&&Array.isArray(d[2])){var __fyWidths=(input.fyFontProbes||[]).find(entry=>Array.isArray(entry.allWidths)&&entry.allWidths.length===300)?.allWidths;if(__fyWidths&&d[2].length>__fyPrevD2Length)d[2][d[2].length-1]=__fyWidths[__fyFontCursor++%__fyWidths.length];__fyPrevD2Length=d[2].length;}if(yi===0&&globalThis.__fySerializing&&globalThis.__fySerialVxSteps.length>=2020&&globalThis.__fySerialVxSteps.length<=2090)globalThis.__fyStyleVmInputs.push({kind:"c25ZeroStep",pc:d[k],step:globalThis.__fySerialVxSteps.length,regs:globalThis.__fyDeepSig(d),d2:Array.isArray(d[2])?d[2].slice(0,5):null,d10Children:d[10]?.childNodes?.length,d10Width:d[10]?.childNodes?Array.from(d[10].childNodes).slice(0,5).map(node=>node.offsetWidth):null,pc37:d[k]===37&&globalThis.__fySerialVxSteps.length>=2000&&globalThis.__fySerialVxSteps.length<=2100?{regs:Object.keys(d).map(key=>[key,Object.prototype.toString.call(d[key]),d[key]?.offsetWidth,d[key]?.childNodes?.length]),span:{fontFamily:d[7]?.style?.fontFamily,fontSize:d[7]?.style?.fontSize,styleKeys:Object.keys(d[7]?.style||{}).slice(0,8),htmlLength:d[7]?.innerHTML?.length,htmlHead:d[7]?.innerHTML?.slice(0,120),childTag:Object.prototype.toString.call(d[7]?.childNodes?.[0]),childWidth:d[7]?.childNodes?.[0]?.offsetWidth,childText:d[7]?.childNodes?.[0]?.textContent}}:null,v:globalThis.__fyValueSig(v),z:globalThis.__fyValueSig(z),oa:globalThis.__fyValueSig(OA),rk:globalThis.__fyValueSig(RK),focus:d[k]===11&&globalThis.__fySerialVxSteps.length===2067?{vRaw:typeof v==="string"?v:null,regs:Object.keys(d).map(key=>[key,typeof d[key]==="string"&&d[key].length<300?d[key]:typeof d[key]==="number"?d[key]:globalThis.__fyValueSig(d[key])])}:null});if(yi===0&&d[k]===11&&typeof v==="string"&&v.startsWith("<span ")&&Array.isArray(d[2])&&d[2].length===3&&globalThis.__fyStyleVmInputs.filter(item=>item.kind==="fontProbe").length<40)globalThis.__fyStyleVmInputs.push({kind:"fontProbe",html:v,markup:d[10]?.innerHTML,widths:d[2].slice(),allWidths:Array.from(d[10]?.childNodes||[],node=>node.offsetWidth),childCount:d[10]?.childNodes?.length});switch(Qu){');
      const pixelNeedle = 'd[X]=function(y){for(var k=4;';
      if (!fySource.includes(pixelNeedle)) throw new Error('FY 像素探针位置不存在');
      fySource = fySource.replace(pixelNeedle,
        'd[X]=function(y){if(globalThis.__fyPixelTrace.length<10)globalThis.__fyPixelTrace.push({type:typeof y,length:y?.length,entryCount:globalThis.__fyEntryTrace.length,nonzero:y?.reduce?.((n,v)=>n+(v!==0),0),head:Array.from(y?.slice?.(0,32)||[]),tail:Array.from(y?.slice?.(-32)||[]),stack:new Error().stack.split("\\n").slice(1,4)});for(var k=4;');
      const dgStepNeedle = 'for(d[1]=dC,d[2]=eM,d[7]=x;d[7]!==U;){var aE=d[7]&o,dn,O=d[7]>>5&o;';
      if (!fySource.includes(dgStepNeedle)) throw new Error('FY DG 步进探针位置不存在');
      fySource = fySource.replace(dgStepNeedle,
        `${dgStepNeedle}if(globalThis.__fyDgSteps.length<1000)globalThis.__fyDgSteps.push({zU,pc:d[7],branch:aE,opcode:O,flType:typeof FL,flTruthy:!!FL});`);
      const dgWindowNeedle = 'Q=window[v],d[7]=Q?429:68';
      if (!fySource.includes(dgWindowNeedle)) throw new Error('FY DG window 探针位置不存在');
      fySource = fySource.replace(dgWindowNeedle,
        'Q=window[v],globalThis.__fyDgWindowChecks.push({key:v,type:typeof Q,truthy:!!Q,own:Object.prototype.hasOwnProperty.call(window,v)}),d[7]=Q?429:68');
      const dgObjectNeedle = 'Q=W(C[l],null,8,67),v=B[Q],d[7]=v?356:461';
      if (!fySource.includes(dgObjectNeedle)) throw new Error('FY DG object 探针位置不存在');
      fySource = fySource.replace(dgObjectNeedle,
        'Q=W(C[l],null,8,67),v=B[Q],globalThis.__fyDgObjectChecks.push({key:Q,tag:Object.prototype.toString.call(B),isWindow:B===window,keys:Object.getOwnPropertyNames(B).slice(0,20),type:typeof v,truthy:!!v,own:Object.prototype.hasOwnProperty.call(B,Q)}),d[7]=v?356:461');
      const dgStringNeedle = 'z=q[RW]("HEAD"),B=z[0],d[7]=B?448:525';
      if (!fySource.includes(dgStringNeedle)) throw new Error('FY DG string 探针位置不存在');
      fySource = fySource.replace(dgStringNeedle,
        'z=q[RW]("HEAD"),B=z[0],globalThis.__fyDgStringChecks.push({qType:typeof q,qLength:q?.length,qPrefix:String(q).slice(0,24),headIndex:q?.indexOf?.("HEAD"),beforeHeadLength:B?.length,partCount:z?.length}),d[7]=B?448:525');
      const dgNavigatorNeedle = 'd[E]=d[k]in navigator,d[7]=d[E]?103:394';
      if (!fySource.includes(dgNavigatorNeedle)) throw new Error('FY DG navigator 探针位置不存在');
      fySource = fySource.replace(dgNavigatorNeedle,
        'd[E]=d[k]in navigator,globalThis.__fyDgNavigatorChecks.push({key:d[k],exists:d[E],type:typeof navigator[d[k]],own:Object.prototype.hasOwnProperty.call(navigator,d[k])}),d[7]=d[E]?103:394');
      const dgLoadNeedle = 'd[x]=d[E],d[7]=d[x]?589:557';
      if (!fySource.includes(dgLoadNeedle)) throw new Error('FY DG load 探针位置不存在');
      fySource = fySource.replace(dgLoadNeedle,
        'd[x]=d[E],globalThis.__fyDgLoadChecks.push({targetTag:Object.prototype.toString.call(d[k]),targetKeys:Object.getOwnPropertyNames(d[k]).slice(0,20),valueType:typeof d[x],truthy:!!d[x],valueKeys:d[x]&&typeof d[x]==="object"?Object.getOwnPropertyNames(d[x]).slice(0,20):null}),d[7]=d[x]?589:557');
      const dgLoadKeyNeedle = 'd[E]=d[k][d[x]],d[E]&&';
      if (!fySource.includes(dgLoadKeyNeedle)) throw new Error('FY DG load key 探针位置不存在');
      fySource = fySource.replace(dgLoadKeyNeedle,
        'globalThis.__fyDgLoadKeyChecks.push({key:d[x],targetTag:Object.prototype.toString.call(d[k])}),d[E]=d[k][d[x]],d[E]&&');
      const dgFeatureNeedle = 'd[k]=ye in d[S],d[k]||';
      if (!fySource.includes(dgFeatureNeedle)) throw new Error('FY DG feature 探针位置不存在');
      fySource = fySource.replace(dgFeatureNeedle,
        'd[k]=ye in d[S],globalThis.__fyDgFeatureChecks.push({key:String(ye).slice(0,80),targetTag:Object.prototype.toString.call(d[S]),name:d[S].name,keys:Object.getOwnPropertyNames(d[S]).slice(0,20),exists:d[k],own:Object.prototype.hasOwnProperty.call(d[S],ye),valueType:typeof d[S][ye],value:typeof d[S][ye]==="number"?d[S][ye]:null}),d[k]||');
      const dgTopPropertyNeedle = 'FL=d[m][d[k]],d[7]=426';
      if (!fySource.includes(dgTopPropertyNeedle)) throw new Error('FY DG top property 探针位置不存在');
      fySource = fySource.replace(dgTopPropertyNeedle,
        'FL=d[m][d[k]],globalThis.__fyDgTopPropertyChecks.push({key:d[k],targetTag:Object.prototype.toString.call(d[m]),type:typeof FL,truthy:!!FL,length:FL?.length}),d[7]=426');
      const dgElementNeedle = 'FL=W(C[l],null,8,w),d[S]=d[k][FL]),FL=d[S],d[7]=FL?652:130';
      if (!fySource.includes(dgElementNeedle)) throw new Error('FY DG Element 探针位置不存在');
      fySource = fySource.replace(dgElementNeedle,
        'FL=W(C[l],null,8,w),d[S]=d[k][FL],globalThis.__fyDgElementChecks.push({key:FL,targetTag:Object.prototype.toString.call(d[k]),type:typeof d[S],own:Object.prototype.hasOwnProperty.call(d[k],FL)})),FL=d[S],d[7]=FL?652:130');
      const dgCase18Needle = 'd[9]=P[d[m]],(P=d[9])&&';
      if (!fySource.includes(dgCase18Needle)) throw new Error('FY DG case18 探针位置不存在');
      fySource = fySource.replace(dgCase18Needle,
        'd[9]=P[d[m]],globalThis.__fyDgCase18Checks.push({point:"document",key:d[m],targetTag:Object.prototype.toString.call(P),valueType:typeof d[9],valueTruthy:!!d[9]}),(P=d[9])&&');
      const dgCase18Fallback = 'P=d[8][d[m]]),d[8]=P';
      if (!fySource.includes(dgCase18Fallback)) throw new Error('FY DG case18 fallback 探针位置不存在');
      fySource = fySource.replace(dgCase18Fallback,
        'P=d[8][d[m]],globalThis.__fyDgCase18Checks.push({point:"fallback",key:d[m],targetTag:Object.prototype.toString.call(d[8]),valueType:typeof P,valueTruthy:!!P})),d[8]=P');
      const dgReturnNeedle = 'case 15:return EL;case 16:';
      if (!fySource.includes(dgReturnNeedle)) throw new Error('FY DG return 探针位置不存在');
      fySource = fySource.replace(dgReturnNeedle,
        'case 15:globalThis.__fyDgReturns.push({zU,type:typeof EL,tag:Object.prototype.toString.call(EL),value:EL===null||["number","boolean","undefined"].includes(typeof EL)?EL:undefined,length:typeof EL==="string"?EL.length:undefined,keys:EL&&typeof EL==="object"?Object.getOwnPropertyNames(EL).slice(0,20):null,jsonDigest:(()=>{try{const q=JSON.stringify(EL);if(typeof q!=="string")return null;let h=2166136261;for(let i=0;i<q.length;i++)h=(Math.imul(h,16777619)^q.charCodeAt(i))>>>0;return {length:q.length,hash:h}}catch{return null}})(),arrayProfile:zU===11&&Array.isArray(EL)?EL.map((v,i)=>({index:i,type:typeof v,tag:Object.prototype.toString.call(v),length:typeof v==="string"?v.length:v?.length,scalar:["number","boolean"].includes(typeof v)?v:null,text:typeof v==="string"?v.slice(0,80):null})):undefined});return EL;case 16:');
      const dg13GateNeedle = 'd[6]=d[4],d[7]=193';
      if (!fySource.includes(dg13GateNeedle)) throw new Error('FY DG13 gate 探针位置不存在');
      fySource = fySource.replace(dg13GateNeedle,
        `d[6]=d[4],globalThis.__fyDg13GateChecks.push({zU,key:X,wTag:Object.prototype.toString.call(wZ),wKeys:wZ&&typeof wZ==="object"?Object.getOwnPropertyNames(wZ).slice(0,60):null,wProfile:globalThis.__fyDg13GateChecks.length===0?Object.fromEntries(Object.getOwnPropertyNames(wZ).filter(k=>k!=="length").map(k=>{const v=wZ[k];return [k,{type:typeof v,scalar:["number","boolean"].includes(typeof v)?v:null,length:typeof v==="string"?v.length:null}]})):undefined,w12:wZ?.[12],w24:wZ?.[24],wLength:wZ?.length,wValueType:typeof wZ?.[X],wTruthy:!!wZ?.[X],fallbackKey:d[0],fallbackType:typeof d[1]?.[d[0]],fallbackTruthy:!!d[1]?.[d[0]],resultType:typeof d[6],resultTruthy:!!d[6]}),Number.isInteger(${JSON.stringify(input.dssAfterGateCount)})&&globalThis.__fyDg13GateChecks.length===${JSON.stringify(input.dssAfterGateCount)}&&setTimeout(globalThis.__replayDss,0),d[7]=193`);
      const featureArrayNeedle = 'iC=[]';
      if (!fySource.includes(featureArrayNeedle)) throw new Error('FY feature array 探针位置不存在');
      fySource = fySource.replace(featureArrayNeedle,
        'iC=new Proxy([],{set(t,k,v,r){globalThis.__fyFeatureArray=iC;if(["12","24","28","54","66","73","81","115","119","125","137","148","152","157"].includes(String(k)))globalThis.__fyFeatureWrites.push({index:String(k),type:typeof v,value:typeof v==="number"?v:null,valueSig:globalThis.__fyValueSig(v),jCount:globalThis.__fyJCalls.length,earlyCount:globalThis.__fyEarlyCalls?.length??0,time:performance.now(),stack:new Error().stack.split("\\n").slice(1,11)});if(k==="115"&&v&&typeof v==="object")v=new Proxy(v,{set(o,key,val,receiver){globalThis.__fy115Writes.push({key:String(key),valueSig:globalThis.__fyValueSig(val),earlyCount:globalThis.__fyEarlyCalls?.length??0,stack:new Error().stack.split("\\n").slice(1,6)});return Reflect.set(o,key,val,receiver)}});if(k==="11"&&Array.isArray(v))v=new Proxy(v,{set(o,key,val,receiver){if(key!=="length"&&globalThis.__fyFeatureWrites.filter(item=>item.index==="11_item").length<8)globalThis.__fyFeatureWrites.push({index:"11_item",itemIndex:String(key),valueDetail:globalThis.__fyDeepSig(val,true),stack:new Error().stack.split(String.fromCharCode(10)).slice(1,6)});return Reflect.set(o,key,val,receiver)}});return Reflect.set(t,k,v,r)}})');
      const feature28Needle = 'd[p][I]=d[x]-1';
      if (!fySource.includes(feature28Needle)) throw new Error('FY 特征 28 写入点不存在');
      fySource = fySource.replace(feature28Needle,
        'globalThis.__fy28Context.length<40&&globalThis.__fy28Context.push({I,key:k,x:d[x],isFeatureArray:d[i]===globalThis.__fyFeatureArray,time:performance.now()}),d[p][I]=d[x]-1');
      const feature24Needle = 'd[9][X]=1,d[k]=586';
      if (!fySource.includes(feature24Needle)) throw new Error('FY feature24 探针位置不存在');
      fySource = fySource.replace(feature24Needle,
        'globalThis.__fy24Context.push({v,z,s,AN,JY,eo,opcode:O,key:X,targetTag:Object.prototype.toString.call(d[9]),earlyCount:globalThis.__fyEarlyCalls?.length??0,time:performance.now()}),d[9][X]=1,d[k]=586');
      const mrStepNeedle = 'for(d[k]=68;d[k]!==U;){var Kz=d[k]&o,yH,O=d[k]>>5&o;';
      if (!fySource.includes(mrStepNeedle)) throw new Error('FY mr 步进探针位置不存在');
      fySource = fySource.replace(mrStepNeedle,
        `${mrStepNeedle}if(v===52&&globalThis.__fySerializing&&globalThis.__fyStyleVmInputs.length<1500)globalThis.__fyStyleVmInputs.push({kind:"mr52step",pc:d[k],branch:Kz,opcode:O,entryCount:globalThis.__fySerialEntryTrace.length,regs:Object.keys(d).map(key=>[key,globalThis.__fyValueSig(d[key])])});if(v===25&&globalThis.__fySerializing&&globalThis.__fyStyleVmInputs.length<900)globalThis.__fyStyleVmInputs.push({kind:"mr25step",pc:d[k],branch:Kz,opcode:O,entryCount:globalThis.__fySerialEntryTrace.length,regs:Object.keys(d).map(key=>[key,globalThis.__fyValueSig(d[key])])});if(v===16&&globalThis.__fySerializing&&globalThis.__fyMr16Steps.length<5000)globalThis.__fyMr16Steps.push({pc:d[k],branch:Kz,opcode:O,entryCount:globalThis.__fySerialEntryTrace.length,regs:Object.keys(d).map(function(key){return[key,globalThis.__fyValueSig(d[key])]}),detail:globalThis.__fyMr16Steps.length<30?globalThis.__fyDeepSig(d,true):null,branchKey:d[k]===261?C[$][99]:null,branchValue:d[k]===261?globalThis.__fyValueSig(d[E]?.[C[$][99]]):null,branchOwn:d[k]===261?Object.prototype.hasOwnProperty.call(d[E],C[$][99]):null,nextKey:d[k]===613?C[$][b]:null,nextValue:d[k]===613?globalThis.__fyValueSig(d[E]?.[C[$][b]]):null,nextOwn:d[k]===613?Object.prototype.hasOwnProperty.call(d[E],C[$][b]):null,preKey:d[k]===613?C[$][89]:null,preValue:d[k]===613?globalThis.__fyValueSig(d[E]?.[C[$][89]]):null,preOwn:d[k]===613?Object.prototype.hasOwnProperty.call(d[E],C[$][89]):null});if(v===22&&globalThis.__fyMr22Steps.length<200)globalThis.__fyMr22Steps.push({pc:d[k],branch:Kz,opcode:O,MTag:Object.prototype.toString.call(M),MKeys:M&&typeof M==="object"?Object.getOwnPropertyNames(M).slice(0,8):null,M0Type:typeof M?.[0]});if(v===3&&globalThis.__fyMr3Steps.length<3000)globalThis.__fyMr3Steps.push({pc:d[k],branch:Kz,opcode:O});if(v===43&&globalThis.__fyMr43Steps.length<1000)globalThis.__fyMr43Steps.push({pc:d[k],branch:Kz,opcode:O,s,zTag:Object.prototype.toString.call(z),regSig:s==="deviceorientation"?Object.fromEntries(Object.keys(d).map(k=>[k,globalThis.__fyValueSig(d[k])])):null,reg13:s==="deviceorientation"&&d[k]===265&&typeof d[13]==="function"?{name:d[13].name,length:d[13].length,source:String(d[13]).slice(0,120)}:null});if(v===56&&globalThis.__fyMr56Steps.length<500)globalThis.__fyMr56Steps.push({pc:d[k],branch:Kz,opcode:O,earlyCount:globalThis.__fyEarlyCalls?.length??0});if(v===47&&globalThis.__fyMr47Steps.length<5000)globalThis.__fyMr47Steps.push({pc:d[k],branch:Kz,opcode:O,eType:typeof d[E],eLength:d[E]?.length,eTag:Object.prototype.toString.call(d[E]),pType:typeof d[p],pLength:d[p]?.length,pTag:Object.prototype.toString.call(d[p]),d3Length:d[3]?.length,d9Length:d[9]?.length,earlyCount:globalThis.__fyEarlyCalls?.length??0});`);
      const jEntryNeedle = 'function J(Z7){';
      if (!fySource.includes(jEntryNeedle)) throw new Error('FY J 入口探针位置不存在');
      fySource = fySource.replace(jEntryNeedle,
        'function J(Z7){if(globalThis.__fyJCalls.length<100)globalThis.__fyJCalls.push({arg:globalThis.__fyValueSig(Z7),number:typeof Z7==="number"?Z7:null,uSig:Array.isArray(U)?U.slice(0,20).map(globalThis.__fyValueSig):globalThis.__fyValueSig(U),oSig:globalThis.__fyValueSig(O),nSig:globalThis.__fyValueSig(N),nDeep:globalThis.__fyDeepSig(N),dDetail:Z7===2?globalThis.__fyDeepSig(d,true):null,earlyCount:globalThis.__fyEarlyCalls?.length??0,stack:new Error().stack.split("\\n").slice(1,4)});');
      const jStepNeedle = 'for(var W=2;void 0!==W;){var Qu,L5,k=7&W>>3;switch(7&W){';
      if (!fySource.includes(jStepNeedle)) throw new Error('FY J 步进探针位置不存在');
      fySource = fySource.replace(jStepNeedle,
        'for(var W=2;void 0!==W;){var Qu,L5,k=7&W>>3;if(Z7===2&&globalThis.__fyJSteps.length<2000)globalThis.__fyJSteps.push({pc:W,branch:7&W,opcode:k,uSig:Array.isArray(U)?U.slice(0,20).map(globalThis.__fyValueSig):null,uDeep:globalThis.__fyDeepSig(U),uDetail:globalThis.__fyJSteps.length===115?globalThis.__fyDeepSig(U,true):null,nDeep:globalThis.__fyDeepSig(N),dDeep:globalThis.__fyDeepSig(d),dDetail:globalThis.__fyJSteps.length===116?globalThis.__fyDeepSig(d,true):null,cSig:globalThis.__fyValueSig(C),eSig:globalThis.__fyValueSig(E),aSig:globalThis.__fyValueSig(a),aDetail:a&&typeof a==="object"?globalThis.__fyDeepSig(a,true):null,oSig:globalThis.__fyValueSig(O)});switch(7&W){');
      const c25CompareNeedle = 'd[S]=v[d[5]],M=d[S],d[S]=d[2][d[6]],(r=M!=d[S])';
      if (!fySource.includes(c25CompareNeedle)) throw new Error('FY C25 比较探针位置不存在');
      fySource = fySource.replace(c25CompareNeedle, 'd[S]=v[d[5]],M=d[S],d[S]=d[2][d[6]],globalThis.__fySerializing&&globalThis.__fySerialVxSteps.length>=2050&&globalThis.__fySerialVxSteps.length<=2085&&globalThis.__fyStyleVmInputs.push({kind:"c25Compare74",yi,step:globalThis.__fySerialVxSteps.length,left:globalThis.__fyValueSig(M),right:globalThis.__fyValueSig(d[S]),leftKey:globalThis.__fyValueSig(d[5]),rightKey:globalThis.__fyValueSig(d[6]),leftRaw:typeof M==="number"||typeof M==="string"?M:null,rightRaw:typeof d[S]==="number"||typeof d[S]==="string"?d[S]:null,vTag:Object.prototype.toString.call(v),rightTag:Object.prototype.toString.call(d[2])}),(r=M!=d[S])');
      const vx7WriteNeedle = 'function vx(AN,OA,FL,EL,q){var d=[];function Q';
      if (!fySource.includes(vx7WriteNeedle)) throw new Error('FY vx7 writer 探针位置不存在');
      fySource = fySource.replace(vx7WriteNeedle,
        'function vx(AN,OA,FL,EL,q){var d=AN===7?new Proxy([],{set(t,k,val,r){if((k==="10"||k==="13"||k==="0"||k==="21"||(k==="6"&&(t[6]===385||t[6]===384)))&&globalThis.__fyVx7Writes.length<1200)globalThis.__fyVx7Writes.push({key:String(k),pc:t[6],branchKey:k==="6"&&t[6]===385?t[18]:k==="6"&&t[6]===384?t[22]:null,branchValue:k==="6"&&t[6]===385?globalThis.__fyValueSig(t[11]?.[t[18]]):k==="6"&&t[6]===384?Object.prototype.hasOwnProperty.call(t[20],t[22]):null,branchTarget:k==="6"&&t[6]===384?globalThis.__fyValueSig(t[20]):null,valueSig:globalThis.__fyValueSig(val),objectKeys:val&&typeof val==="object"?Object.keys(val).slice(0,30):null,ownNames:val&&typeof val==="object"?Object.getOwnPropertyNames(val).slice(0,30):null,fnInfo:typeof val==="function"?{name:val.name,length:val.length,keys:Object.keys(val),source:String(val).slice(0,100)}:null,stringValue:typeof val==="string"&&val.length<=80?val:null,bitCheck:k==="21"&&t[6]===300?Object.fromEntries(Object.keys(t).map(n=>[n,globalThis.__fyValueSig(t[n])])):null,bitContext:k==="21"&&t[6]===300?{reg20Keys:t[20]&&typeof t[20]==="object"?Object.keys(t[20]).slice(0,30):null,reg20Fn:typeof t[20]==="function"?{name:t[20].name,length:t[20].length,source:String(t[20]).slice(0,120)}:null,reg22:typeof t[22]==="string"?t[22]:null,rootClassList:t[20]===document.documentElement?.classList,bodyClassList:t[20]===document.body?.classList,symbolInfo:t[20]===Symbol?{hasOwn:Object.prototype.hasOwnProperty.call(Symbol,"hasInstance"),nameCount:Object.getOwnPropertyNames(Symbol).length,descriptor:Object.getOwnPropertyDescriptor(Symbol,"hasInstance")?{configurable:Object.getOwnPropertyDescriptor(Symbol,"hasInstance").configurable,enumerable:Object.getOwnPropertyDescriptor(Symbol,"hasInstance").enumerable,writable:Object.getOwnPropertyDescriptor(Symbol,"hasInstance").writable}:null,valueType:typeof Symbol.hasInstance,valueString:String(Symbol.hasInstance)}:null}:null,maskCheck:k==="0"&&typeof val==="boolean"&&globalThis.__fyVx7Writes.length>190?{pc:t[6],regs:Object.fromEntries(Object.keys(t).map(n=>[n,globalThis.__fyValueSig(t[n])])),ownDescriptor:Object.getOwnPropertyDescriptor(document,"wasDiscarded")?true:false,htmlDescriptor:Object.getOwnPropertyDescriptor(HTMLDocument.prototype,"wasDiscarded")?true:false,documentDescriptor:Object.getOwnPropertyDescriptor(Document.prototype,"wasDiscarded")?true:false,hasProperty:"wasDiscarded" in document,propertyValue:document.wasDiscarded}:null,regSnapshot:k==="10"&&t[6]===99?Object.fromEntries(Object.keys(t).map(n=>[n,globalThis.__fyValueSig(t[n])])):null,regDeep:k==="10"&&t[6]===99?Object.fromEntries(Object.keys(t).map(n=>[n,globalThis.__fyDeepSig(t[n])])):null,regDetail:k==="10"&&t[6]===99?{document:globalThis.__fyDeepSig(t[8],true),array:globalThis.__fyDeepSig(t[9],true)}:null,reg17Info:k==="10"&&t[6]===99?{isPrototype:t[17]===globalThis.CSSStyleDeclaration?.prototype,keys:Object.keys(t[17]||{}).slice(0,20),ownNames:Object.getOwnPropertyNames(t[17]||{}).slice(0,20),ownCount:Object.getOwnPropertyNames(t[17]||{}).length,allKeys:Object.keys(t[17]||{}),nonEmpty:Object.fromEntries(Object.keys(t[17]||{}).filter(n=>typeof t[17][n]==="string"&&t[17][n]!=="").map(n=>[n,t[17][n]])),firstValues:[t[17]?.[0],t[17]?.[1]],styleLength:t[17]?.length,cssText:t[17]?.cssText,bodyStyle:t[17]===document.body?.style,rootStyle:t[17]===document.documentElement?.style}:null,stack:new Error().stack.split("\\n").slice(1,4)});return Reflect.set(t,k,val,r)}}):[];function Q');
      const vxEntryNeedle = 'function vx(AN,OA,FL,EL,q){var d=AN===7?';
      if (!fySource.includes(vxEntryNeedle)) throw new Error('FY vx entry 探针位置不存在');
      fySource = fySource.replace(vxEntryNeedle, 'function vx(AN,OA,FL,EL,q){if(globalThis.__fySerializing&&(AN===2||AN===16)&&globalThis.__fyStyleVmInputs.length<500)globalThis.__fyStyleVmInputs.push({kind:"vxEntry",an:AN,entryCount:globalThis.__fySerialEntryTrace.length,oaSig:globalThis.__fyValueSig(OA),oaRaw:typeof OA==="string"&&OA.length<=128?OA:null,oaDeep:globalThis.__fyDeepSig(OA),lastMr:globalThis.__fyLastMr,lastQu:globalThis.__fyLastQu,flSig:globalThis.__fyValueSig(FL),elSig:globalThis.__fyValueSig(EL),qSig:globalThis.__fyValueSig(q),stack:(globalThis.__fySerialEntryTrace.length===276||(globalThis.__fySerialEntryTrace.length>=600&&AN===16&&OA===54))?new Error().stack.split("\\n").slice(1,6):null});if(globalThis.__fySerializing&&globalThis.__fySerialVxSteps.length>=2050&&globalThis.__fySerialVxSteps.length<=2080)globalThis.__fyStyleVmInputs.push({kind:"vxFocus",an:AN,oa:OA,fl:globalThis.__fyValueSig(FL),el:globalThis.__fyValueSig(EL),q:globalThis.__fyValueSig(q),step:globalThis.__fySerialVxSteps.length,entryCount:globalThis.__fySerialEntryTrace.length,stack:new Error().stack.split("\\n").slice(1,6)});var d=AN===7?');
      const vx7StepNeedle = 'for(d[k]=OA,d[$]=FL,d[1]=EL,d[6]=L;d[6]!==U;){var Eb=d[6]&o,JY,O=d[6]>>5&o;switch(Eb){';
      if (!fySource.includes(vx7StepNeedle)) throw new Error('FY vx7 步进探针位置不存在');
      fySource = fySource.replace(vx7StepNeedle,
        'for(d[k]=OA,d[$]=FL,d[1]=EL,d[6]=L;d[6]!==U;){var Eb=d[6]&o,JY,O=d[6]>>5&o;if(globalThis.__fySerializing&&globalThis.__fySerialVxSteps.length<10000)globalThis.__fySerialVxSteps.push({an:AN,pc:d[6],branch:Eb,opcode:O,entryCount:globalThis.__fySerialEntryTrace.length,oa:typeof OA==="number"?OA:globalThis.__fyValueSig(OA),d14:typeof d[14]==="number"?d[14]:null,regs:AN===0&&globalThis.__fySerialVxSteps.length<334?Object.keys(d).map(function(key){return[key,globalThis.__fyValueSig(d[key])]}):null,deep:AN===0&&globalThis.__fySerialVxSteps.length<300?globalThis.__fyDeepSig(d):null,focus:globalThis.__fySerialVxSteps.length>=2058&&globalThis.__fySerialVxSteps.length<=2075?{oa:globalThis.__fyDeepSig(OA,true),fl:globalThis.__fyDeepSig(FL,true),el:globalThis.__fyDeepSig(EL,true),q:globalThis.__fyDeepSig(q,true),regs:globalThis.__fyDeepSig(d,true)}:null});if(AN===7&&globalThis.__fyVx7Steps.length<5000)globalThis.__fyVx7Steps.push({pc:d[6],branch:Eb,opcode:O,reg21:typeof d[21]==="number"?d[21]:globalThis.__fyValueSig(d[21]),array9:Array.isArray(d[9])?d[9].slice():null,focusDetail:[300,385,384,160].includes(d[6])?globalThis.__fyDeepSig(d,true):null,vmConstants:d[6]===300?{x,E,S,L,i,k,p,a,t,G,b,m,l:$,dollar:$}:null,dDeep:globalThis.__fyDeepSig(d),dDetail:globalThis.__fyVx7Steps.length===6?globalThis.__fyDeepSig(d,true):null});switch(Eb){');
      const vx7InnerNeedle = 'for(var W=w;void 0!==W;){var LL,Is,k=7&W>>3;switch(7&W){';
      if (!fySource.includes(vx7InnerNeedle)) throw new Error('FY vx7 内层探针位置不存在');
      fySource = fySource.replace(vx7InnerNeedle,
        'for(var W=w;void 0!==W;){var LL,Is,k=7&W>>3;if(globalThis.__fyVx7InnerSteps.length<1500)globalThis.__fyVx7InnerSteps.push({pc:W,branch:7&W,opcode:k,uDeep:globalThis.__fyDeepSig(U),callProbe:W===16?{p,a,y,target:globalThis.__fyValueSig(d[p]),key:globalThis.__fyValueSig(d[a]),keyString:typeof d[a]==="string"||typeof d[a]==="symbol"?String(d[a]):null,targetKeys:d[p]&&(typeof d[p]==="object"||typeof d[p]==="function")?Object.getOwnPropertyNames(d[p]).slice(0,25):null}:null,uDetail:(globalThis.__fyVx7InnerSteps.length<8||(globalThis.__fyVx7InnerSteps.length>=416&&globalThis.__fyVx7InnerSteps.length<=423))?globalThis.__fyDeepSig(U,true):null});switch(7&W){');
      const vx7CallNeedle = 'E=(E=d[p])[d[a]],S=d[p],l=R(E,S,t=O)';
      if (!fySource.includes(vx7CallNeedle)) throw new Error('FY vx7 内层调用探针位置不存在');
      fySource = fySource.replace(vx7CallNeedle,
        'E=(E=d[p])[d[a]],S=d[p],globalThis.__fyVx7InnerSteps.at(-1).callArgs=globalThis.__fyDeepSig(O,true),l=R(E,S,t=O)');
      const jInvokeNeedle = 'E=C[p],l=R(E,null,S=I)';
      if (!fySource.includes(jInvokeNeedle)) throw new Error('FY J call 探针位置不存在');
      fySource = fySource.replace(jInvokeNeedle,
        'E=C[p],(function(){const t={fnName:E?.name,fnPrefix:String(E).slice(0,120),argDetail:globalThis.__fyDeepSig(I,true)};globalThis.__fyJInvoke.push(t);l=R(E,null,S=I);t.result=globalThis.__fyDeepSig(l,true)})()');
      const qzEntryNeedle = 'function Qz(OA,P,EL,Kt,M,v,Z){';
      if (!fySource.includes(qzEntryNeedle)) throw new Error('FY Qz 入口探针位置不存在');
      fySource = fySource.replace(qzEntryNeedle,
        'function Qz(OA,P,EL,Kt,M,v,Z){var __fyQz5Call=(OA===5||OA===6)&&globalThis.__fySerializing?++globalThis.__fyQz5CallCount:0;globalThis.__fyQzFn=Qz;if(globalThis.__fyQzCalls.length<100)globalThis.__fyQzCalls.push({args:[OA,P,EL,Kt,M,v,Z].map(globalThis.__fyValueSig),eventDetail:OA===1?{type:P?.type,pageX:P?.pageX,pageY:P?.pageY,clientX:P?.clientX,clientY:P?.clientY,offsetX:P?.offsetX,offsetY:P?.offsetY,layerX:P?.layerX,layerY:P?.layerY,timeStamp:P?.timeStamp,thirdTag:Object.prototype.toString.call(EL),thirdId:EL?.id,thirdClass:EL?.className,thirdRect:EL?.getBoundingClientRect?.(),targetSame:P?.target===EL,targetId:P?.target?.id,targetRect:P?.target?.getBoundingClientRect?.()}:null,earlyCount:globalThis.__fyEarlyCalls?.length??0});');
      const qzStepNeedle = 'for(d[x]=EL,d[i]=Kt,d[$]=a;d[$]!==U;){var JY=d[$]&o,wZ,O=d[$]>>5&o;';
      const feature77DateNeedle = 'd[1]=+d[3],d[3]=d[2][66],d[2]=d[1]-d[3]';
      if (!fySource.includes(feature77DateNeedle)) throw new Error('FY feature77 日期读取位置不存在');
      fySource = fySource.replace(feature77DateNeedle, 'd[1]=globalThis.__fyFeature77DateIndex<globalThis.__fyFeature77DateTape.length?globalThis.__fyFeature77DateTape[globalThis.__fyFeature77DateIndex++]:+d[3],globalThis.__fyStyleVmInputs.push({kind:"feature77Date",now:d[1],base:d[2][66],length:d[2][77]?.length}),d[3]=d[2][66],d[2]=d[1]-d[3]');
      for (const [needle, replacement] of [
        ['d[L][52]=d[g]', 'd[L][52]=globalThis.__fyDragStackLine||d[g]'],
        ['d[9][52]=d[2]', 'd[9][52]=globalThis.__fyDragStackLine||d[2]'],
      ]) {
        if (!fySource.includes(needle)) throw new Error('FY 拖动栈位置不存在');
        fySource = fySource.replace(needle, replacement);
      }
      for (const [needle, replacement] of [
        ['d[E]=d[g].pop(),d[g]=d[E]+""', 'd[E]=d[g].pop(),globalThis.__fyStyleVmInputs.push({kind:"feature52StackRead",value:d[E]}),d[g]=d[E]+""'],
        ['d[6]=d[2].pop(),d[2]=d[6]+""', 'd[6]=d[2].pop(),globalThis.__fyStyleVmInputs.push({kind:"feature52StackRead",value:d[6]}),d[2]=d[6]+""'],
      ]) {
        if (!fySource.includes(needle)) throw new Error('FY feature52 栈读取位置不存在');
        fySource = fySource.replace(needle, replacement);
      }
      if (!fySource.includes(qzStepNeedle)) throw new Error('FY Qz 步进探针位置不存在');
      fySource = fySource.replace(qzStepNeedle,
        'for(d[x]=EL,d[i]=Kt,d[$]=a;d[$]!==U;){var JY=d[$]&o,wZ,O=d[$]>>5&o;if(__fyQz5Call&&globalThis.__fyQz5Steps.length<5000)globalThis.__fyQz5Steps.push({call:__fyQz5Call,oa:OA,pc:d[$],branch:JY,opcode:O,entryCount:globalThis.__fySerialEntryTrace.length,regs:Object.keys(d).map(function(key){return[key,globalThis.__fyValueSig(d[key])]}),detail:__fyQz5Call===1?globalThis.__fyDeepSig(d,true):null});if(globalThis.__fyQzSteps.length<2000&&(globalThis.__fyEarlyCalls?.length??0)<=1)globalThis.__fyQzSteps.push({pc:d[$],branch:JY,opcode:O,call:globalThis.__fyQzCalls.length,earlyCount:globalThis.__fyEarlyCalls?.length??0,regs:d[$]===269?Object.keys(d).map(function(key){var v=d[key];return[key,typeof v==="object"&&v?Object.prototype.toString.call(v):String(v)]}):undefined});if(globalThis.__fyRegChanges.length<200){if(globalThis.__fyR16!==d[16]){globalThis.__fyRegChanges.push({pc:d[$],reg:16,val:Object.prototype.toString.call(d[16])});globalThis.__fyR16=d[16];}if(globalThis.__fyR18!==d[18]){globalThis.__fyRegChanges.push({pc:d[$],reg:18,val:Object.prototype.toString.call(d[18])});globalThis.__fyR18=d[18];}}');
      const mr43LookupNeedle = 'd[S]=d[i][r],d[S]&&(d[1]=!0)';
      if (!fySource.includes(mr43LookupNeedle)) throw new Error('FY mr43 lookup 探针位置不存在');
      fySource = fySource.replace(mr43LookupNeedle,
        'd[S]=d[i][r],v===43&&s==="deviceorientation"&&globalThis.__fyMr43Lookup.push({key:r,targetTag:Object.prototype.toString.call(d[i]),isWindow:d[i]===window,targetKeys:Object.getOwnPropertyNames(d[i]).slice(0,15),valueType:typeof d[S],own:Object.prototype.hasOwnProperty.call(d[i],r)}),d[S]&&(d[1]=!0)');
      const mr22GateNeedle = 'd[9]=M[0],d[k]=d[9]?394:231';
      if (!fySource.includes(mr22GateNeedle)) throw new Error('FY mr22 gate 探针位置不存在');
      fySource = fySource.replace(mr22GateNeedle,
        'd[9]=M[0],v===22&&globalThis.__fyMr22Gate.push({MTag:Object.prototype.toString.call(M),MKeys:Object.getOwnPropertyNames(M).slice(0,15),M0Type:typeof d[9],M0Tag:Object.prototype.toString.call(d[9]),M0Keys:d[9]&&typeof d[9]==="object"?Object.getOwnPropertyNames(d[9]).slice(0,15):null,M0SrcLength:typeof d[9]?.src==="string"?d[9].src.length:null,M0Value:typeof d[9]==="number"||typeof d[9]==="boolean"?d[9]:null,M0Length:typeof d[9]==="string"?d[9].length:null,truthy:!!d[9]}),d[k]=d[9]?394:231');
      const dg13WNeedle = 'd[6]=W(C[0],null,L,85),W(d[2],null,d[6]),d[7]=576';
      if (!fySource.includes(dg13WNeedle)) throw new Error('FY DG13 W 探针位置不存在');
      fySource = fySource.replace(dg13WNeedle,
        'd[6]=W(C[0],null,L,85),(function(){const t={zU,argType:typeof d[6],arg:String(d[6]).slice(0,80),fn:String(d[2]).slice(0,120)};globalThis.__fyDg13WCall.push(t);try{const r=W(d[2],null,d[6]);t.resultType=typeof r;return r}catch(e){t.errorName=e.name;t.errorMessage=String(e.message).slice(0,120);throw e}})(),d[7]=576');
      const dg14GateNeedle = 'd[0]=Kt[C[K]],P=W(C[0],null,L,91),d[9]=d[0][P],d[7]=d[9]?329:163';
      if (!fySource.includes(dg14GateNeedle)) throw new Error('FY DG14 gate 探针位置不存在');
      fySource = fySource.replace(dg14GateNeedle,
        'd[0]=Kt[C[K]],P=W(C[0],null,L,91),d[9]=d[0][P],zU===14&&globalThis.__fyDg14Gate.push({containerKey:C[K],property:P,targetTag:Object.prototype.toString.call(d[0]),targetKeys:Object.getOwnPropertyNames(d[0]).slice(0,20),valueType:typeof d[9],valueTruthy:!!d[9],valueTag:Object.prototype.toString.call(d[9])}),d[7]=d[9]?329:163');
      const builderNeedle = 'n(B,void 0),n(Qu,JY);var E=j(W=Eb,this,L=x+1);A(Qu),A(B)';
      if (!fySource.includes(builderNeedle)) throw new Error('FY builder 探针位置不存在');
      fySource = fySource.replace(builderNeedle,
        'n(B,void 0),globalThis.__fyBuilderTrace.push({stage:"afterB",uLength:U?.length,elType:typeof EL,elLength:EL?.length,bTag:Object.prototype.toString.call(B),bLength:B?.length,quTag:Object.prototype.toString.call(Qu),quLength:Qu?.length,ebTag:Object.prototype.toString.call(Eb),ebLength:Eb?.length}),n(Qu,JY),globalThis.__fyBuilderTrace.push({stage:"afterQu",uLength:U?.length,elType:typeof EL,elLength:EL?.length,bTag:Object.prototype.toString.call(B),bLength:B?.length,quTag:Object.prototype.toString.call(Qu),quLength:Qu?.length,ebTag:Object.prototype.toString.call(Eb),ebLength:Eb?.length});var E=j(W=Eb,this,L=x+1);A(Qu),globalThis.__fyBuilderTrace.push({stage:"afterAQu",uLength:U?.length,eType:typeof E,eLength:E?.length,elType:typeof EL,elLength:EL?.length}),A(B),globalThis.__fyBuilderTrace.push({stage:"afterAB",uLength:U?.length,eType:typeof E,eLength:E?.length,elType:typeof EL,elLength:EL?.length})');
      const ebStepNeedle = 'for(var k=w;void 0!==k;){var LL,Is,p=7&k>>3;switch(7&k){';
      if (!fySource.includes(ebStepNeedle)) throw new Error('FY Eb 步进探针位置不存在');
      fySource = fySource.replace(ebStepNeedle,
        `for(var k=w;void 0!==k;){var LL,Is,p=7&k>>3;if(globalThis.__fyEbSteps.length<3000)globalThis.__fyEbSteps.push({pc:k,branch:7&k,opcode:p,n:N,uLength:U?.length,uSig:Array.isArray(U)?U.map(globalThis.__fyValueSig):null,el:EL,earlyCount:globalThis.__fyEarlyCalls?.length??0});switch(7&k){`);
      const ebCallNeedle = 'E=C[a],S=R(E,null,W=r)';
      if (!fySource.includes(ebCallNeedle)) throw new Error('FY Eb call 探针位置不存在');
      fySource = fySource.replace(ebCallNeedle,
        'E=C[a],(function(){const t={pc:k,a,fnName:E?.name,fnPrefix:String(E).slice(0,120),argSig:Array.isArray(r)?r.map(globalThis.__fyValueSig):globalThis.__fyValueSig(r)};if(globalThis.__fyEbCallTrace.length<100)globalThis.__fyEbCallTrace.push(t);try{S=R(E,null,W=r);t.resultSig=globalThis.__fyValueSig(S)}catch(e){t.error=String(e).slice(0,120);throw e}})()');
      const mr47LoopNeedle = 'd[7]=d[5]<d[6],d[k]=d[7]?199:581';
      if (!fySource.includes(mr47LoopNeedle)) throw new Error('FY mr47 loop 探针位置不存在');
      fySource = fySource.replace(mr47LoopNeedle,
        'd[7]=d[5]<d[6],v===47&&globalThis.__fyMr47Loop.length<100&&globalThis.__fyMr47Loop.push({index:d[5],limit:d[6],continue:d[7]}),d[k]=d[7]?199:581');
      const mrD6Needle = 'for(var d=[],FL=2;';
      if (!fySource.includes(mrD6Needle)) throw new Error('FY mr47 d6 探针位置不存在');
      fySource = fySource.replace(mrD6Needle,
        'for(var d=v===47?new Proxy([],{set(t,k,val,r){if(globalThis.__fyMr47Writes.length<300)globalThis.__fyMr47Writes.push({key:String(k),type:typeof val,tag:Object.prototype.toString.call(val),value:typeof val==="number"?val:null,length:val?.length,stack:new Error().stack.split("\\n").slice(1,4)});if(k==="6"&&globalThis.__fyMr47D6Writes.length<500)globalThis.__fyMr47D6Writes.push({type:typeof val,value:typeof val==="number"?val:null,length:typeof val==="string"?val.length:null,stack:new Error().stack.split("\\n").slice(1,4)});return Reflect.set(t,k,val,r)}}):v===43?new Proxy([],{set(t,k,val,r){if((k==="13"||k==="1")&&globalThis.__fyMr43Writes.length<100)globalThis.__fyMr43Writes.push({key:String(k),valueSig:globalThis.__fyValueSig(val),stringValue:typeof val==="string"&&val.length<=20?val:null,stack:new Error().stack.split("\\n").slice(1,4)});return Reflect.set(t,k,val,r)}}):[],FL=2;');
      const serializerNeedle = 'd[p]=W(C[l],null,1,d[i],d[m],d[2],d[4],d[5]),d[i]=d[p]';
      if (!fySource.includes(serializerNeedle)) throw new Error('FY serializer 探针位置不存在');
      fySource = fySource.replace(serializerNeedle,
        '(function(){const args=[d[i],d[m],d[2],d[4],d[5]],t={fnName:C[l]?.name,fnPrefix:String(C[l]).slice(0,120),argSig:args.map(globalThis.__fyValueSig),argArrays:[d[i],d[m]].map(v=>Array.isArray(v)?v.slice():null),mKeys:d[m]&&typeof d[m]==="object"?Object.keys(d[m]).slice(0,30):null,mProfile:Object.fromEntries(Object.keys(d[m]||{}).map(k=>[k,globalThis.__fyValueSig(d[m][k])])),featureProfile:Object.fromEntries(Object.keys(d[2]||{}).map(k=>[k,globalThis.__fyValueSig(d[2][k])])),featureDeep:Object.fromEntries(Object.keys(d[2]||{}).map(k=>[k,globalThis.__fyDeepSig(d[2][k])])),featureDetail:{11:globalThis.__fyDeepSig(d[2]?.[11],true),105:globalThis.__fyDeepSig(d[2]?.[105],true),152:globalThis.__fyDeepSig(d[2]?.[152],true)},feature52Raw:d[2]?.[52],feature77Raw:Array.isArray(d[2]?.[77])?d[2][77].slice():null,feature152Raw:Array.isArray(d[2]?.[152])?d[2][152].slice():null,feature115:Object.fromEntries(Object.entries(d[2]?.[115]||{}).map(([k,v])=>[k,globalThis.__fyValueSig(v)])),feature125:Array.isArray(d[2]?.[125])?d[2][125].map(globalThis.__fyValueSig):null,feature125Raw:Array.isArray(d[2]?.[125])?d[2][125].slice():null,feature125Value21:d[2]?.[125]?.[21],feature125Last:typeof d[2]?.[125]?.at?.(-1)==="string"?d[2][125].at(-1).slice(0,80):null};globalThis.__fySerializerCalls.push(t);globalThis.__fySerializing=true;try{d[p]=W(C[l],null,1,...args)}finally{globalThis.__fySerializing=false}if(!globalThis.__fyWindowDescriptorSnapshot)globalThis.__fyWindowDescriptorSnapshot=globalThis.__fyDescribeWindow();t.resultSig=globalThis.__fyValueSig(d[p]);t.resultBytes=Array.isArray(d[p])?Array.from(d[p]):null})(),d[i]=d[p]');
      if (Array.isArray(input.fySerializerReplayBytes)) fySource = fySource.replace(
        't.resultSig=globalThis.__fyValueSig(d[p]);t.resultBytes=',
        'if(Array.isArray(globalThis.__fySerializerReplayBytes?.[globalThis.__fySerializerCalls.length-1]))d[p]=globalThis.__fySerializerReplayBytes[globalThis.__fySerializerCalls.length-1].slice();t.resultSig=globalThis.__fyValueSig(d[p]);t.resultBytes=');
      fySource = fySource.replace('d[S][X]=1,d[k]=586',
        'globalThis.__fy24AlternateContext.push({v,z,s,AN,JY,eo,opcode:O,key:X,targetTag:Object.prototype.toString.call(d[S]),earlyCount:globalThis.__fyEarlyCalls?.length??0,time:performance.now()}),d[S][X]=1,d[k]=586');
      const resourceQueryNeedle = 'OA=d[8][d[m]](d[9]),d[8]=OA';
      if (!fySource.includes(resourceQueryNeedle)) throw new Error('FY resource query 探针位置不存在');
      fySource = fySource.replace(resourceQueryNeedle,
        'OA=d[8][d[m]](d[9]),globalThis.__fyResourceQueries.push({targetTag:Object.prototype.toString.call(d[8]),method:d[m],argument:d[9],count:OA?.length,first:OA?.[0]?.toJSON?.()||null}),d[8]=OA');
    }
    if (input.fyInitCookie) {
      const script = new HTMLScriptElement();
      script.src = 'https://o.alicdn.com/seclab/f/index1.js';
      documentState.currentScript = script;
    }
    if (input.traceFyBranch) global.__fyEarlyCalls = [];
    if (input.traceFyBranch) fs.writeFileSync('.playwright-cli/fy_instrumented_local.js', fySource);
    eval(fySource);
    documentState.currentScript = null;
    if (input.mode === 'fy_nonce') Object.assign(global.fyglobalopt, input.fyOptions || {});
    const fyUmPerfCallbackPresent = typeof global.__um_perf_cb === 'function';
    if (input.mode === 'fy_nonce') await Promise.resolve();
    const options = {
      MaxMTLog: 300, MTInterval: 4, MinMTDwnLog: 30, MaxKSLog: 14,
      MaxFocusLog: 6, MaxNGPLog: 200, NGPInterval: 4, Enable: 3,
      location: 'cn', _umopt_npfp: 1,
    };
    const fyPriorOutputs = [];
    const fyPriorCalls = input.fyPriorCalls || [];
    global.__fyJsonTrace = [];
    global.__fyJsonStages = [];
    const traceFyJson = (label, callback) => {
      if (!input.traceFyBranch) return callback();
      const stringify = JSON.stringify;
      global.__fyJsonStages.push({ label, source: String(stringify).slice(0, 160),
        probe: stringify.call(JSON, [1]) });
      JSON.stringify = function (...args) {
        const result = Reflect.apply(stringify, this, args);
        if (global.__fyJsonTrace.length < 500) {
          let hash = 2166136261;
          for (let index = 0; index < (result?.length || 0); index++) {
            hash = (Math.imul(hash, 16777619) ^ result.charCodeAt(index)) >>> 0;
          }
          global.__fyJsonTrace.push({ label, tag: Object.prototype.toString.call(args[0]),
            keys: args[0] && typeof args[0] === 'object'
              ? Object.keys(args[0]).slice(0, 20) : null,
            length: result?.length ?? null, hash });
        }
        return result;
      };
      try { return callback(); } finally { JSON.stringify = stringify; }
    };
    const replayFyPrior = prior => {
      if (input.traceFyBranch) global.__fyEarlyCalls.push({ name: prior.name });
      const priorWindowNames = prior.windowNames || prior.fyWindowNames;
      if (Array.isArray(priorWindowNames)) activeFyWindowNames = priorWindowNames;
      const priorWindowKeys = prior.windowKeys || prior.fyWindowKeys;
      if (Array.isArray(priorWindowKeys)) activeFyWindowKeys = priorWindowKeys;
      const priorResources = prior.resourceEntries || prior.fyResourceEntries;
      if (Array.isArray(priorResources)) activeFyResourceEntries = priorResources;
      activeFyMemoryValues = prior.memoryValues || prior.fyPerformanceMemory
        || activeFyMemoryValues;
      if (typeof prior.cookie === 'string') loadCookieSnapshot(prior.cookie);
      const previousRandom = Math.random;
      const previousNow = Date.now;
      const previousDate = global.Date;
      let randomIndex = 0;
      let timeIndex = 0;
      let dateIndex = 0;
      Math.random = () => prior.randomTape?.[randomIndex++] ?? previousRandom();
      Date.now = () => prior.timeTape?.[timeIndex++] ?? previousNow();
      if (Array.isArray(prior.dateTape)) global.Date = new Proxy(previousDate, {
        construct(target, args, newTarget) {
          if (args.length) return Reflect.construct(target, args, newTarget);
          const timestamp = prior.dateTape[dateIndex++];
          return timestamp === undefined
            ? Reflect.construct(target, args, newTarget)
            : Reflect.construct(target, [timestamp], newTarget);
        },
      });
      try {
        fyPriorOutputs.push(traceFyJson(prior.name, () => prior.name === 'getUidToken'
          ? __fyModule.getUidToken(prior.args?.[0] || input.fyOptions || options)
          : __fyModule.getFYToken(prior.args?.[0] || input.fyOptions || options)));
      } finally {
        Math.random = previousRandom;
        Date.now = previousNow;
        global.Date = previousDate;
      }
    };
    const callbackPriorCount = input.fyCallbackPriorCount ?? 2;
    if (input.traceFyBranch) global.__fyEarlyCalls.push({ name: 'init' });
    if (typeof page.umidStorage === 'string') localStorage.setItem('lswucn', page.umidStorage);
    if (input.envProfile) {
      const env = input.envProfile;
      const setGet = (target, key, value) => {
        try { Object.defineProperty(target, key, { configurable: true, enumerable: true, get: () => value }); }
        catch { try { target[key] = value; } catch {} }
      };
      for (const [k, v] of Object.entries(env.navigator || {})) {
        if (k === 'mimeTypes' || k === 'plugins') continue;
        setGet(globalThis.navigator, k, v);
      }
      for (const [k, v] of Object.entries(env.screen || {})) setGet(globalThis.screen, k, v);
      for (const [k, v] of Object.entries(env.window || {})) {
        if (k === 'ownPropertyCount') continue;
        setGet(globalThis, k, v);
      }
      for (const [k, v] of Object.entries(env.document || {})) {
        if (k === 'currentScript') continue;
        setGet(globalThis.document, k, v);
      }
      if (Number.isFinite(Number(input.pinTime))) {
        const fixed = Number(input.pinTime);
        let tick = 0;
        try { globalThis.performance.now = () => fixed + (tick += 1); } catch {}
        try {
          const RealDate = globalThis.Date;
          const FakeDate = function (...args) {
            if (args.length) return new RealDate(...args);
            return new RealDate(fixed + (tick += 1));
          };
          FakeDate.now = () => fixed + (tick += 1);
          FakeDate.parse = RealDate.parse;
          FakeDate.UTC = RealDate.UTC;
          FakeDate.prototype = RealDate.prototype;
          globalThis.Date = FakeDate;
        } catch {}
      }
      if (Array.isArray(input.cryptoRandomTape)) {
        const tape = input.cryptoRandomTape;
        let index = 0;
        const fill = function (arr) {
          for (let i = 0; i < arr.length; i += 1) { arr[i] = tape[index % tape.length] & 0xff; index += 1; }
          return arr;
        };
        try { globalThis.crypto.getRandomValues = fill; } catch {}
        try { globalThis.Crypto.prototype.getRandomValues = fill; } catch {}
      }
      // 让被替换的方法在 toString/name/length 上看起来是原生函数
      const nativeize = (fn, name, length) => {
        try {
          Object.defineProperty(fn, 'name', { value: name, configurable: true });
          Object.defineProperty(fn, 'length', { value: length, configurable: true });
          fn.toString = function () { return `function ${name}() { [native code] }`; };
        } catch {}
        return fn;
      };
      if (typeof HTMLCanvasElement !== 'undefined') {
        nativeize(HTMLCanvasElement.prototype.toDataURL, 'toDataURL', 0);
        nativeize(HTMLCanvasElement.prototype.getContext, 'getContext', 1);
      }
      for (const name of ['WebGLRenderingContext', 'WebGL2RenderingContext']) {
        const Ctor = globalThis[name];
        if (Ctor && Ctor.prototype.getParameter) nativeize(Ctor.prototype.getParameter, 'getParameter', 1);
      }
      if (input.envDeep) {
        for (const [dotted, value] of Object.entries(input.envDeep)) {
          const parts = String(dotted).split('.');
          let target = globalThis;
          for (let i = 0; i < parts.length - 1 && target; i += 1) target = target[parts[i]];
          if (target) setGet(target, parts[parts.length - 1], value);
        }
      }
      if (Array.isArray(input.canvasTape) && input.canvasTape.length) {
        const tape = input.canvasTape.slice();
        HTMLCanvasElement.prototype.toDataURL = function () {
          return tape.length > 1 ? tape.shift() : tape[0];
        };
      }
      if (input.webglParams) {
        for (const name of ['WebGLRenderingContext', 'WebGL2RenderingContext']) {
          const Ctor = globalThis[name];
          if (!Ctor) continue;
          const original = Ctor.prototype.getParameter;
          Ctor.prototype.getParameter = function (param) {
            const key = String(param);
            if (Object.prototype.hasOwnProperty.call(input.webglParams, key)) return input.webglParams[key];
            return original.call(this, param);
          };
        }
      }
    }
    if (Number(input.surfacePadding) > 0) {
      let pad = 0;
      while (Object.getOwnPropertyNames(globalThis).length < Number(input.surfacePadding) && pad < 20000) {
        Object.defineProperty(globalThis, `__surfacePad${pad}`, {
          value: pad, writable: true, enumerable: false, configurable: true,
        });
        pad += 1;
      }
      fs.writeSync(2, `surface padding -> ${Object.getOwnPropertyNames(globalThis).length} own props (added ${pad})\n`);
    }
    __fyModule.init(input.fyInitOptions || options, () => {
      for (const prior of fyPriorCalls.slice(0, callbackPriorCount)) replayFyPrior(prior);
    });
    if (input.fyOrientationEvent) setTimeout(() => {
      noncePerformanceNow = input.fyOrientationEvent.time ?? input.fyOrientationEvent.timeStamp;
      const event = new DeviceOrientationEvent('deviceorientation', {
        ...input.fyOrientationEvent.eventData,
        timeStamp: input.fyOrientationEvent.timeStamp,
      });
      const listeners = windowListeners.get('deviceorientation') || [];
      global.__fyOrientationDispatch = { listenerCount: listeners.length,
        documentListenerTypes: [...(nonceEventListeners.get(global.document)?.keys() || [])],
        windowListenerTypes: [...windowListeners.keys()],
        windowHandlerType: typeof global.ondeviceorientation,
        timeStamp: event.timeStamp };
      const previousDate = global.Date;
      if (Number.isFinite(input.fyOrientationEvent.dateNow)) {
        global.Date = new Proxy(previousDate, {
          construct(target, args, newTarget) {
            return Reflect.construct(target,
              args.length ? args : [input.fyOrientationEvent.dateNow], newTarget);
          },
        });
      }
      try {
        for (const listener of listeners) listener.call(global, event);
        if (input.fyQz15Args && global.__fyQzFn && global.__fyFeatureArray) {
          const { P, EL, Kt } = input.fyQz15Args;
          global.__fyQzFn(15, P, EL, Kt, global.__fyFeatureArray, global);
        }
        if (Array.isArray(input.fyUmidResponse) &&
            Array.isArray(global.__fyFeatureArray?.[105])) {
          global.__fyFeatureArray[105][0] = input.fyUmidResponse;
        }
      } finally {
        global.Date = previousDate;
      }
    }, input.orientationDelayMs ?? 80);
    const dssResponse = (input.dssResponses || []).find(response =>
      typeof response.body === 'string' &&
      response.url?.includes('.tdum.alibaba.com/dss.js'));
    global.__replayDss = () => {
      fyDynamicResources.push(...(input.dssResourceEntries || []));
      if (dssResponse) eval(dssResponse.body);
    };
    if (dssResponse && !Number.isInteger(input.dssAfterGateCount)) {
      setTimeout(global.__replayDss, input.dssDelayMs ?? 180);
    }
    if (input.initDelayMs) await new Promise(resolve => setTimeout(resolve, input.initDelayMs));
    const startupCounts = startup.restore();
    const fyTraceAfterInit = input.traceFy ? {
      canvas: global.__fyTrace.canvas.length,
      webgl: global.__fyTrace.webgl.length,
    } : null;
    for (const prior of fyPriorCalls.slice(callbackPriorCount)) replayFyPrior(prior);
    if (typeof input.fyCallCookie === 'string') loadCookieSnapshot(input.fyCallCookie);
    global.__fyDragStackLine = input.fyDragStackLine;
    const replayRectValues = new WeakMap();
    class ReplayDOMRect {
      constructor(values) { replayRectValues.set(this, values); }
      get x() { return replayRectValues.get(this).x; }
      get y() { return replayRectValues.get(this).y; }
      get width() { return replayRectValues.get(this).width; }
      get height() { return replayRectValues.get(this).height; }
      get top() { return replayRectValues.get(this).top; }
      get right() { return replayRectValues.get(this).right; }
      get bottom() { return replayRectValues.get(this).bottom; }
      get left() { return replayRectValues.get(this).left; }
      toJSON() { return { ...replayRectValues.get(this) }; }
    }
    Object.defineProperty(ReplayDOMRect.prototype, Symbol.toStringTag, {
      value: 'DOMRect',
    });
    const eventDateConstructor = global.Date;
    let replayTimestamp = null;
    let replayDateIndex = 0;
    global.Date = new Proxy(eventDateConstructor, {
      construct(target, args, newTarget) {
        return Reflect.construct(target,
          args.length || replayTimestamp === null ? args : [
            input.fyReplayDateTape?.[replayDateIndex++] ?? replayTimestamp,
          ], newTarget);
      },
      get(target, key, receiver) {
        return key === 'now' && replayTimestamp !== null
          ? () => replayTimestamp : Reflect.get(target, key, receiver);
      },
    });
    const fyEvents = input.mode === 'fy_nonce' ? input.events || [] : [];
    let fyRecordStarted = false;
    const startFyRecord = () => {
      if (input.traceFyBranch) {
        global.__fySerialEntryTrace = [];
        global.__fySerialVxSteps = [];
        global.__fyMr47Steps = [];
      }
      if (input.traceFyBranch) global.__fyEarlyCalls.push({ name: 'startRecord' });
      __fyModule.startRecord();
      fyRecordStarted = true;
      for (const prior of input.fyRecordPriorCalls || []) replayFyPrior(prior);
    };
    if (input.record && !fyEvents.some(event => event.type === 'mousedown')) {
      startFyRecord();
    }
    for (const [eventIndex, event] of fyEvents.entries()) {
      if (Number.isFinite(event.timeStamp)) {
        noncePerformanceNow = event.timeStamp;
        replayTimestamp = Math.floor(performanceTimeOrigin + event.timeStamp);
      }
      const _tRect = event.target?.rect || { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
      let target = Object.assign(element((event.target?.tag || 'div').toLowerCase()), {
        tagName: event.target?.tag || 'DIV',
        nodeName: event.target?.tag || 'DIV',
        id: event.target?.id || '',
        className: event.target?.className || '',
        left: _tRect.left, top: _tRect.top, right: _tRect.right,
        bottom: _tRect.bottom, width: _tRect.width, height: _tRect.height,
        parentNode: document.body,
        getBoundingClientRect() {
          return new ReplayDOMRect(event.target?.rect || {
            left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0,
          });
        },
      });
      Object.defineProperty(target, Symbol.toStringTag, {
        configurable: true, value: 'HTMLElement',
      });
      Object.setPrototypeOf(target, HTMLElement.prototype);
      target = new Proxy(target, {
        get(object, key, receiver) {
          const value = Reflect.get(object, key, receiver);
          if (eventIndex < 2 && (global.__fyTargetReads ||= []).length < 300) {
            global.__fyTargetReads.push({ eventIndex, key: String(key),
              value: typeof value === 'number' || typeof value === 'string' ||
                typeof value === 'boolean' ? value : null,
              type: typeof value });
          }
          return value;
        },
        ownKeys() { return []; },
        getOwnPropertyDescriptor() { return undefined; },
      });
      const _rect = event.target?.rect || { left: 0, top: 0, width: 0, height: 0 };
      const _offX = event.x - (_rect.left || 0);
      const _offY = event.y - (_rect.top || 0);
      const replay = {
        type: event.type, clientX: event.x, clientY: event.y,
        x: event.x, y: event.y,
        pageX: event.x, pageY: event.y,
        screenX: event.screenX ?? event.x, screenY: event.screenY ?? event.y,
        offsetX: _offX, offsetY: _offY, layerX: _offX, layerY: _offY,
        movementX: 0, movementY: 0,
        timeStamp: event.timeStamp,
        buttons: event.buttons ?? 1, isTrusted: true,
        button: 0,
        target, srcElement: target, currentTarget: document, view: global,
        preventDefault() {}, stopPropagation() {},
      };
      Object.assign(replay, event.props || {});
      Object.setPrototypeOf(replay, MouseEvent.prototype);
      replay.__fyMouseReplay = true;
      replay[FY_REPLAY] = true;
      const replayProxy = new Proxy(replay, {
        get(target, key, receiver) {
          if (key === '__fyMouseReplay' && input.hideFyReplayFlag) return undefined;
          if (eventIndex < 2 && (global.__fyEventReads ||= []).length < 300) {
            const value = Reflect.get(target, key, receiver);
            global.__fyEventReads.push({ eventIndex, key: String(key),
              value: typeof value === 'number' || typeof value === 'string' ||
                typeof value === 'boolean' ? value : null,
              type: typeof value });
          }
          return Reflect.get(target, key, receiver);
        },
        ownKeys() { return ['isTrusted']; },
        getOwnPropertyDescriptor(target, key) {
          return key === 'isTrusted'
            ? Reflect.getOwnPropertyDescriptor(target, key) : undefined;
        },
      });
      if (input.record && !fyRecordStarted && event.type === 'mousedown'
          && !input.fyRecordAfterMousedown) startFyRecord();
      try {
        document.dispatchEvent(replayProxy);
        for (const callback of windowListeners.get(replay.type) || []) callback.call(global, replayProxy);
      } catch (error) {
        if (input.traceFy) {
          fs.writeSync(2, JSON.stringify({
            eventIndex, type: event.type, error: String(error).slice(0, 200),
            qz: global.__fyQzCalls?.slice(-3),
            early: global.__fyEarlyCalls?.slice(-8),
            steps: global.__fyQzSteps?.slice(0, 120),
            webgl: global.__fyTrace?.webgl?.slice(-12),
            nullParams: global.__fyNullParams?.slice(0, 20),
            stepsLen: global.__fyQzSteps?.length,
            regChanges: global.__fyRegChanges?.slice(0, 20),
          }) + '\n');
        }
        throw error;
      }
      if (input.record && !fyRecordStarted && event.type === 'mousedown'
          && input.fyRecordAfterMousedown) startFyRecord();
      const nextEvent = input.events[eventIndex + 1];
      if (nextEvent && Number.isFinite(event.timeStamp) &&
          Number.isFinite(nextEvent.timeStamp)) {
        const delay = Math.max(0, Math.min(100, nextEvent.timeStamp - event.timeStamp));
        if (delay) await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    global.Date = eventDateConstructor;
    const originalRandom = Math.random;
    const originalNow = Date.now;
    const originalDate = global.Date;
    let randomConsumed = 0;
    let timeConsumed = 0;
    let dateConsumed = 0;
    if (Array.isArray(input.randomTape)) {
      Math.random = () => input.randomTape[randomConsumed++] ?? originalRandom();
    }
    if (Array.isArray(input.timeTape)) {
      Date.now = () => input.timeTape[timeConsumed++] ?? originalNow();
    }
    if (Array.isArray(input.callDateTape)) global.Date = new Proxy(originalDate, {
      construct(target, args, newTarget) {
        if (args.length) return Reflect.construct(target, args, newTarget);
        const timestamp = input.callDateTape[dateConsumed++];
        return timestamp === undefined
          ? Reflect.construct(target, args, newTarget)
          : Reflect.construct(target, [timestamp], newTarget);
      },
    });
    if (Array.isArray(input.fyWindowNames)) {
      activeFyWindowNames = input.fyWindowNames;
      Object.getOwnPropertyNames = replayWindowNames;
    }
    if (Array.isArray(input.fyWindowKeys)) activeFyWindowKeys = input.fyWindowKeys;
    if (Array.isArray(input.fyResourceEntries)) {
      activeFyResourceEntries = input.fyResourceEntries;
    }
    activeFyMemoryValues = input.fyPerformanceMemory || activeFyMemoryValues;
    if (input.traceFy) {
      global.__nonceEnvironmentProbe = true;
      eval(fs.readFileSync(path.join(__dirname,
        '../../../tools/probes/environment_snapshot.js'), 'utf8'));
    }
    const fyEnvironmentSnapshot = input.traceFy
      ? global.__snapshotEnvironment?.() : null;
    const fyTraceStart = input.traceFy ? {
      canvas: global.__fyTrace.canvas.length,
      webgl: global.__fyTrace.webgl.length,
    } : null;
    let fy;
    try {
      fy = traceFyJson('target', () => Object.hasOwn(input, 'fyOptions')
        ? __fyModule.getFYToken(input.fyOptions)
        : __fyModule.getFYToken());
    } catch (error) {
      if (input.traceFy) {
        fs.writeSync(2, JSON.stringify({
          fyError: String(error).slice(0, 300),
          qzCalls: global.__fyQzCalls?.slice(-5),
          earlyCalls: global.__fyEarlyCalls?.slice(-10),
          nullParams: global.__fyNullParams?.slice(0, 20),
          webglTrace: global.__fyTrace?.webgl?.slice(-12),
        }) + '\n');
      }
      throw error;
    }
    const fyTraceEnd = input.traceFy ? {
      canvas: global.__fyTrace.canvas.length,
      webgl: global.__fyTrace.webgl.length,
    } : null;
    Math.random = originalRandom;
    Date.now = originalNow;
    global.Date = originalDate;
    Object.getOwnPropertyNames = nativeGetOwnPropertyNames;
    if (typeof fy !== 'string' || !fy.startsWith('234!')) throw new Error(`FY 输出无效: ${fy}`);
    if (input.mode === 'nonce_only') {
      const payload = Buffer.from(reference('nonce-payload.js.b64'), 'base64');
      const zero = payload.indexOf(0);
      let nonceSource = payload.subarray(0, zero).toString('utf8')
        .replace('__DAT__', new Uint8Array(payload.subarray(zero + 1)).toString())
        .replace('ae=crypto.genRandomValues("",0)',
          'global.__nonceSnapshotMemory=function(){return ' + fs.readFileSync(path.join(__dirname, '../../../tools/probes/nonce_memory_probe.txt'), 'utf8').trim() + '},global.__nonceBeforeInitCall={random:nonceInitRandomConsumed,time:nonceInitTimeConsumed},global.__nonceEnvironmentBeforeInit=global.__snapshotEnvironment?.(),global.__nonceMemoryBefore=global.__nonceSnapshotMemory(),global.__noncePhase=0,ae=crypto.genRandomValues("",0),global.__nonceMemoryAfter=global.__nonceSnapshotMemory(),global.__nonceInitOutput=ae,global.__nonceAfterInitCall={random:nonceInitRandomConsumed,time:nonceInitTimeConsumed}');
      let nonceErrorStackIndex = 0;
      function normalizeNonceStack(source) {
        if (!source.startsWith('Error\n')) return source;
        return input.nonceErrorStacks?.[nonceErrorStackIndex++] ?? source;
      }
      global.__nonceSkipMarkupNormalization = input.nonceNormalizeMarkup === false;
      if (!input.traceNonceGt) {
        nonceSource = nonceSource.replace(
          'function mt(n){return re[te]=n,te++}',
          'function mt(n){if(typeof n==="string")n=normalizeNonceStack(globalThis.__nonceSkipMarkupNormalization?n:normalizeNonceMarkup(n));return re[te]=n,te++}',
        );
      }
      if (input.traceNonceGt) {
        global.__nonceGtTrace = [];
        global.__nonceLtTrace = [];
        global.__nonceMtTrace = [];
        global.__nonceTtTrace = [];
        global.__nonceDispatchTrace = [];
        global.__nonceJnTrace = [];
        global.__nonceRegistrationTrace = [];
        global.__nonceResourceGateTrace = [];
        global.__nonceLoopProbes = [];
        global.__nonceEnvironmentProbe = true;
        eval(fs.readFileSync(path.join(__dirname, '../../../tools/probes/environment_snapshot.js'), 'utf8'));
        nonceSource = nonceSource.replace(
          'function Lt(n,r,t){return mt(function(n,r,t){return(0,fe[n])(r,t)}(n,r,t))}',
          fs.readFileSync(path.join(__dirname, '../../../tools/probes/nonce_lt_probe.txt'), 'utf8').trim(),
        );
        nonceSource = nonceSource.replace(
          'function mt(n){return re[te]=n,te++}',
          fs.readFileSync(path.join(__dirname, '../../../tools/probes/nonce_mt_probe.txt'), 'utf8').trim(),
        );
        nonceSource = nonceSource.replace(
          'function Tt(n,r){return mt(re[n][r])}',
          fs.readFileSync(path.join(__dirname, '../../../tools/probes/nonce_tt_probe.txt'), 'utf8').trim(),
        );
        nonceSource = nonceSource.replace(
          'function Mt(n,r){return(0,fe[n])(r)}function Nt(n,r){return(0,fe[n])(r)}function qt(n,r,t){return(0,fe[n])(r,t)}',
          fs.readFileSync(path.join(__dirname, '../../../tools/probes/nonce_dispatch_probe.txt'), 'utf8').trim().replaceAll('\n', ''),
        );
        nonceSource = nonceSource.replace(
          'function Qt(n,r){return mt(new fe[n](r))}',
          'function Qt(n,r){var value=new fe[n](r);if(globalThis.__nonceDispatchTrace&&globalThis.__nonceDispatchTrace.length<2000)globalThis.__nonceDispatchTrace.push({phase:globalThis.__noncePhase??null,kind:"Qt",n,arg:nonceShape(r),result:nonceShape(value),dateValue:value instanceof Date?value.valueOf():null});return mt(value)}',
        );
        nonceSource = nonceSource.replace(
          'function jn(n){return!!(0|(r=1,t=Ft(0|n),t in re[r]));var r,t}',
          fs.readFileSync(path.join(__dirname, '../../../tools/probes/nonce_jn_probe.txt'), 'utf8').trim(),
        );
        nonceSource = nonceSource.replace(
          'ue=(fe=[$i=null]).push.bind(fe)',
          'ue=(fe=[$i=null],function(){var start=fe.length,result=fe.push.apply(fe,arguments);for(var index=0;index<arguments.length;index++){var fn=arguments[index];if(globalThis.__nonceRegistrationTrace&&globalThis.__nonceRegistrationTrace.length<500)globalThis.__nonceRegistrationTrace.push({index:start+index,phase:globalThis.__noncePhase??null,name:fn.name,length:fn.length,sourceLength:String(fn).length,sourceStart:String(fn).slice(0,100),timeMs:Number(hostProcess.hrtime.bigint()/1000000n),workerKind:globalThis.__nonceCurrentWorkerKind??null,stack:String(new Error().stack).split(String.fromCharCode(10)).slice(1,5)})}return result})',
        );
        nonceSource = nonceSource.replace(
          'j(0|Lt(0|f,Ot(0|t),Ft(2084)))&&(u=ar(t,37445)',
          '(globalThis.__nonceBranchProbe={key:Ft(2084),parentKey:Ft(2385),parentType:typeof Ot(0|t),parentTag:Object.prototype.toString.call(Ot(0|t)),parentKeys:Ot(0|t)&&typeof Ot(0|t)==="object"?Object.keys(Ot(0|t)).slice(0,15):null},globalThis.__nonceBranchProbe.condition=j(0|Lt(0|f,Ot(0|t),Ft(2084))))&&(u=ar(t,37445)',
        );
        nonceSource = nonceSource.replace(
          'function yr(){return en(732664,732668,1119,1941)}',
          'function yr(){var value=en(732664,732668,1119,1941);globalThis.__nonceYrProbe={key1:Ft(1119),key2:Ft(1941),handle:value,type:typeof Ot(0|value),tag:Object.prototype.toString.call(Ot(0|value)),truthy:!!Ot(0|value)};return value}',
        );
        nonceSource = nonceSource.replace(
          'for(i=sr(Bn()),sf[t+56>>2]=0',
          'for(i=sr(Bn()),globalThis.__nonceLoopProbe={phase:globalThis.__noncePhase??null,key:Ft(2883),tag:Object.prototype.toString.call(Ot(0|i)),length:Br(i)},globalThis.__nonceLoopProbes.push(globalThis.__nonceLoopProbe),sf[t+56>>2]=0',
        );
        nonceSource = nonceSource.replace(
          '!cf[731904]',
          '(globalThis.__nonceResourceGateTrace.push({phase:globalThis.__noncePhase??null,flag:cf[731904]}),!cf[731904])',
        );
        nonceSource = nonceSource.replace('g(t),Er()&&', 'g(t),(globalThis.__nonceErProbe=Er())&&');
        nonceSource = nonceSource.replace('function mr(n){return 0|Lt(0|Or(),Ot(0|n),Ft(1924))}',
          'function mr(n){var parent=Ot(0|n),result=0|Lt(0|Or(),parent,Ft(1924));(globalThis.__nonceMrProbe||=[]).push({phase:globalThis.__noncePhase??null,tag:Object.prototype.toString.call(parent),keys:parent&&typeof parent==="object"?Object.keys(parent).slice(0,15):null,canvasTag:Object.prototype.toString.call(parent?.canvas),result,stack:String(new Error().stack).split(String.fromCharCode(10)).slice(1,4)});return result}');
        nonceSource = nonceSource.replace(
          'function Gt(n){return(0,fe[n])()}',
          'function Gt(n){var tableLength=fe.length,fnName=fe[n].name,fnLength=fe[n].length,value=(0,fe[n])(),hash=null;if(typeof value==="string"){hash=2166136261;for(var index=0;index<value.length;index++)hash=(Math.imul(hash,16777619)^value.charCodeAt(index))>>>0}if(globalThis.__nonceGtTrace&&globalThis.__nonceGtTrace.length<500)globalThis.__nonceGtTrace.push({n,tableLength,fnName,fnLength,type:typeof value,value:typeof value==="number"||typeof value==="boolean"?value:null,stringLength:typeof value==="string"?value.length:null,stringHash:hash,keys:value&&typeof value==="object"?Object.keys(value).slice(0,8):null});return value}',
        );
      }
      const nonceInitRandom = Math.random;
      const nonceInitNow = Date.now;
      let nonceInitRandomConsumed = 0;
      let nonceInitTimeConsumed = 0;
      const nonceInitRandomFrames = [];
      const nonceInitRandomCheckpoints = [];
      const nonceInitTimeFrames = [];
      if (Array.isArray(input.nonceInitRandomTape)) {
        Math.random = () => {
          if (nonceInitRandomFrames.length < 20) nonceInitRandomFrames.push(new Error().stack?.split('\n').slice(1, 4));
          nonceInitRandomCheckpoints.push({ phase: global.__noncePhase ?? null,
            mtCount: global.__nonceMtTrace?.length ?? null,
            gtCount: global.__nonceGtTrace?.length ?? null });
          return input.nonceInitRandomTape[nonceInitRandomConsumed++] ?? nonceInitRandom();
        };
        if (typeof input.nonceMathRandomSource === 'string') {
          nativeFunctionSources.set(Math.random, input.nonceMathRandomSource);
        }
      }
      if (Array.isArray(input.nonceInitTimeTape)) {
        Date.now = () => {
          const frames = new Error().stack?.split('\n').slice(1, 4) || [];
          if (nonceInitTimeFrames.length < 20) nonceInitTimeFrames.push(frames);
          if (!frames.some(frame => frame.includes('eval at <anonymous>'))) return nonceInitNow();
          return input.nonceInitTimeTape[nonceInitTimeConsumed++] ?? nonceInitNow();
        };
      }
      if (typeof input.nonceEnvironmentOverrides?.['document.cookie'] === 'string') {
        loadCookieSnapshot(input.nonceEnvironmentOverrides['document.cookie']);
        autoEnvironmentApplied.push('document.cookie');
      }
      if (Number.isInteger(input.nonceTimerStart)) {
        const nativeSetTimeout = global.setTimeout;
        const nativeClearTimeout = global.clearTimeout;
        const timers = new Map();
        let nextTimer = input.nonceTimerStart;
        global.setTimeout = browserNative('setTimeout', function (callback, delay, ...args) {
          const id = nextTimer++;
          timers.set(id, nativeSetTimeout(() => {
            timers.delete(id);
            if (typeof callback === 'function') callback(...args);
          }, delay));
          return id;
        });
        Object.defineProperty(global.setTimeout, 'length', { configurable: true, value: 1 });
        global.clearTimeout = browserNative('clearTimeout', function (id) {
          nativeClearTimeout(timers.get(id));
          timers.delete(id);
        });
      }
      delete global.process;
      eval(nonceSource);
      global.__noncePhase = null;
      function applyNonceWindowPresence(phase) {
        const profile = input.nonceWindowPresenceByPhase?.[String(phase)] || {};
        for (const [name, present] of Object.entries(profile)) {
          if (present && !(name in global)) Object.defineProperty(global, name, {
            configurable: true, enumerable: true, writable: true, value: undefined,
          });
          if (!present && Object.hasOwn(global, name)) delete global[name];
        }
      }
      for (const name of ['FYModule', 'fyglobalopt']) {
        if (!(name in global)) Object.defineProperty(global, name, {
          configurable: true, enumerable: true, writable: true, value: undefined,
        });
      }
      if (input.nonceInitDelayMs) {
        await new Promise(resolve => setTimeout(resolve, input.nonceInitDelayMs));
      }
      if (Number.isInteger(input.noncePrePhaseWorkerCount)) {
        global.__nonceDeliverWorkerEvents?.(input.noncePrePhaseWorkerCount);
      }
      const replayNonceEvents = () => {
      for (const [eventIndex, event] of (input.events || []).entries()) {
        const target = Object.assign(element((event.target?.tag || 'div').toLowerCase()), {
          tagName: event.target?.tag || 'DIV',
          id: event.target?.id || '',
          className: event.target?.className || '',
          parentNode: document.body,
          getBoundingClientRect() {
            return event.target?.rect || {
              left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0,
            };
          },
        });
        const replay = new MouseEvent(event.type, {
          clientX: event.x, clientY: event.y,
          screenX: event.screenX ?? event.x + global.screenX,
          screenY: event.screenY ?? event.y + global.screenY,
        });
        for (const [name, value] of Object.entries({
          target, srcElement: target, timeStamp: event.timeStamp,
          pageX: event.x, pageY: event.y, buttons: event.buttons ?? 1,
          button: 0,
        })) {
          Object.defineProperty(replay, name, { configurable: true, value });
        }
        try {
          document.dispatchEvent(replay);
          for (const listener of windowListeners.get(replay.type) || []) {
            listener.call(global, replay);
          }
        } catch (error) {
          (global.__nonceEventErrors ||= []).push({ eventIndex,
            type: event.type, message: String(error).slice(0, 160) });
        }
      }
      };
      const nonceFunctionLength = String(crypto.genRandomValues).length;
      const noncePriorOutputs = [];
      const noncePriorConsumption = [];
      const noncePriorMemory = [];
      for (const args of input.noncePriorCalls || []) {
        resourcePhase++;
        global.__noncePhase = args[1];
        applyNonceWindowPresence(args[1]);
        global.__nonceDeliverWorkerEvents?.(
          input.nonceWorkerCountsByPhase?.[String(args[1])] ?? 0);
        const beforeRandom = nonceInitRandomConsumed;
        const beforeTime = nonceInitTimeConsumed;
        const memoryBefore = global.__nonceSnapshotMemory?.() ?? null;
        noncePriorOutputs.push(crypto.genRandomValues(...args));
        noncePriorMemory.push({ before: memoryBefore,
          after: global.__nonceSnapshotMemory?.() ?? null });
        noncePriorConsumption.push({ random: nonceInitRandomConsumed - beforeRandom,
          time: nonceInitTimeConsumed - beforeTime });
      }
      replayNonceEvents();
      Math.random = nonceInitRandom;
      Date.now = nonceInitNow;
      const nonceRandom = Math.random;
      const nonceNow = Date.now;
      let randomConsumed = 0;
      let timeConsumed = 0;
      if (Array.isArray(input.randomTape)) {
        Math.random = () => input.randomTape[randomConsumed++] ?? nonceRandom();
      }
      if (Array.isArray(input.timeTape)) {
        Date.now = () => input.timeTape[timeConsumed++] ?? nonceNow();
      }
      const nonceTargetMemoryBefore = global.__nonceSnapshotMemory?.() ?? null;
      applyNonceWindowPresence(input.phase);
      global.__nonceDeliverWorkerEvents?.(
        input.nonceWorkerCountsByPhase?.[String(input.phase)] ?? 0);
      const nonceTraceNames = input.traceNonceGt ? [
        '__nonceLtTrace', '__nonceMtTrace', '__nonceTtTrace',
        '__nonceDispatchTrace', '__nonceJnTrace', '__nonceGtTrace',
      ] : [];
      const nonceTraceBefore = Object.fromEntries(nonceTraceNames.map(name => [name, global[name]]));
      for (const name of nonceTraceNames) global[name] = [];
      const nonce = Object.hasOwn(input, 'phase')
        ? (resourcePhase++, global.__noncePhase = input.phase,
          crypto.genRandomValues(input.fy, input.phase))
        : (resourcePhase++, global.__noncePhase = null,
          crypto.genRandomValues(input.fy));
      const nonceTargetMemoryAfter = global.__nonceSnapshotMemory?.() ?? null;
      const nonceTargetTrace = Object.fromEntries(nonceTraceNames.map(name => [name, global[name]]));
      for (const name of nonceTraceNames) global[name] = nonceTraceBefore[name];
      Math.random = nonceRandom;
      Date.now = nonceNow;
      report(JSON.stringify({ nonce, randomConsumed, timeConsumed,
        nonceInitRandomConsumed, nonceInitTimeConsumed, noncePriorOutputs,
        noncePriorMemory, nonceTargetMemoryBefore, nonceTargetMemoryAfter,
        noncePriorConsumption, nonceFunctionLength,
        nonceBeforeInitCall: global.__nonceBeforeInitCall,
        nonceAfterInitCall: global.__nonceAfterInitCall,
        nonceInitOutput: global.__nonceInitOutput,
        nonceEnvironmentBeforeInit: global.__nonceEnvironmentBeforeInit,
        nonceInitRandomFrames, nonceInitRandomCheckpoints, nonceInitTimeFrames,
        nonceGtTrace: global.__nonceGtTrace,
        nonceTargetTrace,
        nonceLtTrace: global.__nonceLtTrace,
        nonceMtTrace: global.__nonceMtTrace,
        nonceTtTrace: global.__nonceTtTrace,
        nonceDispatchTrace: global.__nonceDispatchTrace,
        nonceJnTrace: global.__nonceJnTrace,
        nonceMemoryBefore: global.__nonceMemoryBefore,
        nonceMemoryAfter: global.__nonceMemoryAfter,
        nonceRegistrationTrace: global.__nonceRegistrationTrace,
        nonceBranchProbe: global.__nonceBranchProbe,
        nonceYrProbe: global.__nonceYrProbe,
        nonceLoopProbe: global.__nonceLoopProbe,
        nonceLoopProbes: global.__nonceLoopProbes,
        nonceResourceGateTrace: global.__nonceResourceGateTrace,
        nonceErProbe: global.__nonceErProbe,
        nonceMrProbe: global.__nonceMrProbe,
        nonceRtcCalls: global.__nonceRtcCalls,
        nonceCanvasCalls: global.__nonceCanvasCalls,
        nonceCanvasReads: global.__nonceCanvasReads,
        nonceDomCalls: global.__nonceDomCalls,
        nonceEventErrors: global.__nonceEventErrors,
        nonceImageAssignments: global.__nonceImageAssignments,
        nonceSvgSource: global.__nonceSvgSource,
        nonceSvgRawSource: global.__nonceSvgRawSource,
        nonceImageDispatch: global.__nonceImageDispatch,
        nonceImageError: global.__nonceImageError,
        nonceDigestTrace: global.__nonceDigestTrace,
        autoEnvironmentApplied,
        nonceWorkerScriptLength: global.__nonceWorkerScript?.length,
        nonceWorkerScriptHead: global.__nonceWorkerScript?.slice(0, 200),
        nonceWorkerError: global.__nonceWorkerError,
        nonceWorkerMessageType: global.__nonceWorkerMessageType,
        nonceWorkerMessages: global.__nonceWorkerMessages,
        nonceWorkerDelivered: global.__nonceWorkerDelivered,
        ...startupCounts }));
      hostProcess.exit(hostProcess.exitCode || 0);
    }
    const uid = __fyModule.getUidToken();
    const payload = Buffer.from(reference('nonce-payload.js.b64'), 'base64');
    const zero = payload.indexOf(0);
    const nonceSource = payload.subarray(0, zero).toString('utf8')
      .replace('__DAT__', new Uint8Array(payload.subarray(zero + 1)).toString());
    eval(nonceSource);
    const nonce = crypto.genRandomValues(fy, input.phase || 1);
    if (typeof nonce !== 'string' || nonce.length !== 160) throw new Error(`nonce 输出无效: ${nonce}`);
    report(JSON.stringify({ fy, nonce, uid, randomConsumed, timeConsumed,
      fyPriorLengths: fyPriorOutputs.map(value => value.length),
      fyPriorOutputs,
      fyJsonTrace: global.__fyJsonTrace,
      fyJsonStages: global.__fyJsonStages,
      fyEventReads: global.__fyEventReads,
      fyTargetReads: global.__fyTargetReads,
      fyMethodSource: String(__fyModule.getFYToken),
      fyOrientationDispatch: global.__fyOrientationDispatch,
      fyListenerOps: global.__fyListenerOps,
      fyStorageOps: global.__fyStorageOps,
      fyDateCalls: global.__etDateCalls,
      fyTrace: global.__fyTrace, fyTraceAfterInit, fyTraceStart, fyTraceEnd,
      fyEnvironmentSnapshot, fyEvalSnapshot: global.__fyEvalSnapshot,
      fyBranchTrace: global.__fyBranchTrace,
      fyEntryTrace: global.__fyEntryTrace,
      fySerialEntryTrace: global.__fySerialEntryTrace,
      fyStyleVmInputs: global.__fyStyleVmInputs,
      fyStyleParentSteps: global.__fyStyleParentSteps,
      fyQu3Steps: global.__fyQu3Steps,
      fyXf0Writes: global.__fyXf0Writes,
      fySerialVxSteps: global.__fySerialVxSteps,
      fyXf1Steps: global.__fyXf1Steps,
      fyMr11Steps: global.__fyMr11Steps,
      fyC25Steps: global.__fyC25Steps,
      fyWindowDescriptorSnapshot: global.__fyWindowDescriptorSnapshot,
      fyPixelTrace: global.__fyPixelTrace,
      fySmallCanvasTrace: global.__fySmallCanvasTrace,
      fyDgSteps: global.__fyDgSteps,
      fyDgWindowChecks: global.__fyDgWindowChecks,
      fyDgObjectChecks: global.__fyDgObjectChecks,
      fyDgStringChecks: global.__fyDgStringChecks,
      fyDgNavigatorChecks: global.__fyDgNavigatorChecks,
      fyDgLoadChecks: global.__fyDgLoadChecks,
      fyDgLoadKeyChecks: global.__fyDgLoadKeyChecks,
      fyDgFeatureChecks: global.__fyDgFeatureChecks,
      fyDgTopPropertyChecks: global.__fyDgTopPropertyChecks,
      fyDgElementChecks: global.__fyDgElementChecks,
      fyDgCase18Checks: global.__fyDgCase18Checks,
      fyDgReturns: global.__fyDgReturns,
      fyDgCalls: global.__fyDgCalls,
      fyDg13GateChecks: global.__fyDg13GateChecks,
      fyFeatureWrites: global.__fyFeatureWrites,
      fy28Context: global.__fy28Context,
      fy115Writes: global.__fy115Writes,
      fy24Context: global.__fy24Context,
      fy24AlternateContext: global.__fy24AlternateContext,
      fyMr22Steps: global.__fyMr22Steps,
      fyMr56Steps: global.__fyMr56Steps,
      fyMr3Steps: global.__fyMr3Steps,
      fyMr43Steps: global.__fyMr43Steps,
      fyMr43Writes: global.__fyMr43Writes,
      fyMr43Lookup: global.__fyMr43Lookup,
      fyQzCalls: global.__fyQzCalls,
      fyQzSteps: global.__fyQzSteps,
      fyQz5Steps: global.__fyQz5Steps,
      fyJCalls: global.__fyJCalls,
      fyJSteps: global.__fyJSteps,
      fyJInvoke: global.__fyJInvoke,
      fyVx7Steps: global.__fyVx7Steps,
      fyVx7InnerSteps: global.__fyVx7InnerSteps,
      fyVx7Writes: global.__fyVx7Writes,
      fyMr22Gate: global.__fyMr22Gate,
      fyDg13WCall: global.__fyDg13WCall,
      fyDg14Gate: global.__fyDg14Gate,
      fyBuilderTrace: global.__fyBuilderTrace,
      fyEbSteps: global.__fyEbSteps,
      fyEbCallTrace: global.__fyEbCallTrace,
      fyMr47Steps: global.__fyMr47Steps,
      fyMr16Steps: global.__fyMr16Steps,
      fyMr47Loop: global.__fyMr47Loop,
      fyMr47D6Writes: global.__fyMr47D6Writes,
      fyMr47Writes: global.__fyMr47Writes,
      fyMrCalls: global.__fyMrCalls,
      fySerializerCalls: global.__fySerializerCalls,
      fyResourceQueries: global.__fyResourceQueries,
      fyScriptAppends: global.__fyScriptAppends,
      fyScriptCreates: global.__fyScriptCreates,
      fyUmPerfCallbackPresent,
      ...startupCounts }));
  } else {
    throw new Error(`未知模式: ${input.mode}`);
  }
} catch (error) {
  hostProcess.stderr.write(`${error.stack || error}\n`);
  hostProcess.exitCode = 1;
}
hostProcess.exit(hostProcess.exitCode || 0);
})().catch(error => {
  hostProcess.stderr.write(`${error.stack || error}\n`);
  hostProcess.exitCode = 1;
});
