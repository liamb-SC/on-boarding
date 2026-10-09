import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { watchdog } from '../../../../lib/checks.mjs';
import { runSpec } from '../../react-checks.mjs';

watchdog(150000);
await runSpec(path.join(path.dirname(fileURLToPath(import.meta.url)), 'spec.test.jsx'));
