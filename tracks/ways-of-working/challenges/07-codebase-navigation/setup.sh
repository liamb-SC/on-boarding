#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."

# The learner's answers live outside the code repo, which is a realistic,
# multi-author history of beacon-worker.
rm -rf "$SANDBOX_DIR"
mkdir -p "$SANDBOX_DIR"
SANDBOX_DIR="$SANDBOX_DIR/beacon-worker" sandbox_reset
REPO="$SANDBOX_DIR/beacon-worker"

# commit_as "<Name>" <date> <message...> — commit everything as a team member.
commit_as() {
  local who="$1" when="$2"; shift 2
  local email; email="$(printf '%s' "$who" | tr 'A-Z ' 'a-z.')@brightwell.example"
  git -C "$REPO" add -A
  GIT_AUTHOR_NAME="$who" GIT_AUTHOR_EMAIL="$email" GIT_AUTHOR_DATE="$when" \
  GIT_COMMITTER_NAME="$who" GIT_COMMITTER_EMAIL="$email" GIT_COMMITTER_DATE="$when" \
    git -C "$REPO" commit -q "$@"
}
w() { mkdir -p "$(dirname "$REPO/$1")"; cat > "$REPO/$1"; }

# config.js at each stage of its life: (retries, timeout)
config() {
  w src/config.js <<JS
// Runtime configuration for beacon-worker. Everything comes from the environment.
export const config = {
  baseUrl: process.env.TEXTBRIDGE_BASE_URL ?? 'https://api.textbridge.example/v1',
  apiKeySecret: 'beacon/textbridge-api-key', // AWS Secrets Manager id
  timeoutMs: Number(process.env.TEXTBRIDGE_TIMEOUT_MS ?? $2),
  maxRetries: $1,
  queueUrl: process.env.${3:-QUEUE_URL},
};
JS
}

config 5 10000
w package.json <<'JSON'
{
  "name": "beacon-worker",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": { "start": "node src/worker.js", "test": "node --test" }
}
JSON
w src/send.js <<'JS'
import { config } from './config.js';

// POST one text to TextBridge. Throws on a non-2xx response.
export async function sendText({ to, body }) {
  const res = await fetch(`${config.baseUrl}/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ to, body }),
    signal: AbortSignal.timeout(config.timeoutMs),
  });
  if (!res.ok) throw new Error(`TextBridge responded ${res.status}`);
}
JS
w src/worker.js <<'JS'
import { config } from './config.js';
import { sendText } from './send.js';

// Handle one SQS message: try to send, retry, and give up to the DLQ.
export async function handle(message) {
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await sendText(message);
    } catch (err) {
      if (attempt === config.maxRetries) return sendToDeadLetter(message, err);
    }
  }
}

export async function sendToDeadLetter(message, err) {
  console.error('giving up on message', message.id, err.message);
}
JS
w src/legacy/smsport.js <<'JS'
// Old SMSPort client, kept until the cut-over. Do not use for new code.
export const SMSPORT_TIMEOUT_MS = 10000;
export const SMSPORT_URL = process.env.SMSPORT_URL;
JS
commit_as "Tom Okafor" "2026-10-07T10:00:00" -m "Initial beacon-worker skeleton"

config 5 10000 BEACON_QUEUE_URL
commit_as "Dan Lee" "2026-10-08T14:30:00" -m "Read the queue URL from BEACON_QUEUE_URL"

w src/phone.js <<'JS'
// Normalise a UK phone number to E.164 (+447700900123), or return null.
export function toE164(raw) {
  const digits = String(raw).replace(/[^\d+]/g, '');
  if (/^\+44\d{10}$/.test(digits)) return digits;
  if (/^0\d{10}$/.test(digits)) return `+44${digits.slice(1)}`;
  return null;
}
JS
w test/phone.test.js <<'JS'
import assert from 'node:assert/strict';
import test from 'node:test';
import { toE164 } from '../src/phone.js';

test('07700 900123 becomes +447700900123', () => assert.equal(toE164('07700900123'), '+447700900123'));
JS
commit_as "Ben Morris" "2026-10-09T11:15:00" -m "Add toE164 phone normaliser with tests"

config 3 10000 BEACON_QUEUE_URL
commit_as "Tom Okafor" "2026-10-12T16:05:00" -m "Lower max retries" \
  -m "Retry storms during the load test tripped TextBridge's 50 msg/s rate limit. Details in BEA-42."

w src/log.js <<'JS'
// Never log a full phone number: keep the last 3 digits only.
export const redact = (phone) => String(phone).replace(/.(?=.{3})/g, '*');
JS
commit_as "Sofia Ruiz" "2026-10-13T09:40:00" -m "Redact phone numbers in logs"

config 3 4000 BEACON_QUEUE_URL
commit_as "Dan Lee" "2026-10-14T13:20:00" -m "Tighten the TextBridge timeout" \
  -m "A hung request held a worker slot for 10s. p99 latency is 900ms, so 4s is plenty. BEA-51."

w src/templates.js <<'JS'
// Text templates, one per notification type. {orderId} is filled in at send time.
export const templates = {
  shipped: 'Your Brightwell order {orderId} has shipped.',
  out_for_delivery: 'Your Brightwell order {orderId} is out for delivery today.',
};
JS
commit_as "Tom Okafor" "2026-10-15T10:10:00" -m "Add message templates"

w test/phone.test.js <<'JS'
import assert from 'node:assert/strict';
import test from 'node:test';
import { toE164 } from '../src/phone.js';

test('07700 900123 becomes +447700900123', () => assert.equal(toE164('07700 900123'), '+447700900123'));
test('junk is rejected', () => assert.equal(toE164('call me'), null));
JS
commit_as "Ben Morris" "2026-10-16T15:00:00" -m "Test toE164 with spaces and junk"

put answers.json <<'JSON'
{
  "q1_base_url_env_var": "",
  "q2_phone_normaliser_file": "",
  "q3_textbridge_timeout_ms": "",
  "q4_timeout_last_changed_by": "",
  "q5_retries_ticket": "",
  "q6_redaction_commit": "",
  "q7_commits_by_ben": "",
  "q8_dead_letter_function": ""
}
JSON
put questions.md <<'MD'
# Questions about beacon-worker

Answer in `answers.json`. Each answer is a short string. Investigate the repo in
`beacon-worker/` with grep and git. Don't guess.

1. **q1_base_url_env_var**: Which environment variable sets the TextBridge API base URL?
2. **q2_phone_normaliser_file**: Which file (path from the repo root, e.g. `src/x.js`)
   defines the function that converts phone numbers to E.164?
3. **q3_textbridge_timeout_ms**: What is the *default* timeout, in milliseconds, for
   calls to TextBridge in the current code?
4. **q4_timeout_last_changed_by**: Who last changed the line that sets that timeout?
   (Full name.)
5. **q5_retries_ticket**: Max retries was lowered at some point. Which ticket
   (e.g. `BEA-99`) explains why?
6. **q6_redaction_commit**: The commit hash (at least 7 characters) that introduced
   phone-number redaction in logs.
7. **q7_commits_by_ben**: How many commits has Ben Morris authored?
8. **q8_dead_letter_function**: In `src/worker.js`, which function is called when a
   message has used up all its retries?
MD
