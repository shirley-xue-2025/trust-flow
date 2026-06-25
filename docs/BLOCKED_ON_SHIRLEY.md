# Blocked on Shirley

**Purpose:** Decisions and actions only you (or you + teammate) can unblock. Everything else should proceed autonomously.

Last updated: 2026-06-25

---

## P0 — Blocks spec freeze & coding

| ID | Decision needed | Options | Recommendation | Impact if delayed |
|----|-----------------|---------|----------------|-------------------|
| **B01** | **Hackathon deadline** | Date? submission format? | — | Cannot size WORK_PLAN |
| **B02** | **Deployment story for demo** | (a) Local docker (b) TrustFlow SaaS (c) Hybrid | **(a) local docker** for hackathon | Architecture §3.4, DPO persona Q3 |
| **B03** | **Persona red lines** | Review `personas/dpo_fintech_de.md` — what's wrong? | Approve v0.1 with edits | Agent prompts stay draft |
| **B04** | **Stack with teammate** | Python FastAPI vs Node Express vs other | Match teammate strength | Phase 2 start |
| **B05** | **Teammate work split** | Who owns UI vs boardroom vs gateway? | See WORK_PLAN parallel streams | Parallel efficiency |

---

## P1 — Blocks polish & external-facing

| ID | Decision needed | Notes |
|----|-----------------|-------|
| **B06** | **Fake-door budget** | LinkedIn ads €? Tally OK? |
| **B07** | **LP brand / design** | Framer template? copy approval in `research/pmf/fake_door_copy.md` |
| **B08** | **Legal disclaimer** | "Not legal advice" on demo + LP — your comfort level |
| **B09** | **Invite teammate to GitHub** | `shirley-xue-2025/trust-flow` collaborator |
| **B10** | **Pitch voice** | You vs teammate on 5-min video |

---

## P2 — Nice to have (research validation)

| ID | Decision needed | Notes |
|----|-----------------|-------|
| **B11** | **DPO interview** | 30 min with real DE DPO — validate persona |
| **B12** | **r/gdpr scrape retry** | ~$0.30 Apify — I can run without you if you say yes by default |
| **B13** | **Counsel review R1** | External sanity check on audit schema claims |
| **B14** | **Product positioning** | Sell to IT vs DPO vs "both" — affects LP headline |

---

## Already decided (no action needed)

| Decision | Rationale |
|----------|-----------|
| Dual-layer architecture | Deterministic gateway + agent boardroom |
| Single audit schema, tiered fields | R1 translation |
| `BETRIEBSVEREINBARUNG_PENDING` as deny code | R2 |
| `trudax/reddit-scraper-lite` for research | Cost/quality |
| Repo = team-facing; `memory/` = local only | Ring 2/3 boundary |
| No coding until spec freeze | This session |

---

## What I'll do while you're away (no blockers)

- [x] `ARCHITECTURE.md`
- [x] `WORK_PLAN.md`
- [x] `policy-artifact.schema.json`
- [x] Boardroom protocol + MVP scope
- [x] Roleplay scenario 001
- [x] Stakeholder journey map (R5)
- [x] Fake-door copy draft
- [x] `DECISION_LOG.md` with recommended defaults
- [x] Seed fixtures (`tool_registry`, `org_config`)
- [x] Eval scenarios S01–S05 as JSON fixtures
- [x] Update SESSION_LATEST + RESEARCH_LEDGER

---

## Quick reply template (when back)

Copy-paste answers:

```
B01 deadline: 
B02 deployment: a / b / c
B03 persona: approve / edits: 
B04 stack: 
B05 split: teammate=UI, me=boardroom (example)
B06 fake-door budget: yes €__ / no / later
B12 r/gdpr retry: yes / no
```
