import { check, expect } from '../../../../lib/checks.mjs';
import { isIsoDate, isPlaceholder, norm, person, read, table, TEAM, words } from '../../wow-checks.mjs';

const FIRST = TEAM.map((p) => p.split(' ')[0].toLowerCase()); // RACI columns
const racMd = read('raci.md');
const actMd = read('actions.md');

// ---------- RACI ----------
let raci = [];
const letters = (cell) => new Set(String(cell ?? '').toUpperCase().replace(/[^RACI]/g, ''));
const row = (re) => {
  const r = raci.find((x) => re.test(norm(x.activity)));
  expect(r, `the RACI is missing the row matching ${re}`);
  return r;
};
const has = (r, who, l) => letters(r[who]).has(l);

await check('raci.md still has the Activity column and one column per team member', () => {
  raci = table(racMd, ['activity', ...FIRST], 'the RACI table').raw.filter((r) => !isPlaceholder(r.activity));
  expect(raci.length >= 7, `expected the 7 activities, found ${raci.length}`);
});

await check('every cell holds only R, A, C or I (or is empty)', () => {
  const bad = raci.flatMap((r) => FIRST.filter((p) => /[^raci/,\s-]/i.test(r[p] ?? '')).map((p) => `${r.activity}/${p}`));
  expect(!bad.length, bad.join(', '));
});

await check('every activity has exactly one Accountable (A)', () => {
  const bad = raci.filter((r) => FIRST.filter((p) => has(r, p, 'A')).length !== 1);
  expect(!bad.length, bad.map((r) => `"${r.activity}" has ${FIRST.filter((p) => has(r, p, 'A')).length}`).join('; '));
});

await check('every activity has at least one Responsible (R)', () => {
  const bad = raci.filter((r) => !FIRST.some((p) => has(r, p, 'R')));
  expect(!bad.length, bad.map((r) => r.activity).join(', '));
});

await check('Priya is Accountable for go-live sign-off', () => expect(has(row(/go-live/), 'priya', 'A')));
await check('Tom is Accountable and Responsible for the integration build, with Dan Consulted', () => {
  const r = row(/integration build/);
  expect(has(r, 'tom', 'A') && has(r, 'tom', 'R'), 'Tom: "I\'ll lead the build... and I\'m accountable for it"');
  expect(has(r, 'dan', 'C'), 'Dan agreed to be consulted on the design');
});
await check('Aisha is Accountable for vendor escalation', () => expect(has(row(/vendor escalation/), 'aisha', 'A')));
await check('Sofia is Responsible for the pen test, Dan for secrets + queue, Ben for regression and the E.164 check', () => {
  expect(has(row(/penetration/), 'sofia', 'R'), 'pen test: Sofia runs them');
  expect(has(row(/secrets/), 'dan', 'R'), 'secrets + SQS: Dan');
  expect(has(row(/regression/), 'ben', 'R'), 'regression: Ben');
  expect(has(row(/e\.?164|phone/), 'ben', 'R'), 'E.164 check: Ben volunteered');
});
await check('Priya is at least Informed on every activity ("keep me informed on all of it")', () => {
  const bad = raci.filter((r) => !letters(r.priya).size);
  expect(!bad.length, bad.map((r) => r.activity).join(', '));
});

// ---------- Action tracker ----------
let acts = [];
await check('actions.md has a table with ID, Action, Owner, Due and Status', () => {
  acts = table(actMd, ['id', 'action', 'owner', 'due', 'status'], 'the action tracker').rows;
});
await check('it tracks at least the 5 actions agreed at kick-off', () => expect(acts.length >= 5, `found ${acts.length}`));
await check('every action has exactly one owner from the team (no "Tom/Dan", no "everyone")', () => {
  expect(acts.length, 'no actions yet');
  const bad = acts.filter((a) => !person(a.owner));
  expect(!bad.length, bad.map((a) => `${a.id}: "${a.owner}"`).join(', '));
});
await check('every due date is a real YYYY-MM-DD date', () => {
  expect(acts.length, 'no actions yet');
  const bad = acts.filter((a) => !isIsoDate(norm(a.due)));
  expect(!bad.length, bad.map((a) => `${a.id}: "${a.due}"`).join(', '));
});
await check('every status is Not started, In progress, Done or Blocked', () => {
  expect(acts.length, 'no actions yet');
  const bad = acts.filter((a) => !['not started', 'in progress', 'done', 'blocked'].includes(norm(a.status)));
  expect(!bad.length, bad.map((a) => `${a.id}: "${a.status}"`).join(', '));
});
await check('every action is a specific task (at least 3 words)', () => {
  expect(acts.length, 'no actions yet');
  const bad = acts.filter((a) => isPlaceholder(a.action) || words(a.action) < 3);
  expect(!bad.length, bad.map((a) => a.id).join(', '));
});

const agreed = [
  ['escalate the credential delay with TextBridge', /(escalat|marcus|credential)/, 'Aisha Khan', '2026-10-09'],
  ['write the ADR for the queue decision', /(adr|decision record|architecture decision)/, 'Tom Okafor', '2026-10-13'],
  ['sample 500 CRM numbers for E.164', /(e\.?164|sample|phone)/, 'Ben Morris', '2026-10-14'],
  ['book the pen test', /(pen.?test|penetration)/, 'Sofia Ruiz', '2026-10-16'],
  ['provision secrets and the SQS queue', /(secret|sqs|terraform)/, 'Dan Lee', '2026-10-20'],
];
for (const [what, re, owner, due] of agreed) {
  await check(`"${what}": ${owner.split(' ')[0]}, due ${due}`, () => {
    const a = acts.find((x) => re.test(norm(x.action)));
    expect(a, 'not in the tracker');
    expect(person(a.owner) === owner, `owner is "${a.owner}"`);
    expect(norm(a.due) === due, `due is "${a.due}". Check the transcript for the date they committed to`);
  });
}
