#!/bin/bash
# TBM git hooks setup — run once per clone.
# Wires .githooks/ as the active hooks directory.
# Usage: bash scripts/setup-hooks.sh

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
chmod +x .githooks/pre-push
chmod +x .githooks/commit-msg
echo "✅ Git hooks wired:"
echo "   pre-commit  — audit-source.sh (ES5, version consistency, wiring, freeze gate)"
echo "   pre-push    — deploy freeze gate re-check before push (catches commits predating a freeze)"
echo "   commit-msg  — EMERGENCY: prefix enforcement when EMERGENCY=1 bypass is used"
echo "   To uninstall: git config --unset core.hooksPath"
