# Batch 001 — practitioner sources (tagged)

**Date:** 2026-06-25  
**Method:** Manual curation from legal/compliance guides (not Reddit yet).  
**Purpose:** Seed blocker taxonomy before Apify batch.

| ID | blocker_type | Excerpt | Source |
|----|--------------|---------|--------|
| E001 | approval_process | "Do not activate ChatGPT Enterprise company-wide until the Betriebsvereinbarung is signed." | [compound.law — ChatGPT Enterprise DE](https://compound.law/en-DE/tools/chatgpt-enterprise/) |
| E002 | approval_process | "Engage the Betriebsrat **before deployment**, not after. Retroactive justification rarely works and risks injunctive action." | compound.law |
| E003 | legal | "Admin console, SSO usage data, and audit logs — typically triggers §87 co-determination." | compound.law |
| E004 | approval_process | "Einstweilige Verfügung … In der Praxis dauert eine einstweilige Verfügung wenige Tage." | [skill-sprinters — KI Arbeitnehmerdatenschutz](https://skill-sprinters.de/blog/compliance/ki-arbeitnehmerdatenschutz-betrvg-2026-betriebsrat-mitbestimmung/) |
| E005 | shadow_ai | Private ChatGPT on personal accounts without employer log access may not trigger §87 (AG Hamburg 24 BVGa 1/24) — **enterprise-managed accounts flip back to co-determination.** | skill-sprinters / paperclipped.de |

## Tag summary (n=5)

| blocker_type | count |
|--------------|-------|
| approval_process | 3 |
| legal | 1 |
| shadow_ai | 1 |
| cost | 0 |
| technical | 0 |

## Hypothesis check

- **Betriebsrat before DPA?** Both matter; BR gate appears **earlier** in DE rollout narratives than EU AI Act article citations.
- **Token cost:** Not in this batch — need Reddit/G2 corpus.

## Next

- [ ] Shirley: confirm tags / add missing blocker types
- [ ] Add 5 Reddit/HN items with `source_type: community`
- [ ] Scale only after confirmation
