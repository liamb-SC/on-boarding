import { check, expect } from '../../../../lib/checks.mjs';
import { isIsoDate, norm, read, sections } from '../../wow-checks.mjs';

const md = read('CHANGELOG.md');
const secs = sections(md);
const releases = secs.filter((s) => s.level === 2);
const KINDS = ['added', 'changed', 'deprecated', 'removed', 'fixed', 'security'];

const unreleased = releases.find((s) => /^\[unreleased\]/.test(norm(s.title)));
// The newest release heading, if the learner added one above 1.3.0.
const latestAny = releases.find((s) => /^\[\d+\.\d+\.\d+\]/.test(s.title));
const latestVersion = latestAny?.title.match(/\[(\d+\.\d+\.\d+)\]/)?.[1];
const latest = latestVersion && latestVersion !== '1.3.0' ? latestAny : undefined;
// Its ### subsections, in order, up to the next ## heading.
const at = secs.indexOf(latest);
const end = secs.findIndex((s, i) => i > at && s.level <= 2);
const newSecs = at < 0 ? [] : secs.slice(at + 1, end < 0 ? undefined : end).filter((s) => s.level === 3);
const kind = (k) => norm(newSecs.find((s) => norm(s.title) === k)?.body ?? '');

await check('## [Unreleased] is still at the top, and now empty', () => {
  expect(unreleased && releases[0] === unreleased, 'keep "## [Unreleased]" as the first release heading');
  expect(!/^\s*[-*]\s+/m.test(unreleased.body), 'move its entries into the new release');
});

await check('the newest release is 2.0.0 (there is a breaking change, so it\'s a MAJOR bump)', () => {
  expect(latestVersion, 'no "## [x.y.z] - YYYY-MM-DD" heading under Unreleased');
  expect(latest, 'add a new release heading above 1.3.0');
  expect(latestVersion === '2.0.0', `got ${latestVersion}: a breaking change resets minor + patch and bumps major`);
});

await check('the release heading has a YYYY-MM-DD date', () => {
  const d = latest?.title.match(/\]\s*-\s*(\S+)/)?.[1];
  expect(d && isIsoDate(d), `heading is "${latest?.title}". Format: ## [2.0.0] - 2026-10-09`);
  expect(d >= '2026-10-08', 'the release can\'t be older than the last commit (2026-10-08)');
});

await check('only Keep a Changelog section types are used (Added, Changed, Deprecated, Removed, Fixed, Security)', () => {
  expect(newSecs.length, 'group entries under ### Added / ### Fixed / ...');
  const bad = newSecs.filter((s) => !KINDS.includes(norm(s.title)));
  expect(!bad.length, `not a Keep a Changelog type: ${bad.map((s) => s.title).join(', ')}`);
});

await check('Added: the "delivered" notification type', () => expect(/deliver/.test(kind('added')), 'feat: support the "delivered" type'));
await check('Changed: the phone → to rename, flagged as BREAKING', () => {
  const c = kind('changed');
  expect(/phone/.test(c) && /\bto\b/.test(c), 'feat!: rename phone to to');
  expect(/breaking/.test(c), 'call the breaking change out loudly (e.g. "**BREAKING:**")');
});
await check('Added + Deprecated: POST /v2/messages added, POST /v1/send deprecated', () => {
  expect(/v2\/messages/.test(kind('added')), '/v2/messages is new');
  expect(/v1\/send/.test(kind('deprecated')), '/v1/send is deprecated');
});
await check('Fixed: retrying TextBridge 429s', () => expect(/429/.test(kind('fixed'))));
await check('Security: the undici CVE upgrade', () => expect(/(undici|cve)/.test(kind('security')), 'security fixes get their own section'));
await check('no noise: chores, docs typos and tests stay out of the changelog', () => {
  expect(latest, 'add the new release first');
  const body = norm(latest?.body);
  for (const [re, what] of [[/eslint/, 'eslint bump'], [/typo/, 'README typo'], [/\btests?\b/, 'tests']]) expect(!re.test(body), `remove the ${what}`);
});

await check('the 1.3.0 and 1.2.0 sections are untouched', () => {
  expect(md.includes('## [1.3.0] - 2026-09-30\n\n### Added\n- "Out for delivery" notifications.'), '1.3.0 was edited');
  expect(md.includes('## [1.2.0] - 2026-09-12\n\n### Added\n- Structured JSON logging.'), '1.2.0 was edited');
});

await check('compare links updated: [unreleased] → v2.0.0...HEAD and a new [2.0.0] → v1.3.0...v2.0.0', () => {
  expect(/^\[unreleased\]:\s*\S+\/compare\/v2\.0\.0\.\.\.HEAD\s*$/im.test(md), '[unreleased] should compare v2.0.0...HEAD');
  expect(/^\[2\.0\.0\]:\s*\S+\/compare\/v1\.3\.0\.\.\.v2\.0\.0\s*$/im.test(md), 'add [2.0.0]: .../compare/v1.3.0...v2.0.0');
});
