# Project tracker

**Purpose:** Shared view of who is working on what, current phase, and links to deliverables.  
**Update rule:** When you start, finish, or hand off work — edit **Active workstreams** and append **Changelog** with your name and date.

**Last updated:** 2026-07-04 · Shirley + Agent (Cursor)

---

## Current phase

| | |
|---|---|
| **Phase** | **4 Demo UI + product surfaces** — employee/governance portals live; glassbox demoted |
| **Next milestone** | Technical spec + build from **PRD v0.2** (HITL + negotiation transparency) |
| **Hackathon** | Track 3: Agent Society — demo scope in [`docs/plans/hackathon_mvp_scope.md`](docs/plans/hackathon_mvp_scope.md) |

**Cold start:** [`SESSION_LATEST.md`](SESSION_LATEST.md) · **Architecture:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · **Roadmap:** [`docs/WORK_PLAN.md`](docs/WORK_PLAN.md)

---

## Active workstreams

| ID | Topic | Owner | Status | Result / links |
|----|-------|-------|--------|----------------|
| W01 | P0 decisions (deadline, stack, split) | **Shirley** (+ teammate for B04–B05) | 🔴 Blocked | [`docs/BLOCKED_ON_SHIRLEY.md`](docs/BLOCKED_ON_SHIRLEY.md) |
| W02 | Persona review (DPO Katrin) | **Shirley** | 🟡 Review | [`docs/research/personas/dpo_fintech_de.md`](docs/research/personas/dpo_fintech_de.md) |
| W03 | GitHub collaborator invite | **Shirley** | 🟡 Pending | Repo: [shirley-xue-2025/trust-flow](https://github.com/shirley-xue-2025/trust-flow) |
| W04 | Phase 2 — Boardroom core | **Unassigned** | ⏸ Waiting on W01 | [`docs/plans/boardroom_protocol.md`](docs/plans/boardroom_protocol.md) |
| W05 | Phase 3 — Gateway simulator | **Unassigned** | ⏸ Waiting on W04 | [`docs/schemas/gateway-audit-event.schema.json`](docs/schemas/gateway-audit-event.schema.json) |
| W06 | Phase 4 — Demo UI | **Agent** | 🟡 In progress | Employee + governance portals; glassbox at `/glassbox` |
| W08 | HITL + negotiation transparency | **Shirley** | 🟢 Demo-ready | [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) · PRD + spec + full flow |
| W07 | Phase 5 — Fake-door LP | **Shirley** | ⏸ Deferred | [`docs/research/pmf/fake_door_copy.md`](docs/research/pmf/fake_door_copy.md) |

**Status key:** 🟢 Done · 🟡 In progress / review · 🔴 Blocked · ⏸ Waiting · ⚪ Not started

---

## Research & specs (completed)

| ID | Topic | Who | Status | Result |
|----|-------|-----|--------|--------|
| R1 | EU AI Act audit → code fields | Agent | 🟢 Planning-ready | [`docs/research/01_eu_ai_act_audit_trail.md`](docs/research/01_eu_ai_act_audit_trail.md) |
| R2 | Betriebsrat veto line | Agent | 🟢 Planning-ready | [`docs/research/02_betriebsrat_co_determination.md`](docs/research/02_betriebsrat_co_determination.md) |
| R3 | Market evidence corpus | Agent | 🟢 Done | [`docs/research/evidence/corpus.jsonl`](docs/research/evidence/corpus.jsonl) · [`synthesis.md`](docs/research/evidence/synthesis.md) |
| R5 | Stakeholder journey | Agent | 🟢 Done | [`docs/research/stakeholders/journey_map.md`](docs/research/stakeholders/journey_map.md) |
| S1 | Product architecture | Agent | 🟢 Done | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| S2 | Work plan | Agent | 🟢 Done | [`docs/WORK_PLAN.md`](docs/WORK_PLAN.md) |
| S3 | Policy + audit schemas | Agent | 🟢 Done | [`docs/schemas/`](docs/schemas/) |
| S4 | Demo scenario 001 | Agent | 🟢 Done | [`docs/research/roleplay/scenario_001_payments_claude.md`](docs/research/roleplay/scenario_001_payments_claude.md) |
| S5 | Seed fixtures + evals | Agent | 🟢 Done | [`docs/fixtures/`](docs/fixtures/) |
| S6 | Evidence collection script | Agent | 🟢 Done | [`scripts/collect_evidence.py`](scripts/collect_evidence.py) |
| S7 | Strategy explorer (pitch) | Shirley | 🟢 Done | [`prototypes/trustflow_strategy_explorer.html`](prototypes/trustflow_strategy_explorer.html) |

Master research index: [`docs/research/RESEARCH_LEDGER.md`](docs/research/RESEARCH_LEDGER.md)

---

## Blocked items (human decisions)

| ID | Summary | Owner | Doc |
|----|---------|-------|-----|
| B01 | Hackathon deadline | Shirley | [`BLOCKED_ON_SHIRLEY.md`](docs/BLOCKED_ON_SHIRLEY.md) |
| B02 | Deployment model (docker vs SaaS) | Shirley | same |
| B03 | Persona red lines | Shirley | same |
| B04 | Stack (Python vs Node) | Shirley + teammate | same |
| B05 | Work split (UI / boardroom / gateway) | Shirley + teammate | same |
| B09 | GitHub collaborator invite | Shirley | same |

---

## Changelog (newest first)

| Date | Who | What | Links |
|------|-----|------|-------|
| 2026-07-04 | Shirley + Agent | PRD v0.2: HITL multi-role sign-off, Advocate, appeal types, negotiation transparency; design-review CSS/accessibility fixes; product unification (uncommitted) | `docs/plans/prd_human_in_the_loop_and_negotiation_transparency.md`, `session_logs/SESSION_HANDOVER_2026-07-04_hitl_prd.md` |
| 2026-07-04 | Shirley + Agent | Merged PR #3 (employee portal) + #4 (competitor research); synced main | `9305fc5` |
| 2026-06-25 | Agent | PROJECT_TRACKER.md for teammate coordination | commit `9a9be60` |
| 2026-06-25 | Agent | Pre-build: architecture, work plan, roleplay, fixtures | commit `8814c1f` |
| 2026-06-25 | Agent | R3 corpus (55 items) + DPO persona v0.1 | commit `781aac6` |
| 2026-06-25 | Agent | Project scaffold, R1/R2 research, audit schema | commit `33d2aeb` |
| 2026-06-25 | Shirley | Approved evidence batch 001 blocker tags | [`batch_001_practitioner.md`](docs/research/evidence/samples/batch_001_practitioner.md) |
| 2026-06-25 | Shirley | Strategy explorer HTML (hackathon pitch) | [`prototypes/trustflow_strategy_explorer.html`](prototypes/trustflow_strategy_explorer.html) |

---

## How teammates should use this repo

1. Read [`SESSION_LATEST.md`](SESSION_LATEST.md) when joining a session.
2. Check **Active workstreams** — pick an ⏸ or ⚪ row with your name, set status to 🟡.
3. Do the work; link your PR/commit in **Changelog**.
4. Move the row to **Research & specs (completed)** or mark 🟢 when done.

**Clone:** `git clone https://github.com/shirley-xue-2025/trust-flow.git`
