// Part 2: when one database server isn't enough, split the orders across N
// shards by customer_id, so one customer's orders all live together.

// Map a customer id to a shard number in [0, shardCount). It must be
// deterministic, and it must spread customers evenly. Hash the id: don't
// just use ranges of ids.
export function shardFor(customerId, shardCount) {
  return 0; // TODO
}

export function createShardedStore(shards) {
  return {
    // TODO: write the order to the shard that owns its customer_id
    async insert(order) {
      return shards[0].insert(order);
    },
    // TODO: one customer's orders must touch only ONE shard
    async ordersForCustomer(customerId) {
      return shards[0].findByCustomer(customerId);
    },
    // TODO: a global count has to ask EVERY shard (scatter-gather) and add up the answers
    async countAll() {
      return shards[0].count();
    },
  };
}
