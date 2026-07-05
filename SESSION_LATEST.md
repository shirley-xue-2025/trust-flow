# Session Latest — pointer file

**Purpose:** Single discovery point for all tools. Read this first in any new session.

---

## Current state — 2026-07-06 (night)

**Phase:** **Submission pack complete on `main`** — remaining: rehearse + record video (**use `npm run dev:demo`** for qwen-max), Max ECS redeploy, repo public, Devpost. **Deadline: Jul 9, 2026 @ 5 PM EDT.**

**New tonight:** pitch deck [`docs/hackathon/TrustFlow_deck.pptx`](docs/hackathon/TrustFlow_deck.pptx) · 10 judge stills [`docs/hackathon/screenshots/`](docs/hackathon/screenshots/) (refresh: `cd app && node capture-stills.mjs`) · Devpost thumbnail [`thumbnail_devpost.png`](docs/hackathon/thumbnail_devpost.png) · Devpost draft in story-template format, single-field elevator pitch · demo script v3 (live-qwen beat, beat-4 prerequisite) · **fixes:** gateway now enforces the human-activated policy version (beat 4 unblocked), glassbox transcript duplication race, transcript row spacing, strategy explorer 5-agent copy (hero no longer "On Autopilot").

**Git:** local `main` is ahead of origin, nothing uncommitted — **ready to push**.

**👉 Demo script (v3):** [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) · [`docs/JUDGE_DEMO_RUNBOOK.md`](docs/JUDGE_DEMO_RUNBOOK.md)

**👉 Hackathon pack:** [`docs/hackathon/PITCH_DECK_OUTLINE.md`](docs/hackathon/PITCH_DECK_OUTLINE.md) · [`SPOKEN_LINES.md`](docs/hackathon/SPOKEN_LINES.md) · [`EVIDENCE_CHAIN.md`](docs/hackathon/EVIDENCE_CHAIN.md) · [`baseline/S05_single_agent_vs_boardroom.md`](docs/hackathon/baseline/S05_single_agent_vs_boardroom.md)  
**👉 Devpost DRAFT (delete before public):** [`docs/_REMOVE_BEFORE_PUBLIC/DEVPOST_DRAFT.md`](docs/_REMOVE_BEFORE_PUBLIC/DEVPOST_DRAFT.md)  
**👉 Win strategy (Ring 2, local):** `memory/HACKATHON_WIN_STRATEGY.md`

**👉 Diagrams:** [`docs/hackathon/diagrams/architecture.png`](docs/hackathon/diagrams/architecture.png) · [`round_schedule.png`](docs/hackathon/diagrams/round_schedule.png)

**👉 Deploy / fork:** [`docs/DEPLOY_AND_REPO_COORDINATION.md`](docs/DEPLOY_AND_REPO_COORDINATION.md) — Max redeploys ECS when demo-frozen.

**👉 Last handover:** [`session_logs/SESSION_HANDOVER_2026-07-06_qwen_live_baseline_readability.md`](session_logs/SESSION_HANDOVER_2026-07-06_qwen_live_baseline_readability.md)

**Run:** `cd app && npm run dev:demo` (qwen-max) or `npm run dev` (qwen-flash) · **Reset:** `curl -X POST http://localhost:8080/v1/demo/reseed` · **Tests:** `npm run test` (34)

**Qwen key:** `trust-flow/.env` (gitignored) — see `memory/setup-and-troubleshooting.md` §4.

### Surfaces (quick map)

| URL | What |
|-----|------|
| `/employee` | Product — dashboard, requests, **Agent negotiation**, **Gateway activity** |
| `/governance` | DPO/IT queues, sign-off, appeals, audit |
| `/glassbox` | Judge view — **boardroom theater** (pipeline strip + live/replay transcript + detail panel) |
| `/demo` | Redirects to `/glassbox` |

---

## Cold-start paths

- **PRD (HITL):** `docs/plans/prd_human_in_the_loop_and_negotiation_transparency.md`
- **Architecture:** `docs/ARCHITECTURE.md` (§6 UI surfaces)
- **Boardroom protocol:** `docs/plans/boardroom_protocol.md`
- **Demo story:** `docs/research/roleplay/scenario_001_payments_claude.md`
- **Run locally:** `cd app && npm run dev` (web :5173, backend :8080)

---

*Previous handover: `session_logs/SESSION_HANDOVER_2026-07-05_glassbox_theater.md`*
