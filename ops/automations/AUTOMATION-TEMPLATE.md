# Scheduled Automation — SKILL.md Template

Canonical schema for `.claude/scheduled-tasks/<name>/SKILL.md`. All scheduled automations triggered from claude.ai must conform — the claude.ai web UI runs these as `Fetch <URL> via GitHub connector and execute it exactly`, so the SKILL.md IS the contract.

## Why this exists

claude.ai Automation threads have **no local filesystem access**. They run in the web app with connector-only tooling (GitHub / Notion / Drive). Without a single source of truth fetched at run time, every fire improvises from scratch and outputs drift run-to-run. Issue [#452](https://github.com/blucsigma05/tbm-apps-script/issues/452).

## Required schema

Every SKILL.md MUST have:

### 1. Frontmatter (YAML)

```yaml
---
name: <kebab-case-task-name>
description: <one-sentence purpose; include cadence (daily 6am, weekly Mon, monthly 1st)>
---
```

- `name` matches the parent folder name exactly
- `description` includes WHEN it fires + WHAT it produces (one sentence)

### 2. Opening line

One-sentence summary of what the run does, restating the description in active voice. Helps the agent read past the frontmatter and orient.

### 3. `## Steps` section

Numbered list of concrete actions. Each step:
- Names the tool / endpoint / file explicitly
- Says what to do with the result
- Avoids generic advice ("check things") in favor of named operations

For multi-part automations, use `## PART A — <name>` / `## PART B — <name>` instead of `## Steps`. Each part still has a numbered Steps list inside.

### 4. `## Output` section

Specifies the destination + format. Must use one of the four tier categories from the **Destination Tier Table** below.

### 5. `## On error` (or `## Override behavior`)

What to do when a step fails or when the run should be skipped. At minimum: which Pushover priority fires on failure, what gets silently swallowed.

## Destination Tier Table

Every automation output goes to exactly one of these four destinations. Mixing is allowed but each output line needs its tier called out.

| Tier | Destination | Use for |
|---|---|---|
| **Alert** | Pushover (named priority from `PUSHOVER_PRIORITY.*` in `AlertEngine.gs`) | Red/yellow operational signals — system down, gate breach, deploy fail |
| **Persistent finding** | Dedup'd Issue via `hygiene-filer.yml` (`.github/scripts/file_hygiene_issue.py`) | Anything needing a ticket — drift, broken state, recurring pattern |
| **Digest** | Comment on a pinned status Issue | Weekly rollups, low-priority recurring summaries |
| **Archive** | Append to a Notion page | Historical audit trail, raw data for later analysis |

For Pushover specifically, **always use the named constant**, never a bare integer. Reference `CLAUDE.md` § "Alert Tiers (HYG-12)" for the full table.

## The one-line claude.ai prompt template

Every Automation in the claude.ai web UI uses this exact prompt — substitute `<name>` for the folder name:

```
Fetch https://raw.githubusercontent.com/blucsigma05/tbm-apps-script/main/.claude/scheduled-tasks/<name>/SKILL.md via the GitHub connector and execute it exactly. Do not improvise. If a step requires capability not available in this thread, send a Pushover SYSTEM_ERROR (1) and stop.
```

Why a single line:
- Edit SKILL.md once → all future fires pick up the change in ≤24h (next scheduled run)
- claude.ai UI prompts are not under version control — minimizing what lives there minimizes drift surface
- "Do not improvise" + "stop on missing capability" is the anti-drift discipline

## Validation checklist for new automations

Before adding a new SKILL.md:

- [ ] Frontmatter `name` matches folder name exactly
- [ ] `description` says WHEN + WHAT in one sentence
- [ ] Opening line restates purpose in active voice
- [ ] `## Steps` (or `## PART A` / `## PART B`) with numbered actions
- [ ] `## Output` names destination tier from the table above
- [ ] `## On error` or `## Override behavior` defines failure behavior
- [ ] Pushover calls use named constants, not bare integers
- [ ] LT has been handed the one-line prompt to paste in claude.ai

## Where to find things

- Existing SKILL.md files: `.claude/scheduled-tasks/<name>/SKILL.md`
- Pushover priority constants: `AlertEngine.gs` → `PUSHOVER_PRIORITY.*`
- Hygiene Issue filer: `.github/scripts/file_hygiene_issue.py`
- Pinned status Issues: managed via `vars.STATUS_ISSUE_NUMBER`
- Notion archive root: see `CLAUDE.md` § "Notion IDs + Update Rules"

## Reference: existing automations (audit snapshot 2026-04-19)

| Folder | Cadence | Output tier(s) | Schema status |
|---|---|---|---|
| `morning-health-check` | Daily 6am | Alert (Pushover) | ✓ conforms |
| `stale-pr-check` | Daily 8am | Alert (Pushover) | ✓ conforms |
| `version-drift-check` | Daily 7am | Alert + Persistent finding | ✓ conforms |
| `sheet-schema-drift` | Daily 6:30am | Alert + Persistent finding | ✓ conforms |
| `spec-quality-gate` | Daily 8:30am | Alert | ✓ conforms |
| `issue-pr-deploy-traceability` | Saturday 6am | Alert + Persistent finding | ✓ conforms (multi-part) |
| `monday-drift-sweep` | Weekly Monday 6am | Digest | ✓ conforms (multi-part) |
| `monthly-health-and-structure` | 1st of month 6am | Digest + Archive | ✓ conforms (multi-part) |
| `weekly-notion-cleanup` | Weekly | Archive | confirms after audit |
| `claude-md-review` | Periodic | Archive (Notion) | **drift** — uses inline numbered list instead of `## Steps`; lacks `## Output` + `## On error` headers |

The one drift case (`claude-md-review`) functions correctly today — its inline list is parseable — but it doesn't match the schema and breaks the agent's pattern-matching when reading multiple SKILL.md files in one fire. Normalization is a follow-up Issue, not blocking for this template land.
