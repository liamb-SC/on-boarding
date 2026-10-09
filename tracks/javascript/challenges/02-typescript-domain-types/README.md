# 02 · Domain types with generics

**Skills:** branded types, generic `Brand<T, B>` and `Id<E>`, parse functions
that return a `Result<T>`, discriminated unions, exhaustive `switch` with
`never`, `Extract` and a generic `filterByType<K>`.

## Background
A `string` says nothing about what the text means. `"alice@example.com"`,
`"hello"`, `""` and a 10MB payload are all valid strings, and so is every
account ID and user ID, so the compiler can't stop you mixing them up:

```ts
function sendStatement(user: string, account: string, email: string) { ... }
sendStatement(accountId, userId, email);   // wrong order, compiles fine
```

A **branded type** is a string (or number) with an invisible tag that only
the type checker sees. It costs nothing at runtime:

```ts
type Brand<T, B extends string> = T & { readonly __brand: B };
type Id<Entity extends string> = Brand<string, `${Entity}Id`>;

type AccountId = Id<'Account'>;
type UserId = Id<'User'>;

const a: AccountId = 'acc_1';          // ✗ a plain string isn't an AccountId
const u: UserId = someAccountId;       // ✗ different brands don't mix
const s: string = someAccountId;       // ✓ it's still a string underneath
```

The only way to get an `AccountId` is through a **parse function**: the one
place that checks the rules (format, length, non-empty) and then casts.
Everything downstream can trust it without checking again. If the rules
change, you change one function, and the compiler shows every caller that
no longer fits.

```ts
function parseAccountId(raw: string): Result<AccountId> {
  return /^acc_[a-z0-9]{8}$/.test(raw) ? ok(raw as AccountId) : err(`bad account id: ${raw}`);
}
```

**Discriminated unions** apply the same idea to objects. Every variant of
`Debt` has a literal `type` field, so after `switch (debt.type)` TypeScript
knows exactly which fields exist. Add a `default` case that passes the value to
`assertNever(x: never)`, and adding a new kind of debt later becomes a compile
error in every `switch` that forgot to handle it.

## Scenario
A small debt-planning service. Every ID, email and amount in `src/types.ts`
is a plain `string` or `number`, the parse functions in `src/parse.ts` accept
anything, and `src/main.ts` calls `sendStatement` with its arguments in the
wrong order. Run `npm start` and read the output: it compiles and runs, but
it's wrong.

## Goal
Work through the `TODO`s in order:
1. **`src/types.ts`:** export a generic `Brand<T, B>`, a generic `Id<Entity>`
   built on it, and brand `AccountId` (`Id<'Account'>`), `UserId`
   (`Id<'User'>`), `EmailAddress` (a string) and `Money` (a number of pence).
2. **`src/parse.ts`:** make each function enforce its rules and return
   `err(...)` when they fail:
   - `parseEmail`: trim and lowercase, at most 254 characters, `local@domain.tld`
   - `parseAccountId` / `parseUserId`: `acc_` / `usr_` plus exactly 8 lowercase letters or digits
   - `parseMoney`: a whole number ≥ 0
3. Fix the `sendStatement` call that `tsc` now rejects in `src/main.ts`.
4. **`src/debts.ts`:** add `assertNever` and a `default` case that uses it,
   export `DebtOfType<K>`, and make `filterByType` generic so
   `filterByType(debts, 'mortgage')` is a `MortgageDebt[]`.
5. `npm run typecheck` passes with `strict` on and no `any`.

The `as AccountId`-style casts belong in `src/parse.ts` only. Nowhere else
should need one.

## Try it
```bash
npm run typecheck
npm start           # should print the statement line the right way round
```

## Hints
- `Id<'Account'>` and `Id<'User'>` must produce different brands. A template
  literal like `` `${Entity}Id` `` or just `Entity` as the brand works.
- `Extract<Union, { type: K }>` keeps the members of a union that match.
- For `filterByType`, use `<K extends Debt['type']>`, so `'boat'` is rejected.
  You'll need a type guard in the `filter` callback, e.g.
  `(d): d is DebtOfType<K> => d.type === type`.
- `assertNever` is never meant to run. If it does, something sent data the
  types didn't allow, so throw.
- Brands don't stop two values of the **same** brand being swapped (`from` and
  `to` are both `AccountId`). That's why `transferFunds` takes a named object.

## Check your work
```
./onboard validate javascript/02
```
