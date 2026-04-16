# TBM Copy Patterns — MVSS v1 Token Registry
<!-- canonical microcopy patterns for all TBM education + chore surfaces -->
<!-- MVSS v1 criteria X3, X4, X5 reference this file -->
<!-- update this file when adding new copy patterns to surfaces — do not invent one-off copy -->

## How to use this registry

Play gate criteria X3, X4, and X5 grep for copy against these token sets. If a surface uses
copy outside the allowed tokens, it is flagged as a cross-surface inconsistency (minor finding).
Adding new patterns: update this file in the same PR that introduces the copy.

---

## Save-state indicators (X3)

These are the ONLY allowed tokens for expressing save/unsaved state in any TBM surface.

| Token | Usage |
|---|---|
| `Saved` | Action completed and persisted. Show immediately after a successful write. |
| `Saving…` | Write in progress. Show while the async operation is pending. |
| `Unsaved changes` | Draft or in-progress state that has not been persisted. Show on navigate-away or on error. |

**Forbidden variants**: `Autosaved`, `Changes saved`, `Saving...` (ellipsis must be `…` U+2026,
not three dots `...`), `Not saved`, `Failed to save` (use error pattern instead).

---

## Success copy patterns (X4)

Success messages must match one of these approved patterns. Customize only the `[item]`
placeholder — never the framing or punctuation.

| Pattern | Example | When to use |
|---|---|---|
| `[item] complete!` | `Homework complete!` | Task or lesson fully done |
| `[item] submitted!` | `Answer submitted!` | Answer or work submitted to backend |
| `Great job!` | `Great job!` | Generic positive feedback (JJ surfaces) |
| `[item] saved` | `Comic saved` | Item persisted (no exclamation — it is a status, not celebration) |
| `[item] earned!` | `5 rings earned!` | Reward granted |
| `Mission complete!` | `Mission complete!` | Buggsy mission finished |
| `All done!` | `All done!` | Session complete, no specific artifact |

**Forbidden variants**: `Yay!` (alone, without context), `Awesome!` (overused — use `Great job!`
for JJ surfaces instead), any copy exceeding 5 words for a status message.

---

## Error copy pattern (X5)

All error messages must follow this two-part pattern:

```
[what failed] + [user-actionable next step]
```

Both parts are required. A one-part error message ("An error occurred") fails X5.

| Component | Requirements |
|---|---|
| What failed | Name the action that failed, not the technical cause. `Couldn't save your comic` not `HTTP 500`. |
| Next step | Give the child (or parent) one specific action. `Try again` or `Come back in a bit` or `Ask a grown-up`. |

### Approved error templates

| Template | When to use |
|---|---|
| `Couldn't load [item]. Try again.` | Data load failure with a retry available |
| `Couldn't save [item]. Try again.` | Save failure with retry path |
| `[Item] isn't available right now. Try again in a bit.` | Backend unavailable, no immediate retry |
| `Something went wrong. Ask a grown-up for help.` | Unrecoverable error requiring adult intervention |
| `No [item] today — all done!` | Empty-state (not an error, but uses the error element) |

### Forbidden error patterns

- Native `alert()` or `confirm()` for primary errors (MVSS v1 criterion U14)
- Empty `withFailureHandler(function(){})` (criterion U14, PRE-2)
- Bare "Error" text with no context
- Technical error codes visible to the child
- Copy that blames the child ("Wrong!" "That didn't work" as a standalone statement)

---

## Escalation language for parent/LT surfaces

For ThePulse, TheVein, ProgressReport, and KidsHub Parent — not for child-facing surfaces.

| Severity | Pattern |
|---|---|
| Info | `[Item] updated.` |
| Warning | `[Item] needs attention: [specific issue].` |
| Error | `[Action] failed. Check [specific location] and try again.` |
| Critical | `[System] is down. [Next action] immediately.` |

---

## Voice and tone notes

- **JJ surfaces**: warm, encouraging, age-appropriate for pre-K to early K. Short sentences.
  Exclamation points are fine for celebrations; never for errors or warnings.
- **Buggsy surfaces**: clear, direct, matter-of-fact. No condescension. Brief.
  Slightly more complexity is fine (grades 3-5 level).
- **Parent/LT surfaces**: professional but not clinical. Direct. One sentence per message.
- **Never**: copy that sounds like a chatbot apologizing ("I'm sorry, but..."), or copy that
  implies the child did something wrong when a backend error occurred.
