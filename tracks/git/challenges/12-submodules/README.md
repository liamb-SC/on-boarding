# 12 · Add a submodule

**Skills:** `git submodule add`, `.gitmodules`, gitlinks

## What a submodule is
A submodule embeds **another repo** inside yours at a fixed commit. Your repo
doesn't store the library's files — it stores a *pointer* (a "gitlink") to one
commit of that other repo, plus a `.gitmodules` file describing where to get it.
Good for vendoring a shared library you want to pin and update deliberately.

## Scenario
Your app repo has `app.js` which imports `./vendor/lib`, but that library isn't
here yet. A separate library repo exists on disk (its path was printed when you
ran `./onboard start`, and is saved in `.git/note_upstream`).

## Goal
Add that library as a submodule at `vendor/lib` and commit it, so `.gitmodules`
and the gitlink are recorded and the library's files are checked out.

## Steps
```bash
git -c protocol.file.allow=always submodule add "$(cat .git/note_upstream)" vendor/lib
git commit -m "Vendor lib as a submodule"
```

- Why `-c protocol.file.allow=always`? Since Git 2.38, adding a submodule from a
  **local path** is blocked by default (a security fix, CVE-2022-39253). Real
  submodules over `https://`/`git@` don't need this flag — we only need it
  because our "upstream" is a local folder.
- Inspect the result: `git submodule status`, `cat .gitmodules`,
  `git ls-files --stage vendor/lib` (note the `160000` mode = gitlink).

## Check your work
```
./onboard validate git/12
```
