# 05 · Review a Terraform plan

**Skills:** reading `terraform show -json` output, `change.actions`,
replace vs destroy, `create_before_destroy`, `replace_paths`,
`action_reason`, `moved` blocks (`previous_address`), plan summary counts.

## Background
The plan is the last moment to catch "oops, that deletes the production
database". Reviewing one in a PR (or a CI comment) is a core skill. In
machine-readable form, `terraform show -json tfplan` has one entry per resource
in `resource_changes[]`, and `change.actions` says what happens:

| `actions` | Plan symbol | Meaning |
|-----------|-------------|---------|
| `["no-op"]` | | nothing |
| `["create"]` | `+` | new resource |
| `["update"]` | `~` | changed in place |
| `["delete"]` | `-` | destroyed, gone |
| `["delete","create"]` | `-/+` | **replaced**: destroy first, then create (downtime!) |
| `["create","delete"]` | `+/-` | **replaced** with `create_before_destroy`: new one first |
| `["read"]` | `<=` | a data source read during apply |

Useful extras: `change.replace_paths` (which attribute forced the
replacement), `action_reason` (why, e.g. `replace_because_tainted`,
`delete_because_no_resource_config`) and `previous_address` (the resource was
**moved** or renamed with a `moved` block, which is not a destroy).

## Scenario
A teammate's PR comes with `plan.json`, the output of
`terraform show -json tfplan` for production. Before anyone types `apply`,
work out exactly what it will do.

## Goal
Fill in `answers.json` using resource addresses exactly as they appear in
`.address` (e.g. `aws_instance.worker[1]`, `module.cache.aws_elasticache_cluster.this`):
- `created`, `updated`, `replaced` and `destroyed` (destroyed means deleted and
  **not** recreated). Ignore no-ops and data-source reads.
- `create_before_destroy`: which replacements create the new resource first.
- `db_replaced_because_of`: the attribute that forces `aws_db_instance.main` to be replaced.
- `iam_role_moved_from`: the old address of `aws_iam_role.app`.
- `summary`: the numbers Terraform would print in `Plan: X to add, Y to change, Z to destroy.`

## Hints
- With jq:
  ```bash
  jq -r '.resource_changes[] | "\(.change.actions | join(","))\t\(.address)"' plan.json
  jq '.resource_changes[] | select(.address == "aws_db_instance.main") | .change.replace_paths' plan.json
  ```
- No jq? `node -p 'require("./plan.json").resource_changes.map(r => r.change.actions + "  " + r.address).join("\n")'`
- Ask yourself, for each destroy or replace: does it hold data? A replaced
  database with `skip_final_snapshot = true` is how outages and data loss happen.

## Check your work
```
./onboard validate infrastructure/05
```
