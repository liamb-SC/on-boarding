# 06 · Change data capture with an outbox

**Skills:** the transactional outbox pattern, tailing a change log, projecting
a read model, checkpoints and exactly-once application.

## Background
Your orders service needs to tell other systems (search, analytics, emails)
when an order changes. If you write to the db and *then* publish to a broker,
a crash between the two loses the event, or publishes an event for a write
that rolled back.

**Change data capture (CDC)** turns the database's own changes into a stream
of events. Two common ways to get there:

- **Log-based CDC**: a tool like Debezium reads the database's write-ahead
  log (the Postgres WAL, the MySQL binlog).
- **Transactional outbox**: in the *same transaction* as the business write,
  insert a row into an `outbox` table. A relay or projector then tails that
  table in order. Either both writes happen or neither does.

The consumer stores a **checkpoint** (the last log position it applied). After
a restart it resumes from there. If it updates the checkpoint in the same
transaction as the read model, no event is applied twice.

## Scenario
`schema.js` defines `orders`, `outbox`, a `customer_stats` read model and
`projector_checkpoint`. It's real SQLite (via `sql.js`, see `sqlite.js` for
the helpers). `placeOrder` only writes the order.

## Goal
1. `orders.js`: `placeOrder` and `cancelOrder` write the change **and** its
   outbox event, in one `db.tx(...)`.
2. `projector.js`: `runProjector(db)` tails the outbox from the
   `customer_stats` checkpoint, updates `customer_stats`, saves the
   checkpoint, and returns how many events it applied.

`npm run demo` shows the outbox, two projector runs, and the result.

## Hints
- `db.tx(() => { db.run(...); db.run(...); })` rolls everything back if anything throws.
- `db.get("SELECT last_id FROM projector_checkpoint WHERE name = ?", ['customer_stats'])?.last_id ?? 0`
- Upsert: `INSERT INTO customer_stats VALUES (?, 1, ?) ON CONFLICT(customer)
  DO UPDATE SET orders = orders + 1, total_spent = total_spent + excluded.total_spent`
- The projector must only read `outbox`, never `orders`. That's what lets it run
  in a different service, fed from a broker.

## Check your work
```
./onboard validate data/06
```
