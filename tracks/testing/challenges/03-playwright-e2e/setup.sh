#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

sandbox_reset
cp -R "$(dirname "${BASH_SOURCE[0]}")/starter/." "$SANDBOX_DIR/"
printf 'node_modules/\ntest-results/\nplaywright-report/\n' | put .gitignore
put package.json <<'JSON'
{
  "name": "todo-e2e",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node server.mjs",
    "test": "playwright test",
    "test:ui": "playwright test --ui"
  },
  "devDependencies": {
    "@playwright/test": "^1.50.0"
  }
}
JSON

npm_install_sandbox

# Playwright drives a real browser, which is a separate ~150 MB download.
printf 'Installing the Chromium build Playwright uses (skipped if already cached)...\n'
if ! in_sandbox npx playwright install chromium >/dev/null 2>&1; then
  printf '✗ Could not download Chromium for Playwright. Run this yourself in the sandbox:\n' >&2
  printf '    npx playwright install chromium\n' >&2
  printf '  On a fresh Linux/WSL machine you may also need its system libraries:\n' >&2
  printf '    sudo npx playwright install-deps chromium\n' >&2
  exit 1
fi
sb_commit_all "Todo app with one e2e test"
