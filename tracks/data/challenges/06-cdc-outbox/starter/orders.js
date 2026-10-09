// The write side: change orders AND record what happened in the outbox, atomically.

// Insert the order, plus an outbox row:
//   type 'OrderPlaced', aggregate_id = order id, payload = JSON { id, customer, total }
export function placeOrder(db, { id, customer, total }) {
  // TODO: do both writes in one db.tx(...)
  db.run('INSERT INTO orders (id, customer, total) VALUES (?, ?, ?)', [id, customer, total]);
}

// Set the status to 'cancelled', plus an outbox row:
//   type 'OrderCancelled', aggregate_id = order id, payload = JSON { id, customer, total }
export function cancelOrder(db, id) {
  // TODO
}
