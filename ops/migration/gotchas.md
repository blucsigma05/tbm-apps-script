# Gitea Migration — Operational Gotchas

Running log of surprising behaviors discovered during Phase C→D operation
on `tbm-primary` / `git.thompsonfams.com` / `tbm-runner-1`. Each entry:
symptom, root cause, fix, and how to prevent recurrence.

**Format:** `## G-NN — Title` with `### Symptom`, `### Root cause`,
`### Fix`, `### Prevention`, `### First seen` sections.

---

## G-01 — Narrow sudoers grant blocks Playwright's `--with-deps` install

### Symptom

`playwright-regression.yml` and any workflow calling `npx playwright install
--with-deps chromium` hangs indefinitely, then times out. Runner gets wedged
on a single task for 30–60 min, dispatching no new tasks. `journalctl -u
act_runner` shows repeated `pam_unix(sudo:auth): conversation failed` and
`pam_unix(sudo:auth): auth could not identify password for [act_runner]`.
The log's explicit command line reveals:

```
act_runner : command not allowed ;
COMMAND=/usr/bin/sh -c 'apt-get update && apt-get install -y …'
```

### Root cause

The Phase C handoff added a narrow sudoers grant:

```
# /etc/sudoers.d/act_runner
act_runner ALL=(ALL) NOPASSWD: /usr/bin/apt-get
```

Playwright's `install --with-deps` wraps apt in a shell: `sudo -- sh -c
"apt-get update && apt-get install …"`. The resulting sudo invocation is
`/usr/bin/sh …`, **not** `/usr/bin/apt-get …`. sudoers policy rejects it →
sudo falls back to password prompt → hangs (no TTY on runner, no password).

### Fix

**⚠️ Partial-fix attempt (does NOT work alone — keep reading):** pre-installing
the Chromium dep set system-wide seemed like the obvious patch — if every
package is already present, surely `--with-deps` would short-circuit the sudo
call. Testing this path empirically on 2026-04-20/21 proved otherwise:
`playwright install --with-deps chromium` invokes `sudo apt-get install`
unconditionally, regardless of whether every target package is already
installed. The apt step is a no-op at the package level but still requires
sudo, and still hits the sudoers wall.

**The actual fixes (pick one):**

**Option A — drop `--with-deps` from the Playwright workflow (cleanest).**
Pre-install the deps system-wide once (command below), then patch
`.gitea/workflows/playwright-regression.yml` to call
`playwright install chromium` (no `--with-deps`). The sudo step never
happens. Narrow sudoers grant stays intact.

```bash
# one-time, as a user with full sudo (lt), not act_runner:
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  libasound2t64 libatk-bridge2.0-0t64 libatk1.0-0t64 libatspi2.0-0t64 \
  libcairo2 libcups2t64 libdbus-1-3 libdrm2 libgbm1 libglib2.0-0t64 \
  libnspr4 libnss3 libpango-1.0-0 libx11-6 libxcb1 libxcomposite1 \
  libxdamage1 libxext6 libxfixes3 libxkbcommon0 libxrandr2 xvfb \
  fonts-noto-color-emoji fonts-unifont libfontconfig1 libfreetype6 \
  xfonts-cyrillic xfonts-scalable fonts-liberation fonts-ipafont-gothic \
  fonts-wqy-zenhei fonts-tlwg-loma-otf fonts-freefont-ttf
```

**Option B — widen the sudoers grant (quickest, slight posture regression).**
Replace `/etc/sudoers.d/act_runner` with:

```
act_runner ALL=(ALL) NOPASSWD: ALL
```

Private single-tenant runner, so the blast radius is narrow, but any
workflow can now run arbitrary root commands. Accept if the cost of
patching workflows every time Playwright or similar tools evolve
exceeds the cost of giving act_runner full sudo on this VPS.

**Option C — bake deps into an immutable VPS image.** Requires an imaging
pipeline we don't have today. Cleanest long-term if/when the runner fleet
grows past one host.

### Prevention

- Any new workflow that uses `--with-deps` or analogous auto-install flags
  is incompatible with a narrow sudoers posture. Either go to Option A/B/C
  before shipping the workflow, or gate the workflow behind a skip-deps
  env var (if the tool supports one).
- Add a post-install sentinel: a health check that runs the full
  `playwright install --with-deps chromium` exactly once at VPS bootstrap
  under the `lt` user, then any subsequent runner invocation is a no-op as
  long as browsers don't update. Catches regressions when Playwright bumps
  browser versions and tries to reinstall.
- If the runner fleet grows past one host, move to immutable images that
  ship with Playwright deps + browsers baked in.
- When triaging "runner wedged" symptoms: always check `journalctl -u
  act_runner | grep "command not allowed"` first. That single line pins
  the sudoers wall instantly.

### Prevention

- Any new workflow that uses `--with-deps` or analogous auto-install flags
  on the runner must assume a **read-only** system. Either pre-install its
  deps (this approach) or document the specific sudoers grant the workflow
  expects.
- If the runner fleet grows past one host, move to immutable images that
  ship with Playwright deps baked in.
- Add a startup health check to `act_runner` that runs `npx playwright
  install-deps --dry-run chromium` at boot and alerts if it returns
  non-zero — catches silent regressions when Playwright bumps deps.

### First seen

2026-04-20/21 while landing Phase D Q9 doc (PR #30). Wedged runner blocked
PR #30, #31, #32 all from running CI. Cleared by killing the stuck sudo
tree + pre-installing the dep set.

---

## G-02 — Rebase + force-push doesn't retrigger `pull_request: synchronize`

### Symptom

After `git push --force-with-lease` following a `git rebase gitea/main` on
a PR branch, Gitea Actions workflows do not fire for the new head sha. The
PR's commit-status endpoint returns empty. `actions/tasks` shows no runs
with the new sha. Runner is idle because nothing is queued.

The PR's timeline shows the push event recorded as:

```
pull_push | {"is_force_push": false, "commit_ids": [<old-sha>, …]}
```

`is_force_push: false` is wrong — the push replaced unreachable history.
But because Gitea trusts its own flag, `pull_request: synchronize` does
not fire for the new sha.

### Root cause

Gitea's push-event handler detects "force push" by comparing the old and
new commit hashes; when the old hash is still reachable via reflog but
the branch ref jumped to an unrelated ancestry (as happens on rebase onto
an advanced base), the heuristic misses and reports `is_force_push:
false`. Workflows triggered on `pull_request: synchronize` are gated
behind a force-push check and don't dispatch.

(Unconfirmed whether this is a known Gitea bug or a config-level quirk.
Symptom is reproducible; root-cause line stops at "Gitea set the flag
wrong, so downstream didn't fire.")

### Fix

After a rebase force-push on a PR, push an empty commit to force the
`synchronize` event:

```bash
git commit --allow-empty -m "chore: retrigger CI after rebase"
git push gitea <branch>
```

The subsequent regular push is detected as a normal `synchronize` and
workflows fire.

### Prevention

- **For `DOCS:` / `CHORE:` PRs that need rebasing**: prefer merging
  `gitea/main` into the PR branch over rebasing. Merge commits trigger
  `synchronize` reliably. The resulting history is uglier but avoids
  this failure mode entirely.
- **For PRs where clean history matters** (`feat:` / `fix:`): do the
  rebase, then always follow with an empty retrigger commit. Squash-merge
  the PR at the end to drop the empty commit from main's history.
- Add a post-rebase helper: once a rebase-then-push pattern is common,
  wrap it in a git alias that tacks on the empty commit automatically.

### First seen

2026-04-21 on PR #30 rebase onto gitea/main (which had advanced past #27
/ #28 / #29). Six pending checks from the original sha vanished after
force-push and new checks never registered on the rebased sha. Empty
commit `3997431` re-dispatched the full check set.

---

## Template for future entries

```
## G-NN — <short description>

### Symptom
<What LT / Claude / the runner saw that seemed broken.>

### Root cause
<The actual reason, one paragraph. Include specifics: file paths,
config keys, log-line quotes. If only a symptom fix was applied,
say so and mark root cause as 'not fully diagnosed'.>

### Fix
<Concrete steps that resolved the issue. Commands + paths.>

### Prevention
<How to avoid recurrence: hook, monitor, doc note, process change.
If no prevention possible, say so.>

### First seen
<Date + what context surfaced it. Helps correlate with commits/PRs.>
```
