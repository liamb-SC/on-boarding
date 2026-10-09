# 03 · Deadlock

**Skills:** recognising a deadlock, the four conditions it needs, and
preventing it with a global lock order.

## Background
A **deadlock** is a group of tasks each waiting for a lock that another one in
the group holds. Nobody can move, so they wait forever. There's no error and
no crash, the work just never finishes. In Node, the stuck promises simply
never settle.

```
transfer(alice -> bob):  holds alice, waiting for bob
transfer(bob -> alice):  holds bob,   waiting for alice      ← a cycle
```

A deadlock needs all four **Coffman conditions** at once:
| | Condition | Meaning |
|-|-----------|---------|
| a | mutual exclusion | a lock has one holder at a time |
| b | hold and wait | a task holds one lock while waiting for another |
| c | no preemption | nobody can take a lock away from its holder |
| d | circular wait | a cycle of tasks, each waiting on the next |

Break any one and deadlock is impossible. The usual, cheapest fix is a **lock
order**: every piece of code that needs several locks takes them in the same
global order, for example sorted by id. Then a cycle can't form.

## Scenario
`npm start` runs two opposite transfers at the same time and hangs until a
2-second timer gives up.

## Goal
1. Fix `transfer` in `accounts.js` so it always takes the two locks in a
   consistent order (e.g. by account id), whichever way the money moves.
   Keep both locks held while the money moves.
2. A transfer to the same account must reject with
   `Error('cannot transfer to the same account')`. Locking one mutex twice
   would deadlock with yourself.
3. In `answers.json`, answer with a letter:
   - **q1**: lock ordering removes which condition from the table above
     (`a`-`d`)?
   - **q2**: a teammate adds `refund()`, which locks `to` then `from` without
     sorting. What can happen?
     a) nothing, `transfer`'s ordering protects everything
     b) `refund` and `transfer` can deadlock each other
     c) Node detects the deadlock and throws

## Hints
- `const [first, second] = [from, to].sort((x, y) => x.id.localeCompare(y.id));`
- Don't "fix" it by dropping a lock. The validator runs hundreds of transfers
  and checks that no money is created or lost.

## Check your work
```
./onboard validate concurrency/03
```
