# Comic Studio Character Stickers

**Issue:** #282
**Status:** Draft

---

## Summary

Add character sticker overlays to Comic Studio. First 4 characters are free (Buggsy's own creations). Future characters are earned through the rewards system.

---

## Characters

### Free (unlocked by default)

| Character | Description | Asset source |
|---|---|---|
| Wolfkid | Main Comic Studio hero | Existing — needs export as PNG sticker |
| Turbo (Mach Turbo Light) | Red hedgehog, Buggsy's original | Existing — needs export |
| Buggsy | Self-portrait/avatar | Existing — needs export |
| Hex (Turbo Hex) | Variant character | Existing — needs export |

### Earned (rewards required)

| Character | Unlock method | Cost/requirement |
|---|---|---|
| Crush | Ring purchase from rewards store | 100 rings (suggested) |
| (future) | Same pattern | TBD per character |

---

## Gating Design

### Unlock state storage

Add a `stickerUnlocks` field to KH_Children or a new KH_Stickers tab:

```
child | sticker_id | unlocked_at | source
buggsy | wolfkid | 2026-01-01 | default
buggsy | turbo | 2026-01-01 | default
buggsy | buggsy_avatar | 2026-01-01 | default
buggsy | hex | 2026-01-01 | default
buggsy | crush | 2026-04-15 | reward_purchase
```

Default stickers are pre-seeded. Earned stickers are written when purchased.

### Reward store integration

The existing `khRedeemReward()` flow handles ring spending. Add a new reward type:

```
Reward: "Unlock Crush sticker"
Cost: 100 rings
Type: sticker_unlock
Payload: { stickerId: 'crush' }
```

On redemption, write to the unlock table. Comic Studio checks unlocks on load.

### Server functions needed

```
getUnlockedStickers_(child) → ['wolfkid', 'turbo', 'buggsy_avatar', 'hex']
unlockSticker_(child, stickerId, source) → writes to unlock table
```

Plus Safe wrappers for both.

---

## UI Design

### Sticker palette

Add a "Stickers" section to the Draw tab toolbar (below brushes):

```
[Ink] [Marker] [Chalk] [Eraser] [Fill] [Clear] [Bubble]
─────────────────────────────────────────────────
STICKERS: [Wolfkid] [Turbo] [Buggsy] [Hex] [🔒 Crush]
```

- Unlocked stickers show character thumbnail
- Locked stickers show lock icon + ring cost
- Tapping a locked sticker shows: "Unlock Crush for 100 rings?" (if enough rings) or "Need 100 rings to unlock Crush"

### Placement behavior

Reuse the speech bubble drag system (already built):
1. Tap sticker in palette → places on active panel at center
2. Drag to reposition
3. No resize (fixed size per character — keeps scope tight)
4. Delete via X button (same as bubble delete)
5. Max 3 stickers per panel (prevent clutter)

### Sticker rendering

- PNG overlays with transparency, positioned absolutely within panel-slot
- Rendered ON TOP of canvas drawings but BELOW speech bubbles
- Layer order: canvas drawing → stickers → speech bubbles
- Saved in draft JSON alongside strokes and bubbles

---

## Scope Guard

- 5 characters max at launch (4 free + Crush)
- Fixed size only — no resize handles
- No rotation
- No custom sticker upload
- No accessories or outfit changes
- No sticker editor
- Max 3 per panel
- New earned characters follow Crush's pattern (reward store purchase)

---

## Implementation Plan

### Phase 1: Free stickers (no gating)
1. Create PNG assets for 4 characters (export from existing art)
2. Add sticker palette UI to toolbar
3. Implement placement/drag/delete (reuse bubble system)
4. Save sticker positions in draft JSON
5. Render stickers in preview + replay

### Phase 2: Reward gating
1. Add KH_Stickers tab (or field on KH_Children)
2. Server functions: getUnlockedStickers_, unlockSticker_
3. Add "Crush" to reward store with sticker_unlock type
4. Lock/unlock UI in sticker palette
5. Seed default unlocks for all children

---

## Deploy Manifest

```
grep -n "sticker" ComicStudio.html → expected: palette, placement, drag handlers
grep -n "stickerUnlocks\|KH_Stickers" Kidshub.js → expected: unlock functions
grep -n "sticker_unlock" Kidshub.js → expected: reward type handler
```

## Build Skills
- `game-design` — sticker visual standards, palette layout
- `adhd-accommodations` — reward loop, no overwhelm
- `thompson-engineer` — overlay system, draft persistence
- `grading-review-pipeline` — reward store integration
