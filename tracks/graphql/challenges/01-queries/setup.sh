#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

sandbox_reset
cp -R "$REPO_ROOT/tracks/graphql/fixtures/." "$SANDBOX_DIR/"
printf 'node_modules/\n' | put .gitignore

for f in 01-titles 02-book-with-author 03-author-books 04-compare; do
  printf '# Write your query here\n' | put "queries/$f.graphql"
done
printf '{}\n' | put queries/03-author-books.variables.json

npm_install_sandbox
sb_commit_all "Library GraphQL API"
