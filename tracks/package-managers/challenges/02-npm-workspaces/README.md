# 02 · npm workspaces

**Skills:** the `workspaces` field, `-w/--workspace`, `--workspaces`, linking
local packages, one root lockfile.

## Background
A **monorepo** keeps several packages in one repo, like a shared library and
the apps that use it. **Workspaces** let the package manager treat them as one
project:

- One `npm install` at the root installs everything.
- Local packages are **symlinked** into `node_modules`, so an edit to the
  library is picked up by the app immediately. No publishing needed.
- There's **one lockfile**, at the root.
- You can run a script in one workspace (`-w <name>`) or all of them
  (`--workspaces`).

## Scenario
```
package.json          <- root, knows nothing about the packages below
packages/utils/       <- @demo/utils: exports greet()
apps/cli/             <- @demo/cli: require('@demo/utils')  (undeclared!)
```
Running `node apps/cli/index.js` fails: `Cannot find module '@demo/utils'`.

## Goal
1. Make `packages/*` and `apps/*` workspaces of the root.
2. Declare `@demo/utils` as a dependency of `@demo/cli`.
3. Add a root `start` script that runs `@demo/cli`'s `start` script.
4. `npm start` from the root prints `Hello, StepChange!`.

Run every npm command **from the root**. Running `npm install` inside
`apps/cli` treats it as a separate project, which creates a second lockfile.

## Hints
- `npm pkg set workspaces[]=packages/*` (run once per glob), or edit
  `package.json` by hand.
- `npm install @demo/utils -w @demo/cli` adds a dependency to one workspace.
  npm finds the local package, so nothing is downloaded.
- `npm run start -w @demo/cli` runs a script in one workspace.
- `npm test --workspaces --if-present` runs `test` everywhere that has one.
- `ls -l node_modules/@demo/` shows the symlinks.

## Check your work
```
./onboard validate package-managers/02
```
