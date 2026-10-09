// One request: build a cart item by item (with a little async work between
// each, like a stock check), then return the total.
import { addItem, applyDiscount, newCart, total } from './cart.js';

export async function checkout(items, { discountPct = 0, pause }) {
  let cart = newCart();
  for (const item of items) {
    await pause();
    cart = addItem(cart, item);
  }
  if (discountPct) cart = applyDiscount(cart, discountPct);
  return total(cart);
}
