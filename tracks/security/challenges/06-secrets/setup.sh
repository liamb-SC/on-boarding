#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sandbox_reset
cp -R "$HERE/starter/." "$SANDBOX_DIR/"
printf 'node_modules/\n' | put .gitignore

# Fake secrets, split up here so secret scanners (and GitHub push protection)
# don't flag the onboarding repo itself. The learner's sandbox gets them whole.
STRIPE="sk_""live_""51NfAkEk3yN0tR3aLx9Q2wErTyUi"
DB_PASS="Corr3ct-H0rse-""Battery"
JWT="9f2c7e1a5b8d4f60""a3c2e9d7b1f4a6c8"
put config.js <<EOF2
// Service configuration.
export const config = {
  port: 4242,
  databaseUrl: 'postgres://payments:${DB_PASS}@db.internal:5432/payments',
  stripeKey: '${STRIPE}',
  jwtSecret: '${JWT}',
};
EOF2

npm_install_sandbox
sb_commit_all "Payments service config"
