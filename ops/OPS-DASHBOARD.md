# TBM Ops Dashboard v1

Date: April 3, 2026
System: Thompson Business Machine / Thompson Education Platform
Dashboard type: Operator dashboard
Owner: LT
Status model: `GREEN / WATCH / RED`

---

## How To Use This Dashboard

Answer in under 60 seconds:

1. Is TBM healthy enough to use today?
2. What is the biggest risk right now?
3. What changed recently?
4. What needs follow-up first?

---

## Overall Status

- System health: `GREEN`
- Reason: TBM is operational, used daily by the family, and no active outages or blockers. All surfaces load, kids complete tasks, parents manage dashboards. Remaining issues are backend contract consistency and documentation lag — not performance or availability. Specific surfaces with known contract/semantics issues are marked WATCH individually below.

### Current Confidence

- Core routes / surfaces: `Medium-High`
- Parent dashboard integrity: `Medium`
- Education save/award truthfulness: `Medium`
- Documentation truthfulness: `Medium-Low`
- Automation maturity: `Medium`

---

## Current Heads

- Repo: `blucsigma05/tbm-apps-script`
- Current `main`: `fadf8fd`
- Latest wave: PRs #37-#39 (Wolfdome/Sparkle Kingdom backgrounds, SparkleLearn v6, Nia auto-audio)

---

## Health Summary

| Area | Status | Confidence | Evidence | Notes |
|---|---|---|---|---|
| Core platform | GREEN | Medium | Route audits + recent commit review | Multi-surface system alive and evolving. Code.gs v67. |
| Kid boards | GREEN | Medium | Playwright screenshots + background review | Buggsy/JJ boards load; Wolfdome + Sparkle Kingdom backgrounds landed. |
| Parent dashboard | WATCH | Medium | E2E harness + earlier audit | Core UI present. Clear-task scoring mismatch still open. |
| Education platform | WATCH | Medium | Recent audits + build history | Fast-moving and usable. Save/fallback truthfulness needs standardization. |
| Ambient displays | WATCH | Medium | Screenshot suite | Soul/Spine screenshots fire too early for trustworthy visual gate. |
| Automation / testing | GREEN | High | Playwright + codex review + audit-source.sh wiring gate | All 145 call chains have withFailureHandler(). Automated gate added. |
| Docs / runtime alignment | WATCH | Medium-Low | Full-system audit + drift ledger | Better than before. CLAUDE.md route table 13 entries behind CF worker. |

---

## Surface Health Matrix

| Surface | Status | Last Known Evidence | Notes |
|---|---|---|---|
| `/pulse` | WATCH | Finance screenshot harness exists but requires PIN | Finance surfaces need PIN-enabled screenshot runs. |
| `/vein` | WATCH | Same as above | Visual maturity still lags ThePulse. |
| `/parent` | WATCH | Playwright safe E2E + screenshot | Core loads; some action semantics need deeper verification. |
| `/buggsy` | GREEN | Screenshot suite + route audit | Board route alive; Wolfdome background landed. |
| `/jj` | GREEN | Screenshot suite + recent Sparkle commits | Route healthy; Sparkle Kingdom background landed. |
| `/soul` | WATCH | Screenshot suite | Need smarter screenshot waits. |
| `/spine` | WATCH | Screenshot suite | Same issue as Soul. |
| `/daily-missions` | WATCH | Prior audit + route review | Critical operating surface; 5 missing failure handlers. |
| `/sparkle` | WATCH | PRs #38/#39 | v6 with Sparkle Kingdom bg + Nia auto-audio. Monitor load/dismiss. |
| `/sparkle-free` | GREEN | Playwright safe E2E | Free play route loads cleanly. |
| `/homework` | WATCH | Earlier audit | Higher-risk save/contract surface. 3 missing failure handlers. |
| `/reading` | WATCH | Earlier audit | Monitor fallback and render truthfulness. 3 missing handlers. |
| `/writing` | WATCH | Earlier audit | Historically high-risk for content wiring. 5 missing handlers. |
| `/facts` | WATCH | Earlier audit | 6 missing failure handlers — highest gap. |
| `/investigation` | WATCH | Earlier audit | 5 missing failure handlers. |

---

## Current Open Risks

### P0

1. ~~**Failure handler coverage gap**~~ — **RESOLVED.** Deep audit confirmed all 145 chains have handlers. Grep was overcounting. Automated gate added to audit-source.sh.

2. **Parent clear-task scoring mismatch** — Modal offers multiple point outcomes, server does not honor the choice.

3. **Education completion consistency** — Fallback/practice, logged completion, and awarded rewards still need a single contract.

### P1

4. **Documentation drift** — CLAUDE.md route table 13 entries behind. Notion/GitHub/runtime still diverge.

5. **Duplicate Sparkle Kingdom implementations** — KidsHub.html and SparkleLearning.html have independent 13-layer copies.

6. **Animated background performance** — 7-13 layer SVG backgrounds with 100+ elements on Galaxy A9 / Fire tablets. No perf guardrails.

7. **Ambient screenshot timing** — Soul/Spine screenshots fire too early.

---

## Recent Wins

- Playwright locally set up and producing real board PNGs
- Codex code review in workflow
- Sparkle lazy audio + predictive preload (v5)
- Nia auto-match audio covers all 55 speak() calls (v6)
- Wolfdome + Sparkle Kingdom board backgrounds fully themed
- SparkleLearn loading screen with dismissal on curriculum/fallback/free-play
- Zero secrets in source (verified April 3)
- Zero getActiveSpreadsheet() violations in active code (verified April 3)

---

## Automation Status

| Control | Status | Notes |
|---|---|---|
| Codex code review | GREEN | In use |
| Playwright safe E2E | GREEN | Running and useful |
| Playwright screenshot capture | GREEN | Producing PNGs |
| Finance screenshot capture | WATCH | Requires TBM_PIN |
| audit-source.sh | WATCH | Checks ES5/versions/eval, NOT failure handlers |
| Apps Script smoke/regression | WATCH | Present but uneven by module |
| End-to-end save-flow testing | WATCH | Partial |

---

## Action Queue

### Now
1. ~~Fix failure handler gap~~ — DONE. All files already compliant.
2. ~~Extend audit-source.sh with failure handler check~~ — DONE. Wiring gate added.
3. ~~Update CLAUDE.md route table to match CF worker~~ — DONE. 22 → 35 entries.
4. Re-verify parent clear-task scoring path

### Next
1. Standardize education completion semantics
2. Add route-level health endpoint
3. Improve Soul/Spine screenshot waiting logic
4. Performance test animated backgrounds on A9/Fire tablets

---

## Weekly Update Block

```text
Week ending:
Current head:
Overall system status:
Biggest risk:
Biggest win:
Most important test run:
Most important manual verification:
Docs updated?
Next lead fix:
```
