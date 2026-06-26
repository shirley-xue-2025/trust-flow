# TrustFlow — Build, Deployment & Demo Plan

**Status:** Implementation plan (2026-06-26). Authored for Max (developer) + teammate.
**Scope:** How Claude Code builds the app against the frozen pre-build spec; how Max deploys it on Alibaba Cloud; how the team demos it.
**Source of truth for contracts:** `docs/schemas/*.json`, `docs/plans/boardroom_protocol.md`, `docs/plans/hackathon_mvp_scope.md`, `docs/fixtures/*.seed.json`, `docs/research/personas/dpo_fintech_de.md`.

---

## Context

What the colleague delivered is a complete **pre-build spec + research package** — there is **no application code yet** (`app/` does not exist). This is a greenfield build against a fully frozen set of contracts (policy schema, audit schema, boardroom protocol, eval scenarios S01–S05, seed fixtures). Build directly against those.

---

## Decisions locked

| Decision | Choice |
|---|---|
| Stack | **Node/TypeScript** end-to-end (backend Fastify, frontend React+Vite, shared types) |
| Agents | **5** (Runner, Compliance, IT/Infra, Procurement, Works Council Liaison) |
| Local route | **Stubbed** — real routing decision + audit event, mock response body |
| Deploy | **Single Alibaba ECS** running docker-compose (backend + frontend behind nginx) |
| LLM | `qwen-max` via DashScope **OpenAI-compatible** endpoint, Singapore/intl region (`https://dashscope-intl.aliyuncs.com/compatible-mode/v1`) |
| Boardroom live updates | **SSE** (server-sent events), one event per agent turn |
| Stores | **JSON/JSONL files** (policy store, audit log) — no DB |
| Validation | **ajv** against the existing JSON schemas + **zod** for agent envelopes |
| PII | **regex** (IBAN, email) + small name gazetteer, flagged "illustrative" |

---

# Part 1 — Implementation Plan

## 1.1 Why this shape

The pitch is **"deterministic enforcement at the edge; generative negotiation only for policy authoring."** The code must make that contrast visible (30% technical depth). Hard rule: **the LLM never writes `rules.json` directly** — it emits a *proposal*, and a pure-function **compiler** (no LLM) validates, floor-checks, hashes, and materializes it. That boundary is the engineering story.

## 1.2 Repo layout (all app code under `app/`, per `PROJECT_STRUCTURE.md`)

```
app/
├── package.json                 # npm workspaces root
├── shared/                      # imported by backend AND frontend
│   ├── types.ts                 # TS types mirrored from the 2 JSON schemas
│   ├── schemas/                 # copies/symlinks of docs/schemas/*.json for ajv
│   └── canonical.ts             # stable-stringify + sha256 → policy_version_hash
├── backend/
│   ├── src/
│   │   ├── qwen/client.ts       # OpenAI SDK pointed at DashScope, qwen-max
│   │   ├── boardroom/           # LAYER B (generative)
│   │   │   ├── agents/          # 5 system-prompt builders + persona/floor injection
│   │   │   ├── session.ts       # state machine OPEN→NEGOTIATING→{outcome}→COMPILED
│   │   │   ├── round.ts         # round order 0–5, pass logic, max 6 rounds
│   │   │   └── envelope.ts      # zod schema for the agent message envelope
│   │   ├── compiler/            # DETERMINISTIC GATE (no LLM)
│   │   │   ├── merge.ts         # demands/concessions → PolicyArtifact
│   │   │   ├── floor.ts         # reject if weaker than org policy_floor
│   │   │   └── compile.ts       # ajv validate → hash → write policy store
│   │   ├── gateway/             # LAYER A (deterministic)
│   │   │   ├── pii.ts           # regex IBAN/email + name gazetteer
│   │   │   ├── routing.ts       # CLOUD_QWEN_MAX | LOCAL_QWEN_72B (stub) | BLOCKED
│   │   │   ├── enforce.ts       # pre-flight checks in ARCHITECTURE §3.2 order
│   │   │   └── audit.ts         # emit gateway-audit-event (ajv-validated) → JSONL
│   │   ├── store/               # JSON file read/write (policy store, audit log, sessions)
│   │   └── server.ts            # Fastify: REST + SSE; loads the 3 seed fixtures
│   └── test/                    # vitest: compiler, floor, schema validation, S01–S05
└── web/                         # React + Vite + TS
    ├── src/
    │   ├── views/
    │   │   ├── RequestForm.tsx       # employee submits {tool, use_case, dept}
    │   │   ├── Boardroom.tsx         # SSE transcript, agent cards, emerging policy
    │   │   ├── PolicyPanel.tsx       # rules.json + version hash + diff highlight
    │   │   ├── Playground.tsx        # send a prompt → masked/allowed/denied + audit line
    │   │   └── AuditLog.tsx          # tail of the JSONL audit events
    │   └── api.ts                    # fetch + EventSource client
    └── index.html
```

**Why a monorepo isn't overkill:** the only overhead is one `package.json` with workspaces. The payoff is that `shared/types.ts` and the hash function are imported identically by gateway, compiler, and UI, so the policy artifact can never drift between "what the agents produced," "what the gateway enforces," and "what the UI shows."

## 1.3 Build order (maps to `WORK_PLAN.md` phases 2–4)

Built in **vertical slices** so there's always something runnable. Each step lists its **done =** acceptance criterion (`hackathon_mvp_scope.md` acceptance list is the source of truth).

> **On estimates:** the parentheticals below are *Claude-Code-on-Opus* wall-clock, not human-days. Coding is the fast part. The real long poles are Max's reviews/decisions, ECS provisioning, first-deploy debugging, and demo recording — see §3.4.

**Step 1 — Scaffold + Qwen vertical slice** (~15 min)
- Workspaces, TS config, Fastify boot, Vite boot, `shared/` types + `canonical.ts`.
- `qwen/client.ts`: one round-trip to `qwen-max` returning structured JSON, validated by zod.
- **done =** `npm run dev` serves an empty UI; a CLI script gets one valid JSON envelope back from Qwen.

**Step 2 — Boardroom core, CLI-only** (~30–45 min) — *Phase 2*
- 5 agent prompt builders. Each loads: org `policy_floor`, a short R1/R2 regulatory summary, top corpus excerpts by tag, and (Compliance) the `dpo_fintech_de.md` persona card — per `boardroom_protocol.md` "Agent system prompt anchors."
- Round engine (rounds 0–5, agents may `pass`, max 6 → force `PENDING_HUMAN`), session state machine, sign-off/veto matrix.
- Compiler: merge algorithm, floor check, ajv validate against `policy-artifact.schema.json`, sha256 hash, write to policy store.
- **done =** S01 → `APPROVED` + valid policy artifact; S02 → `PENDING_EXTERNAL` w/ `BETRIEBSVEREINBARUNG_PENDING`; S03 → `DENIED` (`HIGH_RISK_USE_DENIED`); S05 → `DENIED` (`VENDOR_DPA_PENDING`). These are locked fixtures — a hard pass/fail.

**Step 3 — Gateway simulator, CLI-only** (~20–30 min) — *Phase 3*
- Policy load by id/hash; PII regex pass; routing (incl. stubbed `LOCAL_QWEN_72B`); deny-reason enforcement in the §3.2 order; audit event writer (ajv-validated against `gateway-audit-event.schema.json`).
- **done =** S04 (payment schema) routes to `LOCAL_QWEN_72B` with a valid audit line; an IBAN prompt produces `pii_redaction` + `PII_BLOCK`/mask; a clean prompt is `allowed`. Integration test: policy → inference → log.

**Step 4 — HTTP API + SSE** (~15–20 min)
- REST: `POST /v1/boardroom/session`, `GET /v1/boardroom/:id/stream` (SSE), `GET /v1/policy/:id`, `POST /v1/inference`, `GET /v1/audit`.
- Server emits one SSE event per agent turn so the UI animates the debate live.
- **done =** curl the SSE stream and watch envelopes arrive in round order.

**Step 5 — Frontend** (~45–90 min) — *Phase 4*
- The five views above. Boardroom view renders agent cards with `stance` color-coding, shows `demands`/`concessions`, reveals the policy JSON + hash assembling in real time. Playground shows masked-vs-raw side by side. Audit view tails the JSONL.
- Wire in `prototypes/trustflow_strategy_explorer.html` as the problem-framing intro (iframe or link).
- **done =** full S01 path clickable in the browser with no manual JSON editing.

**Step 6 — Resilience + fallback** (~20 min)
- **Canned-transcript fallback:** every scenario can replay from a saved golden transcript if the live API is slow/down (#1 risk). A `?replay=S01` flag swaps the live Qwen call for recorded envelopes — same UI, zero API dependency.
- **done =** "demo recoverable in <2 min if live LLM fails."

## 1.4 What's needed to start

1. **`DASHSCOPE_API_KEY`** (the $40 voucher key) in a `.gitignore`'d `.env`.
2. Confirm the **public GitHub repo** judges will see.
3. Nothing else — all fixtures, schemas, personas are in the repo.

**Cost check:** one full 5-agent / 6-round negotiation is ≲30 `qwen-max` calls — a few dollars against the $40 voucher even with heavy iteration. Not a constraint.

---

# Part 2 — Deployment Plan (Alibaba Cloud — mandatory)

Max owns infra; Claude Code produces every artifact. The hard rule (requirements §2) is only that the **hosted components run on Alibaba** — single ECS + docker-compose satisfies it.

## 2.1 Artifacts produced (so deploy = `docker compose up`)

| Artifact | Purpose |
|---|---|
| `backend/Dockerfile` | Multi-stage build → small Node runtime image |
| `web/Dockerfile` | Vite build → static files served by nginx |
| `docker-compose.yml` | `backend`, `web` (nginx), shared network, volume for policy store + audit log |
| `nginx.conf` | Serves the React build, reverse-proxies `/v1/*`, **passes SSE through un-buffered** (`proxy_buffering off`) |
| `.env.example` (exists) | Documents `DASHSCOPE_API_KEY`, `QWEN_BASE_URL`, `PORT` |
| `deploy/README.md` | The exact step list below, copy-pasteable |

## 2.2 What Max does on Alibaba (step by step)

1. **Create an ECS instance** — Ubuntu 22.04, 2 vCPU / 4 GB (I/O-light, no GPU since local model is stubbed). **Pick an EU region** (e.g. Frankfurt) so the "EU data residency" narrative is literally true.
2. **Security group:** open `22` (SSH, your IP only), `80`, `443`.
3. **Install Docker + compose plugin** (one apt block in `deploy/README.md`).
4. **Clone the repo** (public, so `git clone`).
5. **Create `.env`** on the box with `DASHSCOPE_API_KEY` (never committed).
6. **`docker compose up -d --build`**.
7. **Verify:** `http://<ECS-public-ip>/` loads; run S01 end-to-end against live Qwen from the cloud box.
8. *(Optional)* domain + `certbot` for HTTPS. Skippable for judging, nice for video.

**No RDS / OSS / LB needed:** JSON-file stores live on a docker volume; one instance serves the demo. Scale story = the documented production path in `ARCHITECTURE.md §5` (Postgres + object store) — said, not built.

**Cloud-failure insurance:** the `?replay=` fallback runs identically on ECS. Keep a local instance warm as backup during recording.

## 2.3 Deployment sequencing

Deploy **once early** (~July 1, right after the gateway works at CLI level) to shake out cloud-specific issues (SSE buffering through nginx, env, region), then redeploy as features land. Don't leave first-deploy to the final days.

---

# Part 3 — Demo Plan (5-minute video — submission requirement)

15% of score, but the only thing some judges see fully.

## 3.1 Pre-record setup
- Run against the **deployed Alibaba ECS** instance (mandatory-deployment box ticked on camera).
- Pre-seed: org = NordPay AG (DE, BR pending), the 3 seed fixtures loaded.
- Stage **two scenarios:** S04 (hero — approval *with* a sovereign-route concession) and one denial (S05 DPA veto or S02 BR-pending) for contrast.
- Have `?replay=` ready as insurance; run live if rehearsal is snappy.

## 3.2 The 5-minute script

| Time | Beat | What's on screen |
|---|---|---|
| 0:00–0:45 | **Problem** | Strategy-explorer chart: approval deadlock + Shadow AI. Weeks of Legal/IT/Betriebsrat email. |
| 0:45–1:00 | **Employee request** | RequestForm: payments engineer asks to use Claude Code on payment API schemas. |
| 1:00–2:30 | **Boardroom (money shot)** | SSE transcript animates: Runner advocates → Procurement flags DPA → Compliance demands fingerprint-only logs + EU → Works Council raises Betriebsvereinbarung → IT concedes route to `LOCAL_QWEN_72B`. Visible disagreement then consensus (Decision #5). |
| 2:30–3:00 | **Compile** | PolicyPanel: `rules.json` assembles, `risk_tier`, routing, audit fields, **version hash** appear. "An LLM proposed this; a deterministic compiler validated and signed it — the model never touches enforcement." |
| 3:00–4:00 | **Governed inference** | Playground: clean prompt → allowed via cloud; **IBAN prompt → masked/blocked at the edge**; payment-schema prompt → routed LOCAL. Side-by-side raw vs masked. |
| 4:00–4:30 | **Audit** | AuditLog: `gateway-audit-event` lines with deny reason codes — "Art. 26-ready trail." |
| 4:30–5:00 | **ROI + CTA** | weeks→seconds; fake-door/contact. |

## 3.3 Submission checklist (Devpost, by July 9)
- [ ] **Public GitHub repo** + README quickstart (judges can `docker compose up`).
- [ ] **5-min demo video** (this script).
- [ ] **Presentation deck** (teammate — reuse the `ARCHITECTURE.md` mermaid diagram).
- [ ] **Devpost written description**.
- [ ] Live deployed URL (Alibaba ECS) in README + Devpost.

## 3.4 Timeline (today June 26; code freeze + video due July 9)

The build is **not** the constraint — Claude Code on Opus produces the whole codebase (Steps 1–6) in roughly **one focused session (~3–4 hours wall-clock incl. review loops)**, plausibly less. The schedule is paced by the things that *can't* be compressed: Max's reviews/decisions, ECS provisioning, first-deploy debugging, and the teammate's recording/edit. Lots of slack against July 9 — the risk is infra/recording, not engineering throughput.

| What | Owner | Long pole? | Est. |
|---|---|---|---|
| Steps 1–4: scaffold → boardroom → gateway → API/SSE, S01–S05 green | Claude Code | no | ~1.5–2 h |
| Confirm S01–S05 pass, eyeball agent transcripts | Max | review gate | minutes |
| Step 5: full frontend | Claude Code | no | ~1–1.5 h |
| Step 6: canned-transcript fallback | Claude Code | no | ~20 min |
| Provision ECS (EU region), security group, Docker | **Max** | **yes** | ~30–60 min |
| First deploy + SSE/nginx shake-out | Max + Claude Code | **yes** | ~30–60 min |
| README quickstart + redeploy final | Claude Code | no | ~20 min |
| Record + cut 5-min video | **Teammate** | **yes** | ~2–3 h |
| Deck (reuse ARCHITECTURE mermaid) + Devpost write-up | **Teammate** | yes | teammate-paced |

**Suggested calendar (generous):** build the whole app + first deploy **in the next 1–2 sittings this week**; spend the remaining ~10 days on agent-prompt tuning (so the debate is genuinely sharp), demo recording, and deck — none of which is engineering-bound.

---

## FAQ

- **Reuse the existing strategy explorer?** Yes — embedded as the problem-framing intro, no rewrite.
- **Will the agents really disagree, or rubber-stamp?** The veto/sign-off matrix and `policy_floor` are enforced in *code*; agent prompts are seeded with conflicting mandates (Runner wants speed, Compliance wants restriction). S05/S02/S03 are designed to fail negotiation. Conflict is structural, not luck.
- **Blocked on Shirley?** Of B01–B05: deadline known, deployment = ECS docker, stack = Node, agents = 5 roster. Only **B03 (persona red-line approval)** would refine agent tone — not a start blocker; use `dpo_fintech_de.md` v0.1 as-is and tweak later.
