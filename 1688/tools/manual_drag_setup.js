async (page) => {
  const challenge = CHALLENGE_PAYLOAD;
  const sessionName = SESSION_PAYLOAD;
  const interceptVerify = INTERCEPT_PAYLOAD;
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
    const probe = 'for(i=r;;i++){if(i===5320&&typeof p[1]==="string")globalThis.__ppVmInitCalls.push(p[1]);if(i===4117&&globalThis.__ppVmCommand==="_$PS"&&globalThis.__ppVmTrack.length===0)globalThis.__ppVmTrack.push(String(f[4]));var g=4*i';
    if (!body.includes(needle)) throw new Error('处罚页 VM 版本不匹配');
    await route.fulfill({ response, body: body.replace(needle, probe) });
  });
  page.__manualDrag = { question: null, verify: null, verifyResponse: null,
    profile: null, interceptVerify };
  page.on('response', (response) => {
    if (!response.url().includes('/_____tmd_____/newslidecaptcha')) return;
    page.__manualDrag.questionPromise = response.json().then((value) => {
      page.__manualDrag.question = value;
    }).catch(() => {});
  });
  const captureVerify = async (request) => {
    if (!page.__manualDrag.verify) {
      const headers = await request.allHeaders();
      const browser = await page.evaluate(() => ({
        events: window.__manualEvents || [],
        ppCalls: window.__ppVmCalls || [],
        ppTrack: window.__ppVmTrack?.[0] || null,
        umidStorage: localStorage.getItem('lswucn'),
        cookie: document.cookie,
      }));
      page.__manualDrag.verify = { url: request.url(), headers, ...browser };
      await page.screenshot({ path: `.playwright-cli/manual_drag_at_release_${sessionName}.png` });
    }
  };
  if (interceptVerify) {
    await page.route('**/_____tmd_____/newslidevalidate?**', async (route) => {
      await captureVerify(route.request());
      // 不提交浏览器生成的签名，让同一挑战留给本地请求。
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ code: 300, dt: 'success', ec: 200,
          result: { code: 300, sig: 'from bx' }, success: true }) });
    });
  } else {
    page.on('request', (request) => {
      if (request.url().includes('/_____tmd_____/newslidevalidate'))
        page.__manualDrag.verifyPromise = captureVerify(request);
    });
    page.on('response', (response) => {
      if (!response.url().includes('/_____tmd_____/newslidevalidate')) return;
      page.__manualDrag.verifyResponsePromise = response.json().then(async (body) => {
        const headers = await response.allHeaders();
        page.__manualDrag.verifyResponse = { body, x5secIssued: Boolean(headers['bx-x5sec']) };
      }).catch(() => {});
    });
  }
  await page.goto(challenge.url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window._config_?.ppModule &&
    typeof crypto.randemUUID === 'function' &&
    typeof window._config_?.ppSign === 'string' &&
    window.__ppVmInitCalls?.includes('_$SO') &&
    document.querySelector('.scratch-captcha-slider .button'), undefined,
    { timeout: 30000 });
  await page.waitForTimeout(300);
  page.__manualDrag.profile = await page.evaluate(() => ({
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
    umidStorage: localStorage.getItem('lswucn'),
    sliderRect: document.querySelector('.scratch-captcha-slider')
      ?.getBoundingClientRect().toJSON(),
  }));
  page.__manualDrag.initCommands = await page.evaluate(() => window.__ppVmInitCalls.slice());
  await page.evaluate(() => {
    window.__manualEvents = [];
    window.__ppVmCalls = [];
    const original = crypto.randemUUID;
    crypto.randemUUID = function (...args) {
      window.__ppVmCommand = args[1];
      const event = args[0] instanceof Event ? args[0] : null;
      window.__ppVmCalls.push({ command: args[1], event: event && {
        type: event.type, x: event.clientX, y: event.clientY,
        timeStamp: event.timeStamp, buttons: event.buttons,
        targetTag: event.target?.tagName,
        targetClass: String(event.target?.className || ''),
        targetRect: event.target?.getBoundingClientRect?.().toJSON(),
        currentTargetTag: event.currentTarget?.tagName,
      } });
      return original.apply(this, args);
    };
    for (const type of ['mousedown', 'mousemove', 'mouseup']) {
      document.addEventListener(type, (event) => {
        if (window.__manualEvents.length >= 5000) return;
        const target = event.target;
        window.__manualEvents.push({
          type, x: event.clientX, y: event.clientY,
          screenX: event.screenX, screenY: event.screenY,
          timeStamp: event.timeStamp, buttons: event.buttons,
          props: Object.fromEntries([
            'offsetX', 'offsetY', 'layerX', 'layerY', 'movementX', 'movementY',
            'pageX', 'pageY', 'x', 'y', 'which', 'detail',
          ].map((name) => [name, event[name]])),
          target: { tag: target?.tagName, id: target?.id,
            className: String(target?.className || ''),
            rect: target?.getBoundingClientRect?.().toJSON() },
        });
      }, true);
    }
  });
  return { ready: true, action: challenge.action,
    buttonVisible: await page.locator('.scratch-captcha-slider .button').isVisible() };
}
