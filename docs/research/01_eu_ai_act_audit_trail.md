# R1 — EU AI Act: audit trail requirements for productivity AI

**Question:** For enterprise "productivity AI" (code completion, summarization), what must an audit log contain — and by when?

**Short answer (2026-06-25):**

1. **Most productivity tools = limited-risk deployer**, not Annex III high-risk → **no Art. 12 mandatory field list** on the Aug 2026 cliff for typical code/summary use.
2. **Aug 2026 still matters** for **Art. 50 transparency** (AI disclosure, synthetic content marking) and general GPAI downstream duties.
3. **If** the same gateway also serves **high-risk** use cases (HR screening, worker performance monitoring per Annex III §4), **Art. 12 + Art. 26(6)** apply — with Annex III obligations likely slipping to **2 Dec 2027** if Digital Omnibus is adopted (provisional, not yet OJ law).

TrustFlow should implement **one gateway log schema** that satisfies limited-risk operations today and scales to high-risk without a rewrite.

---

## Primary sources

### Article 12 — Record-keeping (high-risk providers)

> High-risk AI systems shall technically allow for the automatic recording of events (logs) over the lifetime of the system.

Logging must support traceability for:

- Risk situations and substantial modifications (Art. 79)
- Post-market monitoring (Art. 72)
- Deployer operation monitoring (Art. 26(5))

Biometric ID systems (Annex III §1(a)) have **minimum** fields: use period, reference DB, matched input, verifier identity.

**Source:** [Art. 12 — EU AI Act](https://artificialintelligenceact.eu/article/12/)

### Article 26 — Deployer obligations

Relevant for TrustFlow as **deployer** of integrated AI:

| Para | Requirement | Product implication |
|------|-------------|---------------------|
| 26(5) | Monitor operation per instructions; report risks | Gateway metrics + alerting |
| 26(6) | Keep auto-generated logs ≥ **6 months** (unless sector law differs) | `retention_class` in schema |
| 26(7) | Inform workers' representatives before **high-risk** workplace use | Boardroom gate + BR workflow |
| 26(9) | Use provider info for DPIA (GDPR Art. 35) | Tool packet for DPO agent |

**Source:** [Art. 26 — EU AI Act](https://artificialintelligenceact.eu/article/26/)

### Article 50 — Transparency (limited risk)

Applies to chatbots / systems where users could think they interact with a human. Requires clear disclosure — **not** the Art. 12 log field enumeration.

**Source:** [Art. 50 — EU AI Act](https://artificialintelligenceact.eu/article/50/)

---

## Classification: productivity AI

| Use case | Typical tier | Art. 12 full logging? |
|----------|--------------|----------------------|
| Code completion in IDE | Limited / minimal | No (unless embedded in high-risk workflow) |
| Meeting summarization | Limited | No |
| Internal chatbot for IT FAQ | Limited (Art. 50 disclosure) | No |
| CV screening | Annex III high-risk | **Yes** |
| Performance scoring / monitoring workers | Annex III high-risk | **Yes** |
| Emotion recognition at work | **Prohibited** (Art. 5) | N/A — block |

Annex III §4 (employment, workers management) is the main trap: a **general-purpose gateway** must classify **per request**, not per tool globally.

---

## Digital Omnibus timeline (provisional, Jun 2026)

| Obligation | Original | Provisional new date |
|------------|----------|----------------------|
| Art. 50 transparency | 2 Aug 2026 | 2 Aug 2026 (unchanged) |
| Annex III high-risk (Ch. III §§1–3) | 2 Aug 2026 | **2 Dec 2027** |
| Annex I embedded high-risk | 2 Aug 2027 | **2 Aug 2028** |

Until published in the Official Journal, **2 Aug 2026 remains on the books** for high-risk — plan defensively.

**Sources:**

- [Gibson Dunn — Omnibus agreement](https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/)
- [aiactblog.nl — what still applies](https://www.aiactblog.nl/en/posts/digital-omnibus-high-risk-postponement-december-2027)

---

## Industry practice → proposed minimum fields

Synthesis from implementation guides (secondary sources — not law):

| Field category | Fields | Rationale |
|----------------|--------|-----------|
| Identity | `event_id`, `timestamp`, `system_id` | Ordering, incident reconstruction |
| Policy | `policy_id`, `policy_version_hash` | Prove which rules were enforced |
| Actor | `actor_id` (pseudonymous) | Accountability without raw PII in log |
| Model | `model_provider`, `model_id`, `prompt_template_id` | "Different system prompt = different system" |
| Data | `input_fingerprint`, `output_fingerprint` | Trace without storing prompts (GDPR) |
| Enforcement | `pii_actions`, `routing_decision`, `outcome` | Gateway determinism proof |
| Human | `human_override`, `human_reviewer_id` | Art. 14 oversight chain |
| Compliance meta | `disclosure_shown`, `retention_class`, `risk_tier` | Art. 50 + retention |

Canonical schema: [`../schemas/gateway-audit-event.schema.json`](../schemas/gateway-audit-event.schema.json)

---

## Code判定条件 (legal phrase → enforceable rule)

Draft rules for Compliance agent / gateway:

```yaml
# LIMITED_RISK_PRODUCTIVITY
when:
  tool_category in [code_completion, summarization, translation]
  and not annex_iii_employment_use
then:
  require_fields: [event_id, timestamp, model_id, actor_id, outcome, disclosure_shown]
  retention_months: 6
  art_12_full: false

# HIGH_RISK_ANNEX_III
when:
  use_case matches annex_iii_section_4  # employment / worker management
then:
  require_fields: ALL_SCHEMA_REQUIRED
  retention_months: max(6, sector_minimum)
  art_12_full: true
  require_human_oversight: true
  require_worker_rep_notification: true  # Art. 26(7)

# PROHIBITED
when:
  use_case in [workplace_emotion_recognition, social_scoring, ...]
then:
  outcome: denied
  deny_reason_code: PROHIBITED_PRACTICE
```

---

## Open questions

1. Does a **fintech deployer** treating logs as "internal governance documentation" satisfy Art. 26(6) without separate storage? (Art. 26(6) second subparagraph)
2. When Copilot logs are held by **Microsoft** not deployer, what must TrustFlow still capture at the gateway?
3. Harmonised standards for Art. 12 — not final as of Jun 2026; revisit when CEN/CENELEC publish.

---

## Confidence

| Section | Confidence |
|---------|------------|
| Art. 12/26 primary text | High |
| Productivity = limited risk (general case) | Medium-high |
| Omnibus dates | Medium (political agreement only) |
| Exact JSON field list as legal mandate | Low — **engineering best practice**, not statute |
