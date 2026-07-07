# Canonical definitions

Single source of truth for domain terms used in research, agents, and gateway code. **Consume these definitions; do not redefine downstream.**

---

## Product

### TrustFlow

A dual-layer system for enterprise AI tool adoption:

1. **Layer A — Edge Gateway:** Deterministic proxy. Enforces compiled policy (PII masking, routing, budget caps, logging). No LLM in the enforcement path.
2. **Layer B — Agent Boardroom:** Multi-agent negotiation that produces **policy artifacts** consumed by Layer A.

### Agent Society (hackathon framing)

Five agent roles in the boardroom (Procurement may merge with Compliance in thin MVP):

| Agent | Role | Persistence |
|-------|------|-------------|
| **Workflow Runner** | Advocates for a specific employee/tool request | Ephemeral per request |
| **Corporate Compliance** | GDPR, EU AI Act, audit trail requirements | Permanent |
| **IT & Infra** | Cost, sovereignty, routing (cloud vs local model) | Permanent |
| **Procurement & Vendor Risk** | DPA, subprocessor list, VRM | Permanent |
| **Works Council Liaison** | Betriebsvereinbarung, DE co-determination | Permanent (DE entities) |

Output of negotiation: a **compiled policy** (see Policy Artifact). Full protocol: `docs/boardroom_protocol.md`.

---

## Policy artifact

Machine-readable ruleset pushed to the edge gateway. Working name: `rules.json`.

Must be **versioned**, **hashable**, and **attributable** (which agents/versions produced it, when).

See `docs/schemas/gateway-audit-event.schema.json` for runtime log shape; `docs/schemas/policy-artifact.schema.json` for compiled policy shape.

---

## Risk tiers (EU AI Act)

Used when classifying a tool request. Source: Regulation (EU) 2024/1689.

| Tier | Meaning for TrustFlow | Example tools |
|------|----------------------|---------------|
| **Prohibited** | Hard block at gateway | Workplace emotion recognition (Art. 5) |
| **High-risk (Annex III)** | Full Art. 12 logging + Art. 26 deployer duties | HR screening, worker performance monitoring |
| **Limited risk** | Art. 50 transparency (disclosure, labeling) | Chatbots, summarization, code completion |
| **Minimal / GPAI deployer** | General law + literacy; no Annex III cliff | Internal productivity assistants |

**Timeline note (2026-06):** Digital Omnibus *provisional* agreement postpones Annex III high-risk obligations to **2 Dec 2027** (not yet OJ-published). **Art. 50 transparency still targets 2 Aug 2026.** Plan for both dates until Omnibus is law.

---

## Stakeholders (Germany / EU enterprise)

| Actor | Primary concern | TrustFlow touchpoint |
|-------|-----------------|----------------------|
| **Employee / Runner** | Get tool access fast | Initiates request via Runner agent |
| **DPO / Legal** | GDPR, subprocessors, DPIA | Compliance agent; audit logs |
| **Betriebsrat** | § 87 BetrVG co-determination on monitoring-capable systems | Works agreement / annex before rollout |
| **IT / CISO** | Shadow AI, keys, cost | Infra agent; gateway routing |
| **Procurement** | Vendor DPAs, EU residency | Tool schema in request packet |

---

## Audit event (gateway log)

One JSON record per governed inference or policy decision at the gateway. Canonical field list in `docs/schemas/gateway-audit-event.schema.json`.

Distinction:

- **Gateway audit event** — what TrustFlow controls (always-on for governed traffic).
- **Art. 12 high-risk log** — superset required only when the *deployed use case* is high-risk under Annex III.

---

## Betriebsrat co-determination trigger (working)

**§ 87(1) No. 6 BetrVG:** Co-determination when introducing technical means **objectively capable** of monitoring employee behavior or performance — intent to monitor is not required (BAG 1 ABR 20/21, Office 365 line of cases).

For TrustFlow product design: any enterprise AI gateway with **per-user audit logs** likely triggers co-determination in DE companies with a works council. Mitigation is **governance process** (Rahmen-Betriebsvereinbarung + per-tool annex), not technical bypass.

**Not a permanent veto:** Betriebsrat has Mitbestimmung (co-design), not unlimited prohibition. Deadlock → Einigungsstelle (conciliation board).

---

## Open definitions (TBD after validation)

- FinTech-specific retention (Art. 26(6) financial institution carve-out) — see BLOCKED B13
- Mapping from tool category → required log fields — partial in policy schema `audit.required_fields`
- Deployment model (customer-hosted vs SaaS) — see BLOCKED B02

Track in `docs/research/RESEARCH_LEDGER.md`.
