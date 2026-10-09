# 07 · WSL, line endings and shell setup

**Skills:** CRLF vs LF, `.gitattributes` (`text=auto`, `eol=`),
`git add --renormalize`, `git ls-files --eol`, `core.autocrlf`, `wslpath`,
`/mnt/c` vs the Linux filesystem, aliases and functions in your shell rc.
Most of this applies on macOS and plain Linux too.

## Background
- **Line endings.** Windows tools write `\r\n` (CRLF). Linux expects `\n` (LF).
  A shell script saved with CRLF fails with
  `/usr/bin/env: 'bash\r': No such file or directory`, and a sourced
  `PORT=3000\r` gives a value with an invisible `\r` on the end.
- **`.gitattributes` fixes it for everyone**, whatever their editor or OS:
  ```gitattributes
  * text=auto eol=lf     # normalise text files, check them out as LF
  *.bat text eol=crlf    # ...except files Windows itself must run
  ```
  Git then stores LF in the repo. Files already committed with CRLF need a
  one-off `git add --renormalize .`.
- **`core.autocrlf`** is the old per-machine setting. Inside WSL, `true` is the
  wrong choice: it checks files out as CRLF in a Linux environment. Prefer
  `.gitattributes`, plus `input` or `false` locally.
- **Where your code lives matters in WSL.** `/mnt/c/...` is the Windows disk,
  reached over a translation layer. It's many times slower for
  `npm install`/`git status`, and file watchers miss changes. Keep repos in
  the Linux filesystem (`~/code`) and open them from Windows via
  `\\wsl.localhost\<distro>\...` or `code .`.
- **`wslpath`** converts paths: `wslpath -w ~` gives the Windows form,
  `wslpath -u 'C:\Users\me'` gives the Linux form. `explorer.exe .` opens the
  current folder in Explorer.

## Scenario
Someone committed `scripts/deploy.sh`, `config/app.env` and `windows/run.bat`
from Windows with CRLF endings. `./scripts/deploy.sh` doesn't run.

## Goal
1. Add a `.gitattributes` that normalises text files to LF, forces LF for
   `*.sh` and keeps CRLF for `*.bat`. Renormalise, commit, and make your
   working copies match (the script must run and stay executable).
2. In `shell/aliases.sh` write, for bash **and** zsh:
   - `alias gs='git status -sb'`
   - `mkcd DIR`: `mkdir -p` it and `cd` into it
   - `here`: print the current directory as a Windows path on WSL
     (`wslpath -w`), or the normal path anywhere else
   Then `source` it from your own `~/.bashrc` / `~/.zshrc` if you like it.
3. Answer `answers.json` with a letter each:
   - **q1** `npm install` is slow and file watching misses changes. Where should
     the repo live? a) `/mnt/c/Users/you/code` b) `~/code` c) a mapped network drive
   - **q2** `wslpath -u 'C:\Users\sam'` prints: a) `C:/Users/sam`
     b) `/mnt/c/Users/sam` c) `\\wsl.localhost\Ubuntu\Users\sam`
   - **q3** Which `core.autocrlf` value should you **not** use inside WSL?
     a) `true` b) `input` c) `false`

## Hints
- `git ls-files --eol` shows each file's endings in the index (`i/`), your
  working tree (`w/`) and its attributes. `file scripts/deploy.sh` says
  "with CRLF line terminators".
- After `git add --renormalize .` and a commit, your working copies still
  have CRLF. Make git write them out again: `git rm -r --cached . -q && git reset --hard`.
- `type mkcd` shows how your shell sees a name: alias, function or command.
- Windows Terminal: in Settings, make your distro the default profile and set
  its starting directory to `~` (`\\wsl.localhost\<distro>\home\<you>`), so new
  tabs open in Linux, not `/mnt/c/Users/...`.

## Check your work
```
./onboard validate infrastructure/07
```
