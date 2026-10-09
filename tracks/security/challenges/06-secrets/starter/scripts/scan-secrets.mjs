// A tiny gitleaks-style secret scanner. Run it from the repo root:
//   node scripts/scan-secrets.mjs
// It scans every file git tracks, prints one line per finding
//   <file>:<line> <rule-id>
// and exits 1 if it found anything, 0 if the repo is clean.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// TODO 1: rules. Each is { id, regex }. You need at least:
//   stripe-live-key      sk_live_ followed by 16+ letters/digits
//   aws-access-key-id    AKIA followed by exactly 16 uppercase letters/digits
//   private-key          a "-----BEGIN ... PRIVATE KEY-----" line
//   generic-secret       password / secret / api_key / token assigned a quoted
//                        literal of 8+ characters, e.g.  password: "hunter2hunter2"
const RULES = [];

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const findings = [];

for (const file of files) {
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { continue; } // deleted but still tracked, etc.
  // TODO 2: check every line against every rule and push `${file}:${lineNo} ${rule.id}`
  // (line numbers start at 1).
}

// TODO 3: print the findings and exit with the right code.
console.log('no secrets found');
