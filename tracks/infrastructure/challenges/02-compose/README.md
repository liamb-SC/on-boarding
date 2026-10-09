# 02 · Docker Compose: an API and its Redis

**Skills:** `compose.yaml`, `build:` vs `image:`, `ports`, `environment`,
service-name DNS, healthchecks, `depends_on: condition: service_healthy`,
named volumes, `docker compose up / logs / ps / restart / down`.

## Background
- **Compose** describes several containers, their config, network and volumes
  in one file. `docker compose up` starts the lot on a private network.
- On that network, each **service name is a hostname**. The API reaches Redis
  at `redis:6379`, not `localhost`. Inside a container, `localhost` is the
  container itself.
- Plain `depends_on: [redis]` only waits for the Redis container to *start*.
  To wait until it's actually ready, give Redis a **healthcheck** and use
  `condition: service_healthy`.
- Container filesystems are disposable. Data you want to keep goes in a
  **named volume**. `docker compose down` keeps volumes. `down -v` deletes them.

## Scenario
`visits-api` (`server.js`, already containerised by the `Dockerfile`) counts
visits in Redis: every `GET /visits` runs `INCR visits`. `compose.yaml` is
half-written.

## Goal
Finish `compose.yaml` so that:
1. `api` is built from this directory and reachable at `localhost:8080`
   (it listens on 3000 inside the container).
2. `api` gets `REDIS_HOST=redis` and only starts once Redis is **healthy**
   (healthcheck: `redis-cli ping`).
3. Redis keeps `/data` in a **named volume**, so the count survives
   `docker compose down` followed by `up`.

Then try it:
```bash
docker compose up -d --build
docker compose ps                    # both up, redis "(healthy)"
curl localhost:8080/visits           # {"visits":1,...}, then 2, 3...
docker compose logs -f api           # Ctrl-C to stop following
docker compose restart api && curl localhost:8080/visits   # count keeps going
docker compose down && docker compose up -d && curl localhost:8080/visits
```

## Hints
- `docker compose config` prints the file as Compose understands it, and
  catches typos and wrong indentation.
- A healthcheck needs `test:` (e.g. `["CMD", "redis-cli", "ping"]`). A short
  `interval:` makes startup quicker.
- If port 8080 is taken on your machine, stop whatever is using it. The
  validator expects 8080.

## Check your work
Needs Docker running. The validator reads your `compose.yaml`, then brings the
stack up, curls it, restarts the API, and does a `down` + `up` to check the
count survives. It leaves the stack stopped.
```
./onboard validate infrastructure/02
```
