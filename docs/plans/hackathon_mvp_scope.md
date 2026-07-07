# Hackathon MVP scope — Track 3: Agent Society

**Status:** Delivered (2026-07-06). All in-scope items shipped on `main`.

**Goal:** 5-minute demo proving **autonomous multi-agent negotiation → deterministic policy → governed inference** in a EU enterprise narrative.

---

## Delivered

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | **Boardroom UI** — 5 agents, live/replay transcript | ✅ Glassbox theater |
| 2 | **Policy compiler** — JSON out, version hash | ✅ Deterministic compiler + tests |
| 3 | **Gateway simulator** — allow + deny paths | ✅ PII MASK/BLOCK, routing |
| 4 | **Audit event** — schema-valid log | ✅ `disclosure_shown`, policy hash |
| 5 | **Scenario 001 roleplay** | ✅ S01–S05 eval suite |
| 6 | **Strategy explorer** | ✅ `prototypes/trustflow_strategy_explorer.html` |
| 7 | **Employee + governance portals** | ✅ HITL sign-off, appeals, audit |
| 8 | **S05 baseline** | ✅ Single-agent vs boardroom comparison |

---

## Out of scope (by design)

- Real SSO, real Copilot API, production proxy scale
- Betriebsrat e-sign workflow
- Multi-tenant hosting
- Full PII NER (regex IBAN/email sufficient for demo)
- Post-hackathon PMF fake-door test (R4 — cancelled)

---

## Demo flow (5 min)

| Min | Beat |
|-----|------|
| 0:00 | Problem — strategy explorer or glassbox intro |
| 0:45 | Employee request + org gates — S04 |
| 1:00 | Agent boardroom — rounds 0–5 |
| 2:30 | Policy compiler + hash |
| 3:00 | Gateway enforce — email MASK; IBAN BLOCK |
| 4:00 | Audit trail + governance |
| 4:30 | Result + gateway activity after sign-off |
| 5:00 | Close |

---

## Technical stack (as built)

| Layer | Choice |
|-------|--------|
| UI | React + Vite |
| Boardroom | Node/Fastify + Qwen API (`qwen-max`) |
| Compiler | Pure TypeScript (no LLM) |
| Gateway | Fastify middleware mock |
| Data | JSON files under `data/` |
| Deploy | Docker Compose on Alibaba Cloud ECS |

---

## Acceptance criteria

- [x] Scenario S01 runs end-to-end without manual JSON editing
- [x] Scenario S02 shows `BETRIEBSVEREINBARUNG_PENDING` deny
- [x] Policy hash changes when Compliance demands different routing
- [x] Audit event validates against schema
- [x] Demo recoverable in <2 min if live LLM fails (golden replay fallback)
