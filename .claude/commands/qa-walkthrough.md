---
name: qa-walkthrough
description: >
  Systematic screen-by-screen QA testing protocol for ALL TBM surfaces. Use this skill when
  doing visual QA, testing a deploy, walking through screens, checking device viewports,
  verifying route integrity, or doing a full surface health check. Covers both education
  and non-education surfaces. Triggers on: QA walkthrough, screen test, visual QA, surface
  check, device test, viewport test, walk all screens, smoke test visual, deploy verify
  screens, full surface check, does it look right, test on device, test on tablet,
  test on phone, check all routes.
---

# QA Walkthrough Skill — TBM Platform
**Every surface. Every device. Every route.**

## Cardinal Rule
> A surface that works on desktop but breaks on the target device is not working.
> Always test at the ACTUAL device viewport, not just your screen size.

---

## Surface Inventory

### Core Surfaces
| Route | Surface | Device | Viewport | Who Sees It |
|-------|---------|--------|----------|-------------|
| `/pulse` | ThePulse | JT S25 phone | 412x915 | JT + LT |
| `/vein` | TheVein | LT Desktop | 1920x1080 | LT only |
| `/spine` | TheSpine | Office Fire Stick | 980x551 | Adults |
| `/soul` | TheSoul | Kitchen Fire Stick | 980x551 | Everyone |
| `/parent` | Parent Dashboard | JT S25 phone | 412x915 | JT + LT |

### Kid Surfaces
| Route | Surface | Device | Viewport | Who Sees It |
|-------|---------|--------|----------|-------------|
| `/buggsy` | KidsHub (Buggsy board) | A9 Tablet | 1340x800 | Buggsy |
| `/jj` | KidsHub (JJ board) | A7 Tablet | 1340x800 | JJ |
| `/daily-missions` | Daily Missions (Buggsy) | Surface Pro 5 | 1368x912 | Buggsy |
| `/daily-adventures` | Daily Missions (JJ) | S10 FE | 1920x1200 | JJ |

### Education Surfaces
| Route | Surface | Device | Viewport | Who Sees It |
|-------|---------|--------|----------|-------------|
| `/sparkle` | SparkleLearning | S10 FE | 1920x1200 | JJ |
| `/homework` | HomeworkModule | Surface Pro 5 | 1368x912 | Buggsy |
| `/reading` | Reading Module | Surface Pro 5 | 1368x912 | Buggsy |
| `/writing` | Writing Module | Surface Pro 5 | 1368x912 | Buggsy |
| `/facts` | Fact Sprint | Surface Pro 5 | 1368x912 | Buggsy |
| `/investigation` | Investigation | Surface Pro 5 | 1368x912 | Buggsy |
| `/wolfkid` | WolfkidCER | Surface Pro 5 | 1368x912 | Buggsy |
| `/baseline` | Baseline Diagnostic | Surface Pro 5 | 1368x912 | Both |

### Tools & Dashboards
| Route | Surface | Device | Viewport |
|-------|---------|--------|----------|
| `/progress` | Progress Report | JT S25 phone | 412x915 |
| `/comic-studio` | Comic Studio | Surface Pro 5 | 1368x912 |
| `/story-library` | Story Library | Any | Responsive |
| `/story` | Story Reader | Any | Responsive |
| `/vault` | Watch Vault | LT Desktop | 1920x1080 |
| `/dashboard` | Design Dashboard | LT Desktop | 1920x1080 |

---

## QA Methods (Choose Based on Context)

### Method 1: Claude Preview (Real-Time, In-Conversation)
**Best for**: Visual inspection, CSS/layout issues, click-through testing
**Limitations**: Requires push/deploy cycle between fixes (~2-3 min per iteration)
**Setup**: Use `preview_start` with a server configuration, or Playwright for deployed sites

Workflow:
1. Take screenshot at target viewport
2. Inspect elements for CSS properties
3. Click through interactive elements
4. Check console for errors
5. Fix code → clasp push → clasp deploy → re-screenshot

### Method 2: Playwright Scripts (Automated, Repeatable)
**Best for**: Regression testing, screenshot comparison, multi-surface sweeps
**Limitations**: Can't interact dynamically; tests pre-scripted paths

Workflow:
1. Write/run Playwright test at device viewport
2. Capture screenshots at each step
3. Review artifacts
4. Fix code → push → re-run

**Playwright UI mode** (`npx playwright test --ui`):
- Opens interactive browser with step-through debugging
- Time-travel: scrub through DOM snapshots at each test step
- DOM inspector: highlight and inspect any element at any point in time
- Network panel: see all requests and responses

### Method 3: Physical Device (Gold Standard)
**Best for**: Final verification, touch interaction, real-world conditions
**Limitations**: Slow, manual, hard to capture/share findings

Workflow:
1. Open route on actual device
2. Walk through all interactions
3. Note findings with screenshots/video
4. Report in QA format

---

## Full Surface Sweep Protocol

### Phase 1: Route Health (5 minutes)
```bash
# Verify all Cloudflare routes return 200
curl -s -o /dev/null -w "%{http_code}" https://thompsonfams.com/pulse
curl -s -o /dev/null -w "%{http_code}" https://thompsonfams.com/vein
curl -s -o /dev/null -w "%{http_code}" https://thompsonfams.com/buggsy
curl -s -o /dev/null -w "%{http_code}" https://thompsonfams.com/jj
# ... all routes from inventory above
```

### Phase 2: Visual Spot Check (15 minutes)
For each surface category, pick ONE representative:
- [ ] Finance surface (ThePulse) — data loads, no blank sections
- [ ] Ambient surface (TheSoul) — animations play, no console errors
- [ ] Kid board (Buggsy KidsHub) — chores load, avatar renders
- [ ] Education (SparkleLearning) — loading screen plays, game renders
- [ ] Parent tool (Parent Dashboard) — data loads, actions work

### Phase 3: Deep Dive (30+ minutes per surface)
Full walkthrough of the target surface. For each screen/state:

1. **Load state**: Does it load? How fast? Any flash of unstyled content?
2. **Visual**: Layout correct at device viewport? Text readable? Images render?
3. **Interaction**: Buttons work? Touch targets adequate? Feedback on tap?
4. **Data**: Real data displays? Correct values? Formatted properly?
5. **Audio** (education only): Plays? Correct voice? No switching?
6. **Save** (education only): Progress persists? Cross-session? Cross-day?
7. **Error state**: What happens if server call fails? Graceful degradation?
8. **Console**: Any JS errors? Warnings? Deprecation notices?

---

## Post-Deploy QA Checklist

After every deploy, minimum verification:

- [ ] `?action=runTests` returns `overall: PASS`
- [ ] Hit 3 representative routes — confirm 200 + content renders
- [ ] Check ErrorLog for new entries in last 5 minutes
- [ ] Check Pushover — no error alerts fired
- [ ] If education surfaces changed: run one full education QA gate

---

## QA Finding Severity Levels

| Level | Definition | Action |
|-------|-----------|--------|
| P1 | Blocks usage. Crash, blank screen, data loss, wrong child's data shown | Fix immediately. Do not ship. |
| P2 | Degraded experience. Visual glitch, missing animation, wrong theme, stale data | Fix before next deploy |
| P3 | Minor polish. Alignment off by pixels, non-critical text wrong, cosmetic | Track in backlog |
| P4 | Enhancement. "Would be nice if..." | Parking lot |

---

## Reporting Template

```markdown
## QA Run — [Surface] — [Date] [Time] CDT
**Tester**: Claude / LT / JT
**Method**: Preview / Playwright / Physical Device
**Environment**: Production / Sandbox
**Viewport**: [WxH]
**Deploy**: @[version]

### Route Check
- [route]: [HTTP status] [load time]

### Findings
| # | Severity | Screen | Finding | Expected | Actual |
|---|----------|--------|---------|----------|--------|
| 1 | P1 | ... | ... | ... | ... |

### Screenshots
[Attached or referenced]

### Recommendation
[Fix now / Fix next deploy / Backlog / Parking lot]
```
