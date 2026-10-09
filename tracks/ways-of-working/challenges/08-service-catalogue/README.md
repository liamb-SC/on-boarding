# 08 · Service ownership catalogue

**Skills:** service catalogues (Backstage `catalog-info.yaml`), entity
refs, recording ownership, dependencies and operational facts in a
structured, machine-readable file.

## Background
When something breaks at 3am, the first questions are always *who owns this,
what does it talk to, and where do I look?* A **service catalogue** answers
them in one place. [Backstage](https://backstage.io) is a popular one: each
repo carries a `catalog-info.yaml` describing its component:

- `spec.owner` is an **entity ref**, `kind:name`, e.g. `group:team-payments`.
- `spec.lifecycle` is `experimental`, `production` or `deprecated`.
- `spec.dependsOn` lists what this component needs to work, also as entity
  refs: `component:<name>` for other services, `resource:<name>` for
  databases, queues and buckets.

Brightwell adds a `catalogue:` block with the details on-call engineers need.
A catalogue records **where secrets live, never their values**.

## Scenario
Beacon is live. Tom wrote `system-overview.md` in prose. Nobody can search
prose at 3am, so turn it into `catalog-info.yaml`.

## Goal
Fill in every field of `catalog-info.yaml` from `system-overview.md`:
- The Backstage part: `metadata.name: beacon`, a description, lifecycle,
  owner and system, `dependsOn` (entity refs for everything Beacon *needs*)
  and `providesApis`.
- Every section of `spec.catalogue`: applications, AWS services, databases,
  APIs, authentication, CI/CD, infrastructure, external systems, monitoring,
  alerting and ownership. The comments show the expected shape.

Run `npm run lint` to check that the file is still valid YAML.

## Hints
- `order-service` sends Beacon events, but Beacon doesn't *call* it. Does
  that make it something Beacon depends on? List what Beacon can't work
  without.
- YAML lists of objects look like `- { name: beacon-api, type: service, runtime: Node.js 20 }`.
- Quote strings that start with `#` (`"#team-beacon"`). An unquoted `#`
  starts a comment.

## Check your work
```
./onboard validate ways-of-working/08
```
