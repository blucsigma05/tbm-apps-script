# TBM Two-Lane Model

Visual companion to `ops/WORKFLOW.md § Two-Lane Handoff Rules`. Rendered natively on GitHub — no external tooling.

## Diagram

```mermaid
flowchart TD
    LT([LT — plain English])

    %% Builder lane
    subgraph Builder["Builder lane — Claude / Opus / Sonnet"]
        direction TB
        B1[Issue<br/>work order]
        B2[Branch]
        B3[Commits]
        B4[PR<br/>inspection packet]
        B5{{Handoff comment<br/>OPTIONAL}}
        B1 --> B2 --> B3 --> B4
        B4 -. only if work changes hands<br/>or PR paused .-> B5
    end

    %% Audit lane
    subgraph Audit["Audit lane — Codex"]
        direction TB
        A1[Audit the named PR<br/>or named current state]
        A2[Inline PR review comments<br/>= evidence]
        A3[Findings]
        A1 --> A2 --> A3
    end

    %% Boardroom offshoot
    subgraph Boardroom["Boardroom — process + architecture"]
        direction TB
        M1[Conversation]
        M2[Operating memo<br/>ops/operating-memos/YYYY-MM-DD-topic.md]
        M3[Short rule mirrored into<br/>AGENTS.md + CLAUDE.md]
        M4[Nuance lives in<br/>ops/WORKFLOW.md]
        M1 --> M2 --> M3
        M2 --> M4
    end

    %% Flow
    LT -->|audit 443<br/>re-audit 443| B4
    B4 --> A1
    A3 -->|back to builder| B3
    B4 -->|CI green<br/>+ verdict: PASS| Merge[Merge to main]
    Merge --> Delete[Delete branch]
    LT -.->|make an operating memo<br/>promote this to policy| M1

    classDef builder fill:#e3f2fd,stroke:#1565c0,color:#0b1d2e;
    classDef audit fill:#fff3e0,stroke:#e65100,color:#2e1a0b;
    classDef board fill:#f3e5f5,stroke:#6a1b9a,color:#2a0b2e;
    class B1,B2,B3,B4,B5 builder;
    class A1,A2,A3 audit;
    class M1,M2,M3,M4 board;
```

## Legend (house + contractor model)

- **Repo** = the house. One shared address (`C:\Dev\tbm-apps-script`).
- **Branch** = a hallway in the house. You can walk into one without blocking anyone else.
- **Commit** = a progress photo of the hallway at one moment. Cheap, reversible, additive.
- **PR** = an inspection packet handed to the auditor. Has a defined scope — the named hallway, not the whole house.
- **Merge** = work accepted into the main house. Main is the canonical state everyone else walks into.
- **Handoff comment** = the sticky note on the inspection packet saying "I stopped here, you pick up next." Optional. Only used when the packet actually changes hands mid-flight.
- **Operating memo** = the boardroom minutes. Persists decisions that would otherwise live only in chat.

## Plain-English command contract

See `ops/WORKFLOW.md § Two-Lane Handoff Rules` for the full command table and trigger phrases. This diagram is navigation — the rules themselves live there.
