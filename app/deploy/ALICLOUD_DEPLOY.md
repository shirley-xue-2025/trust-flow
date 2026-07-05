# Deploying TrustFlow to Alibaba Cloud — step by step

A from-zero walkthrough to get TrustFlow running on a single Alibaba Cloud ECS
VM, gated by a shared passcode, satisfying the hackathon's "must be deployed on
Alibaba Cloud" rule. Follow top to bottom; each step says exactly what to click
or run.

> Quick reference (env vars, local run, troubleshooting) lives in
> [`README.md`](README.md). This file is the full first-time walkthrough.

---

## 0. What you'll end up with

```
            Internet
               │  http(s)
        ┌──────▼───────┐  Alibaba ECS (Ubuntu 22.04, EU region)
        │   nginx :80  │  ── docker compose ──┐
        │  (passcode)  │                       │
        │   serves SPA │                       │
        │  proxies /v1 ├──► backend :8080 ─────┤  qwen-max (DashScope intl)
        └──────────────┘     (Fastify)         │
              volume: trustflow_data (audit log + policy store)
```

One VM, two containers (`web` = nginx, `backend` = Fastify), a named data volume,
and an `app/.env` holding your secrets (never committed).

---

## 1. Prerequisites (one-time)

- An **Alibaba Cloud account** (international site: <https://www.alibabacloud.com>) with a payment method.
- Your **DashScope/Qwen API key** (the Pay-As-You-Go key you already have).
- The repo pushed to **GitHub** (public).
- An **SSH key pair** on your laptop. If you don't have one:
  ```bash
  ssh-keygen -t ed25519 -C "trustflow-ecs"
  # press enter for defaults → creates ~/.ssh/id_ed25519 (private) + .pub (public)
  cat ~/.ssh/id_ed25519.pub   # you'll paste this into the ECS key pair
  ```

---

## 2. Create the ECS instance

Console → **Elastic Compute Service (ECS)** → **Instances** → **Create Instance**.

| Setting | Choose | Why |
|---|---|---|
| Billing | **Pay-as-you-go** | No commitment; stop it after judging |
| Region | **EU (Frankfurt)** `eu-central-1` | Makes the "EU data residency" story literally true |
| Instance type | **2 vCPU / 4 GB** (e.g. `ecs.e-c1m2.large` or a burstable `t6` 2c4g) | App is I/O-light, no GPU (local model is stubbed) |
| Image | **Ubuntu 22.04 LTS 64-bit** | Matches this guide's commands |
| System disk | **40 GB ESSD** (or cloud_efficiency) | Plenty for images + data |
| Public IP | **Assign public IPv4** (or bind an **EIP**) | Needed for judges to reach it |
| Bandwidth | Pay-by-traffic, a few Mbps | Demo traffic is tiny |
| Logon credentials | **Key Pair** → create/import, paste your `id_ed25519.pub` | Safer than a password |

Create it, then note the **public IP** (e.g. `8.210.x.x`).

> Tip: an **Elastic IP (EIP)** that you bind to the instance keeps the same
> address across stop/start — convenient if you'll put a domain on it.

---

## 3. Open the firewall (Security Group)

ECS → **Security Groups** → the one attached to your instance → **Add Inbound Rules**:

| Port | Source | Purpose |
|---|---|---|
| **22** (SSH) | **your IP only** (`x.x.x.x/32`) | Admin access — do NOT open to the world |
| **80** (HTTP) | `0.0.0.0/0` | The app |
| **443** (HTTPS) | `0.0.0.0/0` | Only if you add TLS (step 9) |

> Lower-exposure option: keep 80/443 closed while building, and only open them
> during the judging window. Close them again afterwards.

---

## 4. Connect and install Docker

```bash
ssh root@<your-ECS-public-ip>     # uses your ~/.ssh/id_ed25519
```

Install Docker Engine + the Compose plugin (official Ubuntu repo):

```bash
apt-get update
apt-get install -y ca-certificates curl git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
docker --version && docker compose version    # confirm both work
```

> If Docker's CDN is slow from your region, Alibaba provides a registry mirror —
> add `{"registry-mirrors":["https://<id>.mirror.aliyuncs.com"]}` to
> `/etc/docker/daemon.json` (get your URL from the ACR console) and
> `systemctl restart docker`.

---

## 5. Get the code and create secrets

```bash
git clone https://github.com/<you>/<repo>.git trustflow
cd trustflow/app

# Create the secrets file (git-ignored, lives only on the box):
cp deploy/env.deploy.example .env
nano .env
```

Fill in `app/.env`:

```ini
# Live boardroom (optional — omit to run replay-only and spend $0)
DASHSCOPE_API_KEY=sk-...your key...
QWEN_MODEL=qwen-max            # or qwen3.7-plus / qwen-plus for cheaper

# Access gate (recommended for a public box) — share with judges on Devpost
BASIC_AUTH_USER=judge
BASIC_AUTH_PASSWORD=pick-a-strong-shared-passcode
```

**Decide your cost posture:**
- Include `DASHSCOPE_API_KEY` → gated judges can run **live** negotiations.
- Omit it → site is **replay-only** (deterministic golden transcripts, $0 spend); show live in your video.

Either way, **set `BASIC_AUTH_*`** so anonymous traffic can't reach the API.

---

## 6. Deploy

```bash
docker compose up -d --build      # first build pulls base images (~few min)
docker compose ps                 # both services should be "running"
docker compose logs -f web        # look for: basic-auth ENABLED (user: judge)
```

---

## 7. Verify

From the box (or your laptop, swapping `localhost` for the public IP):

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost/                       # 401 (gated)
curl -s -o /dev/null -w "%{http_code}\n" -u judge:PASS http://localhost/          # 200
curl -s -u judge:PASS http://localhost/v1/health                                  # {"ok":true,"live_qwen":...}
```

Then open **`http://<your-ECS-public-ip>/`** in a browser, enter the passcode, and:
- **`/glassbox`** → toolbar **Scenario S04** → **Run** → watch **Agent boardroom** node stream (SSE through nginx)
- Click **Gateway enforce** → email MASK / IBAN BLOCK samples
- **`/employee`** → sign-off demo on `demo-s04-pending-signoff`
- If you set the key: run a **live** negotiation from glassbox **Use custom request**

If SSE doesn't stream, see Troubleshooting — but the nginx config already disables
proxy buffering, so it should "just work".

---

## 8. Set a spend cap (important)

In the **Model Studio / DashScope** console, set a **budget alert or hard spend
cap** on your account. The $40 voucher is a natural ceiling, but Pay-As-You-Go can
overrun — this is your last line of defense if the passcode ever leaks.

---

## 9. (Optional) HTTPS with a domain

Skippable for judging (HTTP + passcode is fine), but nicer for the video and
required if you ever add real OAuth.

```bash
# 1. Point a domain's A record at your ECS public IP (in your DNS provider).
# 2. On the box:
apt-get install -y certbot
docker compose down                      # free port 80 for certbot
certbot certonly --standalone -d trustflow.example.com
# 3. Add a 443 server block to app/nginx.conf referencing the issued certs in
#    /etc/letsencrypt/live/<domain>/, mount that dir into the web container,
#    map "443:443" in docker-compose.yml, then:
docker compose up -d --build
```

(Ask and I'll wire the 443 nginx block + cert mount for you when you have a domain.)

---

## 10. Updating after code changes

```bash
cd ~/trustflow && git pull && cd app && docker compose up -d --build
```

Or automate it with **GitHub CI** — see [`../../.github/workflows/`](../../.github/workflows/)
and the "GitHub CI" section below.

---

## 11. Operating notes

- **Save money when idle:** `docker compose down` (keeps data volume), or **Stop**
  the ECS instance in the console (pay-as-you-go compute pauses; an EIP keeps the IP).
- **Data persistence:** the audit log + policy store live in the `trustflow_data`
  volume and survive `up`/`down`. `docker compose down -v` wipes them (fresh demo).
- **Logs:** `docker compose logs -f backend` / `web`.
- **Rough cost:** a 2c4g pay-as-you-go ECS in Frankfurt is a low single-digit
  €/day; stop it when not demoing.

---

## 12. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Browser can't reach the site | Security group | Confirm port 80 is open to `0.0.0.0/0` |
| `401` even with the passcode | Wrong creds / caching | Recheck `BASIC_AUTH_*` in `app/.env`; re-`up -d` |
| Everyone gets in (no prompt) | Passcode not set | Both `BASIC_AUTH_USER` + `BASIC_AUTH_PASSWORD` must be set; `docker compose logs web` should say "basic-auth ENABLED" |
| `502 Bad Gateway` on `/v1` | Backend not up | `docker compose logs backend`; check `DASHSCOPE_*` not malformed |
| Boardroom doesn't stream | SSE buffering | Already disabled in `nginx.conf`; ensure you didn't add a caching proxy in front |
| Live run errors, replay works | No/invalid API key | Replay-only is expected with no key; set `DASHSCOPE_API_KEY` for live |
| Build is slow / fails pulling | Docker CDN | Add an Alibaba registry mirror (step 4 note) |

---

## GitHub CI (optional automation)

Two workflows live in [`.github/workflows/`](../../.github/workflows/):

### `ci.yml` — build + test on every push/PR  *(enabled, no setup)*
Runs `npm ci && npm run build && npm run test` and a `docker compose build` on
GitHub's runners. Catches breakage before you deploy. Nothing to configure.

### `deploy.yml` — push-button deploy to ECS  *(opt-in)*
A **manual** workflow (Actions tab → "Deploy to Alibaba ECS" → Run) that SSHes
into the box and runs `git pull && docker compose up -d --build`. To enable it,
add these **repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `ECS_HOST` | your ECS public IP |
| `ECS_USER` | `root` (or a deploy user) |
| `ECS_SSH_KEY` | the **private** key whose public half is on the box (`cat ~/.ssh/id_ed25519`) |
| `ECS_PORT` | `22` (optional) |

Prerequisites on the box: the repo is already cloned at `~/trustflow` with
`app/.env` present (the workflow only pulls code + rebuilds — it never touches
secrets). It's set to **manual trigger** on purpose, so a stray push can't break
your live demo; flip it to `on: push` later if you want continuous deploys.

> Storing an SSH private key in GitHub Secrets is standard but is a real
> credential — use a deploy-only key, and rotate it after the hackathon.
