// A simulated database cluster: one primary and N read replicas. Don't edit this file.
//
// Every write to the primary gets a log sequence number (LSN). Replicas copy the
// log asynchronously, so they lag behind. Here that lag is under your control:
// nothing reaches the replicas until you call cluster.replicate().
//
//   const cluster = createCluster({ replicas: 2 });
//   const lsn = await cluster.primary.write('k', 'v'); // -> 1, 2, 3...
//   await cluster.replicas[0].read('k');               // undefined: not replicated yet
//   cluster.replicate();                               // every replica catches up
//   cluster.replicate({ only: 0 });                    // just replicas[0] catches up
//   cluster.replicas[0].appliedLsn;                    // how far this replica has got
//   node.stats                                          // { reads, writes }
function createNode(name) {
  const data = new Map();
  return {
    name,
    data,
    appliedLsn: 0,
    stats: { reads: 0, writes: 0 },
    async read(key) {
      this.stats.reads += 1;
      return data.get(key);
    },
  };
}

export function createCluster({ replicas = 2 } = {}) {
  const log = [];
  const primary = createNode('primary');
  primary.write = async function write(key, value) {
    this.stats.writes += 1;
    const lsn = log.length + 1;
    log.push({ lsn, key, value });
    this.data.set(key, value);
    this.appliedLsn = lsn;
    return lsn;
  };
  const nodes = Array.from({ length: replicas }, (_, i) => createNode(`replica-${i}`));
  return {
    primary,
    replicas: nodes,
    replicate({ only } = {}) {
      for (const [i, node] of nodes.entries()) {
        if (only !== undefined && only !== i) continue;
        for (const entry of log.slice(node.appliedLsn)) node.data.set(entry.key, entry.value);
        node.appliedLsn = log.length;
      }
    },
  };
}
