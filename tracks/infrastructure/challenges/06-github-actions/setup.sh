#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

sandbox_reset
printf 'node_modules/\n' | put .gitignore
put package.json <<'JSON'
{
  "name": "price-utils",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  },
  "devDependencies": {
    "yaml": "^2.5.0"
  }
}
JSON
put src/price.js <<'JS'
// Format an integer amount of pence as pounds, e.g. 1999 -> "£19.99".
export function formatPence(pence) {
  const sign = pence < 0 ? '-' : '';
  const abs = Math.abs(pence);
  return `${sign}£${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}
JS
put test/price.test.js <<'JS'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatPence } from '../src/price.js';

test('formats pence as pounds', () => {
  assert.equal(formatPence(1999), '£19.99');
  assert.equal(formatPence(5), '£0.05');
  assert.equal(formatPence(-250), '-£2.50');
});
JS
put .github/workflows/ci.yml <<'YAML'
name: CI

# TODO: run on pushes to main, and on every pull request
on: {}

jobs:
  test:
    runs-on: ubuntu-latest
    # TODO: a matrix that runs this job on Node 20 and Node 22
    # TODO: steps: check out the code, set up Node (with npm caching),
    #       install from the lockfile, run the tests
    steps:
      - run: echo "replace me"
YAML

npm_install_sandbox   # creates package-lock.json (and installs yaml, used by the validator)
sb_commit_all "price-utils with a CI workflow to finish"
