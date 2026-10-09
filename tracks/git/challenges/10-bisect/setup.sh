#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
sandbox_reset

good='#!/usr/bin/env bash
echo 42'
bad='#!/usr/bin/env bash
echo 99'

# Four healthy commits: calc.sh prints 42.
sb_write calc.sh "$good"; chmod +x "$SANDBOX_DIR/calc.sh"; sbg add -A; sbg commit -q -m "c1: add calc"
sb_commit notes1.txt "work" "c2: docs"
sb_commit notes2.txt "work" "c3: more docs"
sb_commit notes3.txt "work" "c4: tidy up"

# c5 introduces the regression: calc.sh now prints 99. This is the FIRST bad commit.
sb_write calc.sh "$bad"; sbg add -A; sbg commit -q -m "c5: refactor calc engine"
sb_stash_note bad_sha "$(sbg rev-parse HEAD)"

# Three further commits, still broken, to give bisect a range to search.
sb_commit notes4.txt "work" "c6: add tests"
sb_commit notes5.txt "work" "c7: logging"
sb_commit notes6.txt "work" "c8: release prep"

# An untracked test harness the learner can use with `git bisect run`.
# Untracked files survive the checkouts bisect performs.
cat > "$SANDBOX_DIR/test.sh" <<'EOF'
#!/usr/bin/env bash
# exit 0 = good (calc prints 42), non-zero = bad
[ "$(bash calc.sh)" = "42" ]
EOF
chmod +x "$SANDBOX_DIR/test.sh"
