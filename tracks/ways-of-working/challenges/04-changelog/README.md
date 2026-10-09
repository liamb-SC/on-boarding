# 04 · Change log and semantic versioning

**Skills:** Keep a Changelog format, semver (MAJOR.MINOR.PATCH), reading
`git log` for a release, tagging a release.

## Background
- A **changelog** is for *humans*: the people who use your service and need
  to know what changed. It's not a dump of `git log`. The
  [Keep a Changelog](https://keepachangelog.com) format groups entries under
  `### Added`, `Changed`, `Deprecated`, `Removed`, `Fixed` and `Security`,
  with an `## [Unreleased]` section at the top that collects changes until
  the next release.
- **Semantic versioning** (`MAJOR.MINOR.PATCH`):
  | Change | Bump | 1.3.0 → |
  |--------|------|---------|
  | bug fixes only | PATCH | 1.3.1 |
  | new, backwards-compatible features | MINOR | 1.4.0 |
  | anything that breaks existing callers | MAJOR | 2.0.0 |
- Conventional commits help: `feat:` is a feature, `fix:` is a fix, and `!`
  or `BREAKING CHANGE:` means a breaking change. `chore:`, `docs:` and `test:`
  usually don't matter to users.

## Scenario
`beacon-worker` was released as `v1.3.0`. Several commits have landed since.
It's release day: turn them into a changelog entry and cut the release.

## Goal
1. Read what changed since the last release: `git log v1.3.0..HEAD`.
2. In `CHANGELOG.md`, add a release section under `## [Unreleased]` with the
   right **version** and **date** (`## [x.y.z] - YYYY-MM-DD`). Leave
   Unreleased empty, and don't touch older sections.
3. File each user-facing change under the right `###` type. Mark the breaking
   change clearly. Leave out what users don't care about.
4. Update the compare links at the bottom of the file.
5. Set `version` in `package.json`, commit, and tag the release
   `v<version>`. Leave the working tree clean.

## Hints
- `git log v1.3.0..HEAD --format='%s%n%b'` shows subjects and bodies.
- `npm version <x.y.z> --no-git-tag-version` bumps package.json for you.
- `git tag -a v<version> -m "v<version>"` after you commit.

## Check your work
```
./onboard validate ways-of-working/04
```
