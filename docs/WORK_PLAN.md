# TrustFlow — work plan

**Status:** Pre-build roadmap (2026-06-25).  
**Assumption:** Hackathon demo is the near-term milestone; fake-door and productization follow.

---

## Phase summary

| Phase | Name | Status | Output |
|-------|------|--------|--------|
| **0** | Research & validation | **~90% done** | Corpus, personas, R1/R2 drafts, schemas |
| **1** | Spec freeze | **Ready to start** | Signed architecture, scenarios, stack choice |
| **2** | Boardroom core | Not started | Multi-agent negotiation → policy proposal |
| **3** | Gateway simulator | Not started | Allow/deny + audit emit |
| **4** | Demo UI + pitch | Not started | 5-min flow, video |
| **5** | PMF fake door | Blocked on Shirley | LP + ads + leads |

---

## Phase 0 — Research (complete enough to build)

| Task | Status | Artifact |
|------|--------|----------|
| EU AI Act audit translation | Draft verified | `research/01_*`, audit schema |
| Betriebsrat gate | Draft verified | `research/02_*` |
| Market corpus | Done | `evidence/corpus.jsonl` (55 items) |
| DPO persona v0.1 | Done | `personas/dpo_fintech_de.md` |
| Product architecture | Done | `ARCHITECTURE.md` |
| Policy schema | Done | `schemas/policy-artifact.schema.json` |
| Boardroom protocol | Done | `plans/boardroom_protocol.md` |
| Roleplay scenario 001 | Done | `research/roleplay/scenario_001_*` |
| Stakeholder journey | Done | `research/stakeholders/journey_map.md` |

**Remaining research (optional, not blocking MVP):**

- r/gdpr scrape retry (~$0.30)
- Real DPO interview (Shirley network)
- G2 reviews manual sample

---

## Phase 1 — Spec freeze (1–2 sessions, no heavy code)

| # | Task | Owner | Depends on |
|---|------|-------|------------|
| 1.1 | Shirley: confirm architecture + deployment model | Shirley | BLOCKED |
| 1.2 | Shirley + teammate: pick stack (Python vs Node) | Both | BLOCKED |
| 1.3 | Freeze hackathon MVP scope (`hackathon_mvp_scope.md`) | Shirley | 1.1 |
| 1.4 | Persona gut-check (`dpo_fintech_de.md`) | Shirley | — |
| 1.5 | Add `tool_registry.seed.json` (3 tools: Copilot, ChatGPT Ent, local Qwen) | Agent | 1.3 |
| 1.6 | Add `org_config.seed.json` (DE fintech, BR pending) | Agent | 1.3 |
| 1.7 | Write eval scenario fixtures S01–S05 | Agent | 1.4 |

**Exit criteria:** `DECISION_LOG.md` has D001–D005 recorded; no open P0 blockers.

---

## Phase 2 — Boardroom core (build)

| # | Task | Est. | Notes |
|---|------|------|-------|
| 2.1 | Project skeleton in `src/` per PROJECT_STRUCTURE | 2h | |
| 2.2 | Qwen client + agent prompt templates | 4h | 5 agents |
| 2.3 | Session state machine (`boardroom_protocol.md`) | 4h | |
| 2.4 | Policy proposal merger / compiler | 4h | **No LLM** |
| 2.5 | Scenario 001 automated run | 2h | Golden transcript optional |
| 2.6 | Unit tests: compiler + schema validation | 3h | |

**Exit criteria:** S01 + S02 produce valid `policy-artifact` JSON; S03 returns DENIED.

---

## Phase 3 — Gateway simulator (build)

| # | Task | Est. | Notes |
|---|------|------|-------|
| 3.1 | Load policy by id/hash | 2h | |
| 3.2 | PII regex pass (IBAN, email) | 2h | |
| 3.3 | Routing stub (CLOUD vs LOCAL enum) | 1h | |
| 3.4 | Deny reason enforcement | 2h | |
| 3.5 | Audit event writer | 2h | Validate against schema |
| 3.6 | Integration test: policy → inference → log | 2h | |

**Exit criteria:** Demo path from Phase 4 works on CLI before UI.

---

## Phase 4 — Demo UI + pitch (build)

| # | Task | Est. | Notes |
|---|------|------|-------|
| 4.1 | Request form UI | 3h | |
| 4.2 | Boardroom transcript view | 4h | |
| 4.3 | Policy JSON panel + hash | 2h | |
| 4.4 | Inference playground | 3h | |
| 4.5 | Wire strategy explorer | 1h | |
| 4.6 | Record 5-min video | 2h | Shirley voice? |
| 4.7 | README quickstart for judges | 1h | |

**Exit criteria:** Cold demo in <3 min; fallback canned run if API down.

---

## Phase 5 — PMF fake door (post-hackathon or parallel)

| # | Task | Owner | Blocked? |
|---|------|-------|----------|
| 5.1 | LP copy (`research/pmf/fake_door_copy.md`) | Agent drafted | |
| 5.2 | Framer/Webflow build | Shirley/teammate | Yes — brand |
| 5.3 | Tally form + UTM | Shirley | Yes |
| 5.4 | LinkedIn ads €? | Shirley | Yes — budget |
| 5.5 | Measure CTR / demo requests | — | After 5.4 |

---

## Parallel workstreams (teammate)

| Stream | Suggested owner | Tasks |
|--------|-----------------|-------|
| **Frontend / demo polish** | Teammate | Phase 4 UI, strategy explorer integration |
| **Boardroom prompts** | Either | Agent persona tuning, German legal tone |
| **Gateway / infra** | Either | Phase 3, docker compose |
| **Pitch narrative** | Shirley | Video script, judge Q&A |

*Assignment blocked until Shirley syncs with teammate.*

---

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Qwen API latency in live demo | Medium | High | Canned transcript fallback |
| Over-scoped agent count | Medium | Medium | Merge Procurement into Compliance for MVP |
| Legal claims challenged by judges | Low | High | "Illustrative compliance" disclaimer; cite R1 sources |
| Betriebsrat oversimplified | Medium | Medium | Persona + R2 doc in appendix |
| Teammate stack mismatch | Medium | Medium | Phase 1.2 decision |

---

## Timeline (illustrative — needs hackathon date from Shirley)

```
Week 0 (now)     Phase 0 complete, Phase 1 spec freeze
Week 1           Phase 2 boardroom
Week 2           Phase 3 gateway + Phase 4 UI start
Week 3           Phase 4 polish + video
Week 4+          Phase 5 fake door (optional)
```

**Blocked:** actual hackathon deadline — see `BLOCKED_ON_SHIRLEY.md`.

---

## Definition of "ready to code"

All true:

- [x] Architecture doc exists
- [x] Policy + audit schemas exist
- [x] Boardroom protocol defined
- [x] MVP scope bounded
- [x] Demo scenario written
- [ ] Shirley confirmed deployment model
- [ ] Shirley confirmed persona red lines
- [ ] Stack chosen with teammate
- [ ] Hackathon date known
