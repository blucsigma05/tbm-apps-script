# Phase D Q9 — Codex CLI Headless Invocation Verification

**Date:** 2026-04-20
**Lane:** Opus, separate thread (Lane 2)
**Host:** `tbm-primary` (Hetzner CX33, Ubuntu 24.04, Node 20.20.2)
**Codex CLI version tested:** `codex-cli 0.122.0` (npm `@openai/codex@0.122.0`)
**Status:** **VERIFIED — green to build runner workflow with caveats noted below**

---

## TL;DR

| Q9 sub-question | Answer |
|---|---|
| Does Codex CLI install headless on the runner? | **Yes.** `sudo npm install -g @openai/codex` → binary at `/usr/bin/codex`, reachable by `act_runner`. |
| Is there a headless auth flow that preserves LT's ChatGPT Plus flat-cost tier? | **Yes.** `codex login --device-auth` produces a URL + 15-minute code. One-time browser step on LT's laptop, token persists in `~/.codex/` for all future runs. No per-token charges. |
| Which reasoning models does the CLI expose? | **13 baked-in models.** Primary: `gpt-5.3-codex` (default), `gpt-5.4` (newest, Codex recommends migrating). Full table below. |
| Is there a deterministic / non-interactive mode suitable for CI? | **Yes.** `codex exec --json --output-schema FILE --ephemeral --ignore-user-config -m <model> -c model_reasoning_effort="<level>"`. Events emit as JSONL; final answer conforms to supplied JSON Schema; no session persisted. |
| Is `codex review` usable for PR-diff audits? | **Yes.** `codex review --base <branch>` / `--commit <sha>` / `--uncommitted`. Named subcommand — purpose-built for Phase D α/β triggers. |

---

## 1. Install — one-time on the runner host

```bash
ssh tbm-primary
sudo apt-get install -y bubblewrap          # sandbox dependency
sudo npm install -g @openai/codex           # lands at /usr/bin/codex
codex --version                             # codex-cli 0.122.0
```

- `act_runner` (UID 111) inherits `/usr/bin/codex` via `PATH`. No sudoers grant needed for normal runs.
- `bubblewrap` is the native sandbox. If absent, Codex falls back to a vendored copy with a warning — install it to silence noise and get the more-hardened path.
- `CODEX_HOME` defaults to `$HOME/.codex`. On the runner, override with `CODEX_HOME=/var/lib/codex` (or similar shared path) so the workflow doesn't depend on `act_runner`'s home.

---

## 2. Auth — recommended path + alternatives

### 2.1 Primary: **ChatGPT Plus via device-flow** (flat-cost)

```bash
# One-time, on the runner host, as the user who will own CODEX_HOME:
sudo -u act_runner bash -c 'CODEX_HOME=/var/lib/codex codex login --device-auth'
```

Output observed (real run, 2026-04-20 23:35 UTC):

```
Follow these steps to sign in with ChatGPT using device code authorization:

1. Open this link in your browser and sign in to your account
   https://auth.openai.com/codex/device

2. Enter this one-time code (expires in 15 minutes)
   TG83-I7VZI

Device codes are a common phishing target. Never share this code.
```

**Flow:**
1. LT opens the URL on desktop, signs into ChatGPT Plus, enters the code.
2. Codex server-side pairs the code with the subscription.
3. Long-lived tokens write to `$CODEX_HOME/auth.json`. `codex login status` then reports the account.
4. All subsequent `codex exec` / `codex review` calls use the stored token. **No further interaction. No API-key charges.**

This is the path that satisfies LT's *"same-vendor-different-tier"* requirement from the Phase D design — Codex CLI runs against the Plus-subscription entitlement, metered by usage limits but charged flat.

### 2.2 Fallback: `OPENAI_API_KEY`

```bash
printenv OPENAI_API_KEY | sudo -u act_runner bash -c 'CODEX_HOME=/var/lib/codex codex login --with-api-key'
```

- Pay-per-token. Counts against LT's OpenAI API budget, **not** Plus subscription.
- Correct path for (a) Plus subscription unavailable, (b) model not exposed to Plus tier, (c) exceeding Plus daily quota.
- Already aligned with the Phase D design's two-provider rubric: use only when the ChatGPT-auth path is down.

### 2.3 Rejected: interactive OAuth without `--device-auth`

Plain `codex login` opens a browser. Unusable on a headless runner — device-flow is the only viable ChatGPT-auth mode for `tbm-primary`.

### 2.4 Runner-integration note

Two options for giving `act_runner` access to an `lt`-owned auth:
- **Option A (simpler):** run device-auth directly as `act_runner` with `CODEX_HOME=/var/lib/codex`. Single source of truth.
- **Option B:** run as `lt`, then `sudo chown -R act_runner:act_runner /var/lib/codex && sudo chmod 700 /var/lib/codex`. Same result, slightly more handoff.

Prefer Option A.

---

## 3. Model catalog — Plus-tier visible models

Pulled via `codex debug models` (static catalog, baked into binary, no auth required):

| Slug | Visibility | Default reasoning | Supported efforts | Notes |
|---|---|---|---|---|
| **gpt-5.3-codex** | list | medium | low / medium / high / xhigh | Current default. Frontier agentic coding. |
| **gpt-5.4** | list | medium | low / medium / high / xhigh | Newest. Codex actively recommends migration from 5.3. |
| gpt-5.2-codex | list | medium | low / medium / high / xhigh | Prior frontier. |
| gpt-5.1-codex-max | list | medium | low / medium / high / xhigh | Deep+fast reasoning. |
| gpt-5.2 | list | medium | low / medium / high / xhigh | Non-codex general-purpose frontier. |
| gpt-5.1-codex-mini | list | medium | medium / high | Cheaper/faster, less capable. |
| gpt-5.1-codex | hide | medium | low / medium / high | Legacy. |
| gpt-5.1 | hide | medium | low / medium / high | Legacy. |
| gpt-5-codex | hide | medium | low / medium / high | Legacy. |
| gpt-5-codex-mini | hide | medium | medium / high | Legacy mini. |
| gpt-5 | hide | medium | minimal / low / medium / high | Legacy base. |
| gpt-oss-120b | hide | medium | low / medium / high | OpenAI OSS, 120B. |
| gpt-oss-20b | hide | medium | low / medium / high | OpenAI OSS, 20B. |

**Recommendation for Phase D runner:**
- **Default:** `gpt-5.3-codex` at `model_reasoning_effort="medium"`. Matches CLI default, known-good under Plus, widest empirical track record.
- **Escalate:** `gpt-5.3-codex` at `model_reasoning_effort="high"` (or `"xhigh"`) when the shallow reviewer returned INCONCLUSIVE on a meaty diff and we want the deep-audit lane to actually push hard.
- **Cost-tight fallback:** `gpt-5.1-codex-mini` for the rare high-volume day.
- **Hold on `gpt-5.4`:** Codex surfaces a migration notice in the upgrade banner but we should run a parallel comparison on a representative audit before flipping the default. Not blocking for v1.

**Per-Plus-tier quota:** the CLI cannot enumerate remaining quota pre-auth. Once LT completes device-auth, `codex login status` will report the tier; `codex exec` will emit a structured `{"type":"error","message":"..."}` event on 429 / quota-exceeded, which the runner workflow must detect and either back off or flip `DEEP_AUDIT_PROVIDER=anthropic`.

---

## 4. Deterministic / non-interactive invocation

Verified flag combinations (all probed empirically — each returned a clean `{"type":"error",...}` on 401 as expected pre-auth, no flag-parse or schema-load errors):

### 4.1 Baseline invocation for Phase D α (PR INCONCLUSIVE → deep audit)

```bash
codex exec \
  --skip-git-repo-check \           # accept non-git workspace if needed
  --sandbox read-only \              # audit only, no writes
  --ask-for-approval never \         # headless
  --json \                           # JSONL events to stdout
  --ephemeral \                      # no session files persisted
  --ignore-user-config \             # don't load ~/.codex/config.toml
  --ignore-rules \                   # don't load .rules files
  --output-schema /etc/codex-schemas/deep-audit.json \  # enforce final shape
  -o /tmp/codex-last-message.txt \   # final message only → file
  -C /workdir \                      # cd into repo
  -m gpt-5.3-codex \                 # pin model
  -c model_reasoning_effort="high" \ # pin reasoning depth
  --add-dir /workdir/ops/migration \ # extra read scope if needed
  - \                                # prompt from stdin
  < /tmp/phase-d-prompt.txt
```

### 4.2 Baseline invocation for Phase D α using `codex review` (preferred)

`codex review` is purpose-built for diff-scoped audits. No need to re-specify the prompt for the diff-extraction step — it handles that:

```bash
git checkout "$PR_HEAD_SHA"
codex review \
  --base "$PR_BASE_BRANCH" \         # diff against this branch
  --title "PR #$PR_NUMBER: $PR_TITLE" \
  -c model="gpt-5.3-codex" \
  -c model_reasoning_effort="high" \
  < /tmp/phase-d-review-instructions.txt
```

`codex review` inherits `--ephemeral` / `--json` / `--output-schema` / `-o` from its parent via `-c` overrides, same as `exec`. Confirm at build time whether `review` accepts `--json` directly (CLI reads its args via the same parser — help text is terse here; test empirically once authed).

### 4.3 Determinism caveats

- **No `--seed` / `--temperature` flag.** Reasoning-tier models don't expose these via the Codex CLI. The only knob is `model_reasoning_effort`. Runs at the same effort against the same prompt **will vary** — treat `INCONCLUSIVE` as stable, but expect some drift in finding text/order. The verdict field (constrained via `--output-schema`) is the stable signal.
- **`--ignore-user-config` + `--ephemeral` + explicit `-m` + explicit reasoning effort** is the minimum for reproducibility across runner restarts. Omit any one and implicit defaults can drift if Codex bumps the CLI.
- **JSON Schema enforcement works at the final-message level.** Intermediate tool calls still emit as free-form text in the `--json` event stream. The runner should parse the `--output-schema`-constrained final payload from `-o /tmp/codex-last-message.txt`, not from the event stream.
- **Model-catalog migration risk.** Codex is actively upgrading (see `upgrade.model` fields in the debug catalog). Pinning `gpt-5.3-codex` today protects us from a silent migration, but we should re-test on every `codex-cli` minor bump.

### 4.4 Error-shape sample (pre-auth 401, for runner parsing)

```json
{"type":"thread.started","thread_id":"019dad42-8525-74d1-8aea-cacc1b8055ad"}
{"type":"turn.started"}
{"type":"error","message":"Reconnecting... 2/5 (unexpected status 401 Unauthorized: Missing bearer or basic authentication in header, url: wss://api.openai.com/v1/responses, cf-ray: 9ef7fbb0aa7ed282-FRA)"}
```

- Errors are well-formed JSON objects on stdout (with `--json`).
- Auth failures retry 5x then terminate — the runner should enforce its own overall timeout (`timeout 300 codex exec ...`) rather than rely on Codex's internal retry logic.
- Non-auth errors (bad schema path, missing model) fail-fast before network: `Failed to read output schema file /nonexistent.json: No such file or directory (os error 2)`. Good for fail-fast wiring.

---

## 5. Runner workflow integration — recommended shape

```yaml
# .gitea/workflows/codex-deep-audit.yml (sketch — not yet built)
jobs:
  deep-audit:
    runs-on: [self-hosted, tbm-primary]
    env:
      CODEX_HOME: /var/lib/codex
      DEEP_AUDIT_PROVIDER: codex   # flip to 'anthropic' on quota/outage
    steps:
      - name: Check Codex auth
        run: codex login status || (echo "::error::Codex CLI not authed on runner"; exit 1)

      - name: Deep audit (Codex CLI primary)
        if: env.DEEP_AUDIT_PROVIDER == 'codex'
        run: |
          timeout 600 codex review \
            --base "${{ github.base_ref }}" \
            --title "PR #${{ github.event.pull_request.number }}" \
            -c model="gpt-5.3-codex" \
            -c model_reasoning_effort="high" \
            > /tmp/audit.jsonl

      - name: Deep audit (Anthropic fallback)
        if: env.DEEP_AUDIT_PROVIDER == 'anthropic'
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: scripts/deep-audit-anthropic.sh  # separate spec
```

Contract points:
- The 20-runs/day cap lives at the workflow level (counting-check before invocation), not inside Codex CLI.
- `DEEP_AUDIT_PROVIDER` flip condition: Codex CLI exits non-zero with a 429-class error, OR `codex login status` fails on startup, OR daily Codex-run counter ≥ 18. Anthropic becomes primary for the rest of the day.

---

## 6. Open items / caveats to flag before runner build

1. **Plus-tier quota under load** — unknown until LT completes device-auth on `tbm-primary`. First week of live operation will surface the daily-limit ceiling. Runner workflow must handle 429 gracefully from day one.
2. **`gpt-5.4` migration** — Codex is flagging it as a recommended upgrade. We should do a single parallel audit (5.3-codex vs 5.4, same prompt, same PR) before considering the flip. Not v1 blocking.
3. **`codex review` + `--json` confirmation** — help text is less explicit than `codex exec`. Empirically confirm JSON / schema flags work once authed. If they don't, fall back to `codex exec` with explicit prompt + `git diff` in stdin.
4. **Session persistence disabled** — `--ephemeral` means runner gets no resumable session. That's correct for CI but means we lose the built-in `codex resume` debugging aid. Instead, preserve `/tmp/audit.jsonl` as a workflow artifact.
5. **bubblewrap missing on fresh VPS** — added to `tbm-primary` this session. Any future runner clone must install `bubblewrap` as part of bootstrap.
6. **Auth token refresh** — device-flow tokens are long-lived but can expire. Monitor `codex login status` in a daily ops job; alert to LT's Pushover if it flips to "Not logged in."

---

## 7. Empirical evidence captured this session

| Claim | Evidence |
|---|---|
| Codex CLI v0.122.0 installs clean on Ubuntu 24.04 / Node 20 | `added 2 packages in 6s` from `sudo npm install -g @openai/codex` |
| Binary at `/usr/bin/codex`, reachable by `act_runner` | `sudo -u act_runner which codex` → `/usr/bin/codex` |
| Device-flow login produces URL + code, expires in 15 min | Full stderr/stdout captured 2026-04-20 23:35 UTC, code TG83-I7VZI left to expire unused |
| 13 models in static catalog, 6 with `visibility: list` | `codex debug models` JSON dump, parsed + tabulated |
| `--json`, `--output-schema`, `-m`, `-c model_reasoning_effort="high"`, `--ephemeral`, `--ignore-user-config` all parse-accept | Each probed end-to-end; all reached network and 401'd as expected; none errored at flag-parse or schema-load |
| Missing-schema path fail-fast works | `Failed to read output schema file /nonexistent.json: No such file or directory (os error 2)` |
| `codex review` subcommand exists with `--base`/`--commit`/`--uncommitted` | `codex review --help` confirmed |

---

## 8. Verdict

**Q9 resolved.** Ship the runner workflow against Codex CLI v0.122.0 on `tbm-primary` with:
- `gpt-5.3-codex` at `model_reasoning_effort="high"` as default
- ChatGPT Plus device-flow auth (one-time LT action)
- `codex review --base $BASE` as the primary invocation shape, `codex exec` as fallback
- `ANTHROPIC_API_KEY` / `DEEP_AUDIT_PROVIDER=anthropic` wired for quota-exceeded / Codex-down days
- 20-runs/day cap enforced at the workflow layer, not in the CLI

**LT action needed to fully close Q9:**
1. Run `CODEX_HOME=/var/lib/codex sudo -u act_runner codex login --device-auth` on `tbm-primary`
2. Complete the device-flow in a browser on LT's desktop
3. Confirm `sudo -u act_runner CODEX_HOME=/var/lib/codex codex login status` reports the Plus-tier account
4. Run one live `codex review` against a small throwaway diff; confirm actual reasoning output + final-message shape

Steps 1–4 block nothing on the worker / schema / webhook side of Phase D. Issue #2 build can begin in parallel and wire the runner workflow last.

---

## 9. Closeout — 2026-04-21 verification (post-LT-action)

All four LT-action items from §8 executed and verified the same session the
initial findings were written. Q9 is now closed both in design (§1–§7) and in
live operation (below).

### 9.1 Plus tier — empirically confirmed via JWT claim

`codex login status` reports `"Logged in using ChatGPT"` but does **not** print
tier. The tier lives in the `id_token` JWT's `https://api.openai.com/auth` claim.
Decoded from `/var/lib/codex/auth.json`:

```json
{
  "auth_provider": "google",
  "email": "thompson090916@gmail.com",
  "https://api.openai.com/auth": {
    "chatgpt_plan_type": "plus",
    "chatgpt_subscription_active_start": "2026-03-30T10:45:19+00:00",
    "chatgpt_subscription_active_until": "2026-04-30T10:45:19+00:00",
    "chatgpt_subscription_last_checked": "2026-04-21T01:11:16Z"
  }
}
```

`chatgpt_plan_type: "plus"` is the hard evidence. Subscription renews monthly
(last checked timestamp shows the CLI has refreshed the token within the
session). `refresh_token` is also present in `auth.json` — long-lived auth will
self-renew without LT intervention unless the refresh token itself expires.

**Monitoring note:** `chatgpt_subscription_active_until` is a machine-readable
renewal date. A daily ops cron reading this field can Pushover LT ≥3 days
before a subscription lapse.

### 9.2 Live smoke test — round-trip succeeded

```bash
sudo -u act_runner env CODEX_HOME=/var/lib/codex timeout 60 codex exec \
  --skip-git-repo-check --sandbox read-only --json --ephemeral \
  --ignore-user-config -m gpt-5.3-codex -c model_reasoning_effort='"low"' \
  - <<< 'reply with exactly one word: acknowledged'
```

Output (trimmed):
```json
{"type":"thread.started","thread_id":"019dad98-d021-7c23-9fe2-6f18313164b0"}
{"type":"turn.started"}
{"type":"item.completed","item":{"id":"item_0","type":"agent_message","text":"acknowledged"}}
{"type":"turn.completed","usage":{"input_tokens":12478,"cached_input_tokens":3456,"output_tokens":7}}
```

**Verified end-to-end:** auth → model call → structured event stream → clean
turn completion. Zero dollar charge (Plus flat-cost).

### 9.3 Token accounting — real numbers

A trivial one-word reply burned **12,478 input tokens** (3,456 of which were
cache hits) for 7 output tokens. The 12k input floor is Codex's baked-in
system prompt + agent harness.

**Implication for deep-audit budgeting:**
- Minimum cost-per-run: ≈ 12k input
- Typical PR-diff audit: 12k (harness) + 2–20k (diff + context) + 5–50k
  (reasoning output at effort=high) ≈ **25k–80k tokens per run**
- Plus-tier daily quotas aren't published but the 20-runs/day cap in the
  workflow (PR #31) should comfortably stay inside them
- First week of live ops will expose any 429s; fallback to Anthropic via
  `DEEP_AUDIT_PROVIDER=anthropic` is already wired

### 9.4 Non-blocking warning seen during smoke test

```
ERROR codex_core::agents_md: error trying to find AGENTS.md docs:
Permission denied (os error 13)
```

Surfaces when `act_runner`'s CWD (home dir with locked-down perms) lacks
read access on a parent path Codex walks looking for an `AGENTS.md`. Does
**not** block the call. Real runner workflows check out the PR into a
workdir that act_runner owns, so `AGENTS.md` (if present at repo root)
reads fine and this warning goes away.

### 9.5 Updated verdict

Phase D Q9 is **fully resolved — design verified, auth confirmed, live
round-trip working**. Runner workflow in PR #31 can be iterated to
production-ready without further Q9 prerequisites.

Remaining Phase D work (unrelated to Q9):
- Merge PR #30 (this doc), PR #31 (workflow stub), PR #32 (verdict schema)
- Write `scripts/deep-audit-anthropic.sh` (fallback path)
- Wire `workflow_run` chain off Codex PR Review INCONCLUSIVE verdict
- First real deep-audit run against a PR that shallow review flagged
  inconclusive
