# 04 · Migrating to yarn (and why workspace versions matter)

**Skills:** `yarn install`, `yarn.lock`, `yarn workspace <name> <cmd>`,
`yarn workspaces info`, the `packageManager` field and corepack, workspace
version matching.

## Background
- **One repo, one package manager.** npm, pnpm and yarn each have their own
  lockfile (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`). If you have
  two, they drift apart, and CI and your laptop end up installing different
  things. When you switch, delete the old lockfile.
- The **`packageManager`** field (e.g. `"yarn@1.22.22"`) records which tool and
  version the repo uses. With **corepack** enabled (`corepack enable`),
  running `yarn` or `pnpm` automatically uses that exact version.
- **yarn** reads the same `workspaces` field as npm. A local package is only
  linked if its version **satisfies the dependency range**. If it doesn't,
  yarn looks for the package in the npm registry instead, which usually means a
  404 or, worse, someone else's package with the same name.

> This challenge uses **yarn 1 (classic)**, which still uses `node_modules`.
> Yarn 2+ ("berry") defaults to Plug'n'Play, with no `node_modules` at all.
> That's a topic of its own.

## Scenario
The monorepo is moving from npm to yarn. `@demo/cli` depends on
`@demo/utils@^2.0.0`, but the local `packages/utils` is at **1.4.0**.

## Goal
1. Remove npm's `package-lock.json`.
2. Set `packageManager` to `yarn@1.22.22`.
3. Run `yarn install`. Read the error and work out why yarn went to the
   registry.
4. Fix `@demo/cli`'s range so it matches the local `@demo/utils` (1.4.0), and
   install again.
5. Add a root `start` script that uses `yarn workspace` to run `@demo/cli`'s
   `start`.
6. `yarn start` prints `YARN WORKSPACES!`. Commit your changes.

## Hints
- `git rm package-lock.json`
- `npm pkg set packageManager=yarn@1.22.22` (or edit package.json)
- `yarn workspaces info` shows each workspace and what it links to. Look for
  `mismatchedWorkspaceDependencies`.
- `yarn workspace @demo/cli start` runs a script in one workspace.
- `yarn workspaces run <script>` runs it in every workspace.

## Check your work
```
./onboard validate package-managers/04
```
