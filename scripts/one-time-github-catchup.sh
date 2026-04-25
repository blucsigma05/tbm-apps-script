#!/usr/bin/env bash
# scripts/one-time-github-catchup.sh
#
# One-time fast-forward of origin/main (GitHub) to gitea/main, closing the
# 50-commit gap that opened while GitHub was suspended (2026-04-19 → 2026-04-22).
#
# Expected starting state, verified 2026-04-22:
#   origin/main @ be463e3 is 0 ahead, 50 behind gitea/main @ beb5893.
#
# That is a pure fast-forward relationship (origin/main is an ancestor of
# gitea/main), so git accepts `git push origin gitea/main:main` as a plain
# non-forced push.
#
# If this script fails, investigate — it means repo state is not what the
# forge-canon plan (Gitea Issue #60 + #61) assumed. Do NOT silently override
# with --force or --force-with-lease. The fail-loud behavior is the safeguard.
#
# Run from a clean checkout of tbm-apps-script, on any branch (branch does not
# matter — we push the ref `refs/remotes/gitea/main` directly, not HEAD).
#
# After this script succeeds, the .gitea/workflows/mirror-to-github.yml workflow
# keeps origin/main in sync automatically on every push to gitea/main.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "")"
if [ -z "$REPO_ROOT" ]; then
  echo "ERROR: not inside a git working tree. Run from the tbm-apps-script repo."
  exit 1
fi
cd "$REPO_ROOT"

echo "== repo =="
echo "  path:     $REPO_ROOT"
echo "  HEAD:     $(git rev-parse HEAD) ($(git symbolic-ref --short -q HEAD 2>/dev/null || echo 'detached'))"

# Verify remotes exist.
if ! git remote | grep -qx origin; then
  echo "ERROR: 'origin' remote (GitHub) not configured. Expected:"
  echo "  origin  https://github.com/blucsigma05/tbm-apps-script.git"
  exit 1
fi
if ! git remote | grep -qx gitea; then
  echo "ERROR: 'gitea' remote not configured. Expected:"
  echo "  gitea   https://git.thompsonfams.com/blucsigma05/tbm-apps-script.git"
  exit 1
fi

echo ""
echo "== pre-check: fetch both remotes =="
git fetch gitea  main --quiet
git fetch origin main --quiet

DIVERGENCE="$(git rev-list --left-right --count origin/main...gitea/main)"
AHEAD="$(echo "$DIVERGENCE" | awk '{print $1}')"
BEHIND="$(echo "$DIVERGENCE" | awk '{print $2}')"
echo "  origin/main vs gitea/main  (ahead / behind):  ${AHEAD} / ${BEHIND}"
echo "  gitea/main  @ $(git rev-parse gitea/main)"
echo "  origin/main @ $(git rev-parse origin/main)"

if [ "$AHEAD" != "0" ]; then
  echo ""
  echo "ERROR: origin/main is ${AHEAD} commit(s) AHEAD of gitea/main."
  echo "  A pure fast-forward is not possible from this state."
  echo "  This means GitHub has commits gitea does not — investigate before proceeding."
  echo "  Refusing to push. Do NOT use --force to paper this over."
  exit 1
fi

if [ "$BEHIND" = "0" ]; then
  echo ""
  echo "origin/main is already up-to-date with gitea/main. Nothing to push."
  exit 0
fi

echo ""
echo "== pushing gitea/main → origin/main (fast-forward, no --force) =="
# Push the remote-tracking ref directly — no local branch required.
git push origin "refs/remotes/gitea/main:refs/heads/main"

echo ""
echo "== post-check =="
git fetch origin main --quiet
POST="$(git rev-list --left-right --count origin/main...gitea/main)"
echo "  origin/main vs gitea/main  (ahead / behind):  ${POST}"
if [ "$POST" = "0	0" ]; then
  echo "  SUCCESS: origin/main is now synchronized with gitea/main."
else
  echo "  WARN: origin/main and gitea/main still diverge after push."
  echo "  Re-investigate before declaring catchup complete."
  exit 1
fi

echo ""
echo "== pushing tags =="
# --tags ships only tags that don't already exist on origin. Safe to run once.
git push origin --tags

echo ""
echo "== DONE =="
echo "The .gitea/workflows/mirror-to-github.yml workflow now keeps origin/main"
echo "in sync with every future push to gitea/main."
