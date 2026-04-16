# TBM Theme Palettes — MVSS v1 Canonical Registry
<!-- sourced from HTML files listed per palette — these are the canonical hex values -->
<!-- MVSS v1 precondition PRE-3 asserts surface CSS hex values match this registry -->
<!-- update this file in any PR that changes brand color values in HTML surfaces -->

## How to use this registry

When running a Play gate, precondition PRE-3 checks that the primary background and key brand
hex values in the surface CSS match the declared palette below. If they do not match, the run
aborts with `preconditions_not_met`.

Verification method: extract hex values from the surface's CSS body/background rule and at least
one accent color; compare against the corresponding palette rows below.

---

## Sparkle Kingdom — JJ palette

Used by: JJHome.html (`/sparkle-kingdom`), SparkleLearning.html (`/sparkle`, `/sparkle-free`),
daily-adventures (JJ alias of daily-missions.html at `/daily-adventures`)

Sources:
- `JJHome.html:14` — `.sparkle-body { background: #1a0533; }`
- `JJHome.html:82` — body color: `#F0E6FF`
- `JJHome.html:93` — gradient: `linear-gradient(135deg, #1a0533 0%, #2d0a5e 40%, #4a0e8f 70%, #1a0533 100%)`
- `SparkleLearning.html:29` — background: `linear-gradient(170deg, #1f0e35 0%, #2d1452 50%, #1f0e35 100%)`
- `SparkleLearning.html:43` — primary button: `linear-gradient(135deg, #a855f7, #ec4899)`
- `SparkleLearning.html:58` — progress bar: `linear-gradient(90deg, #ec4899, #a855f7, #fde68a)`
- `JJHome.html:480` — brand title: `#ff80ff`
- `JJHome.html:483` — subtitle: `#c080ff`

| Role | Hex | Surface reference |
|---|---|---|
| Background base (dark purple) | `#1a0533` | JJHome.html:14, 350, 353 |
| Background gradient mid (deep violet) | `#2d0a5e` | JJHome.html:93 |
| Background gradient peak (bright violet) | `#4a0e8f` | JJHome.html:93 |
| SparkleLearning background base | `#1f0e35` | SparkleLearning.html:29 |
| SparkleLearning background mid | `#2d1452` | SparkleLearning.html:29 |
| Text primary (soft lavender white) | `#F0E6FF` | JJHome.html:82, 160 |
| Text secondary (warm yellow) | `#fde68a` | SparkleLearning.html:31, JJHome.html:497 |
| Accent gold / star | `#FFD700` | JJHome.html:182 |
| Brand pink (logo, title) | `#ff80ff` | JJHome.html:480 |
| Brand purple (subtitle) | `#c080ff` | JJHome.html:483 |
| Button gradient from (vivid purple) | `#a855f7` | SparkleLearning.html:43, 90 |
| Button gradient to (hot pink) | `#ec4899` | SparkleLearning.html:43, 86 |
| Positive / correct (emerald green) | `#10b981` | SparkleLearning.html:99, 131 |
| Shooting star / sparkle burst | `#ff66cc` | JJHome.html:297, 384 |
| Orbit ring alternate (yellow) | `#ffdd44` | JJHome.html:297, 374 |
| Orbit ring alternate (cyan) | `#44ddff` | JJHome.html:297, 397 |

---

## Wolfdome — Buggsy palette

Used by: DesignDashboard.html (`/wolfdome`, `/dashboard`), daily-missions.html (`/daily-missions`),
KidsHub.html when rendering Buggsy (`/buggsy` — ChoreBoard), and all other Buggsy education
surfaces that adopt the Wolfdome dark theme.

Sources:
- `DesignDashboard.html:62` — body: `#020508`
- `DesignDashboard.html:63` — body color: `#E2E8F0`
- `DesignDashboard.html:66` — placeholder: `#64748B`
- `DesignDashboard.html:75` — secondary bg: `#030a10`
- `DesignDashboard.html:115` — stat value: `#FFD700`
- `DesignDashboard.html:135` — label: `#60A5FA`
- `DesignDashboard.html:228` — link: `#1e78ff`
- `DesignDashboard.html:273-274` — card bg: `#0B0F1A`, border: `#1E2A4A`
- `DesignDashboard.html:291-292` — card inner: `#131829`, border: `#1E2A4A`
- `KidsHub.html:837` — `.wolfdome-body { background: #020508; }`

| Role | Hex | Surface reference |
|---|---|---|
| Background base (near-black) | `#020508` | DesignDashboard.html:62, KidsHub.html:837 |
| Background secondary (slightly lighter) | `#030a10` | DesignDashboard.html:75 |
| Card background | `#0B0F1A` | DesignDashboard.html:273 |
| Card inner background | `#131829` | DesignDashboard.html:291 |
| Card border | `#1E2A4A` | DesignDashboard.html:274, 292 |
| Text primary (soft white) | `#E2E8F0` | DesignDashboard.html:63, 161, 188 |
| Text muted (slate gray) | `#64748B` | DesignDashboard.html:66, 217 |
| Text faint (dark slate) | `#475569` | DesignDashboard.html:251 |
| Accent gold (stats, values) | `#FFD700` | DesignDashboard.html:115, 213 |
| Accent sky blue (labels, headings) | `#60A5FA` | DesignDashboard.html:135, 165, 284 |
| Accent electric blue (links, active) | `#1e78ff` | DesignDashboard.html:228 |

---

## Notes

- **Source authority**: The HTML files listed in each `Surface reference` cell are the source of
  truth. If a surface diverges from these values, either the surface is wrong (update it) or the
  palette registry is outdated (update this file). Palette registry drift is closed repo-first.
- **KidsHub ChoreBoard note**: `/buggsy` (A9 Tablet ChoreBoard) uses Wolfdome palette CSS via
  `.wolfdome-body` class. This is intentional — ChoreBoard is thematically Wolfdome.
- **Education surfaces**: Buggsy curriculum surfaces (HomeworkModule, reading-module, etc.) may
  not all implement the full Wolfdome palette yet. PRE-3 check is against primary background and
  one key accent color — not all palette tokens simultaneously.
- **JJ vs SparkleLearning variants**: JJHome uses `#1a0533` base; SparkleLearning uses `#1f0e35`
  base. Both are within the Sparkle Kingdom family. PRE-3 accepts either for the `/sparkle` route.
