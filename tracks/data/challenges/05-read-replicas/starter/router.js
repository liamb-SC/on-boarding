// Sends each query to the right database node.
//   - writes must go to the primary
//   - reads should go to the replicas (round-robin), to take load off the primary
//   - read-your-writes: after a session writes, its reads must not come from a
//     replica that hasn't caught up with that write yet
export function createRouter(cluster) {
  return {
    // TODO: write to the primary. Remember how far this session has written (the LSN).
    async write(session, key, value) {
      return cluster.primary.write(key, value);
    },

    // TODO: read from a replica (round-robin), unless no replica has caught up
    // with this session's last write. Then use one that has, or the primary.
    async read(session, key) {
      return cluster.primary.read(key);
    },
  };
}
