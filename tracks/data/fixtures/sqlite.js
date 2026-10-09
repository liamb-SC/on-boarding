// A tiny, synchronous wrapper around sql.js: real SQLite compiled to
// WebAssembly, so there's nothing native to build. Every challenge that needs
// SQL uses this.
//
//   import { openDb } from './sqlite.js';
//   const db = await openDb();
//   db.exec('CREATE TABLE t (a, b)');             // one or more statements, no params
//   db.run('INSERT INTO t VALUES (?, ?)', [1, 2]); // one statement with params
//   db.all('SELECT * FROM t WHERE a = ?', [1]);    // -> [{ a: 1, b: 2 }]
//   db.get('SELECT count(*) AS n FROM t');         // -> { n: 1 } (first row or undefined)
//   db.tx(() => { ...several db.run calls... });   // all or nothing
//   db.plan('SELECT * FROM t WHERE a = ?', [1]);   // EXPLAIN QUERY PLAN lines
import initSqlJs from 'sql.js';

const SQL = await initSqlJs();

export async function openDb() {
  const db = new SQL.Database();
  db.exec('PRAGMA foreign_keys = ON');

  const all = (sql, params = []) => {
    const stmt = db.prepare(sql);
    try {
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      return rows;
    } finally {
      stmt.free();
    }
  };

  let depth = 0;
  const tx = (fn) => {
    // Nested tx() calls join the outer transaction.
    if (depth > 0) return fn();
    db.exec('BEGIN');
    depth += 1;
    try {
      const result = fn();
      db.exec('COMMIT');
      return result;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    } finally {
      depth -= 1;
    }
  };

  return {
    exec: (sql) => { db.exec(sql); },
    run: (sql, params = []) => { db.run(sql, params); },
    all,
    get: (sql, params = []) => all(sql, params)[0],
    tx,
    plan: (sql, params = []) => all(`EXPLAIN QUERY PLAN ${sql}`, params).map((r) => r.detail),
    close: () => db.close(),
  };
}
