---
name: deploy-pipeline
description: >
  Run the full TBM build pipeline from approved spec through deploy, PR creation, auto-merge
  enablement, Notion updates, and pipeline notifications.
---

# Deploy Pipeline

Use this command when LT wants the full build flow handled in one lane after approving the plan.

## Goal

Take a change from approved spec to deployed code and ready-to-merge PR while preserving the TBM rule that production deploy happens before the PR.

## Required Preconditions

- A spec exists under `ops/specs/YYYY-MM-DD-<slug>.md`.
- The spec includes:
  - Problem
  - Verified On
  - Why it matters
  - What changes
  - Unknowns
  - LT decisions needed
  - Acceptance test
  - Evidence after completion
  - Codex review checklist
- LT has approved the plan.

If no spec exists, create it first before writing code.

## Workflow

1. Reconfirm project truth.
   - Read `CLAUDE.md`.
   - Confirm the existing deployment ID with `clasp deployments`.
   - Re-read any files you will edit before touching them.

2. Build the change from the approved spec.
   - Keep the implementation traceable to the spec.
   - Update docs if contracts, routes, or operator behavior changed.

3. Run the mandatory pre-push gates.
   - `bash audit-source.sh`
   - HTML ES5 checks for touched `.html` files
   - Gate 1 wiring verification
   - Gate 2 visual verification when required
   - Gate 3 version consistency

4. Deploy before PR.
   - `clasp push`
   - run `diagPreQA()`
   - `clasp deploy -i <existing deployment id>`
   - hit production `?action=runTests`
   - inspect ErrorLog / recent failures if tests are not clean

5. Push git history after deploy passes.
   - Create a non-main branch for the change.
   - `git add`
   - commit with an intent-revealing message
   - `git push origin <branch>`
   - create the PR with a body that links the spec and summarizes what changed

6. Arm auto-merge immediately.
   - Enable PR auto-merge with squash using `gh pr merge --auto --squash <pr-number>`.
   - LT approval should be the final human action.

7. Update tracking systems.
   - Update the relevant Notion records and thread handoff.
   - If relay secrets are available, POST `deploy_complete` after PR creation.
   - Include repo, PR URL, commit SHA, and a short summary in the relay payload.

8. Close out with evidence.
   - Record what was verified directly.
   - Link the spec, PR, and production test result.
   - Call out any remaining manual follow-up explicitly.

9. Make sure the hosted fix loop is armed.
   - `.github/workflows/review-fixer.yml` must exist on the branch being pushed.
   - `PIPELINE_BOT_TOKEN` should be configured so review-fix pushes retrigger CI and the watcher.
   - If that token is missing, call it out because the loop is only partially automated.

## Failure Handling

- If any pre-push gate fails: stop, fix, rerun gates.
- If deploy succeeds but production tests fail: stop, send `tests_failed` if relay is available, fix forward.
- If PR creation succeeds but auto-merge cannot be armed: report it clearly and leave the PR open for LT.
- If Notion or relay writes fail: do not treat them as deploy truth failures, but record the miss in the close-out.

## Guardrails

- Never deploy from `main` without a spec.
- Never create a new deployment when an existing deployment ID should be updated.
- Never stop at `clasp push`.
- Never leave the PR without CI and Codex review enabled.
- Never enable auto-merge on a PR that failed production tests.
