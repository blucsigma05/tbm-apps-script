## Summary
<!-- 1-3 bullet points: what changed and why -->

## Affected workflows
<!-- Which user flows does this touch? (e.g., chore approval, grade submission, debt cascade) -->

## Write paths affected
<!-- Which sheets/tabs/properties are written to? "None" if read-only change -->

## Pre-merge checklist
- [ ] `bash audit-source.sh` passes
- [ ] `bash scripts/audit-deep.sh` reviewed (FAIL items resolved or risk-accepted)
- [ ] Version bumped in all 3 locations (header, getter, EOF) per changed `.gs` file
- [ ] ES5 verified for changed `.html` files
- [ ] `withFailureHandler()` present on any new `google.script.run` calls
- [ ] Smoke test passes after `clasp push`

## Unverified assumptions
<!-- What hasn't been runtime-tested? "None" if fully verified -->

## Test plan
<!-- How to verify this works — specific steps, not "run tests" -->
