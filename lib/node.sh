#!/usr/bin/env bash
# lib/node.sh — helpers for Node.js-based challenges (package-managers, graphql,
# grpc tracks). Source AFTER lib/sandbox.sh (setup) or lib/common.sh (validate).

# need <cmd> [hint] — stop with a clear message if a tool is missing
need() {
  command -v "$1" >/dev/null 2>&1 && return 0
  printf '✗ This challenge needs "%s", which is not installed.\n' "$1" >&2
  [ -n "${2:-}" ] && printf '  %s\n' "$2" >&2
  exit 1
}

# put <relpath>  — write stdin to a file in the sandbox (use with a heredoc)
put() {
  mkdir -p "$(dirname "$SANDBOX_DIR/$1")"
  cat > "$SANDBOX_DIR/$1"
}

# json <relpath> <js-expr> — evaluate an expression against a JSON file in the
# sandbox, bound to `j`. Prints strings raw, everything else as JSON, and
# nothing if the file or value is missing. e.g. json package.json 'j.dependencies.ms'
json() {
  node -e '
    let j; try { j = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")); } catch { process.exit(0); }
    let v; try { v = ('"$2"'); } catch { process.exit(0); }
    if (v !== undefined) process.stdout.write(typeof v === "string" ? v : JSON.stringify(v));
  ' "$SANDBOX_DIR/$1" 2>/dev/null
}

# in_sandbox <cmd...> — run a command from the sandbox root
in_sandbox() { (cd "$SANDBOX_DIR" && "$@"); }

# npm_install_sandbox — install the sandbox's dependencies (setup scripts only)
npm_install_sandbox() {
  printf 'Installing dependencies (needs network access to the npm registry)...\n'
  in_sandbox npm install --no-audit --no-fund --silent >/dev/null 2>&1 && return 0
  printf '✗ npm install failed. Check your network / registry access and run:\n  ./onboard reset <challenge>\n' >&2
  exit 1
}

# run_checks <cmd...> — run a JS validator built on lib/checks.mjs and turn each
# line it prints ("ok<TAB>desc" / "fail<TAB>desc<TAB>detail") into a ✓/✗ check,
# tallied exactly like the assert_* helpers. A crash counts as a failed check.
run_checks() {
  local out rc status desc detail
  out="$("$@" 2>&1)"; rc=$?
  while IFS=$'\t' read -r status desc detail; do
    case "$status" in
      ok)   _checks_total=$((_checks_total + 1)); _ok "$desc" ;;
      fail) _checks_total=$((_checks_total + 1)); _checks_failed=$((_checks_failed + 1)); _bad "$desc" "$detail" ;;
    esac
  done <<< "$out"
  if [ "$rc" -ne 0 ] && ! printf '%s\n' "$out" | grep -q $'^fail\t'; then
    _checks_total=$((_checks_total + 1)); _checks_failed=$((_checks_failed + 1))
    _bad "the checks crashed before finishing" "$(printf '%s\n' "$out" | grep -v $'^ok\t' | head -3 | tr '\n' ' ')"
  fi
}
