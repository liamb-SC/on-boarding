# 04 · Terraform: init, validate, plan, apply

**Skills:** providers and the lockfile, `variable` + `validation`, resources,
references between resources, `output`, `terraform fmt / init / validate /
plan / apply / output`, state, what goes in `.gitignore`.

## Background
- **Providers** are plugins that talk to an API (AWS, GitHub... or, here, the
  local disk and a random-name generator). `terraform init` downloads them and
  records exact versions in **`.terraform.lock.hcl`**. Commit that file, like
  `package-lock.json`.
- **Plan, then apply.** `plan` compares your config with the **state** (what
  Terraform last created) and lists what it would do: `+` create, `~` update
  in place, `-` destroy, `-/+` replace. `plan -out=tfplan` saves exactly that
  plan, and `apply tfplan` does exactly that and nothing else.
- **State** (`terraform.tfstate`) maps your config to real things. It can
  contain secrets. Never commit it. Real teams keep it in a remote backend
  (S3, Terraform Cloud).
- Referencing `random_pet.server.id` from another resource creates a
  dependency, so Terraform builds them in the right order.

## Scenario
There's nothing to install. `./tf` runs Terraform from the official
`hashicorp/terraform` Docker image with this directory mounted. `main.tf`
declares the providers and an `environment` variable (set in
`terraform.tfvars`). The resources are TODOs.

## Goal
1. In `main.tf`:
   - add a `validation` block so `environment` must be `dev`, `staging` or `prod`
   - a `random_pet` named `server` with `length = 2` and the environment as its `prefix`
   - a `local_file` named `config` that writes `${path.module}/out/config.json`
     with `jsonencode({ environment = ..., server_name = ... })`
   - an `output` named `server_name` with the pet's id
2. Fill in `.gitignore`: ignore `.terraform/`, state files and saved plans,
   but **not** `.terraform.lock.hcl`.
3. Run the loop:
   ```bash
   ./tf fmt                  # tidy formatting
   ./tf init                 # download providers, write the lockfile
   ./tf validate
   ./tf plan -out=tfplan     # read it! 2 to add
   ./tf apply tfplan
   ./tf output server_name && cat out/config.json
   ./tf plan                 # "No changes."
   ```
4. Look at a replacement: change `length` to 3 and `./tf plan`. Look for
   `-/+` and `# forces replacement`, and notice the file is replaced too.
   Change it back. Then try `./tf plan -var environment=qa` to see your validation fire.

## Hints
- `contains(["dev", "staging", "prod"], var.environment)` makes a good `condition`.
- `./tf state list` and `./tf state show random_pet.server` show what Terraform tracks.
- `./tf console` lets you try expressions like `jsonencode({a = 1})`.

## Check your work
Needs Docker running. The validator checks your files and `.gitignore`, then runs
`fmt -check`, `validate`, reads your state and outputs, and checks that `plan`
shows no changes and that the validation rejects a bad environment.
```
./onboard validate infrastructure/04
```
