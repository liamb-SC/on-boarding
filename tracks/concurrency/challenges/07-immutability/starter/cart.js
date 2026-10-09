// Shopping cart helpers, used by many concurrent requests.
// A cart looks like: { items: [{ sku, price, qty }], discountPct }

export const EMPTY_CART = { items: [], discountPct: 0 };

// A fresh cart for a new request.
export function newCart() {
  return EMPTY_CART;
}

// Returns the cart with `item` added.
export function addItem(cart, item) {
  cart.items.push(item);
  return cart;
}

// Returns the cart with every price reduced by `pct` percent.
export function applyDiscount(cart, pct) {
  cart.discountPct = pct;
  for (const item of cart.items) item.price = item.price * (1 - pct / 100);
  return cart;
}

export function total(cart) {
  return cart.items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

// Freeze obj and everything inside it (nested objects and arrays), and return obj.
export function deepFreeze(obj) {
  throw new Error('TODO: deepFreeze');
}
