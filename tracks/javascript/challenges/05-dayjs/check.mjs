import { readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, expectEqual, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';

watchdog();
const d = await fromSandbox('./dates.js');
const code = readFileSync(path.join(SANDBOX, 'dates.js'), 'utf8');

const table = (fn, rows) => {
  for (const [args, want] of rows) expectEqual(fn(...args), want, `${fn.name}(${args.map((a) => JSON.stringify(a)).join(', ')}): `);
};

await check('formatInvoiceDate formats the UTC date as "D MMM YYYY"', () => table(d.formatInvoiceDate, [
  [['2026-03-07T23:30:00Z'], '7 Mar 2026'],
  [['2026-12-31T00:00:00Z'], '31 Dec 2026'],
  [['2027-01-01T09:15:00Z'], '1 Jan 2027'],
]));

await check('parseUkDate reads DD/MM/YYYY into YYYY-MM-DD', () => table(d.parseUkDate, [
  [['31/12/2026'], '2026-12-31'],
  [['01/02/2026'], '2026-02-01'],
  [['29/02/2028'], '2028-02-29'],
]));

await check('parseUkDate returns null for impossible or malformed dates (strict parsing)', () => table(d.parseUkDate, [
  [['31/02/2026'], null],
  [['29/02/2027'], null],
  [['2026-12-31'], null],
  [['12/31/2026'], null],
  [['soon'], null],
]));

await check('toZone shows the instant as wall-clock time in the given zone', () => table(d.toZone, [
  [['2026-07-01T12:00:00Z', 'America/New_York'], '2026-07-01 08:00'],
  [['2026-01-15T12:00:00Z', 'America/New_York'], '2026-01-15 07:00'],
  [['2026-07-01T20:30:00Z', 'Asia/Tokyo'], '2026-07-02 05:30'],
  [['2026-07-01T12:00:00Z', 'UTC'], '2026-07-01 12:00'],
]));

await check('toZone handles the London clocks going forward (29 Mar 2026, 01:00 UTC)', () => table(d.toZone, [
  [['2026-03-29T00:30:00Z', 'Europe/London'], '2026-03-29 00:30'],
  [['2026-03-29T01:30:00Z', 'Europe/London'], '2026-03-29 02:30'],
]));

await check('toZone uses the dayjs timezone plugin (not hand-written offsets)', () => {
  expect(/dayjs\/plugin\/timezone/.test(code), "import timezone from 'dayjs/plugin/timezone.js' and dayjs.extend() it");
  expect(/\.tz\s*\(/.test(code), 'convert with .tz(zone)');
});

await check('daysBetween counts whole days with dayjs diff (rounding down)', () => table(d.daysBetween, [
  [['2026-01-01T00:00:00Z', '2026-01-10T12:00:00Z'], 9],
  [['2026-01-01T00:00:00Z', '2026-01-01T23:59:00Z'], 0],
  [['2026-03-01T00:00:00Z', '2026-02-01T00:00:00Z'], -28],
]));

await check('hoursBetween counts whole hours (rounding down)', () => table(d.hoursBetween, [
  [['2026-01-01T00:00:00Z', '2026-01-01T05:59:00Z'], 5],
  [['2026-01-01T00:00:00Z', '2026-01-03T00:00:00Z'], 48],
]));

await check('the diffs use dayjs .diff(), not Date arithmetic', () => {
  expect(!/new Date\(/.test(code), 'replace the new Date(...) maths with dayjs(...).diff(...)');
  expect((code.match(/\.diff\s*\(/g) ?? []).length >= 2, 'use .diff(other, unit) in both daysBetween and hoursBetween');
});
