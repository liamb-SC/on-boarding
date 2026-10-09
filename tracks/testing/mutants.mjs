// Helpers shared by the testing track's check.mjs validators.
//
// The question a test suite has to answer is "would you notice if the code
// broke?". So besides running the learner's tests against the real code, the
// validators run them against deliberately broken copies (mutants) and expect
// them to FAIL. Each mutant runs in a throwaway copy of the sandbox, so the
// learner's files are never touched.
import { spawn } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { SANDBOX } from '../../lib/checks.mjs';

// run(cmd, args, { cwd, env, timeout }) -> { code, out }
export function run(cmd, args, { cwd = SANDBOX, env = {}, timeout = 60000 } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env: { ...process.env, CI: '1', FORCE_COLOR: '0', ...env } });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    const timer = setTimeout(() => { out += `\n(timed out after ${timeout / 1000}s)`; child.kill('SIGKILL'); }, timeout);
    child.on('close', (code) => { clearTimeout(timer); resolve({ code: code ?? 1, out }); });
  });
}

// withCopy(replacements, fn) — copy the sandbox (minus node_modules and .git,
// which is linked instead), overwrite files with `replacements`
// ({ 'src/cart.js': '...' }), call fn(dir), then delete the copy.
export async function withCopy(replacements, fn) {
  const dir = mkdtempSync(path.join(tmpdir(), 'onboard-mutant-'));
  try {
    for (const name of readdirSync(SANDBOX)) {
      if (name === '.git') continue;
      if (name === 'node_modules') symlinkSync(path.join(SANDBOX, name), path.join(dir, name), 'dir');
      else cpSync(path.join(SANDBOX, name), path.join(dir, name), { recursive: true });
    }
    for (const [file, content] of Object.entries(replacements)) writeFileSync(path.join(dir, file), content);
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// The last few meaningful lines of a test run, for a ✗ detail.
export const tail = (out, n = 4) => out.split('\n').map((l) => l.trim()).filter(Boolean).slice(-n).join(' | ');
