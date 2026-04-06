Title: Closed-Loop Build Pipeline v1
Notion link: Pending page update
Repo: blucsigma05/tbm-apps-script
Owner: LT
Current pipeline status: In progress

## Problem

Claude Code, Codex review, CI, Pushover, and Notion exist as separate parts, but they do not form one closed deployment loop. LT still has to stitch status together manually.

## Verified On

- `Alertenginev1.js` already exposes `sendPush_()`
- `Code.js` already exposes `doPost()` and Notion helpers
- `.github/workflows/ci.yml` already runs production `?action=runTests`
- `.github/workflows/gemini-review.yml` already exists
- Codex review is already enabled on connected PRs

## Why it matters

LT wants one build lane:

`build request -> approved plan -> build -> deploy -> PR -> reviews -> approval -> merge`

with Pushover and Notion reflecting pipeline state so the only human touchpoints are plan approval and PR approval.

## What changes

- Add a typed pipeline notification wrapper over `sendPush_()`
- Add a POST relay path in `Code.js` for GitHub Actions and local commands
- Add a Notion pipeline event sink
- Add a review watcher that maintains one machine-readable PR summary comment
- Add Claude commands for `fix-pr-comments` and `deploy-pipeline`
- Standardize spec intake under `ops/specs/`
- Harden branch protection and auto-merge outside the repo via GitHub settings

## Unknowns

- Exact Notion database schema for the pipeline event log
- Final machine-readable Codex signal shape across all PRs
- Whether MLS requires different workflow names or only different file paths

## LT decisions needed

- Auto-merge is approved as the final post-approval action
- Codex remains observed, not required, until its signal is verified stable

## Acceptance test

- Valid relay POST sends a Pushover notification and records a pipeline event
- Failed PR tests produce a `tests_failed` relay event without blocking the PR comment update
- The watcher maintains one updatable summary comment with `WAITING`, `FIX_NEEDED`, `READY_TO_MERGE`, or `STOPPED`
- `fix-pr-comments` enforces the 3-cycle cap
- `deploy-pipeline` requires a spec and enables PR auto-merge after PR creation

## Evidence after completion

- Changed GAS relay code in `Alertenginev1.js` and `Code.js`
- New workflow files under `.github/workflows/`
- New watcher script under `.github/scripts/`
- New Claude commands under `.claude/commands/`
- Spec lane created under `ops/specs/`

## Codex review checklist

- [ ] Relay payload validation rejects bad secrets and unknown types
- [ ] Summary length handling is deterministic
- [ ] Review watcher updates one comment instead of spamming
- [ ] Codex is treated as observed-only
- [ ] Auto-merge is enabled by command/settings, not assumed
- [ ] MLS parity is preserved for shared contract fields
