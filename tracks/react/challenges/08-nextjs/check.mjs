import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { runSpec } from '../../react-checks.mjs';

watchdog(300000);
await runSpec(path.join(path.dirname(fileURLToPath(import.meta.url)), 'spec.test.jsx'));

// The real compiler is the final word on the server/client boundary: it
// rejects hooks in server components, server-only code in client ones, etc.
await check('`next build` succeeds', () => {
  const run = spawnSync(process.execPath, [path.join(SANDBOX, 'node_modules/next/dist/bin/next'), 'build'], {
    cwd: SANDBOX, encoding: 'utf8', timeout: 240000,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', FORCE_COLOR: '0', NO_COLOR: '1' },
  });
  if (run.status === 0) return;
  const lines = `${run.stdout}\n${run.stderr}`.replace(/\x1b\[[0-9;]*m/g, '').split('\n')
    .map((l) => l.trim()).filter(Boolean);
  const at = Math.max(0, lines.findIndex((l) => /error/i.test(l)));
  throw new Error(run.error ? String(run.error) : lines.slice(at, at + 4).join(' '));
});
