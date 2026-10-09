#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

sandbox_reset
cp -R "$(dirname "${BASH_SOURCE[0]}")/starter/." "$SANDBOX_DIR/"
cp "$REPO_ROOT/tracks/web-basics/fixtures/static-server.mjs" "$SANDBOX_DIR/server.mjs"
printf 'node_modules/\n' | put .gitignore
# jsdom is only here for the validator.
put package.json <<'JSON'
{
  "name": "trail-runner",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node server.mjs"
  },
  "dependencies": {
    "web-vitals": "^5.0.0"
  },
  "devDependencies": {
    "jsdom": "^26.0.0"
  }
}
JSON

put answers.json <<'JSON'
{
  "lcpGoodSeconds": null,
  "clsGood": null,
  "inpGoodMs": null,
  "lazyHeroImage": "",
  "imageWithoutDimensions": "",
  "blockingScript": "",
  "lateBanner": "",
  "slowClickHandler": ""
}
JSON

npm_install_sandbox
sb_commit_all "Trail Runner product page (slow)"
