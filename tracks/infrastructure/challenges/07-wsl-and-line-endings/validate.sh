#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"
source "$REPO_ROOT/lib/node.sh"

has_cr()      { grep -q $'\r' "$SANDBOX_DIR/$1"; }
head_has_cr() { git_show "$1" | grep -q $'\r'; }
attr()        { g check-attr "$2" -- "$1" 2>/dev/null | sed 's/.*: //'; }

# --- line endings ---------------------------------------------------------
assert_true  ".gitattributes is committed" git_tracked .gitattributes
assert_eq    ".gitattributes forces LF for *.sh (git check-attr eol scripts/deploy.sh)" "lf" "$(attr scripts/deploy.sh eol)"
assert_eq    ".gitattributes keeps CRLF for *.bat (git check-attr eol windows/run.bat)" "crlf" "$(attr windows/run.bat eol)"
assert_true  "other text files (like config/app.env) are normalised too (text=auto or text)" \
  grep -qE '^(set|auto)$' <<< "$(attr config/app.env text)"
for f in scripts/deploy.sh config/app.env windows/run.bat; do
  assert_false "the committed $f has LF endings (git renormalised it)" head_has_cr "$f"
done
assert_false "scripts/deploy.sh in your working tree has LF endings" has_cr scripts/deploy.sh
assert_false "config/app.env in your working tree has LF endings" has_cr config/app.env
assert_true  "windows/run.bat in your working tree still has CRLF endings (for cmd.exe)" has_cr windows/run.bat
assert_eq    "scripts/deploy.sh is still executable in git (mode 100755)" "100755" \
  "$(g ls-files -s scripts/deploy.sh | cut -d' ' -f1)"
assert_eq    "./scripts/deploy.sh runs" "deploying shop on port 3000" "$("$SANDBOX_DIR/scripts/deploy.sh" 2>&1)"
assert_true  "working tree is clean (everything committed)" git_working_tree_clean

# --- shell helpers --------------------------------------------------------
sh_try() { (cd "$SANDBOX_DIR" && bash -c "shopt -s expand_aliases; source shell/aliases.sh
$1" 2>/dev/null); }
assert_contains "alias gs runs git status -sb" "$(sh_try 'alias gs')" "git status -sb"
tmp="$(mktemp -d)"
assert_eq "mkcd a/b/c creates the directories and cds into them" "$tmp/a/b/c" "$(sh_try "mkcd '$tmp/a/b/c' && pwd")"
rm -rf "$tmp"
if command -v wslpath >/dev/null 2>&1; then want="$(cd "$SANDBOX_DIR" && wslpath -w "$PWD")"; else want="$SANDBOX_DIR"; fi
assert_eq "here prints this directory's path (the Windows form on WSL)" "$want" "$(sh_try 'here')"
if command -v zsh >/dev/null 2>&1; then
  assert_contains "aliases.sh also works in zsh" \
    "$(cd "$SANDBOX_DIR" && zsh -fc 'source shell/aliases.sh; alias gs; type mkcd here' 2>&1)" "git status -sb"
fi

# --- WSL quiz (answers hashed so they're not sitting in the repo) ---------
quiz() { json answers.json "require('crypto').createHash('sha256').update('wsl:$1:'+String(j.$1).trim().toLowerCase()).digest('hex').slice(0,12)"; }
right() { test "$(quiz "$1")" = "$2"; }
assert_true "q1: where a Node repo should live in WSL" right q1 e6605745c142
assert_true "q2: what wslpath -u 'C:\\Users\\sam' prints" right q2 4f26152970c6
assert_true "q3: the core.autocrlf value NOT to use inside WSL" right q3 eeb16afb591c
finish
