import { checkout } from './checkout.js';

const pause = () => new Promise((resolve) => setTimeout(resolve, Math.random() * 5));
const catalog = { mug: { sku: 'mug', price: 8, qty: 1 }, tee: { sku: 'tee', price: 20, qty: 1 } };

// Two customers check out at the same time.
const [ada, linus] = await Promise.all([
  checkout([catalog.mug, catalog.mug], { pause }),
  checkout([catalog.tee], { discountPct: 50, pause }),
]);
console.log('ada pays', ada, '(expected 16)');
console.log('linus pays', linus, '(expected 10)');
console.log('the catalog now says a mug costs', catalog.mug.price, '(expected 8)');
