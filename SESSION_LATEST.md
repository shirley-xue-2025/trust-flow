# Session Latest — pointer file

**Purpose:** Single discovery point for all tools. Read this first in any new session.

---

## Current state — 2026-07-05

**Phase:** **Demo-ready + polished** — HITL flow, design-review fixes, Playwright e2e, governance role switcher in header.

**👉 Deploy / fork (read first if redeploy questions):** [`docs/DEPLOY_AND_REPO_COORDINATION.md`](docs/DEPLOY_AND_REPO_COORDINATION.md) — canonical = this repo; Max's fork stale; Max redeploys ECS when Shirley says ready.

**👉 Demo script:** [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md)

**👉 Spec:** [`docs/plans/spec_hitl_state_model_and_governance_apis.md`](docs/plans/spec_hitl_state_model_and_governance_apis.md)

**👉 Handover:** [`session_logs/SESSION_HANDOVER_2026-07-05_deploy_coordination.md`](session_logs/SESSION_HANDOVER_2026-07-05_deploy_coordination.md) (deploy/fork) · [`session_logs/SESSION_HANDOVER_2026-07-05_demo_polish_e2e.md`](session_logs/SESSION_HANDOVER_2026-07-05_demo_polish_e2e.md) (demo polish)

**Run:** `cd app && npm run dev` · **Reset:** `curl -X POST http://localhost:8080/v1/demo/reseed` · **E2E:** `cd app && npm run test:e2e`

---

## Cold-start paths

- **PRD (HITL):** `docs/plans/prd_human_in_the_loop_and_negotiation_transparency.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Boardroom protocol:** `docs/plans/boardroom_protocol.md`
- **Demo story:** `docs/research/roleplay/scenario_001_payments_claude.md`
- **Run locally:** `cd app && npm run dev` (web :5173, backend :8080)

---

*Previous handover: `session_logs/SESSION_HANDOVER_2026-07-04_hitl_prd.md`*
