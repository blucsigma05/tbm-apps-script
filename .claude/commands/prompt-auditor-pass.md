---
name: prompt-auditor-pass
description: >
  Wrapper for the `prompt-auditor-pass` skill (two-pass adversarial prompt audit).
  Use when LT says `/prompt-auditor-pass` or asks for a scored prompt audit. Fails
  closed if neither the user-level nor the repo-local skill file is present.
---

# Prompt-Auditor Pass (wrapper)

This is a thin wrapper. The actual skill logic (rubric, scoring matrix, two-pass flow) lives in the SKILL.md file.

## Where the skill file lives

The skill currently exists in **two** places:

1. **Canonical:** `C:\Users\BluCs\.claude\skills\prompt-auditor-pass\SKILL.md` (user-level). Available in every project LT opens Claude Code against (TBM, MLS, Book Club, etc.).
2. **Repo-local mirror:** `.claude/skills/prompt-auditor-pass/SKILL.md` (committed via Gitea #118). Available to anything that clones this repo.

**User-level is the source of truth.** The repo-local copy is a mirror. When the rubric is edited, edit user-level first, then copy into the repo.

## Fallback (fail-closed)

If neither file is reachable:

1. Do NOT reconstruct the rubric from memory.
2. Do NOT invent a replacement scoring matrix.
3. Tell LT both copies are missing and ask where to pull the canonical from.

## Why keep both (for now)

- User-level is needed because the skill is cross-project (usable in MLS / Book Club / etc.) and follows LT's machine, not any specific repo.
- Repo-local is needed if a fresh clone on a different machine wants the skill without pulling LT's `C:\Users\BluCs` folder.

Drift risk is real (edit one, forget the other) but acceptable given current usage (mostly TBM, mostly LT's laptop). Revisit if drift actually bites.
