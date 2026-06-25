# Research & validation ledger

Master checklist for facts we must verify before building the boardroom core. Status: **open** | **in_progress** | **verified** | **deferred**.

Last updated: 2026-06-25

---

## Priority queue

| ID | Question | Status | Owner | Blocker for |
|----|----------|--------|-------|-------------|
| R1 | What audit fields are **legally required** for productivity AI vs high-risk? | verified (planning) | — | Gateway schema, Compliance agent memory |
| R2 | Where is the Betriebsrat **hard stop** for DE enterprises? | verified (planning) | — | Agent negotiation scripts, deny_reason codes |
| R3 | What pain points appear in real EU enterprise discourse? | verified (v1) | — | Synthetic DPO persona, PMF narrative |
| R4 | Will buyers click "Book demo" on a compliance-first landing page? | open | — | Fake-door test (post-research) |
| R5 | Hidden actors in approval chain beyond DPO/Legal/IT? | verified | — | Agent society completeness |

---

## R1 — EU AI Act audit trail → code fields

**Hypothesis:** Code completion / summarization as **limited-risk GPAI deployer** does **not** trigger full Art. 12 logging on 2 Aug 2026; **Art. 50 transparency** does. Full Art. 12 schema matters when use case is **Annex III high-risk** (e.g. worker monitoring, HR).

**Verified facts:**

| Claim | Source | Confidence |
|-------|--------|--------------|
| Art. 12 requires automatic lifetime logs for **high-risk** systems | [Art. 12](https://artificialintelligenceact.eu/article/12/) | High |
| Deployers must retain logs ≥ **6 months** (Art. 26(6)) | [Art. 26](https://artificialintelligenceact.eu/article/26/) | High |
| Art. 50 transparency still on **2 Aug 2026** track | [Digital Omnibus summary](https://www.aiactblog.nl/en/posts/digital-omnibus-high-risk-postponement-december-2027) | Medium (Omnibus not OJ yet) |
| Annex III high-risk likely **2 Dec 2027** if Omnibus passes | Parliament/Council provisional agreement, Jun 2026 | Medium |
| Productivity tools (writing, code assist) = **limited risk** for most B2B | Industry guides + Annex III scope | Medium |

**Working translation → `gateway-audit-event.schema.json`:**

| Legal intent | JSON field(s) |
|--------------|---------------|
| Traceability / correlation | `event_id`, `parent_event_id`, `timestamp` |
| Which system & policy | `system_id`, `policy_id`, `policy_version_hash` |
| Model identity (Art. 12 traceability practice) | `model_provider`, `model_id`, `prompt_template_id` |
| Input/output without raw PII | `input_fingerprint`, `output_fingerprint` |
| Human oversight | `human_reviewer_id`, `human_override` |
| Deployer retention class | `retention_class` |
| Transparency | `disclosure_shown` |

**Still open:**

- [ ] Confirm finTech deployer retention under sector law (Art. 26(6) carve-out)
- [ ] Map Annex III point 4(b) "monitoring workers" to gateway logging features
- [ ] Validate schema with one external counsel / DPO interview

**Detail:** [`01_eu_ai_act_audit_trail.md`](01_eu_ai_act_audit_trail.md)

---

## R2 — Betriebsrat veto line

**Hypothesis:** The practical "no-go" is not EU AI Act alone — it's **missing Betriebsvereinbarung** under § 87(1) No. 6 BetrVG when the tool can log user activity, plus **§ 90** timely information before purchase.

**Verified facts:**

| Claim | Source | Confidence |
|-------|--------|--------------|
| Objective capability to monitor → co-determination | BAG 1 ABR 20/21 (Office 365); DE commentary | High |
| ChatGPT Enterprise / Copilot with audit logs → mitbestimmungspflichtig | [skill-sprinters.de](https://skill-sprinters.de/blog/compliance/betriebsrat-ki-einfuehrung-87-betrvg-2026/) | Medium (secondary) |
| Art. 26(7) — inform workers' reps before high-risk workplace AI | EU AI Act Art. 26(7) | High |
| BR cannot ban AI outright; deadlock → Einigungsstelle | Standard BetrVG commentary | High |

**Product implication:** TrustFlow should surface `BETRIEBSVEREINBARUNG_PENDING` as a first-class gate, not only technical PII rules.

**Detail:** [`02_betriebsrat_co_determination.md`](02_betriebsrat_co_determination.md)

---

## R3 — Market evidence (synthetic interview fuel)

**Method:** Scrape Reddit (r/sysadmin, r/legaltech, r/gdpr), G2 reviews, LinkedIn posts — DE/EU enterprise AI adoption, GDPR blockers, token cost. Feed 20–50 excerpts into persona construction.

**Status:** Batch 001 (practitioner) approved. Batch 002 (community) scraped — 55 items, $0.56 Apify total. Persona v0.1 drafted.

**Detail:** [`03_market_evidence_plan.md`](03_market_evidence_plan.md) · [`evidence/synthesis.md`](evidence/synthesis.md) · [`personas/dpo_fintech_de.md`](personas/dpo_fintech_de.md)

---

## R4 — Fake-door PMF test

**Deferred until:** R1–R3 sufficient for credible landing copy.

**Sketch:** Framer/Webflow LP, Tally form, small LinkedIn ad to IT managers / compliance officers in DACH+EU.

---

## R5 — Hidden actors & touchpoints

**Initial map (hypothesis):**

```
Employee request
  → Line manager (budget sponsor)
  → IT security (tool allowlist, SSO)
  → Procurement (DPA, vendor assessment)
  → DPO (DPIA, subprocessor list)
  → Betriebsrat (§ 87 / Rahmen-BV)
  → Works council external expert (§ 80(3)) 
  → CISO (incident, logging retention)
  → Finance (chargeback / token budget)
```

Validate via R3 evidence + synthetic DPO roleplay (next phase).

**Validated:** [`stakeholders/journey_map.md`](stakeholders/journey_map.md) — Procurement, BR, Finance added; maps to 5 agents.

---

## Evidence index

| File | Type |
|------|------|
| `01_eu_ai_act_audit_trail.md` | Regulatory translation |
| `02_betriebsrat_co_determination.md` | DE labor law |
| `03_market_evidence_plan.md` | Scraping protocol |
| `evidence/` | Raw excerpts (future) |
