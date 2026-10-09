# 03 · Kubernetes basics: pods, deployments, services

**Skills:** Deployments, ReplicaSets and pods, labels and selectors, Services,
`kubectl apply / get / describe / logs / port-forward / diff`, readiness
probes, resource requests and limits. Uses a local cluster from `kind`.

## Background
- A **pod** is one or more containers scheduled together. You rarely create
  pods yourself. A **Deployment** says "keep N copies of this pod template
  running" and replaces pods that die or change.
- **Labels + selectors** are the glue. The Deployment finds its pods by
  `spec.selector.matchLabels`, and a **Service** finds the pods to send
  traffic to by `spec.selector`. If a selector matches nothing, nothing errors.
  You just get no pods or no endpoints.
- A **Service** gives those pods one stable name and IP inside the cluster
  (`echo:80`), and load-balances over the pods that are *Ready*. That's
  what the **readinessProbe** decides.
- **Requests** are what the scheduler reserves for a pod. **Limits** are the
  ceiling. A container over its memory limit is OOM-killed.
- Everything is declarative: you `kubectl apply -f` the desired state and the
  cluster works towards it.

## Scenario
The sandbox has `k8s/deployment.yaml` (half done), an empty
`k8s/service.yaml`, and `./cluster.sh`, which runs a throwaway cluster inside
Docker using [kind](https://kind.sigs.k8s.io). Setup downloaded `kind` (and
`kubectl`, if you didn't have it) into `~/.cache/onboard/bin`.

## Goal
1. Finish the Deployment `echo`: **2 replicas**, selector and pod labels
   `app: echo`, image `hashicorp/http-echo:1.0`, args
   `["-text=hello from kubernetes"]`, containerPort **5678**, a
   `readinessProbe` (HTTP GET `/` on 5678) and cpu/memory requests plus a memory limit.
2. Write a ClusterIP Service `echo`: port **80** → the container's 5678.
3. Run it:
   ```bash
   export PATH="$HOME/.cache/onboard/bin:$PATH"
   ./cluster.sh up                       # ~1 min the first time
   kubectl apply -f k8s/
   kubectl get deploy,rs,pods,svc -l app=echo     # (label your Service too)
   kubectl describe pod -l app=echo      # events: pulling, started, ready
   kubectl logs deploy/echo
   kubectl port-forward svc/echo 8080:80 # then, in another terminal:
   curl localhost:8080
   ```
4. Break it on purpose: change the Service selector to `app: nope`, apply, and
   `kubectl get endpointslices -l kubernetes.io/service-name=echo`. Then fix it.

## Hints
- `kubectl explain deployment.spec.template.spec.containers.readinessProbe`
  documents any field, right in your terminal.
- `kubectl delete pod <name>` and watch `kubectl get pods -w`. The Deployment
  brings a replacement up straight away.
- `./cluster.sh down` deletes the whole cluster when you're done.

## Check your work
The validator checks your manifests, then checks the live cluster: 2 Ready
pods, 2 endpoints behind the Service, `kubectl diff` showing nothing (so what's
running is what's in your files), and a real request through a port-forward.
```
./onboard validate infrastructure/03
```
No Docker at all? `ONBOARD_K8S_STATIC=1 ./onboard validate infrastructure/03`
checks only the manifests.
