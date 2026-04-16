#!/bin/bash
# TBM git hooks setup — run once per clone.
# Wires .githooks/ as the active hooks directory.
# Usage: bash scripts/setup-hooks.sh

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
echo "✅ Git hooks wired: .githooks/pre-commit will run audit-source.sh before every commit."
echo "   To uninstall: git config --unset core.hooksPath"
