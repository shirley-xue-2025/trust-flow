# Hackathon MVP scope — Track 3: Agent Society

**Goal:** 5-minute demo proving **autonomous multi-agent negotiation → deterministic policy → governed inference** in a EU enterprise narrative.

---

## In scope (must ship)

| # | Deliverable | Demo moment |
|---|-------------|-------------|
| 1 | **Boardroom UI** — 5 agents, live transcript | "Watch agents negotiate in seconds" |
| 2 | **Policy compiler** — JSON out, version hash | "This is what the gateway enforces" |
| 3 | **Gateway simulator** — 1–2 inference paths (allow + deny) | "PII blocked at edge, no hallucination" |
| 4 | **Audit event** — emit sample log line | "Art. 26-ready trail" |
| 5 | **Scenario 001 roleplay** — payments team / Claude / DE entity | Story arc for judges |
| 6 | **Strategy explorer** — link or embed | Problem framing |

---

## Thin slice (if time-constrained)

Drop gateway simulator to **curl + static JSON response**; keep boardroom as hero.

Minimum judge story:

> Employee requests AI → agents negotiate → `rules.json` appears → gateway denies request with `PII_BLOCK` on sample IBAN → audit log line prints.

---

## Out of scope

- Real SSO, real Copilot API, production proxy scale
- Betriebsrat e-sign workflow
- Multi-tenant hosting
- Full PII NER (regex IBAN/email sufficient for demo)
- Fake-door ads (R4 — Shirley decision)

---

## Suggested demo script (5 min)

| Min | Beat |
|-----|------|
| 0:00 | Problem — approval deadlock (strategy explorer chart) |
| 0:45 | Employee submits request in UI |
| 1:00 | Boardroom rounds 0–5 (accelerated or pre-recorded fallback) |
| 2:30 | Policy JSON + hash sync to gateway |
| 3:00 | Live inference: clean prompt → allowed; IBAN prompt → masked/blocked |
| 4:00 | Audit log + deny reason codes |
| 4:30 | ROI slide — weeks → seconds (existing prototype numbers) |
| 5:00 | CTA — fake door / contact |

---

## Technical stack (proposed — not blocked)

| Layer | Choice | Why |
|-------|--------|-----|
| UI | React or static HTML + vanilla JS | Fast hackathon |
| Boardroom | Node or Python service calling Qwen API | Team skill fit TBD |
| Compiler | Same service, pure function | Testable |
| Gateway sim | Express/FastAPI middleware mock | Clear separation |
| Data | JSON files / SQLite | No DevOps |

**Blocked:** final stack — see `BLOCKED_ON_SHIRLEY.md` (teammate skills).

---

## Acceptance criteria

- [ ] Scenario S01 runs end-to-end without manual JSON editing
- [ ] Scenario S02 shows `BETRIEBSVEREINBARUNG_PENDING` deny
- [ ] Policy hash changes when Compliance demands different routing
- [ ] Audit event validates against schema
- [ ] Demo recoverable in <2 min if live LLM fails (canned transcript fallback)
