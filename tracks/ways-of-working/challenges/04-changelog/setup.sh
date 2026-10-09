#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."

sandbox_reset

# commit_as <date> <message...> — commit everything staged-or-not with a fixed
# author date so the history reads like a real project.
commit_as() {
  local when="$1"; shift
  sbg add -A
  GIT_AUTHOR_DATE="$when" GIT_COMMITTER_DATE="$when" sbg commit -q "$@"
}

put package.json <<'JSON'
{
  "name": "beacon-worker",
  "version": "1.3.0",
  "private": true,
  "type": "module",
  "scripts": { "start": "node src/worker.js", "test": "node --test" }
}
JSON
put src/worker.js <<'JS'
// beacon-worker: reads delivery events from SQS and sends texts via TextBridge.
export const TYPES = ['shipped', 'out_for_delivery'];
export function toMessage(event) {
  return { phone: event.phone, type: event.type, orderId: event.orderId };
}
JS
put CHANGELOG.md <<'MD'
# Changelog

All notable changes to beacon-worker are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2026-09-30

### Added
- "Out for delivery" notifications.

### Fixed
- Messages with an empty order ID are rejected instead of crashing the worker.

## [1.2.0] - 2026-09-12

### Added
- Structured JSON logging.

[unreleased]: https://github.com/brightwell/beacon-worker/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/brightwell/beacon-worker/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/brightwell/beacon-worker/compare/v1.1.0...v1.2.0
MD
commit_as "2026-09-30T10:00:00" -m "chore(release): 1.3.0"
sbg tag -a v1.3.0 -m "v1.3.0"

# Work merged since 1.3.0. Some of it belongs in the changelog, some doesn't.
put src/worker.js <<'JS'
// beacon-worker: reads delivery events from SQS and sends texts via TextBridge.
export const TYPES = ['shipped', 'out_for_delivery', 'delivered'];
export function toMessage(event) {
  return { phone: event.phone, type: event.type, orderId: event.orderId };
}
JS
commit_as "2026-10-01T09:12:00" -m "feat: support the \"delivered\" notification type"

printf '// retry 429 Too Many Requests from TextBridge with exponential backoff\nexport const RETRY_STATUSES = [429, 503];\n' | put src/retry.js
commit_as "2026-10-01T15:40:00" -m "fix: retry TextBridge 429 responses with exponential backoff"

printf 'export const lint = true;\n' | put eslint.config.js
commit_as "2026-10-02T11:05:00" -m "chore: bump eslint to 9.12"

put src/worker.js <<'JS'
// beacon-worker: reads delivery events from SQS and sends texts via TextBridge.
export const TYPES = ['shipped', 'out_for_delivery', 'delivered'];
export function toMessage(event) {
  return { to: event.to, type: event.type, orderId: event.orderId };
}
JS
commit_as "2026-10-03T14:20:00" -m "feat!: rename the message field phone to to" \
  -m "BREAKING CHANGE: producers must now send \"to\" instead of \"phone\"."

printf '// POST /v1/send is deprecated: use POST /v2/messages. Removed in 3.0.0.\n' | put src/http.js
commit_as "2026-10-05T10:30:00" -m "feat: add POST /v2/messages and deprecate POST /v1/send"

printf '# beacon-worker\n\nSends delivery texts.\n' | put README.md
commit_as "2026-10-06T09:00:00" -m "docs: fix typo in README"

printf '{ "overrides": { "undici": "6.21.1" } }\n' | put overrides.json
commit_as "2026-10-07T16:45:00" -m "fix(deps): upgrade undici to 6.21.1 for CVE-2025-22150 (security)"

printf 'import test from "node:test";\ntest("backoff", () => {});\n' | put test/retry.test.js
commit_as "2026-10-08T12:00:00" -m "test: cover the retry backoff"

# Remember the 1.3.0 section exactly, so the validator can check it wasn't rewritten.
sb_stash_note base_tag "$(sbg rev-parse v1.3.0)"
