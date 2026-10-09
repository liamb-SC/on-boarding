// Single-table design: every entity lives in ONE table. You choose the keys so
// that each access pattern below is a single Query.
//
// Table keys: PK (partition key), SK (sort key)
// One GSI:    GSI1PK, GSI1SK  (only add these to items that need them)

// Turn each entity into a table item: copy the entity's fields, then add the keys.
export function customerItem(customer) {
  return { ...customer, PK: '', SK: '' }; // TODO
}

export function orderItem(order) {
  return { ...order, PK: '', SK: '' }; // TODO (and maybe GSI1PK / GSI1SK)
}

export function lineItemItem(lineItem) {
  return { ...lineItem, PK: '', SK: '' }; // TODO
}

// Access patterns. Each one returns the parameters of ONE query:
//   { pk, skBeginsWith?, index?: 'GSI1', forward?: false }
export const queries = {
  // 1. A customer's profile (just the profile item)
  getCustomer: (customerId) => ({ pk: '' }),

  // 2. A customer's orders, NEWEST first (not the profile, not line items)
  ordersForCustomer: (customerId) => ({ pk: '' }),

  // 3. The line items of one order
  lineItemsForOrder: (orderId) => ({ pk: '' }),

  // 4. All orders with a given status, OLDEST first (an ops dashboard)
  ordersByStatus: (status) => ({ pk: '' }),
};
