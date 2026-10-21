# Adding challenges and tracks

The runner auto-discovers everything under `tracks/*/challenges/*/`. Adding
content is copy-paste-fill — you never edit `onboard` or the `lib/` files.

## Add a challenge to an existing track

```bash
cp -r tracks/_TEMPLATE tracks/git/challenges/11-my-challenge
```

Then edit the three files:

| File | Responsibility |
|------|----------------|
| `README.md` | The task the learner reads (scenario, goal, hints, validate command). |
| `setup.sh` | Build the **starting state** in `$SANDBOX_DIR`. Sources `lib/sandbox.sh`. Must be repeatable — `./onboard reset` re-runs it. |
| `validate.sh` | Inspect the sandbox, call `assert_*`, end with `finish`. Sources `lib/common.sh`. |

Naming: `NN-kebab-title` (two-digit prefix sets the order).

## Add a whole new track

```bash
mkdir -p tracks/<track>/challenges
cp -r tracks/_TEMPLATE tracks/<track>/challenges/01-first
# optional: tracks/<track>/track.md describing objectives
```

It shows up in `./onboard list` immediately.

## The contract

- The runner exports `REPO_ROOT` and `SANDBOX_DIR` before invoking `setup.sh`
  and `validate.sh`. Always resolve the sandbox via `$SANDBOX_DIR`.
- `setup.sh` owns creating the sandbox. For git challenges call `sandbox_reset`
  first. For other topics (Docker, Terraform, shell, a scripting kata, an AI
  prompt exercise…) just create whatever files/state the task needs under
  `$SANDBOX_DIR`.
- `validate.sh` must be **honest and specific**: prefer several small
  `assert_*` checks so a learner sees exactly what's missing. Always finish with
  `finish` (it sets the exit code the runner keys completion off).
- Need a value at validate time that the learner shouldn't see or edit? Stash it
  with `sb_stash_note <key> <value>` in setup (written inside `.git/`, so it
  survives checkouts and stays out of the working tree) and read it from
  `$SANDBOX_DIR/.git/note_<key>` in validate.

## Node.js challenges and JavaScript validators

`lib/node.sh` has helpers for Node-based setups and validators: `need <cmd>`,
`put <path>` (write a heredoc into the sandbox), `json <file> <expr>`,
`in_sandbox <cmd>`, `npm_install_sandbox`, and `run_checks`.

When checking a challenge means *running* the learner's code (a GraphQL
schema, a gRPC server, a client), write the checks in JavaScript with
`lib/checks.mjs` and call them from `validate.sh`:

```bash
source "$REPO_ROOT/lib/common.sh"
source "$REPO_ROOT/lib/node.sh"
run_checks node "$(dirname "${BASH_SOURCE[0]}")/check.mjs"
finish
```

In `check.mjs`, each `await check('desc', async () => { ... })` becomes one
✓/✗ line. It fails if the function throws. `fromSandbox()` imports the
learner's files or the sandbox's `node_modules`. `stage()` copies
validator-owned reference code into the sandbox so the learner can't edit what
they're graded against. See `tracks/graphql` and `tracks/grpc` for examples.

## What can be a challenge?

Anything checkable from local shell state: git state, file contents, command
output, exit codes, `docker`/`terraform`/`pnpm` results, etc. That covers the
planned future tracks — ways of working, AWS (via LocalStack), open vs. closed
source, AI harnessing — as well as Git.

## Keep dependencies low

Stick to `git` + coreutils + bash so challenges run everywhere. If a track
genuinely needs a tool (e.g. `docker`), have `setup.sh` check for it and print a
clear skip message rather than failing cryptically.

## Protecting `main` (repo admins, one-time setup)

Learners need write access so `./onboard share` and `./onboard push-work` can
create `progress/<you>` and `work/<you>/...` branches. Nothing in the CLI
pushes to `main`, and `.githooks/pre-push` (enabled by the dev container) blocks
it client-side, but only GitHub can enforce it. Add a ruleset:

Settings -> Rules -> Rulesets -> New branch ruleset

- Enforcement: **Active**. Target: **Default branch**.
- Bypass list: only the maintainers who merge new challenges.
- Enable **Restrict deletions**, **Block force pushes** and
  **Require a pull request before merging** (this is what stops direct pushes).
- Do *not* target `work/**` or `progress/**`; learners force-push those.

Verify with a non-admin account: `git push origin HEAD:main` must be rejected,
while `./onboard push-work` and `./onboard share` succeed.
