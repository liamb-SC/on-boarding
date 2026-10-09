// The tables. Don't edit this file.
export const SCHEMA = `
  -- write model: the source of truth
  CREATE TABLE orders (
    id       TEXT PRIMARY KEY,
    customer TEXT NOT NULL,
    total    INTEGER NOT NULL CHECK (total > 0),
    status   TEXT NOT NULL DEFAULT 'placed'
  );

  -- the outbox: an append-only change log, written in the SAME transaction as orders
  CREATE TABLE outbox (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,  -- the position in the log
    aggregate_id TEXT NOT NULL,                      -- the order id
    type         TEXT NOT NULL,                      -- 'OrderPlaced' | 'OrderCancelled'
    payload      TEXT NOT NULL                       -- JSON
  );

  -- read model: built only from the outbox, never from orders
  CREATE TABLE customer_stats (
    customer    TEXT PRIMARY KEY,
    orders      INTEGER NOT NULL,
    total_spent INTEGER NOT NULL
  );

  -- how far each projector has read, so a restart resumes where it left off
  CREATE TABLE projector_checkpoint (
    name    TEXT PRIMARY KEY,
    last_id INTEGER NOT NULL
  );
`;
