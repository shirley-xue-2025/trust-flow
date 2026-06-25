# R2 — Betriebsrat: co-determination and the practical veto line

**Question:** When a German works council blocks (or stalls) enterprise AI tools, what is the actual legal trigger — and what would make them say yes?

**Short answer:** The hard gate is **§ 87(1) No. 6 BetrVG** — co-determination on technical systems **objectively capable** of monitoring employee behavior or performance. Enterprise AI with **per-user audit logs** almost always qualifies. EU AI Act compliance **does not replace** this; Art. 26(7) adds worker-representative notification for **high-risk** workplace AI.

---

## Legal triggers

### § 87(1) No. 6 BetrVG — Mitbestimmung

> Co-determination on the introduction and use of technical devices designed to monitor the behavior or performance of employees.

**Key case law principle (BAG 1 ABR 20/21 — Office 365):**

- **Objective capability** to monitor suffices.
- Employer **need not intend** to use monitoring features.
- Audit logs / usage telemetry → typically sufficient for KI tools (ChatGPT Enterprise, M365 Copilot cited in practitioner guides).

**Consequence without agreement:**

- Introduction is **unwirksam** (invalid).
- Betriebsrat can seek **Unterlassung** (injunction).
- Data use may be blocked.

**Not an absolute veto:** Mitbestimmung = co-design right. If parties disagree → **Einigungsstelle** (conciliation board) per § 87(2).

### § 90(1) No. 3 BetrVG — Information

Employer must inform Betriebsrat **in good time before** introducing AI — **before** irreversible purchase/commitment.

### § 80(3) BetrVG — External expert

Betriebsrat may appoint an expert for AI assessments; **employer pays**.

### EU AI Act Art. 26(7)

Deployers who are employers must inform **workers' representatives and affected workers** before putting **high-risk** AI into service at the workplace.

**Layering:** GDPR + BetrVG + EU AI Act stack; satisfying one does not satisfy the others.

---

## What Betriebsrat typically demands (Rahmen-Betriebsvereinbarung)

From practitioner templates and commentary (secondary sources — validate in interviews):

| Theme | Common BR requirement | TrustFlow mapping |
|-------|----------------------|-------------------|
| Transparency | Published list of approved AI tools, updated quarterly | Tool registry in policy artifact |
| Purpose limitation | No performance scoring from AI logs | Compliance agent rule: `no_performance_inference_from_logs` |
| Prohibited uses | No emotion recognition; no automated firing decisions | Gateway deny rules |
| Data residency | EU processing, subprocessor list | Infra agent routing + DPA packet |
| Logging scope | What is logged, retention, who can access | Audit schema + access RBAC |
| Training | Art. 4 AI literacy | Out of product scope; workflow hook |
| Per-tool annex | Each new tool needs BR addendum | `betriebsvereinbarung_status` per `tool_id` |

---

## The "one vote no" line (product language)

**Hypothesis for TrustFlow deny_reason codes:**

| Code | Trigger |
|------|---------|
| `BETRIEBSVEREINBARUNG_PENDING` | No works agreement / annex for this tool in DE entity |
| `MONITORING_CAPABILITY_UNBOUNDED` | Tool logs user activity but agreement lacks logging scope clause |
| `HIGH_RISK_WORKPLACE_NO_ART_26_7` | High-risk use without documented worker rep notification |
| `EXPERT_REVIEW_PENDING` | BR invoked § 80(3) expert review not complete |

The **first** line most enterprises hit in practice is **`BETRIEBSVEREINBARUNG_PENDING`** — not a missing JSON field in Art. 12.

---

## Negotiation dynamics (for synthetic DPO/BR roleplay)

**Conservative German mid-size fintech DPO persona traits:**

- Assumes any cloud LLM = subprocessor risk until DPA reviewed
- Treats prompt content as potential personal data (customer names in support tickets)
- Insists logs exclude raw prompts; fingerprints only
- Requires local-model route for anything touching transaction data
- Will not sign off without BR alignment in DE entities

**BR persona traits (distinct from DPO):**

- Cares about **employee surveillance** narrative, not just GDPR
- Asks "can my manager see how fast I type in Copilot?"
- Wants quarterly tool list publication to staff
- May accept tool if logs are **aggregate-only** for compliance, not line-manager dashboards

---

## Stakeholder chain (Germany)

```
Employee
  ↓ request
Line manager
  ↓
IT (security review, SSO)
  ↓
Procurement (vendor + DPA)  ← often underestimated
  ↓
DPO (DPIA, legal basis)
  ↓
Betriebsrat (§ 87 / § 90)   ← hard gate for DE
  ↓
Einigungsstelle (if deadlock)
  ↓
Rollout
```

TrustFlow "Agent Society" should include **Procurement** and **Betriebsrat** as explicit actors — not only Legal + IT.

---

## Sources

| Source | URL |
|--------|-----|
| EU AI Act Art. 26 | https://artificialintelligenceact.eu/article/26/ |
| § 87 BetrVG practitioner guide (DE) | https://skill-sprinters.de/blog/compliance/betriebsrat-ki-einfuehrung-87-betrvg-2026/ |
| EN summary — AI agents & BR | https://www.paperclipped.de/en/blog/ai-agents-works-council-germany/ |
| Rahmen-BV commentary | https://betriebsrat-kanzlei.de/rahmen-betriebsvereinbarung-ki-darauf-ist-zu-achten/ |

---

## Open questions

- [ ] Interview 1 DE Betriebsrat member or employment lawyer to validate template demands
- [ ] Clarify: does **aggregate** token billing without per-prompt logs avoid § 87? (Likely **no** if capability exists in product)
- [ ] Konzernbetriebsrat rules for multi-entity fintech

## Confidence

| Claim | Confidence |
|-------|------------|
| § 87 triggered by audit-capable AI | High |
| Exact BR template clauses | Medium (secondary sources only) |
| BAG 2026 "every AI" headlines | Medium — verify primary judgment text |
