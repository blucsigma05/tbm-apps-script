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
| `/buggsy` | KidsHub (Buggsy board) | A9 Tablet | 800x1340 | Buggsy |
| `/jj` | KidsHub (JJ board) | A7 Tablet | 800x1340 | JJ |
| `/daily-missions` | Daily Missions (Buggsy) | Surface Pro 5 | 1368x912 | Buggsy |
| `/daily-adventures` | Daily Missions (JJ) | S10 FE | 1200x1920 | JJ |

### Education Surfaces
| Route | Surface | Device | Viewport | Who Sees It |
|-------|---------|--------|----------|-------------|
| `/sparkle` | SparkleLearning | S10 FE | 1200x1920 | JJ |
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

## Device Viewport Matrix

QA at the wrong viewport gives false negatives — a surface that looks fine on desktop Chrome can break on Fire Stick. Each surface has ONE canonical viewport that matches its real device. Always test there first; then sanity-check at desktop.

### Canonical viewports by route (source: `CLAUDE.md § Device Viewport Map` — verify against `cloudflare-worker.js` PATH_ROUTES on drift)

| Route | Viewport | Real device | Why this size |
|---|---|---|---|
| `/spine` | 980×551 | Office Fire Stick (48" Sony TV) | Fire TV WebView native render area at 1080p with system bar overhead |
| `/soul` | 980×551 | Kitchen Fire Stick (32" RCA TV) | Same Fire TV constraint as /spine |
| `/parent` | 412×915 | JT's Samsung S25 (portrait) | Phone-sized parent dashboard; PIN gate must fit in viewport |
| `/pulse` | 412×915 | JT's Samsung S25 (portrait) | Finance dashboard mobile; debt slider must remain reachable |
| `/vein` | 1920×1080 | LT desktop (24" external) | Full command center; multi-column layout requires width |
| `/buggsy` | 800×1340 | A9 Tablet (portrait) | Buggsy's chore tablet; touch targets sized for child fingers |
| `/jj` | 800×1340 | A7 Tablet (portrait) | JJ's chore tablet; same form factor as A9 |
| `/daily-missions` | 1368×912 | Buggsy's Surface Pro 5 | Homework device; landscape with keyboard option |
| `/daily-missions?child=jj` | 1200×1920 | JJ's S10 FE (portrait) | Pre-K tablet; large vertical for finger reach |
| `/sparkle` | 1200×1920 | JJ's S10 FE | Same as JJ daily-adventures |
| `/homework` | 1368×912 | Buggsy's Surface Pro 5 | Same as daily-missions |
| `/wolfkid`, `/reading`, `/writing`, `/facts`, `/investigation`, `/baseline`, `/comic-studio`, `/wolfdome` | 1368×912 | Buggsy's Surface Pro 5 | All Buggsy education surfaces share this viewport |
| `/sparkle-kingdom`, `/JJHome`, `/wolfkid-power-scan` | 1200×1920 | JJ S10 FE / Buggsy Surface Pro per kid | Per-kid hub matches the kid's primary device |
| `/progress` | 412×915 | JT's S25 (parent view) | Weekly digest readable at phone size |
| `/api`, `/api/verify-pin`, `/version`, `/webhook/github` | n/a | (system endpoints — no UI) | Validate via curl, not viewport |

### How to test at viewport

**1. Claude Preview (fastest, in-conversation)** — open `/preview` at the configured device emulation. `.claude/launch.json` ships `surface-pro-5` (1368×912) and `samsung-s10-fe` (1200×1920) presets. Other viewports require manual override.

**2. Playwright (automated, repeatable)** — `playwright.config.js` has device profiles per the matrix above. Run `npx playwright test --grep <surface>` and inspect the screenshot artifact.

**3. Chrome DevTools (manual fallback)** — F12 → Toggle device toolbar → enter exact viewport from the table. **Note:** Chrome at viewport size is NOT a Fire Stick PASS — it only proves layout. Fire Stick adds the WebView quirks (no `backdrop-filter`, ES5-only runtime, slower JS engine). For `/spine` and `/soul`, manual on-device verification is required for any visual change.

### Viewport drift check

```bash
# Verify CLAUDE.md Device Viewport Map matches what's currently deployed
diff <(grep -E "^\| /[a-z-]+ \|" CLAUDE.md | sort) <(grep -oE "'/[a-z-]+'" cloudflare-worker.js | sort -u)
```

If routes appear in cloudflare-worker.js without a viewport entry in CLAUDE.md, file as a follow-up Issue (route exists but QA viewport unclear).

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
