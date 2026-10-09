// A service registry: instances register themselves, keep sending heartbeats,
// and disappear when the heartbeats stop. Clients look up live instances by name.
//
// Use now() for time (never Date.now()), so tests can fast-forward.

export function createRegistry({ ttlMs = 10_000, now = Date.now } = {}) {
  // TODO: choose your state, e.g. Map<serviceName, Map<instanceId, { id, url, lastSeen }>>

  return {
    // Add an instance ({ id, url }) under a service name, or refresh it if the id
    // is already registered. Registering counts as a heartbeat.
    register(service, instance) {},

    // Mark an instance as alive right now. Return true if it was known, or false if
    // it isn't registered (or already expired). That tells the instance to register again.
    heartbeat(service, id) {
      return false;
    },

    // Remove an instance immediately (a graceful shutdown).
    deregister(service, id) {},

    // The live instances, as [{ id, url }]: those heard from within the last ttlMs.
    lookup(service) {
      return [];
    },
  };
}

// Client-side load balancing: spread calls round-robin over the live instances.
export function createClient(registry) {
  return {
    // Return the url of the next live instance, or throw if there are none.
    pick(service) {
      throw new Error(`no live instances of ${service}`);
    },
  };
}
