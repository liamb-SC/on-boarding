# 06 · A GitHub Actions CI workflow

**Skills:** workflow YAML, `on: push / pull_request`, jobs and steps, `uses`
vs `run`, `strategy.matrix`, `actions/setup-node` caching, `npm ci`,
`permissions`, pinning action versions.

## Background
A workflow is a YAML file in `.github/workflows/`. GitHub runs it when one
of its **triggers** (`on:`) fires:
```yaml
on:
  push:
    branches: [main]     # pushes to main...
  pull_request:          # ...and every PR
jobs:
  test:                  # a job runs on a fresh VM (runs-on)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4   # `uses` runs a published action
      - run: echo hello             # `run` runs a shell command
```
- A **matrix** runs the same job once per combination, in parallel:
  `strategy: { matrix: { node-version: [20, 22] } }`. You read the value with
  `${{ matrix.node-version }}`.
- **Caching:** every run starts on a clean VM. `actions/setup-node` with
  `cache: npm` restores npm's download cache, keyed on `package-lock.json`.
- **`permissions:`** sets what the job's `GITHUB_TOKEN` can do. Start
  read-only (`contents: read`) and add only what a job needs.
- Pin actions to a version (`@v4`, or a commit SHA for third-party actions),
  never `@main`. Otherwise someone else's push changes your pipeline.

## Scenario
`price-utils` has tests (`npm test`) but its CI workflow is a stub.

## Goal
Finish `.github/workflows/ci.yml` so that:
1. It runs on pushes to `main` and on pull requests.
2. The token is read-only: top-level `permissions: { contents: read }`.
3. The `test` job runs on a **matrix of Node 20 and 22**.
4. Its steps: checkout, `actions/setup-node` using the matrix version with
   **npm caching**, `npm ci`, `npm test`.
5. Commit it.

## Hints
- Indentation is meaning in YAML. `node -e "console.log(JSON.stringify(require('yaml').parse(require('fs').readFileSync('.github/workflows/ci.yml','utf8')), null, 2))"`
  shows how your file parses.
- Want to run it for real? Push to a GitHub repo and watch the Actions tab, or
  run it locally with [`act`](https://github.com/nektos/act)
  (`act pull_request -j test`, needs Docker).
- `actionlint` (if you have it) catches mistakes the YAML parser can't, like
  a typo in `${{ matrix.node-versoin }}`.

## Check your work
```
./onboard validate infrastructure/06
```
