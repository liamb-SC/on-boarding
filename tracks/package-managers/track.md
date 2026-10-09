# Track: Package managers

How JavaScript dependencies are declared, installed, locked, shared across a
monorepo and trimmed out of a bundle, with npm, pnpm and yarn side by side.

## Requirements
- Node.js 20+ with npm.
- pnpm (challenge 03) and yarn 1 (challenge 04). The easiest way to get both is
  `corepack enable`, which ships with Node.
- Network access to the npm registry for challenges 01 and 05. The others only
  use local packages.

## Learning objectives
By the end you can:
- Tell dependencies from devDependencies, read semver ranges, and pin versions.
- Explain what a lockfile is for, commit it, and install from it with `npm ci`.
- Set up workspaces so local packages link to each other with one lockfile.
- Run scripts in one workspace or all of them.
- Explain phantom dependencies and why pnpm's strict layout catches them.
- Use the `workspace:` protocol and `pnpm --filter`.
- Migrate between package managers cleanly, with one lockfile and `packageManager` + corepack.
- Explain why workspace versions must satisfy dependency ranges.
- Get tree shaking working with ES modules and `"sideEffects": false`.

## Challenges (do them in order)
| # | Challenge | Core commands |
|---|-----------|---------------|
| 01 | npm-dependencies | `npm install --save-exact`, `-D`, `npm pkg set`, `npm ls`, `npm ci` |
| 02 | npm-workspaces | `workspaces`, `npm install -w`, `npm run -w`, `--workspaces` |
| 03 | pnpm-phantom-deps | `pnpm-workspace.yaml`, `workspace:*`, `pnpm add --filter`, `pnpm why` |
| 04 | yarn-migration | `yarn install`, `yarn workspace`, `yarn workspaces info`, `packageManager` |
| 05 | tree-shaking | ESM vs CommonJS, `"sideEffects": false`, `esbuild --analyze` |

Start with: `./onboard start package-managers/01`
