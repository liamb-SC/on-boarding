# 08 · Next.js: app router, server and client components

**Skills:** the app router's file conventions (`app/**/page.jsx`,
`layout.jsx`, `route.js`, `[param]`), React Server Components vs Client
Components (`'use client'`), loading data on the server, route handlers.

## Background
Next.js is a React framework: routing, server rendering and an API layer,
all from files under `app/`.

| File | Becomes |
|------|---------|
| `app/products/page.jsx` | the page at `/products` |
| `app/layout.jsx` | the shell wrapped around every page |
| `app/api/products/route.js` | an HTTP endpoint: `export async function GET(request) {...}` |
| `app/api/products/[id]/route.js` | a dynamic segment. The handler gets `{ params }`, a **promise** of `{ id }` |

**Server Components are the default.** They run only on the server, can be
`async`, and can read databases or secrets directly. Their code never ships
to the browser. They **can't** use state, effects or event handlers.

A file starting with **`'use client'`** is a **Client Component**. It's
rendered on the server for the first HTML, then hydrated in the browser, so
it can use `useState`, `onClick` and so on. Keep these small, and put them at
the leaves: a server page can render client components (passing them
serialisable props), but not the other way round.

Route handlers use the web-standard `Request`/`Response`: `return
Response.json(data, { status: 404 })` (or the equivalent `NextResponse.json`).

## Scenario
A gadget shop. `app/products/page.jsx` was written the old single-page-app
way: `'use client'`, an empty list, then `fetch('/api/products')` in an
effect, against an API that doesn't exist. Data lives in `lib/products.js`.
Run `npm run dev` and open http://localhost:3000.

## Goal
1. **Route handlers:**
   - `app/api/products/route.js`: `GET` returns the products as JSON (200).
   - `app/api/products/[id]/route.js`: `GET` returns one product, or a
     `404` with `{ "error": "Not found" }`.
2. **Make the products page a Server Component:** remove `'use client'`, the
   state and the effect. Make it `async` and `await getProducts()` directly.
   Keep the `<h1>Products</h1>` and one `<li>` per product with its name and
   `£price`.
3. **`app/components/LikeButton.jsx`** becomes a Client Component: a button
   that toggles between `Like` and `Liked`, with `aria-pressed` matching.
   Render one in every product's `<li>`.

The validator calls your route handlers directly, renders your components,
and runs `next build`, which rejects hooks in server components.

## Hints
- Server components can import the data layer directly. Fetching your own
  API from the server is an extra network hop for nothing.
- `const { id } = await params;`. In Next 15+, `params` is a promise.
- Try `npm run build` yourself. The route table it prints marks each route as
  static (○) or dynamic (ƒ).
- View the page source in the browser. With a server component the products
  are already in the HTML, with no loading flash.

## Check your work
```
./onboard validate react/08
```
