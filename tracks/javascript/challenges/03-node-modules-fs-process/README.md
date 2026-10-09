# 03 · Node.js: modules, fs and process

**Skills:** ES modules (`import`/`export`), `node:fs/promises`,
`process.argv`, `process.exitCode`, stdout vs stderr.

## Background
- **Modules.** With `"type": "module"` in `package.json`, `.js` files are ES
  modules: `export function x() {}` in one file, `import { x } from
  './lib/x.js'` in another. Relative imports need the `.js` extension. Built-ins
  use the `node:` prefix: `import { readFile } from 'node:fs/promises'`.
- **fs.** `node:fs/promises` gives you `readdir`, `readFile`, `stat`, ... as
  Promises, so they don't block the process while the disk works. The `*Sync`
  versions block everything until they finish. They're fine in a one-off
  script, but avoid them in a server.
  `readdir(dir, { withFileTypes: true })` tells you which entries are files.
- **process.** `process.argv` is `[node, script, ...args]`.
  `console.log` writes to stdout, which is for **data**. `console.error`
  writes to stderr, which is for **messages to a human**. Set
  `process.exitCode = 1` to fail. It's gentler than `process.exit(1)`, which
  can cut off output that hasn't been written yet.

## Scenario
`log-stats` should summarise a folder of log files. `lib/stats.js` holds stub
functions and `cli.js` is empty.

## Goal
1. In `lib/stats.js`:
   - `countErrors(text)` returns how many **lines** contain `ERROR`.
   - `async summarize(dir)` reads every regular file ending in `.log` directly
     inside `dir` (not subfolders) and returns `{ files, lines, errors }`.
     `lines` counts non-empty lines. Use `node:fs/promises`.
2. `cli.js` imports `summarize` from `./lib/stats.js`, and:
   - `node cli.js <dir>` prints the summary as JSON on stdout and exits `0`.
   - with no argument, prints `usage: node cli.js <dir>` on stderr and exits `2`.
   - if the directory can't be read, prints a one-line error on stderr and
     exits `1`, without an uncaught stack trace.

`npm start` runs it on the sample `logs/` folder and should print
`{"files":2,"lines":7,"errors":3}`.

## Hints
- `text.split('\n').filter(Boolean)` gives you the non-empty lines.
- `entry.isFile() && entry.name.endsWith('.log')` filters a `withFileTypes`
  listing.
- Top-level `await` works in ES modules, so `cli.js` doesn't need an
  `async function main()`. Wrap the call in `try/catch`.
- `echo $?` right after a command shows its exit code.

## Check your work
```
./onboard validate javascript/03
```
