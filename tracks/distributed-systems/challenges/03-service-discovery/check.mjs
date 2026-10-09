import { check, expect, expectEqual, fromSandbox, watchdog } from '../../../../lib/checks.mjs';

watchdog();
const { createRegistry, createClient } = await fromSandbox('./registry.js');

const setup = () => {
  const clock = { t: 1_000_000 };
  const registry = createRegistry({ ttlMs: 1000, now: () => clock.t });
  return { clock, registry };
};
const ids = (list) => (list ?? []).map((i) => i.id).sort();
const a = { id: 'pay-1', url: 'http://10.0.0.1:8080' };
const b = { id: 'pay-2', url: 'http://10.0.0.2:8080' };

await check('register + lookup returns the instances as { id, url }', () => {
  const { registry } = setup();
  registry.register('payments', a);
  registry.register('payments', b);
  expectEqual((registry.lookup('payments') ?? []).map(({ id, url }) => ({ id, url })).sort((x, y) => x.id.localeCompare(y.id)), [a, b]);
});

await check('services are kept apart, and an unknown service has no instances', () => {
  const { registry } = setup();
  registry.register('payments', a);
  registry.register('search', { id: 's-1', url: 'http://10.0.1.1' });
  expectEqual(ids(registry.lookup('search')), ['s-1']);
  expectEqual(registry.lookup('nope'), []);
});

await check('registering the same id twice does not duplicate it', () => {
  const { registry } = setup();
  registry.register('payments', a);
  registry.register('payments', { ...a, url: 'http://10.0.0.9:8080' });
  const list = registry.lookup('payments');
  expect(list.length === 1 && list[0].url === 'http://10.0.0.9:8080', `got ${JSON.stringify(list)}`);
});

await check('an instance with no heartbeat for longer than the TTL disappears', () => {
  const { clock, registry } = setup();
  registry.register('payments', a);
  clock.t += 1000;
  expectEqual(ids(registry.lookup('payments')), ['pay-1'], 'at exactly the TTL: ');
  clock.t += 1;
  expectEqual(ids(registry.lookup('payments')), [], 'after the TTL: ');
});

await check('heartbeats keep an instance alive', () => {
  const { clock, registry } = setup();
  registry.register('payments', a);
  registry.register('payments', b);
  for (let i = 0; i < 5; i += 1) {
    clock.t += 600;
    expect(registry.heartbeat('payments', 'pay-1') === true, 'heartbeat for a live instance should return true');
  }
  expectEqual(ids(registry.lookup('payments')), ['pay-1'], 'only the instance that kept heart-beating: ');
});

await check('heartbeat returns false for an unknown or expired instance (so it re-registers)', () => {
  const { clock, registry } = setup();
  expect(registry.heartbeat('payments', 'ghost') === false, 'unknown instance');
  registry.register('payments', a);
  expect(registry.heartbeat('payments', 'pay-1') === true, 'heartbeat for a live instance should return true');
  clock.t += 5000;
  expect(registry.heartbeat('payments', 'pay-1') === false, 'an expired instance must not be revived by a heartbeat');
  expectEqual(registry.lookup('payments'), []);
});

await check('deregister removes an instance immediately', () => {
  const { registry } = setup();
  registry.register('payments', a);
  registry.register('payments', b);
  registry.deregister('payments', 'pay-1');
  expectEqual(ids(registry.lookup('payments')), ['pay-2']);
});

await check('client.pick round-robins over live instances', () => {
  const { registry } = setup();
  registry.register('payments', a);
  registry.register('payments', b);
  const client = createClient(registry);
  const picks = [1, 2, 3, 4].map(() => client.pick('payments'));
  expect(new Set(picks).size === 2 && picks[0] === picks[2] && picks[1] === picks[3] && picks[0] !== picks[1],
    `picks: ${picks}`);
});

await check('client.pick skips dead instances and throws when none are left', () => {
  const { clock, registry } = setup();
  registry.register('payments', a);
  registry.register('payments', b);
  const client = createClient(registry);
  clock.t += 800;
  registry.heartbeat('payments', 'pay-2');
  clock.t += 800; // pay-1 is now expired
  expect([1, 2, 3].every(() => client.pick('payments') === b.url), 'picked an expired instance');
  clock.t += 2000;
  let threw = false;
  try { client.pick('payments'); } catch { threw = true; }
  expect(threw, 'pick should throw when there are no live instances');
});
