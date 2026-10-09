#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

sandbox_reset
cp -R "$REPO_ROOT/tracks/graphql/fixtures/." "$SANDBOX_DIR/"
printf 'node_modules/\n' | put .gitignore

for f in 01-add-book 02-rate-book 04-cleanup; do
  printf '# Write your mutation here\n' | put "mutations/$f.graphql"
done
printf '{}\n' | put mutations/01-add-book.variables.json
printf '{}\n' | put mutations/02-rate-book.variables.json
printf '# Replace this line with the extensions.code value from step 3\n' | put mutations/03-error-code.txt

npm_install_sandbox
sb_commit_all "Library GraphQL API"
