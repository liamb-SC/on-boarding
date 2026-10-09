// lib/checks.mjs — assertion kit for validators written in JavaScript.
//
// Each check prints one line, "ok<TAB>desc" or "fail<TAB>desc<TAB>detail",
// which `run_checks` in lib/node.sh turns into the usual ✓/✗ output. Use it
// when checking real behaviour means running the learner's code in-process
// (a GraphQL schema, a gRPC server...) rather than inspecting files.
//
//   import { check, expect, expectEqual, fromSandbox } from '../../../../lib/checks.mjs';
//   await check('GetBook returns the book', async () => { ... throw on failure ... });

import { cpSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

export const SANDBOX = process.env.SANDBOX_DIR;
if (!SANDBOX) throw new Error('SANDBOX_DIR is not set (run via ./onboard validate)');

const oneLine = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, 300);

// check(desc, fn) — run fn (sync or async); it passes unless it throws or returns false.
export async function check(desc, fn) {
  try {
    if ((await fn()) === false) throw new Error('');
    console.log(`ok\t${oneLine(desc)}`);
    return true;
  } catch (e) {
    console.log(`fail\t${oneLine(desc)}\t${oneLine(e?.message ?? e)}`);
    return false;
  }
}

export function expect(cond, msg) {
  if (!cond) throw new Error(msg);
}

// Deep equality on plain JSON values (strips null prototypes, undefined, etc.)
export function expectEqual(actual, expected, label = '') {
  const a = JSON.parse(JSON.stringify(actual ?? null));
  const b = JSON.parse(JSON.stringify(expected ?? null));
  if (!isDeepStrictEqual(a, b)) {
    throw new Error(`${label}expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
  }
}

// fromSandbox(spec) — import a package from the sandbox's node_modules, or a
// file relative to the sandbox root ('./server.js'). Using the sandbox's copy
// of a library keeps one instance shared with the learner's code.
const sandboxRequire = createRequire(path.join(SANDBOX, 'package.json'));
export function fromSandbox(spec) {
  const file = spec.startsWith('.') ? path.join(SANDBOX, spec) : sandboxRequire.resolve(spec);
  return import(pathToFileURL(file).href);
}

// stage(dir) — copy a validator-owned fixture directory into the sandbox (under
// node_modules, so it's hidden and ignored) so it can import the sandbox's
// packages. Returns a fromSandbox-style path prefix. Use this for "reference"
// code the learner must not be able to edit, e.g. the server a client talks to.
export function stage(dir, name = path.basename(dir)) {
  const dest = path.join(SANDBOX, 'node_modules', '.onboard-validator', name);
  rmSync(dest, { recursive: true, force: true });
  cpSync(dir, dest, { recursive: true });
  return `./${path.relative(SANDBOX, dest).split(path.sep).join('/')}`;
}

// Fail fast rather than hang if the learner's code never settles.
export function watchdog(ms = 20000) {
  setTimeout(() => {
    console.log(`fail\tthe checks finished in time\ttimed out after ${ms / 1000}s (a call never returned?)`);
    process.exit(1);
  }, ms).unref();
}
