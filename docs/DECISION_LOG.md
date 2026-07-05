# Decision log

Architectural and product decisions of record. **Recommended defaults** marked — become binding unless Shirley overrides in `BLOCKED_ON_SHIRLEY.md`.

---

## D001 — Dual-layer separation (ACCEPTED)

**Decision:** Layer A (gateway) never calls LLM for enforcement; Layer B (boardroom) never pushes unvalidated JSON to gateway.

**Why:** R1 requires deterministic logging; hackathon judges must trust "no hallucination" claim.

**Date:** 2026-06-25

---

## D002 — Policy compiler is code, not LLM (ACCEPTED)

**Decision:** Agents emit proposals; deterministic compiler validates schema + org policy floor.

**Why:** Same as D001; enables unit tests (WORK_PLAN Phase 2.4).

**Date:** 2026-06-25

---

## D003 — Five agent roles for demo (RECOMMENDED DEFAULT)

**Decision:** Runner, Compliance, IT, Procurement, Works Council Liaison — with option to merge Procurement into Compliance if scope tight.

**Why:** R5 journey map + persona hidden actors (R0011, E001–E004).

**Date:** 2026-06-25

---

## D004 — Hackathon deployment: local docker compose (RECOMMENDED DEFAULT)

**Decision:** Single-tenant local demo; no SaaS processor narrative unless Shirley picks B02 option (b).

**Why:** Fastest path; avoids DPA subplot in 5-min pitch.

**Date:** 2026-06-25 · **Status:** pending Shirley confirm (B02)

---

## D005 — MVP PII: regex not ML (RECOMMENDED DEFAULT)

**Decision:** IBAN + email + simple name patterns for demo; Presidio optional stretch.

**Why:** Deterministic, testable, sufficient for "PII_BLOCK" moment.

**Date:** 2026-06-25

---

## D006 — Qwen-Max for boardroom agents (RECOMMENDED DEFAULT)

**Decision:** All agent turns via Qwen API per hackathon alignment.

**Why:** Track 3 sponsor fit.

**Date:** 2026-06-25 · **Status:** pending hackathon rules check (B01)

---

## D007 — Research corpus sufficient for v1 (ACCEPTED)

**Decision:** No further scrape unless Shirley approves B12; 55 items + practitioner batch enough for persona + positioning.

**Why:** $0.56 spent; diminishing returns before build.

**Date:** 2026-06-25

---

## D008 — Fake door deferred post-spec-freeze (ACCEPTED)

**Decision:** Copy drafted; no ad spend until B06/B07.

**Date:** 2026-06-25

---

## D009 — Canonical repo + deploy ownership (ACCEPTED)

**Decision:** `shirley-xue-2025/trust-flow` `main` is the only product source of truth. Max (`maxmedina05`) owns Alibaba ECS redeploy; Shirley owns code and demo verification. Max's fork is not merged into canonical (verified 2026-07-05: fork only *behind*, not ahead). Live ECS pulls from canonical on redeploy, not fork.

**Why:** Fork diverged after early deploy; Shirley shipped HITL demo on canonical. Avoid dual-repo drift.

**Doc:** [`DEPLOY_AND_REPO_COORDINATION.md`](DEPLOY_AND_REPO_COORDINATION.md)

**Date:** 2026-07-05
