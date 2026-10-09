# 03 · pnpm and phantom dependencies

**Skills:** `pnpm-workspace.yaml`, the `workspace:` protocol, `--filter`,
pnpm's strict `node_modules`, phantom dependencies.

## Background
npm (and yarn classic) **hoist** packages into one flat `node_modules`. That
means your code can `require` a package it never declared, as long as
something else in the tree depends on it. This is a **phantom dependency**. It
works until the package that pulled it in drops it, and then your app breaks
for no obvious reason.

**pnpm** installs every package once into a content-addressed store
(`node_modules/.pnpm`) and gives each package **only the dependencies it
declares**. It's faster and uses far less disk, and phantom dependencies fail
straight away instead of in production.

pnpm workspaces differ from npm's:
- They're listed in **`pnpm-workspace.yaml`**. pnpm ignores the `workspaces`
  field in `package.json`.
- Local packages are referenced with the **`workspace:` protocol**
  (`"@demo/utils": "workspace:*"`), which can only ever resolve to the local
  copy. A plain `"1.0.0"` makes pnpm look in the npm registry.

## Scenario
```
packages/utils   @demo/utils
packages/ui      @demo/ui   -> depends on @demo/utils
apps/web         @demo/web  -> depends on @demo/ui
                               ...but ALSO require('@demo/utils') directly
```
This works under npm, but only by accident.

## Goal
1. Convert the repo to a pnpm workspace (`pnpm-workspace.yaml`).
2. Switch internal dependencies to the `workspace:` protocol.
3. `pnpm install`, then `pnpm --filter @demo/web start`. It should fail on
   the phantom dependency.
4. Fix it properly: **declare** `@demo/utils` as a dependency of `@demo/web`.
   (Deleting the `require` doesn't count.)
5. Make sure there's no `package-lock.json`.

## Hints
- `pnpm-workspace.yaml`:
  ```yaml
  packages:
    - "packages/*"
    - "apps/*"
  ```
- `pnpm add @demo/utils --workspace --filter @demo/web` adds a local package
  with `workspace:*` for you.
- `pnpm why @demo/utils` shows who depends on it.
- Compare `ls node_modules` here with an npm install. pnpm's root is almost
  empty.

## Check your work
```
./onboard validate package-managers/03
```
