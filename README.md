# StepChange Onboarding — self-validating skills challenges

Hands-on, self-paced challenges for onboarding new staff and upskilling existing
staff on the tools and practices we use. You practice a real skill in an isolated
sandbox, then a local validator checks your work and gives instant pass/fail
feedback. No accounts and nothing shared to break — just a terminal, plus
Node.js or Docker for the tracks that need them.

Start with **Git** (the foundation of our PR / branch-protection workflow),
then pick the tracks that match your role. Every challenge is small: most take
10–30 minutes and cover one or two ideas.

## Quick start

The easiest way in is the **dev container**: git, Node, Docker and every other
tool the tracks need come preinstalled, so there is nothing to set up on your
machine.

### Option A — dev container (recommended)

You need [VS Code](https://code.visualstudio.com/) with the **Dev Containers**
extension, plus [Docker Desktop](https://www.docker.com/products/docker-desktop/)
(or any Docker engine). No local git required for the container itself.

1. In VS Code, run **Dev Containers: Clone Repository in Container Volume…**
   and paste this repo's URL. (Already cloned? Open the folder and choose
   **Dev Containers: Reopen in Container**.)
2. Wait for the first build; it pulls images and can take several minutes.
3. In the container terminal, carry on from step 3 below. VS Code passes your
   host git identity into the container; if `git config user.name` prints
   nothing, do step 2 below.

Prefer the browser? Click **Code → Codespaces → Create codespace** on GitHub.
Git already knows who you are there, so skip step 2.

### Option B — local install

You need git and bash. Node.js 20+ is needed for some tracks and Docker for
others.

```bash
# 1. Clone and enter the repo
git clone <this-repo> && cd onboarding-repo

# 2. Make sure git knows who you are (used to key your progress)
git config user.name "Your Name"
git config user.email "you@stepchange.example"
```

### Then, in either setup

```bash
# 3. See what's available
./onboard list

# 4. Start a challenge — it scaffolds a private practice repo
./onboard start git/01

# 5. Do the work in the sandbox it printed, e.g.
cd sandbox/git/01-first-commit
#    ...use git to solve the task...

# 6. Check your work (records completion on pass)
cd -               # back to the onboarding repo
./onboard validate git/01

# 7. Publish your progress so the team can see it
./onboard share

# 8. Save your actual solutions to your own branches on the remote
./onboard push-work
```

## How it works

| Piece | What it does |
|-------|--------------|
| `./onboard` | The CLI: `list`, `start`, `validate`, `reset`, `progress`, `share`, `team`, `help`. |
| `sandbox/` | Your **private, git-ignored** practice repos. Each challenge scaffolds a throwaway git repo here, so many people can rebase/merge/force-reset freely with zero collisions. |
| `tracks/<track>/challenges/<NN>/` | Each challenge = `README.md` (the task) + `setup.sh` (builds the starting state) + `validate.sh` (inspects real git state, pass/fail). |
| `work/<you>/...` branches | What `./onboard push-work` publishes: each practice repo's branches, pushed to `work/<you>/<track>/<challenge>/<branch>` on `origin`. Force-updated, so it is safe after a rebase or reset. It can only write under `work/`. |
| `progress/<you>.json` | Your local record of what you've completed (git-ignored). `./onboard share` publishes it to your own `progress/<you>` branch. |

Your practice never lands in this shared repo, and neither does your progress
on `main`. Only new challenges you author get committed there.

## Multiple people, one repo

- **Practice is isolated:** everyone works in their own local `sandbox/`, which
  is git-ignored. Rebasing, force-resetting, conflicting merges — none of it can
  clash with a colleague.
- **Progress is per-person:** each learner shares to their own
  `progress/<username>` branch, so nobody's progress can conflict with anyone
  else's, and nothing needs merging.

## Tracking progress

`./onboard share` pushes your `progress/<you>.json` to the branch
`progress/<you>` on `origin`. That branch holds only a `progress.json`, with one
commit per share, so its history shows when things were done. Sharing:

- never switches your branch or touches your working tree (it commits with git
  plumbing and pushes directly);
- merges in anything you already shared, so working from a second machine or a
  fresh clone adds to your progress rather than replacing it;
- is safe to run as often as you like. If nothing changed, it does nothing.

To see everyone's progress:

```bash
./onboard team              # one row per person: done/total per track, last completion
./onboard team jane-doe     # which challenges one person has completed, and when
./onboard team --csv > progress.csv
```

Output looks like:

```
person    git    graphql  grpc  package-managers  total    last done
jane-doe  3/21   1/3      1/3   0/5               5/32     2026-09-30
sam-lee   21/21  0/3      1/3   0/5               22/32    2026-09-30
```

Notes for whoever runs onboarding:

- Learners need push access to `progress/*` branches. On GitHub, a ruleset on
  `progress/**` can allow that while `main` stays protected.
- Progress is self-reported. Validation runs on the learner's machine, so the
  JSON could be edited by hand. It's a record of engagement, not proof.
- Set `ONBOARD_REMOTE` if the shared remote isn't called `origin`.

## Requirements

- `git` (2.23+ recommended) and `bash`: all the Git track needs.
- Node.js 20+ for every other track. Setup runs `npm install`, so it needs
  access to the npm registry. `corepack enable` gives you pnpm and yarn.
- Docker for the tracks marked below. Setup checks the daemon is running and
  tells you if it isn't.
- `jq` is optional, only used to pretty-print `./onboard progress`.

## Tracks

Each track has a `tracks/<track>/track.md` with objectives and the challenge list.

| Track | # | Covers | Needs |
|-------|---|--------|-------|
| git | 21 | commits, branches, conflicts, rebase, reflog, bisect, signing, submodules, releases | git |
| javascript | 7 | TypeScript, generics and domain types, Node modules/fs/process, async/await, Day.js, Zod, Axios | Node |
| concurrency | 8 | race conditions, mutexes, atomics and workers, deadlock, async pitfalls, thread pools, starvation, immutability, backpressure | Node |
| web-basics | 6 | semantic HTML, CSS box model/flex/grid, Tailwind, MDN, Web Vitals and Lighthouse, Performance API | Node |
| react | 8 | components, hooks, routing, Redux and Zustand, SWR and TanStack Query, React Hook Form + Yup, shadcn and MUI, Next.js | Node |
| testing | 6 | Jest, Vitest, Playwright, Postman/newman, httpie, HAR files | Node (+ httpie, Chromium via Playwright) |
| package-managers | 5 | npm, workspaces, pnpm, yarn, tree shaking | Node |
| backend-apis | 8 | Express, sessions and cookies, OpenAPI/Swagger, offset vs cursor pagination, WebSockets and SSE, NestJS, GROQ, Drizzle ORM | Node |
| graphql | 3 | queries, mutations, schema and resolvers | Node |
| grpc | 3 | protobuf, unary and streaming rpcs, metadata and deadlines | Node |
| security | 8 | XSS/CSP/Helmet, CSRF and CORS, JWT, OAuth + PKCE, RBAC, secrets, encryption, IAM and WAF | Node |
| data | 9 | Redis, caching strategies, shared vs in-memory caches, CDN headers, read replicas, CDC/outbox, JSON documents, DynamoDB design, indexes to sharding | Node; Docker for 01 |
| distributed-systems | 9 | sync vs async, circuit breaker, service discovery, CQRS, SNS/SQS/EventBridge, API gateway, monolith vs serverless, availability, latency | Node |
| aws | 9 | service categories, S3/EBS/EFS, Lambda, SNS/SQS/EventBridge, DynamoDB, API Gateway, IAM and secrets, CloudFormation, CloudWatch and X-Ray | Node + Docker (LocalStack 4.14, except 01) |
| infrastructure | 7 | Dockerfiles, Compose, Kubernetes (kind), Terraform, plan review, GitHub Actions, WSL and line endings | Docker for 01–04 |
| observability | 5 | structured logging, p99s, OpenTelemetry traces and metrics, dashboards, alerting | Node |
| ways-of-working | 8 | RAID log, RACI and actions, decision log, changelog, status reports, RFCs, reading a codebase, service catalogue | Node |
| ai-tooling | 3 | building an MCP server, MCP client config, CLAUDE.md and prompting | Node |

## Adding challenges / new tracks

Copy `tracks/_TEMPLATE/` and fill in the three files. The runner auto-discovers
any folder under `tracks/*/challenges/*/` — no code changes needed. See
`docs/CONTRIBUTING.md`.
