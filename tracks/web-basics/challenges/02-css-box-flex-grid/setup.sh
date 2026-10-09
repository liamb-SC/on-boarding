#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

sandbox_reset
printf 'node_modules/\n' | put .gitignore
# jsdom is only here for the validator, which computes your styles with it.
put package.json <<'JSON'
{
  "name": "snapshots",
  "version": "1.0.0",
  "private": true,
  "devDependencies": {
    "jsdom": "^26.0.0"
  }
}
JSON
cp "$(dirname "${BASH_SOURCE[0]}")/page.html" "$SANDBOX_DIR/index.html"

put styles.css <<'CSS'
/* Some looks to start with. Add your layout rules below. */
body { font: 16px/1.5 system-ui, sans-serif; margin: 0; background: #f4f4f5; }
.site-header { background: #18181b; color: #fff; padding: 12px 24px; }
.site-header a { color: inherit; text-decoration: none; }
.logo { font-weight: bold; font-size: 1.25rem; }
.card { background: #fff; border-color: #d4d4d8; border-style: solid; }
.tile { background: #a5b4fc; min-height: 120px; display: grid; place-items: center; font-size: 2rem; }

/* 1. Box model */

/* 2. Flexbox: the header and its nav */

/* 3. Grid: the gallery */
CSS

put box-model.json <<'JSON'
{
  "contentBoxWidth": null,
  "borderBoxWidth": null,
  "borderBoxContentWidth": null,
  "contentBoxSpaceTaken": null
}
JSON

npm_install_sandbox
sb_commit_all "Snapshots page, unstyled layout"
