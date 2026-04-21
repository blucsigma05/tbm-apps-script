# Gitea Install Runbook — tbm-primary

**Purpose:** install a working Gitea + PostgreSQL + Caddy stack on the
Hetzner CX22 server provisioned in `hetzner-cx22-order-spec.md`.
**Status:** runbook (not yet executed).
**Last reviewed:** 2026-04-19.

This gets you to: `https://git.thompsonfams.com` serving Gitea over
HTTPS with admin access + a bot account ready for PAT generation.
**Does NOT cover:** Gitea Actions runner (separate runbook), bundle
import (separate runbook).

---

## Prerequisites

- [ ] Hetzner CX22 provisioned per `hetzner-cx22-order-spec.md`
- [ ] SSH works as `lt@<server-ip>` (non-root, sudo-capable)
- [ ] `git.thompsonfams.com` DNS record NOT yet created (we'll create
      it mid-install once Caddy is ready — having DNS live before that
      means a stale 404 for anyone who happens to hit it)

All commands below run as `lt` via `ssh lt@<ip>`. Use `sudo` explicitly
rather than `sudo -s` — easier to audit what ran with elevated privs.

---

## Step 1 — PostgreSQL

Gitea can run on SQLite for a single-user instance, but PostgreSQL is
the recommended choice for anything expected to survive for years. Set
it up even if it feels like overkill — migrating off SQLite later is
much more work than setting up Postgres now.

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Create a dedicated DB + user for Gitea
sudo -u postgres psql <<'SQL'
CREATE USER gitea WITH PASSWORD 'CHANGEME_STRONG_PASSWORD';
CREATE DATABASE gitea OWNER gitea;
GRANT ALL PRIVILEGES ON DATABASE gitea TO gitea;
\q
SQL
```

**Replace `CHANGEME_STRONG_PASSWORD`** with a 32-char random string.
Save it to 1Password — you'll paste it into Gitea's config file.

```bash
# Confirm the DB is reachable
sudo -u postgres psql -c "\l" | grep gitea
```

---

## Step 2 — Gitea binary

Gitea distributes prebuilt binaries per platform. No need to compile.

```bash
# Pick the latest release — check https://dl.gitea.com/gitea/ for current
GITEA_VERSION="1.24.6"

# Download + install
wget -O /tmp/gitea "https://dl.gitea.com/gitea/${GITEA_VERSION}/gitea-${GITEA_VERSION}-linux-amd64"
sudo install -m 755 /tmp/gitea /usr/local/bin/gitea
/usr/local/bin/gitea --version   # sanity check

# Create user + directories
sudo adduser --system --shell /bin/bash --gecos 'Git Version Control' --group --disabled-password --home /home/git git
sudo mkdir -p /var/lib/gitea/{custom,data,log}
sudo chown -R git:git /var/lib/gitea/
sudo chmod -R 750 /var/lib/gitea/
sudo mkdir /etc/gitea
sudo chown root:git /etc/gitea
sudo chmod 770 /etc/gitea   # Gitea writes app.ini here on first run
```

### systemd unit

```bash
sudo tee /etc/systemd/system/gitea.service <<'UNIT'
[Unit]
Description=Gitea (Git with a cup of tea)
After=syslog.target network.target postgresql.service
Requires=postgresql.service

[Service]
RestartSec=2s
Type=simple
User=git
Group=git
WorkingDirectory=/var/lib/gitea/
ExecStart=/usr/local/bin/gitea web --config /etc/gitea/app.ini
Restart=always
Environment=USER=git HOME=/home/git GITEA_WORK_DIR=/var/lib/gitea

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable --now gitea
sudo systemctl status gitea --no-pager
```

Gitea will fail on first boot because there's no `app.ini` yet — that's
expected. We'll create it via the web installer next.

---

## Step 3 — Caddy (TLS + reverse proxy)

Caddy auto-provisions Let's Encrypt certs + handles redirects. Much
less config than nginx for this shape.

```bash
# Official Caddy install
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy

# Caddyfile
sudo tee /etc/caddy/Caddyfile <<'CADDY'
git.thompsonfams.com {
    reverse_proxy 127.0.0.1:3000
    encode gzip zstd
    header {
        # Gitea expects real client IPs for webhooks / rate limiting
        X-Forwarded-For {remote}
        X-Real-IP {remote}
        # Hardening
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
    }
}
CADDY

sudo systemctl restart caddy
sudo systemctl status caddy --no-pager
```

Caddy will try to get a cert for `git.thompsonfams.com` and fail until
DNS points at this server — that's the next step.

---

## Step 4 — DNS (Cloudflare)

In Cloudflare DNS for `thompsonfams.com`:

1. **Add A record**: `git.thompsonfams.com` → `<server-ip>` → **DNS only**
   (NOT proxied — Gitea needs real client IPs for webhook delivery).
2. Wait ~30s for DNS to propagate (or less — your TTL setting).

Verify:
```bash
# From your local machine
dig +short git.thompsonfams.com
# Should return the Hetzner IP.

curl -sI https://git.thompsonfams.com
# Expect: HTTP/2 200 (or 5xx if Gitea isn't configured yet — that's OK,
# means Caddy is serving + cert provisioned. We'll fix Gitea next.)
```

---

## Step 5 — Gitea web installer

First-time setup page. Visit `https://git.thompsonfams.com` in a
browser on your machine (not SSH). Gitea shows an install form.

Fill in:

| Field | Value |
|---|---|
| **Database Type** | PostgreSQL |
| **Host** | `127.0.0.1:5432` |
| **Username** | `gitea` |
| **Password** | the one you saved to 1Password in Step 1 |
| **Database Name** | `gitea` |
| **SSL Mode** | Disable (same-host, no TLS needed) |
| **Site Title** | `TBM Git` |
| **Repository Root Path** | `/var/lib/gitea/data/gitea-repositories` (default) |
| **Git LFS Root Path** | `/var/lib/gitea/data/lfs` (default) |
| **Run As Username** | `git` |
| **Server Domain** | `git.thompsonfams.com` |
| **SSH Server Port** | `22` |
| **Gitea HTTP Listen Port** | `3000` |
| **Gitea Base URL** | `https://git.thompsonfams.com/` |
| **Log Path** | `/var/lib/gitea/log` (default) |

**Advanced options** — expand these:

- **Disable Gravatar** → yes (privacy)
- **Federated Avatars** → no
- **Allow Self-Registration** → **no** (critical — otherwise anyone
  with the URL can create accounts on your Git host)
- **Default Visibility: Private** → yes
- **Enable Email Confirmation** → no (single-user context)
- **Default "Keep Email Private"** → yes
- **Require Signin to View Pages** → **yes** (don't leak repo contents
  to anonymous visitors)

**Admin account** (create now, bottom of the page):

| Field | Value |
|---|---|
| Username | `lt` |
| Password | saved in 1Password |
| Email | `lthompson@memoveindesigns.com` |

Click **Install Gitea**. Redirects to the signed-in dashboard. Done
with the installer.

Gitea wrote `/etc/gitea/app.ini` during this step. Lock it down:

```bash
sudo chmod 640 /etc/gitea/app.ini
sudo chown root:git /etc/gitea/app.ini
sudo systemctl restart gitea
```

---

## Step 6 — Create the bot account

Second user, separate from the admin. The bot does automation; LT
does policy/review. Different auth, different audit trail.

In Gitea UI: **Site Administration** (top-right avatar → `+ New User`):

| Field | Value |
|---|---|
| Username | `tbm-bot` |
| Email | `tbm-bot@thompsonfams.com` (non-routable is fine) |
| Password | 32-char random; save to 1Password |
| Require password change | **off** (bot can't rotate interactively) |
| Send notification email | off |

Save.

Then log in as `tbm-bot` once (in a private-browser window to avoid
conflict with your `lt` session) and generate a personal access token:

1. Top-right avatar → **Settings** → **Applications**.
2. **Generate new token**.
3. Name: `cp-events-worker-2026-04-19`.
4. Scopes: **read:issue, write:issue, read:repository, write:repository**
   (NOT admin — tbm-bot should never be able to delete the org or
   change user passwords).
5. **Copy the token immediately** — Gitea shows it once.
6. Save to 1Password as `GITEA_TOKEN`.

---

## Step 7 — Post-install hygiene

```bash
# Confirm services are all up
sudo systemctl status gitea caddy postgresql --no-pager | head -30

# Check Gitea logs for errors
sudo tail -50 /var/lib/gitea/log/gitea.log

# Confirm cert is valid
curl -sI https://git.thompsonfams.com | head -5
# Look for: HTTP/2 200, not 301 or cert error
```

Update Hetzner Cloud Firewall (if you're about to do webhook testing):
you may need to temporarily allow port 80/443 from any IPv4 + IPv6
(already done if you followed the CX22 runbook). SSH port 22 should
stay locked to your home IP.

---

## What's next

1. **Install Gitea Actions runner** — separate runbook, TBD. Runs on
   the same box. Needs a registration token from the Gitea UI.
2. **Import the bundle** — `ops/migration/tbm-apps-script-2026-04-19.bundle`
   via Gitea's web-based import tool. Creates a new repo
   `blucsigma05/tbm-apps-script` on Gitea with full history.
3. **Wire the bot PAT** — `wrangler secret put GITEA_TOKEN` on the
   cp-events worker; add a `HMAC_SECRET_FORGE` secret for webhook
   signature verification; the worker's `/events/forge/gitea` handler
   graduates from stub to live.
4. **Sacrificial test PR** — push a branch, open a PR, verify CI +
   Codex review + merge all work end-to-end.

---

## Troubleshooting

### Caddy fails to get a cert

Check:
```bash
sudo journalctl -u caddy --no-pager | tail -30
```

Usual causes:
- DNS not propagated yet → `dig git.thompsonfams.com` must resolve.
- Port 80/443 blocked by Hetzner Cloud Firewall → check firewall rules.
- Ratelimited by Let's Encrypt (5 failures in 1h) → wait, retry.

### Gitea hangs on first request

```bash
sudo journalctl -u gitea --no-pager | tail -30
```

Usual cause: Postgres connection failing. Verify:
```bash
sudo -u git psql -h 127.0.0.1 -U gitea -d gitea -c '\conninfo'
# Prompts for password — paste the one from Step 1.
```

### SSH from the runner fails

Gitea Actions runners use SSH to clone. If cloning fails with "host key
verification", SSH at port 22 needs to be reachable from localhost at
least. Check that `PermitRootLogin no` is set but localhost SSH still
works for the `git` user via SSH keys Gitea manages automatically.

---

## Uninstall / reset

If you need to start over during setup (before real data lands):

```bash
sudo systemctl stop gitea
sudo rm -rf /var/lib/gitea /etc/gitea
sudo userdel -r git
sudo -u postgres psql -c 'DROP DATABASE gitea; DROP USER gitea;'
# Then redo from Step 1.
```

Don't run this once real repos or Issues are in place.
