# Worktree Discipline for Parallel Claude Code Sessions

> Every parallel Claude Code session that edits files gets its own isolated
> git worktree. Only one session owns the main checkout at a time — by
> convention, the currently active Sonnet build lane (per CLAUDE.md Session
> Start rule that mandates `cd "C:/Dev/tbm-apps-script"`).

## Why this rule exists

When two Claude Code sessions share `C:/Dev/tbm-apps-script/`, whichever one
runs `git checkout <branch>` last silently stomps the other's working state.
Uncommitted edits can disappear, branch state can flip mid-edit, and `git
status` output becomes unreadable because it reflects whichever session
checked out most recently.

Git worktrees solve this by giving each session its own filesystem copy
tied to the same repo history. Branches, commits, and pushes all still
flow through the shared `.git` directory — only the working tree is
isolated per session.

## The role-to-location map

| Role | Working directory | Why |
|---|---|---|
| Active Sonnet build lane | `C:/Dev/tbm-apps-script/` (main) | CLAUDE.md § Session Start convention; `.claude/settings.local.json` MCP/Bash allowances are scoped to this path |
| Master thread (admin, planning, Opus admin sessions) | `.claude/worktrees/master-*/` | Long-lived; should never contend with a build lane on the main checkout |
| Parallel Opus or Sonnet build lanes | `.claude/worktrees/<branch-slug>/` | Isolates from main + from each other |
| Audit / review threads | `.claude/worktrees/<topic>-review/` or `C:/Dev/tbm-apps-script-<topic>/` | Read-only work still benefits from isolated checkout |

## How to create a new worktree

```bash
bash .claude/new-worktree.sh <branch-name> [base-ref]
```

Examples:

```bash
# Build lane on a fresh branch off origin/main
bash .claude/new-worktree.sh feat/500-my-work

# Audit worktree off a specific PR head
bash .claude/new-worktree.sh audit/pr-473-review origin/feat/455-jt-first-pulse
```

The helper:

1. Validates branch name was given
2. Slugs the branch name for filesystem safety (`/`, `:` → `-`)
3. Runs `git fetch origin <base-branch>` to make sure the base ref is current
4. Creates `.claude/worktrees/<slug>/` with the new branch checked out
5. Fails loudly if the worktree path already exists

Then `cd` into the worktree path and work normally — `git add`, `git commit`,
`git push` all work as usual.

## Cleanup after merge

When a PR merges and the worktree is no longer needed:

```bash
git worktree remove .claude/worktrees/<slug>
git branch -D <branch-name>  # if the local branch still exists
```

Periodic sweep:

```bash
git worktree list
git worktree prune  # removes administrative metadata for deleted worktrees
```

## How this fits with existing rules

- **CLAUDE.md § Session Start** — Sonnet's mandatory `cd "C:/Dev/tbm-apps-script"`
  is unchanged. Sonnet still owns main when it is active.
- **CLAUDE.md § Workflow — Hot file lock** — worktrees do NOT bypass the
  hot-file rule (`.github/workflows/**`, `.github/scripts/**`, `CLAUDE.md`,
  `audit-source.sh`). Two worktrees can edit a hot file locally, but only one
  PR may be in flight at a time.
- **Issue #446** — shared repo hygiene baseline. This discipline is one
  component of that broader baseline.

## What this does not solve

- Concurrent edits to the same file across worktrees — git treats it as a
  normal merge conflict at commit time. Coordinate in chat when two lanes
  need to touch the same file.
- `.claude/settings.local.json` scope — per-machine; each worktree inherits
  the main checkout's settings since `.claude/` is gitignored.

## Related

- [#446](https://github.com/blucsigma05/tbm-apps-script/issues/446) — Shared repo hygiene baseline (parent)
- `CLAUDE.md` § Session Start — Sonnet main-dir convention
- `.claude/new-worktree.sh` — the helper script referenced above
