# 04 · CQRS: separate command and query models

**Skills:** Command Query Responsibility Segregation, commands vs events,
enforcing rules on the write model, projections and read models, eventual
consistency.

## Background
One model that both enforces business rules *and* serves every screen ends up
bad at both. **CQRS** splits them:

- **Command side** (write model): receives *intent* (`Withdraw 50`), checks
  the rules against its own state, and records *facts* as **events**
  (`MoneyWithdrawn 50`). It returns nothing interesting.
- **Query side** (read model / **projection**): consumes the events and keeps
  denormalised views shaped for each screen ("my accounts", "top accounts").
  It never validates anything. The events already happened.

The read model updates *after* the write, so it's **eventually consistent**.
Because the events are the source of truth, you can throw a projection away
and rebuild it, or add a new one, by replaying them. CQRS pairs naturally with
event sourcing, which this challenge uses, but it doesn't require it.

## Scenario
A small bank. `event-store.js` gives you an append-only store and a projector
that feeds new events to a read model. `write-side.js` and `read-side.js`
are empty.

## Goal
1. `write-side.js`: `handle(command)` enforces the rules listed in the file
   and appends the matching event. If a rule is broken, it throws and appends
   nothing.
2. `read-side.js`: `apply(event)` maintains a read model, and the three
   queries `getAccount`, `accountsOf` and `topAccounts` read from it.

`npm run demo` shows a rejected command and the read model lagging until
`catchUp()`.

## Hints
- Write side: rebuild an account's state by folding its events,
  `store.forAccount(id).reduce(...)`. That gives you whether it exists and its
  balance.
- Read side: a `Map` of accountId → `{ accountId, owner, balance }` covers all
  three queries. Sort when you query.
- Keep the two files independent. The write side must never read the
  projection, because it may be stale.

## Check your work
```
./onboard validate distributed-systems/04
```
