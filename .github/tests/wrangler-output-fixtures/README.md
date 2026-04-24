# Wrangler Output Fixtures

This directory stores raw `stdout`/`stderr` captures used by
`.github/scripts/parse_wrangler_output.py`.

## Versions

- `4.36.0` — minimum documented rate-limit floor for `[[ratelimits]]`
- `4.84.1` — latest `4.x` from `npm view wrangler version` on 2026-04-23
- `4.35.0` — historical add-on proving the pre-floor `[[ratelimits]]` warning class

## Layout

- `inputs/` — minimal case directories used to produce the captures
- `outputs/` — raw `stdout` and `stderr` files, preserved with ANSI codes
- `manifest.json` — command, version, working directory, expected classification, exit code

## Cases

- `clean` — verified-clean `wrangler deploy --dry-run`
- `unknown-top-level-key` — synthetic unknown top-level config field
- `missing-config` — missing `--config` target
- `missing-entry-point` — config with no `main` and no asset directory
- `ratelimits-pre-4.36` — historical reproduction of the PR 64 class

## Verification

- `python .github/scripts/tests/test_parse_wrangler_output.py -v`
- `python .github/scripts/parse_wrangler_output.py --stdout <path> --stderr <path> --json`
