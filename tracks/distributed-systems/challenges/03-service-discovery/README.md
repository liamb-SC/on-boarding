# 03 · Service registry and discovery

**Skills:** self-registration, heartbeats and TTLs, deregistration, health
by liveness, client-side load balancing.

## Background
In a dynamic environment (autoscaling, containers, deploys), instance
addresses change all the time, so you can't hard-code
`http://10.0.0.1:8080`. Instead:

1. Each instance **registers** itself (`payments` → `http://10.0.0.1:8080`) when it starts.
2. It sends a **heartbeat** every few seconds. If the heartbeats stop (crash,
   network partition), the registry **expires** it after a TTL. A graceful
   shutdown **deregisters** straight away.
3. Clients **look up** the live instances by name and spread their calls
   across them (client-side load balancing), or a load balancer does it for them.

Real examples: Consul, Eureka, etcd, ZooKeeper, Kubernetes Services/Endpoints
(where the kubelet's readiness probes play the part of heartbeats), and AWS
Cloud Map.

## Scenario
`registry.js` has the API, but no implementation. `server.js` wraps it in a
tiny HTTP API for experimenting.

## Goal
Implement `createRegistry` and `createClient` in `registry.js`:
1. `register`, `deregister` and `lookup` (only instances heard from within
   `ttlMs`, as `{ id, url }`).
2. `heartbeat` refreshes a live instance, and returns `false` for unknown or
   expired ones.
3. `createClient(registry).pick(service)` round-robins over live instances, and
   throws if there are none.

## Try it
```bash
npm start   # in another terminal
curl -XPOST localhost:8500/services/payments -d '{"id":"pay-1","url":"http://10.0.0.1:8080"}'
curl localhost:8500/services/payments
curl -XPUT localhost:8500/services/payments/pay-1     # heartbeat
sleep 16; curl localhost:8500/services/payments        # expired
```

## Hints
- Expired means `now() - lastSeen > ttlMs`. Filter them out in `lookup` (and
  delete them there too, if you like).
- Keep a counter per service in the client: `list[counter++ % list.length]`.

## Check your work
```
./onboard validate distributed-systems/03
```
