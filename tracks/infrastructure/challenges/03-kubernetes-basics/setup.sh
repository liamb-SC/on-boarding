#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
source "$REPO_ROOT/tracks/infrastructure/docker.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm
need curl
need docker "Install Docker Desktop (enable WSL integration) or Docker Engine: https://docs.docker.com/get-docker/"

ensure_kind_and_kubectl || printf '  The static manifest checks still work without them.\n' >&2

# On reset, remove what a previous attempt applied (the cluster itself is kept:
# creating one takes a minute).
if cluster_up; then
  kc delete deployment/echo service/echo --ignore-not-found >/dev/null 2>&1
fi

sandbox_reset
printf 'node_modules/\n' | put .gitignore
put package.json <<'JSON'
{
  "name": "k8s-basics",
  "private": true,
  "devDependencies": { "yaml": "^2.5.0" }
}
JSON

put cluster.sh <<SH
#!/usr/bin/env bash
# ./cluster.sh up | down | status   — a throwaway Kubernetes cluster in Docker (kind)
export PATH="$ONBOARD_BIN:\$PATH"
case "\${1:-status}" in
  up)     kind get clusters 2>/dev/null | grep -qx $KIND_CLUSTER || kind create cluster --name $KIND_CLUSTER --wait 120s
          kubectl config use-context $KUBE_CONTEXT ;;
  down)   kind delete cluster --name $KIND_CLUSTER ;;
  status) kubectl --context $KUBE_CONTEXT get nodes ;;
  *)      echo "usage: ./cluster.sh up|down|status" >&2; exit 1 ;;
esac
SH
chmod +x "$SANDBOX_DIR/cluster.sh"

put k8s/deployment.yaml <<'YAML'
# TODO: a Deployment named "echo" that runs 2 replicas of hashicorp/http-echo.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: echo
  labels:
    app: echo
spec:
  replicas: 1          # TODO: 2
  selector:
    matchLabels: {}    # TODO: must match the pod template's labels
  template:
    metadata:
      labels: {}       # TODO
    spec:
      containers:
        - name: echo
          image: hashicorp/http-echo:latest   # TODO: pin a version tag
          # TODO: args, containerPort, readinessProbe, resources
YAML
put k8s/service.yaml <<'YAML'
# TODO: a ClusterIP Service named "echo" in front of the Deployment's pods.
YAML

npm_install_sandbox   # yaml, used by the validator to read your manifests
sb_commit_all "Kubernetes manifests to finish"
docker_hint
