async (page) => {
  const state = page.__manualDrag;
  if (!state) return { ready: false };
  if (state.questionPromise) await state.questionPromise;
  if (state.verifyPromise) await state.verifyPromise;
  if (state.verify && !state.interceptVerify && !state.verifyResponsePromise)
    await page.waitForTimeout(1000);
  if (state.verifyResponsePromise) await state.verifyResponsePromise;
  if (!state.verify) return {
    ready: true, captured: false,
    eventCount: await page.evaluate(() => window.__manualEvents?.length || 0),
  };
  const capture = {
    profile: state.profile,
    initCommands: state.initCommands,
    question: state.question,
    verify: state.verify,
    verifyResponse: state.verifyResponse,
  };
  const gzip = await page.evaluate(async (value) => {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    let encoded = '';
    for (let index = 0; index < compressed.length; index += 8192)
      encoded += String.fromCharCode(...compressed.slice(index, index + 8192));
    return btoa(encoded);
  }, capture);
  return { ready: true, captured: true, gzip };
}
