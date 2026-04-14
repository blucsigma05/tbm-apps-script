# Break-Glass Policy — GAS Hotfixes and Source-of-Truth Contract

## Source of Truth: GitHub is Canonical

GitHub is the sole source of truth for all TBM production code.
The Apps Script editor is read-only in normal operations.

### What `clasp push --force` does

Every merge to `main` triggers `deploy-and-notify.yml`, which runs:

```
clasp push --force
clasp deploy -i $GAS_DEPLOYMENT_ID
```

`clasp push --force` **overwrites the entire Apps Script project** with the
contents of the repo. Any change made directly in the Apps Script editor
since the last deploy will be silently erased on the next push.

This is expected and correct behavior. It enforces GitHub as the single
source of truth. The "force" flag is not a workaround — it is the
intentional contract.

### Verified behavior (F13, 2026-04-13)

A benign editor-only change on a non-prod GAS target was overwritten on
the next `clasp push --force`, confirming that editor edits do not survive
a GitHub deploy. Non-prod targets: use a separate GAS deployment ID (see
F09 when available) to test overwrite behavior without touching production.

---

## Break-Glass: Emergency Editor Hotfix

If production is down and a GitHub deploy cannot be completed in time,
an operator may apply an emergency fix directly in the Apps Script editor.

### Procedure

1. **Log it first.** Open the TBM Project Memory Notion page and record:
   - Timestamp (UTC)
   - What was changed and why
   - Who made the change
2. Make the minimum necessary change in the Apps Script editor.
3. **Immediately** create a GitHub commit that replicates the same change.
4. Merge to `main` as soon as CI passes. This redeploys the fix from
   GitHub and restores canonical state.
5. Update the Notion log with the merge commit SHA.

### What NOT to do

- Do not leave an editor fix in place without a corresponding GitHub commit.
  The next merge to `main` will overwrite it, reverting the hotfix silently.
- Do not use the editor for non-emergency changes. PRs are always faster
  when the pipeline is healthy.

---

## Non-Prod Verification Target

To test overwrite behavior without touching production:

1. Create a separate GAS deployment targeting a dev script.
2. Make an editor change on the dev script.
3. Run `clasp push --force` against the dev script ID.
4. Confirm the editor change is gone.

Document the dev target ID in `.clasp-dev.json` (not committed — add to
`.gitignore` if not already present) or in a Notion engineering note.
