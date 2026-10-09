// A downstream service you can break on purpose. Don't edit this file.
//   const svc = createFlakyService({ latencyMs: 10 });
//   svc.mode = 'down';   // every call fails (after latencyMs, like a timeout)
//   svc.mode = 'up';     // every call succeeds
//   svc.calls            // how many calls actually reached it
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function createFlakyService({ latencyMs = 10 } = {}) {
  return {
    mode: 'up',
    calls: 0,
    async call(input) {
      this.calls += 1;
      await sleep(latencyMs);
      if (this.mode === 'down') throw new Error('upstream failed (503)');
      return { ok: true, input };
    },
  };
}
