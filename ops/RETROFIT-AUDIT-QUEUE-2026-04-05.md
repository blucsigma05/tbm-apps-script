# Retrofit Audit Queue — April 5, 2026

Snapshot source: live GitHub PR metadata checked on April 5, 2026 for `blucsigma05/tbm-apps-script`.

## Current Truth

- PR `#54` merged into `main` on April 5, 2026. It landed the automation foundation but did not close the review contract.
- The only open PRs are `#53` and `#52`.
- PR `#53` is the active release candidate.
- PR `#53` currently has passing TBM CI on the current head, but no Gemini run on the current head and no explicit Codex `PASS` or `FAIL`.
- PR `#52` is still open, and both `Run TBM Tests` and `gemini-review` are currently failing.
- For PRs `#45` through `#54`, Codex activity exists, but the recorded Codex state is `COMMENTED`, not an explicit `PASS` or `FAIL`.
- Deploy stays off until the review contract is clean enough that `pipeline:ready` means the same thing every time.

## Retrofit Rule

A PR is not done unless Codex has a recorded `PASS` or `FAIL` outcome on the current head. A Codex `COMMENTED` review is evidence that Codex looked, but it is not a closing outcome.

## Queue

| Priority | PR | Scope | GitHub state on April 5, 2026 | Known gate signal | Retrofit action |
|---|---:|---|---|---|---|
| P0 | 53 | WOW visual audit | Open | CI `PASS`; watcher `PASS`; fixer `skipped`; Gemini missing on current head; Codex `COMMENTED` | Run Codex adjudication first, then rerun Gemini on current head, then keep merge blocked until both are explicit and current. |
| P0 | 52 | GAS Standards Kit v3.1 docs | Open | `Run TBM Tests` `fail`; `gemini-review` `fail`; Codex `COMMENTED` | Treat as active retrofit work, not done docs. Fix failing checks, then record Codex outcome. |
| P1 | 54 | automation foundation audit | Merged on April 5, 2026 | Merged while pipeline summary still showed `FIX_NEEDED`; Codex `COMMENTED` | Audit merged code as a follow-up gate hardening pass. If blockers remain, open a repair PR off `main`; otherwise record Codex `PASS`. |
| P1 | 51 | Q7-Q12 bundle | Merged on April 5, 2026 | Codex `COMMENTED`; no explicit Codex close-out | Re-review merged outcome against current `main`, then record Codex `PASS` or `FAIL`. |
| P1 | 50 | Q4 scenario harness | Merged on April 5, 2026 | Codex `COMMENTED`; no explicit Codex close-out | Re-review merged outcome against current `main`, then record Codex `PASS` or `FAIL`. |
| P1 | 49 | Q5 route integrity | Merged on April 5, 2026 | Codex `COMMENTED`; no explicit Codex close-out | Re-review merged outcome against current `main`, then record Codex `PASS` or `FAIL`. |
| P1 | 48 | Q6 opsHealth truthfulness | Merged on April 5, 2026 | Codex `COMMENTED`; no explicit Codex close-out | Re-review merged outcome against current `main`, then record Codex `PASS` or `FAIL`. |
| P1 | 47 | TheSoul + TheSpine emotional upgrade | Merged on April 5, 2026 | Codex `COMMENTED`; no explicit Codex close-out | Re-review merged outcome against current `main`, then record Codex `PASS` or `FAIL`. |
| P1 | 46 | Q3 Playwright harness | Merged on April 5, 2026 | Codex `COMMENTED`; no explicit Codex close-out | Re-review merged outcome against current `main`, then record Codex `PASS` or `FAIL`. |
| P1 | 45 | Vault + Q1 + Q2 | Merged on April 4, 2026 | Codex `COMMENTED`; CI comment showed failures at review time; no explicit Codex close-out | Re-review merged outcome against current `main`, then record Codex `PASS` or `FAIL`. |

## Audit Order

1. `#53`
2. `#52`
3. `#54`
4. `#51`
5. `#50`
6. `#49`
7. `#48`
8. `#47`
9. `#46`
10. `#45`

## What To Record On Each Retrofit Pass

Record the result as one of two explicit outcomes:

- `PASS`: no blocker remains on the merged or open head after the Codex audit.
- `FAIL`: a blocker or behavior regression still exists and must be fixed in a follow-up PR.

Minimum capture for each item:

1. PR number
2. audited head SHA
3. Codex outcome: `PASS` or `FAIL`
4. short rationale
5. follow-up PR number if outcome is `FAIL`

## Process Notes

- `Gemini` is removed from the hard gate as of April 5, 2026. Do not block release readiness on Gemini until it proves reliable enough to return as an advisory or later-phase lane.
- `Playwright` stays phase 2. Do not promote it into the required merge gate until CI and Codex are stable and trustworthy.
- `pipeline:ready` should mean "all required gates are current and green," not "the automation looked at this PR once."
