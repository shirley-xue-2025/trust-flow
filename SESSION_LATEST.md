# Session Latest — pointer file

**Purpose:** Single discovery point for all tools. Read this first in any new session.

---

## Current state — 2026-07-05 (evening)

**Phase:** **Demo-ready + Track 3 product visibility** — negotiation default tab, Agent Society labels, demo tour, architecture strip, PII honesty, Art. 50 audit fields. Track B presentation artifacts also on disk.

**👉 Product visibility handover:** [`session_logs/SESSION_HANDOVER_2026-07-05_product_track3_visibility.md`](session_logs/SESSION_HANDOVER_2026-07-05_product_track3_visibility.md)

**👉 Demo script (v2 winning cut):** [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) · [`docs/JUDGE_DEMO_RUNBOOK.md`](docs/JUDGE_DEMO_RUNBOOK.md)

**👉 Hackathon pack:** [`docs/hackathon/PITCH_DECK_OUTLINE.md`](docs/hackathon/PITCH_DECK_OUTLINE.md) · [`docs/hackathon/SPOKEN_LINES.md`](docs/hackathon/SPOKEN_LINES.md) · [`docs/hackathon/EVIDENCE_CHAIN.md`](docs/hackathon/EVIDENCE_CHAIN.md) · [`docs/hackathon/DEVPOST_DRAFT.md`](docs/hackathon/DEVPOST_DRAFT.md) _(DRAFT)_

**👉 Diagrams:** [`docs/hackathon/diagrams/architecture.png`](docs/hackathon/diagrams/architecture.png) · [`round_schedule.png`](docs/hackathon/diagrams/round_schedule.png)

**👉 Deploy / fork:** [`docs/DEPLOY_AND_REPO_COORDINATION.md`](docs/DEPLOY_AND_REPO_COORDINATION.md) — Max redeploys ECS when demo-frozen.

**👉 Handover:** [`session_logs/SESSION_HANDOVER_2026-07-05_product_track3_visibility.md`](session_logs/SESSION_HANDOVER_2026-07-05_product_track3_visibility.md) · [`session_logs/SESSION_HANDOVER_2026-07-05_presentation_track.md`](session_logs/SESSION_HANDOVER_2026-07-05_presentation_track.md) · [`SESSION_HANDOVER_2026-07-05_demo_polish_e2e.md`](session_logs/SESSION_HANDOVER_2026-07-05_demo_polish_e2e.md)

**Run:** `cd app && npm run dev` · **Reset:** `curl -X POST http://localhost:8080/v1/demo/reseed` · **E2E:** `cd app && npm run test:e2e` (28 tests)

---

## Cold-start paths

- **PRD (HITL):** `docs/plans/prd_human_in_the_loop_and_negotiation_transparency.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Boardroom protocol:** `docs/plans/boardroom_protocol.md`
- **Demo story:** `docs/research/roleplay/scenario_001_payments_claude.md`
- **Run locally:** `cd app && npm run dev` (web :5173, backend :8080)

---

*Previous handover: `session_logs/SESSION_HANDOVER_2026-07-04_hitl_prd.md`*
