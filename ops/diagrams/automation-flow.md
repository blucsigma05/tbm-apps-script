# TBM Automation Flow — High-Level Process Map

> How work gets into the repo, how it gets built, how you get alerted.
> Dashed nodes = not built yet. See Gap Register below for issue links.

```mermaid
flowchart TD
    %% ============ SOURCES ============
    LT([LT creates Issue])
    CX_REV[Codex PR review<br/>finds blocker/critical]
    CX_CMT[Human or Codex<br/>posts 'Codex finding:' comment]
    HYG[Hygiene check<br/>detects drift]

    %% ============ ROUTERS ============
    subgraph GHA["GitHub Actions — Routers"]
        FILER[codex-pr-review.yml<br/>inline filer step]
        LIST[codex-finding-listener.yml<br/>+ parse_finding_comment.py]
        HYGFILE[hygiene-filer.yml<br/>+ file_hygiene_issue.py]
    end

    %% ============ WATCHERS ============
    subgraph CDX["Codex-side cron — Watchers"]
        WATCH[TBM Repo Watch<br/>4x/day 7a/12p/5p/10p CT]
        BATON[TBM Baton Watch<br/>PAUSED]
    end

    %% ============ WORK QUEUE ============
    subgraph STATE["GitHub Work State"]
        INBOX[(claude:inbox<br/>priority queue)]
        BACKLOG[(needs:implementation<br/>+ model:sonnet / model:opus)]
        DECIDE[(needs:lt-decision<br/>blocked on LT)]
        PR([Open PR])
        MAIN[(main branch)]
    end

    %% ============ BUILD LAYER ============
    subgraph BUILD["Build — Claude Code sessions"]
        SONNET[Sonnet thread<br/>worktree isolated]
        OPUS[Opus thread<br/>worktree isolated]
        GRINDER[Grinder #454<br/>nightly 11pm CT]
    end

    %% ============ ALERTING ============
    PUSH[Pushover<br/>priority-tiered]
    SOUND[Sound-differentiated<br/>per category]
    LT_EYE([LT reviews + merges])

    %% ============ FLOW EDGES ============
    LT --> BACKLOG
    CX_REV --> FILER --> INBOX
    CX_CMT --> LIST --> INBOX
    HYG --> HYGFILE --> BACKLOG
    INBOX --> BACKLOG

    WATCH --> PUSH
    BATON -.paused.-> PUSH

    BACKLOG --> SONNET
    BACKLOG --> OPUS
    BACKLOG -.when built.-> GRINDER

    SONNET --> PR
    OPUS --> PR
    GRINDER -.when built.-> PR

    PR --> CX_REV
    PR --> LT_EYE
    LT_EYE -->|merge| MAIN
    MAIN --> PUSH
    PUSH --> SOUND
    SOUND -.pending #472.-> LT_EYE

    DECIDE --> LT_EYE
    LT_EYE -->|resolve| DECIDE

    %% ============ STYLING ============
    classDef gap stroke:#f66,stroke-width:2px,stroke-dasharray: 6 4,fill:#fff5f5
    classDef live stroke:#2a7,stroke-width:1.5px,fill:#f0fff4
    classDef human stroke:#888,stroke-width:1.5px,fill:#f8f8f8

    class GRINDER,SOUND,BATON gap
    class FILER,LIST,HYGFILE,WATCH,SONNET,OPUS,INBOX,BACKLOG,DECIDE,PR,MAIN,PUSH live
    class LT,LT_EYE,CX_CMT human
```

## Legend

| Style | Meaning |
|---|---|
| solid green | Live and working today |
| dashed red | Not built yet — see Gap Register |
| grey | Human action (LT) |

## Gap Register — unbuilt pieces

| Gap | Blocked on | Impact |
|---|---|---|
| **Grinder** — nightly Claude Code executor that drains `model:opus` + `needs:implementation` | [#454](https://github.com/blucsigma05/tbm-apps-script/issues/454) in flight | Work queue doesn't drain automatically; every build requires a manual session |
| **Sound differentiation** — one recognizable sound per alert category | [#472](https://github.com/blucsigma05/tbm-apps-script/issues/472) filed | Phone rings indistinguishably; LT must check banner to see what fired |
| **TBM Baton Watch** | Paused — re-enable when actively in a Codex baton thread | None; paused on purpose |

## What this map is for

- Before adding a new automation, check whether it duplicates a live node
- When a new gap is identified, file an Issue and re-render this diagram
- This is CP-3 in the control-plane system — update when flows change (work-doctrine rule 14 applies)

## Related diagrams

- [two-lane-model.md](two-lane-model.md) — house/contractor diagram for the builder vs. auditor lanes
- [../dependency-map.md](../dependency-map.md) — code-architecture blast-radius table (Mermaid upgrade pending in [#471](https://github.com/blucsigma05/tbm-apps-script/issues/471))
