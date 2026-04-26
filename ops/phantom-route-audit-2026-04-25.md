# Phantom Route Audit — 2026-04-25

**Backlog item 69 (P4 truth-critical).** Done-when: "Mismatch list confirmed; phantoms filed as Issues or explained."

**Result: zero phantoms.** Every PATH_ROUTES + QA_ROUTES + servePage() page target resolves to a backing HTML file in the repo. The standing route-integrity check in `audit-source.sh` Check 2 confirms this on every pre-push run.

---

## Method

A "phantom route" is any entry in the routing chain that doesn't fully resolve to a backing HTML file. The chain has 3 layers:

```
cloudflare-worker.js              Code.js                  repo
PATH_ROUTES / QA_ROUTES   →   servePage() routes   →   <File>.html
   (path → page)              (page → file name)        (must exist)
```

A route is phantom if:
- `(A)` PATH_ROUTES has a `page=X` but servePage() has no entry for `X`, OR
- `(B)` servePage() entry resolves to `file: 'Y'` but `Y.html` is not in the repo.

`audit-source.sh:295-301` covers (B) on every pre-push run as a hard gate.
`audit-source.sh:280-285,288-293` covers (A) and the htmlSource handler check.

This audit runs the same checks explicitly + enumerates the result so item 69 can close with evidence.

## Evidence — PATH_ROUTES (cloudflare-worker.js)

27 entries verified at `cloudflare-worker.js:13-42` on `gitea/main` HEAD `b878a02`.

| CF path | page= target | servePage() file | HTML file | Status |
|---|---|---|---|---|
| `/buggsy` | `kidshub` | `KidsHub` | `KidsHub.html` | ✅ |
| `/jj` | `kidshub` | `KidsHub` | `KidsHub.html` | ✅ |
| `/parent` | `kidshub` | `KidsHub` | `KidsHub.html` | ✅ |
| `/pulse` | `pulse` | `ThePulse` | `ThePulse.html` | ✅ |
| `/vein` | `vein` | `TheVein` | `TheVein.html` | ✅ |
| `/spine` | `spine` | `TheSpine` | `TheSpine.html` | ✅ |
| `/soul` | `soul` | `TheSoul` | `TheSoul.html` | ✅ |
| `/vault` | `vault` | `Vault` | `Vault.html` | ✅ |
| `/homework` | `homework` | `HomeworkModule` | `HomeworkModule.html` | ✅ |
| `/sparkle` | `sparkle` | `SparkleLearning` | `SparkleLearning.html` | ✅ |
| `/sparkle-free` | `sparkle` | `SparkleLearning` | `SparkleLearning.html` | ✅ |
| `/wolfkid` | `wolfkid` | `WolfkidCER` | `WolfkidCER.html` | ✅ |
| `/wolfdome` | `wolfdome` | `DesignDashboard` | `DesignDashboard.html` | ✅ |
| `/dashboard` | `wolfdome` | `DesignDashboard` | `DesignDashboard.html` | ✅ |
| `/sparkle-kingdom` | `sparkle-kingdom` | `JJHome` | `JJHome.html` | ✅ |
| `/facts` | `facts` | `fact-sprint` | `fact-sprint.html` | ✅ |
| `/reading` | `reading` | `reading-module` | `reading-module.html` | ✅ |
| `/writing` | `writing` | `writing-module` | `writing-module.html` | ✅ |
| `/story-library` | `story-library` | `StoryLibrary` | `StoryLibrary.html` | ✅ |
| `/comic-studio` | `comic-studio` | `ComicStudio` | `ComicStudio.html` | ✅ |
| `/progress` | `progress` | `ProgressReport` | `ProgressReport.html` | ✅ |
| `/story` | `story` | `StoryReader` | `StoryReader.html` | ✅ |
| `/investigation` | `investigation` | `investigation-module` | `investigation-module.html` | ✅ |
| `/daily-missions` | `daily-missions` | `daily-missions` | `daily-missions.html` | ✅ |
| `/daily-adventures` | `daily-missions` | `daily-missions` | `daily-missions.html` | ✅ |
| `/baseline` | `baseline` | `BaselineDiagnostic` | `BaselineDiagnostic.html` | ✅ |
| `/power-scan` | `power-scan` | `wolfkid-power-scan` | `wolfkid-power-scan.html` | ✅ |

**27 / 27 PATH_ROUTES routes resolve to backing HTML files.**

## Evidence — QA_ROUTES (cloudflare-worker.js)

26 entries at `cloudflare-worker.js:46-73`. QA_ROUTES mirrors PATH_ROUTES minus finance surfaces, plus `/qa/operator`. Every page target appears in PATH_ROUTES already (verified above) except `/qa/operator → page=qa-operator`.

| QA path | page= target | servePage() file | HTML file | Status |
|---|---|---|---|---|
| `/qa/operator` | `qa-operator` | `QAOperator` | `QAOperator.html` | ✅ |
| (25 others) | — | — | — | ✅ — same pages as PATH_ROUTES, already verified above |

**26 / 26 QA_ROUTES routes resolve to backing HTML files.**

`/qa/pulse` and `/qa/vein` are intentionally listed in `QA_DENIED` (`cloudflare-worker.js:75`) — they return 403, not a phantom. Finance surfaces have no QA snapshot; this is policy, not drift.

## Evidence — servePage() GAS-only routes

The `servePage()` handler in `Code.js` has additional `page=` entries not exposed via Cloudflare. They're reachable via direct GAS URL `?page=X`:

| GAS-only page= | servePage() file | HTML file | Status | Notes |
|---|---|---|---|---|
| `codex-skills` | `CodexSkillsDashboard` | `CodexSkillsDashboard.html` | ✅ | Internal Codex skills dashboard |
| `debt`, `jt`, `weekly` | `ThePulse` | `ThePulse.html` | ✅ | Aliases — same file as `/pulse`, internal-only |

These are not "phantom" — they have backing files. They're just not surfaced through Cloudflare. Kept here for completeness so item 69 covers the full GAS routing space, not just the Cloudflare slice.

## Conclusion

| Layer | Total | Phantom | Status |
|---|---|---|---|
| PATH_ROUTES | 27 | 0 | ✅ |
| QA_ROUTES | 26 | 0 (2 denied by policy, not phantom) | ✅ |
| servePage() GAS-only | 4 | 0 | ✅ |
| **Total** | **57 routing entries** | **0** | **✅** |

**Item 69 closes with this evidence.** No Issues filed (no phantoms to file).

**Standing protection:** `audit-source.sh` Check 2 will fail any future PR that introduces a phantom route. Item 69's verification is preserved as a hard gate, not a one-time audit.

## Method reproduction

```bash
# (1) PATH_ROUTES enumeration
sed -n '/const PATH_ROUTES = {/,/^};/p' cloudflare-worker.js | grep -E "^\s+'/" | wc -l
# expect: 27

# (2) Per-page → file mapping → backing HTML
for page in $(grep -oE "page: '[a-z-]+'" cloudflare-worker.js | sed -E "s/page: '//;s/'//" | sort -u); do
  FILE=$(awk "/'${page}' *: *\\{/{flag=1} flag && /file: '/{print; flag=0}" Code.js | grep -oE "file: '[^']+'" | sed -E "s/file: '//;s/'//")
  if [ -z "$FILE" ]; then echo "  MISS: page=${page} (no servePage entry)"
  elif [ -f "${FILE}.html" ]; then echo "  OK:   page=${page} → ${FILE}.html"
  else echo "  PHANTOM: page=${page} → ${FILE}.html (file missing)"
  fi
done
# expect: all OK lines, no MISS or PHANTOM
```

Re-run anytime via the snippet above. The pre-push gate (`audit-source.sh`) runs the same logic with hard-fail behavior.
