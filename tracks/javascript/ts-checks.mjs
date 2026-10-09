// Helpers shared by the JavaScript track's TypeScript validators.
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { SANDBOX } from '../../lib/checks.mjs';

const TSC = path.join(SANDBOX, 'node_modules', 'typescript', 'bin', 'tsc');

// tsc(...args) — run the sandbox's own TypeScript compiler from the sandbox root.
// Returns { ok, output } where output is the compiler's diagnostics.
export function tsc(...args) {
  const r = spawnSync(process.execPath, [TSC, '--pretty', 'false', ...args], { cwd: SANDBOX, encoding: 'utf8' });
  return { ok: r.status === 0, output: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim() };
}

// typeTests(header, cases) — type-check small snippets against the learner's code.
// Each case is { desc, code, error }: with error: true the snippet MUST fail to
// type-check (it's written behind a `// @ts-expect-error`), otherwise it must
// compile cleanly. The file lives under node_modules so the learner never sees
// it. Returns { importError, results }: importError is set when the header's
// imports don't type-check, else results maps desc -> null (passed) or a message.
export function typeTests(header, cases) {
  const dir = path.join(SANDBOX, 'node_modules', '.onboard-validator', 'type-tests');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const lines = [...header.trim().split('\n'), ''];
  const ranges = [];
  for (const c of cases) {
    const start = lines.length + 1;
    lines.push('{');
    if (c.error) lines.push('  // @ts-expect-error');
    lines.push(...c.code.trim().split('\n').map((l) => `  ${l}`));
    lines.push('}');
    ranges.push({ c, start, end: lines.length });
  }
  writeFileSync(path.join(dir, 'type-tests.ts'), `${lines.join('\n')}\n`);
  writeFileSync(path.join(dir, 'tsconfig.json'), JSON.stringify({
    extends: '../../../tsconfig.json',
    compilerOptions: { noEmit: true, rootDir: '../../..', noUnusedLocals: false },
    files: ['type-tests.ts'],
  }));

  const { output } = tsc('-p', path.relative(SANDBOX, dir));
  const errors = [...output.matchAll(/type-tests\.ts\((\d+),\d+\): error (TS\d+: .*)/g)]
    .map((m) => ({ line: Number(m[1]), msg: m[2] }));
  const headerError = errors.find((e) => e.line <= header.trim().split('\n').length);

  if (headerError) return { importError: headerError.msg, results: new Map() };

  const results = new Map();
  for (const { c, start, end } of ranges) {
    const err = errors.find((e) => e.line >= start && e.line <= end);
    if (!err) results.set(c.desc, null);
    else if (/TS2578/.test(err.msg)) results.set(c.desc, `this should be a type error, but it compiles: ${c.code.trim()}`);
    else results.set(c.desc, `${c.code.trim()} -> ${err.msg}`);
  }
  return { importError: null, results };
}
