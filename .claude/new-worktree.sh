#!/usr/bin/env bash
# .claude/new-worktree.sh — create an isolated git worktree for a parallel
# Claude Code session. See ops/worktree-discipline.md for when to use this.
#
# Usage:
#   bash .claude/new-worktree.sh <branch-name> [base-ref]
#
# Examples:
#   bash .claude/new-worktree.sh feat/500-my-work
#   bash .claude/new-worktree.sh audit/pr-473 origin/feat/455-jt-first-pulse

set -euo pipefail

BRANCH="${1:-}"
BASE="${2:-origin/main}"

if [ -z "$BRANCH" ]; then
  echo "Usage: bash .claude/new-worktree.sh <branch-name> [base-ref]" >&2
  echo "Example: bash .claude/new-worktree.sh feat/500-my-work" >&2
  exit 1
fi

# Slug the branch name for filesystem safety: replace / and : with -, strip other non-safe chars
SLUG=$(echo "$BRANCH" | sed -e 's|[/:]|-|g' -e 's|[^a-zA-Z0-9_.-]||g')
WT_PATH=".claude/worktrees/$SLUG"

if [ -d "$WT_PATH" ]; then
  echo "Worktree already exists at: $WT_PATH" >&2
  echo "Either pick a different branch name or remove the existing worktree:" >&2
  echo "  git worktree remove $WT_PATH" >&2
  exit 1
fi

# Refresh base ref so the new worktree starts from current remote state
BASE_BRANCH="${BASE#origin/}"
echo "Fetching origin $BASE_BRANCH..."
git fetch origin "$BASE_BRANCH" 2>/dev/null || {
  echo "Warning: could not fetch origin/$BASE_BRANCH — continuing with local ref" >&2
}

# Create the worktree
git worktree add -b "$BRANCH" "$WT_PATH" "$BASE"

echo ""
echo "Worktree created."
echo "  Path:   $WT_PATH"
echo "  Branch: $BRANCH"
echo "  Base:   $BASE"
echo ""
echo "Next:"
echo "  cd $WT_PATH"
echo "  # edit, git add, git commit, git push, gh pr create"
echo ""
echo "When the PR merges:"
echo "  git worktree remove $WT_PATH"
echo "  git branch -D $BRANCH  # if the local branch still exists"
