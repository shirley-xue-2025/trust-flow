# TrustFlow — application code

Node/TypeScript monorepo (npm workspaces). Two judged ideas made literal in the
module layout:

- **Layer C — Human sign-off (HITL)** (`backend/src/governance`) — DPO and IT activate policy.
- **Layer B — Agent Boardroom** (`backend/src/boardroom`) is the only place an LLM
  runs. It emits *proposals* (structured envelopes), never `rules.json`.
- **Deterministic compiler** (`backend/src/compiler`) is pure code: it merges the
  agents' demands/concessions, **floor-checks** them (validates against the org's
  non-negotiable red lines), validates against the JSON schema, hashes, and writes
  the policy.
- **Layer A — Edge Gateway** (`backend/src/gateway`) is pure code too: PII scan,
  routing, audit — **no LLM in the enforcement path**.

The boundary is the point: *an LLM proposed the policy; deterministic code
validated, signed, and enforces it.*

## Layout

```
app/
├── shared/        TS types mirrored from the 2 JSON schemas + canonical hash
├── backend/       Fastify REST+SSE, boardroom, compiler, gateway, file stores
│   └── test/      vitest + golden transcripts (S01–S05, captured from live qwen-max)
└── web/           React + Vite UI
    ├── employee/  Product portals (employee + governance)
    ├── glassbox/  Glassbox — transparent judge view of the negotiation engine
    └── views/     Shared inspector panels (Playground, PolicyPanel, AuditLog, …)
```

## Run it (no API key needed)

```bash
cd app
npm install
npm run test          # 32 tests, S01–S05 green, NO network / NO key
npm run test:e2e      # 28 Playwright tests
npm run dev           # backend :8080 + web :5173 (Vite proxies /v1 → backend)
```

Open http://localhost:5173/employee for the **product** (default route).

### Employee portal (`/employee`)

Role-based flow for employees:

1. **Dashboard** — demo tour, approved tools card, recent requests
2. **New request** — submit tool access with business justification
3. **My requests** — track status (negotiating → approved / denied / pending external)
4. **Request detail** — tabs: Overview, **Agent negotiation**, Policy, **Gateway activity**

After human sign-off, employees use approved tools **in their IDE** — TrustFlow records
gateway enforcement on the request; there is **no in-app tool chat**.

Uses **shadcn/ui + Tailwind**. Backend: `POST/GET /v1/employee/requests`.

Quick test: Dashboard → **Claude Code — pending sign-off** → **Agent negotiation** tab.

### Governance portal (`/governance`)

Queues (sign-off, appeals, external, negotiating), request oversight, org-wide audit.
Header **Viewing as** switches DPO / Procurement / IT personas.

### Glassbox (`/glassbox`)

**Classic glassbox** — transparent judge view of the full pipeline:

- Pipeline strip: Inputs → Agent boardroom → Compiler signs → Humans approve → Gateway enforces
- Boardroom theater with full negotiation transcript (opening → lanes → rebuttals → finals)
- Click-to-inspect panels: employee request, org gates, compiled policy, gateway playground, audit
- **Payment data — sovereign routing** demo scenario auto-loads; run boardroom then test PII MASK / IBAN BLOCK in gateway

`/demo` redirects to `/glassbox`.

**Recorded demo mode** (`?replay=` on boardroom session) is the keyless, deterministic path.
It replays saved qwen-max negotiations instead of calling the API, then runs them
through the *same* compiler + gateway.

## Live Qwen (optional — needs the voucher key)

The live boardroom calls `qwen-max` via the DashScope OpenAI-compatible endpoint.
Put the key in a git-ignored `.env` at the repo root (template: `.env.example`):

```
DASHSCOPE_API_KEY=sk-...
# QWEN_BASE_URL defaults to the Singapore/intl endpoint; override only for another region.
QWEN_MODEL_DEV=qwen-flash
QWEN_MODEL_DEMO=qwen-max
QWEN_MODEL=qwen-flash
PORT=8080

# LOCAL_QWEN_72B_* — the gateway's "sovereign on-prem" route. Leave these unset
# and all three fall back to the DashScope cloud config above, so it's
# cloud-backed out of the box. To make it genuinely on-prem, uncomment and point
# them at a real local Qwen-72B endpoint (values below are an Ollama example):
# LOCAL_QWEN_72B_BASE_URL=http://localhost:11434/v1
# LOCAL_QWEN_72B_MODEL=qwen2.5-72b-instruct
# LOCAL_QWEN_72B_API_KEY=
```

The app **auto-loads `.env`** (Node's built-in `--env-file` loader, no `dotenv`
dependency), so no secrets go on the command line. Just run the one-shot smoke test:

```bash
npm run smoke        # one live qwen-flash round-trip → valid envelope
npm run smoke:demo   # same, but qwen-max (demo dry-run without editing .env)
npm run dev:demo     # qwen-max + ~1s/turn replay pacing (demo video)
npm run capture:golden:demo -- S04 --write-golden   # record live qwen-max → test/golden/S04.json
npm run baseline:demo -- S05 --write                 # single-agent vs boardroom → docs/hackathon/baseline/
```

With the key present, glassbox **Use custom request** + **Run** starts a real
multi-agent negotiation. Without it, use replay scenarios.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/v1/boardroom/session?replay=S0X` | start a negotiation |
| GET  | `/v1/boardroom/:id/stream` | SSE — one event per agent turn, then `result` |
| GET  | `/v1/policy/:id` | compiled policy artifact + hash (`?hash=` for version) |
| POST | `/v1/inference` | governed inference through the gateway |
| GET  | `/v1/audit` | tail of the JSONL audit log |
| POST | `/v1/demo/reseed` | reset demo employee requests |
| GET  | `/v1/org`, `/v1/tools`, `/v1/scenarios` | seed fixtures |
| POST/GET | `/v1/employee/requests` | employee request CRUD |
| GET  | `/v1/governance/...` | queues, sign-off, appeals, audit |

## Locked scenario outcomes (asserted by tests)

| Scenario | Outcome | Detail |
|---|---|---|
| S01 | APPROVED | Copilot summarization, BR signed |
| S02 | PENDING_EXTERNAL | `BETRIEBSVEREINBARUNG_PENDING` |
| S03 | DENIED | `HIGH_RISK_USE_DENIED` (Annex III) |
| S04 | APPROVED | redacted on `LOCAL_QWEN_72B`, completed on `CLOUD_QWEN_MAX` |
| S05 | DENIED | `VENDOR_DPA_PENDING` |
