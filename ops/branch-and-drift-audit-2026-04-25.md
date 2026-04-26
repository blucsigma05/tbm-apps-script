# Branch + Status:Approved Drift Audit — 2026-04-25

**Backlog items 70 + 71 (P4 phantom/branch/drift cleanup band).**

| Item | Done-when | Result |
|---|---|---|
| 70 | "Stale branches list confirmed by LT; branches deleted" — `>30 days no open PR` | **Zero stale branches** at the 30-day threshold |
| 71 | "Drift Issues have `needs:implementation` label added" — open Issues with `status:approved` and no linked PR | **Zero drift Issues** at HEAD |

Both close at the threshold. Borderline observations follow the formal results.

---

## Item 70 — Stale Branches

### Method

```python
GET /api/v1/repos/blucsigma05/tbm-apps-script/branches?limit=50&page=N
GET /api/v1/repos/blucsigma05/tbm-apps-script/pulls?state=open&limit=50

stale = (now - branch.commit.timestamp).days >= 30
       AND branch.name NOT IN open_pr_heads
       AND branch.name NOT IN ('main','master')
```

### Result at HEAD `b878a02` (2026-04-25)

| Bucket | Count |
|---|---|
| Total branches | **188** |
| Open PRs | **4** (heads: `chore/backlog-scrub-2026-04-25-items-23-45`, `docs/72-pattern-registry-verify`, `docs/73-81-cf-routes-and-ops-pointer`, `docs/69-phantom-routes-audit`) |
| **Stale (≥30d, no open PR)** | **0** |
| Borderline (14–29d, no open PR) | 8 |
| 7–13d, no open PR | 101 |
| 3–6d, no open PR | 27 |
| 0–2d, no open PR | 52 |

**Item 70 closes Done at the 30-day threshold.** Zero branches qualify; nothing to delete this audit cycle.

### Observation (not a finding — surfaced for next audit window)

The 7–13d bucket contains **101 branches** — far above any healthy steady state. This is post-PORT-wave residue from the GitHub-archive era (2026-04-19 migration); each PORT-wave batch left a feature branch behind. They will hit the 30-day threshold on or around **2026-05-12**.

If LT wants pre-emptive cleanup, the next stale audit (run any time after 2026-05-12) will return ~100+ stale branches simultaneously. Two options:

1. **Wait** — let the threshold do its work; one audit reaps them all in May.
2. **Pre-emptive prune** — file a separate cleanup Issue scoped to PORT-wave branches now, expand the scope of stale to cover them as a one-time event. This is its own work item and not in scope for item 70.

Borderline list (14–29d, no open PR) for situational awareness — these are the *next* batch to age out:

| days | sha | branch |
|---|---|---|
| 14 | `af0868f1` | `claude/naughty-murdock` |
| 14 | `03a8b2c6` | `fix/audio-folder-skill-enforcement` |
| 14 | `e370e083` | `claude/adhd-compliance-fixes-6RtTd` |
| 14 | `577b2a60` | `fix/audio-wiring-skill-enforcement` |
| 14 | `577b2a60` | `spec/storyfactory-phased-pipeline` |
| 14 | `6c407936` | `infra/education-cache-precommit-hook` |
| 14 | `2cac5e2a` | `claude/upbeat-kare` |
| 14 | `569221af` | `full-stack-ownership-upgrade` |

---

## Item 71 — Status:Approved Drift

### Method

```
GET /api/v1/repos/blucsigma05/tbm-apps-script/issues?state=open

Per CLAUDE.md project rule: open Issues with kind:spec move to status:approved
once the spec PR merges; an implementation Issue then opens linking the spec.
"Drift" = Issue at status:approved with no linked PR opened.

Note: per memory feedback_gitea_label_filter_quirk.md, ?labels=X returns ALL
issues when X doesn't exist, so client-side label filtering is mandatory.
```

### Result at HEAD `b878a02` (2026-04-25)

| Status | Count |
|---|---|
| Total open Issues | **5** (#157, #158, #159, #160, #171) |
| Issues with any labels | **0** (none of the 5 carry labels yet — Gitea int64 quirk meant labels weren't attached at creation) |
| Issues with `status:approved` label | **0** |
| Issues with `status:approved` + no linked PR | **0** |

**Item 71 closes Done.** No drift to flag with `needs:implementation`.

### Observation (not a finding)

The current Issue queue is small (5) and was filed today as part of PR #155's follow-up commitment (#157, #158, #159, #160) plus item 19's draft (#171). None are at the spec-approved-awaiting-implementation stage. As the queue ages and spec PRs land, item 71 should be re-run; this is naturally captured by the canonical specs-are-Issues workflow (memory `feedback_specs_are_issues.md`).

The label-attachment gap is its own work item — none of the 5 Issues currently carry `kind:`, `area:`, `severity:`, `model:` labels. This is item **75/76/77** territory (P5 label triage), not item 71. Recommend folding into a future P5 sweep that also handles the Gitea int64 label-ID lookup mechanic.

---

## Conclusion

| Item | Result | Closes |
|---|---|---|
| 70 | 0 stale branches at 30-day threshold | ✅ Done |
| 71 | 0 status:approved drift Issues | ✅ Done |

**Two follow-up surfaces noted (not filed as Issues):**
1. **PORT-wave branch residue** — ~100 branches will hit 30-day threshold around 2026-05-12. Decide pre-emptive vs reactive in the next sprint.
2. **Issue label coverage gap** — the 5 open Issues lack labels; needed before item 71's contract can run meaningfully on real drift. Belongs in P5 label-triage sweep (items 75-77).

Method is reproducible — both audits use Gitea API queries, no special tooling. Re-run with the script in this file's "Method" sections.
