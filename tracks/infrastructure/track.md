# Track: Infrastructure

The tooling around the code: containers, a taste of Kubernetes, Terraform,
CI with GitHub Actions, and a terminal setup that doesn't fight you on WSL.
Each challenge is small, about 10 to 30 minutes.

## Requirements
- Node.js 20+ with npm, and network access to the npm registry.
- **Docker** for challenges 01–04, with the daemon running (`docker info`
  works). On Windows, use Docker Desktop with WSL integration on for your
  distro. Nothing else needs installing: Terraform runs from the
  `hashicorp/terraform` image, and challenge 03's setup downloads `kind` (and
  `kubectl` if you don't have it) into `~/.cache/onboard/bin`.
- Challenges 05–07 need no Docker.

## Learning objectives
By the end you can:
- Write a small multi-stage Dockerfile with a `.dockerignore`, a non-root user
  and good layer caching, then build, run and debug it.
- Run an app and its dependencies with Docker Compose: service DNS,
  healthchecks, `depends_on` conditions and named volumes.
- Deploy to Kubernetes with a Deployment and a Service, and use
  `kubectl apply / get / logs / port-forward`.
- Run the Terraform loop (`init`, `validate`, `plan`, `apply`) and know what
  belongs in git.
- Review a Terraform plan and spot destroys, replacements and moves before they happen.
- Write a GitHub Actions workflow with triggers, a matrix, caching and tests.
- Fix CRLF problems for good with `.gitattributes`, and set up your shell on WSL.

## Challenges (do them in order)
| # | Challenge | Core concepts |
|---|-----------|---------------|
| 01 | dockerfile | multi-stage builds, `.dockerignore`, `npm ci`, `USER`, exec-form `CMD` |
| 02 | compose | `compose.yaml`, service DNS, healthchecks, `depends_on`, named volumes |
| 03 | kubernetes-basics | kind, Deployments, Services, labels/selectors, probes, `kubectl` |
| 04 | terraform-basics | providers, lockfile, variables + validation, plan/apply, state, `.gitignore` |
| 05 | terraform-plan-review | `terraform show -json`, replace vs destroy, `create_before_destroy`, `moved` |
| 06 | github-actions | `on:`, jobs/steps, matrix, `setup-node` caching, `permissions`, pinning |
| 07 | wsl-and-line-endings | CRLF/LF, `.gitattributes`, renormalising, `wslpath`, `/mnt/c`, shell aliases |

05, 06 and 07 don't depend on the others. Do them first if Docker isn't set up yet.

Start with: `./onboard start infrastructure/01`
