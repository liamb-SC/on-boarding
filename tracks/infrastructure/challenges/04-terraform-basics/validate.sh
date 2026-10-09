#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"
source "$REPO_ROOT/lib/node.sh"
source "$REPO_ROOT/tracks/infrastructure/docker.sh"

main="$(cat "$SANDBOX_DIR/main.tf" 2>/dev/null)"
assert_true "main.tf declares resource \"random_pet\" \"server\"" grep -qE 'resource +"random_pet" +"server"' <<< "$main"
assert_true "main.tf declares resource \"local_file\" \"config\"" grep -qE 'resource +"local_file" +"config"' <<< "$main"
assert_true "main.tf declares output \"server_name\"" grep -qE 'output +"server_name"' <<< "$main"
assert_true "variable \"environment\" has a validation block" grep -qE '^\s*validation\s*\{' <<< "$main"
ignored() { g check-ignore -q --no-index "$1"; }
assert_true  ".gitignore ignores the .terraform/ directory" ignored .terraform/providers
assert_true  ".gitignore ignores terraform.tfstate" ignored terraform.tfstate
assert_true  ".gitignore ignores terraform.tfstate.backup" ignored terraform.tfstate.backup
assert_false ".gitignore does NOT ignore .terraform.lock.hcl (commit the lockfile)" ignored .terraform.lock.hcl

if require_docker_daemon; then
  tf() { in_sandbox ./tf "$@" -no-color; }
  assert_true "terraform fmt -check passes (run ./tf fmt)" in_sandbox ./tf fmt -check
  out="$(tf validate 2>&1)"
  assert_contains "terraform validate passes (after ./tf init)" "$out" "Success"
  assert_true "it has been applied (terraform.tfstate exists)" test -s "$SANDBOX_DIR/terraform.tfstate"
  assert_true "the state contains random_pet.server and local_file.config" \
    test "$(json terraform.tfstate '(j.resources||[]).map(r=>r.type+"."+r.name).sort().join(",")')" = "local_file.config,random_pet.server"
  name="$(in_sandbox ./tf output -raw server_name 2>/dev/null)"
  assert_true "output server_name looks like dev-<adjective>-<animal> (got '$name')" grep -qE '^dev-[a-z]+-[a-z]+$' <<< "$name"
  assert_eq "out/config.json has the environment" "dev" "$(json out/config.json 'j.environment')"
  assert_eq "out/config.json has the same server_name as the output" "$name" "$(json out/config.json 'j.server_name')"
  tf plan -input=false -detailed-exitcode >/dev/null 2>&1
  assert_eq "./tf plan shows no changes (everything applied, no drift)" "0" "$?"
  bad="$(tf plan -input=false -var environment=qa 2>&1)"
  assert_contains "the validation rejects environment=\"qa\"" "$bad" "Invalid value for variable"
fi
finish
