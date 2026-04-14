# F07: pull_request_target CI-Enforced Guardrails

**Issue:** #261
**Status:** Draft
**Phase:** 6 — Simplify the PR Control Plane

---

## Summary

`codex-pr-review.yml` uses `pull_request_target`, which runs in trusted base-repo context with access to secrets. The current safety model relies on `same_repo` gating and base-branch checkout, but there is no CI assertion that prevents future drift into unsafe patterns (e.g., checking out untrusted head code in a secret-bearing step).

This spec defines what "secret-bearing path" means for this repo and adds a CI assertion to enforce it.

---

## Current State

### codex-pr-review.yml trigger
- Trigger: `pull_request_target` (runs against base branch, has secret access)
- Heavy review path gated on `same_repo == 'true'`
- Uses `actions/checkout` for base branch, fetches PR diff via `gh pr diff`
- Secrets used: `OPENAI_API_KEY` (for gpt-4o review), `GITHUB_TOKEN` (for PR comments)

### What's safe today
- Checkout is base-branch only (no `ref: ${{ github.event.pull_request.head.sha }}`)
- PR code is fetched as text diff, never checked out or executed
- `same_repo` gate prevents fork PRs from triggering the expensive review path

### What's NOT enforced
- No CI rule prevents a future commit from adding `head.ref` or `head.sha` checkout
- No automated check that secrets are never exposed to untrusted code paths
- The safety relies on convention, not assertion

---

## Definitions

### Secret-bearing path
Any workflow step that has access to repository secrets (via `secrets.*` or `GITHUB_TOKEN` with write scope). In `pull_request_target` workflows, ALL steps have secret access by default.

### Untrusted reference
Any reference to the PR author's code: `github.event.pull_request.head.ref`, `github.event.pull_request.head.sha`, or any checkout/use of those values.

### Violation
A `pull_request_target` workflow step that both:
1. Has access to secrets (which is all steps in these workflows), AND
2. Checks out, executes, or sources code from an untrusted reference

---

## Proposed Design

### 1. Static lint rule (in audit-source.sh)

Add a check that scans all `pull_request_target` workflows for unsafe patterns:

```
# Banned patterns in pull_request_target workflows:
# - actions/checkout with ref: containing head.ref or head.sha
# - run: steps that reference head.ref or head.sha
# - uses: actions/checkout without explicit ref: (defaults to merge commit, which includes untrusted code)
```

Grep-based check:
1. Find all `.yml` files with `pull_request_target` trigger
2. In those files, fail if any of these patterns appear:
   - `ref:.*head\.ref`
   - `ref:.*head\.sha`
   - `ref:.*\$\{\{ github\.event\.pull_request\.head`
3. WARN if `actions/checkout` appears without explicit `ref:` (ambiguous default)

### 2. CI workflow assertion (in workflow-lint.yml)

Add the same check as a CI step so it runs on every PR that touches workflow files. This catches violations before merge.

### 3. Documentation guard

Add a comment block at the top of `codex-pr-review.yml`:

```yaml
# SECURITY: This workflow uses pull_request_target (trusted context).
# - NEVER checkout or execute PR head code in any step
# - NEVER reference head.ref or head.sha in run: blocks
# - PR diff is fetched as TEXT via gh pr diff, never checked out
# - audit-source.sh enforces this statically; workflow-lint.yml enforces in CI
```

---

## Open Questions

### Q1: Should `actions/checkout` without explicit `ref:` be FAIL or WARN?
Without `ref:`, checkout defaults to the merge commit for `pull_request_target`, which includes untrusted code. This should probably be FAIL, but need to verify the current checkout has explicit `ref:`.

### Q2: Should this extend to all workflows or only `pull_request_target`?
Other triggers (`push`, `pull_request`) don't have the same trust boundary issue. The rule should be scoped to `pull_request_target` only.

---

## Implementation Plan

1. Add grep-based check to `audit-source.sh` (conditional on workflow file changes, like existing lint)
2. Add same check as step in `workflow-lint.yml`
3. Add documentation comment to `codex-pr-review.yml`
4. Verify current workflow has explicit base-ref checkout

## Deploy Manifest

```
grep -n "head\.ref\|head\.sha" .github/workflows/codex-pr-review.yml → expected: 0 matches in checkout/run steps
grep -n "SECURITY.*pull_request_target" .github/workflows/codex-pr-review.yml → expected: comment block present
```

## Build Skills
- `deploy-pipeline` — CI/CD workflow patterns
- `tbm-pipeline-audit` — workflow safety rules
