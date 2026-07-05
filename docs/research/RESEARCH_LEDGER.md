# Research & validation ledger

Facts verified before and during the hackathon build. Status: **verified** | **cancelled**.

Last updated: 2026-07-06

---

## Summary

| ID | Question | Status | Artifact |
|----|----------|--------|----------|
| R1 | EU AI Act audit fields → gateway schema | verified | [`01_eu_ai_act_audit_trail.md`](01_eu_ai_act_audit_trail.md) |
| R2 | Betriebsrat hard stop for DE enterprises | verified | [`02_betriebsrat_co_determination.md`](02_betriebsrat_co_determination.md) |
| R3 | EU enterprise AI adoption pain points | verified | [`evidence/corpus.jsonl`](evidence/corpus.jsonl) (55 items) |
| R4 | Fake-door PMF test ("Book demo" LP) | **cancelled** | Not pursued post-hackathon |
| R5 | Hidden actors in approval chain | verified | [`stakeholders/journey_map.md`](stakeholders/journey_map.md) |
| R6 | Market positioning (enforcement vs GRC) | verified | One-liner in [`../hackathon/EVIDENCE_CHAIN.md`](../hackathon/EVIDENCE_CHAIN.md) |

---

## R1 — EU AI Act audit trail → code fields

**Hypothesis:** Code completion / summarization as **limited-risk GPAI deployer** does **not** trigger full Art. 12 logging on 2 Aug 2026; **Art. 50 transparency** does. Full Art. 12 schema matters when use case is **Annex III high-risk** (e.g. worker monitoring, HR).

**Working translation → `gateway-audit-event.schema.json`:**

| Legal intent | JSON field(s) |
|--------------|---------------|
| Traceability / correlation | `event_id`, `parent_event_id`, `timestamp` |
| Which system & policy | `system_id`, `policy_id`, `policy_version_hash` |
| Model identity | `model_provider`, `model_id`, `prompt_template_id` |
| Input/output without raw PII | `input_fingerprint`, `output_fingerprint` |
| Human oversight | `human_reviewer_id`, `human_override` |
| Deployer retention class | `retention_class` |
| Transparency | `disclosure_shown` |

**Detail:** [`01_eu_ai_act_audit_trail.md`](01_eu_ai_act_audit_trail.md)

---

## R2 — Betriebsrat veto line

**Product implication:** TrustFlow surfaces `BETRIEBSVEREINBARUNG_PENDING` as a first-class gate, not only technical PII rules.

**Detail:** [`02_betriebsrat_co_determination.md`](02_betriebsrat_co_determination.md)

---

## R3 — Market evidence

**Status:** 55 items scraped (Reddit r/sysadmin + HN). Persona v0.1 drafted.

**Detail:** [`03_market_evidence_plan.md`](03_market_evidence_plan.md) · [`evidence/synthesis.md`](evidence/synthesis.md) · [`personas/dpo_fintech_de.md`](personas/dpo_fintech_de.md)

---

## R5 — Stakeholder journey

**Validated:** Procurement, Betriebsrat, Finance mapped to five boardroom agents.

**Detail:** [`stakeholders/journey_map.md`](stakeholders/journey_map.md)

---

## Evidence index

| File | Type |
|------|------|
| `01_eu_ai_act_audit_trail.md` | Regulatory translation |
| `02_betriebsrat_co_determination.md` | DE labor law |
| `03_market_evidence_plan.md` | Scraping protocol |
| `evidence/` | Corpus + synthesis |
| `personas/` | DPO persona |
| `roleplay/` | Demo scenario 001 |
| `stakeholders/` | Journey map |
