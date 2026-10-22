async (page) => {
  const challenge = CHALLENGE_PAYLOAD;
  const saveEtSource = SAVE_ET_SOURCE_PAYLOAD;
  const traceEtPc = TRACE_ET_PC_PAYLOAD;
  const traceNonceGt = TRACE_NONCE_GT_PAYLOAD;
  const probeFy = PROBE_FY_PAYLOAD;
  const traceFyBranch = TRACE_FY_BRANCH_PAYLOAD;
  const etPcProbe = ET_PC_PROBE_PAYLOAD;
  const etWProbe = ET_W_PROBE_PAYLOAD;
  const environmentProbe = ENVIRONMENT_PROBE_PAYLOAD;
  const nonceLtProbe = NONCE_LT_PROBE_PAYLOAD;
  const nonceMtProbe = NONCE_MT_PROBE_PAYLOAD;
  const nonceTtProbe = NONCE_TT_PROBE_PAYLOAD;
  const nonceDispatchProbe = NONCE_DISPATCH_PROBE_PAYLOAD;
  const nonceMemoryProbe = NONCE_MEMORY_PROBE_PAYLOAD;
  const nonceJnProbe = NONCE_JN_PROBE_PAYLOAD;
  if (probeFy) await page.addInitScript(() => {
    window.__fyEarlyCalls = [];
  });
  if (traceFyBranch) await page.addInitScript(() => {
    window.__fyBranchTrace = [];
    window.__fyEntryTrace = [];
    window.__fySerialEntryTrace = [];
    window.__fySerialVxSteps = [];
    window.__fyXf1Steps = [];
    window.__fyMr11Steps = [];
    window.__fyMr11CallCount = 0;
    window.__fyC25Steps = [];
    window.__fyC25CallCount = 0;
    Object.defineProperty(window, '__fySerializing', {
      configurable: true, writable: true, value: false,
    });
    window.__fyPixelTrace = [];
    window.__fyDgSteps = [];
    window.__fyDgWindowChecks = [];
    window.__fyDgObjectChecks = [];
    window.__fyDgStringChecks = [];
    window.__fyDgNavigatorChecks = [];
    window.__fyDgLoadChecks = [];
    window.__fyDgLoadKeyChecks = [];
    window.__fyDgFeatureChecks = [];
    window.__fyDgTopPropertyChecks = [];
    window.__fyDgElementChecks = [];
    window.__fyDgCase18Checks = [];
    window.__fyDgReturns = [];
    window.__fyDgCalls = [];
    window.__fyDg13GateChecks = [];
    window.__fyFeatureWrites = [];
    window.__fy115Writes = [];
    window.__fy24Context = [];
    window.__fyMr22Steps = [];
    window.__fyMr56Steps = [];
    window.__fyMr3Steps = [];
    window.__fyMr43Steps = [];
    window.__fyMr43Writes = [];
    window.__fyMr43Lookup = [];
    window.__fyQzCalls = [];
    window.__fyQzSteps = [];
    window.__fyQz5Steps = [];
    window.__fyStyleVmInputs = [];
    window.__fyStyleParentSteps = [];
    window.__fyQu3Steps = [];
    window.__fyXf0Writes = [];
    window.__fyQz5CallCount = 0;
    window.__fyJCalls = [];
    window.__fyJSteps = [];
    window.__fyJInvoke = [];
    window.__fyVx7Steps = [];
    window.__fyVx7InnerSteps = [];
    window.__fyVx7Writes = [];
    window.__fyMr22Gate = [];
    window.__fyDg13WCall = [];
    window.__fyDg14Gate = [];
    window.__fyBuilderTrace = [];
    window.__fyEbSteps = [];
    window.__fyEbCallTrace = [];
    window.__fyMr47Steps = [];
    window.__fyMr16Steps = [];
    window.__fyMr47Loop = [];
    window.__fyMr47D6Writes = [];
    window.__fyMr47Writes = [];
    window.__fyMrCalls = [];
    window.__fyListenerRegistrations = [];
    const addListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      if (String(type).toLowerCase().includes('orientation')) {
        window.__fyListenerRegistrations.push({ type: String(type),
          targetTag: Object.prototype.toString.call(this),
          targetIsWindow: this === window,
          targetIsDocument: this === document,
          mr: window.__fyLastMr,
          stack: new Error().stack.split('\n').slice(1, 5) });
      }
      return addListener.call(this, type, listener, options);
    };
    window.__fySerializerCalls = [];
    window.__fyCryptoRandom = [];
    const getRandomValues = Crypto.prototype.getRandomValues;
    Crypto.prototype.getRandomValues = function (array) {
      const value = getRandomValues.call(this, array);
      const stack = new Error().stack.split('\n').slice(1, 5);
      if (stack.some((frame) => frame.includes('index1.js'))) {
        window.__fyCryptoRandom.push({ length: array.length,
          bytes: Array.from(array), stack });
      }
      return value;
    };
    window.__fyValueSig = (value) => {
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
    window.__fyDeepSig = (value, detail = false) => {
      const seen = new WeakSet();
      const walk = (item, depth) => {
        if (item === null || typeof item !== 'object') return window.__fyValueSig(item);
        if (item === window) return ['window'];
        if (seen.has(item)) return ['cycle'];
        seen.add(item);
        const tag = Object.prototype.toString.call(item);
        const keys = Object.keys(item);
        if (depth === 0) return [tag, keys.length];
        return [tag, keys.length, keys.slice(0, 256).map((key) => {
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
    Object.defineProperty(window, '__fyWindowDescriptorSnapshot', {
      configurable: true, writable: true, value: null,
    });
    Object.defineProperty(window, '__fyDescribeWindow', {
      configurable: true, value: () => Object.fromEntries(
        Object.getOwnPropertyNames(window).map(name => {
          const descriptor = Object.getOwnPropertyDescriptor(window, name);
          if (!descriptor) return [name, null];
          return [name, {
            enumerable: descriptor.enumerable,
            configurable: descriptor.configurable,
            writable: 'writable' in descriptor ? descriptor.writable : null,
            value: 'value' in descriptor ? window.__fyValueSig(descriptor.value) : null,
            getter: typeof descriptor.get === 'function'
              ? window.__fyValueSig(descriptor.get) : null,
          }];
        }),
      ),
    });
    window.__fyResourceQueries = [];
  });
  if (traceNonceGt || probeFy) await page.addInitScript({
    content: 'globalThis.__nonceEnvironmentProbe=true;' + environmentProbe,
  });
  if (traceEtPc) await page.addInitScript(() => { window.__etPcTrace = []; window.__etPcMetadata = []; window.__etValueTrace = []; window.__etSeedTrace = []; });
  if (traceNonceGt) await page.addInitScript(() => {
    window.__nonceGtTrace = [];
    window.__nonceLtTrace = [];
    window.__nonceMtTrace = [];
    window.__nonceTtTrace = [];
    window.__nonceDispatchTrace = [];
    window.__nonceJnTrace = [];
    window.__nonceRegistrationTrace = [];
    window.__nonceResourceGateTrace = [];
    window.__nonceLoopProbes = [];
    window.__nonceWorkerMessages = [];
    window.__nonceWorkerEvents = [];
    window.__nonceRtcCalls = [];
    window.__nonceIceEvents = [];
    const watchedPeers = new WeakSet();
    window.__nonceImageLoads = [];
    window.__nonceDigestTrace = [];
    const digest = SubtleCrypto.prototype.digest;
    SubtleCrypto.prototype.digest = function (algorithm, data) {
      const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) :
        new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      let hash = 2166136261;
      for (const byte of bytes) hash = (Math.imul(hash, 16777619) ^ byte) >>> 0;
      const record = { algorithm: String(algorithm), length: bytes.length, hash };
      window.__nonceDigestTrace.push(record);
      const result = digest.call(this, algorithm, data);
      result.then((output) => { record.output = Array.from(new Uint8Array(output)); });
      return result;
    };
    const imageSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      configurable: imageSrc.configurable,
      enumerable: imageSrc.enumerable,
      get() { return imageSrc.get.call(this); },
      set(value) {
        const record = { src: String(value), loaded: false };
        window.__nonceImageLoads.push(record);
        this.addEventListener('load', () => {
          record.loaded = true;
          record.width = this.naturalWidth;
          record.height = this.naturalHeight;
        }, { once: true });
        return imageSrc.set.call(this, value);
      },
    });
    for (const method of ['createDataChannel', 'createOffer', 'setLocalDescription']) {
      const original = RTCPeerConnection.prototype[method];
      RTCPeerConnection.prototype[method] = function (...args) {
        window.__nonceRtcCalls.push({ method, argumentCount: args.length });
        if (!watchedPeers.has(this)) {
          watchedPeers.add(this);
          this.addEventListener('icecandidate', (event) => {
            window.__nonceIceEvents.push({ candidate: event.candidate?.candidate || null,
              type: event.type });
          });
        }
        return original.apply(this, args);
      };
    }
    const watchedWorkers = new WeakSet();
    const send = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (...args) {
      const value = args[0];
      if (!watchedWorkers.has(this)) {
        watchedWorkers.add(this);
        this.addEventListener('message', (event) => {
          window.__nonceWorkerEvents.push({ type: typeof event.data,
            data: event.data });
        });
      }
      window.__nonceWorkerMessages.push({ type: typeof value,
        length: typeof value === 'string' ? value.length : null });
      return send.apply(this, args);
    };
  });
  await page.context().clearCookies();
  await page.context().addCookies(challenge.cookies);
  await page.unrouteAll();
  if (TRACE_ET_VM) await page.addInitScript(() => {
    window.__etVmScTrace = [];
    window.__etVmState = { count: 0, hash: 2166136261, checkpoints: [] };
    window.__etVmDivergence = [];
    window.__etVmFlags = [];
    window.__etReturnTrace = [];
    window.__etBranchTrace = [];
    window.__etCaTrace = [];
    window.__etAaTrace = [];
    window.__etStartupFingerprint = null;
    window.__etWTrace = [];
    window.__etW89Trace = [];
    window.__etW28Trace = [];
    window.__etHashInputs = [];
    window.__etEnvironmentChecks = [];
    window.__etHashLoop2 = [];
    window.__etInitProbe = [];
    window.__etInitCookie = null;
    window.__etAwscCalls = [];
    window.__etArithmeticProbe = [];
    window.__etPayloadBytes = null;
  });
  if (STARTUP_TRACE) await page.addInitScript(() => {
    const trace = window.__x5Startup = { random: [], time: [], performance: [], storage: [], dateConstruct: [] };
    const nativeDate = window.Date;
    window.Date = new Proxy(nativeDate, {
      construct(target, args, newTarget) {
        const value = Reflect.construct(target, args, newTarget);
        if (args.length === 0 && trace.dateConstruct.length < 500) {
          const stack = new Error().stack?.split('\n').slice(1, 4) || [];
          if (stack.some(frame => frame.includes('index1.js'))) {
            trace.dateConstruct.push({ value: value.getTime(), stack });
          }
        }
        return value;
      },
    });
    for (const method of ['getItem', 'setItem']) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function (...args) {
        const value = original.apply(this, args);
        if (!window.__x5InitDone && trace.storage.length < 200) {
          trace.storage.push({ method, key: String(args[0]),
            valueLength: (method === 'getItem' ? value : String(args[1]))?.length ?? null,
            stack: String(args[0]) === 'lswucn'
              ? new Error().stack.split('\n').slice(1, 5) : null });
        }
        return value;
      };
    }
    const random = Math.random;
    const now = Date.now;
    Math.random = function () {
      const value = random();
      if (window.__x5NonceCall) window.__x5NonceCall.random.push(value);
      const stack = new Error().stack?.split('\n').slice(1, 4) || [];
      if (stack.some(frame => frame.includes('index1.js'))) {
        window.__fyStartupRandomCount = (window.__fyStartupRandomCount || 0) + 1;
      }
      if (window.__fyStartupRandomCount === 3 &&
          stack.some(frame => frame.includes('index1.js')) && !window.__fyEvalSnapshot) {
        const names = Object.getOwnPropertyNames(window);
        const snapshot = window.__snapshotEnvironment?.();
        window.__fyEvalSnapshot = snapshot;
        window.__fyEvalWindowNames = names;
      }
      if (stack.some(frame => frame.includes('eval at t'))) {
        (window.__nonceRandomAll ||= []).push(value);
        (window.__nonceRandomCheckpoints ||= []).push({
          phase: window.__noncePhase ?? null,
          mtCount: window.__nonceMtTrace?.length ?? null,
          gtCount: window.__nonceGtTrace?.length ?? null,
        });
      }
      if (!window.__x5InitDone && trace.random.length < 5000) {
        trace.random.push({ value, stack,
          fyEarlyCount: stack.some(frame => frame.includes('index1.js'))
            ? window.__fyEarlyCalls?.length ?? null : undefined,
          fyRegisterCount: stack.some(frame => frame.includes('index1.js'))
            ? window.__fyRegisterCount ?? 0 : undefined });
      }
      return value;
    };
    Date.now = function () {
      const value = now();
      if (window.__x5NonceCall) window.__x5NonceCall.time.push(value);
      if (!window.__x5InitDone && trace.time.length < 5000) {
        trace.time.push({ value, stack: new Error().stack?.split('\n').slice(1, 4) });
      }
      return value;
    };
    const performanceNow = Performance.prototype.now;
    Performance.prototype.now = function () {
      const value = performanceNow.call(this);
      if (window.__x5NonceCall) window.__x5NonceCall.performance.push(value);
      if (!window.__x5InitDone && trace.performance.length < 5000) {
        trace.performance.push({ value, stack: new Error().stack?.split('\n').slice(1, 4) });
      }
      return value;
    };
  });
  await page.addInitScript(() => {
    window.__nonceEarlyCalls = [];
    window.__nonceEarlyAssignments = [];
    const callbacks = new WeakMap();
    Object.defineProperty(Crypto.prototype, 'genRandomValues', {
      configurable: true,
      get() { return callbacks.get(this); },
      set(callback) {
        const assignment = window.__nonceEarlyAssignments.length;
        window.__nonceEarlyAssignments.push({ type: typeof callback,
          length: typeof callback === 'function' ? String(callback).length : null });
        const wrapped = function (...args) {
          const resources = performance.getEntriesByType('resource')
            .map((entry) => entry.toJSON());
          const workerEventCount = window.__nonceWorkerEvents?.length ?? 0;
          const windowNames = Object.getOwnPropertyNames(window);
          const windowKeys = Object.keys(window);
          if (window.__nonceEarlyCalls.length === 0 && window.__snapshotEnvironment) {
            window.__nonceEnvironmentBeforeInit = window.__snapshotEnvironment();
            window.__nonceResourceEntries = resources;
            window.__nonceStateBeforeInit = {
              config: { ...window._config_ },
              localStorage: Object.fromEntries(Object.entries(localStorage)),
              sessionStorage: Object.fromEntries(Object.entries(sessionStorage)),
              windowKeys: Object.keys(window),
              windowNames: Object.getOwnPropertyNames(window),
              prototypeKeys: Object.fromEntries([
                'HTMLScriptElement', 'HTMLStyleElement', 'HTMLHeadElement',
                'HTMLBodyElement', 'HTMLDivElement', 'HTMLSpanElement',
                'HTMLCanvasElement', 'HTMLLinkElement',
              ].map(name => [name, Object.keys(window[name].prototype)])),
            };
          }
          const beforeRandomCount = window.__x5Startup?.random.length ?? null;
          const beforeTimeCount = window.__x5Startup?.time.length ?? null;
          const tapes = { random: [], time: [], performance: [] };
          const previous = window.__x5NonceCall;
          const previousPhase = window.__noncePhase;
          window.__noncePhase = args[1];
          window.__x5NonceCall = tapes;
          const memoryBefore = window.__nonceSnapshotMemory?.() ?? null;
          let output;
          try { output = callback.apply(this, args); }
          finally { window.__x5NonceCall = previous; window.__noncePhase = previousPhase; }
          const memoryAfter = window.__nonceSnapshotMemory?.() ?? null;
          window.__nonceEarlyCalls.push({ args: args.slice(0, 2), output,
            assignment, tapes, resources, windowNames, windowKeys,
            workerEventCount,
            memoryBefore, memoryAfter,
            beforeRandomCount, beforeTimeCount,
            randomCount: window.__x5Startup?.random.length ?? null,
            timeCount: window.__x5Startup?.time.length ?? null });
          return output;
        };
        Object.defineProperty(wrapped, 'toString', {
          configurable: true, value: () => String(callback),
        });
        Object.defineProperty(wrapped, 'length', {
          configurable: true, value: callback.length,
        });
        Object.defineProperty(wrapped, 'name', {
          configurable: true, value: callback.name,
        });
        callbacks.set(this, wrapped);
      },
    });
  });
  await page.addInitScript(() => {
    const trace = window.__x5Environment = { canvas: [], webgl: [], canvas2d: [] };
    const canvas = HTMLCanvasElement.prototype;
    const toDataURL = canvas.toDataURL;
    canvas.toDataURL = function (...args) {
      const value = toDataURL.apply(this, args);
      if (trace.canvas.length < 500) trace.canvas.push({ method: 'toDataURL', args,
        width: this.width, height: this.height,
        stack: new Error().stack?.split('\n').slice(1, 5),
        valueLength: value.length, value: TRACE_ET_VM ? undefined : value });
      return value;
    };
    const getContext = canvas.getContext;
    canvas.getContext = function (...args) {
      const value = getContext.apply(this, args);
      if (trace.canvas.length < 500) {
        trace.canvas.push({ method: 'getContext', args, found: !!value,
          stack: new Error().stack?.split('\n').slice(1, 5) });
      }
      return value;
    };
    for (const method of ['drawImage', 'getImageData', 'fillRect', 'clearRect',
      'putImageData', 'fillText', 'strokeText', 'strokeRect', 'beginPath',
      'moveTo', 'lineTo', 'arc', 'rect', 'fill', 'stroke']) {
      const original = CanvasRenderingContext2D.prototype[method];
      if (typeof original !== 'function') continue;
      CanvasRenderingContext2D.prototype[method] = function (...args) {
        const result = original.apply(this, args);
        if (window.__nonceEnvironmentProbe && (trace.canvas2d.length < 40 ||
          (this.canvas.width === 64 &&
            trace.canvas2d.filter(entry => entry.canvasWidth === 64).length < 40))) {
          const source = method === 'drawImage' ? args[0] : null;
          const record = { method, canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            fillStyle: String(this.fillStyle),
            globalCompositeOperation: this.globalCompositeOperation,
            font: this.canvas.width === 64 ? this.font : undefined,
            text: this.canvas.width === 64 && method === 'fillText'
              ? String(args[0]) : undefined,
            sourceLength: source?.src?.length ?? null,
            sourcePrefix: source?.src?.slice(0, 32) ?? null,
            args: args.slice(method === 'drawImage' ? 1 : 0).map(value =>
              typeof value === 'number' ? value : typeof value),
            imageWidth: result?.width ?? null, imageHeight: result?.height ?? null };
          if (method === 'getImageData' && result?.width === 1024 && result?.height === 1024) {
            record.rows = {};
            for (const y of [0, 1, 2, 5, 25, 50, 100, 150, 200, 250,
              300, 400, 500, 600, 750, 1000]) {
              const runs = [];
              let previous = '';
              for (let x = 0; x < 1024; x++) {
                const offset = (y * 1024 + x) * 4;
                const shade = Array.from(result.data.subarray(offset, offset + 4)).join(',');
                if (shade !== previous) runs.push([x, shade]);
                previous = shade;
              }
              record.rows[y] = runs;
            }
          }
          if (method === 'getImageData' && result?.width === 64 && result?.height === 64) {
            record.pixelData = Array.from(result.data);
            record.pixelHead = Array.from(result.data.slice(0, 32));
            record.pixelMiddle = Array.from(result.data.slice(8192, 8224));
            record.pixelTail = Array.from(result.data.slice(-32));
            record.pixelNonzero = result.data.reduce((count, value) => count + (value !== 0), 0);
          }
          trace.canvas2d.push(record);
        }
        return result;
      };
    }
    for (const method of ['getParameter', 'getExtension', 'getSupportedExtensions',
      'getContextAttributes', 'getAttribLocation', 'getShaderPrecisionFormat']) {
      const original = WebGLRenderingContext.prototype[method];
      if (typeof original !== 'function') continue;
      WebGLRenderingContext.prototype[method] = function (...args) {
        const value = original.apply(this, args);
        if (trace.webgl.length < 1000) trace.webgl.push({ method, args, value,
          valueTag: Object.prototype.toString.call(value),
          precision: method === 'getShaderPrecisionFormat' && value
            ? { rangeMin: value.rangeMin, rangeMax: value.rangeMax,
              precision: value.precision } : null,
          stack: new Error().stack?.split('\n').slice(1, 5) });
        return value;
      };
    }
  });
  let etAssetStats = null;
  let fyRoutePatched = false;
  if (probeFy) await page.route('**/AWSC/CAPTCHA/0.0.1/awsc.js', async (route) => {
    const response = await route.fetch();
    const source = await response.text();
    const marker = 'e.AWSCInner.register=U';
    if (!source.includes(marker)) {
      await route.fulfill({ response, body: source });
      return;
    }
    const instrumentation = `e.AWSCInner.register=function(e,t,n){
      if(t==="fy")window.__fyRegisterCount=(window.__fyRegisterCount||0)+1;
      if(t==="fy"&&n){
        for(const name of Object.keys(n)){
          if(typeof n[name]!=="function")continue;
          const original=n[name];
          n[name]=function(...args){
            const entry={name,args:args.map(value=>{try{return JSON.parse(JSON.stringify(value))}catch{return String(value)}}),beforeHook:!window.__x5InitDone,cookie:document.cookie,windowNames:Object.getOwnPropertyNames(window),resourceEntries:performance.getEntriesByType('resource').map(value=>value.toJSON()),memoryValues:performance.memory?{jsHeapSizeLimit:performance.memory.jsHeapSizeLimit,totalJSHeapSize:performance.memory.totalJSHeapSize,usedJSHeapSize:performance.memory.usedJSHeapSize}:null,
              environmentStart:Object.fromEntries(["canvas","webgl"].map(key=>[key,window.__x5Environment?.[key]?.length??0]))};
            const random=Math.random,now=Date.now,nativeDate=window.Date;
            entry.randomTape=[];entry.timeTape=[];entry.dateTape=[];
            Math.random=function(){const value=random();entry.randomTape.push(value);return value};
            Date.now=function(){const value=now();entry.timeTape.push(value);return value};
            window.Date=new Proxy(nativeDate,{construct(target,dateArgs,newTarget){const value=Reflect.construct(target,dateArgs,newTarget);if(dateArgs.length===0)entry.dateTape.push(value.getTime());return value}});
            window.__fyEarlyCalls.push(entry);
            try{const output=original.apply(this,args);if(name==="getFYToken"||name==="getUidToken")entry.output=output;return output}
            finally{entry.environmentEnd=Object.fromEntries(["canvas","webgl"].map(key=>[key,window.__x5Environment?.[key]?.length??0]));Math.random=random;Date.now=now;window.Date=nativeDate}
          }
        }
      }
      return U.apply(this,arguments)
    }`;
    fyRoutePatched = true;
    await route.fulfill({ response, body: source.replace(marker, instrumentation) });
  });
  let etSourceBody = null;
  let nonceEntrySourceBody = null;
  const assetStats = (body) => {
    let hash = 2166136261;
    for (let index = 0; index < body.length; index++) hash = (Math.imul(hash, 16777619) ^ body.charCodeAt(index)) >>> 0;
    return { length: body.length, hash };
  };
  let fyAssetStats = null;
  let fyInstrumentedSnippet = null;
  if (probeFy) await page.route('**/seclab/f/index1.js', async (route) => {
    const response = await route.fetch();
    const source = await response.text();
    fyAssetStats = assetStats(source);
    const marker = 'O==E?d[7]=d[9]?520:201:O<E?O==m?';
    if (traceFyBranch && !source.includes(marker)) throw new Error('FY 分支探针位置不存在');
    let body = traceFyBranch ? source.replace(marker,
      '(globalThis.__fyBranchTrace.length<2000&&globalThis.__fyBranchTrace.push({opcode:O,pc:d[7],flag:!!d[9],stack:new Error().stack.split("\\n").slice(1,5)}),O)==E?d[7]=d[9]?520:201:O<E?O==m?') : source;
    if (traceFyBranch) {
      for (const [needle, code] of [
        ['function DG(zU,dC,eM,Kt,wZ,Hj){', 'DG'],
        ['function mr(v,z,s,AN,JY,eo){', 'mr'],
        ['function xf(yg,kZ,dn,uu,h5,L2){', 'xf'],
      ]) {
        if (!body.includes(needle)) throw new Error(`FY 入口探针位置不存在: ${code}`);
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
            ? 'globalThis.__fyLastMr=v;if(globalThis.__fyMrCalls.length<500)globalThis.__fyMrCalls.push({source:globalThis.__fyMrCalls.length===0?String(mr):null,v:typeof v==="number"||typeof v==="string"?v:null,vType:typeof v,thisTag:Object.prototype.toString.call(this),thisValue:typeof this==="number"?this:null,vTag:Object.prototype.toString.call(v),vKeys:v&&typeof v==="object"?Object.getOwnPropertyNames(v).slice(0,20):null,args:[z,s,AN,JY,eo].map(globalThis.__fyValueSig),z28:v===28?z:null,eventType:v?.type,eventData:v?.type==="deviceorientation"?{alpha:v.alpha,beta:v.beta,gamma:v.gamma,absolute:v.absolute,interval:v.interval}:null,targetTag:Object.prototype.toString.call(v?.target),dataTag:Object.prototype.toString.call(v?.data),isTrusted:v?.isTrusted,timeStamp:v?.timeStamp,time:performance.now(),earlyCount:globalThis.__fyEarlyCalls?.length??0,stack:new Error().stack.split("\\n").slice(1,5)});'
            : '';
        body = body.replace(needle, `${needle}${dgCall}if(globalThis.__fyEntryTrace.length<500)globalThis.__fyEntryTrace.push({fn:"${code}",arg:${arg},types:[${types}]${parts},stack:new Error().stack.split("\\n").slice(1,4)});${code === 'xf' ? 'if(globalThis.__fySerializing&&globalThis.__fySerialEntryTrace.length<3000)globalThis.__fySerialEntryTrace.push({arg:yg,argSig:[kZ,dn,uu,h5,L2].map(globalThis.__fyValueSig),argDeep:[kZ,dn,uu,h5,L2].map(globalThis.__fyDeepSig),argRaw:((globalThis.__fySerialEntryTrace.length>=270&&globalThis.__fySerialEntryTrace.length<=285)||(globalThis.__fySerialEntryTrace.length>=450&&globalThis.__fySerialEntryTrace.length<=470))?(Array.isArray(kZ)?kZ.map(v=>typeof v==="string"?v.slice(0,120):typeof v==="number"?v:null):typeof kZ==="string"?kZ.slice(0,120):typeof kZ==="number"?kZ:null):null,jsonState:globalThis.__fySerialEntryTrace.length===458?{source:String(JSON.stringify).slice(0,140),probe:JSON.stringify([1]),sigSource:String(globalThis.__fyDeepSig).slice(0,100)}:null,stack:((globalThis.__fySerialEntryTrace.length>=220&&globalThis.__fySerialEntryTrace.length<240)||(globalThis.__fySerialEntryTrace.length>=538&&globalThis.__fySerialEntryTrace.length<=545))?new Error().stack.split("\\n").slice(1,5):null});' : ''}`);
      }
      const xf1StepNeedle = 'for(d[S]=kZ,d[x]=dn,d[6]=uu,d[8]=h5,d[4]=a;d[4]!==U;){var x$=d[4]&o,eb,O=d[4]>>5&o;switch(x$){';
      if (!body.includes(xf1StepNeedle)) throw new Error('FY xf(1) 步进探针位置不存在');
      body = body.replace(xf1StepNeedle,
        'for(d[S]=kZ,d[x]=dn,d[6]=uu,d[8]=h5,d[4]=a;d[4]!==U;){var x$=d[4]&o,eb,O=d[4]>>5&o;if(globalThis.__fySerializing&&yg===0&&globalThis.__fySerialEntryTrace.length>=443&&globalThis.__fySerialEntryTrace.length<=600&&globalThis.__fyStyleParentSteps.length<1500)globalThis.__fyStyleParentSteps.push({yg,pc:d[4],entryCount:globalThis.__fySerialEntryTrace.length,rSig:globalThis.__fyValueSig(r),qSig:globalThis.__fyValueSig(Q),q0Sig:globalThis.__fyValueSig(Q?.[0]),rRaw:typeof r==="string"||typeof r==="number"?r:null,zDeep:globalThis.__fyDeepSig(z),zTail:Array.isArray(z)?z.slice(-12):null,mrDeep:globalThis.__fyDeepSig(mr),mrTail:Array.isArray(mr)?mr.slice(-12):null,d15Deep:globalThis.__fyDeepSig(d[15]),d15Tail:Array.isArray(d[15])?d[15].slice(-12):null,anSig:globalThis.__fyValueSig(AN),anRaw:typeof AN==="number"?AN:null,focus:[238,291,340,428].includes(d[4])?{B:globalThis.__fyValueSig(B),M:globalThis.__fyValueSig(M),P:globalThis.__fyValueSig(P),v:globalThis.__fyValueSig(v),z:globalThis.__fyValueSig(z),s:globalThis.__fyValueSig(s),EL:globalThis.__fyValueSig(EL),Q:globalThis.__fyValueSig(Q),Z:globalThis.__fyValueSig(Z),memory:globalThis.__fyValueSig(globalThis.performance?.memory)}:null,regSig:Object.keys(d).map(key=>[key,globalThis.__fyValueSig(d[key])])});if(yg===1&&globalThis.__fyXf1Steps.length<5000){var __fyStepIndex=globalThis.__fyXf1Steps.length;globalThis.__fyXf1Steps.push({pc:d[4],branch:x$,opcode:O,entryCount:globalThis.__fySerialEntryTrace.length,regs:__fyStepIndex<=1550?Object.keys(d).map(function(key){return[key,globalThis.__fyValueSig(d[key])]}):null,deep12:__fyStepIndex<=1550?globalThis.__fyDeepSig(d[12]):null,deep9:__fyStepIndex<=1550?globalThis.__fyDeepSig(d[9]):null,raw12:__fyStepIndex>=138&&__fyStepIndex<=142?Array.from(d[12]||[]):null,raw11:__fyStepIndex===230||__fyStepIndex===431?Array.from(d[11]||[]):null,raw24:__fyStepIndex===431?Array.from(d[24]||[]):null,styleValues:__fyStepIndex===230?Array.from(d[11]||[],function(name){return d[5]?.[name]}):null,focus:__fyStepIndex>=1475&&__fyStepIndex<=1500?{OA,B,r,sLen:s?.length,sSig:globalThis.__fyValueSig(s),sBytes:d[4]===551&&OA>650&&Array.isArray(s)?s.slice():null,sSlice:typeof s==="string"?s.slice(Math.max(0,OA-40),OA+80):null,M:globalThis.__fyValueSig(M)}:null,qSig:__fyStepIndex<=1550?globalThis.__fyValueSig(q):null,qDeep:__fyStepIndex<=1550?globalThis.__fyDeepSig(q):null,qDetail:__fyStepIndex>=218&&__fyStepIndex<=222?globalThis.__fyDeepSig(q,true):null,qItems:[231,382].includes(__fyStepIndex)?Array.from(q||[],globalThis.__fyValueSig):null,wZDetail:__fyStepIndex>=218&&__fyStepIndex<=220?globalThis.__fyDeepSig(wZ,true):null})}switch(x$){');
      for (const needle of ['q=q[C[p]](hS)):q[C[E]](0),',
                            'q=q[C[p]](xF)):q[C[E]](0),']) {
        if (!body.includes(needle)) throw new Error('FY 样式拼接探针位置不存在');
        body = body.replaceAll(needle, `${needle}globalThis.__fySerializing&&yg===1&&globalThis.__fyStyleVmInputs.push({kind:"concat",entryCount:globalThis.__fySerialEntryTrace.length,length:q.length,item133:q[133]??null,tail:q.slice(-5)}),`);
      }
      if (!body.includes('FL=d[6][C[K]],AN=92,J=C[$][AN],J=FL[AN=J],FL=J&N')) throw new Error('FY pc736 探针位置不存在');
      body = body.replace('FL=d[6][C[K]],AN=92,J=C[$][AN],J=FL[AN=J],FL=J&N', 'FL=d[6][C[K]],AN=92,J=C[$][AN],J=FL[AN=J],globalThis.__fyStyleVmInputs.push({kind:"pc736",root:C[K],rootTag:Object.prototype.toString.call(FL),key:AN,value:J,valueType:typeof J,rootKeys:Object.getOwnPropertyNames(FL).slice(0,20)}),FL=J&N');
      if (!body.includes('(Kt=c7[OA=Kt])&&(AN=4)),d[4]=736')) throw new Error('FY pc749 探针位置不存在');
      body = body.replace('(Kt=c7[OA=Kt])&&(AN=4)),d[4]=736', '(Kt=c7[OA=Kt])&&(AN=4)),globalThis.__fyStyleVmInputs.push({kind:"pc749",method:W(C[0],null,L,X),argument:EL,resultTag:Object.prototype.toString.call(c7),property:OA,valueSig:globalThis.__fyValueSig(Kt),an:AN}),d[4]=736');
      if (!body.includes('(xM=W(C[F],null,S,d[x],d[6],d[8]))?')) throw new Error('FY pc369 探针位置不存在');
      body = body.replace('(xM=W(C[F],null,S,d[x],d[6],d[8]))?', '(xM=W(C[F],null,S,d[x],d[6],d[8]),globalThis.__fyStyleVmInputs.push({kind:"pc369",mode:S,returnSig:globalThis.__fyValueSig(xM),returnRaw:Array.isArray(xM)?xM.slice():null}))?');
      if (!body.includes('d[x]=d[L][eI],d[m]=d[x][C[40]],d[x]=d[m][C[t]],d[m]=d[1],d[m][0]=DG(k,d[x],z,d[L])')) throw new Error('FY vx13 探针位置不存在');
      body = body.replace('d[x]=d[L][eI],d[m]=d[x][C[40]],d[x]=d[m][C[t]],d[m]=d[1],d[m][0]=DG(k,d[x],z,d[L])', 'd[x]=d[L][eI],d[m]=d[x][C[40]],d[x]=d[m][C[t]],globalThis.__fyStyleVmInputs.push({kind:"vx13input",rootKey:eI,midKey:C[40],leafKey:C[t],targetSig:globalThis.__fyValueSig(d[x]),targetSource:typeof d[x]==="function"?String(d[x]).slice(0,160):null}),d[m]=d[1],d[m][0]=DG(k,d[x],z,d[L]),globalThis.__fyStyleVmInputs.push({kind:"vx13result",value:d[m][0]})');
      if (!body.includes('(RK=W(C[F],null,2,d[x],d[6],d[8]))?')) throw new Error('FY vx2 探针位置不存在');
      body = body.replace('(RK=W(C[F],null,2,d[x],d[6],d[8]))?', '(RK=W(C[F],null,2,d[x],d[6],d[8]),globalThis.__fyStyleVmInputs.push({kind:"vx2result",returnSig:globalThis.__fyValueSig(RK),returnRaw:Array.isArray(RK)?RK.slice():null}))?');
      if (!body.includes('d[8]=d[m],d[k]=d[8]?199:47')) throw new Error('FY vx2 pc526 探针位置不存在');
      body = body.replace('d[8]=d[m],d[k]=d[8]?199:47', 'd[8]=d[m],globalThis.__fyStyleVmInputs.push({kind:"vx2pc526",key:d[3],targetTag:Object.prototype.toString.call(d[9]),targetKeys:d[9]&&typeof d[9]==="object"?Object.getOwnPropertyNames(d[9]).slice(0,20):null,valueSig:globalThis.__fyValueSig(d[8])}),d[k]=d[8]?199:47');
      if (!body.includes('d[m]=d[E][d[3]],d[k]=65')) throw new Error('FY vx2 pc13 探针位置不存在');
      body = body.replace('d[m]=d[E][d[3]],d[k]=65', 'd[m]=d[E][d[3]],globalThis.__fyStyleVmInputs.push({kind:"vx2pc13",key:d[3],targetTag:Object.prototype.toString.call(d[E]),isRoot:d[E]===document.documentElement,isBody:d[E]===document.body,valueSig:globalThis.__fyValueSig(d[m])}),d[k]=65');
      if (!body.includes('d[p]=d[i][d[x]],d[k]=d[p]?423:41')) throw new Error('FY mr25 pc39 探针位置不存在');
      body = body.replace('d[p]=d[i][d[x]],d[k]=d[p]?423:41', 'd[p]=d[i][d[x]],globalThis.__fyStyleVmInputs.push({kind:"mr25pc39",key:d[x],targetTag:Object.prototype.toString.call(d[i]),valueSig:globalThis.__fyValueSig(d[p]),own:Object.prototype.hasOwnProperty.call(d[i],d[x])}),d[k]=d[p]?423:41');
      if (!body.includes('d[m]=Error[d[S]],r=d[m]?463:78')) throw new Error('FY Qu14 pc397 探针位置不存在');
      body = body.replace('d[m]=Error[d[S]],r=d[m]?463:78', 'd[m]=Error[d[S]],globalThis.__fyStyleVmInputs.push({kind:"qu14pc397",key:d[S],valueSig:globalThis.__fyValueSig(d[m]),own:Object.prototype.hasOwnProperty.call(Error,d[S])}),r=d[m]?463:78');
      const styleVmNeedle = 'M=r,r=W(C[F],null,8,M,d[x]),d[E][C[E]](4)';
      if (!body.includes(styleVmNeedle)) throw new Error('FY style VM 探针位置不存在');
      body = body.replace(styleVmNeedle, 'M=r,globalThis.__fySerializing&&globalThis.__fyStyleVmInputs.length<100&&globalThis.__fyStyleVmInputs.push({yg,entryCount:globalThis.__fySerialEntryTrace.length,pc:d[4],mSig:globalThis.__fyValueSig(M),mRaw:typeof M==="number"||typeof M==="string"?M:null,xSig:globalThis.__fyValueSig(d[x]),qLength:q?.length}),r=W(C[F],null,8,M,d[x]),d[E][C[E]](4)');
      const styleWindowNeedle = 'd[k]=W(C[l],null,8,89),d[L]=d[6][d[k]]';
      if (!body.includes(styleWindowNeedle)) throw new Error('FY style window 探针位置不存在');
      body = body.replace(styleWindowNeedle, 'd[k]=W(C[l],null,8,89),d[L]=d[6][d[k]],globalThis.__fyStyleVmInputs.push({kind:"windowCheck",key:d[k],valueSig:globalThis.__fyValueSig(d[L]),truthy:!!d[L],own:Object.prototype.hasOwnProperty.call(d[6],d[k])})');
      const styleNamesNeedle = 'd[2]=Object[Lt](window),d[1]=d[2][C[x]]';
      if (!body.includes(styleNamesNeedle)) throw new Error('FY style window names 探针位置不存在');
      body = body.replace(styleNamesNeedle, 'd[2]=Object[Lt](window),globalThis.__fyStyleVmInputs.push({kind:"windowNames",method:Lt,length:d[2].length,head:d[2].slice(0,5),tail:d[2].slice(-5)}),d[1]=d[2][C[x]]');
      const styleTagNeedle = 'd[1]=Z[RW](d[2]),Z=(Z=d[1])?d[1][C[x]]:0';
      if (!body.includes(styleTagNeedle)) throw new Error('FY style tag 探针位置不存在');
      body = body.replace(styleTagNeedle, 'd[1]=Z[RW](d[2]),globalThis.__fyStyleVmInputs.push({kind:"tagQuery",method:RW,tag:d[2],length:d[1]?.length,valueTag:Object.prototype.toString.call(d[1])}),Z=(Z=d[1])?d[1][C[x]]:0');
      const styleBranchNeedle = 'M=P,d[4]=M?709:303';
      if (!body.includes(styleBranchNeedle)) throw new Error('FY style branch 探针位置不存在');
      body = body.replace(styleBranchNeedle, 'M=P,globalThis.__fyStyleVmInputs.push({kind:"branch453",rootKey:C[K],rootSig:globalThis.__fyValueSig(v[C[K]]),lookupKey:z,resultSig:globalThis.__fyValueSig(M),truthy:!!M}),d[4]=M?709:303');
      const canPlayNeedle = 'd[1]=v[Q],d[0]=z[d[2]](d[1]),P+=d[0]';
      if (!body.includes(canPlayNeedle)) throw new Error('FY audio 探针位置不存在');
      body = body.replace(canPlayNeedle, 'd[1]=v[Q],d[0]=z[d[2]](d[1]),globalThis.__fyStyleVmInputs.push({kind:"canPlayType",mime:d[1],result:d[0],method:d[2]}),P+=d[0]');
      const pc50Needle = 'B=W(C[X],null,3,d[x],d[6]),r=W(C[F],null,8,B,d[x])';
      if (!body.includes(pc50Needle)) throw new Error('FY pc50 探针位置不存在');
      body = body.replace(pc50Needle, 'B=W(C[X],null,3,d[x],d[6]),globalThis.__fyStyleVmInputs.push({kind:"pc50middle",bSig:globalThis.__fyValueSig(B),bRaw:typeof B==="number"||typeof B==="string"?B:Array.isArray(B)?B.slice(0,10):null,xSig:globalThis.__fyValueSig(d[x]),d6Sig:globalThis.__fyValueSig(d[6])}),r=W(C[F],null,8,B,d[x])');
      const qu3Needle = 'C[X]=function Qu(EL,c7,Z,Q,s){var d=[];d[8]=c7;for(var r=G;r!==U;){var vx,JY,O=r>>5&o;switch(r&o){';
      if (!body.includes(qu3Needle)) throw new Error('FY Qu3 探针位置不存在');
      body = body.replace(qu3Needle, 'C[X]=function Qu(EL,c7,Z,Q,s){var d=[];d[8]=c7;for(var r=G;r!==U;){var vx,JY,O=r>>5&o;if((EL===3||EL===13||EL===14)&&globalThis.__fySerializing&&globalThis.__fyQu3Steps.length<1500)globalThis.__fyQu3Steps.push({el:EL,pc:r,branch:r&o,opcode:O,entryCount:globalThis.__fySerialEntryTrace.length,regs:Object.keys(d).map(key=>[key,globalThis.__fyValueSig(d[key])]),qSig:globalThis.__fyValueSig(Q),zSig:globalThis.__fyValueSig(Z),sSig:globalThis.__fyValueSig(s),raw:EL===13&&[520,172].includes(r)?{d1:d[1],d7:d[7]}:null,audioInfo:r===77?{method:d[7],index:d[m],mime:d[0]?.[d[m]],receiverTag:Object.prototype.toString.call(d[1]),methodType:typeof d[1]?.[d[7]]}:null});switch(r&o){');
      const videoCanPlayNeedle = 'd[E]=d[1][d[7]](d[k]),P+=d[E]';
      if (!body.includes(videoCanPlayNeedle)) throw new Error('FY video 探针位置不存在');
      body = body.replace(videoCanPlayNeedle, 'd[E]=d[1][d[7]](d[k]),globalThis.__fyStyleVmInputs.push({kind:"videoCanPlayType",mime:d[k],result:d[E]}),P+=d[E]');
      const memoryReadNeedle = 'B=P[M],d[4]=291';
      if (!body.includes(memoryReadNeedle)) throw new Error('FY memory 探针位置不存在');
      body = body.replace(memoryReadNeedle, 'B=P[M],globalThis.__fyStyleVmInputs.push({kind:"memoryRead",property:v,memoryTag:Object.prototype.toString.call(P),heapKey:M,heapValue:B,rSig:globalThis.__fyValueSig(r)}),d[4]=291');
      const xf0WriteNeedle = 'var d=[];for(d[S]=kZ,d[x]=dn,d[6]=uu,d[8]=h5,d[4]=a;';
      const xf276Needle = 'Z=d[2]+d[1],d[2]=Q[Z],Q=0|d[2]';
      if (!body.includes(xf276Needle)) throw new Error('FY xf276 探针位置不存在');
      body = body.replace(xf276Needle, 'Z=d[2]+d[1],globalThis.__fySerializing&&yg===1&&globalThis.__fyStyleVmInputs.push({kind:"xf276",key:Z,rootTag:Object.prototype.toString.call(Q),rootKeys:Object.getOwnPropertyNames(Q).slice(0,15),valueSig:globalThis.__fyValueSig(Q[Z]),valueType:typeof Q[Z]}),d[2]=Q[Z],Q=0|d[2]');
      if (!body.includes(xf0WriteNeedle)) throw new Error('FY xf0 write 探针位置不存在');
      body = body.replace(xf0WriteNeedle, 'var d=yg===0&&globalThis.__fySerializing?new Proxy([],{set(t,key,val,receiver){if(key==="2"&&[238,291,340].includes(t[4])&&globalThis.__fyXf0Writes.length<200)globalThis.__fyXf0Writes.push({pc:t[4],oldSig:globalThis.__fyValueSig(t[2]),newSig:globalThis.__fyValueSig(val),oldRaw:typeof t[2]==="string"?t[2]:null,newRaw:typeof val==="string"?val:null,stack:String(new Error().stack).split(String.fromCharCode(10)).slice(1,4)});return Reflect.set(t,key,val,receiver)}}):[];for(d[S]=kZ,d[x]=dn,d[6]=uu,d[8]=h5,d[4]=a;');
      const mr11Needle = 'C[4]=function mr(xF,QO,z,FL,eo){var d=[];for(d[38]=QO,d[m]=b;d[m]!==U;){var Kz=d[m]&o,yn=d[m]>>5,O=yn&o;switch(Kz){';
      if (!body.includes(mr11Needle)) throw new Error('FY mr(11) 探针位置不存在');
      body = body.replace(mr11Needle,
        'C[4]=function mr(xF,QO,z,FL,eo){var d=[];var __fyMr11Call=xF===11&&globalThis.__fySerializing?++globalThis.__fyMr11CallCount:0;for(d[38]=QO,d[m]=b;d[m]!==U;){var Kz=d[m]&o,yn=d[m]>>5,O=yn&o;if(__fyMr11Call&&globalThis.__fyMr11Steps.length<5000){var __fyMr11Index=globalThis.__fyMr11Steps.length;globalThis.__fyMr11Steps.push({call:__fyMr11Call,pc:d[m],branch:Kz,opcode:O,entryCount:globalThis.__fySerialEntryTrace.length,regs:__fyMr11Index<300?Object.keys(d).map(function(key){return[key,globalThis.__fyValueSig(d[key])]}):null})}switch(Kz){');
      const c25Needle = 'C[F]=function vx(yi,OA,z,RK,HZ){var d=[];for(d[L]=RK,d[k]=i;d[k]!==U;){var Qu=d[k]&o,JY,O=d[k]>>5&o;switch(Qu){';
      if (!body.includes(c25Needle)) throw new Error('FY C25 探针位置不存在');
      body = body.replace(c25Needle,
        'C[F]=function vx(yi,OA,z,RK,HZ){var d=[];var __fyC25Call=(yi===2||yi===3||yi===13||yi===14)&&globalThis.__fySerializing?++globalThis.__fyC25CallCount:0;for(d[L]=RK,d[k]=i;d[k]!==U;){var Qu=d[k]&o,JY,O=d[k]>>5&o;if(__fyC25Call&&globalThis.__fyC25Steps.length<5000)globalThis.__fyC25Steps.push({call:__fyC25Call,yi,pc:d[k],branch:Qu,opcode:O,entryCount:globalThis.__fySerialEntryTrace.length,regs:Object.keys(d).map(function(key){return[key,globalThis.__fyValueSig(d[key])]}),closure:{J:globalThis.__fyValueSig(J),r:globalThis.__fyValueSig(r),P:globalThis.__fyValueSig(P),M:globalThis.__fyValueSig(M),B:globalThis.__fyValueSig(B),v:globalThis.__fyValueSig(v),q:globalThis.__fyValueSig(q),Z:globalThis.__fyValueSig(Z),Q:globalThis.__fyValueSig(Q),s:globalThis.__fyValueSig(s),FL:globalThis.__fyValueSig(FL),EL:globalThis.__fyValueSig(EL),Dh:globalThis.__fyValueSig(Dh),Eb:globalThis.__fyValueSig(Eb)},jDetail:__fyC25Call===1?globalThis.__fyDeepSig(J,true):null,dDetail:__fyC25Call===1?globalThis.__fyDeepSig(d,true):null});if(yi===0&&globalThis.__fySerializing&&globalThis.__fySerialVxSteps.length>=2020&&globalThis.__fySerialVxSteps.length<=2090)globalThis.__fyStyleVmInputs.push({kind:"c25ZeroStep",pc:d[k],step:globalThis.__fySerialVxSteps.length,regs:globalThis.__fyDeepSig(d),d2:Array.isArray(d[2])?d[2].slice(0,5):null,d10Children:d[10]?.childNodes?.length,d10Width:d[10]?.childNodes?Array.from(d[10].childNodes).slice(0,5).map(node=>node.offsetWidth):null,pc37:d[k]===37&&globalThis.__fySerialVxSteps.length>=2000&&globalThis.__fySerialVxSteps.length<=2100?{regs:Object.keys(d).map(key=>[key,Object.prototype.toString.call(d[key]),d[key]?.offsetWidth,d[key]?.childNodes?.length]),span:{fontFamily:d[7]?.style?.fontFamily,fontSize:d[7]?.style?.fontSize,styleKeys:Object.keys(d[7]?.style||{}).slice(0,8),htmlLength:d[7]?.innerHTML?.length,htmlHead:d[7]?.innerHTML?.slice(0,120),childTag:Object.prototype.toString.call(d[7]?.childNodes?.[0]),childWidth:d[7]?.childNodes?.[0]?.offsetWidth,childText:d[7]?.childNodes?.[0]?.textContent}}:null,v:globalThis.__fyValueSig(v),z:globalThis.__fyValueSig(z),oa:globalThis.__fyValueSig(OA),rk:globalThis.__fyValueSig(RK),focus:d[k]===11&&globalThis.__fySerialVxSteps.length===2067?{vRaw:typeof v==="string"?v:null,regs:Object.keys(d).map(key=>[key,typeof d[key]==="string"&&d[key].length<300?d[key]:typeof d[key]==="number"?d[key]:globalThis.__fyValueSig(d[key])])}:null});if(yi===0&&d[k]===11&&typeof v==="string"&&v.startsWith("<span ")&&Array.isArray(d[2])&&d[2].length===3&&globalThis.__fyStyleVmInputs.filter(item=>item.kind==="fontProbe").length<40)globalThis.__fyStyleVmInputs.push({kind:"fontProbe",html:v,markup:d[10]?.innerHTML,widths:d[2].slice(),allWidths:Array.from(d[10]?.childNodes||[],node=>node.offsetWidth),childCount:d[10]?.childNodes?.length});switch(Qu){');
      const pixelNeedle = 'd[X]=function(y){for(var k=4;';
      if (!body.includes(pixelNeedle)) throw new Error('FY 像素探针位置不存在');
      body = body.replace(pixelNeedle,
        'd[X]=function(y){if(globalThis.__fyPixelTrace.length<10)globalThis.__fyPixelTrace.push({type:typeof y,length:y?.length,entryCount:globalThis.__fyEntryTrace.length,nonzero:y?.reduce?.((n,v)=>n+(v!==0),0),head:Array.from(y?.slice?.(0,32)||[]),tail:Array.from(y?.slice?.(-32)||[]),stack:new Error().stack.split("\\n").slice(1,4)});for(var k=4;');
      const dgStepNeedle = 'for(d[1]=dC,d[2]=eM,d[7]=x;d[7]!==U;){var aE=d[7]&o,dn,O=d[7]>>5&o;';
      if (!body.includes(dgStepNeedle)) throw new Error('FY DG 步进探针位置不存在');
      body = body.replace(dgStepNeedle,
        `${dgStepNeedle}if(globalThis.__fyDgSteps.length<1000)globalThis.__fyDgSteps.push({zU,pc:d[7],branch:aE,opcode:O,flType:typeof FL,flTruthy:!!FL});`);
      const dgWindowNeedle = 'Q=window[v],d[7]=Q?429:68';
      if (!body.includes(dgWindowNeedle)) throw new Error('FY DG window 探针位置不存在');
      body = body.replace(dgWindowNeedle,
        'Q=window[v],globalThis.__fyDgWindowChecks.push({key:v,type:typeof Q,truthy:!!Q,own:Object.prototype.hasOwnProperty.call(window,v)}),d[7]=Q?429:68');
      const dgObjectNeedle = 'Q=W(C[l],null,8,67),v=B[Q],d[7]=v?356:461';
      if (!body.includes(dgObjectNeedle)) throw new Error('FY DG object 探针位置不存在');
      body = body.replace(dgObjectNeedle,
        'Q=W(C[l],null,8,67),v=B[Q],globalThis.__fyDgObjectChecks.push({key:Q,tag:Object.prototype.toString.call(B),isWindow:B===window,keys:Object.getOwnPropertyNames(B).slice(0,20),type:typeof v,truthy:!!v,own:Object.prototype.hasOwnProperty.call(B,Q)}),d[7]=v?356:461');
      const dgStringNeedle = 'z=q[RW]("HEAD"),B=z[0],d[7]=B?448:525';
      if (!body.includes(dgStringNeedle)) throw new Error('FY DG string 探针位置不存在');
      body = body.replace(dgStringNeedle,
        'z=q[RW]("HEAD"),B=z[0],globalThis.__fyDgStringChecks.push({qType:typeof q,qLength:q?.length,qPrefix:String(q).slice(0,24),headIndex:q?.indexOf?.("HEAD"),beforeHeadLength:B?.length,partCount:z?.length}),d[7]=B?448:525');
      const dgNavigatorNeedle = 'd[E]=d[k]in navigator,d[7]=d[E]?103:394';
      if (!body.includes(dgNavigatorNeedle)) throw new Error('FY DG navigator 探针位置不存在');
      body = body.replace(dgNavigatorNeedle,
        'd[E]=d[k]in navigator,globalThis.__fyDgNavigatorChecks.push({key:d[k],exists:d[E],type:typeof navigator[d[k]],own:Object.prototype.hasOwnProperty.call(navigator,d[k])}),d[7]=d[E]?103:394');
      const dgLoadNeedle = 'd[x]=d[E],d[7]=d[x]?589:557';
      if (!body.includes(dgLoadNeedle)) throw new Error('FY DG load 探针位置不存在');
      body = body.replace(dgLoadNeedle,
        'd[x]=d[E],globalThis.__fyDgLoadChecks.push({targetTag:Object.prototype.toString.call(d[k]),targetKeys:Object.getOwnPropertyNames(d[k]).slice(0,20),valueType:typeof d[x],truthy:!!d[x],valueKeys:d[x]&&typeof d[x]==="object"?Object.getOwnPropertyNames(d[x]).slice(0,20):null}),d[7]=d[x]?589:557');
      const dgLoadKeyNeedle = 'd[E]=d[k][d[x]],d[E]&&';
      if (!body.includes(dgLoadKeyNeedle)) throw new Error('FY DG load key 探针位置不存在');
      body = body.replace(dgLoadKeyNeedle,
        'globalThis.__fyDgLoadKeyChecks.push({key:d[x],targetTag:Object.prototype.toString.call(d[k])}),d[E]=d[k][d[x]],d[E]&&');
      const dgFeatureNeedle = 'd[k]=ye in d[S],d[k]||';
      if (!body.includes(dgFeatureNeedle)) throw new Error('FY DG feature 探针位置不存在');
      body = body.replace(dgFeatureNeedle,
        'd[k]=ye in d[S],globalThis.__fyDgFeatureChecks.push({key:String(ye).slice(0,80),targetTag:Object.prototype.toString.call(d[S]),name:d[S].name,keys:Object.getOwnPropertyNames(d[S]).slice(0,20),exists:d[k],own:Object.prototype.hasOwnProperty.call(d[S],ye),valueType:typeof d[S][ye],value:typeof d[S][ye]==="number"?d[S][ye]:null}),d[k]||');
      const dgTopPropertyNeedle = 'FL=d[m][d[k]],d[7]=426';
      if (!body.includes(dgTopPropertyNeedle)) throw new Error('FY DG top property 探针位置不存在');
      body = body.replace(dgTopPropertyNeedle,
        'FL=d[m][d[k]],globalThis.__fyDgTopPropertyChecks.push({key:d[k],targetTag:Object.prototype.toString.call(d[m]),type:typeof FL,truthy:!!FL,length:FL?.length}),d[7]=426');
      const dgElementNeedle = 'FL=W(C[l],null,8,w),d[S]=d[k][FL]),FL=d[S],d[7]=FL?652:130';
      if (!body.includes(dgElementNeedle)) throw new Error('FY DG Element 探针位置不存在');
      body = body.replace(dgElementNeedle,
        'FL=W(C[l],null,8,w),d[S]=d[k][FL],globalThis.__fyDgElementChecks.push({key:FL,targetTag:Object.prototype.toString.call(d[k]),type:typeof d[S],own:Object.prototype.hasOwnProperty.call(d[k],FL)})),FL=d[S],d[7]=FL?652:130');
      const dgCase18Needle = 'd[9]=P[d[m]],(P=d[9])&&';
      if (!body.includes(dgCase18Needle)) throw new Error('FY DG case18 探针位置不存在');
      body = body.replace(dgCase18Needle,
        'd[9]=P[d[m]],globalThis.__fyDgCase18Checks.push({point:"document",key:d[m],targetTag:Object.prototype.toString.call(P),valueType:typeof d[9],valueTruthy:!!d[9]}),(P=d[9])&&');
      const dgCase18Fallback = 'P=d[8][d[m]]),d[8]=P';
      if (!body.includes(dgCase18Fallback)) throw new Error('FY DG case18 fallback 探针位置不存在');
      body = body.replace(dgCase18Fallback,
        'P=d[8][d[m]],globalThis.__fyDgCase18Checks.push({point:"fallback",key:d[m],targetTag:Object.prototype.toString.call(d[8]),valueType:typeof P,valueTruthy:!!P})),d[8]=P');
      const dgReturnNeedle = 'case 15:return EL;case 16:';
      if (!body.includes(dgReturnNeedle)) throw new Error('FY DG return 探针位置不存在');
      body = body.replace(dgReturnNeedle,
        'case 15:globalThis.__fyDgReturns.push({zU,type:typeof EL,tag:Object.prototype.toString.call(EL),value:EL===null||["number","boolean","undefined"].includes(typeof EL)?EL:undefined,length:typeof EL==="string"?EL.length:undefined,keys:EL&&typeof EL==="object"?Object.getOwnPropertyNames(EL).slice(0,20):null,jsonDigest:(()=>{try{const q=JSON.stringify(EL);if(typeof q!=="string")return null;let h=2166136261;for(let i=0;i<q.length;i++)h=(Math.imul(h,16777619)^q.charCodeAt(i))>>>0;return {length:q.length,hash:h}}catch{return null}})(),arrayProfile:zU===11&&Array.isArray(EL)?EL.map((v,i)=>({index:i,type:typeof v,tag:Object.prototype.toString.call(v),length:typeof v==="string"?v.length:v?.length,scalar:["number","boolean"].includes(typeof v)?v:null,text:typeof v==="string"?v.slice(0,80):null})):undefined});return EL;case 16:');
      const dg13GateNeedle = 'd[6]=d[4],d[7]=193';
      if (!body.includes(dg13GateNeedle)) throw new Error('FY DG13 gate 探针位置不存在');
      body = body.replace(dg13GateNeedle,
        'd[6]=d[4],globalThis.__fyDg13GateChecks.push({zU,key:X,wTag:Object.prototype.toString.call(wZ),wKeys:wZ&&typeof wZ==="object"?Object.getOwnPropertyNames(wZ).slice(0,60):null,wProfile:globalThis.__fyDg13GateChecks.length===0?Object.fromEntries(Object.getOwnPropertyNames(wZ).filter(k=>k!=="length").map(k=>{const v=wZ[k];return [k,{type:typeof v,scalar:["number","boolean"].includes(typeof v)?v:null,length:typeof v==="string"?v.length:null}]})):undefined,w12:wZ?.[12],w24:wZ?.[24],wLength:wZ?.length,wValueType:typeof wZ?.[X],wTruthy:!!wZ?.[X],fallbackKey:d[0],fallbackType:typeof d[1]?.[d[0]],fallbackTruthy:!!d[1]?.[d[0]],resultType:typeof d[6],resultTruthy:!!d[6]}),d[7]=193');
      const featureArrayNeedle = 'iC=[]';
      if (!body.includes(featureArrayNeedle)) throw new Error('FY feature array 探针位置不存在');
      body = body.replace(featureArrayNeedle,
        'iC=new Proxy([],{set(t,k,v,r){if(["12","24","54","66","73","81","115","119","125","137","148","152","157"].includes(String(k)))globalThis.__fyFeatureWrites.push({index:String(k),type:typeof v,value:typeof v==="number"?v:null,valueSig:globalThis.__fyValueSig(v),jCount:globalThis.__fyJCalls.length,earlyCount:globalThis.__fyEarlyCalls?.length??0,time:performance.now(),stack:new Error().stack.split("\\n").slice(1,11)});if(k==="115"&&v&&typeof v==="object")v=new Proxy(v,{set(o,key,val,receiver){globalThis.__fy115Writes.push({key:String(key),valueSig:globalThis.__fyValueSig(val),earlyCount:globalThis.__fyEarlyCalls?.length??0,stack:new Error().stack.split("\\n").slice(1,6)});return Reflect.set(o,key,val,receiver)}});if(k==="11"&&Array.isArray(v))v=new Proxy(v,{set(o,key,val,receiver){if(key!=="length"&&globalThis.__fyFeatureWrites.filter(item=>item.index==="11_item").length<8)globalThis.__fyFeatureWrites.push({index:"11_item",itemIndex:String(key),valueDetail:globalThis.__fyDeepSig(val,true),stack:new Error().stack.split(String.fromCharCode(10)).slice(1,6)});return Reflect.set(o,key,val,receiver)}});return Reflect.set(t,k,v,r)}})');
      const feature24Needle = 'd[9][X]=1,d[k]=586';
      if (!body.includes(feature24Needle)) throw new Error('FY feature24 探针位置不存在');
      body = body.replace(feature24Needle,
        'globalThis.__fy24Context.push({v,z,s,AN,JY,eo,opcode:O,key:X,targetTag:Object.prototype.toString.call(d[9]),earlyCount:globalThis.__fyEarlyCalls?.length??0,time:performance.now()}),d[9][X]=1,d[k]=586');
      const mrStepNeedle = 'for(d[k]=68;d[k]!==U;){var Kz=d[k]&o,yH,O=d[k]>>5&o;';
      if (!body.includes(mrStepNeedle)) throw new Error('FY mr 步进探针位置不存在');
      body = body.replace(mrStepNeedle,
        `${mrStepNeedle}if(v===52&&globalThis.__fySerializing&&globalThis.__fyStyleVmInputs.length<1500)globalThis.__fyStyleVmInputs.push({kind:"mr52step",pc:d[k],branch:Kz,opcode:O,entryCount:globalThis.__fySerialEntryTrace.length,regs:Object.keys(d).map(key=>[key,globalThis.__fyValueSig(d[key])])});if(v===25&&globalThis.__fySerializing&&globalThis.__fyStyleVmInputs.length<900)globalThis.__fyStyleVmInputs.push({kind:"mr25step",pc:d[k],branch:Kz,opcode:O,entryCount:globalThis.__fySerialEntryTrace.length,regs:Object.keys(d).map(key=>[key,globalThis.__fyValueSig(d[key])])});if(v===16&&globalThis.__fySerializing&&globalThis.__fyMr16Steps.length<5000)globalThis.__fyMr16Steps.push({pc:d[k],branch:Kz,opcode:O,entryCount:globalThis.__fySerialEntryTrace.length,regs:Object.keys(d).map(function(key){return[key,globalThis.__fyValueSig(d[key])]}),detail:globalThis.__fyMr16Steps.length<30?globalThis.__fyDeepSig(d,true):null,branchKey:d[k]===261?C[$][99]:null,branchValue:d[k]===261?globalThis.__fyValueSig(d[E]?.[C[$][99]]):null,branchOwn:d[k]===261?Object.prototype.hasOwnProperty.call(d[E],C[$][99]):null,nextKey:d[k]===613?C[$][b]:null,nextValue:d[k]===613?globalThis.__fyValueSig(d[E]?.[C[$][b]]):null,nextOwn:d[k]===613?Object.prototype.hasOwnProperty.call(d[E],C[$][b]):null,preKey:d[k]===613?C[$][89]:null,preValue:d[k]===613?globalThis.__fyValueSig(d[E]?.[C[$][89]]):null,preOwn:d[k]===613?Object.prototype.hasOwnProperty.call(d[E],C[$][89]):null});if(v===22&&globalThis.__fyMr22Steps.length<200)globalThis.__fyMr22Steps.push({pc:d[k],branch:Kz,opcode:O,MTag:Object.prototype.toString.call(M),MKeys:M&&typeof M==="object"?Object.getOwnPropertyNames(M).slice(0,8):null,M0Type:typeof M?.[0]});if(v===3&&globalThis.__fyMr3Steps.length<3000)globalThis.__fyMr3Steps.push({pc:d[k],branch:Kz,opcode:O});if(v===43&&globalThis.__fyMr43Steps.length<1000)globalThis.__fyMr43Steps.push({pc:d[k],branch:Kz,opcode:O,s,zTag:Object.prototype.toString.call(z),regSig:s==="deviceorientation"?Object.fromEntries(Object.keys(d).map(k=>[k,globalThis.__fyValueSig(d[k])])):null});if(v===56&&globalThis.__fyMr56Steps.length<500)globalThis.__fyMr56Steps.push({pc:d[k],branch:Kz,opcode:O,earlyCount:globalThis.__fyEarlyCalls?.length??0});if(v===47&&globalThis.__fyMr47Steps.length<5000)globalThis.__fyMr47Steps.push({pc:d[k],branch:Kz,opcode:O,eType:typeof d[E],eLength:d[E]?.length,eTag:Object.prototype.toString.call(d[E]),pType:typeof d[p],pLength:d[p]?.length,pTag:Object.prototype.toString.call(d[p]),d3Length:d[3]?.length,d9Length:d[9]?.length,earlyCount:globalThis.__fyEarlyCalls?.length??0});`);
      const jEntryNeedle = 'function J(Z7){';
      if (!body.includes(jEntryNeedle)) throw new Error('FY J 入口探针位置不存在');
      body = body.replace(jEntryNeedle,
        'function J(Z7){if(globalThis.__fyJCalls.length<100)globalThis.__fyJCalls.push({arg:globalThis.__fyValueSig(Z7),number:typeof Z7==="number"?Z7:null,uSig:Array.isArray(U)?U.slice(0,20).map(globalThis.__fyValueSig):globalThis.__fyValueSig(U),oSig:globalThis.__fyValueSig(O),nSig:globalThis.__fyValueSig(N),nDeep:globalThis.__fyDeepSig(N),dDetail:Z7===2?globalThis.__fyDeepSig(d,true):null,earlyCount:globalThis.__fyEarlyCalls?.length??0,stack:new Error().stack.split("\\n").slice(1,4)});');
      const jStepNeedle = 'for(var W=2;void 0!==W;){var Qu,L5,k=7&W>>3;switch(7&W){';
      if (!body.includes(jStepNeedle)) throw new Error('FY J 步进探针位置不存在');
      body = body.replace(jStepNeedle,
        'for(var W=2;void 0!==W;){var Qu,L5,k=7&W>>3;if(Z7===2&&globalThis.__fyJSteps.length<2000)globalThis.__fyJSteps.push({pc:W,branch:7&W,opcode:k,uSig:Array.isArray(U)?U.slice(0,20).map(globalThis.__fyValueSig):null,uDeep:globalThis.__fyDeepSig(U),uDetail:globalThis.__fyJSteps.length===115?globalThis.__fyDeepSig(U,true):null,nDeep:globalThis.__fyDeepSig(N),dDeep:globalThis.__fyDeepSig(d),dDetail:globalThis.__fyJSteps.length===116?globalThis.__fyDeepSig(d,true):null,cSig:globalThis.__fyValueSig(C),eSig:globalThis.__fyValueSig(E),aSig:globalThis.__fyValueSig(a),aDetail:a&&typeof a==="object"?globalThis.__fyDeepSig(a,true):null,oSig:globalThis.__fyValueSig(O)});switch(7&W){');
      const c25CompareNeedle = 'd[S]=v[d[5]],M=d[S],d[S]=d[2][d[6]],(r=M!=d[S])';
      if (!body.includes(c25CompareNeedle)) throw new Error('FY C25 比较探针位置不存在');
      body = body.replace(c25CompareNeedle, 'd[S]=v[d[5]],M=d[S],d[S]=d[2][d[6]],globalThis.__fySerializing&&globalThis.__fySerialVxSteps.length>=2050&&globalThis.__fySerialVxSteps.length<=2085&&globalThis.__fyStyleVmInputs.push({kind:"c25Compare74",yi,step:globalThis.__fySerialVxSteps.length,left:globalThis.__fyValueSig(M),right:globalThis.__fyValueSig(d[S]),leftKey:globalThis.__fyValueSig(d[5]),rightKey:globalThis.__fyValueSig(d[6]),leftRaw:typeof M==="number"||typeof M==="string"?M:null,rightRaw:typeof d[S]==="number"||typeof d[S]==="string"?d[S]:null,vTag:Object.prototype.toString.call(v),rightTag:Object.prototype.toString.call(d[2])}),(r=M!=d[S])');
      const vx7WriteNeedle = 'function vx(AN,OA,FL,EL,q){var d=[];function Q';
      if (!body.includes(vx7WriteNeedle)) throw new Error('FY vx7 writer 探针位置不存在');
      body = body.replace(vx7WriteNeedle,
        'function vx(AN,OA,FL,EL,q){var d=AN===7?new Proxy([],{set(t,k,val,r){if((k==="10"||k==="13"||k==="0"||k==="21"||(k==="6"&&(t[6]===385||t[6]===384)))&&globalThis.__fyVx7Writes.length<1200)globalThis.__fyVx7Writes.push({key:String(k),pc:t[6],branchKey:k==="6"&&t[6]===385?t[18]:k==="6"&&t[6]===384?t[22]:null,branchValue:k==="6"&&t[6]===385?globalThis.__fyValueSig(t[11]?.[t[18]]):k==="6"&&t[6]===384?Object.prototype.hasOwnProperty.call(t[20],t[22]):null,branchTarget:k==="6"&&t[6]===384?globalThis.__fyValueSig(t[20]):null,valueSig:globalThis.__fyValueSig(val),objectKeys:val&&typeof val==="object"?Object.keys(val).slice(0,30):null,ownNames:val&&typeof val==="object"?Object.getOwnPropertyNames(val).slice(0,30):null,windVaneInfo:val===globalThis.WindVane?Object.fromEntries(Object.entries(val).map(([n,v])=>[n,{sig:globalThis.__fyValueSig(v),value:typeof v==="string"||typeof v==="boolean"?v:null,source:typeof v==="function"?String(v).slice(0,80):null}])):null,offlineAudioPrototype:val===globalThis.OfflineAudioContext?.prototype?Object.fromEntries(Object.getOwnPropertyNames(val).map(n=>{const d=Object.getOwnPropertyDescriptor(val,n);return[n,{kind:d.get?"getter":typeof d.value,enumerable:d.enumerable,length:typeof d.value==="function"?d.value.length:null}]})):null,fnInfo:typeof val==="function"?{name:val.name,length:val.length,keys:Object.keys(val),source:String(val).slice(0,100)}:null,stringValue:typeof val==="string"&&val.length<=80?val:null,bitCheck:k==="21"&&t[6]===300?Object.fromEntries(Object.keys(t).map(n=>[n,globalThis.__fyValueSig(t[n])])):null,bitContext:k==="21"&&t[6]===300?{reg20Keys:t[20]&&typeof t[20]==="object"?Object.keys(t[20]).slice(0,30):null,reg20Fn:typeof t[20]==="function"?{name:t[20].name,length:t[20].length,source:String(t[20]).slice(0,120)}:null,reg22:typeof t[22]==="string"?t[22]:null,rootClassList:t[20]===document.documentElement?.classList,bodyClassList:t[20]===document.body?.classList,symbolInfo:t[20]===Symbol?{hasOwn:Object.prototype.hasOwnProperty.call(Symbol,"hasInstance"),nameCount:Object.getOwnPropertyNames(Symbol).length,descriptor:Object.getOwnPropertyDescriptor(Symbol,"hasInstance")?{configurable:Object.getOwnPropertyDescriptor(Symbol,"hasInstance").configurable,enumerable:Object.getOwnPropertyDescriptor(Symbol,"hasInstance").enumerable,writable:Object.getOwnPropertyDescriptor(Symbol,"hasInstance").writable}:null,valueType:typeof Symbol.hasInstance,valueString:String(Symbol.hasInstance)}:null}:null,maskCheck:k==="0"&&typeof val==="boolean"&&globalThis.__fyVx7Writes.length>190?{pc:t[6],regs:Object.fromEntries(Object.keys(t).map(n=>[n,globalThis.__fyValueSig(t[n])])),ownDescriptor:Object.getOwnPropertyDescriptor(document,"wasDiscarded")?true:false,htmlDescriptor:Object.getOwnPropertyDescriptor(HTMLDocument.prototype,"wasDiscarded")?true:false,documentDescriptor:Object.getOwnPropertyDescriptor(Document.prototype,"wasDiscarded")?true:false,hasProperty:"wasDiscarded" in document,propertyValue:document.wasDiscarded}:null,regSnapshot:k==="10"&&t[6]===99?Object.fromEntries(Object.keys(t).map(n=>[n,globalThis.__fyValueSig(t[n])])):null,regDeep:k==="10"&&t[6]===99?Object.fromEntries(Object.keys(t).map(n=>[n,globalThis.__fyDeepSig(t[n])])):null,regDetail:k==="10"&&t[6]===99?{document:globalThis.__fyDeepSig(t[8],true),array:globalThis.__fyDeepSig(t[9],true)}:null,reg17Info:k==="10"&&t[6]===99?{isPrototype:t[17]===globalThis.CSSStyleDeclaration?.prototype,keys:Object.keys(t[17]||{}).slice(0,20),ownNames:Object.getOwnPropertyNames(t[17]||{}).slice(0,20),ownCount:Object.getOwnPropertyNames(t[17]||{}).length,allKeys:Object.keys(t[17]||{}),nonEmpty:Object.fromEntries(Object.keys(t[17]||{}).filter(n=>typeof t[17][n]==="string"&&t[17][n]!=="").map(n=>[n,t[17][n]])),firstValues:[t[17]?.[0],t[17]?.[1]],styleLength:t[17]?.length,cssText:t[17]?.cssText,bodyStyle:t[17]===document.body?.style,rootStyle:t[17]===document.documentElement?.style}:null,stack:new Error().stack.split("\\n").slice(1,4)});return Reflect.set(t,k,val,r)}}):[];function Q');
      const vxEntryNeedle = 'function vx(AN,OA,FL,EL,q){var d=AN===7?';
      if (!body.includes(vxEntryNeedle)) throw new Error('FY vx entry 探针位置不存在');
      body = body.replace(vxEntryNeedle, 'function vx(AN,OA,FL,EL,q){if(globalThis.__fySerializing&&(AN===2||AN===16)&&globalThis.__fyStyleVmInputs.length<500)globalThis.__fyStyleVmInputs.push({kind:"vxEntry",an:AN,entryCount:globalThis.__fySerialEntryTrace.length,oaSig:globalThis.__fyValueSig(OA),oaRaw:typeof OA==="string"&&OA.length<=128?OA:null,oaDeep:globalThis.__fyDeepSig(OA),flSig:globalThis.__fyValueSig(FL),elSig:globalThis.__fyValueSig(EL),qSig:globalThis.__fyValueSig(q),stack:globalThis.__fySerialEntryTrace.length===276?new Error().stack.split("\\n").slice(1,6):null});if(globalThis.__fySerializing&&globalThis.__fySerialVxSteps.length>=2050&&globalThis.__fySerialVxSteps.length<=2080)globalThis.__fyStyleVmInputs.push({kind:"vxFocus",an:AN,oa:OA,fl:globalThis.__fyValueSig(FL),el:globalThis.__fyValueSig(EL),q:globalThis.__fyValueSig(q),step:globalThis.__fySerialVxSteps.length,entryCount:globalThis.__fySerialEntryTrace.length,stack:new Error().stack.split("\\n").slice(1,6)});var d=AN===7?');
      const vx7StepNeedle = 'for(d[k]=OA,d[$]=FL,d[1]=EL,d[6]=L;d[6]!==U;){var Eb=d[6]&o,JY,O=d[6]>>5&o;switch(Eb){';
      if (!body.includes(vx7StepNeedle)) throw new Error('FY vx7 步进探针位置不存在');
      body = body.replace(vx7StepNeedle,
        'for(d[k]=OA,d[$]=FL,d[1]=EL,d[6]=L;d[6]!==U;){var Eb=d[6]&o,JY,O=d[6]>>5&o;if(globalThis.__fySerializing&&globalThis.__fySerialVxSteps.length<10000)globalThis.__fySerialVxSteps.push({an:AN,pc:d[6],branch:Eb,opcode:O,entryCount:globalThis.__fySerialEntryTrace.length,oa:typeof OA==="number"?OA:globalThis.__fyValueSig(OA),d14:typeof d[14]==="number"?d[14]:null,regs:AN===0&&globalThis.__fySerialVxSteps.length<334?Object.keys(d).map(function(key){return[key,globalThis.__fyValueSig(d[key])]}):null,deep:AN===0&&globalThis.__fySerialVxSteps.length<300?globalThis.__fyDeepSig(d):null,focus:globalThis.__fySerialVxSteps.length>=2058&&globalThis.__fySerialVxSteps.length<=2075?{oa:globalThis.__fyDeepSig(OA,true),fl:globalThis.__fyDeepSig(FL,true),el:globalThis.__fyDeepSig(EL,true),q:globalThis.__fyDeepSig(q,true),regs:globalThis.__fyDeepSig(d,true)}:null});if(AN===7&&globalThis.__fyVx7Steps.length<5000)globalThis.__fyVx7Steps.push({pc:d[6],branch:Eb,opcode:O,reg21:typeof d[21]==="number"?d[21]:globalThis.__fyValueSig(d[21]),array9:Array.isArray(d[9])?d[9].slice():null,focusDetail:[300,385,384,160].includes(d[6])?globalThis.__fyDeepSig(d,true):null,vmConstants:d[6]===300?{x,E,S,L,i,k,p,a,t,G,b,m,l:$,dollar:$}:null,dDeep:globalThis.__fyDeepSig(d),dDetail:globalThis.__fyVx7Steps.length===6?globalThis.__fyDeepSig(d,true):null});switch(Eb){');
      const vx7InnerNeedle = 'for(var W=w;void 0!==W;){var LL,Is,k=7&W>>3;switch(7&W){';
      if (!body.includes(vx7InnerNeedle)) throw new Error('FY vx7 内层探针位置不存在');
      body = body.replace(vx7InnerNeedle,
        'for(var W=w;void 0!==W;){var LL,Is,k=7&W>>3;if(globalThis.__fyVx7InnerSteps.length<1500)globalThis.__fyVx7InnerSteps.push({pc:W,branch:7&W,opcode:k,uDeep:globalThis.__fyDeepSig(U),callProbe:W===16?{p,a,y,target:globalThis.__fyValueSig(d[p]),key:globalThis.__fyValueSig(d[a]),keyString:typeof d[a]==="string"||typeof d[a]==="symbol"?String(d[a]):null,targetKeys:d[p]&&(typeof d[p]==="object"||typeof d[p]==="function")?Object.getOwnPropertyNames(d[p]).slice(0,25):null}:null,uDetail:(globalThis.__fyVx7InnerSteps.length<8||(globalThis.__fyVx7InnerSteps.length>=416&&globalThis.__fyVx7InnerSteps.length<=423))?globalThis.__fyDeepSig(U,true):null});switch(7&W){');
      const vx7CallNeedle = 'E=(E=d[p])[d[a]],S=d[p],l=R(E,S,t=O)';
      if (!body.includes(vx7CallNeedle)) throw new Error('FY vx7 内层调用探针位置不存在');
      body = body.replace(vx7CallNeedle,
        'E=(E=d[p])[d[a]],S=d[p],globalThis.__fyVx7InnerSteps.at(-1).callArgs=globalThis.__fyDeepSig(O,true),l=R(E,S,t=O)');
      const jInvokeNeedle = 'E=C[p],l=R(E,null,S=I)';
      if (!body.includes(jInvokeNeedle)) throw new Error('FY J call 探针位置不存在');
      body = body.replace(jInvokeNeedle,
        'E=C[p],(function(){const t={fnName:E?.name,fnPrefix:String(E).slice(0,120),argDetail:globalThis.__fyDeepSig(I,true)};globalThis.__fyJInvoke.push(t);l=R(E,null,S=I);t.result=globalThis.__fyDeepSig(l,true)})()');
      const qzEntryNeedle = 'function Qz(OA,P,EL,Kt,M,v,Z){';
      if (!body.includes(qzEntryNeedle)) throw new Error('FY Qz 入口探针位置不存在');
      body = body.replace(qzEntryNeedle,
        'function Qz(OA,P,EL,Kt,M,v,Z){var __fyQz5Call=(OA===5||OA===6)&&globalThis.__fySerializing?++globalThis.__fyQz5CallCount:0;if(globalThis.__fyQzCalls.length<100)globalThis.__fyQzCalls.push({args:[OA,P,EL,Kt,M,v,Z].map(globalThis.__fyValueSig),eventDetail:OA===1?{type:P?.type,pageX:P?.pageX,pageY:P?.pageY,clientX:P?.clientX,clientY:P?.clientY,offsetX:P?.offsetX,offsetY:P?.offsetY,layerX:P?.layerX,layerY:P?.layerY,timeStamp:P?.timeStamp,thirdTag:Object.prototype.toString.call(EL),thirdId:EL?.id,thirdClass:EL?.className,thirdRect:EL?.getBoundingClientRect?.(),targetSame:P?.target===EL,targetId:P?.target?.id,targetRect:P?.target?.getBoundingClientRect?.()}:null,replayArgs:OA===15?{P,EL,Kt}:null,earlyCount:globalThis.__fyEarlyCalls?.length??0});');
      const qzStepNeedle = 'for(d[x]=EL,d[i]=Kt,d[$]=a;d[$]!==U;){var JY=d[$]&o,wZ,O=d[$]>>5&o;';
      const feature77DateNeedle = 'd[1]=+d[3],d[3]=d[2][66],d[2]=d[1]-d[3]';
      if (!body.includes(feature77DateNeedle)) throw new Error('FY feature77 日期读取位置不存在');
      body = body.replace(feature77DateNeedle, 'd[1]=+d[3],globalThis.__fyStyleVmInputs.push({kind:"feature77Date",now:d[1],base:d[2][66],length:d[2][77]?.length}),d[3]=d[2][66],d[2]=d[1]-d[3]');
      for (const [needle, replacement] of [
        ['d[E]=d[g].pop(),d[g]=d[E]+""', 'd[E]=d[g].pop(),globalThis.__fyStyleVmInputs.push({kind:"feature52StackRead",value:d[E]}),d[g]=d[E]+""'],
        ['d[6]=d[2].pop(),d[2]=d[6]+""', 'd[6]=d[2].pop(),globalThis.__fyStyleVmInputs.push({kind:"feature52StackRead",value:d[6]}),d[2]=d[6]+""'],
      ]) {
        if (!body.includes(needle)) throw new Error('FY feature52 栈读取位置不存在');
        body = body.replace(needle, replacement);
      }
      if (!body.includes(qzStepNeedle)) throw new Error('FY Qz 步进探针位置不存在');
      body = body.replace(qzStepNeedle,
        'for(d[x]=EL,d[i]=Kt,d[$]=a;d[$]!==U;){var JY=d[$]&o,wZ,O=d[$]>>5&o;if(__fyQz5Call&&globalThis.__fyQz5Steps.length<5000)globalThis.__fyQz5Steps.push({call:__fyQz5Call,oa:OA,pc:d[$],branch:JY,opcode:O,entryCount:globalThis.__fySerialEntryTrace.length,regs:Object.keys(d).map(function(key){return[key,globalThis.__fyValueSig(d[key])]}),detail:__fyQz5Call===1?globalThis.__fyDeepSig(d,true):null});if(globalThis.__fyQzSteps.length<2000&&(globalThis.__fyEarlyCalls?.length??0)<=1)globalThis.__fyQzSteps.push({pc:d[$],branch:JY,opcode:O,call:globalThis.__fyQzCalls.length,earlyCount:globalThis.__fyEarlyCalls?.length??0});');
      const mr43LookupNeedle = 'd[S]=d[i][r],d[S]&&(d[1]=!0)';
      if (!body.includes(mr43LookupNeedle)) throw new Error('FY mr43 lookup 探针位置不存在');
      body = body.replace(mr43LookupNeedle,
        'd[S]=d[i][r],v===43&&s==="deviceorientation"&&globalThis.__fyMr43Lookup.push({key:r,targetTag:Object.prototype.toString.call(d[i]),isWindow:d[i]===window,targetKeys:Object.getOwnPropertyNames(d[i]).slice(0,15),valueType:typeof d[S],own:Object.prototype.hasOwnProperty.call(d[i],r)}),d[S]&&(d[1]=!0)');
      const mr22GateNeedle = 'd[9]=M[0],d[k]=d[9]?394:231';
      if (!body.includes(mr22GateNeedle)) throw new Error('FY mr22 gate 探针位置不存在');
      body = body.replace(mr22GateNeedle,
        'd[9]=M[0],v===22&&globalThis.__fyMr22Gate.push({MTag:Object.prototype.toString.call(M),MKeys:Object.getOwnPropertyNames(M).slice(0,15),M0Type:typeof d[9],M0Tag:Object.prototype.toString.call(d[9]),M0Keys:d[9]&&typeof d[9]==="object"?Object.getOwnPropertyNames(d[9]).slice(0,15):null,M0SrcLength:typeof d[9]?.src==="string"?d[9].src.length:null,M0Value:typeof d[9]==="number"||typeof d[9]==="boolean"?d[9]:null,M0Length:typeof d[9]==="string"?d[9].length:null,truthy:!!d[9]}),d[k]=d[9]?394:231');
      const dg13WNeedle = 'd[6]=W(C[0],null,L,85),W(d[2],null,d[6]),d[7]=576';
      if (!body.includes(dg13WNeedle)) throw new Error('FY DG13 W 探针位置不存在');
      body = body.replace(dg13WNeedle,
        'd[6]=W(C[0],null,L,85),(function(){const t={zU,argType:typeof d[6],arg:String(d[6]).slice(0,80),fn:String(d[2])};globalThis.__fyDg13WCall.push(t);try{const r=W(d[2],null,d[6]);t.resultType=typeof r;return r}catch(e){t.errorName=e.name;t.errorMessage=String(e.message).slice(0,120);throw e}})(),d[7]=576');
      const dg14GateNeedle = 'd[0]=Kt[C[K]],P=W(C[0],null,L,91),d[9]=d[0][P],d[7]=d[9]?329:163';
      if (!body.includes(dg14GateNeedle)) throw new Error('FY DG14 gate 探针位置不存在');
      body = body.replace(dg14GateNeedle,
        'd[0]=Kt[C[K]],P=W(C[0],null,L,91),d[9]=d[0][P],zU===14&&globalThis.__fyDg14Gate.push({containerKey:C[K],property:P,targetTag:Object.prototype.toString.call(d[0]),targetKeys:Object.getOwnPropertyNames(d[0]).slice(0,20),valueType:typeof d[9],valueTruthy:!!d[9],valueTag:Object.prototype.toString.call(d[9])}),d[7]=d[9]?329:163');
      const builderNeedle = 'n(B,void 0),n(Qu,JY);var E=j(W=Eb,this,L=x+1);A(Qu),A(B)';
      if (!body.includes(builderNeedle)) throw new Error('FY builder 探针位置不存在');
      body = body.replace(builderNeedle,
        'n(B,void 0),globalThis.__fyBuilderTrace.push({stage:"afterB",uLength:U?.length,elType:typeof EL,elLength:EL?.length,bTag:Object.prototype.toString.call(B),quTag:Object.prototype.toString.call(Qu)}),n(Qu,JY),globalThis.__fyBuilderTrace.push({stage:"afterQu",uLength:U?.length,elType:typeof EL,elLength:EL?.length,bTag:Object.prototype.toString.call(B),quTag:Object.prototype.toString.call(Qu)});var E=j(W=Eb,this,L=x+1);A(Qu),globalThis.__fyBuilderTrace.push({stage:"afterAQu",uLength:U?.length,eType:typeof E,eLength:E?.length,elType:typeof EL,elLength:EL?.length}),A(B),globalThis.__fyBuilderTrace.push({stage:"afterAB",uLength:U?.length,eType:typeof E,eLength:E?.length,elType:typeof EL,elLength:EL?.length})');
      const ebStepNeedle = 'for(var k=w;void 0!==k;){var LL,Is,p=7&k>>3;switch(7&k){';
      if (!body.includes(ebStepNeedle)) throw new Error('FY Eb 步进探针位置不存在');
      body = body.replace(ebStepNeedle,
        `for(var k=w;void 0!==k;){var LL,Is,p=7&k>>3;if(globalThis.__fyEbSteps.length<3000)globalThis.__fyEbSteps.push({pc:k,branch:7&k,opcode:p,n:N,uLength:U?.length,uSig:Array.isArray(U)?U.map(globalThis.__fyValueSig):null,el:EL,earlyCount:globalThis.__fyEarlyCalls?.length??0});switch(7&k){`);
      const ebCallNeedle = 'E=C[a],S=R(E,null,W=r)';
      if (!body.includes(ebCallNeedle)) throw new Error('FY Eb call 探针位置不存在');
      body = body.replace(ebCallNeedle,
        'E=C[a],(function(){const t={pc:k,a,fnName:E?.name,fnPrefix:String(E).slice(0,120),argSig:Array.isArray(r)?r.map(globalThis.__fyValueSig):globalThis.__fyValueSig(r)};if(globalThis.__fyEbCallTrace.length<100)globalThis.__fyEbCallTrace.push(t);try{S=R(E,null,W=r);t.resultSig=globalThis.__fyValueSig(S)}catch(e){t.error=String(e).slice(0,120);throw e}})()');
      const mr47LoopNeedle = 'd[7]=d[5]<d[6],d[k]=d[7]?199:581';
      if (!body.includes(mr47LoopNeedle)) throw new Error('FY mr47 loop 探针位置不存在');
      body = body.replace(mr47LoopNeedle,
        'd[7]=d[5]<d[6],v===47&&globalThis.__fyMr47Loop.length<100&&globalThis.__fyMr47Loop.push({index:d[5],limit:d[6],continue:d[7]}),d[k]=d[7]?199:581');
      const mrD6Needle = 'for(var d=[],FL=2;';
      if (!body.includes(mrD6Needle)) throw new Error('FY mr47 d6 探针位置不存在');
      body = body.replace(mrD6Needle,
        'for(var d=v===47?new Proxy([],{set(t,k,val,r){if(globalThis.__fyMr47Writes.length<300)globalThis.__fyMr47Writes.push({key:String(k),type:typeof val,tag:Object.prototype.toString.call(val),value:typeof val==="number"?val:null,length:val?.length,stack:new Error().stack.split("\\n").slice(1,4)});if(k==="6"&&globalThis.__fyMr47D6Writes.length<500)globalThis.__fyMr47D6Writes.push({type:typeof val,value:typeof val==="number"?val:null,length:typeof val==="string"?val.length:null,stack:new Error().stack.split("\\n").slice(1,4)});return Reflect.set(t,k,val,r)}}):v===43?new Proxy([],{set(t,k,val,r){if((k==="13"||k==="1")&&globalThis.__fyMr43Writes.length<100)globalThis.__fyMr43Writes.push({key:String(k),valueSig:globalThis.__fyValueSig(val),stack:new Error().stack.split("\\n").slice(1,4)});return Reflect.set(t,k,val,r)}}):[],FL=2;');
      const serializerNeedle = 'd[p]=W(C[l],null,1,d[i],d[m],d[2],d[4],d[5]),d[i]=d[p]';
      if (!body.includes(serializerNeedle)) throw new Error('FY serializer 探针位置不存在');
      body = body.replace(serializerNeedle,
        '(function(){const args=[d[i],d[m],d[2],d[4],d[5]],t={argSig:args.map(globalThis.__fyValueSig),argArrays:[d[i],d[m]].map(v=>Array.isArray(v)?v.slice():null),mKeys:d[m]&&typeof d[m]==="object"?Object.keys(d[m]).slice(0,30):null,mProfile:Object.fromEntries(Object.keys(d[m]||{}).map(k=>[k,globalThis.__fyValueSig(d[m][k])])),featureProfile:Object.fromEntries(Object.keys(d[2]||{}).map(k=>[k,globalThis.__fyValueSig(d[2][k])])),windowKeys:Object.keys(window),featureDeep:Object.fromEntries(Object.keys(d[2]||{}).map(k=>[k,globalThis.__fyDeepSig(d[2][k])])),featureDetail:{11:globalThis.__fyDeepSig(d[2]?.[11],true),105:globalThis.__fyDeepSig(d[2]?.[105],true),152:globalThis.__fyDeepSig(d[2]?.[152],true)},feature52Raw:d[2]?.[52],feature77Raw:Array.isArray(d[2]?.[77])?d[2][77].slice():null,feature152Raw:Array.isArray(d[2]?.[152])?d[2][152].slice():null,feature115:Object.fromEntries(Object.entries(d[2]?.[115]||{}).map(([k,v])=>[k,globalThis.__fyValueSig(v)])),feature125:Array.isArray(d[2]?.[125])?d[2][125].map(globalThis.__fyValueSig):null,feature125Last:typeof d[2]?.[125]?.at?.(-1)==="string"?d[2][125].at(-1).slice(0,80):null};globalThis.__fySerializerCalls.push(t);globalThis.__fySerializing=true;try{d[p]=W(C[l],null,1,...args)}finally{globalThis.__fySerializing=false}if(!globalThis.__fyWindowDescriptorSnapshot)globalThis.__fyWindowDescriptorSnapshot=globalThis.__fyDescribeWindow();t.resultSig=globalThis.__fyValueSig(d[p]);t.resultBytes=Array.isArray(d[p])?Array.from(d[p]):null})(),d[i]=d[p]');
      const resourceQueryNeedle = 'OA=d[8][d[m]](d[9]),d[8]=OA';
      if (!body.includes(resourceQueryNeedle)) throw new Error('FY resource query 探针位置不存在');
      body = body.replace(resourceQueryNeedle,
        'OA=d[8][d[m]](d[9]),globalThis.__fyResourceQueries.push({targetTag:Object.prototype.toString.call(d[8]),method:d[m],argument:d[9],count:OA?.length,first:OA?.[0]?.toJSON?.()||null}),d[8]=OA');
    }
    if (traceFyBranch) fyInstrumentedSnippet = body.slice(382900, 383700);
    await route.fulfill({ response, body });
  });
  await page.route('**/secdev/entry/x/*.js', async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    nonceEntrySourceBody = body;
    await route.fulfill({ response, body });
  });
  let nonceAssetStats = null;
  let nonceStateBeforeAsset = null;
  if (traceNonceGt) await page.route('**/secdev/**/secaptcha/*.js', async (route) => {
    nonceStateBeforeAsset = await page.evaluate(() => ({
      config: { ...window._config_ },
      localStorage: Object.fromEntries(Object.entries(localStorage)),
      sessionStorage: Object.fromEntries(Object.entries(sessionStorage)),
      windowKeys: Object.keys(window),
      windowNames: Object.getOwnPropertyNames(window),
      prototypeKeys: Object.fromEntries([
        'HTMLScriptElement', 'HTMLStyleElement', 'HTMLHeadElement',
        'HTMLBodyElement', 'HTMLDivElement', 'HTMLSpanElement',
        'HTMLCanvasElement', 'HTMLLinkElement',
      ].map(name => [name, Object.keys(window[name].prototype)])),
    }));
    const response = await route.fetch();
    const raw = new Uint8Array(await response.body());
    const zero = raw.indexOf(0);
    if (zero < 0) throw new Error('nonce 资源缺少分隔字节');
    let source = new TextDecoder().decode(raw.slice(0, zero));
    nonceAssetStats = { length: raw.length, sourceLength: source.length,
      hash: assetStats(source).hash };
    const needle = 'function Gt(n){return(0,fe[n])()}';
    if (!source.includes(needle)) throw new Error('nonce Gt 入口不匹配');
    const ltNeedle = 'function Lt(n,r,t){return mt(function(n,r,t){return(0,fe[n])(r,t)}(n,r,t))}';
    if (!source.includes(ltNeedle)) throw new Error('nonce Lt 入口不匹配');
    source = source.replace(ltNeedle, nonceLtProbe);
    const mtNeedle = 'function mt(n){return re[te]=n,te++}';
    if (!source.includes(mtNeedle)) throw new Error('nonce mt 入口不匹配');
    source = source.replace(mtNeedle, nonceMtProbe);
    const ttNeedle = 'function Tt(n,r){return mt(re[n][r])}';
    if (!source.includes(ttNeedle)) throw new Error('nonce Tt 入口不匹配');
    source = source.replace(ttNeedle, nonceTtProbe);
    const dispatchNeedle = 'function Mt(n,r){return(0,fe[n])(r)}function Nt(n,r){return(0,fe[n])(r)}function qt(n,r,t){return(0,fe[n])(r,t)}';
    if (!source.includes(dispatchNeedle)) throw new Error('nonce dispatch 入口不匹配');
    source = source.replace(dispatchNeedle, nonceDispatchProbe.replaceAll('\n', ''));
    const qtConstructorNeedle = 'function Qt(n,r){return mt(new fe[n](r))}';
    if (!source.includes(qtConstructorNeedle)) throw new Error('nonce Qt 入口不匹配');
    source = source.replace(qtConstructorNeedle,
      'function Qt(n,r){var value=new fe[n](r);if(globalThis.__nonceDispatchTrace&&globalThis.__nonceDispatchTrace.length<2000)globalThis.__nonceDispatchTrace.push({phase:globalThis.__noncePhase??null,kind:"Qt",n,arg:nonceShape(r),result:nonceShape(value),dateValue:value instanceof Date?value.valueOf():null});return mt(value)}');
    const jnNeedle = 'function jn(n){return!!(0|(r=1,t=Ft(0|n),t in re[r]));var r,t}';
    if (!source.includes(jnNeedle)) throw new Error('nonce jn 入口不匹配');
    source = source.replace(jnNeedle, nonceJnProbe);
    source = source.replace('ae=crypto.genRandomValues("",0)',
      `globalThis.__nonceSnapshotMemory=function(){return ${nonceMemoryProbe}},globalThis.__nonceMemoryBefore=globalThis.__nonceSnapshotMemory(),ae=crypto.genRandomValues("",0),globalThis.__nonceMemoryAfter=globalThis.__nonceSnapshotMemory()`);
    const registerNeedle = 'ue=(fe=[$i=null]).push.bind(fe)';
    if (!source.includes(registerNeedle)) throw new Error('nonce 注册入口不匹配');
    const registerProbe = 'ue=(fe=[$i=null],function(){var start=fe.length,result=fe.push.apply(fe,arguments);for(var index=0;index<arguments.length;index++){var fn=arguments[index];if(globalThis.__nonceRegistrationTrace&&globalThis.__nonceRegistrationTrace.length<500)globalThis.__nonceRegistrationTrace.push({index:start+index,phase:globalThis.__noncePhase??null,name:fn.name,length:fn.length,sourceLength:String(fn).length,sourceStart:String(fn).slice(0,100),stack:String(new Error().stack).split(String.fromCharCode(10)).slice(1,5)})}return result})';
    source = source.replace(registerNeedle, registerProbe);
    const branchNeedle = 'j(0|Lt(0|f,Ot(0|t),Ft(2084)))&&(u=ar(t,37445)';
    if (!source.includes(branchNeedle)) throw new Error('nonce 环境分支不匹配');
    const branchProbe = '(globalThis.__nonceBranchProbe={key:Ft(2084),parentKey:Ft(2385),parentType:typeof Ot(0|t),parentTag:Object.prototype.toString.call(Ot(0|t)),parentKeys:Ot(0|t)&&typeof Ot(0|t)==="object"?Object.keys(Ot(0|t)).slice(0,15):null},globalThis.__nonceBranchProbe.condition=j(0|Lt(0|f,Ot(0|t),Ft(2084))))&&(u=ar(t,37445)';
    source = source.replace(branchNeedle, branchProbe);
    const yrNeedle = 'function yr(){return en(732664,732668,1119,1941)}';
    if (!source.includes(yrNeedle)) throw new Error('nonce yr 环境入口不匹配');
    const yrProbe = 'function yr(){var value=en(732664,732668,1119,1941);globalThis.__nonceYrProbe={key1:Ft(1119),key2:Ft(1941),handle:value,type:typeof Ot(0|value),tag:Object.prototype.toString.call(Ot(0|value)),truthy:!!Ot(0|value)};return value}';
    source = source.replace(yrNeedle, yrProbe);
    const loopNeedle = 'for(i=sr(Bn()),sf[t+56>>2]=0';
    if (!source.includes(loopNeedle)) throw new Error('nonce 枚举入口不匹配');
    const loopProbe = 'for(i=sr(Bn()),globalThis.__nonceLoopProbe={phase:globalThis.__noncePhase??null,key:Ft(2883),tag:Object.prototype.toString.call(Ot(0|i)),length:Br(i)},globalThis.__nonceLoopProbes.push(globalThis.__nonceLoopProbe),sf[t+56>>2]=0';
    source = source.replace(loopNeedle, loopProbe);
    source = source.replace('!cf[731904]', '(globalThis.__nonceResourceGateTrace.push({phase:globalThis.__noncePhase??null,flag:cf[731904]}),!cf[731904])');
    source = source.replace('g(t),Er()&&', 'g(t),(globalThis.__nonceErProbe=Er())&&');
    source = source.replace('function mr(n){return 0|Lt(0|Or(),Ot(0|n),Ft(1924))}',
      'function mr(n){var parent=Ot(0|n),result=0|Lt(0|Or(),parent,Ft(1924));(globalThis.__nonceMrProbe||=[]).push({phase:globalThis.__noncePhase??null,tag:Object.prototype.toString.call(parent),keys:parent&&typeof parent==="object"?Object.keys(parent).slice(0,15):null,canvasTag:Object.prototype.toString.call(parent?.canvas),result,stack:String(new Error().stack).split(String.fromCharCode(10)).slice(1,4)});return result}');
    const probe = 'function Gt(n){var tableLength=fe.length,fnName=fe[n].name,fnLength=fe[n].length,value=(0,fe[n])(),hash=null;if(typeof value==="string"){hash=2166136261;for(var index=0;index<value.length;index++)hash=(Math.imul(hash,16777619)^value.charCodeAt(index))>>>0}if(globalThis.__nonceGtTrace&&globalThis.__nonceGtTrace.length<500)globalThis.__nonceGtTrace.push({n,tableLength,fnName,fnLength,type:typeof value,value:typeof value==="number"||typeof value==="boolean"?value:null,stringLength:typeof value==="string"?value.length:null,stringHash:hash,keys:value&&typeof value==="object"?Object.keys(value).slice(0,8):null});return value}';
    const prefix = new TextEncoder().encode(source.replace(needle, probe));
    const body = new Uint8Array(prefix.length + raw.length - zero);
    body.set(prefix);
    body.set(raw.slice(zero), prefix.length);
    await route.fulfill({ response, body: Buffer.from(body) });
  });
  if (!TRACE_ET_VM) await page.route('**/AWSC/et/1.83.8/et_f.js', async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    etAssetStats = assetStats(body);
    if (saveEtSource) etSourceBody = body;
    if (!body.includes('M(4)')) throw new Error('ET 初始化入口不匹配');
    const fingerprint = 'M(4);window.__etStartupFingerprint=W.map(function(value){return typeof value==="string"?{type:"string",length:value.length}:value&&typeof value==="object"?{type:"object",keys:Object.keys(value).slice(0,5)}:value})';
    await route.fulfill({ response, body: 'window.__etInitCookie=document.cookie;window.__etInitReadyState=document.readyState;' + body.replace('M(4)', fingerprint) });
  });
  if (TRACE_ET_VM) await page.route('**/AWSC/et/1.83.8/et_f.js', async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    etAssetStats = assetStats(body);
    if (saveEtSource) etSourceBody = body;
    const needle = 'for(var Sc=82624;void 0!==Sc;){';
    const replacement = 'for(var Sc=82624;void 0!==Sc;){if(t===23&&globalThis.__etVmActive){var etState=globalThis.__etVmState;etState.hash=(Math.imul(etState.hash,16777619)^Sc)>>>0;etState.count++;if(etState.count%1000===0)etState.checkpoints.push(etState.hash);if(globalThis.__etVmScTrace.length<2000)globalThis.__etVmScTrace.push(Sc);if(Sc===128385&&globalThis.__etVmDivergence.length<20){var etItem=Xe[je],etFirst=etItem&&etItem[0];globalThis.__etVmDivergence.push({je,xType:typeof Xe,xLength:Xe&&Xe.length,itemType:typeof etItem,itemLength:etItem&&etItem.length,firstType:typeof etFirst,firstTruthy:!!etFirst,firstName:typeof etFirst==="function"?etFirst.name:null})}if(Sc===119170&&globalThis.__etVmFlags.length<20){var etFlag=Xe[me];globalThis.__etVmFlags.push({me,itemType:typeof etFlag,itemName:typeof etFlag==="function"?etFlag.name:null,names:me===0?Xe.map(function(value){return value&&value.name}):null})}}';
    if (!body.includes(needle)) throw new Error('ET VM 版本不匹配');
    const returnNeedle = 'return Vr;';
    if (!body.includes(returnNeedle)) throw new Error('ET VM 返回点不匹配');
    const initNeedle = 'M(4)';
    if (!body.includes(initNeedle)) throw new Error('ET 初始化入口不匹配');
    const returnProbe = 'if(globalThis.__etVmActive&&globalThis.__etReturnTrace.length<100){var etValue=Vr,etHash=2166136261;if(typeof etValue==="string")for(var etIndex=0;etIndex<etValue.length;etIndex++)etHash=(Math.imul(etHash,16777619)^etValue.charCodeAt(etIndex))>>>0;globalThis.__etReturnTrace.push({t,kind:typeof etValue,length:typeof etValue==="string"?etValue.length:null,hash:typeof etValue==="string"?etHash:null,number:typeof etValue==="number"?etValue:null,keys:etValue&&typeof etValue==="object"?Object.keys(etValue).slice(0,20):null})}return Vr;';
    const traceAll = replacement.replace('if(t===23&&globalThis.__etVmActive){', 'if(t===4&&W.length>28&&globalThis.__etW28Last!==W[28]){globalThis.__etW28Last=W[28];if(globalThis.__etW28Trace.length<30)globalThis.__etW28Trace.push({sc:Sc,length:W.length,value:W[28]})}if(t===4&&W.length>89&&globalThis.__etW89Last!==W[89]){globalThis.__etW89Last=W[89];if(globalThis.__etW89Trace.length<30)globalThis.__etW89Trace.push({sc:Sc,length:W.length,value:W[89]})}if(t===4&&W.length>110&&globalThis.__etWLast!==W[110]){globalThis.__etWLast=W[110];if(globalThis.__etWTrace.length<30)globalThis.__etWTrace.push({sc:Sc,length:W.length,value:W[110]})}if((t===4||t===14)&&globalThis.__etVmScTrace.length<20000)globalThis.__etVmScTrace.push(Sc);if(t===23&&globalThis.__etVmActive){')
      .replace('if(t===4&&W.length>28', 'if(Sc===120833&&globalThis.__etHashLoop2.length<3)globalThis.__etHashLoop2.push({t,sourceLength:ye&&ye.length,limit:Fe,index:$e});if(Sc===136577)globalThis.__etInitProbe.push({pc:Sc,t,needle:qe,haystackLength:ue&&ue.length,index:ue&&ue.indexOf(qe),cookieLength:document.cookie.length,equalsCookie:ue===document.cookie});if(t===14&&[128064,26176,45376,110849,4737,38272].includes(Sc))globalThis.__etEnvironmentChecks.push({Sc,ve:typeof ve==="string"?ve.slice(0,80):ve,Fa,ie,Pe,me,ge,Oe});if(Sc===145537&&globalThis.__etHashInputLast!==we&&globalThis.__etHashInputs.length<10){globalThis.__etHashInputLast=we;var etHash=2166136261;for(var etIndex=0;etIndex<we.length;etIndex++)etHash=(Math.imul(etHash,16777619)^we.charCodeAt(etIndex))>>>0;globalThis.__etHashInputs.push({t,length:we.length,hash:etHash,input:we})}if(t===4&&W.length>28')
      .replace('length<2000', 'length<20000')
      .replace('if(Sc===128385', 'if(Sc===145537&&globalThis.__etHashInputLast!==we&&globalThis.__etHashInputs.length<10){globalThis.__etHashInputLast=we;var etHash=2166136261;for(var etIndex=0;etIndex<we.length;etIndex++)etHash=(Math.imul(etHash,16777619)^we.charCodeAt(etIndex))>>>0;globalThis.__etHashInputs.push({t,length:we.length,hash:etHash})}if(Sc===128385')
      .replace('if(Sc===128385', 'if(Sc===53314){if(globalThis.__etPayloadBytes===null)globalThis.__etPayloadBytes=Array.from(ye);globalThis.__etArithmeticProbe.push({t,S,U,j,yeLength:ye&&ye.length})}if(Sc===128385')
      .replace('if(Sc===128385', 'if(Sc===136577){if(t===4)globalThis.__etInitCookie=document.cookie;globalThis.__etInitProbe.push({pc:Sc,t,needle:qe,haystackLength:ue&&ue.length,index:ue&&ue.indexOf(qe),cookieLength:document.cookie.length,equalsCookie:ue===document.cookie})}if(Sc===128385')
      .replace('if(Sc===128385', 'if(t===14&&Array.isArray(Aa)&&Aa.length>110&&globalThis.__etAaLast!==Aa[110]){globalThis.__etAaLast=Aa[110];if(globalThis.__etAaTrace.length<30)globalThis.__etAaTrace.push({sc:Sc,length:Aa.length,value:Aa[110]})}if(Sc===128385')
      .replace('if(Sc===128385', 'if(t===14&&Array.isArray(Ca)&&Ca.length>110&&globalThis.__etCaLast!==Ca[110]){globalThis.__etCaLast=Ca[110];if(globalThis.__etCaTrace.length<30)globalThis.__etCaTrace.push({sc:Sc,length:Ca.length,value:Ca[110]})}if(Sc===128385')
      .replace('if(Sc===128385', 'if(Sc===123072&&globalThis.__etBranchTrace.length<20)globalThis.__etBranchTrace.push({caType:typeof Ca,caLength:Ca&&Ca.length,ca:Ca&&Ca.map(function(value){return typeof value==="string"?{type:"string",length:value.length}:value&&typeof value==="object"?{type:"object",keys:Object.keys(value).slice(0,5)}:value}),saType:typeof sa,saTruthy:!!sa});if(Sc===128385');
    const initProbe = 'globalThis.__etInitCookie=document.cookie;M(4);globalThis.__etStartupFingerprint=W.map(function(value){return typeof value==="string"?{type:"string",length:value.length}:value&&typeof value==="object"?{type:"object",keys:Object.keys(value).slice(0,5)}:value});';
    const registerProbe = 'if(globalThis.AWSCInner&&typeof globalThis.AWSCInner.register==="function"){var etRegister=globalThis.AWSCInner.register;globalThis.AWSCInner.register=function(){var args=Array.from(arguments);var result=etRegister.apply(this,args);globalThis.__etAwscCalls.push({args:args.map(function(value){return {type:typeof value,length:typeof value==="string"?value.length:null,text:typeof value==="string"&&value.length<30?value:null,keys:value&&typeof value==="object"?Object.getOwnPropertyNames(value).slice(0,30):null,entryTypes:value&&typeof value==="object"?Object.getOwnPropertyNames(value).slice(0,30).map(function(key){return typeof value[key]}):null}}),returnType:typeof result});return result}};';
    await route.fulfill({ response, body: registerProbe + body.replace(needle, traceAll).replace(returnNeedle, returnProbe).replace(initNeedle, initProbe) });
  });
  if (traceEtPc) await page.route('**/AWSC/et/1.83.8/et_f.js', async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    etAssetStats = assetStats(body);
    if (saveEtSource) etSourceBody = body;
    const loop = 'for(var Sc=82624;void 0!==Sc;){';
    if (!body.includes(loop) || !body.includes('M(4)')) throw new Error('ET VM 版本不匹配');
    const fingerprint = 'M(4);window.__etStartupFingerprint=W.map(function(value){return typeof value==="string"?{type:"string",length:value.length}:value&&typeof value==="object"?{type:"object",keys:Object.keys(value).slice(0,5)}:value});' + etWProbe;
    await route.fulfill({ response, body: environmentProbe + 'window.__etInitCookie=document.cookie;window.__etInitReadyState=document.readyState;' +
      body.replace(loop, loop + etPcProbe).replace('M(4)', fingerprint) });
  });
  const verifyRequests = [];
  const dssResponses = [];
  page.on('response', (response) => {
    if (response.url().includes('.tdum.alibaba.com/dss.js')) {
      dssResponses.push(response.text().then(body => ({
        url: response.url(), status: response.status(), body,
      })).catch(error => ({ url: response.url(), error: String(error) })));
    }
  });
  page.on('request', (request) => {
    if (request.url().includes('/_____tmd_____/newslidevalidate')) {
      verifyRequests.push(request.allHeaders().then((headers) => ({
        url: request.url(), et: headers['bx-et'], pp: headers['bx-pp'],
      })));
    }
  });
  await page.goto(challenge.url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window._config_?.ppModule &&
    window.FYModule?.fyObj &&
    typeof window.etSign === 'function' &&
    typeof crypto.genRandomValues === 'function' &&
    document.getElementsByClassName('scratch-captcha-slider').length > 0);
  await page.waitForTimeout(3000);
  const etBreakpoints = [];
  const etM23Returns = [];
  if (BREAK_ET) {
    const debuggerSession = await page.context().newCDPSession(page);
    let innerBreakpointId;
    let innerHitCount = 0;
    let steppedM23 = false;
    let awaitingM23Return = false;
    await debuggerSession.send('Runtime.enable');
    await debuggerSession.send('Debugger.enable');
    debuggerSession.on('Debugger.paused', async (pause) => {
      let stepOutForM23 = false;
      try {
        const frames = pause.callFrames.slice(0, 4).map((frame) => ({
          functionName: frame.functionName,
          location: frame.location,
          scopes: frame.scopeChain.map((scope) => ({ type: scope.type,
            objectId: scope.object.objectId })),
        }));
        const top = pause.callFrames[0];
        if (!innerBreakpointId && top.functionName === 'M.ar.<computed>') {
          const inner = await debuggerSession.send('Debugger.evaluateOnCallFrame', {
            callFrameId: top.callFrameId,
            expression: 'M',
          });
          if (inner.result?.objectId) {
            const breakpoint = await debuggerSession.send('Debugger.setBreakpointOnFunctionCall', {
              objectId: inner.result.objectId,
            });
            innerBreakpointId = breakpoint.breakpointId;
          }
        }
        if (top.functionName === 'M' && innerBreakpointId) {
          innerHitCount++;
          if (innerHitCount >= 80) {
            await debuggerSession.send('Debugger.removeBreakpoint', {
              breakpointId: innerBreakpointId,
            });
          }
        }
        const scopes = [];
        if (etBreakpoints.length < 6) {
          for (const scope of top.scopeChain.filter((item) => item.type !== 'global')) {
            const properties = await debuggerSession.send('Runtime.getProperties', {
              objectId: scope.object.objectId,
              ownProperties: true,
            });
            scopes.push({ type: scope.type, variables: properties.result.slice(0, 120)
              .map((property) => ({ name: property.name,
                type: property.value?.type,
                description: property.value?.description?.slice(0, 120) })) });
          }
        }
        const values = await debuggerSession.send('Debugger.evaluateOnCallFrame', {
          callFrameId: top.callFrameId,
          expression: '({ arguments: Array.from(arguments), thisType: typeof this })',
          returnByValue: true,
        });
        if (awaitingM23Return) {
          const state = await debuggerSession.send('Debugger.evaluateOnCallFrame', {
            callFrameId: top.callFrameId,
            expression: '({ type: typeof S, value: typeof S === "number" ? S : null })',
            returnByValue: true,
          });
          etM23Returns.push({ frame: top.functionName, state: state.result?.value });
          awaitingM23Return = false;
        }
        if (!steppedM23 && top.functionName === 'M' &&
          values.result?.value?.arguments?.[0] === 23) {
          steppedM23 = true;
          awaitingM23Return = true;
          stepOutForM23 = true;
        }
        etBreakpoints.push({ frames, scopes, values: values.result?.value });
      } finally {
        await debuggerSession.send(stepOutForM23 ? 'Debugger.stepOut' : 'Debugger.resume');
      }
    });
    const etFunction = await debuggerSession.send('Runtime.evaluate', {
      expression: 'window.etSign',
    });
    await debuggerSession.send('Debugger.setBreakpointOnFunctionCall', {
      objectId: etFunction.result.objectId,
    });
  }
  await page.evaluate(() => {
    window.__x5InitDone = true;
    const calls = window.__x5Calls = [];
    const events = window.__x5Events = [];
    const copy = (value) => {
      try { return JSON.parse(JSON.stringify(value)); }
      catch { return String(value); }
    };
    const hook = (object, name, label) => {
      const original = object[name];
      if (label === 'et') window.__etOriginalSource = String(original);
      object[name] = function (...args) {
        const fyEnvironmentSnapshot = label === 'fy'
          ? window.__snapshotEnvironment?.() : null;
        const fyWindowNames = label === 'fy'
          ? Object.getOwnPropertyNames(window) : null;
        const fyWindowKeys = label === 'fy' ? Object.keys(window) : null;
        const fyResourceEntries = label === 'fy'
          ? performance.getEntriesByType('resource').map(value => value.toJSON()) : null;
        const fyPerformanceMemory = label === 'fy' && performance.memory
          ? { jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            usedJSHeapSize: performance.memory.usedJSHeapSize } : null;
        const fyDocumentProperties = label === 'fy'
          ? Object.fromEntries(Object.getOwnPropertyNames(document).map(name => {
            const descriptor = Object.getOwnPropertyDescriptor(document, name);
            return [name, { type: typeof document[name],
              value: typeof document[name] === 'string' ? document[name] : null,
              enumerable: descriptor?.enumerable, configurable: descriptor?.configurable,
              writable: descriptor?.writable ?? null }];
          })) : null;
        const fyEnvironmentBefore = label === 'fy'
          ? Object.fromEntries(['canvas', 'webgl'].map(name =>
            [name, window.__x5Environment[name].length])) : null;
        if (label === 'et' && Array.isArray(window.__etPcTrace)) {
          window.__etCallDocumentHooks = Object.fromEntries(
            ['__update_info', '__update_pos'].map((key) => {
              const descriptor = Object.getOwnPropertyDescriptor(document, key);
              return [key, descriptor ? {
                keys: Object.keys(descriptor), enumerable: descriptor.enumerable,
                type: typeof descriptor.value, name: descriptor.value?.name || null,
              } : null];
            }),
          );
          window.__etInitPcMetadata = window.__etPcMetadata;
          window.__etInitPcTrace = window.__etPcTrace;
          window.__etPcMetadata = [];
          for (const name of ['__etByte125Last', '__etMe125Last', '__etFlagSLast']) window[name] = undefined;
          for (const name of ['__etByte125Trace', '__etMe125Trace', '__etFlagTrace', '__etFlagSTrace', '__et1664Trace']) window[name] = [];
          for (const name of ['__etPcTrace', '__etEncodeSteps', '__etRoundStates',
            '__etBeforeRounds', '__etJeLengths', '__etCallInputs', '__etSeedTrace',
            '__etValueTrace']) {
            window[name] = [];
          }
          window.__etJ166Trace = [];
          window.__etJ166Last = undefined;
          window.__etCa166Trace = [];
          window.__etCa166Last = undefined;
          window.__etCallFingerprint = null;
          window.__etJeLastLength = undefined;
        }
        if (label === 'et') window.__etVmActive = true;
        const charAtValue = String.prototype.charAt.value;
        const random = Math.random;
        const now = Date.now;
        const nativeDate = window.Date;
        const randomTape = [];
        const timeTape = [];
        const callDateTape = [];
        Math.random = () => {
          const value = random();
          randomTape.push(value);
          return value;
        };
        Date.now = () => {
          const value = now();
          timeTape.push(value);
          return value;
        };
        if (label === 'et' || label === 'fy') {
          window.Date = new Proxy(nativeDate, {
            construct(target, dateArgs, newTarget) {
              const date = Reflect.construct(target, dateArgs, newTarget);
              if (dateArgs.length === 0) callDateTape.push(date.getTime());
              return date;
            },
          });
        }
        try {
          const output = original.apply(this, args);
          calls.push({ label, args: copy(args), output: copy(output),
            randomTape, timeTape, callDateTape, eventIndex: events.length, charAtValue,
            fyEnvironmentSnapshot,
            fyWindowNames, fyWindowKeys, fyResourceEntries, fyPerformanceMemory,
            fyDocumentProperties,
            environment: fyEnvironmentBefore ? Object.fromEntries(
              ['canvas', 'webgl'].map(name =>
                [name, window.__x5Environment[name].slice(fyEnvironmentBefore[name])])) : null });
          return output;
        } finally {
          if (label === 'et') {
            window.__etVmActive = false;
            if (Array.isArray(window.__etPcTrace)) {
              window.__etTargetTrace = Object.fromEntries(
                ['__etPcTrace', '__etPcMetadata', '__etEncodeSteps', '__etRoundStates',
                  '__etBeforeRounds', '__etJeLengths', '__etCallInputs', '__etSeedTrace',
                  '__etJ166Trace', '__etCa166Trace', '__etValueTrace'].map((name) => [name, window[name]]),
              );
              for (const name of Object.keys(window.__etTargetTrace)) window[name] = [];
            }
          }
          Math.random = random;
          Date.now = now;
          window.Date = nativeDate;
        }
      };
    };
    hook(window.FYModule, 'getFYToken', 'fy');
    hook(window.crypto, 'genRandomValues', 'nonce');
    hook(window, 'etSign', 'et');
    for (const type of ['mousedown', 'mousemove', 'mouseup',
      'touchstart', 'touchmove', 'touchend']) {
      document.addEventListener(type, (event) => {
        if (events.length >= 5000) return;
        const pointer = event.touches?.[0] || event.changedTouches?.[0] || event;
        const target = event.target;
        const rect = target?.getBoundingClientRect();
        const props = Object.fromEntries([
          'offsetX', 'offsetY', 'layerX', 'layerY', 'movementX', 'movementY',
          'pageX', 'pageY', 'x', 'y', 'which', 'detail',
        ].map(name => [name, event[name]]));
        events.push({ type, x: pointer.clientX, y: pointer.clientY,
          screenX: pointer.screenX, screenY: pointer.screenY,
          timeStamp: event.timeStamp, buttons: event.buttons, props,
          target: { tag: target?.tagName, id: target?.id,
            className: String(target?.className || ''),
            rect: rect?.toJSON() } });
      }, true);
    }
  });
  const profile = await page.evaluate(async () => ({
    url: location.href,
    userAgent: navigator.userAgent,
    navigatorVendor: navigator.vendor,
    networkProfile: navigator.connection ? {
      values: Object.fromEntries(['downlink', 'effectiveType', 'rtt', 'saveData', 'type']
        .map(name => [name, navigator.connection[name] ?? null])),
      ownNames: Object.getOwnPropertyNames(navigator.connection),
      prototypeNames: Object.getOwnPropertyNames(Object.getPrototypeOf(navigator.connection)),
    } : null,
    bluetoothUUIDProfile: typeof BluetoothUUID === 'function' ? {
      name: BluetoothUUID.name,
      length: BluetoothUUID.length,
      keys: Object.keys(BluetoothUUID),
      ownNames: Object.getOwnPropertyNames(BluetoothUUID),
    } : null,
    screenProfile: {
      ownNames: Object.getOwnPropertyNames(screen),
      prototypeNames: Object.getOwnPropertyNames(Screen.prototype),
      values: Object.fromEntries(Object.getOwnPropertyNames(Screen.prototype)
        .filter(name => name !== 'constructor').map(name => {
          try {
            const value = screen[name];
            return [name, typeof value === 'object' && value !== null
              ? { tag: Object.prototype.toString.call(value),
                keys: Object.getOwnPropertyNames(value),
                value: String(value).slice(0, 100) }
              : value];
          } catch (error) { return [name, String(error)]; }
        })),
      orientation: screen.orientation ? {
        type: screen.orientation.type,
        angle: screen.orientation.angle,
        prototypeNames: Object.getOwnPropertyNames(ScreenOrientation.prototype),
      } : null,
    },
    webglExtensions: document.createElement('canvas').getContext('webgl')?.getSupportedExtensions() || [],
    webglConstants: Object.fromEntries(Object.entries(
      Object.getOwnPropertyDescriptors(WebGLRenderingContext.prototype))
      .filter(([, descriptor]) => typeof descriptor.value === 'number')
      .map(([name, descriptor]) => [name, {
        value: descriptor.value, enumerable: descriptor.enumerable,
        configurable: descriptor.configurable, writable: descriptor.writable,
      }])),
    plugins: Array.from(navigator.plugins, plugin => ({
      name: plugin.name, filename: plugin.filename,
      description: plugin.description,
      mimeTypes: Array.from(plugin, mime => ({
        type: mime.type, suffixes: mime.suffixes, description: mime.description,
      })),
    })),
    cookie: document.cookie,
    referrer: document.referrer,
    token: window._config_?.NCTOKENSTR,
    appKey: window._config_?.NCAPPKEY,
    ppSignLength: typeof window._config_?.ppSign === 'string' ? window._config_.ppSign.length : null,
    ppModuleKeys: Object.keys(window._config_?.ppModule || {}).slice(0, 20),
    x5secdata: window._config_?.SECDATA,
    umidToken: localStorage.getItem('lswucn')?.split('@@')[0],
    umidStorage: localStorage.getItem('lswucn'),
    fyOptions: window.fyglobalopt ? JSON.parse(JSON.stringify(window.fyglobalopt)) : null,
    fyModuleKeys: Object.keys(window.FYModule || {}),
    fyObjectKeys: Object.keys(window.FYModule?.fyObj || {}).slice(0, 60),
    screen: { width: screen.width, height: screen.height,
      availWidth: screen.availWidth, availHeight: screen.availHeight,
      devicePixelRatio },
    viewport: { innerWidth, innerHeight, outerWidth, outerHeight },
    windowPosition: { screenTop, screenLeft, screenX, screenY },
    historyLength: history.length,
    performanceTimeOrigin: performance.timeOrigin,
    performanceMemory: performance.memory ? {
      values: Object.fromEntries(['jsHeapSizeLimit', 'totalJSHeapSize', 'usedJSHeapSize']
        .map(name => [name, performance.memory[name]])),
      ownNames: Object.getOwnPropertyNames(performance.memory),
      prototypeNames: Object.getOwnPropertyNames(Object.getPrototypeOf(performance.memory)),
      tag: Object.prototype.toString.call(performance.memory),
    } : null,
    performanceNavigation: performance.navigation ? {
      type: performance.navigation.type,
      redirectCount: performance.navigation.redirectCount,
      json: performance.navigation.toJSON?.() || null,
      ownNames: Object.getOwnPropertyNames(performance.navigation),
      prototypeNames: Object.getOwnPropertyNames(Object.getPrototypeOf(performance.navigation)),
      tag: Object.prototype.toString.call(performance.navigation),
    } : null,
    performanceTiming: performance.timing ? (() => {
      const names = Object.getOwnPropertyNames(Object.getPrototypeOf(performance.timing));
      return {
        values: Object.fromEntries(names.filter(name =>
          typeof performance.timing[name] === 'number')
          .map(name => [name, performance.timing[name]])),
        ownNames: Object.getOwnPropertyNames(performance.timing),
        prototypeNames: names,
        tag: Object.prototype.toString.call(performance.timing),
        json: performance.timing.toJSON?.() || null,
      };
    })() : null,
    storageEstimate: await navigator.storage?.estimate?.() || null,
    divCount: document.getElementsByTagName('div').length,
  }));
  const fyProbe = probeFy ? await page.evaluate(() => {
    const before = Object.fromEntries(['canvas', 'webgl'].map(name =>
      [name, window.__x5Environment[name].length]));
    window.FYModule.getFYToken();
    return { call: window.__x5Calls.pop(),
      environment: Object.fromEntries(['canvas', 'webgl'].map(name =>
        [name, window.__x5Environment[name].slice(before[name])])) };
  }) : null;
  const box = await page.locator('.scratch-captcha-slider .button').boundingBox();
  if (!box) throw new Error('滑块按钮不可用');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let step = 1; step <= 25; step++) {
    await page.mouse.move(x + step * 10, y, { steps: 2 });
  }
  await page.screenshot({ path: '.playwright-cli/dynamic_middrag.png' });
  await page.mouse.up();
  await page.waitForTimeout(800);
  const postDrag = await page.evaluate(() => ({
    buttonClass: document.querySelector('.scratch-captcha-slider .button')?.className || null,
    sliderText: document.querySelector('.scratch-captcha-slider')?.innerText?.slice(0, 180) || null,
    bodyText: document.body?.innerText?.slice(0, 260) || null,
    ppModuleType: typeof window._config_?.ppModule,
    ppSignLength: typeof window._config_?.ppSign === 'string' ? window._config_.ppSign.length : null,
    fyType: typeof window.FYModule?.getFYToken,
    etType: typeof window.etSign,
  }));
  if (!(await page.evaluate(() => window.__x5Calls?.length))) {
    await page.screenshot({ path: '.playwright-cli/dynamic_postdrag.png' });
  }
  const capture = {
    postDrag,
    fyProbe,
    fyInitCalls: probeFy ? await page.evaluate(() => window.__fyInitCalls || []) : null,
    fyEarlyCalls: probeFy ? await page.evaluate(() => window.__fyEarlyCalls || []) : null,
    fyRoutePatched,
    fyAssetStats,
    fyInstrumentedSnippet,
    fyBranchTrace: traceFyBranch ? await page.evaluate(() => window.__fyBranchTrace || []) : null,
    fyEntryTrace: traceFyBranch ? await page.evaluate(() => window.__fyEntryTrace || []) : null,
    fySerialEntryTrace: traceFyBranch ? await page.evaluate(() => window.__fySerialEntryTrace || []) : null,
    fyStyleVmInputs: traceFyBranch ? await page.evaluate(() => window.__fyStyleVmInputs || []) : null,
    fyStyleParentSteps: traceFyBranch ? await page.evaluate(() => window.__fyStyleParentSteps || []) : null,
    fyQu3Steps: traceFyBranch ? await page.evaluate(() => window.__fyQu3Steps || []) : null,
    fyXf0Writes: traceFyBranch ? await page.evaluate(() => window.__fyXf0Writes || []) : null,
    fySerialVxSteps: traceFyBranch ? await page.evaluate(() => window.__fySerialVxSteps || []) : null,
    fyXf1Steps: traceFyBranch ? await page.evaluate(() => window.__fyXf1Steps || []) : null,
    fyComputedStyleProfile: traceFyBranch ? await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      const allKeys = Object.keys(style);
      return {
        allKeys,
        nonEmpty: Object.fromEntries(allKeys.filter(key =>
          typeof style[key] === 'string' && style[key] !== '').map(key => [key, style[key]])),
        styleLength: style.length,
        cssText: style.cssText,
        prototypeDescriptors: Object.fromEntries(Object.getOwnPropertyNames(
          Object.getPrototypeOf(style)).map(key => {
          const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(style), key);
          return [key, { getter: typeof descriptor.get === 'function',
            setter: typeof descriptor.set === 'function',
            valueType: typeof descriptor.value, enumerable: descriptor.enumerable }];
        })),
      };
    }) : null,
    fyMr11Steps: traceFyBranch ? await page.evaluate(() => window.__fyMr11Steps || []) : null,
    fyC25Steps: traceFyBranch ? await page.evaluate(() => window.__fyC25Steps || []) : null,
    fyWindowDescriptorSnapshot: traceFyBranch ? await page.evaluate(() => window.__fyWindowDescriptorSnapshot) : null,
    fyPixelTrace: traceFyBranch ? await page.evaluate(() => window.__fyPixelTrace || []) : null,
    fyDgSteps: traceFyBranch ? await page.evaluate(() => window.__fyDgSteps || []) : null,
    fyDgWindowChecks: traceFyBranch ? await page.evaluate(() => window.__fyDgWindowChecks || []) : null,
    fyDgObjectChecks: traceFyBranch ? await page.evaluate(() => window.__fyDgObjectChecks || []) : null,
    fyDgStringChecks: traceFyBranch ? await page.evaluate(() => window.__fyDgStringChecks || []) : null,
    fyDgNavigatorChecks: traceFyBranch ? await page.evaluate(() => window.__fyDgNavigatorChecks || []) : null,
    fyDgLoadChecks: traceFyBranch ? await page.evaluate(() => window.__fyDgLoadChecks || []) : null,
    fyDgLoadKeyChecks: traceFyBranch ? await page.evaluate(() => window.__fyDgLoadKeyChecks || []) : null,
    fyDgFeatureChecks: traceFyBranch ? await page.evaluate(() => window.__fyDgFeatureChecks || []) : null,
    fyDgTopPropertyChecks: traceFyBranch ? await page.evaluate(() => window.__fyDgTopPropertyChecks || []) : null,
    fyDgElementChecks: traceFyBranch ? await page.evaluate(() => window.__fyDgElementChecks || []) : null,
    fyDgCase18Checks: traceFyBranch ? await page.evaluate(() => window.__fyDgCase18Checks || []) : null,
    fyDgReturns: traceFyBranch ? await page.evaluate(() => window.__fyDgReturns || []) : null,
    fyDgCalls: traceFyBranch ? await page.evaluate(() => window.__fyDgCalls || []) : null,
    fyDg13GateChecks: traceFyBranch ? await page.evaluate(() => window.__fyDg13GateChecks || []) : null,
    fyFeatureWrites: traceFyBranch ? await page.evaluate(() => window.__fyFeatureWrites || []) : null,
    fy115Writes: traceFyBranch ? await page.evaluate(() => window.__fy115Writes || []) : null,
    fy24Context: traceFyBranch ? await page.evaluate(() => window.__fy24Context || []) : null,
    fyMr22Steps: traceFyBranch ? await page.evaluate(() => window.__fyMr22Steps || []) : null,
    fyMr56Steps: traceFyBranch ? await page.evaluate(() => window.__fyMr56Steps || []) : null,
    fyMr3Steps: traceFyBranch ? await page.evaluate(() => window.__fyMr3Steps || []) : null,
    fyMr43Steps: traceFyBranch ? await page.evaluate(() => window.__fyMr43Steps || []) : null,
    fyMr43Writes: traceFyBranch ? await page.evaluate(() => window.__fyMr43Writes || []) : null,
    fyMr43Lookup: traceFyBranch ? await page.evaluate(() => window.__fyMr43Lookup || []) : null,
    fyQzCalls: traceFyBranch ? await page.evaluate(() => window.__fyQzCalls || []) : null,
    fyQzSteps: traceFyBranch ? await page.evaluate(() => window.__fyQzSteps || []) : null,
    fyQz5Steps: traceFyBranch ? await page.evaluate(() => window.__fyQz5Steps || []) : null,
    fyCryptoRandom: traceFyBranch ? await page.evaluate(() => window.__fyCryptoRandom || []) : null,
    fyJCalls: traceFyBranch ? await page.evaluate(() => window.__fyJCalls || []) : null,
    fyJSteps: traceFyBranch ? await page.evaluate(() => window.__fyJSteps || []) : null,
    fyJInvoke: traceFyBranch ? await page.evaluate(() => window.__fyJInvoke || []) : null,
    fyVx7Steps: traceFyBranch ? await page.evaluate(() => window.__fyVx7Steps || []) : null,
    fyVx7InnerSteps: traceFyBranch ? await page.evaluate(() => window.__fyVx7InnerSteps || []) : null,
    fyVx7Writes: traceFyBranch ? await page.evaluate(() => window.__fyVx7Writes || []) : null,
    fyMr22Gate: traceFyBranch ? await page.evaluate(() => window.__fyMr22Gate || []) : null,
    fyDg13WCall: traceFyBranch ? await page.evaluate(() => window.__fyDg13WCall || []) : null,
    fyDg14Gate: traceFyBranch ? await page.evaluate(() => window.__fyDg14Gate || []) : null,
    fyBuilderTrace: traceFyBranch ? await page.evaluate(() => window.__fyBuilderTrace || []) : null,
    fyEbSteps: traceFyBranch ? await page.evaluate(() => window.__fyEbSteps || []) : null,
    fyEbCallTrace: traceFyBranch ? await page.evaluate(() => window.__fyEbCallTrace || []) : null,
    fyMr47Steps: traceFyBranch ? await page.evaluate(() => window.__fyMr47Steps || []) : null,
    fyMr16Steps: traceFyBranch ? await page.evaluate(() => window.__fyMr16Steps || []) : null,
    fyMr47Loop: traceFyBranch ? await page.evaluate(() => window.__fyMr47Loop || []) : null,
    fyMr47D6Writes: traceFyBranch ? await page.evaluate(() => window.__fyMr47D6Writes || []) : null,
    fyMr47Writes: traceFyBranch ? await page.evaluate(() => window.__fyMr47Writes || []) : null,
    fyMrCalls: traceFyBranch ? await page.evaluate(() => window.__fyMrCalls || []) : null,
    fyListenerRegistrations: traceFyBranch
      ? await page.evaluate(() => window.__fyListenerRegistrations || []) : null,
    fySerializerCalls: traceFyBranch ? await page.evaluate(() => window.__fySerializerCalls || []) : null,
    dssResponses: traceFyBranch ? await Promise.all(dssResponses) : null,
    dssResourceEntries: traceFyBranch ? await page.evaluate(() =>
      performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('.tdum.alibaba.com/dss.js'))
        .map(entry => entry.toJSON())) : null,
    fyResourceQueries: traceFyBranch ? await page.evaluate(() => window.__fyResourceQueries || []) : null,
    fyEvalSnapshot: probeFy ? await page.evaluate(() => window.__fyEvalSnapshot || null) : null,
    fyEvalWindowNames: probeFy ? await page.evaluate(() => window.__fyEvalWindowNames || null) : null,
    etAssetStats,
    etSourceBody,
    etInitReadyState: await page.evaluate(() => window.__etInitReadyState || null),
    etSignSource: await page.evaluate(() => window.__etOriginalSource || null),
    page: profile,
    calls: await page.evaluate(() => window.__x5Calls),
    events: await page.evaluate(() => window.__x5Events),
    environment: await page.evaluate(() => ({
      ...(TRACE_ET_VM ? {} : window.__x5Environment),
      initCommands: window.__ppVmInitCalls || [],
      startup: window.__x5Startup || null,
      awscInner: (() => {
        const value = window.AWSCInner;
        return { type: typeof value, keys: value ? Object.getOwnPropertyNames(value).slice(0, 50) : [],
          entries: value ? Object.getOwnPropertyNames(value).slice(0, 50)
            .map((key) => ({ key, type: typeof value[key] })) : [] };
      })(),
    })),
    etBreakpoints,
    etM23Returns,
    etScTraceGzip: await page.evaluate(async () => {
      const values = new Uint32Array(window.__etVmScTrace || []);
      const stream = new Blob([values.buffer]).stream().pipeThrough(new CompressionStream('gzip'));
      const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
      let encoded = '';
      for (let index = 0; index < compressed.length; index += 8192) {
        encoded += String.fromCharCode(...compressed.slice(index, index + 8192));
      }
      return btoa(encoded);
    }),
    etPcTraceGzip: await page.evaluate(async () => {
      const values = new Uint32Array(window.__etTargetTrace?.__etPcTrace || window.__etPcTrace || []);
      const stream = new Blob([values.buffer]).stream().pipeThrough(new CompressionStream('gzip'));
      const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
      let encoded = '';
      for (let index = 0; index < compressed.length; index += 8192) {
        encoded += String.fromCharCode(...compressed.slice(index, index + 8192));
      }
      return btoa(encoded);
    }),
    etInitPcTraceGzip: await page.evaluate(async () => {
      const values = new Uint32Array(window.__etInitPcTrace || []);
      const stream = new Blob([values.buffer]).stream().pipeThrough(new CompressionStream('gzip'));
      const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
      let encoded = '';
      for (let index = 0; index < compressed.length; index += 8192) {
        encoded += String.fromCharCode(...compressed.slice(index, index + 8192));
      }
      return btoa(encoded);
    }),
    etPcMetadata: await page.evaluate(() => window.__etTargetTrace?.__etPcMetadata || window.__etPcMetadata || []),
    etInitPcMetadata: await page.evaluate(() => window.__etInitPcMetadata || []),
    etEncodeSteps: await page.evaluate(() => window.__etTargetTrace?.__etEncodeSteps || window.__etEncodeSteps || []),
    etRoundStates: await page.evaluate(() => window.__etTargetTrace?.__etRoundStates || window.__etRoundStates || []),
    etBeforeRounds: await page.evaluate(() => window.__etTargetTrace?.__etBeforeRounds || window.__etBeforeRounds || []),
    etJeLengths: await page.evaluate(() => window.__etTargetTrace?.__etJeLengths || window.__etJeLengths || []),
    etCallInputs: await page.evaluate(() => window.__etTargetTrace?.__etCallInputs || window.__etCallInputs || []),
    etJ166Trace: await page.evaluate(() => window.__etTargetTrace?.__etJ166Trace || window.__etJ166Trace || []),
    etCa166Trace: await page.evaluate(() => window.__etTargetTrace?.__etCa166Trace || window.__etCa166Trace || []),
    etCallFingerprint: await page.evaluate(() => window.__etCallFingerprint || null),
    etCallDocumentHooks: await page.evaluate(() => window.__etCallDocumentHooks || null),
    etWWriteTrace: await page.evaluate(() => window.__etWWriteTrace || []),
    etW61Trace: await page.evaluate(() => window.__etW61Trace || []),
    etW147Trace: await page.evaluate(() => window.__etW147Trace || []),
    etW147Inputs: await page.evaluate(() => window.__etW147Inputs || []),
    etM12Inputs: await page.evaluate(() => window.__etM12Inputs || []),
    etM12PcCalls: await page.evaluate(() => window.__etM12PcCalls || []),
    etM12Regex: await page.evaluate(() => window.__etM12Regex || []),
    etM14Inputs: await page.evaluate(() => window.__etM14Inputs || []),
    nonceEarlyCalls: await page.evaluate(() => window.__nonceEarlyCalls || []),
    nonceEarlyAssignments: await page.evaluate(() => window.__nonceEarlyAssignments || []),
    nonceEntrySourceBody,
    nonceAssetStats,
    nonceStateBeforeAsset,
    nonceRandomAll: await page.evaluate(() => window.__nonceRandomAll || []),
    nonceRandomCheckpoints: await page.evaluate(() => window.__nonceRandomCheckpoints || []),
    nonceGtTrace: await page.evaluate(() => window.__nonceGtTrace || []),
    nonceLtTrace: await page.evaluate(() => window.__nonceLtTrace || []),
    nonceMtTrace: await page.evaluate(() => window.__nonceMtTrace || []),
    nonceTtTrace: await page.evaluate(() => window.__nonceTtTrace || []),
    nonceDispatchTrace: await page.evaluate(() => window.__nonceDispatchTrace || []),
    nonceJnTrace: await page.evaluate(() => window.__nonceJnTrace || []),
    nonceMemoryBefore: await page.evaluate(() => window.__nonceMemoryBefore || null),
    nonceMemoryAfter: await page.evaluate(() => window.__nonceMemoryAfter || null),
    nonceRegistrationTrace: await page.evaluate(() => window.__nonceRegistrationTrace || []),
    nonceBranchProbe: await page.evaluate(() => window.__nonceBranchProbe || null),
    nonceYrProbe: await page.evaluate(() => window.__nonceYrProbe || null),
    nonceLoopProbe: await page.evaluate(() => window.__nonceLoopProbe || null),
    nonceLoopProbes: await page.evaluate(() => window.__nonceLoopProbes || []),
    nonceResourceGateTrace: await page.evaluate(() => window.__nonceResourceGateTrace || []),
    nonceWorkerMessages: await page.evaluate(() => window.__nonceWorkerMessages || []),
    nonceWorkerEvents: await page.evaluate(() => window.__nonceWorkerEvents || []),
    nonceErProbe: await page.evaluate(() => window.__nonceErProbe ?? null),
    nonceMrProbe: await page.evaluate(() => window.__nonceMrProbe || []),
    nonceRtcCalls: await page.evaluate(() => window.__nonceRtcCalls || []),
    nonceIceEvents: await page.evaluate(() => window.__nonceIceEvents || []),
    nonceImageLoads: await page.evaluate(() => window.__nonceImageLoads || []),
    nonceDigestTrace: await page.evaluate(() => window.__nonceDigestTrace || []),
    nonceCanvas2d: await page.evaluate(() => window.__x5Environment?.canvas2d || []),
    nonceWorkerInput: traceNonceGt ? await page.evaluate(() => document.head.__SECAPT__ || null) : null,
    nonceEnvironmentBeforeInit: await page.evaluate(() => window.__nonceEnvironmentBeforeInit || null),
    nonceStateBeforeInit: await page.evaluate(() => window.__nonceStateBeforeInit || null),
    nonceResourceEntries: await page.evaluate(() => window.__nonceResourceEntries || []),
    etEnvironmentSnapshot: await page.evaluate(() => window.__etEnvironmentSnapshot || null),
    etValueTrace: await page.evaluate(() => window.__etTargetTrace?.__etValueTrace || window.__etValueTrace || []),
    etSeedTrace: await page.evaluate(() => window.__etTargetTrace?.__etSeedTrace || window.__etSeedTrace || []),
    etVmState: await page.evaluate(() => window.__etVmState || null),
    etVmDivergence: await page.evaluate(() => window.__etVmDivergence || []),
    etVmFlags: await page.evaluate(() => window.__etVmFlags || []),
    etReturnTrace: await page.evaluate(() => window.__etReturnTrace || []),
    etBranchTrace: await page.evaluate(() => window.__etBranchTrace || []),
    etCaTrace: await page.evaluate(() => window.__etCaTrace || []),
    etAaTrace: await page.evaluate(() => window.__etAaTrace || []),
    etStartupFingerprint: await page.evaluate(() => window.__etStartupFingerprint || null),
    etWTrace: await page.evaluate(() => window.__etWTrace || []),
    etW89Trace: await page.evaluate(() => window.__etW89Trace || []),
    etW28Trace: await page.evaluate(() => window.__etW28Trace || []),
    etHashInputs: await page.evaluate(() => window.__etHashInputs || []),
    etEnvironmentChecks: await page.evaluate(() => window.__etEnvironmentChecks || []),
    etHashLoop2: await page.evaluate(() => window.__etHashLoop2 || []),
    etInitProbe: await page.evaluate(() => window.__etInitProbe || []),
    etInitCookie: await page.evaluate(() => window.__etInitCookie || null),
    etAwscCalls: await page.evaluate(() => window.__etAwscCalls || []),
    etArithmeticProbe: await page.evaluate(() => window.__etArithmeticProbe || []),
    etPayloadBytes: await page.evaluate(() => window.__etPayloadBytes || null),
    verifyRequests: await Promise.all(verifyRequests),
  };
  const gzip = await page.evaluate(async (value) => {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    let encoded = '';
    for (let index = 0; index < compressed.length; index += 8192) {
      encoded += String.fromCharCode(...compressed.slice(index, index + 8192));
    }
    return btoa(encoded);
  }, capture);
  return { gzip };
}
