# Audit Standards

## Purpose
Defines how repository audits run so results stay consistent across Codex, Claude Code,
and future sessions. Deploy pipeline steps and QA gates live in CLAUDE.md — this file
covers the deeper audit discipline that sits above those gates.

## Core Rule
Do not call a flow "working" unless the path was traced from entry point to persistence
target and the success path, failure path, and refresh path were all inspected.

## Severity Model
| Level | Meaning | Merge? |
|-------|---------|--------|
| **BLOCKER** | Core state can break/corrupt, or deploy trust is lost | No |
| **CRITICAL** | User-facing failure or silent bad state | No |
| **MAJOR** | Reliability gap or high regression risk | Risk-accept only |
| **MINOR** | Real issue but not release-blocking | Yes, with note |
| **OBSERVATION** | Maintainability or clarity issue | Yes |

## Known Blocker Patterns (TBM-specific)
These patterns have caused real blockers in past audits. Any audit MUST check for them:

| Pattern | Why it's dangerous | Automated check |
|---------|-------------------|-----------------|
| `getSheetByName('emoji...')` bypassing TAB_MAP | Breaks when tab names change | `audit-deep.sh` TAB_MAP bypass |
| `openById('1_jn-...')` outside TBMConfig | SSID hardcoding defeats env switching | `audit-deep.sh` SSID hardcode |
| `getProperty('NOTION_API_KEY')` vs `NOTION_TOKEN` | Token name split = one path fails silently | `audit-deep.sh` Notion token |
| Write path without `LockService`/`waitLock` | Concurrent writes corrupt data | `audit-deep.sh` lock coverage |
| `sendPush_()` with bare integer priority | Bypasses PUSHOVER_PRIORITY constants | `audit-deep.sh` bare priority |
| `appendRow` with wrong column count | Silent column misalignment | Manual trace |
| ES6 syntax in `.html` files | Silent break on Fire Stick WebView | `audit-source.sh` ES5 check |
| Missing `withFailureHandler()` | Errors swallowed on client | `audit-source.sh` wiring check |

## Required Output
Every audit should end with:
1. Executive verdict (score, trust level, conditional/unconditional)
2. Confirmed blockers with file:line citations
3. High-risk paths (traced flows that are fragile)
4. Patch order (dependency-aware waves)
5. Regression checks (specific test cases)
6. Open unknowns (questions that need runtime or human verification)

## Hard Rules
- **Cite file:line** — every finding must point to source, not just a file name
- **Verified vs assumed** — separate confirmed findings from inferred risks
- **Evidence over style** — don't flag formatting; flag persistence and data integrity
- **Rendering is not proof** — a page that loads does not prove data saves correctly
- **Grep is a lead, not a fact** — grep output tells you where to look, not what it means.
  Read the surrounding code before writing the finding.
- **Retract when wrong** — if a finding is disproven during the audit, formally retract it
  with explanation. Don't silently delete.

## Relationship to Other Files
| File | What it covers |
|------|---------------|
| `CLAUDE.md` | Deploy pipeline (13 steps), QA gates (7+2), ES5 rules, pattern registry |
| `audit-source.sh` | Pre-push gate: ES5, versions, routes, wiring, branch staleness |
| `scripts/audit-deep.sh` | Deep analysis: TAB_MAP bypass, SSID hardcoding, lock coverage, save paths |
| This file | Audit discipline: severity model, evidence rules, output format |
