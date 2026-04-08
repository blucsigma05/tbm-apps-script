# Audit Standards

## Purpose
This file defines how repository audits should be run so results stay consistent across Codex, Opus, and future sessions.

## Core Rule
Do not call a flow "working" unless the path was traced from entry point to persistence target and the success path, failure path, and refresh path were inspected.

## Audit Lanes

### 1. Inventory Audit
Use this when you need a fast map of what exists.
Check:
- repo structure
- GAS files (`.gs`)
- HTML files (`.html`)
- manifest/config files
- docs/scripts/test folders
- recent changed files

### 2. Flow Audit
Use this when you need to trace user actions.
Check:
- UI entry points
- `google.script.run` calls
- client handlers
- server handlers
- validation logic
- write paths
- return contracts
- refresh/state update logic

### 3. Schema Audit
Use this when you need to validate spreadsheet and property assumptions.
Check:
- sheet/tab names
- column/header assumptions
- hard-coded ranges and indices
- `appendRow`, `setValue`, `setValues`, `getLastRow`
- `PropertiesService`, `CacheService`, `LockService`
- missing-tab and malformed-data handling

### 4. Diff Snapshot
Use this before or after changes.
Check:
- changed files
- diff stats
- TODO/FIXME markers
- scripts/docs added for auditability

## Severity Model
- **BLOCKER**: cannot trust deploy or core state can break/corrupt
- **CRITICAL**: likely user-facing failure or silent bad state
- **MAJOR**: reliability gap or high regression risk
- **MINOR**: real issue but not release-blocking
- **OBSERVATION**: maintainability or clarity issue

## Required Output
Every audit should end with:
1. Executive verdict
2. Confirmed blockers
3. High-risk paths
4. Patch order
5. Regression checks
6. Open unknowns

## Hard Rules
- Cite files/functions when possible
- Separate verified findings from assumptions
- Call out unverified dependencies explicitly
- Prefer evidence over style commentary
- Do not treat successful rendering as proof that persistence works
