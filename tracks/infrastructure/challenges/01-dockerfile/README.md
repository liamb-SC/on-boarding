# 01 · A small, multi-stage Dockerfile

**Skills:** `Dockerfile`, multi-stage builds, `.dockerignore`, layer caching,
`npm ci`, non-root `USER`, exec-form `CMD`, `docker build` / `run` / `logs`.

## Background
- A **multi-stage build** uses one stage to *build* (with compilers and
  devDependencies) and a second, clean stage to *run*. Only what you
  `COPY --from=<stage>` ends up in the final image.
  ```dockerfile
  FROM node:20-alpine AS build
  # ...install everything and build...
  FROM node:20-alpine
  COPY --from=build /app/dist ./dist
  ```
- **Layer caching:** each instruction is a cached layer. Copy
  `package.json` + `package-lock.json` and run `npm ci` *before* copying your
  source, so editing code doesn't reinstall every dependency.
- **`.dockerignore`** works like `.gitignore` for the build context. Without
  it, `COPY . .` sends your local `node_modules` (built for *your* OS) and
  `.git` into the image.
- **Run as non-root.** The official Node images ship a `node` user.
- **Exec-form `CMD ["node", "dist/server.mjs"]`** runs node directly, so it
  gets `SIGTERM` when the container stops. The shell form
  (`CMD node dist/server.mjs`) wraps it in `/bin/sh`, which can swallow the signal.
  Docker then waits 10s and kills it.

## Scenario
`hello-api` is a tiny JSON service. `npm run build` bundles `src/` and its
runtime dependency into a single `dist/server.mjs`, so production needs Node
and that one file, and nothing from `node_modules`. It listens on port 3000.

## Goal
1. Write a `Dockerfile` with two stages:
   - a named **build** stage that installs deps with `npm ci` and runs `npm run build`
   - a **runtime** stage on a small base (`node:20-alpine`) that copies only
     `dist/`, runs as the `node` user, `EXPOSE`s 3000 and starts with an
     exec-form `CMD`.
2. Write a `.dockerignore` that excludes at least `node_modules` and `.git`.
3. Build and run it, and hit it with curl:
   ```bash
   docker build -t hello-api .
   docker run --rm -d --name hello -p 3000:3000 hello-api
   curl localhost:3000/health
   docker logs hello
   docker stop hello
   ```

## Hints
- `docker history hello-api` shows each layer and its size.
  `docker image ls hello-api` shows the total.
- Edit `src/server.js` and rebuild. If `npm ci` runs again, your `COPY`s are
  in the wrong order.
- `docker run --rm -it --entrypoint sh hello-api` gives you a shell inside to look around.

## Check your work
Needs Docker running. The validator builds your image, checks its user and size,
makes sure no build-only packages leaked in, then runs it and curls it.
```
./onboard validate infrastructure/01
```
