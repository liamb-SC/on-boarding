# 01 · Dependencies, semver and the lockfile

**Skills:** `npm install`, `--save-exact`, `-D` (devDependencies), semver ranges,
`package-lock.json`, `npm ci`, `npm pkg set`, what to commit.

## Background
- **dependencies** are needed at runtime. **devDependencies** are only needed
  to build, test or lint. Production installs (`npm ci --omit=dev`) skip them.
- **Semver ranges** say which versions are acceptable:
  | Range | Accepts |
  |-------|---------|
  | `2.1.3` | exactly 2.1.3 |
  | `~2.1.3` | 2.1.x patches |
  | `^2.1.3` | 2.x.x minors + patches (the npm default) |
  | `*` | anything, including a breaking 3.0.0 ☠️ |
- The **lockfile** (`package-lock.json`) records the exact version of every
  package in the tree. Commit it, so every machine and CI run installs the same
  thing. `npm ci` installs exactly what the lockfile says and fails if it
  doesn't match `package.json`. That's what CI should use.
- **Never commit `node_modules`.** It's big, platform-specific and fully
  reproducible from the lockfile.

## Scenario
`duration-tool` prints how many milliseconds are in 2 hours. Its
`package.json` has two mistakes: `ms` accepts **any** version, and the build
tool `esbuild` is listed as a runtime dependency.

## Goal
1. Pin `ms` to exactly `2.1.3`.
2. Move `esbuild` to `devDependencies`.
3. Add a `start` script: `node index.js`.
4. Install, check `npm start` prints `7200000`.
5. Ignore `node_modules`, then commit `package.json`, `package-lock.json` and
   `.gitignore`. Leave the working tree clean.

## Hints
- `npm install ms@2.1.3 --save-exact`
- `npm install -D esbuild` moves an existing dependency into devDependencies.
- `npm pkg set scripts.start="node index.js"` edits package.json safely.
- `npm ls` shows the installed tree. `npm ls --omit=dev` shows only what
  production gets.
- Afterwards, try `rm -rf node_modules && npm ci` to see a clean, reproducible
  install.

## Check your work
```
./onboard validate package-managers/01
```
