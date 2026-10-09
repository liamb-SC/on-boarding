import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { check, expect, SANDBOX, watchdog } from '../../../../lib/checks.mjs';

watchdog(30000);
// The values setup.sh committed (split so scanners don't flag this repo).
const STRIPE = 'sk_' + 'live_' + '51NfAkEk3yN0tR3aLx9Q2wErTyUi';
const DB_PASS = 'Corr3ct-H0rse-' + 'Battery';
const JWT = '9f2c7e1a5b8d4f60' + 'a3c2e9d7b1f4a6c8';
const VARS = ['DATABASE_URL', 'STRIPE_SECRET_KEY', 'JWT_SECRET'];

const git = (args, cwd = SANDBOX) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const tracked = (f) => spawnSync('git', ['ls-files', '--error-unmatch', f], { cwd: SANDBOX }).status === 0;

// ----- the repo itself ----------------------------------------------------------
await check('none of the old secret values are in any committed file', () => {
  for (const [name, v] of [['Stripe key', STRIPE], ['database password', DB_PASS], ['JWT secret', JWT]]) {
    const hit = spawnSync('git', ['grep', '-l', '-F', v, 'HEAD'], { cwd: SANDBOX, encoding: 'utf8' }).stdout.trim();
    expect(!hit, `the ${name} is still committed in ${hit}`);
  }
});
await check('.env exists with DATABASE_URL, STRIPE_SECRET_KEY and JWT_SECRET set', () => {
  const file = path.join(SANDBOX, '.env');
  expect(existsSync(file), 'no .env file');
  const env = readFileSync(file, 'utf8');
  for (const v of VARS) expect(new RegExp(`^\\s*${v}\\s*=\\s*\\S`, 'm').test(env), `${v} is missing or empty in .env`);
});
await check('.env is git-ignored and not tracked', () => {
  expect(spawnSync('git', ['check-ignore', '-q', '.env'], { cwd: SANDBOX }).status === 0, 'add .env to .gitignore');
  expect(!tracked('.env'), '.env is committed: git rm --cached .env');
});
await check('.env.example is committed, lists every variable, and has no real values', () => {
  expect(tracked('.env.example'), '.env.example is not committed');
  const ex = git(['show', 'HEAD:.env.example']);
  for (const v of VARS) expect(new RegExp(`^\\s*${v}\\s*=`, 'm').test(ex), `${v} is missing from .env.example`);
  for (const s of [STRIPE, DB_PASS, JWT]) expect(!ex.includes(s), '.env.example contains a real secret');
});

// ----- config.js ------------------------------------------------------------------------
const loadConfig = (env, cwd = SANDBOX) => spawnSync(process.execPath, ['--input-type=module', '-e',
  `const { config } = await import(${JSON.stringify(path.join(SANDBOX, 'config.js'))}); console.log(JSON.stringify(config));`],
  { cwd, encoding: 'utf8', env: { PATH: process.env.PATH, ...env } });

await check('config.js reads its secrets from the environment', () => {
  const r = loadConfig({ DATABASE_URL: 'postgres://u:p@h:1/d', STRIPE_SECRET_KEY: 'from-env-stripe', JWT_SECRET: 'from-env-jwt' });
  expect(r.status === 0, `importing config.js failed: ${r.stderr.trim().split('\n').slice(-1)}`);
  const c = JSON.parse(r.stdout.trim().split('\n').pop());
  expect(c.stripeKey === 'from-env-stripe' && c.jwtSecret === 'from-env-jwt' && c.databaseUrl === 'postgres://u:p@h:1/d',
    `config is ${JSON.stringify(c)}`);
});
await check('config.js loads .env (npm start works with no exported variables)', () => {
  const r = loadConfig({});
  expect(r.status === 0, `importing config.js failed: ${r.stderr.trim().split('\n').slice(-1)}`);
  const c = JSON.parse(r.stdout.trim().split('\n').pop());
  for (const k of ['databaseUrl', 'stripeKey', 'jwtSecret']) expect(c[k], `config.${k} is empty`);
});
await check('config.js fails fast, naming the missing variables, when there is no .env', () => {
  const env = path.join(SANDBOX, '.env');
  const hidden = path.join(SANDBOX, '.env.onboard-check');
  const had = existsSync(env);
  if (had) renameSync(env, hidden);
  try {
    const r = loadConfig({ JWT_SECRET: 'only-this-one' }, tmpdir());
    expect(r.status !== 0, 'config.js loaded with no DATABASE_URL / STRIPE_SECRET_KEY: throw an Error instead');
    expect(r.stderr.includes('DATABASE_URL') && r.stderr.includes('STRIPE_SECRET_KEY'),
      `the error should name DATABASE_URL and STRIPE_SECRET_KEY: ${r.stderr.trim().split('\n').find((l) => /Error/.test(l))}`);
  } finally {
    if (had) renameSync(hidden, env);
  }
});

// ----- the scanner ----------------------------------------------------------------------
const scanner = path.join(SANDBOX, 'scripts', 'scan-secrets.mjs');
function scanRepo(files, untracked = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'scan-'));
  try {
    git(['init', '-q'], dir);
    for (const [f, text] of Object.entries(files)) writeFileSync(path.join(dir, f), text);
    git(['add', '-A'], dir);
    for (const [f, text] of Object.entries(untracked)) writeFileSync(path.join(dir, f), text);
    const r = spawnSync(process.execPath, [scanner], { cwd: dir, encoding: 'utf8' });
    return { code: r.status, out: r.stdout + r.stderr };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const leak = (rule, file, text, line) => check(`scanner catches ${rule} and reports ${file}:${line}`, () => {
  const { code, out } = scanRepo({ 'ok.js': 'export const x = process.env.X;\n', [file]: text });
  expect(code === 1, `exit code ${code}, expected 1. Output: ${out}`);
  expect(out.includes(`${file}:${line}`), `output should include ${file}:${line}. Got: ${out}`);
});

await leak('a Stripe live key', 'billing.js', `// billing\nconst key = '${'sk_' + 'live_'}9aZ8bY7cX6dW5eV4fU3gT2';\n`, 2);
await leak('an AWS access key id', 'deploy.sh', `#!/bin/sh\n\nexport AWS_ACCESS_KEY_ID=${'AK' + 'IA'}QX7RZ2M4T6V8W0Y3\n`, 3);
await leak('a private key', 'id_rsa', `${'-----BEGIN ' + 'RSA PRIVATE KEY-----'}\nMIIEowIBAAKCAQEA\n-----END RSA PRIVATE KEY-----\n`, 1);
await leak('a hard-coded password', 'db.js', `const db = connect({\n  host: 'db',\n  password: "pr0d-${'passw'}0rd-42",\n});\n`, 3);
await check('scanner exits 0 on a clean repo (env lookups and empty .env.example are fine)', () => {
  const { code, out } = scanRepo({
    'config.js': 'export const secret = process.env.JWT_SECRET;\nconst password = process.env.DB_PASSWORD;\n',
    '.env.example': 'JWT_SECRET=\nDB_PASSWORD=\n',
  });
  expect(code === 0, `exit code ${code}. Output: ${out}`);
});
await check('scanner only looks at tracked files (an ignored local .env is fine)', () => {
  const { code, out } = scanRepo({ '.gitignore': '.env\n' }, { '.env': `STRIPE_SECRET_KEY=${'sk_' + 'live_'}9aZ8bY7cX6dW5eV4fU3gT2\n` });
  expect(code === 0, `exit code ${code}. Output: ${out}`);
});
await check('your own repo passes your scanner (npm run scan)', () => {
  const r = spawnSync(process.execPath, [scanner], { cwd: SANDBOX, encoding: 'utf8' });
  expect(r.status === 0, `exit code ${r.status}: ${r.stdout.trim()}`);
});
await check('everything is committed (clean working tree)', () => {
  expect(!git(['status', '--porcelain']).trim(), 'uncommitted changes: commit your work');
});
