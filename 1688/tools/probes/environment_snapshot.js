(() => {
  const snapshotEnvironment = () => {
  const hash = (value) => {
    let state = 2166136261;
    for (let index = 0; index < value.length; index++) {
      state = (Math.imul(state, 16777619) ^ value.charCodeAt(index)) >>> 0;
    }
    return state;
  };
  const shape = (value) => {
    if (value === null) return { type: 'null' };
    const type = typeof value;
    if (type === 'string') return { type, length: value.length, hash: hash(value) };
    if (type === 'number' || type === 'boolean' || type === 'undefined') return { type, value };
    if (type === 'function') return {
      type, name: value.name, length: value.length,
      native: Function.prototype.toString.call(value).includes('[native code]'),
    };
    return {
      type, constructor: value.constructor?.name || null,
      tag: Object.prototype.toString.call(value),
      length: typeof value.length === 'number' ? value.length : null,
      ownKeys: Object.keys(value).slice(0, 30),
    };
  };
  const property = (target, key) => {
    try {
      let owner = target;
      let depth = 0;
      let descriptor;
      while (owner && !(descriptor = Object.getOwnPropertyDescriptor(owner, key))) {
        owner = Object.getPrototypeOf(owner);
        depth++;
      }
      const value = target[key];
      const replayValue = globalThis.__nonceEnvironmentProbe && (
        value === null || ['string', 'number', 'boolean'].includes(typeof value) ||
        Array.isArray(value) && value.length <= 32 &&
        value.every((item) => item === null || ['string', 'number', 'boolean'].includes(typeof item))
      ) ? value : undefined;
      return {
        present: key in target,
        depth: descriptor ? depth : null,
        descriptor: descriptor ? {
          keys: Object.keys(descriptor),
          enumerable: descriptor.enumerable,
          configurable: descriptor.configurable,
          writable: descriptor.writable ?? null,
          get: descriptor.get ? shape(descriptor.get) : null,
          set: descriptor.set ? shape(descriptor.set) : null,
        } : null,
        value: shape(value),
        ...(replayValue !== undefined ? { replayValue } : {}),
      };
    } catch (error) {
      return { error: error.name };
    }
  };
  const groups = [
    ['window', globalThis, ['constructor', 'document', 'navigator', 'screen', 'screenTop',
      'screenLeft', 'screenX', 'screenY', 'innerWidth', 'innerHeight', 'outerWidth',
      'outerHeight', 'devicePixelRatio', 'chrome', 'crypto', 'performance', 'location',
      'history', 'PointerEvent', 'HTMLAnchorElement', 'HTMLCanvasElement',
      'WebGLRenderingContext', 'webkitRTCPeerConnection', 'AWSCInner']],
    ['document', globalThis.document, ['readyState', 'cookie', 'location', 'body',
      'documentElement', 'currentScript', 'referrer', 'visibilityState', 'hidden',
      'createElement', 'getElementsByTagName', 'addEventListener', 'hasFocus']],
    ['navigator', globalThis.navigator, ['userAgent', 'platform', 'appName', 'appVersion',
      'vendor', 'language', 'languages', 'hardwareConcurrency', 'deviceMemory',
      'webdriver', 'plugins', 'mimeTypes', 'getBattery']],
    ['screen', globalThis.screen, ['width', 'height', 'availWidth', 'availHeight',
      'availLeft', 'availTop', 'colorDepth', 'pixelDepth']],
    ['performance', globalThis.performance, ['getEntriesByType', 'now', 'timeOrigin']],
    ['HTMLAnchorElement.prototype', globalThis.HTMLAnchorElement?.prototype, ['hrefTranslate', 'href']],
    ['HTMLCanvasElement.prototype', globalThis.HTMLCanvasElement?.prototype, ['toDataURL', 'getContext']],
  ];
  const result = {};
  for (const [name, target, keys] of groups) {
    if (!target) continue;
    for (const key of keys) result[`${name}.${key}`] = property(target, key);
  }
  result['window.ownPropertyCount'] = shape(Object.getOwnPropertyNames(globalThis).length);
  result['document.ownKeys'] = shape(Object.keys(globalThis.document));
  result['navigator.ownKeys'] = shape(Object.keys(globalThis.navigator));
    return result;
  };
  if (globalThis.__nonceEnvironmentProbe) {
    globalThis.__snapshotEnvironment = snapshotEnvironment;
  } else {
    globalThis.__etEnvironmentSnapshot = snapshotEnvironment();
  }
})();
