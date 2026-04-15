#!/usr/bin/env bash
# sync-scheduled-tasks.sh — Copy project-level scheduled tasks to global ~/.claude/scheduled-tasks/
# Source of truth: .claude/scheduled-tasks/ (git-tracked, PR'd)
# Target: ~/.claude/scheduled-tasks/ (desktop app reads from here)
#
# Run after merge or when tasks change:
#   bash sync-scheduled-tasks.sh

set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)/.claude/scheduled-tasks"
DST="$HOME/.claude/scheduled-tasks"

if [ ! -d "$SRC" ]; then
  echo "ERROR: Source directory not found: $SRC" >&2
  exit 1
fi

mkdir -p "$DST"

count=0
for task_dir in "$SRC"/*/; do
  name=$(basename "$task_dir")
  if [ ! -f "$task_dir/SKILL.md" ]; then
    echo "SKIP: $name (no SKILL.md)"
    continue
  fi
  mkdir -p "$DST/$name"
  if ! cmp -s "$task_dir/SKILL.md" "$DST/$name/SKILL.md" 2>/dev/null; then
    cp "$task_dir/SKILL.md" "$DST/$name/SKILL.md"
    echo "SYNC: $name"
    count=$((count + 1))
  fi
done

# Prune tasks deleted from repo source of truth
pruned=0
for dst_dir in "$DST"/*/; do
  name=$(basename "$dst_dir")
  if [ ! -d "$SRC/$name" ]; then
    rm -rf "$dst_dir"
    echo "PRUNE: $name (removed from repo)"
    pruned=$((pruned + 1))
  fi
done

if [ $count -eq 0 ] && [ $pruned -eq 0 ]; then
  echo "All tasks already in sync."
else
  echo "$count synced, $pruned pruned in $DST"
fi
