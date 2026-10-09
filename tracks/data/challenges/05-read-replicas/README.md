# 05 · Read replicas and read-your-writes

**Skills:** primary/replica routing, replication lag, log sequence numbers
(LSNs), round-robin reads, read-your-writes consistency.

## Background
When reads outnumber writes 10:1, you add **read replicas**. These are copies
of the primary that apply its write log *asynchronously*. Writes still go to the
one primary, and reads fan out across the replicas.

The catch is **replication lag**. A user saves their profile, the next page
reads it from a replica that is 200 ms behind, and their change seems to have
vanished. **Read-your-writes** consistency fixes that for the user who wrote,
without sending every read to the primary:

- Each write returns its position in the log, the **LSN**.
- Remember the last LSN per session (user).
- Read from a replica only if `replica.appliedLsn >= session.lastLsn`.
  Otherwise use a replica that has caught up, or fall back to the primary.

Everyone else can keep reading from any replica. Slightly stale data is fine
for them.

## Scenario
`cluster.js` simulates a primary and two replicas, and you control the lag:
nothing replicates until `cluster.replicate()` runs. `router.js` currently
sends everything to the primary.

## Goal
Implement `createRouter` in `router.js`:
1. `write(session, key, value)` goes to the primary and records the session's LSN.
2. `read(session, key)` round-robins across replicas.
3. Read-your-writes: skip any replica whose `appliedLsn` is behind the
   session's last write. If none have caught up, read from the primary.

`npm run demo` prints which node served what.

## Hints
- A `Map` of session → last LSN is enough state.
- Pick the candidates first (`cluster.replicas.filter(...)`), then round-robin
  over them with a counter.
- Real systems do the same with Postgres `pg_current_wal_lsn()` /
  `pg_last_wal_replay_lsn()`, or more simply by "pinning to the primary for N
  seconds after a write".

## Check your work
```
./onboard validate data/05
```
