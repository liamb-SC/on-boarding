# 05 · HTTPie: friendly HTTP from the terminal

**Skills:** `http` request items (`==` query, `=` string, `:=` raw JSON,
`:` header), `--form`, bearer auth (`-A bearer -a`), `-v` to see the request
too, scripting with `--ignore-stdin`.

## Background
HTTPie is curl for humans. It sends JSON by default and colours the response.
Everything after the URL is a **request item**, and the separator tells it
what kind:

| Item | Means | Example |
|------|-------|---------|
| `name==value` | query string parameter | `q==milk` adds `?q=milk` |
| `name=value` | JSON string field | `title="Buy milk"` |
| `name:=json` | raw JSON (numbers, booleans, arrays) | `done:=true`, `ids:='[1,2]'` |
| `Name:value` | header | `X-Trace:abc` |

```bash
http POST localhost:5055/notes title="Buy milk" -A bearer -a dev-123
http -v GET localhost:5055/health      # -v prints the request as well as the response
http --form POST localhost:5055/feedback rating=5   # form-encoded instead of JSON
```

`localhost:5055` with no scheme means `http://`, and `:5055/health` is
shorthand for localhost.

## Scenario
`npm start` runs a small notes API on `:5055` and prints each request it gets.
Its routes are listed at the top of `notes-api.mjs`. Every `/notes` route needs
`Authorization: Bearer dev-123`.

## Goal
Fill in `commands.sh` with one `http` command per task, always using `"$BASE"`
for the host. Try each one by hand first.

1. Health check (done).
2. `GET /notes` with query parameters `tag=urgent` and `limit=5`, and the token.
3. `POST /notes` with JSON `title` "Buy milk", `priority` as the **number** 2,
   `tags` as the **array** `["home","urgent"]`, the token, and a header
   `X-Request-Id: onboard-1`.
4. `POST /feedback` as a **form** with `rating=5` and a `comment`.
5. `DELETE /notes/1` with the token.

Then save the full request and response of task 3 to `outputs/create.txt`:
`http -v ... > outputs/create.txt`.

The validator runs `commands.sh` against its own copy of the API and checks
what actually arrived.

## Hints
- Watch the `npm start` terminal to see what your commands send.
- `priority=2` sends the string `"2"`. Use `priority:=2` for a number.
- Quote JSON for the shell: `tags:='["home","urgent"]'`.
- Output redirected to a file has no colours, and `-v` still includes both
  sides.
- No httpie? `pipx install httpie` (or `pip install --user httpie`, or
  `brew install httpie`).

## Check your work
```
./onboard validate testing/05
```
