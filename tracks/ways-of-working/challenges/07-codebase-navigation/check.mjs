import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { check, expect, SANDBOX } from '../../../../lib/checks.mjs';
import { read } from '../../wow-checks.mjs';

let answers = {};
await check('answers.json is valid JSON', () => { answers = JSON.parse(read('answers.json')); });

// Answers are compared as hashes so the expected values aren't sitting in plain
// sight. Normalised first: trimmed, lower-case, no quotes/backticks, no "./", no "()".
const clean = (v) => String(v ?? '').trim().toLowerCase().replace(/[`'"]/g, '').replace(/^\.\//, '').replace(/\(\)$/, '');
const hash = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const answer = (key) => {
  const v = clean(answers[key]);
  expect(v, 'not answered yet');
  return v;
};
const hashed = (key, desc, ok, hint) => check(desc, () => {
  expect(ok.includes(hash(answer(key))), hint);
});

await hashed('q1_base_url_env_var', 'q1: the env var for the TextBridge base URL', ['2b9e2b95a43b6a44'],
  'try: grep -rn baseUrl src/');
await hashed('q2_phone_normaliser_file', 'q2: the file that defines the E.164 normaliser', ['97ac98ffe37dcd79'],
  'grep for E164 and look for where the function is *defined*, not imported. Give the path from the repo root');
await hashed('q3_textbridge_timeout_ms', 'q3: the default TextBridge timeout in the current code', ['b090147020e03353'],
  'careful: there are two timeouts in the repo, and only one is for TextBridge');
await hashed('q4_timeout_last_changed_by', 'q4: who last changed the timeout line', ['1be50b331a3762ac'],
  'git blame -L <start>,<end> <file> (full name)');
await hashed('q5_retries_ticket', 'q5: the ticket explaining why max retries was lowered', ['ec3ff93899e02747'],
  'git log -S maxRetries (or -G) finds commits that changed it. Read the commit body');
await check('q6: the commit that introduced phone-number redaction in logs', () => {
  const sha = answer('q6_redaction_commit');
  expect(/^[0-9a-f]{7,40}$/.test(sha), `"${sha}" isn't a commit hash (7+ hex characters)`);
  let subject;
  try {
    subject = execFileSync('git', ['-C', path.join(SANDBOX, 'beacon-worker'), 'log', '-1', '--format=%s', `${sha}^{commit}`],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { throw new Error(`no commit ${sha} in beacon-worker`); }
  expect(subject === 'Redact phone numbers in logs', `${sha} is "${subject}". Try git log -S redact`);
});

await hashed('q7_commits_by_ben', 'q7: number of commits authored by Ben Morris', ['d4735e3a265e16ee'],
  'git shortlog -sn, or git log --author');
await hashed('q8_dead_letter_function', 'q8: the function called when retries run out', ['a0360759654f7b10'],
  'read handle() in src/worker.js');
