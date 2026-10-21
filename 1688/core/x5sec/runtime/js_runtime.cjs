const fs = require('node:fs');
const path = require('node:path');

const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const page = input.page || {};
const pageUrl = new URL(page.url || 'https://h5api.m.1688.com/');
const report = console.log;
console.log = () => {};
const cookieJar = new Map();
for (const item of (page.cookie || '').split(';')) {
  const separator = item.indexOf('=');
  if (separator > 0) cookieJar.set(item.slice(0, separator).trim(), item.slice(separator + 1).trim());
}
function readCookie() { return [...cookieJar].map(([name, value]) => `${name}=${value}`).join('; '); }
function writeCookie(value) {
  const item = String(value).split(';', 1)[0];
  const separator = item.indexOf('=');
  if (separator > 0) cookieJar.set(item.slice(0, separator).trim(), item.slice(separator + 1).trim());
}

if (input.mode === 'et') {
  global.window = global;
  global.self = global;
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
  global.Document = function Document() {};
  const head = { appendChild() {} };
  Object.defineProperty(Document.prototype, 'head', { get() { return head; } });
  Object.defineProperty(Document.prototype, 'cookie', {
    get: readCookie,
    set: writeCookie,
  });
  const rendererInfo = { UNMASKED_VENDOR_WEBGL: 37445, UNMASKED_RENDERER_WEBGL: 37446 };
  const webglContext = {
    getExtension(name) {
      if (name === 'WEBGL_debug_renderer_info') return rendererInfo;
      if (name === 'WEBGL_lose_context') return { loseContext() {}, restoreContext() {} };
      return null;
    },
    getParameter(name) {
      if (name === 37445) return 'Google Inc. (Apple)';
      if (name === 37446) return 'ANGLE (Apple, ANGLE Metal Renderer: Apple M4, Unspecified Version)';
      return null;
    },
  };
  const canvasContext = new Proxy({
    getImageData() { return { data: new Uint8ClampedArray(4) }; },
    measureText() { return { width: 0 }; },
    createLinearGradient() { return { addColorStop() {} }; },
  }, {
    get(target, key) { return key in target ? target[key] : () => {}; },
  });
  function etElement(tag) {
    if (tag === 'canvas') return {
      style: {}, width: 300, height: 150,
      getContext(type) { return type === '2d' ? canvasContext : webglContext; },
      toDataURL() { return input.canvasData || 'data:image/png;base64,'; },
    };
    if (tag !== 'a') return { style: {}, appendChild() {}, removeChild() {}, getContext() { return { getExtension() { return null; } }; } };
    const anchor = new HTMLAnchorElement();
    Object.defineProperty(anchor, 'href', {
      set(value) { this.url = new URL(value, pageUrl); },
      get() { return this.url?.href || ''; },
    });
    for (const key of ['host', 'hostname', 'pathname', 'search', 'hash', 'protocol', 'origin']) {
      Object.defineProperty(anchor, key, { get() { return this.url?.[key] || ''; } });
    }
    return anchor;
  }
  global.document = Object.assign(new Document(), {
    addEventListener: addEtListener, removeEventListener: removeEtListener,
    querySelector() { return null; },
    createEvent() { return { initEvent() {}, initMouseEvent() {} }; },
    readyState: 'complete', visibilityState: 'visible', hidden: false,
    hasFocus() { return true; },
    referrer: page.referrer || '', title: '', URL: pageUrl.href,
    body: etElement('body'), documentElement: etElement('html'),
    currentScript: {
      src: 'https://g.alicdn.com/AWSC/et/1.83.8/et_f.js',
      getAttribute(name) {
        return name === 'src' ? this.src : null;
      },
    },
    createElement: etElement,
    getElementsByTagName(name) {
      if (name === 'head') return [head];
      if (name === 'div') return Array.from({ length: page.divCount ?? 28 }, () => etElement('div'));
      return [];
    },
  });
  document.cookie = page.cookie || '';
  global.navigator = {
    userAgent: page.userAgent || 'Mozilla/5.0', platform: 'MacIntel',
    appName: 'Netscape', appVersion: (page.userAgent || '').split('/').at(-1),
    language: 'zh-CN', languages: ['zh-CN', 'zh'], vendor: 'Google Inc.',
    hardwareConcurrency: 10, deviceMemory: 16, webdriver: false,
    vibrate() { return true; },
    plugins: Array.from({ length: 5 }, () => ({})),
    mimeTypes: Array.from({ length: 2 }, () => ({})),
  };
  global.screen = {
    colorDepth: 24, pixelDepth: 24,
    width: page.screen?.width ?? 1280,
    height: page.screen?.height ?? 720,
    availWidth: page.screen?.availWidth ?? 1280,
    availHeight: page.screen?.availHeight ?? 720,
    availLeft: 0, availTop: 0,
  };
  global.innerWidth = page.viewport?.innerWidth ?? 1280;
  global.innerHeight = page.viewport?.innerHeight ?? 720;
  global.outerWidth = page.viewport?.outerWidth ?? 1280;
  global.outerHeight = page.viewport?.outerHeight ?? 720;
  global.devicePixelRatio = page.screen?.devicePixelRatio ?? 1;
  global.location = {
    href: pageUrl.href, origin: pageUrl.origin, hostname: pageUrl.hostname,
    host: pageUrl.host, protocol: pageUrl.protocol, pathname: pageUrl.pathname,
    search: pageUrl.search, hash: pageUrl.hash,
  };
  global.history = { length: page.historyLength ?? 2 };
  const values = new Map();
  const storage = { getItem(key) { return values.get(key) ?? null; }, setItem(key, value) { values.set(key, String(value)); } };
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
    eval(fs.readFileSync(path.join(__dirname, '..', 'assets', 'et_f.js'), 'utf8'));
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
    const et = global.etSign(input.url);
    Math.random = originalRandom;
    Date.now = originalNow;
    if (typeof et !== 'string' || et.length < 100) throw new Error(`ET 输出无效: ${et}`);
    report(JSON.stringify({ et, randomConsumed, timeConsumed, traceReads, traceCalls }));
  } catch (error) {
    process.stderr.write(`${error.stack || error}\n`);
    process.exitCode = 1;
  }
  process.exit();
}

if (input.mode === 'fy_nonce' || input.mode === 'nonce_only') {
  global.EventTarget = class EventTarget {
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() { return true; }
  };
}

global.window = global;
global.self = global;
global.Document = input.mode === 'et' ? function Document() {} : class Document extends EventTarget {};
global.HTMLElement = class HTMLElement extends EventTarget {};
global.HTMLAnchorElement = class HTMLAnchorElement {};
global.HTMLScriptElement = class HTMLScriptElement {};
global.HTMLStyleElement = class HTMLStyleElement {};
global.HTMLHeadElement = class HTMLHeadElement {};
global.HTMLBodyElement = class HTMLBodyElement {};
global.HTMLDivElement = class HTMLDivElement {};
global.HTMLSpanElement = class HTMLSpanElement {};
global.HTMLCanvasElement = class HTMLCanvasElement {};
global.HTMLLinkElement = class HTMLLinkElement {};
global.WebGLRenderingContext = class WebGLRenderingContext {
  getExtension(name) {
    if (!input.webglProfile?.ext?.includes(name)) return null;
    if (name === 'WEBGL_debug_renderer_info') {
      this.debugRenderer = true;
      return { UNMASKED_VENDOR_WEBGL: 37445, UNMASKED_RENDERER_WEBGL: 37446 };
    }
    if (name === 'EXT_texture_filter_anisotropic') {
      this.anisotropy = true;
      return { MAX_TEXTURE_MAX_ANISOTROPY_EXT: 34047 };
    }
    if (name === 'WEBGL_lose_context') return { loseContext() {}, restoreContext() {} };
    return {};
  }
  getParameter(name) {
    if (name === 37445) return this.debugRenderer ? 'Google Inc. (Apple)' : null;
    if (name === 37446) {
      return this.debugRenderer
        ? 'ANGLE (Apple, ANGLE Metal Renderer: Apple M4, Unspecified Version)' : null;
    }
    if (name === 34047) return this.anisotropy ? 16 : null;
    return input.webglProfile?.params?.[name] ?? null;
  }
  getSupportedExtensions() { return input.webglProfile?.ext || []; }
  getShaderPrecisionFormat(type, precision) {
    return input.webglProfile?.precision?.find(item => item.a === type && item.b === precision)
      || { rangeMin: 0, rangeMax: 0, precision: 0 };
  }
};
global.Image = class Image { set src(value) { this._src = String(value); } get src() { return this._src; } };
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
    return key in target ? target[key] : () => [];
  },
});
const context2d = new Proxy({
  getImageData() { return { data: new Uint8ClampedArray(4) }; },
  measureText() { return { width: 0 }; },
  createLinearGradient() { return { addColorStop() {} }; },
}, { get(target, key) { return key in target ? target[key] : () => {}; } });
HTMLCanvasElement.prototype.getContext = function getContext(type) {
  if (type === '2d') return context2d;
  return type === 'webgl' && input.webglProfile ? webglContext : null;
};
HTMLCanvasElement.prototype.toDataURL = function toDataURL() {
  return input.canvasData || 'data:image/png;base64,';
};
Object.defineProperty(HTMLElement.prototype, 'innerHTML', {
  get() { return this._innerHTML || ''; },
  set(value) { this._innerHTML = String(value); },
});

function element(tag = '') {
  if (tag === 'a') {
    const anchor = new HTMLAnchorElement();
    Object.defineProperty(anchor, 'href', {
      set(value) { this.url = new URL(value, pageUrl); },
      get() { return this.url?.href || ''; },
    });
    for (const key of ['host', 'hostname', 'pathname', 'search', 'hash', 'protocol', 'origin']) {
      Object.defineProperty(anchor, key, { get() { return this.url?.[key] || ''; } });
    }
    return anchor;
  }
  if (tag === 'canvas') {
    return Object.assign(new HTMLCanvasElement(), { tag, style: {}, appendChild() {}, removeChild() {} });
  }
  return {
    tag, style: {}, childNodes: [], appendChild() {}, removeChild() {},
    canPlayType() { return ''; }, getContext() { return webglContext; },
  };
}

const head = element('head');
Object.defineProperty(Document.prototype, 'head', { get() { return head; } });
Object.defineProperty(Document.prototype, 'cookie', {
  get: readCookie,
  set: writeCookie,
});
Document.prototype.createElement = element;
Document.prototype.getElementById = function getElementById() { return null; };
Document.prototype.hasFocus = function hasFocus() { return true; };
Document.prototype.querySelectorAll = function querySelectorAll() { return []; };
global.document = Object.assign(new Document(), {
  readyState: 'complete', referrer: page.referrer || '', title: '', URL: pageUrl.href,
  querySelector() { return null; },
  body: element('body'), documentElement: element('html'),
  getElementsByTagName(name) {
    if (name === 'head') return [head];
    if (name === 'body') return [this.body];
    if (name === 'html') return [this.documentElement];
    return [];
  },
});
document.cookie = page.cookie || '';
document.body.childNodes.push(element('div'));
const documentListeners = new Map();
document.addEventListener = (type, callback) => {
  if (typeof callback !== 'function') return;
  const callbacks = documentListeners.get(type) || [];
  callbacks.push(callback);
  documentListeners.set(type, callbacks);
};
document.removeEventListener = (type, callback) => {
  documentListeners.set(type, (documentListeners.get(type) || []).filter(item => item !== callback));
};
document.dispatchEvent = event => {
  for (const callback of documentListeners.get(event.type) || []) callback.call(document, event);
  return true;
};

global.Navigator = class Navigator {
  get userAgent() { return page.userAgent || 'Mozilla/5.0'; }
  get appName() { return 'Netscape'; }
  get appVersion() { return (page.userAgent || '').split('/').at(-1); }
  get platform() { return 'MacIntel'; }
  get language() { return 'zh-CN'; }
  get languages() { return ['zh-CN', 'zh']; }
  get vendor() { return 'Google Inc.'; }
  get hardwareConcurrency() { return 10; }
  get deviceMemory() { return 16; }
  get webdriver() { return false; }
  get plugins() { return Array.from({ length: 5 }, () => ({})); }
  get mimeTypes() { return Array.from({ length: 2 }, () => ({})); }
};
global.navigator = new Navigator();
global.Performance = class Performance {
  get timeOrigin() { return Date.now() - 1000; }
  now() { return 1000; }
  getEntriesByType() { return []; }
};
global.performance = new Performance();
global.Screen = class Screen {
  get colorDepth() { return 24; }
  get pixelDepth() { return 24; }
  get width() { return page.screen?.width ?? 1280; }
  get height() { return page.screen?.height ?? 720; }
  get availWidth() { return page.screen?.availWidth ?? 1280; }
  get availHeight() { return page.screen?.availHeight ?? 720; }
  get availLeft() { return 0; }
  get availTop() { return 0; }
};
global.screen = new Screen();
global.innerWidth = page.viewport?.innerWidth ?? 1280;
global.innerHeight = page.viewport?.innerHeight ?? 720;
global.outerWidth = page.viewport?.outerWidth ?? 1280;
global.outerHeight = page.viewport?.outerHeight ?? 720;
global.devicePixelRatio = page.screen?.devicePixelRatio ?? 1;
global.location = {
  href: pageUrl.href, origin: pageUrl.origin, hostname: pageUrl.hostname,
  host: pageUrl.host, protocol: pageUrl.protocol, pathname: pageUrl.pathname,
  search: pageUrl.search, hash: pageUrl.hash,
};
global.history = { length: page.historyLength ?? 2 };
function storage() {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    clear() { values.clear(); },
  };
}
global.localStorage = storage();
global.sessionStorage = storage();
if (page.umidToken) {
  localStorage.setItem('lswucn', `${page.umidToken}@@${Math.floor(Date.now() / 1000)}`);
}
global._config_ = {
  NCTOKENSTR: page.token || '', NCAPPKEY: page.appKey || '',
  SECDATA: page.x5secdata || '', HOST: pageUrl.origin, PATH: pageUrl.pathname,
};
const windowListeners = new Map();
global.addEventListener = (type, callback) => {
  if (typeof callback !== 'function') return;
  const callbacks = windowListeners.get(type) || [];
  callbacks.push(callback);
  windowListeners.set(type, callbacks);
};
global.removeEventListener = (type, callback) => {
  windowListeners.set(type, (windowListeners.get(type) || []).filter(item => item !== callback));
};
global.matchMedia = media => ({ media, matches: false, addListener() {}, removeListener() {} });
global.requestAnimationFrame = callback => setTimeout(() => callback(Date.now()), 16);
global.cancelAnimationFrame = clearTimeout;

function reference(name) {
  return fs.readFileSync(path.join(__dirname, '..', 'assets', name), 'utf8');
}

try {
  if (input.mode === 'fy_nonce' || input.mode === 'nonce_only') {
    eval(reference('fy-index1.js'));
    const options = {
      MaxMTLog: 300, MTInterval: 4, MinMTDwnLog: 30, MaxKSLog: 14,
      MaxFocusLog: 6, MaxNGPLog: 200, NGPInterval: 4, Enable: 3,
      location: 'cn', _umopt_npfp: 1,
    };
    __fyModule.init(options, () => {});
    if (input.record) __fyModule.startRecord();
    for (const event of input.events || []) {
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
      const replay = {
        type: event.type, clientX: event.x, clientY: event.y,
        pageX: event.x, pageY: event.y, timeStamp: event.timeStamp,
        buttons: event.buttons ?? 1, isTrusted: true,
        button: 0,
        target, srcElement: target, currentTarget: document, view: global,
        preventDefault() {}, stopPropagation() {},
      };
      document.dispatchEvent(replay);
      for (const callback of windowListeners.get(replay.type) || []) callback.call(global, replay);
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
    const fy = Object.hasOwn(input, 'fyOptions')
      ? __fyModule.getFYToken(input.fyOptions)
      : __fyModule.getFYToken();
    Math.random = originalRandom;
    Date.now = originalNow;
    if (typeof fy !== 'string' || !fy.startsWith('234!')) throw new Error(`FY 输出无效: ${fy}`);
    if (input.mode === 'nonce_only') {
      const payload = Buffer.from(reference('nonce-payload.js.b64'), 'base64');
      const zero = payload.indexOf(0);
      const nonceSource = payload.subarray(0, zero).toString('utf8')
        .replace('__DAT__', new Uint8Array(payload.subarray(zero + 1)).toString());
      eval(nonceSource);
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
      const nonce = Object.hasOwn(input, 'phase')
        ? crypto.genRandomValues(input.fy, input.phase)
        : crypto.genRandomValues(input.fy);
      Math.random = nonceRandom;
      Date.now = nonceNow;
      report(JSON.stringify({ nonce, randomConsumed, timeConsumed }));
      process.exit();
    }
    const uid = __fyModule.getUidToken();
    const payload = Buffer.from(reference('nonce-payload.js.b64'), 'base64');
    const zero = payload.indexOf(0);
    const nonceSource = payload.subarray(0, zero).toString('utf8')
      .replace('__DAT__', new Uint8Array(payload.subarray(zero + 1)).toString());
    eval(nonceSource);
    const nonce = crypto.genRandomValues(fy, input.phase || 1);
    if (typeof nonce !== 'string' || nonce.length !== 160) throw new Error(`nonce 输出无效: ${nonce}`);
    report(JSON.stringify({ fy, nonce, uid, randomConsumed, timeConsumed }));
  } else {
    throw new Error(`未知模式: ${input.mode}`);
  }
} catch (error) {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
}
process.exit();
