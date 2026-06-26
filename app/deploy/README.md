# TrustFlow — Deployment Runbook

Two services behind one host:

- **web** — nginx serving the React build, reverse-proxying `/v1/*` (incl. the
  boardroom SSE stream) to the backend.
- **backend** — Fastify API running the *compiled* server (`node dist/server.js`),
  with a named volume for the policy store + audit JSONL.

The frontend talks to the backend **only through nginx** via same-origin
relative `/v1` paths, so no API URL is baked into the web image.

> **No API key? Still works.** Every demo scenario (S01–S05) replays from a
> golden transcript with no network and no key (`?replay=S01` … `?replay=S05`).
> A `DASHSCOPE_API_KEY` is needed only for *live* qwen-max negotiation.

---

## Required environment variables

Passed to the **backend** container via `app/.env` (compose variable
substitution). Template: `deploy/env.deploy.example`. Root `.env.example` also
documents these.

| Var | Required | Default | Purpose |
|---|---|---|---|
| `DASHSCOPE_API_KEY` | live only | _(empty)_ | DashScope key for qwen-max. Empty ⇒ replay-only. |
| `QWEN_BASE_URL` | no | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | OpenAI-compatible endpoint (intl/Singapore region). |
| `QWEN_MODEL` | no | `qwen-max` | Model id. |
| `PORT` | no | `8080` | Backend listen port (set by compose; nginx proxies to it). |
| `TRUSTFLOW_DATA_DIR` | no | `/data` | Policy store + audit dir (mounted volume; set by compose). |
| `LOG_LEVEL` | no | `info` | Backend log level. |

Never commit a real key. `app/.env` is git-ignored.

---

## A. Local (for judges)

```bash
git clone <public-repo-url> trustflow
cd trustflow/app

# Optional: live qwen-max. Skip entirely to run replay-only.
cp deploy/env.deploy.example .env
#   then edit .env and paste your DASHSCOPE_API_KEY

docker compose up --build
```

Open **http://localhost** → run an S0x scenario (replay works with no key), or a
live negotiation if a key is set.

Stop with `Ctrl-C`; `docker compose down` to remove containers (the
`trustflow_data` volume persists policies + audit until `docker compose down -v`).

---

## B. Alibaba Cloud ECS

1. **Create an ECS instance** — Ubuntu 22.04, 2 vCPU / 4 GB (no GPU; the local
   model is stubbed). **Pick an EU region (e.g. Frankfurt / `eu-central-1`)** so
   the EU data-residency narrative is literally true.

2. **Security group** — open inbound:
   - `22` (SSH) — restrict to *your* IP.
   - `80` (HTTP) — `0.0.0.0/0`.
   - `443` (HTTPS) — `0.0.0.0/0` (only needed if you do the optional TLS step).

3. **Install Docker engine + compose plugin** (SSH in, then):

   ```bash
   sudo apt-get update
   sudo apt-get install -y ca-certificates curl gnupg
   sudo install -m 0755 -d /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
     | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
   sudo chmod a+r /etc/apt/keyrings/docker.gpg
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
     https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
     | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   sudo apt-get update
   sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
   sudo usermod -aG docker $USER && newgrp docker   # run docker without sudo
   docker --version && docker compose version
   ```

4. **Clone the repo** (public):

   ```bash
   git clone <public-repo-url> trustflow
   cd trustflow/app
   ```

5. **Create `.env`** with the key (never committed):

   ```bash
   cp deploy/env.deploy.example .env
   nano .env          # paste DASHSCOPE_API_KEY (and optional QWEN_MODEL)
   ```

6. **Build and start** (detached):

   ```bash
   docker compose up -d --build
   docker compose ps          # both services Up
   docker compose logs -f backend   # watch boot; live_qwen=true when key is set
   ```

7. **Verify** — open `http://<ECS-public-ip>/`:
   - Run an **S0x replay** (e.g. `?replay=S04`) — confirms SSE through nginx.
   - Run a **live negotiation** — confirms the cloud box reaches qwen-max.
   - Health check: `curl http://<ECS-public-ip>/v1/health` →
     `{"ok":true,"live_qwen":true,...}`.

   Update: `git pull && docker compose up -d --build`.

---

## C. (Optional) HTTPS — skippable for judging

Only if you have a domain pointed at the ECS public IP. HTTP on port 80 is
fine for the demo.

```bash
# Point an A record (e.g. trustflow.example.com) at the ECS public IP first.
sudo apt-get install -y certbot
docker compose stop web          # free port 80 for the standalone challenge
sudo certbot certonly --standalone -d trustflow.example.com
# Then add a 443 server block to app/nginx.conf referencing the issued certs
# (/etc/letsencrypt/live/<domain>/{fullchain.pem,privkey.pem}), mount
# /etc/letsencrypt into the web container, publish 443:443 in compose, and
# `docker compose up -d --build web`.
```

---

## Troubleshooting

- **SSE stream never arrives / hangs**: confirm `nginx.conf` has
  `proxy_buffering off`, `proxy_http_version 1.1`, `proxy_set_header Connection ''`,
  and the long `proxy_read_timeout`. The backend also sends `X-Accel-Buffering: no`.
- **`/v1` 502**: backend not up yet, or the compose service name / port drifted.
  nginx proxies to `http://backend:8080` — keep the service named `backend` and
  `PORT=8080`.
- **Audit/policies vanish on restart**: ensure the `trustflow_data` volume is
  mounted at `/data` and `TRUSTFLOW_DATA_DIR=/data`.
- **`live_qwen:false` unexpectedly**: `DASHSCOPE_API_KEY` not reaching the
  backend — check `app/.env` and `docker compose config`.
```
