# claude.ai Automation Prompts — Copy-Paste Reference

LT pastes these one-liners into the claude.ai Automations UI. Each replaces whatever prompt currently lives there. Per Issue [#452](https://github.com/blucsigma05/tbm-apps-script/issues/452) — single source of truth is the SKILL.md, not the claude.ai prompt.

> **How to swap.** Open the Automation in claude.ai → edit the prompt → paste the matching line below → save. The next scheduled fire (≤24h) picks up the new contract. No deploy needed; no Claude Code involvement.

---

## The 10 Automations

### 1. morning-health-check (daily 6am)

```
Fetch https://raw.githubusercontent.com/blucsigma05/tbm-apps-script/main/.claude/scheduled-tasks/morning-health-check/SKILL.md via the GitHub connector and execute it exactly. Do not improvise. If a step requires capability not available in this thread, send a Pushover SYSTEM_ERROR (1) and stop.
```

### 2. stale-pr-check (daily 8am)

```
Fetch https://raw.githubusercontent.com/blucsigma05/tbm-apps-script/main/.claude/scheduled-tasks/stale-pr-check/SKILL.md via the GitHub connector and execute it exactly. Do not improvise. If a step requires capability not available in this thread, send a Pushover SYSTEM_ERROR (1) and stop.
```

### 3. version-drift-check (daily 7am)

```
Fetch https://raw.githubusercontent.com/blucsigma05/tbm-apps-script/main/.claude/scheduled-tasks/version-drift-check/SKILL.md via the GitHub connector and execute it exactly. Do not improvise. If a step requires capability not available in this thread, send a Pushover SYSTEM_ERROR (1) and stop.
```

### 4. sheet-schema-drift (daily 6:30am)

```
Fetch https://raw.githubusercontent.com/blucsigma05/tbm-apps-script/main/.claude/scheduled-tasks/sheet-schema-drift/SKILL.md via the GitHub connector and execute it exactly. Do not improvise. If a step requires capability not available in this thread, send a Pushover SYSTEM_ERROR (1) and stop.
```

### 5. spec-quality-gate (daily 8:30am)

```
Fetch https://raw.githubusercontent.com/blucsigma05/tbm-apps-script/main/.claude/scheduled-tasks/spec-quality-gate/SKILL.md via the GitHub connector and execute it exactly. Do not improvise. If a step requires capability not available in this thread, send a Pushover SYSTEM_ERROR (1) and stop.
```

### 6. issue-pr-deploy-traceability (Saturday 6am)

```
Fetch https://raw.githubusercontent.com/blucsigma05/tbm-apps-script/main/.claude/scheduled-tasks/issue-pr-deploy-traceability/SKILL.md via the GitHub connector and execute it exactly. Do not improvise. If a step requires capability not available in this thread, send a Pushover SYSTEM_ERROR (1) and stop.
```

### 7. monday-drift-sweep (Monday 6am)

```
Fetch https://raw.githubusercontent.com/blucsigma05/tbm-apps-script/main/.claude/scheduled-tasks/monday-drift-sweep/SKILL.md via the GitHub connector and execute it exactly. Do not improvise. If a step requires capability not available in this thread, send a Pushover SYSTEM_ERROR (1) and stop.
```

### 8. monthly-health-and-structure (1st of month 6am)

```
Fetch https://raw.githubusercontent.com/blucsigma05/tbm-apps-script/main/.claude/scheduled-tasks/monthly-health-and-structure/SKILL.md via the GitHub connector and execute it exactly. Do not improvise. If a step requires capability not available in this thread, send a Pushover SYSTEM_ERROR (1) and stop.
```

### 9. weekly-notion-cleanup (weekly)

```
Fetch https://raw.githubusercontent.com/blucsigma05/tbm-apps-script/main/.claude/scheduled-tasks/weekly-notion-cleanup/SKILL.md via the GitHub connector and execute it exactly. Do not improvise. If a step requires capability not available in this thread, send a Pushover SYSTEM_ERROR (1) and stop.
```

### 10. claude-md-review (periodic)

```
Fetch https://raw.githubusercontent.com/blucsigma05/tbm-apps-script/main/.claude/scheduled-tasks/claude-md-review/SKILL.md via the GitHub connector and execute it exactly. Do not improvise. If a step requires capability not available in this thread, send a Pushover SYSTEM_ERROR (1) and stop.
```

---

## After swap — verification

Next morning after you swap any of these, watch the Pushover for the run. The body should match the `## Output` section in the corresponding SKILL.md verbatim. If the format drifts, that's a sign the prompt didn't take or claude.ai cached the old one — re-paste and confirm.

For the daily ones (1–5), give it 24h. For the weekly/monthly ones, the next firing is the verification window.

## When the URL changes (don't, but if you have to)

These prompts hardcode the `main` branch. If you ever need to test a SKILL.md change before merge, point a single Automation's prompt at your branch:

```
Fetch https://raw.githubusercontent.com/blucsigma05/tbm-apps-script/<branch>/.claude/scheduled-tasks/<name>/SKILL.md via the GitHub connector and execute it exactly. ...
```

Swap back to `main` after the branch merges. Don't leave a non-main pointer in production — once the branch deletes, the URL 404s and the Automation breaks silently.
