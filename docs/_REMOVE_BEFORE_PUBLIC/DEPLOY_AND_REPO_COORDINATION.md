# Deploy & repo coordination

**Status:** Agreed 2026-07-05 (Shirley + Max)  
**Audience:** Teammates, judges, future sessions — read this before redeploy or fork questions.

---

## Source of truth

| What | Where |
|------|--------|
| **Canonical repo** | [`shirley-xue-2025/trust-flow`](https://github.com/shirley-xue-2025/trust-flow) → branch `main` |
| **Local dev** | `cd app && npm run dev` (web :5173, backend :8080) |
| **Demo script** | [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) (this folder) |
| **Deploy runbook** | [`app/deploy/ALICLOUD_DEPLOY.md`](../../app/deploy/ALICLOUD_DEPLOY.md) |

**Do not treat the fork as canonical.** Max's fork exists for historical setup only.

---

## Two repos (why this doc exists)

Max forked early and deployed from his copy. Shirley kept shipping on the canonical repo. They **diverged**.

| Repo | Owner | Role |
|------|-------|------|
| `shirley-xue-2025/trust-flow` | Shirley | **Product source of truth** — all new work lands here |
| `maxmedina05/trust-flow` | Max | **Stale fork** — was deploy snapshot; not ahead of canonical (verified 2026-07-05: **10 commits behind** `main`) |

Both repos are **private**. Shirley and Max are **collaborators** on each other's repos (can see and push).

**Nothing to merge from the fork into canonical** unless the fork later shows commits *ahead* of `shirley-xue-2025/trust-flow:main` (it did not as of 2026-07-05).

---

## Live deployment (Alibaba Cloud)

| Item | Detail |
|------|--------|
| **Region** | Singapore (`ap-southeast-1`) |
| **Infra owner** | Max — ECS, Docker, `app/.env` on the box |
| **Stack** | `docker compose` (nginx + Fastify backend) — see [`app/deploy/README.md`](../app/deploy/README.md) |
| **What's live today** | Likely **old fork snapshot** until next redeploy from canonical `main` |
| **Judge access** | HTTP basic-auth URL + passcode (shared out of band — not in git) |

### Mental model

```
GitHub (canonical main)  ──git pull──►  ECS box  ──docker compose──►  live URL
```

GitHub collaborator access does **not** auto-update the live site. Someone with **SSH** must pull + rebuild.

---

## Division of labor (agreed)

| Person | Owns |
|--------|------|
| **Shirley** | Code on canonical `main`, demo script, product polish, verify after deploy |
| **Max** | Alibaba ECS, redeploy when Shirley says ready, judge URL + passcode |

Shirley does **not** need to redeploy during active dev — local `npm run dev` is enough. Ask Max for a redeploy when demo-frozen (rehearsal + final submission).

---

## Redeploy checklist (for Max)

Run on the ECS box:

```bash
cd ~/trustflow
git remote set-url origin https://github.com/shirley-xue-2025/trust-flow.git
git fetch origin && git checkout main && git pull origin main
cd app
docker compose up -d --build
docker compose ps
```

Optional: reseed HITL demo fixtures (after Shirley's HITL work is on `main`):

```bash
curl -X POST -u <BASIC_AUTH_USER>:<BASIC_AUTH_PASSWORD> http://localhost/v1/demo/reseed
```

**Verify:** `/employee` and `/governance` load; walk [`docs/DEMO_SCRIPT.md`](DEMO_SCRIPT.md) beats 2–3.

**Alternative on GitHub:** Max can click **Sync fork** on `maxmedina05/trust-flow`, then pull on the box — but prefer pulling **canonical** remote (above) to avoid fork drift long-term.

---

## Credential types (don't confuse)

| Credential | Purpose | Who has it |
|------------|---------|------------|
| **Judge URL + passcode** | Open the deployed site (`BASIC_AUTH_*`) | Shirley + judges |
| **SSH key / root password** | Run `git pull` and `docker compose` on ECS | Max (Shirley: ask if needed) |
| **Alibaba console login** | See ECS IP, start/stop VM | Shirley + Max |
| **`app/.env` on server** | `DASHSCOPE_API_KEY`, auth gate | On ECS only — never commit |

---

## When to redeploy

| Trigger | Action |
|---------|--------|
| Shirley says "demo-ready for rehearsal" | Max redeploys once; Shirley verifies with judge link |
| Shirley says "final for submission" | Max redeploys; confirm commit hash matches canonical `main` |
| Day-to-day feature work | **No redeploy** — Shirley uses local dev |

---

## Related docs

- [`app/deploy/ALICLOUD_DEPLOY.md`](../app/deploy/ALICLOUD_DEPLOY.md) — ECS deploy runbook
- [`docs/DECISION_LOG.md`](DECISION_LOG.md) — D004 (docker on ECS), D009 (repo coordination)
- [`PROJECT_TRACKER.md`](../PROJECT_TRACKER.md) — workstream W09 deploy
