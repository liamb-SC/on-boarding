#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

sandbox_reset
cp "$REPO_ROOT/tracks/ways-of-working/fixtures/system-overview.md" "$SANDBOX_DIR/"
printf 'node_modules/\n' | put .gitignore

# `yaml` is only here so the validator (and you: `npm run lint`) can parse the file.
put package.json <<'JSON'
{
  "name": "beacon-catalogue",
  "private": true,
  "scripts": { "lint": "node -e \"require('yaml').parse(require('fs').readFileSync('catalog-info.yaml','utf8')); console.log('catalog-info.yaml parses OK')\"" },
  "dependencies": { "yaml": "^2.6.0" }
}
JSON

put catalog-info.yaml <<'YAML'
# Service catalogue entry for Beacon.
# The top half is a standard Backstage Component. Everything under
# spec.catalogue is the extra detail Brightwell records for every service.
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: ""                # kebab-case service name
  description: ""
  tags: []
spec:
  type: service
  lifecycle: ""           # experimental | production | deprecated
  owner: ""               # a Backstage entity ref, e.g. group:team-foo
  system: ""
  dependsOn: []           # entity refs this service needs: component:<name>, resource:<name>
  providesApis: []        # api refs, e.g. foo-api

  catalogue:
    applications: []      # - { name, type, runtime }
    awsServices: []       # - { service, purpose }
    databases: []         # - { name, engine, retention }
    apis:
      provides: []        # - { name, style, spec }
      consumes: []        # - { name, style }
    authentication:
      inbound: ""         # how callers prove who they are
      outbound: ""        # how we authenticate to others (where the secret lives, not the secret!)
    cicd:
      pipeline: ""
      deploysTo: ""
    infrastructure:
      iac: ""
      repo: ""
      region: ""
    externalSystems: []   # - { name, purpose }
    monitoring:
      metrics: ""
      logs: ""
      dashboards: []
    alerting:
      tool: ""
      routesTo: ""
      alerts: []          # - one line per alert condition
    ownership:
      team: ""
      techLead: ""
      productOwner: ""
      slack: ""
YAML
npm_install_sandbox
sb_commit_all "Beacon system overview and an empty catalogue entry"
