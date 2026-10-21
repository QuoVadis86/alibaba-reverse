async (page) => {
  const challenge = CHALLENGE_PAYLOAD;
  await page.context().clearCookies();
  await page.context().addCookies(challenge.cookies);
  await page.unrouteAll();
  await page.addInitScript(() => {
    window.__ppVmInitCalls = [];
    window.__ppVmTrack = [];
    window.__ppVmCommand = '';
  });
  await page.route('**/_____tmd_____/punish?**', async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    const needle = 'for(i=r;;i++){var g=4*i';
    const replacement = 'for(i=r;;i++){if(i===5320&&typeof p[1]==="string")globalThis.__ppVmInitCalls.push(p[1]);if(i===4117&&globalThis.__ppVmCommand==="_$PS"&&globalThis.__ppVmTrack.length===0)globalThis.__ppVmTrack.push(String(f[4]));var g=4*i';
    if (!body.includes(needle)) throw new Error('处罚页 VM 版本不匹配');
    await route.fulfill({ response, body: body.replace(needle, replacement) });
  });
  await page.goto(challenge.url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window._config_?.ppModule &&
    typeof crypto.randemUUID === 'function' &&
    document.getElementsByClassName('scratch-captcha-slider').length > 0 &&
    window.__ppVmInitCalls?.includes('_$SO'));
  await page.waitForTimeout(300);
  const initCalls = await page.evaluate(() => window.__ppVmInitCalls.slice());
  const profile = await page.evaluate(() => ({
    url: location.href,
    token: window._config_?.NCTOKENSTR,
    appKey: window._config_?.NCAPPKEY,
    x5secdata: window._config_?.SECDATA,
    host: window._config_?.HOST,
    path: window._config_?.PATH,
    action: window._config_?.action,
    pp: window._config_?.pp,
    ppSign: window._config_?.ppSign,
    ppt: window._config_?.ppt,
    cookie: document.cookie,
    referrer: document.referrer,
    title: document.title,
    userAgent: navigator.userAgent,
    sliderRect: document.getElementsByClassName('scratch-captcha-slider')[0]
      ?.getBoundingClientRect().toJSON(),
  }));
  await page.evaluate(() => {
    window.__ppVmCalls = [];
    window.__ppVmWrites = [];
    window.__ppVmModuleCalls = [];
    const module = window._config_?.ppModule;
    for (const name of ['stringToNewUTF8', '_pp', '_UTF8ToString', 'UTF8ToString', '_free']) {
      if (typeof module?.[name] !== 'function') continue;
      const original = module[name];
      module[name] = function (...args) {
        const result = original.apply(this, args);
        window.__ppVmModuleCalls.push({ name, args, result });
        return result;
      };
    }
    const original = crypto.randemUUID;
    crypto.randemUUID = function (...args) {
      const event = args[0] instanceof Event ? args[0] : null;
      window.__ppVmCommand = args[1];
      window.__ppVmCalls.push({ command: args[1], event: event && {
        type: event.type,
        x: event.clientX,
        y: event.clientY,
        timeStamp: event.timeStamp,
        buttons: event.buttons,
        targetTag: event.target?.tagName,
        targetClass: String(event.target?.className || ''),
        targetRect: event.target?.getBoundingClientRect?.().toJSON(),
        currentTargetTag: event.currentTarget?.tagName,
      } });
      return original.apply(this, args);
    };
    const descriptor = Object.getOwnPropertyDescriptor(window._config_, 'ppSign') ||
      { value: window._config_.ppSign };
    let current = descriptor.value;
    Object.defineProperty(window._config_, 'ppSign', {
      configurable: true,
      enumerable: true,
      get() { return descriptor.get ? descriptor.get() : current; },
      set(value) {
        window.__ppVmWrites.push(value);
        if (descriptor.set) descriptor.set(value);
        else current = value;
      },
    });
  });
  const verifyRequests = [];
  page.on('request', (request) => {
    if (request.url().includes('/_____tmd_____/newslidevalidate')) {
      verifyRequests.push(request.allHeaders().then((headers) => ({
        pp: headers['bx-pp'],
      })));
    }
  });
  const box = await page.locator('.scratch-captcha-slider .button').boundingBox();
  if (!box) throw new Error('滑块按钮不可用');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let step = 1; step <= 16; step++) {
    await page.mouse.move(x + step * 10, y, { steps: 2 });
  }
  await page.mouse.up();
  await page.waitForTimeout(800);
  return {
    page: profile,
    initCommands: initCalls,
    dragCalls: await page.evaluate(() => window.__ppVmCalls),
    track: await page.evaluate(() => window.__ppVmTrack[0]),
    writes: await page.evaluate(() => window.__ppVmWrites),
    moduleCalls: await page.evaluate(() => window.__ppVmModuleCalls),
    verifyRequests: await Promise.all(verifyRequests),
  };
}
