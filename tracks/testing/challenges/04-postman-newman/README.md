# 04 · Postman collections, run with newman

**Skills:** Postman collections (v2.1 JSON), variables (`{{baseUrl}}`),
`pm.test` / `pm.expect` test scripts, chaining requests with
`pm.collectionVariables.set`, running a collection in CI with `newman`.

## Background
A **Postman collection** is a JSON file of saved requests. Each request can
have a **test script** that runs after the response arrives:

```js
pm.test('creates a note', () => {
  pm.response.to.have.status(201);
  pm.expect(pm.response.json().title).to.eql('Buy milk');
});
pm.collectionVariables.set('noteId', pm.response.json().id); // for later requests
```

Later requests use saved values as `{{noteId}}`, in the URL, headers or body.
That's how you chain *log in → use the token → create → fetch*.

**newman** is Postman's command-line runner. It runs the same collection
headless, so your API tests can run in CI:
`newman run collection.json --env-var baseUrl=http://localhost:5055`.

## Scenario
`notes-api.mjs` is a small notes API. Read the comment at the top for its
routes. `collection.json` has a single `Health` request with two tests.

## Goal
Extend `collection.json` to at least 5 requests and 6 assertions, all with URLs
starting `{{baseUrl}}`:

1. **Login**: `POST /login` with JSON `{"username":"learner","password":"hunter2"}`.
   Test the status, and save `token` into a variable.
2. **Create note**: `POST /notes` with `Authorization: Bearer {{token}}` and a
   JSON body with a `title`. Test for `201`, save its `id` as `noteId`.
3. **Get note**: `GET /notes/{{noteId}}` with the token. Test that the title is
   the one you sent.
4. **No token**: `GET /notes` with no `Authorization` header. Test that it's
   rejected with `401`.

The validator runs your collection with newman against the real API, then
against broken versions of it, and expects your tests to catch each break.

## Run it
```bash
npm start          # terminal 1: the API on :5055
npm test           # terminal 2: newman run collection.json ...
```

## Hints
- You can build the requests in the Postman app and export them
  (**Export → Collection v2.1**), or edit the JSON by hand. Copy the shape of
  the `Health` item.
- A JSON body in v2.1 looks like this:
  `"body": { "mode": "raw", "raw": "{\"title\":\"Buy milk\"}", "options": { "raw": { "language": "json" } } }`.
  Add a `Content-Type: application/json` header too.
- Headers: `"header": [{ "key": "Authorization", "value": "Bearer {{token}}" }]`.
  Or use `"auth": { "type": "bearer", "bearer": [{ "key": "token", "value": "{{token}}" }] }`.
- Requests run top to bottom, so put Login first.

## Check your work
```
./onboard validate testing/04
```
