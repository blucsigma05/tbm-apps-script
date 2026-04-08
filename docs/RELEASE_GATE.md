# Release Gate

## Goal
No change should be treated as deploy-ready until it passes a repeatable audit and a regression checklist.

## Minimum Gate Before Merge
1. Inventory Audit run
2. Flow Audit run for impacted workflows
3. Schema Audit run if any write path, sheet shape, or property dependency changed
4. Diff Snapshot reviewed
5. Blockers explicitly resolved or accepted with named risk
6. Regression checklist written for the touched behavior

## Non-Negotiables
- No merge if a save path is unverified
- No merge if spec and code materially disagree without a source-of-truth decision
- No merge if a workflow can show success in UI without confirmed persistence
- No merge if a change depends on hidden sheet/property assumptions not documented
- No merge if a blocker lacks patch order and retest steps

## Required Merge Summary
Every PR should answer:
- What changed?
- What workflows are affected?
- What write paths are affected?
- What assumptions are still unverified?
- What tests prove this is safe?

## Confidence Levels
- **High**: traced end to end and tested
- **Medium**: code path traced, runtime dependency still unverified
- **Low**: reasoning only, missing environment/schema proof
