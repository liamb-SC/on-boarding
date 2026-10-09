# 07 · Immutability

**Skills:** shared mutable state as a concurrency hazard, returning new
values instead of mutating, spread copies, and `Object.freeze` (deep).

## Background
Every race in this track needs two things: **shared** state, and someone
**changing** it. Locks deal with the second by taking turns. Immutability
removes it altogether: if nothing ever changes after it's created, sharing it
is always safe, with no locks needed.

```js
// mutating: everyone holding `cart` sees the change, mid-whatever-they-were-doing
cart.items.push(item);

// immutable update: a NEW cart. Unchanged parts (the other items) are shared.
const next = { ...cart, items: [...cart.items, item] };
const cheaper = { ...cart, items: cart.items.map((i) => ({ ...i, price: i.price / 2 })) };
```

- Spread (`...`) copies **one level**. Nested objects are still shared, so
  copy every level you change.
- `Object.freeze(obj)` makes mutation fail (a `TypeError` in strict mode,
  which includes ES modules), but it's shallow too. A **deep freeze** walks
  every nested object and array.
- In Node, a frozen shared default (like `EMPTY_CART`) is safe to hand to
  every request. A mutable one is a classic bug where data leaks between
  users.
- Worker threads can't share ordinary objects at all: `postMessage` sends a
  **copy** (structured clone). Only `SharedArrayBuffer` is shared (challenge
  02).

## Scenario
`npm start` runs two checkouts at the same time. Ada is charged for Linus's
T-shirt, and the catalog's mug price changes. Every request shares, and
mutates, the same `EMPTY_CART` and the same item objects.

## Goal
In `cart.js`:
1. Implement `deepFreeze(obj)`, and use it to freeze `EMPTY_CART`.
2. Make `addItem` and `applyDiscount` return **new** carts. They must never
   change the cart or the items they were given.
3. `newCart()` may keep returning the shared `EMPTY_CART`. Once nothing
   mutates it, that's safe.

`npm start` should then print the expected numbers every time.

## Hints
- `deepFreeze`: freeze `obj`, then call `deepFreeze` on each value of
  `Object.values(obj)` that is an object (arrays are objects too). Skip
  `null`.
- Freezing first helps with step 2: any leftover mutation now throws a
  `TypeError` that points at the guilty line.

## Check your work
```
./onboard validate concurrency/07
```
