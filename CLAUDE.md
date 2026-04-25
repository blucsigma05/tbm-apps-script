# TBM (TillerBudgetMaster) — Project Rules

## Forge Canon (MANDATORY — read before any git / CI operation)

**Canonical forge: Gitea** (`git.thompsonfams.com/blucsigma05/tbm-apps-script`). All writes go here.

**GitHub (`blucsigma05/tbm-apps-script`) = auto-mirror.** DR baseline + historical URL access + external-reader read-only. Pushed to automatically from `gitea/main` via `.gitea/workflows/mirror-to-github.yml` (fast-forward only, no `--force`). Mirror is one-way — **never push to `origin` directly**; that path is reserved for the mirror workflow. History: 2026-04-19 Gitea migration (GitHub account suspension); 2026-04-22 account unsuspended, forge canon clarified to Gitea-primary + GitHub-auto-mirror (Gitea Issue #60, Item Θ in Wave 0 audit plan).

**Reading rule:** every `gh` CLI reference in this file is an **optional secondary op against the mirror**. The canonical equivalent uses the Gitea API (`POST /api/v1/repos/blucsigma05/tbm-apps-script/...`). In practice: agents that can hit the Gitea API should prefer it; `gh` invocations remain useful only for ad-hoc inspection of the mirrored history. Do not let a `gh pr create` / `gh pr merge` path become primary — that routes writes through the mirror instead of the canonical forge.

**`#N` in commits / PR bodies = Gitea issue number.** Not GitHub. Same for branch-protection rules, auto-merge decisions, and all hook enforcement.

**Credentials:** URL-scoped `wincred` helper for `git.thompsonfams.com` (PAT in Windows Credential Manager). NEVER invoke `git credential-manager get` directly — it overwrites the PAT with an expiring JWT. Retrieve PATs for API calls via `git credential fill` only.

---

## Identity
Google Apps Script + HtmlService system for household finance, kid chore management, and education dashboards. Google Sheets is the data layer, Tiller Money syncs bank data, HTML dashboards served via GAS web app, Cloudflare proxy at thompsonfams.com.

- **SSID:** `1_jn-I4IfsqgnVOFiS38SVVzNJ0MAJtu2645iU5k0U9c`
- **Deployment ID:** Run `clasp deployments` to find it. Always use `clasp deploy -i <ID>`. Never create new.

## Architecture

**Data flow (one direction only):**
Tiller → Google Sheets → DataEngine.gs → Safe wrappers → HTML dashboards via `google.script.run`

**Core rules:**
- Zero client-side financial calculations. All dashboards display-only. ONE exception: ThePulse `simulate()` for debt slider.
- TAB_MAP lives in DataEngine.gs. All sheet references go through it. Never hardcode sheet names with emoji prefixes.
- KH_ tabs live inside the main TBM workbook (NOT a separate spreadsheet). RING_QUEST_SSID is dead.
- All `.gs` files share one global scope. Constants and TAB_MAP from DataEngine.gs are available everywhere. Never redeclare.

**Financial data visibility:**
- TheSoul (kitchen) + KidsHub (kid tablets) → NO financial data. Kids can see these.
- TheSpine (office) → Financial data, display-only.
- ThePulse + TheVein → Full financial data, interactive.

---

## Reviewer onboarding (Codex, Anthropic, human auditors)

If you're **reviewing** code rather than building it, read **[`ops/readme-for-codex-reviewers.md`](./ops/readme-for-codex-reviewers.md) first**. It is the Gitea-era reviewer onboarding doc: current source-of-truth table, tiered reading list, and known stale references (places that still mention GitHub even though the migration flipped 2026-04-19).

Do not assume GitHub conventions apply unless a doc explicitly says they do. PRs, Issues, CI, and the deploy pipeline all live on Gitea (`git.thompsonfams.com/blucsigma05/tbm-apps-script`). GitHub is an **auto-mirror** for DR + historical URL access only (see § Forge Canon at the top of this file); no new writes go through it.

---

## Session Start

**Mandatory first command for any Sonnet build thread (run before anything else):**
```
cd "C:/Dev/tbm-apps-script"
```
This loads `.claude/settings.local.json` (repo-scoped MCP + Bash allowances). Without it, every MCP tool call prompts for approval scoped to the wrong directory (`C:\Program Files\Git`). Any "don't ask again" approval saved from the wrong directory is wasted — it won't apply here. Use the hardcoded path rather than `git rev-parse --show-toplevel` — that command fails when the shell starts outside any git worktree. See #420 + #391 for the full Sonnet environment context.

1. Read this file fully
2. Run `clasp deployments` to confirm deployment ID
3. Fetch PM Active Versions (Notion `2c8cea3cd9e8818eaf53df73cb5c2eee`) for current state
4. Check the TBM Operations Project board and the "Needs Decision" column for anything blocked on LT input
5. Check for pending Codex findings auto-filed by the `codex-pr-review.yml` inline filer step (which runs `.github/scripts/file_codex_review_findings.py` — there is no separate `codex-review-filer.yml` workflow; the filing is inline in the review workflow per the Codex findings contract below). On Gitea: `curl.exe -s -H "Authorization: token <pat>" "https://git.thompsonfams.com/api/v1/repos/blucsigma05/tbm-apps-script/issues?state=open&labels=claude:inbox" | python3 -c "import sys,json; [print('#' + str(i['number']), i['title']) for i in json.load(sys.stdin) if 'pull_request' not in i]"`. If any Issues come back, they are the priority queue — address before starting new work. (Do not use `gh issue list` for this repo — since the GitHub account suspension on 2026-04-19, `gh` resolves to the archive and returns stale results.)
6. Do NOT begin work until steps 1–5 are complete

---

## Verify-Before-Assert (THE Cardinal Rule)

> "I had the data, I just didn't look." Before writing assertions, check the actual file. Confidence without verification is a hallucination.

- Before writing code that references a payload field → grep the source for the exact field name. 0 matches = doesn't exist. If matches found, read surrounding 5 lines for shape.
- Before writing any assertion → run the function from the editor FIRST, read Logger output, write assertions against what you saw.
- Before declaring any build item complete → grep for the function name in pushed code. 0 matches = wasn't built. Run the function and read Logger output.
- Subagent summaries are leads, not facts. Verify field names, object shapes, and signatures against the actual construction site (`var result = {}` or `return {}` block).
- **The test:** "Can I point to grep output or Logger output proving this?" If no → stop and verify. If yes → proceed.

**Canonical template:** [`ops/templates/verify-before-assert.md`](./ops/templates/verify-before-assert.md) (stabilization backlog item 25, Gitea #49). Every claim about current state in a PR description, commit message, or Issue comment uses the four-section format: **Claim → Source evidence (grep) → Runtime evidence (Logger) → Source verified (file:line) → Claim status**. Reviewers reject claims missing the template. Item 26 sweeps retroactively; item 27 verifies the next 3 PRs adopt it.

### Output self-review (MANDATORY)
After every file modification, re-read the changed region. Verify: (1) edit applied correctly, (2) no side effects in surrounding code, (3) versions updated. "Done" = verified correct, not "write operation completed."

For test/gate/review-pipeline PRs, "self-review" also means a **clean-slate builder pre-audit before re-review**: treat the current PR head as the first audit, not a patch validation. Sweep registry/dispatch wiring for every new criterion, fail-closed `pass`/`surrogate` paths, and the whole touched contract family — not just the last named findings. "Fixed the comments" is not a sufficient internal exit condition. Rationale: `ops/operating-memos/2026-04-21-builder-pre-audit-and-clean-slate-rereview.md`.

### Context decay
After 10+ messages in a session, re-read any file before editing it. Do not trust memory of file contents from earlier in the conversation.

---

## Workflow — Issues, PRs, and the Project Board

**The hierarchy:** Epic → Issue → PR. Every Issue has exactly one reason to exist. Every PR closes at least one Issue via `Closes #NNN`. Chat is transient. If it needs to survive the conversation, it becomes an Issue.

**Object types — pick one when creating work:**

| Type | Use when | Form | Primary label |
|------|----------|-------------|---------------|
| Spec | A design decision that needs alignment before code | Issue + `specs/*.md` file | `kind:spec` |
| Bug | Something is broken | Issue | `kind:bug` |
| Task | Actionable work that isn't a spec or bug | Issue | `kind:task` |
| Decision | A question requiring LT input | Issue | `kind:decision` + `needs:lt-decision` |
| Epic | Long-running initiative spanning multiple issues | Issue | `kind:epic` |
| Code change | Anything that modifies files | PR | inherits from the Issue it closes |

**The rule that kills "where are we":** if an Issue/PR exists on the Project board, its status tells you where it is. Do not ask for status in chat — check the board. If the board is wrong, fix the labels.

**Label families (six):**

- `kind:` spec, bug, task, decision, epic — what the work IS
- `severity:` blocker, critical, major, minor — how urgent (existing Codex label scheme)
- `model:` opus, sonnet, codex, lt — who is working on it
- `needs:` lt-decision, implementation, review, qa, spec — what's blocking progress
- `area:` jj, buggsy, finance, infra, qa, education, shared — which part of the system
- `status:` draft, approved, implementing, shipped — spec lifecycle (specs only)

**Standard flow for any change:**

1. Open an Issue with labels `kind:*`, `severity:*`, `area:*`, and `model:*` (or `needs:lt-decision` if blocked on LT). Card lands in Backlog.
2. If it needs a spec first: open a `kind:spec` Issue first, spec PR lands, spec Issue closes with `status:approved`, implementation Issue opens linking to the approved spec.
3. Implementation: open a branch, push code, open PR with `Closes #NNN` in the description. Card moves to In Progress.
4. CI + Codex review. Card moves to In Review.
5. PR merges. Issue auto-closes. Card moves to Done. Pushover notification fires.

**Specs specifically:**
- Spec text lives as `specs/<name>.md` in the repo (permanent reference)
- The spec PR merges into main so the file is canonical
- Decisions from spec review are recorded as PR comments before merge AND in the spec file under "Open questions — resolved"
- A separate implementation Issue opens after the spec PR merges, linking to the spec file path
- Implementation PRs close the implementation Issue, not the spec Issue

**Decisions specifically:**
- Never let an open question live as a bullet in chat. If LT needs to answer it, it is an Issue with `kind:decision` + `needs:lt-decision`.
- LT's answer is the comment that closes the Issue.
- If a decision is blocking 3 specs, the Issue has back-links in all 3 specs.

**Codex findings:**
- In-PR review comments stay in the PR (that's the evidence).
- **Automated path (bot):** For blocker/critical findings in the `<!-- codex-review-report -->` JSON emitted by `codex-pr-review.yml`, the **inline filer step inside that same workflow** runs `file_codex_review_findings.py` immediately after posting the review comment. It auto-files a durable Issue labeled `claude:inbox` + `kind:bug` + `severity:*` + `model:sonnet` (default) + `area:*` + `type:*`, with body including a `## Build Skills` section and the exact `#issuecomment-<id>` URL. (Inline rather than a separate workflow with an `issue_comment` trigger because `GITHUB_TOKEN`-authored events don't trigger other workflow runs — GitHub's recursive-loop prevention. See #456.) Dedup is signature-based on `rule + file + evidence_hash + pr_number` — re-reviews on the same PR dedup to the same Issue signature: open matches no-op, recent closed matches (≤7 days) reopen, no duplicate is created. **Auto-close (Phase 2, #462):** when a re-review drops a previously-filed finding (fix landed), the script adds `auto-close:resolved` + closes the Issue; `auto:suppressed` (permanent LT dismissal) and already-`auto-close:resolved` are both respected. Kill switches: `AUTOMATION_ENABLED`, `CODEX_REVIEW_FILER_ENABLED`, `CLAUDE_INBOX_MAJOR_ENABLED`. `model:codex` is used instead of `model:sonnet` when the finding is in review-pipeline code itself.
- **Manual path (human):** Codex (or LT, during a manual audit via "audit N" in ChatGPT) posts freeform PR comments with `Codex finding: FIX/HOLD/BLOCK` markers. `codex-finding-listener.yml` picks these up via `parse_finding_comment.py` under the `{blucsigma05, chatgpt-codex-connector}` author whitelist and auto-files durable Issues for `severity:blocker` via `_finding_dedup.py` (comment-ID dedup). This path is unchanged.
- **Stronger-review escalation (operating rule):** If automated Codex review returns `INCONCLUSIVE`, or LT asks for a stronger audit, the system should route the PR into a deeper Codex audit lane without LT relaying context by hand. LT's action is to trigger the escalation on the canonical status surface. Until that destination-side lane is wired, manual `audit N` remains fallback only — not the intended steady state.
- Both paths produce durable Issues; they differ in trust domain and dedup mechanism. Do not merge them.

**When LT says "PR" but means "Issue" (or vice versa):**
- Claude MUST redirect and confirm: "You said PR — did you mean the Issue, or is this actually a code change?"
- Do not silently create the wrong object.
- One sentence, no back-and-forth. If ambiguous after one confirmation, default to Issue.

**Build Skills (MANDATORY on every Issue):**

Every Issue body or first comment MUST include a `## Build Skills` section listing the skill names needed. This tells any agent picking up the work which skills to load. Format:

```
## Build Skills
- `skill-name` — why it's needed (one line)
```

Common skills: `thompson-engineer` (GAS architecture), `game-design` (game UI), `adhd-accommodations` (Buggsy surfaces), `grading-review-pipeline` (submission→review→award), `data-contracts` (sheet schemas), `deploy-pipeline` (full build pipeline), `education-qa` (education testing), `qa-walkthrough` (device QA), `route-contracts` (CF routing), `incident-response` (diagnosing failures), `parent-reporting` (parent dashboard UX), `curriculum-planner` (TEKS/scope).

**Forbidden patterns:**
- Answering "where are we on X?" with a chat summary. Correct: "Check Issue #NNN" or "Check the Project board."
- Opening a PR without a linked Issue (exception: trivial one-line fixes).
- Handing Sonnet a prompt via chat copy-paste instead of an Issue body.
- Letting a decision live in PR comments when it should be an Issue.
- Using `needs:lt-decision` on a PR — those belong on Issues, then the PR picks up the decided answer.
- Filing an Issue without a `## Build Skills` section.

---

## Two-Lane Roles (MANDATORY)

- **Builder lane — Claude** (Opus/Sonnet): GAS app logic, HTML/ES5 surfaces, Notion-linked process work, deploy-pipeline-adjacent repo work. Scope, spec, implement, fix.
- **Builder lane — Codex (pilot, 2026-04-22+)**: CI workflows (`.gitea/workflows/*`, `.github/workflows/*`), Wrangler config (`wrangler*.toml`), tool-version pinning (`package.json` / `package-lock.json`), Cloudflare deploy/test gating, `.github/scripts/*` CI helpers, `.github/tests/**` fixtures, `audit-source.sh` schema checks. Scope lives in `ops/operating-memos/2026-04-22-codex-infra-build-pilot.md`. Default mechanics pending LT confirmation: courier-with-evidence (Codex produces diff + captured command output; Claude commits).
- **Audit lane** (cross-audit): Claude audits Codex-built infra PRs. Codex audits Claude-built app/UI PRs. Each lane meets the same evidence bar — no plan item without running the command or reading the exact file (ref: memory `feedback_no_unverified_plan_items.md`).
- **PR-scoped audits**: when LT names a PR, audit that PR alone unless LT explicitly says `stacked` or `after PR M`.
- **Re-audits are clean-slate**: `re-audit N` means current head of PR `N`, with prior findings treated as stale until re-anchored. Not patch validation.
- **Builder pre-audit is mandatory on gate/test PRs**: do not hand back a test/gate/review-pipeline PR after only fixing named comments; run a clean-slate contract sweep first (registry/dispatch wiring, fail-closed `pass`/`surrogate` paths, whole touched family). See `ops/operating-memos/2026-04-21-builder-pre-audit-and-clean-slate-rereview.md`.
- **Plain-English commands**: agents translate LT's natural-language instructions into repo state. LT does not own git terminology.
- **Boardroom conversations become operating memos** in `ops/operating-memos/YYYY-MM-DD-<topic>.md` when they change how TBM operates.
- **Continuity is deliberate**: if a prompt, plan, process, or handoff must survive the thread, save it as a durable artifact in the same thread and name the exact path.
- **Auditor's pass is real**: reusable prompts, plans, and templates get a rubric-based self-audit plus revision before handoff. No unsupported theater scores.
- **Handoff comments are optional**: use `<!-- tbm-handoff -->` only when a PR changes hands mid-flight or pauses with a clear next action. At most one active comment per PR, edited in place.

See `ops/WORKFLOW.md § Two-Lane Handoff Rules` for the command contract, trigger phrases, and full examples.

---

## Never Do This

### Tier 1 — Causes Regressions
1. Hardcoding sheet names instead of TAB_MAP
2. Using ES6 in any `.html` file (see ES5 Enforcement section)
3. Writing code against assumed field names without grep verification
4. Replacing an HTML file without grepping the CURRENT file for all interactive elements (buttons, forms, modals, onclick handlers) and verifying every one exists in the new file
5. Reading DataEngine.gs or any large file in a single read
6. Claiming "done" without re-reading the modified file to verify
7. Skipping smoke test before deploy
8. Adding a `google.script.run` call without a matching `withFailureHandler()` (also: must add Safe wrapper to smoke test wiring check)

### Tier 2 — Causes Deploy Problems
9. Stopping at `clasp push` without completing the full pipeline
10. Creating a new GAS deployment instead of updating existing
11. Version mismatches across the 3 required locations (header, getter, EOF)
12. Pushing to GAS without `git commit` + `git push` after
13. Pushing without running `audit-source.sh` first
14. Using `clasp deploy` without `-i` flag
15. Pushing a branch that is behind `gitea/main` (staleness gate catches this; `origin/main` points at GitHub-archive and must not be used as the base since 2026-04-19)
16. Embedding Python/bash heredocs in workflow YAML instead of using `.github/scripts/`

### Tier 3 — Causes Drift
17. Duplicating constants across files (shared global scope — they're already available)
18. Writing to a sheet tab owned by another module
19. Skipping Notion deploy page update after deploy
20. Guessing at versions — read the actual file header
21. Starting a big refactor without a Step 0 cleanup commit
22. Trusting a grep that returned suspiciously few results without re-running narrower
23. Running multiple PRs that touch hot files (workflows, CLAUDE.md, audit-source.sh) in parallel

> Code-style anti-patterns (`tryLock` vs `waitLock`, `getActiveSpreadsheet` vs `openById`, double-emoji Notion bug) are in **Pattern Registry** below. Do not duplicate them here.

---

## Deploy Freeze

A deploy freeze halts all 19 freeze-critical mutation paths during risky windows. Full contract: `ops/deploy-freeze.md`.

**Set freeze BEFORE:** schema migrations, finance model changes, parent approval flow changes mid-Sunday, MER close, any PR touching ≥5 freeze-critical sites at once.

**Who can set/lift:** LT only (requires clasp run access).

**Activation:** `clasp run setFreeze_ "reason" "2026-04-17T10:00:00Z"` (or omit expiry for 24h auto-lift)

**Lift:** `clasp run liftFreeze_`

**Emergency bypass:** `clasp run generateEmergencyToken_ "reason" 60` — 1-hour token, per-mutation audit trail, `GATE_BREACH` Pushover on first use.

**audit-source.sh Check 6** blocks push when freeze is active. Override: `EMERGENCY=1 bash audit-source.sh` — commit message MUST start with `EMERGENCY: <reason>`.

**Code rule (work-doctrine rule 14 extension):** Any PR adding a new freeze-critical mutation site MUST add `assertNotFrozen_('freeze-critical', 'funcName')` to the Safe wrapper AND add a row to `ops/mutation-paths.md`.

---

## Deploy Pipeline (MANDATORY — every deploy)
Run steps 1–11 autonomously. Report results at end. LT's only action: review PR and approve.
**EXCEPTION: If any step returns unexpected output, STOP and report before continuing.**

1. **EDIT** → Make changes locally in `C:\Dev\tbm-apps-script`
2. **VERSION** → Bump version in ALL 3 locations per changed `.gs` file: line 3 header, `get*Version()` return, EOF comment. All three MUST match. Grep to verify.
3. **AUDIT** → `bash audit-source.sh` — FAIL = stop. WARN = review each, fix or document.
   Covers: branch staleness, ES5 compliance (in `.html`), version consistency (3-location), withFailureHandler wiring, route integrity, eval() usage, workflow YAML lint (if changed), Python script compile (if changed).
4. **PUSH** → `clasp push`
5. **PRE-QA** → Run `diagPreQA()` from GASHardening.gs. ALL categories must show PASS. Any FAIL = stop, fix, re-push, re-run.
6. **DEPLOY** → `clasp deploy -i <deploymentId>`
7. **VERIFY** → Hit `?action=runTests` on PRODUCTION `/exec` URL. Assert structured JSON: `overall == "PASS"` AND `smoke.overall == "PASS"`. Check ErrorLog for new errors (last 5 min). NOTE: `/dev` URLs require Google auth — curl/fetch cannot reach them.
8. **GIT** → Git Bash only (NOT PowerShell): `git checkout -b <branch> gitea/main` → `git add <specific files>` → `git commit` → `git push gitea <branch>` → Open PR via the Gitea API (`POST /repos/blucsigma05/tbm-apps-script/pulls` with body including `Closes #NNN`). The `origin` remote points at GitHub-archive and must not be pushed to since 2026-04-19.
9. **NOTION** → Update PM Active Versions DB. Write thread handoff to Archive. Update deploy page title (version only, NOT icon).
10. **CF VERIFY** → curl all CF proxy endpoints from route list, expect 200.
11. **RELEASE** → Create a Gitea release: `curl.exe -s -X POST -H "Authorization: token <pat>" -H "Content-Type: application/json" "https://git.thompsonfams.com/api/v1/repos/blucsigma05/tbm-apps-script/releases" -d '{"tag_name":"v<version>","name":"v<version>","body":"<summary>","target_commitish":"main"}'`. Do not use `gh release create` for this repo — since 2026-04-19 it resolves to the GitHub-archive account and fails or silently tags the wrong history.

**Never stop at step 4 (PUSH).**

### Deploy Proof
Deploy success is proven, not inferred:
- **Deploy success = HTTP 200 from `?action=runTests` AND structured JSON assertion of `overall == "PASS"` AND `smoke.overall == "PASS"`.** NOT just "workflow completed."
- **The deploy Pushover MUST include:** deployment ID, version, smoke result, commit SHA, timestamp.
- **If any proof field can't be captured,** the workflow fails and sends BLOCKED Pushover. Don't ship a deploy proof that can be silently truncated.

---

## QA Gates (7 Gates + 2 Audits)

Reference: Notion `336cea3cd9e881798061e9032cee48c3`

### Gate 1 — Wiring Check (automated)
Run by `audit-source.sh` (Deploy Pipeline step 3). Verifies every `withSuccessHandler` has a matching `withFailureHandler`, and that every `google.script.run.<fn>Safe()` call has a matching server function exported in `Code.gs`.

### Gate 2 — Pre-Push Compile (automated)
Run by `audit-source.sh`. Python script compile + workflow YAML lint when those files change. ES5 banned-pattern grep on `.html` files.

### Gate 3 — Version Consistency (automated)
Run by `audit-source.sh`. Verifies 3-location match (header, getter, EOF) in every changed `.gs` file.

### Gate 4 — Deploy Manifest
Every build spec produces a grep manifest WHEN THE SPEC IS CREATED — not after the build. Before declaring "QA ready," run every manifest line. Zero matches or `display:none` = NOT DONE.

Format:
```
# [Build Spec Name] — Deploy Manifest
grep -n "[unique identifier]" [file]    → expected: [what should be there]
```

### Gate 5 — Feature Verification Checklist

Every build spec must include BOTH a Deploy Manifest (Gate 4) AND a Feature Verification Checklist (Gate 5).
- Deploy Manifest answers: "Does this feature EXIST?"
- Feature Verification answers: "Is this feature CORRECT?"

**Rules:**
1. Checklist is created AT SPEC TIME by Chat. Code does NOT define its own checklist.
2. Each item has a specific, measurable pass condition — not "looks good" but "background is #2D1B69" or "avatar is 120px" or "streak shows consecutive days."
3. The checklist is CUMULATIVE. Prior verified items carry forward to every future build of that surface.
4. Before declaring "QA ready," verify every checklist item by grep or by running the function and reading output.
5. Items verified only by reading source don't count. Run it, read Logger output, confirm the value.

**What goes on the checklist:** specific hex colors, pixel dimensions, math/formula outputs, conditional logic, text content, state transitions, interaction behavior.

### Gate 6 — Pre-QA Diagnostic (automated)
Run `diagPreQA()` from `GASHardening.gs` (Deploy Pipeline step 5). All categories must show PASS. Any FAIL blocks deploy. Captures: TAB_MAP integrity, lock service health, workbook reference, cache state, Pushover key validity.

### Gate 7 — Post-Deploy Check
After deploy, verify production is stable — not just at deploy time but an hour later.

1. MonitorEngine log: zero errors since deploy timestamp
2. KidsHub heartbeat cache: age < 120 seconds
3. No Pushover error alerts fired since deploy
4. Hit each surface URL once, confirm no 500/error screen

For evening deploys, next-morning check is acceptable.

### Audit A — Code Quality Lab (periodic)
Runs architecture/security checks against the codebase. Triggered by scheduled task or by Codex review request.

### Audit B — Cross-Surface Consistency (periodic)
Skeleton parity check across HTML surfaces. Catches drift between sibling modules (e.g., HomeworkModule vs reading-module footer nav).

---

## QA Operator Mode

> **Documentation pending.** This section is flagged TODO from the 2026-04-13 claude-md-review.
> The relevant code: `QAOperatorSafe.gs`. Pattern: per-request QA SSID override, signed token contract, `/qa/*` route isolation.
> Before working in this area, read `QAOperatorSafe.gs` and the QA Test Plan Notion page (`32ccea3cd9e8818f9e30f317dea0fed7`).
> When you understand the contract, replace this stub with the actual documentation.

---

## ES5 Enforcement (ALL .html files)
Android WebView and Fully Kiosk Browser do NOT support ES6+.

| Banned | Use Instead |
|--------|------------|
| `let` / `const` | `var` |
| `=>` arrow functions | `function(){}` |
| Template literals `` ` `` | String concatenation |
| `async` / `await` | Callbacks or `.then()` |
| `??` nullish coalescing | `\|\|` or ternary |
| `?.` optional chaining | Explicit null checks |
| `.includes()` | `indexOf() !== -1` |
| `.find()` | `for` loop |
| `URLSearchParams` | Parse manually |
| `Object.entries()` / `.values()` | `Object.keys()` + loop |
| `...` spread | `Array.prototype.slice.call()` |
| Destructuring `{a, b} = obj` | `var a = obj.a` |
| `backdrop-filter` CSS | Not supported on Fire TV |

### ES5 Allowed Methods
These ES5.1 methods ARE allowed — they work in all target WebViews (Fully Kiosk 4.x+, Fire TV Silk, Samsung Internet 4+):
`Object.keys()`, `Array.isArray()`, `JSON.parse()`/`JSON.stringify()`, `indexOf()`, `forEach()`, `map()`, `filter()`, `trim()`

---

## API Proxy Contract
HTML modules served via Cloudflare use the `google.script.run` shim which POSTs to `/api?fn=FUNCTION_NAME`. When accessed directly via GAS (not Cloudflare), the XHR fallback uses `?action=api&fn=FUNCTION_NAME&args=[]` — both paths handled by `serveData()` router branch in `Code.gs`. Both paths resolve to the same function execution.

---

## Pattern Registry
| Pattern | Canonical location |
|---------|--------------------|
| Error logging | GASHardening.gs → `logError_()` |
| Perf monitoring | GASHardening.gs → `logPerf_()`, `withMonitor_()` |
| Tab name lookup | DataEngine.gs → `TAB_MAP` |
| Version reporting | GASHardening.gs → `getDeployedVersions()` |
| Cache read/write | Code.gs → `getCachedPayload_()`, `setCachedPayload_()` |
| Workbook reference | `openById(SSID)` — NEVER `getActiveSpreadsheet()` |
| Push notifications | AlertEngine.gs → `sendPush_()` (recipients: LT, JT, BOTH) — use `PUSHOVER_PRIORITY.*` constants, never bare integers |
| KH heartbeat | KidsHub.gs → `stampKHHeartbeat_()` after every write |
| Lock acquisition | `waitLock(30000)` — NEVER `tryLock()` |
| Smoke + regression | Code.gs → `?action=runTests` returns combined JSON |
| New `google.script.run` call | Must have `withFailureHandler()`. Must add Safe wrapper to smoke test check. Must run audit-source.sh. |
| Hygiene finding → Issue | `.github/scripts/file_hygiene_issue.py` via `.gitea/workflows/hygiene-filer.yml` (the `.github/workflows/` path is empty post-port; the workflow was renamed into `.gitea/workflows/` during the 2026-04-20 migration). Emitter passes structured finding JSON; filer dedups by marker and files or reopens. |

---

## Hygiene Automation — Issue Filer (Phase 1)

Hygiene workflows (HYG-*) that detect findings can file dedup'd Gitea Issues via the shared filer at `.gitea/workflows/hygiene-filer.yml` (ported from `.github/workflows/` during the 2026-04-20 migration; the GitHub path is empty post-port and not live). The filer identifies findings by a signature hidden in the Issue body — **never** by title (titles are human-editable):

```
<!-- auto-finding v=1 check=<check-id> sig=<16-hex> -->
```

The signature is `sha256` over a canonical `identity` dict (keys and string values stripped + lowercased, keys sorted) — **never** over volatile fields like `age_days` or byte counts. Identity captures the problem, not its current measurement.

**Dedup search order** (open → suppressed → recent closed → new):
1. Any OPEN Issue matches → no-op
2. Any CLOSED Issue with `auto:suppressed` label → no-op forever (LT rejected)
3. Any CLOSED Issue within 7 days without `auto:suppressed` → reopen
4. Otherwise → create new Issue with `auto:filed` label

**Kill switches** (all ≤60s): `vars.AUTOMATION_ENABLED=false` (master), `vars.HYGIENE_ISSUE_CREATION_ENABLED=false` (filer only), disable `hygiene-filer.yml` workflow in UI. Filer diagnostics post to the pinned filer-status Issue (`vars.STATUS_ISSUE_NUMBER`).

Phase 1 scope: one pilot check (HYG-06 version drift). Phase 2+ is out of scope — this system files Issues only, no auto-PRs.

---

## File Map

### Server-side (.gs pushed via clasp as .js)
| File | Role | Owns writes to |
|------|------|---------------|
| DataEngine.gs | Core computation, TAB_MAP owner, all KPIs | DebtModel, CFF, Dashboard_Export, Debt_Export |
| Code.gs | Router + safe wrappers, CacheService, `?action=runTests` | — (routing only) |
| KidsHub.gs | Chore/reward/grade server logic | KH_ tabs |
| CascadeEngine.gs | Debt cascade simulation | — (read-only) |
| MonitorEngine.gs | MER gates + `stampCloseMonth()` | Close History, Month-End Review |
| CalendarSync.gs | Google Calendar sync | — |
| GASHardening.gs | Error logging, perf monitoring, version reporting | ErrorLog, PerfLog |
| AlertEngine.gs | Pushover push notifications | — |
| StoryFactory.gs | Kid story generation via Gemini | KH_StoryProgress |
| CodeSnapshot.gs | Snapshot code to Google Drive | — (Drive only) |
| tbmSmokeTest.gs | Pre-deploy health checks | — |
| tbmRegressionSuite.gs | Regression tests | — |
| ActivityStoryPacks.gs | Pre-authored story packs for SparkleLearning | — (read-only) |
| AssetRegistry.gs | Shared asset catalog for SparkleLearning + validators | — (read-only) |
| AuditTrigger.gs | Scheduled audit trigger coordinator | — |
| ContentEngine.gs | Gemini-powered grading + content generation | — |
| CurriculumSeed.gs | Curriculum seed data for JJ (8 wk) + Buggsy (16 wk) | Curriculum |
| DeployGate.gs | Pre-deploy schema + function validation | — (read-only) |
| EducationAlerts.gs | Education-specific Pushover alerts | — |
| FormulaAudit.gs | Workbook formula forensics | — (read-only) |
| NotionBridge.gs | Push TBM health data to Notion for agents | — |
| NotionEngine.gs | Notion API wrapper for education modules | — |
| QAOperatorSafe.gs | Safe wrappers for QA Operator Mode (`/qa/*` route isolation, signed-token override) | QA_Snapshots |
| Resettesting.gs | QA sandbox reset + seed tooling | — |
| SpellingCatalog.gs | 450-word spelling catalog (generated) | — (read-only) |
| Utility.gs | Run-once utility functions | — |

### Client-side (.html)
| File | Surface | Route (`?page=`) |
|------|---------|------------------|
| ThePulse.html | JT+LT finance dashboard | `pulse` (default) |
| TheVein.html | LT command center | `vein` |
| KidsHub.html | Kid tablets + Parent Dashboard | `kidshub` |
| TheSpine.html | Office ambient (48" Sony TV) | `spine` |
| TheSoul.html | Kitchen ambient (32" RCA TV) | `soul` |
| SparkleLearning.html | JJ learning games (S10 FE) | `sparkle` |
| HomeworkModule.html | Buggsy math/science homework | `homework` |
| WolfkidCER.html | Wolfkid CER writing | `wolfkid` |
| reading-module.html | Cold reading practice | `reading` |
| writing-module.html | Writing practice | `writing` |
| fact-sprint.html | Timed fact drills | `facts` |
| investigation-module.html | Science investigation | `investigation` |
| daily-missions.html | Daily mission rotation | `daily-missions` |
| BaselineDiagnostic.html | Baseline diagnostic assessment | `baseline` |
| ComicStudio.html | Comic creation tool | `comic-studio` |
| DesignDashboard.html | Ring Quest dashboard designer | `wolfdome` / `dashboard` |
| ProgressReport.html | Weekly progress report (parent) | `progress` |
| StoryLibrary.html | Family story library | `story-library` |
| StoryReader.html | Bedtime story reader | `story` |
| Vault.html | LT watch collection vault | `vault` |
| JJHome.html | JJ Sparkle Kingdom hub | `sparkle-kingdom` |
| wolfkid-power-scan.html | Wolfkid power scan assessment | `power-scan` |
| executive-skills-components.html | Shared exec skills component (inlined) | — (not routed) |

### Utility files (NOT pushed to GAS)
| File | Purpose |
|------|---------|
| phrases.json | Audio clip definitions (source of truth) |
| generate-audio.js | ElevenLabs batch audio generator (Node.js) |
| generate-spelling-catalog.js | Reads spelling-catalog.json → writes SpellingCatalog.js |
| audit-source.sh | Static source audit (pre-push gate — covers Gates 1, 2, 3) |
| audit-wiring.sh | Wiring verification (subsumed by audit-source.sh; kept for ad-hoc use) |
| cloudflare-worker.js | CF Worker: smart proxy, PIN gate, Tiller freshness |
| uptime-worker.js | CF Worker: uptime monitoring |
| playwright.config.js | Playwright test configuration |
| CLAUDE.md | This file |

### CI/CD scripts (.github/scripts/)
| Script | Called by | Purpose |
|--------|-----------|---------|
| `codex_review.py` | codex-pr-review.yml | Send PR diff to OpenAI gpt-4o, format review comment |
| `parse_test_results.py` | ci.yml | Parse GAS smoke+regression JSON into PR comment |
| `parse_playwright_results.py` | playwright-regression.yml | Parse Playwright JSON into PR comment |
| `parse_finding_comment.py` | codex-finding-listener.yml | Parse PR comment for human-authored finding markers (manual path), apply labels, file blocker Issues via `_finding_dedup.py` |
| `file_codex_review_findings.py` | codex-pr-review.yml (inline filer step) | Parse automated Codex review JSON (bot-authored), file blocker/critical findings as durable `claude:inbox` Issues via `file_hygiene_issue.py` |
| `triage_review.py` | codex-pr-review.yml | Classify PR into skip/light/medium/full before review |
| `check_version_drift.py` | hygiene.yml | Compare deployed GAS versions against source constants |
| `check_claude_md.py` | hygiene.yml | Detect CLAUDE.md bloat, dead refs, duplicate phrases |
| `check_dead_workflows.py` | hygiene.yml | Flag workflows with no recent runs |
| `check_integration_map_drift.py` | hygiene.yml | Flag Notion Integration Map entries past review date |
| `check_knowledge_graph_diff.py` | hygiene.yml | Diff knowledge files across push range |
| `check_orphaned_prs.py` | hygiene.yml | Find open PRs with no activity past threshold |
| `check_parking_lot_age.py` | hygiene.yml | Flag stale Notion Parking Lot items |
| `check_secrets_audit.py` | hygiene.yml | List GH secrets, flag orphaned or stale |
| `check_stale_branches.py` | hygiene.yml | Find branches with no open PR past threshold |
| `check_trust_backlog_age.py` | hygiene.yml | Flag stale Trust Backlog sprint items |
| `review-fixer.js` | review-fixer.yml | Auto-apply deterministic fixes from PR review threads |
| `review-watcher.js` | review-watcher.yml | Watch PR review status and update pipeline markers |

Each script is runnable standalone for local testing. Each reads env vars — no positional args.

### Cloudflare Worker Routes
All routes proxy to GAS `?page=` equivalents. Source of truth: `cloudflare-worker.js`. Verify all return 200 after deploy.

#### Core Surfaces
```
thompsonfams.com/pulse            → ?page=pulse
thompsonfams.com/vein             → ?page=vein
thompsonfams.com/parent           → ?page=kidshub&view=parent
thompsonfams.com/buggsy           → ?page=kidshub&child=buggsy
thompsonfams.com/jj               → ?page=kidshub&child=jj
thompsonfams.com/soul             → ?page=soul
thompsonfams.com/spine            → ?page=spine
```

#### Education Surfaces
```
thompsonfams.com/daily-missions   → ?page=daily-missions
thompsonfams.com/daily-adventures → ?page=daily-missions&child=jj  (JJ alias)
thompsonfams.com/homework         → ?page=homework
thompsonfams.com/sparkle          → ?page=sparkle
thompsonfams.com/sparkle-free     → ?page=sparkle&mode=freeplay
thompsonfams.com/wolfkid          → ?page=wolfkid
thompsonfams.com/reading          → ?page=reading
thompsonfams.com/writing          → ?page=writing
thompsonfams.com/facts            → ?page=facts
thompsonfams.com/investigation    → ?page=investigation
thompsonfams.com/baseline         → ?page=baseline
thompsonfams.com/power-scan       → ?page=power-scan
```

#### Tools & Dashboards
```
thompsonfams.com/wolfdome         → ?page=wolfdome        (Buggsy dashboard)
thompsonfams.com/sparkle-kingdom  → ?page=sparkle-kingdom (JJ dashboard)
thompsonfams.com/dashboard        → ?page=wolfdome        (alias)
thompsonfams.com/progress         → ?page=progress
thompsonfams.com/comic-studio     → ?page=comic-studio
thompsonfams.com/story-library    → ?page=story-library
thompsonfams.com/story            → ?page=story
thompsonfams.com/vault            → ?page=vault
```

#### API Endpoints
```
thompsonfams.com/api              → POST proxy to google.script.run
thompsonfams.com/api/verify-pin   → PIN verification for finance surfaces
```

### Device Viewport Map (for Playwright screenshots)
| Route | Viewport | Device |
|-------|----------|--------|
| `/spine` | 980x551 | Office Fire Stick |
| `/soul` | 980x551 | Kitchen Fire Stick |
| `/parent` | 412x915 | JT S25 |
| `/pulse` | 412x915 | JT S25 |
| `/vein` | 1920x1080 | LT Desktop |
| `/buggsy` | 800x1340 | A9 Tablet (portrait) |
| `/jj` | 800x1340 | A7 Tablet (portrait) |
| `/daily-missions` | 1368x912 | Surface Pro |
| `/daily-missions?child=jj` | 1200x1920 | S10 FE (portrait) |

---

## CI/CD Pipeline

### CI Checks (Gitea Actions — runs on every PR; the live CI lane since the 2026-04-20 port)
| Order | Check | Workflow | Purpose |
|-------|-------|----------|---------|
| 1 | Workflow Lint | `workflow-lint.yml` | actionlint + py_compile + shellcheck — runs first |
| 2 | TBM Smoke + Regression | `ci.yml` | GAS smoke + regression tests |
| 2 | Playwright Regression | `playwright-regression.yml` | E2E + viewport screenshots |
| 2 | Codex PR Review | `codex-pr-review.yml` | gpt-4o code review — has `needs: lint-gate`. Inlines the claude:inbox filer step after posting its review comment (#450 Phase 1 — runs `file_codex_review_findings.py`). |

Branch protection on Gitea `main` is intentionally absent — the enforcement surface is `.github/scripts/review-watcher.js` + the pipeline relay, not a branch rule. Gitea's native "Protected Branches" form at `git.thompsonfams.com/blucsigma05/tbm-apps-script/settings/branches` is where configuration would live if any were set. The pre-migration GitHub Settings > Branches surface is archive-only since 2026-04-19 and does not gate the live repo.

**Merge automation (live).** PRs on Gitea are merged by the **pipeline-relay automation**, not by LT manually. Flow:

1. CI + Codex run on every PR.
2. `.github/scripts/review-watcher.js` evaluates state each cycle; marks `READY_TO_MERGE` when **all** of: CI green, Codex verdict `PASS`, `0` unresolved review threads.
3. Watcher POSTs to `PIPELINE_RELAY_URL` (repo secret) with `type: loop_complete`.
4. The relay merges the PR via the Gitea API using LT's PAT — so `merged_by: LT` in Gitea is **automation attribution, not a human click.**

Implication: telling LT "you'll need to review and merge each PR" is wrong framing. The relay handles it. LT's role is to review the diff beforehand for hot-file / UX-sensitive PRs that the "Always confirm" list below flags.

### Autonomous Merge Authority

This section governs when Claude Code may autonomously merge a PR on Gitea **directly** during an interactive session (via `POST /repos/blucsigma05/tbm-apps-script/pulls/<N>/merge`), **bypassing the relay** described above. `gh pr merge` is not usable for this repo since 2026-04-19.

**Merge autonomously (green = go).** All of the following must hold:
- Both CI AND Codex have explicit PASS verdicts on the PR
- The PR matches one of these shapes:
  - `CHORE:` / `DOCS:` / `CONFIG:` non-sensitive prefixed changes
  - `severity:minor` feature work with no mutation-path changes
  - Review-fix commits on a PR LT already saw the diff of
  - Any PR where LT said "ship it" / "merge" / "let's go" in the same session
- The PR does NOT touch any file in the "always confirm" list below
- No active deploy freeze

**Always confirm merge first (non-negotiable, no override).**
- Hot files: `.gitea/workflows/**` (live CI lane on Gitea Actions since the 2026-04-20 port), `.github/workflows/**` (mostly empty post-port; still hot for any surviving file), `.github/scripts/**`, `.gitea/scripts/**` (if present), `CLAUDE.md`, `AGENTS.md`, `ops/WORKFLOW.md`, `audit-source.sh`, `cloudflare-worker.js`
- Freeze-critical paths (enumerated in `ops/mutation-paths.md`)
- Schema migrations or `TAB_MAP` changes
- Financial model changes (DataEngine calculators, debt cascade, close logic)
- Any PR with `severity:blocker` or `severity:critical`
- Any PR where CI is yellow/red or Codex verdict is FAIL / INCONCLUSIVE
- Kid-visible UI changes without a visual diff shown to LT in session
- During an active deploy freeze (any merge)
- PRs opened by a non-interactive agent lane (e.g. the nightly grinder — see #454)

**Gray zone (ask first time, remember the call).**
- First PR of a new pattern or area
- New scheduled tasks / cron triggers
- Changes to alert tier thresholds (`PUSHOVER_PRIORITY.*`)
- First PR after a CI workflow change

**Autonomous overnight work is a separate contract.** The nightly grinder (#454) and any future unsupervised automation **merges nothing**. That is a different trust tier — no interactive LT to catch subtle wrongness. Interactive session authority above does not extend to lanes LT is not watching.

**Evidence standard for "Claude says green."** Before an autonomous merge, Claude must have VERIFIED (not assumed), via the Gitea API (this repo is on `git.thompsonfams.com`; GitHub is archive-only since 2026-04-19 and `gh` commands route to the wrong repo):

- **All required Gitea status contexts are `success`** on the PR's HEAD commit:
  ```
  curl.exe -s -H "Authorization: token <pat>" "https://git.thompsonfams.com/api/v1/repos/blucsigma05/tbm-apps-script/commits/<head_sha>/statuses" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(s['context'], s['status']) for s in d]"
  ```
  Every row's `status` must be `success` (the plural `/statuses` endpoint uses the key `status`, not `state` — verified 2026-04-23).
- **Codex cross-audit comment present with PASS verdict**, per the two-shape contract in § Codex PR Audit Lane below. For Claude-built PRs the bot-authored comment shows the `<!-- codex-pr-review -->` marker + a first heading containing the stable text `Codex PR Review: PASS` (match on the stable text, not the emoji — the posting pipeline mojibakes the emoji; see § Codex PR Audit Lane for the byte-level detail) + a `**Files Reviewed:**` section. For Codex-built pilot PRs (per `ops/operating-memos/2026-04-22-codex-infra-build-pilot.md`) a Claude-authored manual comment shows `**Verdict:** PASS` + `**Files Reviewed:**` section. Fetch with `curl.exe -s -H "Authorization: token <pat>" "https://.../issues/<N>/comments"`.
- **Unresolved review threads = 0.** Gitea reviews are fetched at `/pulls/<N>/reviews`; any review in state `REQUEST_CHANGES` or `PENDING` that is not dismissed blocks autonomous merge:
  ```
  curl.exe -s -H "Authorization: token <pat>" "https://git.thompsonfams.com/api/v1/repos/blucsigma05/tbm-apps-script/pulls/<N>/reviews" | python3 -c "import sys,json; rs=json.load(sys.stdin); blocking=[r for r in rs if r.get('state') in ('REQUEST_CHANGES','PENDING') and not r.get('dismissed')]; print('blocking reviews:', len(blocking))"
  ```
  Output must be `blocking reviews: 0`. Any other value blocks autonomous merge.

"Looks green in the UI" is not evidence. Read the API response.

### Cloudflare Worker Deploy Verification (issue #403)

There are two separate Cloudflare integrations to keep straight:

| Integration | What it does | Authoritative? |
|-------------|--------------|----------------|
| `.gitea/workflows/deploy-worker.yml` (TBM-owned Gitea Actions workflow — ported from `.github/workflows/` on 2026-04-20) | Runs `wrangler deploy` on push to `main` — **this is what actually deploys the worker** | ✅ Yes |
| Cloudflare "Workers Build" GitHub App status | A pre-migration GitHub App that posted cosmetic CI status badges to PRs on the GitHub repo. Since the 2026-04-19 account suspension the GitHub repo is archive-only; Cloudflare has no equivalent Gitea integration, so this signal is not present on live PRs. Do not rely on it. | ❌ No |

**When a Cloudflare worker change is pushed, the correct verification sequence is:**

```bash
# Verify HTTP 200 and body — -f causes non-zero exit on 4xx/5xx
curl -sf https://thompsonfams.com/version

# Verify the correct run succeeded — fetch Gitea statuses on the latest main commit and
# look for the deploy-worker context. (gh run list is unusable for this repo since the
# 2026-04-19 account suspension; it would resolve to the GitHub-archive account.)
LATEST_SHA=$(curl.exe -s -H "Authorization: token <pat>" "https://git.thompsonfams.com/api/v1/repos/blucsigma05/tbm-apps-script/branches/main" | python3 -c "import sys,json; print(json.load(sys.stdin)['commit']['id'])")
curl.exe -s -H "Authorization: token <pat>" "https://git.thompsonfams.com/api/v1/repos/blucsigma05/tbm-apps-script/commits/${LATEST_SHA}/statuses" | python3 -c "import sys,json; [print(s['context'], s['status']) for s in json.load(sys.stdin) if 'deploy-worker' in s['context'].lower()]"
# expect: every deploy-worker context line shows status=success
```

**Never ask LT to check the Cloudflare dashboard.** If `.gitea/workflows/deploy-worker.yml` shows success and `curl -sf /version` exits 0, the worker is live — regardless of what any external badge says.

The Cloudflare "Workers Build" GitHub App is a pre-migration integration and only ever posted to the GitHub repo, which is archive-only since 2026-04-19. You will not see its badge on live Gitea PRs — that is expected, not a deploy failure. Ignore any stale/missing badge on the archived GitHub repo.

### Workflow Safety Rules
1. **Workflow YAML should orchestrate only.** Real logic (Python, bash) belongs in `.github/scripts/`. No embedded heredocs. Each script gets a header comment: purpose, calling workflow, env vars expected.
2. **New workflow files CANNOT review their own introduction** — they require manual lint plus one sacrificial test PR before becoming a required check.
3. **Codex bot comment updates use an HTML marker** (`<!-- codex-pr-review -->`) for deterministic matching.
4. **workflow-lint runs before all other PR checks.** codex-pr-review has `needs: lint-gate` — broken YAML fails fast without wasting an OpenAI API call.
5. **CI tool versions are pinned.** actionlint v1.7.7, shellcheck from ubuntu-latest. Deterministic CI.
6. **Local lint is conditional on changed files.** audit-source.sh only runs actionlint/py_compile when those files changed. CI runs unconditionally.

### Codex PR Audit Lane

When Codex is asked to audit PRs on this repo:
1. **Canonical host is Gitea** (`git.thompsonfams.com/blucsigma05/tbm-apps-script`). GitHub (`github.com/blucsigma05/tbm-apps-script`) is archive-only since the account suspension on 2026-04-19 — audit commands that silently route to GitHub succeed against the archived copy and return audits of the wrong PR. Do not use `gh pr view`, `gh pr diff`, `gh pr comment`, or `gh api repos/blucsigma05/...` for this repo. (`gh` may still be used for non-TBM repos on GitHub.)
2. Use the Gitea REST API via `curl.exe` with a bearer token. Typical audit commands (all verified 2026-04-23 against the live repo):
   - List open PRs: `curl.exe -s -H "Authorization: token <pat>" "https://git.thompsonfams.com/api/v1/repos/blucsigma05/tbm-apps-script/pulls?state=open"`
   - PR metadata: `curl.exe -s -H "Authorization: token <pat>" "https://git.thompsonfams.com/api/v1/repos/blucsigma05/tbm-apps-script/pulls/<N>"`
   - PR diff (machine-readable): append `.diff` to the PR URL — `"https://.../pulls/<N>.diff"`
   - Post a PR comment: `curl.exe -s -X POST -H "Authorization: token <pat>" -H "Content-Type: application/json" "https://.../issues/<N>/comments" -d '{"body":"..."}'`
   - Existing comments on a PR: `"https://.../issues/<N>/comments"` (note: PRs are issues in Gitea for the comments endpoint).
3. `git` commands are unchanged, but the remote to fetch/push is `gitea`, not `origin`: `git fetch gitea main` / `git push gitea <branch>`. `origin` still points at GitHub-archive on most worktrees and must not receive new work.
4. Post findings directly on the Gitea PR via the comments POST above, or edit in place via `PATCH /issues/comments/<comment_id>` to keep one durable audit comment per PR.
5. Return only a short summary in chat with the Gitea comment URL.

The `curl.exe` / `-H "Authorization: token <pat>"` / `curl.exe -X POST` shell-portability notes are the same as in `ops/operating-memos/2026-04-22-codex-infra-build-pilot.md` § Preflight — use the explicit `.exe` to bypass the PowerShell `curl` → `Invoke-WebRequest` alias, and use the bearer-token header (not `-u <pat>`) because the repo credential flow yields separate username + password fields.

**Pass/fail standard (enforced by `codex-pr-review.yml` → `codex_review.py`):**

The pass/fail signal has two shapes depending on who authored the comment:

- **Bot-authored automated review** (from `.github/scripts/codex_review.py` posting via `codex-pr-review.yml`). The comment body starts with the HTML marker `<!-- codex-pr-review -->` and the first heading after the marker matches the pattern `## <emoji> Codex PR Review: <verdict>`. **Match on the stable text suffix, not the emoji.** `codex_review.py` intends `\u2705` for PASS (:848), `\u274c` for FAIL (:846), and `\u26a0\ufe0f` for INCONCLUSIVE (:844), but the bytes served by the Gitea API for this repo are double-encoded — the UTF-8 bytes for `\u2705` come back as if `\u2705` had been decoded as cp1252 (yielding the three chars `\u00e2\u0153\u2026`) and re-encoded as UTF-8 (the six bytes `\xc3\xa2\xc5\x93\xe2\x80\xa6`), which displays as `â œ …` / `?` / similar depending on the reader's terminal. Raw-byte dump of PR #73 comment 641 heading verified 2026-04-23. The bot encoding bug is tracked separately as a follow-up; the match contract below is mojibake-tolerant:
  - **PASS** — the heading after the marker contains the stable text `Codex PR Review: PASS`, AND the body has a `**Files Reviewed:** <list>` line, AND no P1 violations in the findings JSON. (Heading emitted at `codex_review.py:851`, files line at `:927`.)
  - **FAIL** — the heading contains the stable text `Codex PR Review: FAIL`, with findings listed in the body.
  - **INCONCLUSIVE** — the heading contains the stable text `Codex PR Review: INCONCLUSIVE` followed by `— <reason>` (auth error, API error, malformed response, usage-limit hit, truncated diff, missing `**Files Reviewed:**`, rubber-stamp phrases). Emitted at `codex_review.py:820/826/833/967`. Blocks merge, same as FAIL.
- **Claude-authored manual cross-audit comment** (posted via the Gitea API on Codex-built pilot PRs per `ops/operating-memos/2026-04-22-codex-infra-build-pilot.md`). The comment body explicitly states:
  - **PASS** — `**Verdict:** PASS` + a `**Files Reviewed:**` section listing files seen. No blocker/critical findings.
  - **FAIL** — `**Verdict:** FAIL` + listed findings.
  - `**Verdict:**` token absent or not one of the above = INCONCLUSIVE (missing signal). Blocks merge.

"Looks good" / no explicit verdict / reviewer asks a question = INCONCLUSIVE. Not a pass. Applies to both shapes.

### Branch Hygiene
1. **Sync before push.** Mandatory `git fetch gitea main` and rebase on `gitea/main` before any push. The staleness gate in `audit-source.sh` enforces this. (`origin/main` points at the GitHub-archive and is stale since 2026-04-19 — do not rebase on it.)
2. **Branch from latest.** New branches must be created from `gitea/main` after a fresh fetch (`git checkout -b <branch> gitea/main`).
3. **No merge if behind.** Rebase on current `gitea/main`, then rerun checks before requesting merge.
4. **No broad "take ours" on shared files.** During conflict resolution on workflow YAML, CLAUDE.md, audit-source.sh, or UI files, rebuild each conflicted file from intent. Inspect the final diff.
5. **Hot file lock.** When a PR touches `.gitea/workflows/**`, `.github/workflows/**`, `.github/scripts/**`, `CLAUDE.md`, `AGENTS.md`, `ops/WORKFLOW.md`, or `audit-source.sh`, only ONE such PR may be in flight. Others wait, then rebase on `gitea/main`.
6. **Pre-flight conflict check.** Run `git merge-tree gitea/main HEAD` before opening a PR. Resolve conflicts locally.

### Merge Order
When multiple PRs touch the same files, they merge sequentially. After each merge, other PRs touching those files rebase on new main and re-run checks.

### Visual Regression
Playwright captures viewport screenshots at each route's real device viewport plus a 1920x1080 desktop check. Uploaded as artifacts on every PR.

---

## Alert Tiers (HYG-12)
All `sendPush_()` calls must use a named constant from `PUSHOVER_PRIORITY` in AlertEngine.gs. No bare integers.

| Constant | Value | Behavior | Use for |
|----------|-------|----------|---------|
| `DEPLOY_OK` | -2 | Silent | Successful deploys (CI PR comments confirm) |
| `HYGIENE_REPORT_LOW` | -1 | Quiet delivery | Weekly stale sweeps, diagnostics |
| `CHORE_APPROVAL` | 0 | Normal sound | Chore/ask/approval notifications |
| `BACKLOG_STALE` | 0 | Normal sound | Backlog age warnings |
| `CLAUDE_MD_BLOAT` | 0 | Normal sound | CLAUDE.md growth trigger (HYG-04) |
| `TILLER_STALE` | 1 | Vibrate (high) | Tiller freshness breach |
| `CLOSE_OVERDUE` | 1 | Vibrate (high) | Month-close gate day 6–20 (escalates to 2 on day 21+) |
| `SECRET_EXPIRING` | 1 | Vibrate (high) | Secrets audit |
| `SYSTEM_ERROR` | 1 | Vibrate (high) | GAS ErrorLog new entries |
| `PROD_DOWN` | 2 | Emergency + ack | Production outage |
| `DEPLOY_FAIL` | 2 | Emergency + ack | Deploy pipeline blocked |
| `GATE_BREACH` | 2 | Emergency + ack | Hard gate violation |

---

## Notion IDs + Update Rules

| Page | ID |
|------|-----|
| Project Memory (PM) | `2c8cea3cd9e8818eaf53df73cb5c2eee` |
| Thread Handoff Archive | `322cea3cd9e881bb8afcd560fe772481` |
| Active Versions DB (data source) | `collection://158238c5-9a78-4fa5-9ef8-203f8e0e00a9` |
| Audio Clip Queue DB | `f4fee7eb444f45a5ad80e19e39ce1780` |
| Audio Clip Queue Data Source | `d1c3e770-177b-4fcb-b308-015809210845` |
| QA Test Plan | `32ccea3cd9e8818f9e30f317dea0fed7` |
| QA Framework (7 Gates + 2 Audits) | `336cea3cd9e881798061e9032cee48c3` |
| Education Platform | `331cea3cd9e8816aa07feec250328cf8` |
| Parking Lot — Code Queue + Idea Pad | `32ccea3cd9e881809257fd5e7973c6d7` |
| Claude Code Scheduled Tasks | `334cea3cd9e8812a95bdcea2786b50d6` |
| Integration Map DB | `33acea3cd9e881888295e3ab98be3fc4` |
| Trust Backlog DB | `338cea3cd9e8814a8cd6e1e04ecb4748` |

**Notion update rules:**
- `old_str`/`new_str` requires EXACT whitespace matching — fetch page first
- Table cell updates via MCP fail — flag for manual edit
- NEVER set icon and title together (double-emoji bug)
- Always append, never overwrite

---

## Audio Pipeline
- **Source of truth:** `phrases.json` (repo root)
- **Generation:** `node generate-audio.js` (local)
- **Voice IDs:** JJ/Nia = `A2YMjtICNQnO93UAZ8l6` | Buggsy/Marco = `RYPzpPBmugfktRI79EC9`
- **Models:** `eleven_v3` for speech, `eleven_flash_v2_5` for IPA phonemes

---

## GAS Triggers
Installed via `installAllOpsTriggersSafe()`. Health via `diagOpsTriggersSafe()`. Drift surfaced by `reconcileOpsTriggersSafe()` running daily. Spec lives in `OpsTriggers.js:OPS_TRIGGER_SPEC` — add a row there (+ create the handler) for any new recurring function.

---

## Scheduled Automations (claude.ai)

claude.ai web-app Automations are separate from GAS Triggers. They run in the web app, have **no local filesystem access**, and use only connector tools (GitHub / Notion / Drive). To prevent run-to-run drift, every Automation prompt is one line that fetches a versioned `SKILL.md` from the repo and executes it exactly.

- Canonical schema + the one-line prompt template: `ops/automations/AUTOMATION-TEMPLATE.md`
- Existing automations: `.claude/scheduled-tasks/<name>/SKILL.md` (10 active)
- One-line prompt format:
  ```
  Fetch https://raw.githubusercontent.com/blucsigma05/tbm-apps-script/main/.claude/scheduled-tasks/<name>/SKILL.md via the GitHub connector and execute it exactly. Do not improvise. If a step requires capability not available in this thread, send a Pushover SYSTEM_ERROR (1) and stop.
  ```

When adding a new Automation: write the SKILL.md per the template, then hand LT the one-line prompt to paste in claude.ai. Do not touch claude.ai prompts directly except via this swap.

Output of an Automation goes to one of four destinations: Alert (Pushover), Persistent finding (dedup'd Issue via `hygiene-filer.yml`), Digest (comment on pinned status Issue), or Archive (Notion page append). See template for the full tier table.

---

## Context Management

- **Step 0 cleanup:** Before any refactor on a file >300 LOC, do a cleanup-only pass first (dead functions, unused variables, stale comments, debug logs). Commit separately. Then start real work. This prevents context compaction from firing mid-task.
- **2,000-line read cap:** File reads truncate silently at ~2,000 lines. DataEngine.gs is ~4,000 lines. Always read in chunks using offset/limit. Never assume a single read captured the full file. See Large Files list below.
- **Grep truncation:** Tool results >50K chars are silently truncated. Suspiciously few results (e.g., 3 refs for a function used across 12 files) = re-run with narrower scope. State when truncation is suspected.

### Large Files (always chunk-read)
| File | ~Lines | Notes |
|------|--------|-------|
| DataEngine.gs | ~4,000 | Read in 1,500-line chunks. TAB_MAP is near top. |
| KidsHub.html | ~3,000+ | Single-file multi-surface (Buggsy board, JJ board, Parent Dashboard) |
| ThePulse.html | ~2,500+ | Full financial dashboard |
| TheVein.html | ~2,500+ | LT command center |
| Code.gs | ~1,500+ | Router + all Safe wrappers. Grows with every new route. |
