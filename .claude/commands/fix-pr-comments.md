---
name: fix-pr-comments
description: >
  Resolve actionable pull request review feedback for the current branch or a specified PR.
  Uses unresolved review threads, applies deterministic fixes automatically, redeploys, reruns
  tests, pushes a review-fix commit, and updates the pipeline relay when configured.
---

# Fix PR Comments

Use this command when LT says "fix PR comments" or `/fix-pr-comments`.

GitHub now owns the first-pass mechanical fix loop through `.github/workflows/review-fixer.yml`.
Use this command when:
- LT wants to force a manual pass on a specific PR
- unsupported architecture threads remain after the hosted fixer runs
- repo secrets are missing and the hosted fixer could not complete deploy/push on its own

## Goal

Close the review loop without turning every comment into a manual triage session.

Treat unresolved review threads as the source of truth. Do not work from flat comment counts alone.

## Inputs

- Current branch PR by default.
- If LT provides a PR URL or number, use that explicitly.

## Workflow

1. Resolve the target PR.
   - If no PR is provided, use `gh pr view --json number,url,headRefName`.
   - Stop and report if no PR exists for the current branch.

2. Read unresolved review threads.
   - Use `gh api graphql` so you can read `reviewThreads`, `isResolved`, `isOutdated`, file paths, and line anchors.
   - Ignore resolved and outdated threads.
   - Group remaining threads by file or behavior area.

3. Classify each thread.
   - `mechanical/es5`
   - `mechanical/version`
   - `mechanical/wiring`
   - `mechanical/contract-truth`
   - `architecture-or-behavior`
   - `false-positive`

4. Apply deterministic fixes automatically.
   - Auto-fix: ES5 violations, version mismatches, missing wiring, broken route/contract truth, other deterministic mechanical defects.
   - For `architecture-or-behavior`, pause and ask LT for approval before changing behavior.
   - For `false-positive`, draft a reply explaining why no code change is needed.

5. Respect the cycle cap.
   - Read recent commit messages on the PR branch.
   - Count the highest `[review-fix-N]` tag already used.
   - Next push must use `[review-fix-(N+1)]`.
   - If the next cycle would be 4 or higher, stop, emit a `pipeline_stalled` notification if relay secrets are available, and report that manual intervention is required.

6. Run the full verification path for the touched scope.
   - `bash audit-source.sh`
   - HTML ES5 checks for touched `.html` files
   - version consistency checks for changed `.gs` files
   - wiring verification if any `google.script.run` surface changed
   - `clasp push`
   - `diagPreQA()`
   - `clasp deploy -i <existing deployment id>`
   - production `?action=runTests`

7. Push the review-fix branch update.
   - Commit message format: `fix: review comments [review-fix-N]`
   - Push to the existing PR branch. Do not open a new PR.

8. Reply on GitHub.
   - Reply to each addressed thread with the concrete fix or explanation.
   - Leave architecture threads open until LT approves the direction.
   - Do not mark threads resolved unless LT explicitly asked for that write action.

9. Update pipeline status.
   - If `PIPELINE_RELAY_URL` and `PIPELINE_SECRET` are available locally, POST `fix_pushed`.
   - Summary should include PR number, fix cycle, and whether any unresolved architecture threads remain.
   - If relay secrets are unavailable, state that clearly in the close-out.

10. Prefer the hosted fixer for repeatable mechanical feedback.
   - The PR watcher applies the `pipeline:fix-needed` label.
   - `.github/workflows/review-fixer.yml` should wake automatically for same-repo PRs.
   - `PIPELINE_BOT_TOKEN` is the cleanest way to make bot-made fix pushes retrigger CI and the watcher.

## Guardrails

- Never revert unrelated local work.
- Never guess at review-thread state from flat comments.
- Never exceed 3 review-fix cycles.
- Never skip deploy + production test after changing GAS code.
- Never treat a comment as fixed until the relevant code or reply exists.
