# 01 · Jest: unit tests and mocks

**Skills:** `describe`/`test`/`expect`, matchers (`toBe`, `toEqual`,
`toThrow`, `rejects`), mock functions with `jest.fn()`, `mockResolvedValue`,
`mockRejectedValue`, asserting calls with `toHaveBeenCalledWith`.

## Background
A **unit test** runs one small piece of code in isolation and checks what it
returns. When that code talks to something slow or external (a payment
provider, a database), you hand it a **mock** instead: a fake function you
control and can inspect afterwards.

```js
const payments = { charge: jest.fn().mockResolvedValue({ id: 'rcpt_1' }) };
await checkout(cart, payments);
expect(payments.charge).toHaveBeenCalledWith({ customerId: 'c1', amount: 900 });
```

- `mockResolvedValue(x)` makes the mock return a promise of `x`.
  `mockRejectedValue(err)` makes it return a rejected promise.
- For async errors use `await expect(promise).rejects.toThrow('message')`.
  For sync ones use `expect(() => fn()).toThrow('message')`.

A test suite is only useful if it **fails when the code is wrong**. The
validator checks exactly that: it plants small bugs in `cart.js`, one at a
time, and expects your tests to catch each one.

## Scenario
`src/cart.js` has three functions (read the comments in the file) and almost no
tests. `src/cart.test.js` has one example test and some TODOs.

## Goal
Write tests in `src/cart.test.js` (at least 8) that pin down this behaviour:

1. `subtotal` multiplies price by quantity and adds up the lines.
2. `applyDiscount`: no code means no change. `SAVE10` takes 10% off, rounded to
   the **nearest** penny (`1005` becomes `905`). `FIVEOFF` takes 500 off but
   never goes below 0. An unknown code throws.
3. `checkout`, using a `jest.fn()` mock for `payments.charge`:
   - charges the customer the **discounted** amount, and returns `{ amount, receiptId }`;
   - rejects an empty cart with `Cart is empty` **and never calls charge**;
   - turns a failed charge (`mockRejectedValue`) into `Payment failed: <reason>`.

Don't change `cart.js`. The validator always uses its own copy.

## Hints
- `npm test` runs Jest. `npx jest --watch` reruns on every save.
- `toBe` compares with `===`. `toEqual` compares objects field by field.
- `expect(payments.charge).not.toHaveBeenCalled()`.

## Check your work
```
./onboard validate testing/01
```
