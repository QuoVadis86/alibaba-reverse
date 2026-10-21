const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const reference = path.resolve(__dirname, '../assets');
const source = fs.readFileSync(path.join(reference, 'punish-inline-vm.js'), 'utf8');
const wasm = fs.readFileSync(path.join(reference, 'punish-program.wasm'));

function createPpModule() {
  let memory;
  const bytes = () => new Uint8Array(memory.buffer);
  const module = new WebAssembly.Module(wasm);
  const instance = new WebAssembly.Instance(module, { a: {
    a: () => 0,
    b: () => 1,
    c: () => Date.now(),
    d: (destination, source, length) =>
      bytes().copyWithin(destination, source, source + length),
  } });
  const exports = instance.exports;
  memory = exports.e;
  return {
    module,
    instance,
    _pp: (...args) => exports.j(...args),
    _free: (pointer) => exports.i(pointer),
    _UTF8ToString: (...args) => exports.h(...args),
    stringToNewUTF8(value) {
      const encoded = new TextEncoder().encode(value);
      const pointer = exports.g(encoded.length + 1);
      bytes().set(encoded, pointer);
      bytes()[pointer + encoded.length] = 0;
      return pointer;
    },
    UTF8ToString(pointer, length) {
      if (!pointer) return '';
      const buffer = bytes();
      const limit = length === undefined
        ? buffer.length : Math.min(buffer.length, pointer + length);
      let end = pointer;
      while (end < limit && buffer[end]) end++;
      return new TextDecoder().decode(buffer.subarray(pointer, end));
    },
  };
}

function replay(input) {
  const page = input.page;
  const location = new URL(page.url);
  const slider = {
    className: 'scratch-captcha-slider',
    tagName: 'DIV',
    offsetWidth: 320,
    offsetHeight: 26,
    getBoundingClientRect() { return page.sliderRect; },
  };
  const document = {
    cookie: page.cookie || '',
    referrer: page.referrer || '',
    title: page.title || '',
    body: {},
    getElementById() { return null; },
    getElementsByClassName(name) {
      return name === 'scratch-captcha-slider' ? [slider] : [];
    },
    querySelectorAll() { return []; },
    createElement() { return {}; },
    addEventListener() {},
  };
  const config = {
    NCTOKENSTR: page.token,
    NCAPPKEY: page.appKey,
    SECDATA: page.x5secdata,
    HOST: page.host,
    PATH: page.path,
    action: page.action,
    pp: page.pp,
    ppSign: page.ppSign,
    ppModule: createPpModule(),
    ppt: page.ppt,
  };
  const writes = [];
  let ppSign = config.ppSign;
  Object.defineProperty(config, 'ppSign', {
    enumerable: true,
    configurable: true,
    get() { return ppSign; },
    set(value) { ppSign = value; writes.push(value); },
  });
  let currentCommand = '';
  const errorCount = {};
  class BrowserError extends Error {
    constructor(...args) {
      super(...args);
      const count = errorCount[currentCommand] = (errorCount[currentCommand] || 0) + 1;
      const initP = currentCommand.startsWith('_$P') &&
        !['_$PP', '_$PS', '_$PU', '_$PO'].includes(currentCommand);
      const script = initP ? 'punishpage.min.js' : 'index.js';
      this.stack = `Error[#${count}]\n    at ${script}:1:1\n${this.stack}`;
    }
  }
  class Crypto {
    get [Symbol.toStringTag]() { return 'Crypto'; }
    getRandomValues(value) { return require('node:crypto').webcrypto.getRandomValues(value); }
    randomUUID() { return require('node:crypto').randomUUID(); }
  }
  const context = {
    console: { log() {} },
    document,
    navigator: { userAgent: page.userAgent },
    location,
    Crypto,
    crypto: new Crypto(),
    _config_: config,
    Image: class Image { set src(value) { this._src = value; } },
    Error: BrowserError,
    btoa(value) { return Buffer.from(value, 'latin1').toString('base64'); },
    atob(value) { return Buffer.from(value, 'base64').toString('latin1'); },
    __forcedTrack: input.track ?? null,
  };
  Object.defineProperty(context, Symbol.toStringTag, { value: 'Window' });
  context.window = context;
  context.self = context;
  context.globalThis = context;
  vm.createContext(context);
  const needle = 'for(i=r;;i++){var g=4*i';
  if (!source.includes(needle)) throw new Error('归档 VM 版本不匹配');
  const program = input.track == null ? source : source.replace(needle,
    'for(i=r;;i++){if(i===4117&&globalThis.__forcedTrack&&globalThis.__command==="_$PS")f[4]=globalThis.__forcedTrack;var g=4*i');
  vm.runInContext(program, context);
  const initCommands = input.initCommands || [
    '_$PI', '_$PA', '_$PE', '_$PX', '_$PH', '_$PB', '_$PJ', '_$PK',
    '_$SA', '_$PF', '_$ST', '_$PL', '_$PM', '_$SB', '_$SC', '_$PN',
    '_$SU', '_$SN', '_$SO',
  ];
  for (const command of initCommands) {
    currentCommand = command;
    context.__command = command;
    context.crypto.randemUUID(null, command);
  }
  if (input.dragDelayMs > 0) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, input.dragDelayMs);
  }
  for (const { command, event: details } of input.dragCalls) {
    currentCommand = command;
    context.__command = command;
    const target = details && {
      tagName: details.targetTag,
      className: details.targetClass,
      getBoundingClientRect() { return details.targetRect; },
    };
    const event = details && {
      type: details.type,
      clientX: details.x,
      clientY: details.y,
      timeStamp: details.timeStamp,
      buttons: details.buttons,
      isTrusted: true,
      target,
      srcElement: target,
      currentTarget: {
        tagName: details.currentTargetTag || 'DOCUMENT',
        id: details.currentTargetTag === 'DIV' ? 'scratch-captcha-btn' : '',
      },
    };
    context.crypto.randemUUID(event || null, command);
  }
  return { ppSign, writes };
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    process.stdout.write(JSON.stringify(replay(JSON.parse(input))));
  } catch (error) {
    process.stderr.write(`${error.stack || error}\n`);
    process.exitCode = 1;
  }
});
