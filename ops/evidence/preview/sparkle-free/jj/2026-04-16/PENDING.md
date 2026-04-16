# Evidence: SparkleLearning Free — JJ evaluation

| Field | Value |
|---|---|
| Surface | SparkleLearning Free |
| Route | /sparkle-free |
| Child | JJ |
| Device profile | jj-learning-tablet (Samsung S10 FE 1200x1920) |
| Date | 2026-04-16 |
| Status | **PENDING** |

## Pending captures

- `screenshot.png` — viewport screenshot via preview_screenshot
- `snapshot.json` — accessibility tree snapshot via preview_snapshot

## Why pending

Preview MCP tools (preview_start, preview_screenshot, preview_snapshot) were not available in
the build thread session that created this PR. These tools require the Claude Preview panel
integration with the tbm-preview config declared in `.claude/launch.json`.

The launcher (`.claude/launch.json`) and proxy (`.claude/preview-proxy.js`) are committed in
this PR. Captures should be run in the next available session with Preview tools enabled and
committed to this directory.

## MVSS v1 rubric criteria to document

Run the Play gate rubric (ops/play-gate-rubric.v1.json) for SparkleLearning Free at the jj-learning-tablet (Samsung S10 FE 1200x1920)
device profile. Capture screenshot evidence for:
- U2 (loads cleanly)
- U3 (correct child context)
- U8 (feedback understandable)
- U13 (empty state defined — inject empty data)
- U14 (error has retry path — inject error)
