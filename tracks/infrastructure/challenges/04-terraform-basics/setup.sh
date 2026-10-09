#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
source "$REPO_ROOT/tracks/infrastructure/docker.sh"
need docker "Install Docker Desktop (enable WSL integration) or Docker Engine: https://docs.docker.com/get-docker/"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."

sandbox_reset
put_tf_wrapper

put main.tf <<'HCL'
terraform {
  required_version = ">= 1.6"
  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}

variable "environment" {
  type        = string
  description = "Which environment this is for."
  # TODO: a validation block that only allows "dev", "staging" or "prod"
}

# TODO 1: a random_pet named "server": length 2, prefixed with the environment
#         (so its id looks like "dev-happy-otter").

# TODO 2: a local_file named "config" that writes ${path.module}/out/config.json
#         containing jsonencode({ environment = ..., server_name = <the pet's id> })

# TODO 3: an output named "server_name" with the pet's id
HCL
put terraform.tfvars <<'HCL'
environment = "dev"
HCL
put .gitignore <<'EOF2'
# TODO: keep Terraform's local working files out of git (but not the lockfile!)
EOF2
sb_commit_all "Terraform config to finish"
docker_hint
