// Order helpers for the shop. This file started life as JavaScript and it
// shows: `npm run typecheck` rejects it. Give it real types (see README.md).

export function orderTotal(order) {
  let total = 0;
  for (const item of order.items) total += item.qty * item.unitPrice;
  return total;
}

export function first(items) {
  return items[0];
}

export function groupBy(items, keyOf) {
  const groups = {};
  for (const item of items) {
    const key = keyOf(item);
    (groups[key] ??= []).push(item);
  }
  return groups;
}
