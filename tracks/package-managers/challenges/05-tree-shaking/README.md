# 05 · Tree shaking

**Skills:** ES modules vs CommonJS, named imports, the `"sideEffects"` field,
reading a bundle, esbuild.

## Background
**Tree shaking** is when a bundler leaves out code you import but never use.
It only works if the bundler can prove at build time what's used, which
needs two things:

1. **ES modules** (`import`/`export`). Their imports and exports are static,
   so the bundler can see exactly which exports are used. CommonJS
   (`require`/`module.exports`) is just runtime JavaScript. The bundler can't
   safely remove any of it, so it includes everything and wraps it in
   `__commonJS(...)`.
2. **No side effects, or a declaration that there are none.** If a module does
   something when it's merely imported (sets a global, registers a plugin,
   imports CSS), the bundler has to keep it even when none of its exports are
   used. A library adds `"sideEffects": false` to its `package.json` to
   promise *"importing my files does nothing on its own. If you don't use an
   export, you can drop it."*

This is why libraries ship ESM and set `sideEffects`, why you'd write
`import { debounce } from 'lodash-es'` instead of `require('lodash')`, and why
a "tiny" import can sometimes add hundreds of KB to a frontend.

## Scenario
`@demo/shop` only calls `formatPrice`, but `dist/shop.mjs` includes all of
`@demo/utils`, including `chart.js` (the "heavy chart engine").

## Goal
1. `npm install`, `npm run build`, then look at `dist/shop.mjs`. Find
   `HEAVY_CHART_ENGINE` and the `__commonJS` wrappers.
2. Convert `@demo/utils` (all three files) and `@demo/shop` to **ES
   modules**, using named `import { formatPrice }`.
3. Rebuild. `renderChart` should disappear, but the `globalThis` side
   effect in `chart.js` is still there. Why?
4. Add `"sideEffects": false` to `@demo/utils`'s `package.json` and rebuild.
5. The bundle still prints `£19.99` and has no chart code.

Don't edit `chart.js`, and keep `renderChart` exported from `@demo/utils`.
Other apps might use it.

## Hints
- Add `"type": "module"` to a package's `package.json` so Node treats its
  `.js` files as ESM.
- In ESM, relative imports need the file extension:
  `export { formatPrice } from './format.js';`
- `npx esbuild apps/shop/index.js --bundle --platform=node --format=esm --analyze`
  (without `--outfile`) prints what's in the bundle and how big each part is.
- `ls -l dist/` before and after shows the saving.

## Check your work
```
./onboard validate package-managers/05
```
