import { check, expect, expectEqual, fromSandbox, watchdog } from '../../../../lib/checks.mjs';
import { within, yielder } from '../../sched.mjs';

watchdog(30000);
const cart = await fromSandbox('./cart.js');
const { checkout } = await fromSandbox('./checkout.js');

// Deep-freeze with our own helper so a mutation throws (ES modules are strict mode).
const freeze = (o) => {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(freeze); }
  return o;
};
const snapshot = (o) => JSON.stringify(o);
const cents = (n) => Math.round(n * 100) / 100; // ignore floating-point dust
const sample = () => ({ items: [{ sku: 'mug', price: 8, qty: 2 }, { sku: 'tee', price: 20, qty: 1 }], discountPct: 0 });

await check('deepFreeze freezes the object, nested objects and arrays, and returns it', () => {
  const o = { a: { b: { c: 1 } }, list: [{ x: 1 }, [2]], n: null, s: 'str' };
  const r = cart.deepFreeze(o);
  expect(r === o, 'return the same object');
  for (const [name, v] of [['the object', o], ['a nested object', o.a.b], ['an array', o.list], ['an object in an array', o.list[0]], ['an array in an array', o.list[1]]]) {
    expect(Object.isFrozen(v), `${name} is not frozen`);
  }
});

await check('EMPTY_CART is deeply frozen', () => {
  expect(Object.isFrozen(cart.EMPTY_CART), 'EMPTY_CART is not frozen');
  expect(Object.isFrozen(cart.EMPTY_CART.items), 'EMPTY_CART.items is not frozen');
});

await check('addItem returns a new cart and leaves the old one untouched', () => {
  const before = freeze(sample());
  const was = snapshot(before);
  const item = freeze({ sku: 'cap', price: 12, qty: 1 });
  const after = cart.addItem(before, item);
  expect(after !== before, 'it returned the same object');
  expectEqual(snapshot(before), was, 'the old cart changed: ');
  expectEqual(after.items.map((i) => i.sku), ['mug', 'tee', 'cap'], 'new cart items: ');
});

await check('applyDiscount returns a new cart with new items, and leaves the old ones untouched', () => {
  const before = freeze(sample());
  const was = snapshot(before);
  const after = cart.applyDiscount(before, 25);
  expect(after !== before && after.items !== before.items, 'return a new cart with a new items array');
  expectEqual(snapshot(before), was, 'the old cart changed: ');
  expectEqual(after.items.map((i) => cents(i.price)), [6, 15], 'discounted prices: ');
  expectEqual(after.discountPct, 25, 'discountPct: ');
  expectEqual(cents(cart.total(after)), 27, 'total: ');
});

await check('newCart() gives an empty cart, and it still works when frozen', () => {
  const c = cart.newCart();
  expectEqual(c, { items: [], discountPct: 0 });
  expectEqual(cart.addItem(c, { sku: 'mug', price: 8, qty: 1 }).items.length, 1);
  expectEqual(cart.newCart().items.length, 0, 'the next newCart(): ');
});

await check('concurrent checkouts never see each other\'s items (20 interleavings)', async () => {
  for (let seed = 1; seed <= 20; seed++) {
    const pause = yielder(seed);
    const catalog = freeze({ mug: { sku: 'mug', price: 8, qty: 1 }, tee: { sku: 'tee', price: 20, qty: 1 }, cap: { sku: 'cap', price: 12, qty: 2 } });
    const totals = await within(3000, Promise.all([
      checkout([catalog.mug, catalog.mug], { pause }),
      checkout([catalog.tee], { discountPct: 50, pause }),
      checkout([catalog.cap, catalog.mug, catalog.tee], { pause }),
      checkout([catalog.tee, catalog.cap], { discountPct: 10, pause }),
    ]), 'the checkouts');
    expectEqual(totals.map(cents), [16, 10, 52, 39.6], `seed ${seed}: totals `);
  }
});
