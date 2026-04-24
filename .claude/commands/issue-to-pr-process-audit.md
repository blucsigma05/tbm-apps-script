---
name: issue-to-pr-process-audit
description: >
  Pointer wrapper for the canonical Issue -> PR -> Merge process audit prompt.
  Use when LT says "audit the pipeline" or `/issue-to-pr-process-audit`.
---

# Issue -> PR Process Audit (pointer)

Canonical prompt lives at [`ops/prompts/issue-to-pr-process-audit.md`](../../ops/prompts/issue-to-pr-process-audit.md).

**This file is a pointer.** It does NOT duplicate the prompt body, rubric, reading list, or required output shape. All of that is in the canonical file.

## Invocation

- Read the canonical prompt from `ops/prompts/issue-to-pr-process-audit.md`.
- Paste into Codex / GPT / another reasoning model to run the audit.
- Or ask Claude (in this session) to follow the prompt directly and return the required output shape.

## What NOT to do

- Do not duplicate the prompt body here - if the canonical file drifts, this wrapper would silently lie.
- Do not extend this wrapper past ~30 lines - if you're tempted, edit the canonical file instead.

## Related

- User-level skill: `prompt-auditor-pass` (invoked when building/auditing this prompt for a specific thread)
- Wrapper for that skill: [`.claude/commands/prompt-auditor-pass.md`](./prompt-auditor-pass.md)
