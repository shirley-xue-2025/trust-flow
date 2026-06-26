# TrustFlow — application code

Node/TypeScript monorepo (npm workspaces). Two judged ideas made literal in the
module layout:

- **Layer B — Agent Boardroom** (`backend/src/boardroom`) is the only place an LLM
  runs. It emits *proposals* (structured envelopes), never `rules.json`.
- **Deterministic compiler** (`backend/src/compiler`) is pure code: it merges the
  agents' demands/concessions, **floor-checks** them against the org's red lines,
  validates against the JSON schema, hashes, and writes the policy.
- **Layer A — Edge Gateway** (`backend/src/gateway`) is pure code too: PII scan,
  routing, audit — **no LLM in the enforcement path**.

The boundary is the point: *an LLM proposed the policy; deterministic code
validated, signed, and enforces it.*

## Layout

```
src/
├── shared/        TS types mirrored from the 2 JSON schemas + canonical hash
├── backend/       Fastify REST+SSE, boardroom, compiler, gateway, file stores
│   └── test/      vitest + hand-authored golden transcripts (S01–S05)
└── web/           React + Vite UI (5 views + strategy-explorer intro)
```

## Run it (no API key needed)

```bash
cd src
npm install
npm run test          # 20 tests, S01–S05 green, NO network / NO key
npm run dev           # backend :8080 + web :5173 (Vite proxies /v1 → backend)
```

Open http://localhost:5173 → tab "1 · Request" → pick a replay scenario (S01–S05).
The boardroom streams over SSE, the compiler produces the hashed policy, and the
Playground sends prompts through the gateway (try the IBAN sample → `PII_BLOCK`).

**Replay mode** (`?replay=S0X`) is the keyless, deterministic path and the demo
fallback. It sources hand-authored golden transcripts instead of calling Qwen,
then runs them through the *same* compiler + gateway.

## Live Qwen (optional — needs the voucher key)

The live boardroom calls `qwen-max` via the DashScope OpenAI-compatible endpoint.
Put the key in a git-ignored `.env` at the repo root (template: `.env.example`):

```
DASHSCOPE_API_KEY=sk-...
# QWEN_BASE_URL defaults to the Singapore/intl endpoint; override only for another region.
# QWEN_MODEL defaults to qwen-max; set qwen-plus for cheap dev iteration.
PORT=8080
```

The app **auto-loads `.env`** (Node's built-in `--env-file` loader, no `dotenv`
dependency), so no secrets go on the command line. Just run the one-shot smoke test:

```bash
npm run smoke   # one live qwen-max round-trip → valid envelope
```

With the key present, the "Submit to boardroom (live)" button in the Request view
runs a real 5-agent negotiation. Without it, use replay scenarios.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/v1/boardroom/session?replay=S0X` | start a negotiation |
| GET  | `/v1/boardroom/:id/stream` | SSE — one event per agent turn, then `result` |
| GET  | `/v1/policy/:id` | compiled policy artifact + hash |
| POST | `/v1/inference` | governed inference through the gateway |
| GET  | `/v1/audit` | tail of the JSONL audit log |
| GET  | `/v1/org`, `/v1/tools`, `/v1/scenarios` | seed fixtures |

## Locked scenario outcomes (asserted by tests)

| Scenario | Outcome | Detail |
|---|---|---|
| S01 | APPROVED | Copilot summarization, BR signed |
| S02 | PENDING_EXTERNAL | `BETRIEBSVEREINBARUNG_PENDING` |
| S03 | DENIED | `HIGH_RISK_USE_DENIED` (Annex III) |
| S04 | APPROVED | routing `LOCAL_QWEN_72B` |
| S05 | DENIED | `VENDOR_DPA_PENDING` |
```
