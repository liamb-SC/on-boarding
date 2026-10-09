// Checks answers.json against hashed answers, so reading this file doesn't
// give them away. Each wrong answer gets a nudge, not the solution.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, SANDBOX } from '../../../../lib/checks.mjs';

const canon = (v) => JSON.stringify(Array.isArray(v) ? v.map((s) => String(s).trim()).sort() : typeof v === 'string' ? v.trim() : v);
const hash = (v) => createHash('sha256').update(`plan-review:${canon(v)}`).digest('hex').slice(0, 16);

const plan = JSON.parse(readFileSync(path.join(SANDBOX, 'plan.json'), 'utf8'));
const addresses = new Set(plan.resource_changes.map((r) => r.address));
let answers = {};
await check('answers.json is valid JSON', () => {
  answers = JSON.parse(readFileSync(path.join(SANDBOX, 'answers.json'), 'utf8'));
});

// [key, description, hash, expected count, nudge]
const lists = [
  ['created', 'created: brand-new resources', 'd0eb18f649012b45', 1,
    'only actions ["create"]. A replacement creates too, but it goes under "replaced"'],
  ['updated', 'updated: changed in place', '5c90acf3f1501099', 2, 'actions ["update"]'],
  ['replaced', 'replaced: destroyed AND recreated', 'b630849a3ccc1fde', 3,
    'look for both "delete" and "create" in actions, in either order. Not every replacement has replace_paths'],
  ['destroyed', 'destroyed: deleted and NOT recreated', '461f8bcf7d84d7b2', 3,
    'actions exactly ["delete"]. Check module and for_each addresses too'],
  ['create_before_destroy', 'create_before_destroy: replacements that build the new one first', '54d284e458b8f434', 1,
    'the ORDER of the actions array is the order Terraform does them'],
];
for (const [key, desc, want, count, nudge] of lists) {
  await check(desc, () => {
    const got = answers[key];
    expect(Array.isArray(got), `"${key}" must be an array of resource addresses`);
    const unknown = got.filter((a) => !addresses.has(String(a).trim()));
    expect(!unknown.length, `not addresses in plan.json: ${unknown.join(', ')} (copy .address exactly, including [index] and module. prefix)`);
    expect(got.length === count, `expected ${count} address(es), you listed ${got.length}. Hint: ${nudge}`);
    expect(hash(got) === want, `not quite. Hint: ${nudge}`);
  });
}
await check('db_replaced_because_of: the attribute that forces the database replacement', () =>
  expect(hash(String(answers.db_replaced_because_of ?? '')) === '7879e446a3b6e976',
    'see change.replace_paths on aws_db_instance.main (an engine_version bump alone would be an in-place update)'));
await check('iam_role_moved_from: where aws_iam_role.app used to live', () =>
  expect(hash(String(answers.iam_role_moved_from ?? '')) === '29cabfc661bb2eab',
    'a no-op with a previous_address is a `moved` block. Nothing is destroyed'));
await check('summary: the "Plan: X to add, Y to change, Z to destroy." numbers', () => {
  const s = answers.summary ?? {};
  const got = { add: Number(s.add), change: Number(s.change), destroy: Number(s.destroy) };
  expect(hash(got) === '1633ca0c95c687fd', 'each replacement counts once in "add" AND once in "destroy"');
});
