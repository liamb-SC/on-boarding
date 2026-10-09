# 06 · Validating input with Zod

**Skills:** Zod schemas, `safeParse`, defaults and optional fields, and TypeScript
types inferred with `z.infer`.

## Background
TypeScript types disappear at runtime, so they can't protect you from a JSON
request body. `input as Signup` is a promise to the compiler that nobody
checks. **Zod** describes the shape once, as a schema, then checks real data
against it **and** gives you the TypeScript type for free.

```ts
import { z } from 'zod';

const User = z.object({
  name: z.string().min(1),
  age: z.number().int().optional(),
  role: z.enum(['admin', 'member']).default('member'),
});
type User = z.infer<typeof User>;  // { name: string; age?: number; role: 'admin' | 'member' }

const r = User.safeParse(body);    // never throws
if (r.success) r.data;             // typed, cleaned (unknown keys stripped)
else r.error.issues;               // [{ path: ['name'], message: '...' }, ...]
```

`.parse()` throws on bad input. `.safeParse()` returns a result you branch on,
which is better at a boundary such as a request handler.

## Scenario
`src/signup.ts` has a hand-written `Signup` interface and a `parseSignup`
that casts whatever it receives. `npm start` shows garbage getting through.

## Goal
In `src/signup.ts`:
1. Export `SignupSchema`, an object with:
   - `email`: a valid email address
   - `password`: a string of at least 8 characters
   - `age`: optional, an integer of at least 13
   - `plan`: `'free'` or `'pro'`, defaulting to `'free'`
2. Replace the interface with `export type Signup = z.infer<typeof SignupSchema>`.
3. Make `parseSignup` use `safeParse`. On success return `{ ok: true, data }`.
   Otherwise return `{ ok: false, errors }`, where `errors` lists the
   offending field names (each issue's `path[0]`), e.g. `['email', 'age']`.
4. `npm run typecheck` passes.

## Hints
- In Zod 4, emails are `z.email()`. `z.string().email()` still works too.
- Hover over `Signup` in your editor after step 2 to see the inferred type.
- `r.error.issues.map((i) => String(i.path[0]))` gives you the field names.

## Check your work
```
./onboard validate javascript/06
```
