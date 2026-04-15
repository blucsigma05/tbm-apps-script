#!/usr/bin/env bash
# Sync TBM-project scheduled-tasks → global ~/.claude/scheduled-tasks/
#
# Why this exists:
#   Source of truth: <repo>/.claude/scheduled-tasks/  (git-tracked, PR-reviewed)
#   Desktop app reads from: ~/.claude/scheduled-tasks/  (global, NOT git-tracked)
#   Whenever a SKILL.md changes in the project, run this to push to global so
#   the desktop app's Scheduled Tasks UI sees the update.
#
# Run after: any merge that touches .claude/scheduled-tasks/
# Or just: every Monday morning as part of monday-drift-sweep
#
# Usage:
#   bash .claude/sync-scheduled-tasks.sh        # sync, report changes
#   bash .claude/sync-scheduled-tasks.sh --dry  # show what would change

set -e

DRY_RUN=0
[ "$1" = "--dry" ] && DRY_RUN=1

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$REPO_ROOT" ]; then
  echo "ERROR: not inside a git repo. Run from a TBM checkout." >&2
  exit 1
fi

SRC="$REPO_ROOT/.claude/scheduled-tasks"
DEST="$HOME/.claude/scheduled-tasks"

if [ ! -d "$SRC" ]; then
  echo "No scheduled-tasks in this repo ($SRC). Nothing to sync."
  exit 0
fi

mkdir -p "$DEST"

changed=0
unchanged=0

for src_dir in "$SRC"/*/; do
  task_name=$(basename "$src_dir")
  src_skill="$src_dir/SKILL.md"
  dest_dir="$DEST/$task_name"
  dest_skill="$dest_dir/SKILL.md"

  if [ ! -f "$src_skill" ]; then
    echo "  SKIP $task_name (no SKILL.md in source)"
    continue
  fi

  if [ -f "$dest_skill" ] && cmp -s "$src_skill" "$dest_skill"; then
    unchanged=$((unchanged + 1))
    continue
  fi

  if [ $DRY_RUN -eq 1 ]; then
    if [ ! -f "$dest_skill" ]; then
      echo "  WOULD ADD $task_name (new)"
    else
      echo "  WOULD UPDATE $task_name"
    fi
  else
    mkdir -p "$dest_dir"
    cp "$src_skill" "$dest_skill"
    if [ ! -f "$dest_skill.was" ]; then
      echo "  ADDED $task_name"
    else
      echo "  UPDATED $task_name"
    fi
  fi
  changed=$((changed + 1))
done

echo ""
if [ $DRY_RUN -eq 1 ]; then
  echo "Dry run: $changed would change, $unchanged unchanged"
else
  echo "Sync complete: $changed changed, $unchanged unchanged"
  if [ $changed -gt 0 ]; then
    echo ""
    echo "Reload the desktop app's Scheduled Tasks view to see changes."
    echo "If you added a NEW task, register it via: Desktop → Scheduled Tasks → Add"
  fi
fi
