# Track: Ways of working

The project and delivery habits that keep a team out of trouble, practised on
one fictional project: **Beacon**, Brightwell Home's move from a legacy SMS
gateway to a new vendor. Each challenge gives you real-looking source material
(a brief, a meeting transcript, raw notes, a repo) and you produce the artefact
a good team would keep.

## Requirements
Node.js 20+ (the validators parse your markdown and YAML in Node). Challenge
08 also needs network access to the npm registry to install `yaml`.

## Learning objectives
By the end you can:
- Keep a RAID log and tell a risk from an issue, an assumption and a dependency.
- Build a RACI with exactly one Accountable per activity, and track actions with owners and dates.
- Record a decision as an ADR and keep a decision log.
- Write a Keep a Changelog entry, pick the right semver bump and tag the release.
- Write a RAG status report from agreed rules, with evidence and explicit asks.
- Write a short RFC: problem, proposal, alternatives and open questions.
- Find your way around an unfamiliar repo with `grep`, `git log -S`, `git blame` and `git shortlog`.
- Describe a service in a Backstage-style catalogue: ownership, dependencies, infra, auth, monitoring and alerting.

## Challenges (do them in order)
| # | Challenge | Core concepts |
|---|-----------|---------------|
| 01 | raid-log | Risks, Assumptions, Issues, Dependencies, owners, mitigations |
| 02 | raci-and-actions | RACI, exactly one A per row, action tracker (owner, due date, status) |
| 03 | decision-log | ADRs (context, options, decision, consequences), decision log |
| 04 | changelog | Keep a Changelog, semver bumps, compare links, release tags |
| 05 | status-report | RAG ratings against rules, evidence, decisions needed |
| 06 | rfc | RFC template: problem, proposal, alternatives, open questions |
| 07 | codebase-navigation | `grep -rn`, `git log -S/--grep`, `git blame`, `git shortlog` |
| 08 | service-catalogue | Backstage `catalog-info.yaml`, entity refs, ownership, dependencies, ops facts |

The source material for each challenge is copied into its sandbox (usually
under `brief/`). Read it first. The validators check both the structure of
what you write and that it captures the important facts.

Start with: `./onboard start ways-of-working/01`
