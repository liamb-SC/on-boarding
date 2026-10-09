# 01 · TypeScript basics

**Skills:** type annotations, `interface` and `type`, union types, `strict`
mode, running `tsc`, and a first generic function.

## Background
TypeScript is JavaScript plus types that are checked **before** your code
runs and then erased. `tsc` is the compiler: it reports type errors and emits
plain `.js`.

```ts
interface User { id: string; name: string; email?: string }   // ? = optional
type Role = 'admin' | 'member';                                 // a union of literals

function greet(user: User): string { return `hi ${user.name}`; }

// A generic works for any element type T and keeps it:
function last<T>(items: T[]): T | undefined { return items[items.length - 1]; }
last([1, 2, 3]);    // number | undefined
last(['a']);        // string | undefined
```

- `strict: true` in `tsconfig.json` turns on the useful checks, including
  "parameter implicitly has an `any` type". Keep it on.
- `any` switches checking off. If you don't know a type yet, use `unknown`
  and narrow it.
- Use `interface` for object shapes and `type` for unions. Both work for most
  things.

## Scenario
`src/orders.ts` was renamed from `.js` and has no types, so `tsc` fails.
`src/main.ts` already imports `type Order` from it, so its expected shape is
visible there.

## Goal
In `src/orders.ts`:
1. Export `type OrderStatus`: one of `'pending'`, `'paid'`, `'shipped'`.
2. Export `interface LineItem` (`sku: string`, `qty: number`,
   `unitPrice: number`) and `interface Order` (`id`, `customer`,
   `status: OrderStatus`, `items: LineItem[]`).
3. Type `orderTotal` so it takes an `Order` and returns a `number`.
4. Make `first` and `groupBy` **generic**, so they keep the element type:
   - `first<T>(items: T[]): T | undefined`
   - `groupBy<T>(items: T[], keyOf: (item: T) => string): Record<string, T[]>`
5. `npm run typecheck` passes, with no `any` and `strict` still on.

## Try it
```bash
npm run typecheck    # tsc --noEmit: errors only, no output files
npm start            # compile to dist/ and run main.js
```

## Hints
- Read the errors from the top. Fixing the types in `orders.ts` clears most
  of the `main.ts` errors too.
- Inside `groupBy`, `const groups: Record<string, T[]> = {};` tells TypeScript
  what the empty object will hold.
- Hover over a variable in your editor (VS Code) to see its inferred type.

## Check your work
```
./onboard validate javascript/01
```
