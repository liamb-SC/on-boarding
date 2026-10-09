// One shard: a separate database server holding a slice of the orders. Don't edit this file.
// It counts the queries it serves, so you can see which shards a request touched.
export function createShard(name) {
  const orders = [];
  return {
    name,
    stats: { queries: 0 },
    async insert(order) { this.stats.queries += 1; orders.push({ ...order }); },
    async findByCustomer(customerId) { this.stats.queries += 1; return orders.filter((o) => o.customer_id === customerId); },
    async count() { this.stats.queries += 1; return orders.length; },
  };
}
