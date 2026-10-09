# 03 · OpenAPI and Swagger UI

**Skills:** OpenAPI 3 documents (paths, parameters, request bodies,
responses, `$ref` + `components`), serving docs with `swagger-ui-express`,
keeping the spec in sync with the code.

## Background
An **OpenAPI** document is a machine-readable contract for an HTTP API. It
lists every path and method, the parameters, the request body and the
possible responses, each with a JSON Schema. Tools build on it: Swagger UI
renders interactive docs, generators produce typed clients, and gateways
validate traffic.

```json
"/books/{id}": {
  "get": {
    "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "integer" } }],
    "responses": {
      "200": { "description": "Found", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Book" } } } },
      "404": { "description": "No such book" }
    }
  }
}
```

A spec can be perfectly valid and still be **wrong**: missing a route, missing
the 404 the code really sends, or describing fields that don't exist. Drift
between the spec and the code is the most common problem, so the validator
checks both.

## Scenario
`app.js` is a working Books API with four routes. `openapi.json` only
documents `GET /books`, and its `Book` schema is incomplete.

## Goal
1. Complete `openapi.json` so that it documents **exactly** the routes in
   `app.js` (no more, no less), with:
   - `id` as a required integer path parameter
   - a `requestBody` for `POST /books` that requires `title` and `author`
   - every status code each route can return (`200`/`201`/`204`/`400`/`404`)
   - a `Book` schema that covers every field the API returns
2. Serve the spec at `GET /openapi.json` and Swagger UI at `/docs`.

## Try it
```bash
npm run lint:spec          # is it valid OpenAPI?
npm start                  # then open http://localhost:3000/docs and "Try it out"
```

## Hints
- Put shared shapes in `components.schemas` and point to them with `$ref`.
  You can do the same for a reusable `Error` schema and for the `id`
  parameter (`components.parameters`).
- A `204` response has a `description` and no `content`.
- `app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec))`.

## Check your work
```
./onboard validate backend-apis/03
```
