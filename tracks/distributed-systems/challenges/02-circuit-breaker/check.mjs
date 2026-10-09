import { check, expect, fromSandbox, watchdog } from '../../../../lib/checks.mjs';

watchdog();
const { CircuitBreaker, CircuitOpenError } = await fromSandbox('./breaker.js');
const { createFlakyService } = await fromSandbox('./flaky-service.js');

const setup = (opts = {}) => {
  const clock = { t: 1_000_000 };
  const svc = createFlakyService({ latencyMs: opts.latencyMs ?? 1 });
  const breaker = new CircuitBreaker((x) => svc.call(x), {
    failureThreshold: 3, resetTimeoutMs: 1000, now: () => clock.t,
  });
  return { clock, svc, breaker };
};
const outcome = (p) => p.then(() => 'ok', (e) => (e?.code === 'CIRCUIT_OPEN' ? 'open' : 'error'));
const trip = async ({ svc, breaker }) => { svc.mode = 'down'; for (let i = 0; i < 3; i += 1) await outcome(breaker.call(i)); };

await check('CLOSED: calls pass through and return the result', async () => {
  const { breaker } = setup();
  const res = await breaker.call('x');
  expect(res?.ok && res.input === 'x', `got ${JSON.stringify(res)}`);
  expect(breaker.state === 'CLOSED', `state is ${breaker.state}`);
});

await check('CLOSED: failures are passed back to the caller unchanged', async () => {
  const { svc, breaker } = setup();
  svc.mode = 'down';
  const err = await breaker.call(1).then(() => null, (e) => e);
  expect(err && /upstream failed/.test(err.message), `got ${err?.message}`);
});

await check('trips to OPEN after 3 consecutive failures', async () => {
  const s = setup();
  await trip(s);
  expect(s.breaker.state === 'OPEN', `state is ${s.breaker.state}`);
});

await check('a success resets the failure count (only consecutive failures trip it)', async () => {
  const { svc, breaker } = setup();
  for (const mode of ['down', 'down', 'up', 'down', 'down']) { svc.mode = mode; await outcome(breaker.call(1)); }
  expect(breaker.state === 'CLOSED', `state is ${breaker.state} after fail, fail, ok, fail, fail`);
});

await check('OPEN: fails fast with CircuitOpenError, without calling the service', async () => {
  const s = setup();
  await trip(s);
  const before = s.svc.calls;
  const err = await s.breaker.call(1).then(() => null, (e) => e);
  expect(err instanceof CircuitOpenError || err?.code === 'CIRCUIT_OPEN', `got ${err?.message ?? 'a success'}`);
  expect(s.svc.calls === before, 'the service was called while the circuit was open');
});

await check('OPEN: still open just before resetTimeoutMs', async () => {
  const s = setup();
  await trip(s);
  s.clock.t += 999;
  expect(await outcome(s.breaker.call(1)) === 'open', 'it let a call through too early');
});

await check('HALF_OPEN: after the timeout a trial call goes through; success closes the circuit', async () => {
  const s = setup();
  await trip(s);
  s.clock.t += 1000;
  s.svc.mode = 'up';
  const r = await outcome(s.breaker.call(1));
  expect(r === 'ok', `the trial call was ${r}`);
  expect(s.breaker.state === 'CLOSED', `state is ${s.breaker.state}`);
  expect(await outcome(s.breaker.call(2)) === 'ok', 'normal calls fail after closing');
});

await check('HALF_OPEN: a failed trial re-opens the circuit, with a fresh timeout', async () => {
  const s = setup();
  await trip(s);
  s.clock.t += 1000;
  expect(await outcome(s.breaker.call(1)) === 'error', 'the trial call should reach the (still broken) service');
  expect(s.breaker.state === 'OPEN', `state is ${s.breaker.state}`);
  s.clock.t += 500;
  const before = s.svc.calls;
  expect(await outcome(s.breaker.call(2)) === 'open' && s.svc.calls === before, 'the timeout should restart from the failed trial');
});

await check('HALF_OPEN: only ONE trial at a time; concurrent calls fail fast', async () => {
  const s = setup({ latencyMs: 30 });
  await trip(s);
  s.clock.t += 1000;
  s.svc.mode = 'up';
  const before = s.svc.calls;
  const results = await Promise.all([1, 2, 3].map((i) => outcome(s.breaker.call(i))));
  expect(s.svc.calls - before === 1, `${s.svc.calls - before} calls reached the service during HALF_OPEN`);
  expect(results.filter((r) => r === 'ok').length === 1 && results.filter((r) => r === 'open').length === 2,
    `results: ${results}`);
});
