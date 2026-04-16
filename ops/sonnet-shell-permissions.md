# Sonnet Shell Permissions — Authoritative Command Matrix

*Investigated 2026-04-16 | Issue #388 | Claude Code v2.1.111*

---

## Root Cause Summary

**Sonnet build threads ask LT to manually run `git push` because of Claude Code's built-in model-level caution on remote-affecting commands — not due to hooks, settings, or credential config.**

The CLI system prompt explicitly instructs the model:
> "Actions visible to others or that affect shared state: pushing code... unless actions are authorized in advance in durable instructions like CLAUDE.md files, always confirm first."

`"Bash(*)"` in `settings.json` bypasses the **user permission prompt** (the interactive "allow/deny" dialog). It does NOT override the **model's internal caution** on remote-affecting operations. These are two separate layers.

---

## Two-Layer Permission Model

| Layer | What controls it | What `Bash(*)` affects |
|---|---|---|
| **User permission prompt** | `settings.json` allow list + hooks | ✅ Bypassed by `Bash(*)` |
| **Model-internal caution** | Claude Code system prompt | ❌ Not affected by `Bash(*)` |

The model-internal caution is only overridable via **durable instructions in CLAUDE.md** (the system prompt says so explicitly).

---

## Why Mastermind Differs from Sonnet Build Threads

| Factor | Mastermind (Opus, main thread) | Sonnet build thread |
|---|---|---|
| Session context | LT in-session, explicit task authorization | Starts fresh, no prior authorization signal |
| CLAUDE.md loaded | Yes, full context | Yes, but lacks *explicit push pre-auth* |
| Model caution level | More likely to proceed given in-session context | Strictly follows "confirm remote ops" rule |

---

## Command Permission Matrix

### Runs autonomously (no confirmation needed)

| Command | Why |
|---|---|
| `git status`, `git log`, `git diff` | Read-only, no remote effect |
| `git add <specific files>` | Local staging, reversible |
| `git commit -m "..."` | Local only (hook still enforces #N and branch rules) |
| `git checkout -b <branch>` | Local branch creation |
| `git pull` | Fetch+merge, non-destructive |
| `git push origin <feature-branch>` | **Pre-authorized in CLAUDE.md** (see fix below) |

### Requires LT confirmation

| Command | Why |
|---|---|
| `git push --force` / `git push -f` | Blocked by `pretool-bash.sh` (h); destructive |
| `git push origin main` / `git push origin master` | Unguarded push to protected branches |
| `git reset --hard` | Blocked (h); destroys local changes |
| `git branch -D` | Blocked (h); hard delete |
| `clasp push` outside pipeline | Blocked (u); use `/deploy-pipeline` or `HOTFIX=1` |
| `gh pr merge --merge` / `--squash` | Affects shared state, not pre-authorized |

### Blocked by hook (cannot run)

| Command | Hook rule | Override |
|---|---|---|
| `git add .` / `git add -A` | Rule (e) | Stage by name |
| `git push --force` / `-f` | Rule (h) | `EMERGENCY=1` |
| `git reset --hard` | Rule (h) | `EMERGENCY=1` |
| `git commit` without `#N` | Rule (t) | `CHORE:` / `DOCS:` / `CONFIG:` / `WIP:` prefix |
| `git commit` on main | Rule (v) | `EMERGENCY=1` |
| `clasp push` outside pipeline | Rule (u) | `HOTFIX=1` or `/deploy-pipeline` |

---

## The Fix

Added to `~/.claude/CLAUDE.md` **Build Flow** section:

```
git push origin <feature-branch> during Build lane work is pre-authorized.
Execute autonomously — do not ask LT for confirmation.
```

This places the authorization in "durable instructions like CLAUDE.md files" — the mechanism the CLI system prompt explicitly points to for bypassing model-level remote-op caution.

---

## Verification Steps Completed

| Check | Result |
|---|---|
| `settings.json` allow list | `"Bash(*)"` present — user prompt bypassed |
| `pretool-bash.sh` | No rule blocking plain `git push origin <branch>` |
| Git credential helper | `!gh auth git-credential` — non-interactive OAuth |
| Hook output for plain push | Exit 0 (passes through) |
| System prompt caution | **Root cause** — model requires CLAUDE.md authorization |
| Mastermind vs. Sonnet diff | In-session authorization vs. fresh session without explicit auth |

---

## Workaround (if CLAUDE.md fix is insufficient)

Mastermind can push on Sonnet's behalf. In the Mastermind thread:

```bash
git push origin <branch-name>
```

This works because Mastermind has the in-session authorization signal. File a Claude Code upstream issue if the CLAUDE.md fix proves unreliable across model versions.

---

## Related

- Parent epic: #376 (courier-reduction)
- Issue: #388 (this investigation)
- Claude Code version: 2.1.111
