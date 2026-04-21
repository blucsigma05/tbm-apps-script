# Verify-Before-Assert Template v1

TBM's cardinal rule: **"I had the data, I just didn't look."** Every bad decision has traced back to someone asserting a fact without opening the file / running the function / checking the version. This template makes the "look" step explicit and visible so reviewers can reject unverified claims.

Tracked as Gitea Issue **#49** (stabilization backlog item 25). Adoption verified over the next 3 PRs per item 27.

---

## The template

Copy this block into PR descriptions, commit messages, Issue comments — **anywhere a claim is recorded about current state** (source code, deployed state, runtime behavior).

```markdown
**Claim:** <one-sentence factual statement>

**Source evidence (grep):**
```
$ <exact grep command>
<command output — or `0 matches` if none>
```

**Runtime evidence (Logger):**
- Function called: `<function name>`
- Triggered from: <GAS editor / deployed trigger / smoke test / `?action=X` hit>
- Output (relevant lines):
```
<Logger lines>
```

**Source verified:** `<file:line>` — <1-line confirmation quoting the key text>

**Claim status:** ✅ verified / ❌ refuted / ⚠️ inconclusive (+ reason)
```

---

## When to use

- ✅ Any claim a function exists / writes a specific field / returns a specific shape
- ✅ Any claim about deployed version state (DE v78, KH v37, etc.)
- ✅ Any claim about which trigger fires which function
- ✅ Any claim about a Script Property / env var / secret being set
- ❌ Subjective design judgments (code taste, UX opinion) — not about facts
- ❌ Forward-looking proposals — use for claims about **current** state

## When the claim cannot be verified

Mark it `[unverifiable — speculation]` and proceed. **Never** present unverified claims as if they were verified.

## How reviewers enforce

If a PR makes a claim about current state without the four sections, reject the claim and ask for the template. No claim merges without evidence.

---

## Worked example

**Bad (unverified):**
> khApproveTask writes Parent_Approved and Completed_Date to KH_History.

**Good (template-compliant):**

```markdown
**Claim:** `khApproveTask()` writes `Parent_Approved` and `Completed_Date` fields
to the `KH_History` sheet during the approval transaction.

**Source evidence (grep):**
```
$ grep -n "setValues\|Parent_Approved\|Completed_Date" Kidshub.js | head -20
1525:  row.setValues([[child, task, taskId, points, Parent_Approved, Completed_Date, ...]]);
1540:  // Verify the write landed
1541:  const reread = row.getValues()[0];
1545:  if (reread[COL_PARENT_APPROVED] !== Parent_Approved) { ... }
```

**Runtime evidence (Logger):**
- Function called: `khApproveTask`
- Triggered from: `?action=khApproveTaskSafe` on deployed /exec URL
- Output:
```
[khApproveTask] wrote row id=abc123 Parent_Approved=true
[khApproveTask] reread confirmed Parent_Approved=true
[khApproveTask] completed=false Completed_Date=unchanged  ← NOT VERIFIED
```

**Source verified:** `Kidshub.js:1525-1545` — confirms multi-field `setValues`
but single-field read-back.

**Claim status:** ⚠️ inconclusive — write happens, but read-back only covers
`Parent_Approved`. `Completed_Date` and other fields could silently diverge.
This is item 22 (Gitea #26) in the stabilization backlog.
```

Notice the conclusion changed once evidence was collected — the original "both fields verified" claim would have been wrong.

---

## Why this form

- **Four sections** so nothing is hand-wave-able: source, runtime, precise line cite, final status.
- **Grep command literal** so a reviewer can re-run it. Not "I searched the file" — show the command.
- **Logger output literal** so a reviewer can see runtime truth, not recalled summary.
- **Status line explicit** including `⚠️ inconclusive` as a real option — "I tried to verify but couldn't" is an honest finish, "I claim it because I feel confident" is not.
