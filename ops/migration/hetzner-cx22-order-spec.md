# Hetzner CX22 — Order Runbook

**Purpose:** field-by-field guide for ordering the TBM primary control-plane VPS.
**Status:** runbook (not yet executed).
**Last reviewed:** 2026-04-19.

This is the production host for Gitea + Actions runner + Caddy reverse proxy +
backup target. The laptop (once wiped to Ubuntu) is the secondary/staging tier.

---

## Pre-flight — before opening the order page

You need these in hand first; pausing mid-order to go get them is how you
end up with a half-configured server.

- [ ] **Payment method.** Hetzner accepts card + SEPA. Card is faster to set up.
- [ ] **Email** — use `lthompson@memoveindesigns.com` (same as Cloudflare).
- [ ] **SSH keypair** ready. Generate locally if you don't have one:
  ```bash
  ssh-keygen -t ed25519 -C "lt@tbm-primary" -f ~/.ssh/tbm_hetzner_ed25519
  ```
  We paste the **public** key (`~/.ssh/tbm_hetzner_ed25519.pub`) into the
  Hetzner UI at order time. Private key stays on this machine only.
  Back up the private key to Drive once provisioning is confirmed working —
  losing it means losing SSH access (password auth will be disabled).
- [ ] **Hostname chosen.** Suggest: `tbm-primary` (short, matches the bot name).

---

## Step 1 — Account

1. Go to <https://www.hetzner.com/cloud>.
2. **"Get started"** → create account if needed.
   - Use `lthompson@memoveindesigns.com`.
   - Company field: personal account is fine (no legal reason for business).
3. Verify email, add billing info, accept ToS.

---

## Step 2 — Project

Projects are Hetzner's top-level scope. One project = one billing line.

1. In the Cloud Console, click **"New Project"**.
2. Name: **`tbm`** (short; shows in every URL).
3. (No other fields.)

---

## Step 3 — Add SSH key FIRST (before server order)

Critical: adding the key during the order wizard works, but adding it at the
project level first means all future servers inherit it. Do this now.

1. In the `tbm` project, left nav → **"Security"** → **"SSH Keys"**.
2. **"Add SSH key"**.
3. Paste the contents of `~/.ssh/tbm_hetzner_ed25519.pub`.
4. Name: **`lt-laptop`** (identifies where the key lives).
5. Save.

---

## Step 4 — Order the server

In the `tbm` project, **"Servers"** → **"Add Server"**.

Fill in each field below in order. Anything not listed = leave default.

| Field | Choice | Why |
|---|---|---|
| **Location** | **Ashburn, VA (ash)** | Closest to TX; lowest latency. Nuremberg/Helsinki add ~100ms for no benefit to us. |
| **Image** | **Ubuntu 24.04** | LTS, matches what we'll install on the laptop later. `apt` pkg set is well-documented. |
| **Type** | **Shared vCPU → x86 (Intel/AMD) → CX22** | 2 vCPU, 4 GB RAM, 40 GB NVMe, 20 TB traffic. Enough for Gitea + runner + Caddy + a Playwright job. |
| **Network** | Public IPv4 + IPv6 both **on** | Need v4 for most of the internet; v6 is free and future-proof. |
| **Volumes** | none | Default 40 GB disk is plenty for phase one. Add a volume later if repos grow. |
| **Firewalls** | skip in wizard | We'll attach one in Step 5 — easier to configure separately. |
| **Backups** | **ENABLE** | +20% of server cost (~$1/mo extra). Daily snapshot, 7-day retention. This is cheap insurance. |
| **Placement groups** | skip | Single server — irrelevant. |
| **Labels** | `role=primary`, `project=tbm` | Useful once there's >1 server. |
| **Cloud config / User data** | **leave empty** | We'll provision by hand the first time so you understand the stack. Cloud-init later once the shape is known. |
| **SSH Keys** | Check the **`lt-laptop`** box from Step 3 | This is what disables password auth for root. |
| **Name** | **`tbm-primary`** | Shows in every invoice, DNS entry, SSH prompt. |

Click **"Create & Buy now"**.

Provisioning takes ~30 seconds. You land on the server detail page with the
public IPv4 address displayed top-right. Copy it.

---

## Step 5 — Attach a firewall (Hetzner-side, before first SSH)

Ubuntu's `ufw` is the host-side firewall; Hetzner's Cloud Firewall is
network-side (cheaper, stops traffic before it touches the server). Both.

1. Project left nav → **"Firewalls"** → **"Create Firewall"**.
2. Name: **`tbm-primary-fw`**.
3. **Inbound rules** (delete defaults, add these three):

   | Source | Protocol | Port(s) | Purpose |
   |---|---|---|---|
   | any IPv4 + IPv6 | ICMP | — | Ping / path-mtu discovery |
   | any IPv4 + IPv6 | TCP | **443** | Caddy HTTPS (Gitea + webhooks) |
   | any IPv4 + IPv6 | TCP | **80** | Caddy HTTP→HTTPS redirect + ACME challenge |
   | **your home IP only** | TCP | **22** | SSH — lock to your IP, not 0.0.0.0/0 |

   Get your home IP from <https://ifconfig.me>. If you move around (coffee
   shops), loosen to `0.0.0.0/0` temporarily and tighten later. SSH keys
   are strong, but IP restriction is a free second layer.

4. **Apply to resources** → select `tbm-primary`. Save.

---

## Step 6 — First SSH + baseline hardening

From your local machine:

```bash
# Replace 1.2.3.4 with the actual IP from the Hetzner server page.
ssh -i ~/.ssh/tbm_hetzner_ed25519 root@1.2.3.4
```

First login, accept the host-key fingerprint. Then, on the server:

```bash
# System packages
apt update && apt upgrade -y
apt install -y ufw fail2ban unattended-upgrades curl git

# Host-side firewall (second layer)
ufw allow OpenSSH
ufw allow 443/tcp
ufw allow 80/tcp
ufw --force enable

# Automatic security updates
dpkg-reconfigure -plow unattended-upgrades   # answer yes

# Create a non-root user for daily work; disable root SSH
adduser --disabled-password --gecos "" lt
mkdir -p /home/lt/.ssh
cp /root/.ssh/authorized_keys /home/lt/.ssh/
chown -R lt:lt /home/lt/.ssh
chmod 700 /home/lt/.ssh
chmod 600 /home/lt/.ssh/authorized_keys
usermod -aG sudo lt

# Lock down sshd
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh

# Test the new user works BEFORE closing this session
# (open a second terminal locally, try: ssh -i ~/.ssh/tbm_hetzner_ed25519 lt@1.2.3.4)
```

If the `lt@...` SSH works in a second terminal, you're hardened. Exit root.

---

## Step 7 — DNS

Don't do this until Gitea is actually running (Phase C step 9). But plan it
now so you're not surprised later.

In Cloudflare DNS for `thompsonfams.com`:

- `git.thompsonfams.com` → A record → server IP → **DNS only** (not proxied)
  - Gitea needs to see real client IPs for webhooks; Cloudflare proxy would
    break that without extra header config. Run Caddy on the host to terminate
    TLS via Let's Encrypt.
- `events.thompsonfams.com` → CNAME → `tbm-cp-events.lthompson.workers.dev` → **proxied**
  - This is the CF Worker, already deployed.

---

## Cost

| Item | Monthly |
|---|---|
| CX22 server | ~$5 |
| Backups (+20%) | ~$1 |
| IPv4 address | ~$0.60 |
| Traffic | $0 (20 TB included; we will not come close) |
| **Total** | **~$6.60/mo** |

Confirm on the order-page sidebar before clicking "Create" — Hetzner updates
this in real-time as you pick fields.

---

## Rollback — if this turns out to be the wrong choice

Hetzner bills per-hour with no commitment.

- Delete the server from the dashboard → billing stops at next hour boundary.
- The SSH key and firewall config can stay (free, no resources attached).
- Snapshots are billed while they exist; delete them too.

Worst-case "I hate this" cost if you delete within 24 hours: ~$0.20.

---

## What's next after the server exists

1. Install Gitea + PostgreSQL + Caddy (separate runbook — write when ready).
2. Install a Gitea Actions runner on the same box.
3. Migrate `tbm-apps-script.bundle` (in `ops/migration/`) into Gitea.
4. Point the Cloudflare Worker's `HMAC_SECRET_FORGE` secret at this Gitea.
5. Update bot PAT scopes; move GitHub secrets into Gitea secrets.
6. Sacrificial test PR to prove CI → review → merge works end-to-end.

At that point we're on the new forge and GitHub is fallback-only.
