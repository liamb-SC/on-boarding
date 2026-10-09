# Track: JavaScript and TypeScript

The everyday JavaScript toolkit for our Node services: TypeScript types, Node's
modules, files and process, async/await, and the libraries we reach for most
often (Day.js for dates, Zod for validation, Axios for HTTP).

## Requirements
Node.js 20+ and network access to the npm registry. Challenges 01, 02 and 06
install `typescript`, 05 installs `dayjs`, 06 installs `zod`, and 07 installs
`axios`. Challenge 07 runs a small local API server, with no internet needed.

## Learning objectives
By the end you can:
- Type objects, unions and functions, write a small generic, and run `tsc` in strict mode.
- Model a domain with branded types and parse functions, so the compiler catches swapped IDs, and use discriminated unions with exhaustive `switch`es.
- Split code into ES modules and use `node:fs/promises`, `process.argv` and exit codes.
- Run independent async work in parallel with `Promise.all` / `allSettled`, and catch errors correctly.
- Predict the order of sync code, `nextTick`, microtasks and timers.
- Parse, format, convert and diff dates with Day.js without local time zone bugs.
- Validate untrusted input with Zod and get the TypeScript type from the schema.
- Build an Axios instance with interceptors and timeouts, and classify its errors.

## Challenges (do them in order)
| # | Challenge | Core concepts |
|---|-----------|---------------|
| 01 | typescript-basics | `interface`, union types, `strict`, `tsc`, generics |
| 02 | typescript-domain-types | branded types, generic `Brand`/`Id`, `Result<T>`, discriminated unions, `never`, `Extract` |
| 03 | node-modules-fs-process | ES modules, `fs/promises`, `process.argv`, exit codes, stderr |
| 04 | async-await | `Promise.all`, `allSettled`, `return await`, event loop order |
| 05 | dayjs | strict parsing, formatting, UTC, `.tz()`, DST, `.diff()` |
| 06 | zod | schemas, `safeParse`, defaults, `z.infer` |
| 07 | axios | `axios.create`, interceptors, timeouts, error handling |

Start with: `./onboard start javascript/01`
