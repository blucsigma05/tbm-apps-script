# `.githooks/` — Repo-Local Git Hooks

These hooks enforce TBM workflow rules at the git layer. They are
**repo-local** — every clone needs to opt in once:

```bash
bash scripts/setup-hooks.sh
# equivalent to: git config core.hooksPath .githooks
```

---

## The split

TBM workflow rules live in two tiers. Each tier catches different
contexts; both tiers can run — they're additive, not competing.

| Tier | Location | Runs when | Purpose |
|---|---|---|---|
| **Claude harness** | `~/.claude/hooks/` (user-global) | LT's Claude Code session invokes a Bash tool | Fast deny-before-execute on LT's interactive sessions. Blocks the `git ...` command string before `git` ever starts. |
| **Repo git hooks** | `.githooks/` (this dir, committed to the repo) | Any clone of the repo runs `git commit` or `git push` | Enforces rules on **all** callers — autonomous agents without LT's global profile, CI runs, other machines, `git` via editor plugins, heredoc flows the command-string hook misses. |

**Rule of thumb:** rules that should apply to any actor touching the
repo belong here. Rules that are about LT's personal Claude workflow
(ergonomics, reminders, next-step menus) belong in the global harness.

The two tiers overlap intentionally on the high-value rules (e.g. the
`#N` / override-prefix rule). Overlap = defense in depth.

---

## What each hook enforces

### `commit-msg`

Validates the commit message (the file git passes in `$1`).

- **Standard commits** must match one of:
  - Issue reference: `#NNN`, `Closes #NNN`, `Fixes #NNN`, `Refs #NNN` anywhere in the first line
  - Override prefix: `CHORE:` / `DOCS:` / `CONFIG:` / `WIP:`
- **`EMERGENCY=1` bypass** requires the first line to start with
  `EMERGENCY: <reason>` — this creates an audit trail for every
  freeze-gate bypass.
- Merge / revert / fixup / squash auto-commits are passed through.

### `pre-commit`

Runs `audit-source.sh` before the commit is recorded. Blocks on any
static-audit failure — ES5 violations in `.html`, version-consistency
drift in `.gs`, `withFailureHandler` wiring holes, route-integrity
breaks, etc. Full check list is in the audit script.

Bypass (not recommended): `git commit --no-verify`.

### `pre-push`

Re-runs the deploy-freeze gate at push time. Catches commits made
*before* a freeze was activated — those would pass the `pre-commit`
gate but still need to be blocked at push. Requires `jq` + `clasp`
for the runtime check; skips with a warning if those tools aren't
installed.

Bypass: `EMERGENCY=1 git push` — but **all** commits being pushed
must carry the `EMERGENCY:` prefix (validated over the push range,
not just `HEAD`).

---

## Why `core.hooksPath` instead of copying to `.git/hooks/`

`.git/hooks/` is untracked. A copy there drifts from the committed
version every time someone forgets to re-run the setup. Pointing
`core.hooksPath` at `.githooks/` keeps the source of truth in the
repo — pull changes, the new hook is live.

Trade-off: one extra setup step per clone. The `scripts/setup-hooks.sh`
one-liner covers it.

---

## Adding a new hook

1. Write the hook as `.githooks/<event>` (e.g. `.githooks/post-commit`).
2. Make it executable: `chmod +x .githooks/<event>`.
3. Decide whether the corresponding rule also belongs in the global
   Claude harness — if yes, add it to `~/.claude/hooks/pretool-bash.sh`
   with a matching override env var.
4. Update `scripts/setup-hooks.sh` to `chmod +x` the new file and
   list it in the "✅ Git hooks wired" output.
5. Document the hook + its overrides in this README.
