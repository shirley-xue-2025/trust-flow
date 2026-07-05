# Session Latest — pointer file

**Purpose:** Single discovery point for all tools. Read this first in any new session.

---

## Current state — 2026-07-05 (late evening)

**Phase:** **Demo-ready** — product portals + glassbox boardroom theater + gateway-activity employee UX (no in-app tool chat). Track B presentation artifacts on disk.

**👉 Demo script (v2):** [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) · [`docs/JUDGE_DEMO_RUNBOOK.md`](docs/JUDGE_DEMO_RUNBOOK.md)

**👉 Hackathon pack:** [`docs/hackathon/PITCH_DECK_OUTLINE.md`](docs/hackathon/PITCH_DECK_OUTLINE.md) · [`SPOKEN_LINES.md`](docs/hackathon/SPOKEN_LINES.md) · [`EVIDENCE_CHAIN.md`](docs/hackathon/EVIDENCE_CHAIN.md)  
**👉 Devpost DRAFT (delete before public):** [`docs/_REMOVE_BEFORE_PUBLIC/DEVPOST_DRAFT.md`](docs/_REMOVE_BEFORE_PUBLIC/DEVPOST_DRAFT.md)  
**👉 Win strategy (Ring 2, local):** `memory/HACKATHON_WIN_STRATEGY.md` · doc audit [`session_logs/SESSION_HANDOVER_2026-07-05_win_strategy_doc_audit.md`](session_logs/SESSION_HANDOVER_2026-07-05_win_strategy_doc_audit.md)

**👉 Diagrams:** [`docs/hackathon/diagrams/architecture.png`](docs/hackathon/diagrams/architecture.png) · [`round_schedule.png`](docs/hackathon/diagrams/round_schedule.png)

**👉 Deploy / fork:** [`docs/DEPLOY_AND_REPO_COORDINATION.md`](docs/DEPLOY_AND_REPO_COORDINATION.md) — Max redeploys ECS when demo-frozen.

**👉 Recent handovers:** [`session_logs/SESSION_HANDOVER_2026-07-05_glassbox_theater.md`](session_logs/SESSION_HANDOVER_2026-07-05_glassbox_theater.md) · [`win_strategy_doc_audit.md`](session_logs/SESSION_HANDOVER_2026-07-05_win_strategy_doc_audit.md) · [`product_track3_visibility.md`](session_logs/SESSION_HANDOVER_2026-07-05_product_track3_visibility.md)

**Run:** `cd app && npm run dev` · **Reset:** `curl -X POST http://localhost:8080/v1/demo/reseed` · **Tests:** `npm run test` (32) + `npm run test:e2e` (28)

### Surfaces (quick map)

| URL | What |
|-----|------|
| `/employee` | Product — dashboard, requests, **Agent negotiation**, **Gateway activity** |
| `/governance` | DPO/IT queues, sign-off, appeals, audit |
| `/glassbox` | Judge view — **boardroom theater** (pipeline strip + live transcript + detail panel) |
| `/demo` | Redirects to `/glassbox` |

---

## Cold-start paths

- **PRD (HITL):** `docs/plans/prd_human_in_the_loop_and_negotiation_transparency.md`
- **Architecture:** `docs/ARCHITECTURE.md` (§6 UI surfaces)
- **Boardroom protocol:** `docs/plans/boardroom_protocol.md`
- **Demo story:** `docs/research/roleplay/scenario_001_payments_claude.md`
- **Run locally:** `cd app && npm run dev` (web :5173, backend :8080)

---

*Previous handover: `session_logs/SESSION_HANDOVER_2026-07-04_hitl_prd.md`*
