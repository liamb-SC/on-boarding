FROM mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm

# httpie: testing/05. zsh: infrastructure/07. Playwright's system libraries
# for Chromium: testing/03 (the browser itself is fetched in on-create.sh, as
# the node user, so it lands in the cache Playwright looks in).
RUN apt-get update \
 && apt-get install -y --no-install-recommends httpie jq zsh \
 && npx -y playwright@latest install-deps chromium \
 && rm -rf /var/lib/apt/lists/*

# pnpm and yarn for the package-managers track, both via corepack so a
# project's "packageManager" field picks the version. The base image ships its
# own yarn 1 shims, which would shadow corepack's. No download prompt: it
# would hang setup scripts.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN rm -f /usr/local/bin/yarn /usr/local/bin/yarnpkg \
 && corepack enable

COPY first-run-notice.txt /usr/local/etc/vscode-dev-containers/first-run-notice.txt
