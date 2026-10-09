# 01 · Express: routes, middleware and errors

**Skills:** `express.Router`, route params, `express.json()`, writing
middleware, status codes, a 404 fallback and a 4-argument error handler.

## Background
An Express app is a **pipeline of middleware**. Each request walks down the
list in the order you called `app.use()` / `app.get()`, and each function
either responds or calls `next()` to pass it on.

```js
app.use((req, res, next) => { res.set('X-Hello', 'hi'); next(); }); // runs for everything
app.get('/notes/:id', (req, res) => res.json({ id: req.params.id })); // one route
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));  // nothing matched
app.use((err, req, res, next) => { /* ... */ });                      // 4 args = error handler
```

- **Order matters.** The 404 fallback goes after every route, and the error
  handler goes last.
- A thrown error (or `next(err)`) skips ahead to the **error handler**. Express
  recognises it by its four arguments.
- Errors from Express itself carry a status. Bad JSON from `express.json()`
  arrives as an error with `err.status === 400`.
- Never send a 500's message or stack to the client. Log it on the server.

## Scenario
A small notes API. `app.js` builds the app, `routes/notes.js` holds the notes
routes and `store.js` is an in-memory store. Only `GET /health` and
`GET /notes` exist so far, and `GET /boom` throws.

## Goal
Work through the `TODO`s in `app.js` and `routes/notes.js`:
1. Middleware that sets `X-Request-Id` on every response. Reuse the client's
   `X-Request-Id` if it sent one.
2. JSON body parsing.
3. `GET /notes/:id`: the note, or `404 { "error": "..." }`.
4. `POST /notes` with `{ "text": "..." }`: `201` + the note + a
   `Location: /notes/<id>` header. A missing, non-string or blank `text` is a
   `400 { "error": "..." }`.
5. Unknown routes: `404 { "error": "Not Found" }`.
6. An error handler: a 4xx error keeps its status (bad JSON is a 400), and
   anything else is `500 { "error": "Internal Server Error" }` with no details.

## Try it
```bash
npm start
curl -i localhost:3000/notes/1
curl -i localhost:3000/notes -H 'content-type: application/json' -d '{"text":"hi"}'
curl -i localhost:3000/notes -H 'content-type: application/json' -d '{"text": oops'
curl -i localhost:3000/boom
```

## Hints
- `req.get('X-Request-Id')` reads a request header and `res.set()` writes one.
- `Number(req.params.id)` turns the route param into a number.
- `res.status(201).location(...).json(note)` chains.
- In the error handler, `const status = err.status ?? err.statusCode ?? 500`.

## Check your work
```
./onboard validate backend-apis/01
```
