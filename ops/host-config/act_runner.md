# `act_runner` on `tbm-primary` — Host Config Reference

**Purpose:** durable record of non-default host config on `tbm-primary` so the runner survives a host rebuild and future operators know what's different from a fresh install.

**Canonical forge:** Gitea at `git.thompsonfams.com/blucsigma05/tbm-apps-script`. This runner serves that forge.

## Current config (as of 2026-04-24)

| Setting | Value | Default | Reason |
|---|---|---|---|
| `runner.capacity` | **2** | 1 | Single-slot bottleneck blocked interactive PRs behind long Playwright runs. Gitea #98 / #111. |
| `runner.labels` | *(empty — falls back to `.runner` file)* | docker:// variants | This host is pure host-mode (no Docker). `.runner` registered labels: `ubuntu-latest:host`, `ubuntu-22.04:host`. |
| `runner.timeout` | `3h` | `3h` | Unchanged. |
| `cache.enabled` | `true` | `true` | Unchanged. |
| systemd `ExecStart` | `act_runner daemon -c /var/lib/act_runner/config.yaml` | `act_runner daemon` | `-c` flag added so the capacity override is loaded. |

## Files on host

```
/var/lib/act_runner/config.yaml        # runner config (NEW — writeable by act_runner user)
/var/lib/act_runner/.runner            # registration token + labels (auto-generated, don't edit)
/etc/systemd/system/act_runner.service # systemd unit (patched ExecStart)
```

Owner of `/var/lib/act_runner/`: `act_runner:act_runner` (uid 111, gid 113).

## Full `config.yaml` contents

```yaml
# Minimal config — only capacity differs from defaults.
# Labels intentionally omitted so act_runner falls back to .runner file (host-mode labels).
log:
  level: info
runner:
  file: .runner
  capacity: 2
  timeout: 3h
  fetch_timeout: 5s
  fetch_interval: 2s
cache:
  enabled: true
```

**Why not `generate-config`:** the stock template includes `docker://gitea/runner-images:*` labels. On this host-mode runner (no Docker installed) that label list causes the daemon to crash-loop with `Error: daemon Docker Engine socket not found and docker_host config was invalid`. Leaving labels empty forces fallback to the already-registered `.runner` labels, which are correct.

## Why `capacity: 2` and not `3`

`tbm-primary` is Hetzner CX33: **4 vCPU, 7.6 GiB RAM**. Gitea + Postgres share the box. Playwright + headless Chrome can chew 2-3 GB per concurrent job during heavy E2E runs. `capacity: 2` gives reliable throughput doubling without OOM risk; `capacity: 3` is survivable in steady state but risks thrash when two Playwright jobs coincide with a `ci.yml` run.

**Escalation path:** if queue depth consistently exceeds ~30 jobs during working hours, investigate (a) migrating long jobs to a second registered runner instead of bumping capacity further, or (b) upgrading VPS tier.

## How to change capacity

```bash
ssh tbm-primary
sudo -u act_runner sed -i 's/^  capacity: [0-9]*$/  capacity: N/' /var/lib/act_runner/config.yaml
sudo systemctl restart act_runner
# verify:
sudo journalctl -u act_runner --no-pager -n 10
```

Healthy restart log line:

```
level=info msg="runner: tbm-runner-1, with version: v0.2.11, with labels: [ubuntu-latest ubuntu-22.04], declare successfully"
```

## Emergency revert to default capacity=1

```bash
ssh tbm-primary
sudo sed -i 's|ExecStart=/usr/local/bin/act_runner daemon -c /var/lib/act_runner/config.yaml|ExecStart=/usr/local/bin/act_runner daemon|' /etc/systemd/system/act_runner.service
sudo systemctl daemon-reload
sudo systemctl restart act_runner
```

Config file can stay in place (unused without `-c` flag).

## Verification queries

Runner health:
```bash
sudo systemctl is-active act_runner   # expect: active
```

Parallelism check (Postgres):
```sql
SELECT COUNT(*) FROM action_task WHERE status = 6;
-- expect up to capacity concurrent, usually 1–2 during active work
```

Queue depth:
```sql
SELECT COUNT(*) FROM action_run_job WHERE task_id = 0 AND status = 5;
-- transient queue — drains continuously while runner is healthy
```

## Known adjacent debt

- **Stale `action_task` rows** — hundreds of `status=1` rows with ages up to several days from prior runner crashes. Tracked separately as Gitea #112. Does not affect scheduling today but clouds forensics.
- **Host provisioning is hand-rolled.** If `tbm-primary` is rebuilt from image, this file + the systemd patch + the config.yaml must be re-applied. No provisioning script exists yet. Worth a future Issue.

## History

- 2026-04-23 — `capacity` bumped from 1 → 2 during Gitea #98 debug session. Verified with 2 parallel tasks + queue drain rate roughly 2× prior. Mem used: ~1.3 GiB of 7.6 GiB at capacity-2 steady state.
- Future entries append above this line.
