# Pitch deck outline — Track 3 Agent Society

**Format:** ~9 slides · export to PPT from this outline or build HTML later  
**Diagram assets:** [`diagrams/architecture.png`](diagrams/architecture.png) · [`diagrams/round_schedule.png`](diagrams/round_schedule.png)

---

## Slide 1 — Problem: approval deadlock + shadow AI

**Headline:** Enterprise AI fails on approvals, not models.

**Visual:** Strategy explorer screenshot (`prototypes/trustflow_strategy_explorer.html` — separate from glassbox pipeline)

**Bullets:**
- Weeks of Legal / IT / Procurement / Betriebsrat email before one tool goes live
- Shadow AI fills the gap (21/55 corpus items: `approval_process`)
- Policy PDFs nobody enforces at the gateway

**Speaker note:** Anti-Jira — we're not another ticket queue.

---

## Slide 2 — Track 3 fit: decompose · negotiate · measure

**Headline:** Built for Agent Society judging criteria.

| Criterion | TrustFlow proof |
|-----------|-----------------|
| **Task decomposition** | 5 agents × 6 rounds — Runner, Procurement, Compliance, Works Council, IT |
| **Disagreement resolution** | S04 compromise (sovereign route) · S05 procurement veto · appeal + HITL |
| **Efficiency baseline** | Golden replay seconds vs weeks (illustrative) · single-agent misses DPA/BR gates |

**Visual:** [`diagrams/round_schedule.png`](diagrams/round_schedule.png)

---

## Slide 3 — Architecture: three layers

**Headline:** Generative negotiation → deterministic enforcement.

**Visual:** [`diagrams/architecture.png`](diagrams/architecture.png) — from `ARCHITECTURE.md` §2 mermaid

**Bullets:**
- **Layer B** — Agent boardroom (Qwen Cloud) → Policy Proposal
- **Compiler** — schema-validated `rules.json` + `policy_version_hash`
- **Layer A** — Edge gateway in customer VPC — PII, routing, deny codes, audit
- **Layer C** — Human sign-off before activation

**Hybrid deploy callout:** Layer A on-prem/VPC · Layer B on Qwen Cloud (hackathon sponsor alignment)

---

## Slide 4 — Agent society: S04 negotiation trace

**Headline:** Watch stakeholders negotiate in seconds.

**Visual:** `<!-- TODO: screenshot employee_negotiation_s04.png -->` — transcript with stance chips

**Callouts on slide:**
- Round 2: Compliance **Conditional** — `LOCAL_QWEN_72B` for payment schemas
- Round 3: Works Council — Betriebsvereinbarung signed for pilot
- Round 4: IT — budget cap + sovereign route

**Speaker note:** Boardroom UI is the money shot for judges.

---

## Slide 5 — Single-agent vs multi-agent baseline

**Headline:** More agents ≠ slower — better gates.

| Dimension | Single generic agent | TrustFlow multi-agent (eval fixtures) |
|-----------|---------------------|--------------------------------------|
| **Wall-clock (demo)** | ~1 API call | ~6 rounds, **seconds** with golden replay |
| **S04 quality** | Risk: approves without sovereign route / audit fields | Compromise: `LOCAL_QWEN_72B`, fingerprint logs, financial retention |
| **S05 quality** | Risk: approves ChatGPT without DPA | **DENIED** — procurement veto holds (unsigned OpenAI DPA) |
| **BR / §87** | Often omitted in English tooling | Works Council Liaison lane + `BETRIEBSVEREINBARUNG_PENDING` |
| **Enforcement** | Policy text only | Compiled hash enforced at gateway |

**Footnote:** Time compression "weeks → seconds" = **illustrative** (strategy explorer 98% is projection, not measured SLA).

---

## Slide 6 — HITL: one-click activation on policy diff

**Headline:** Agents recommend; humans activate.

**Visual:** Governance **Human sign-off** panel — DPO + IT parallel reviews

**Bullets:**
- Status **Pending sign-off** — no gateway until humans sign
- Rationale ≥20 chars → audit trail `human_sign_off`
- **30-second sign-off UX target** (demo rehearsal)

---

## Slide 7 — Gateway + audit: sovereign route & Art. 50

**Headline:** Deterministic edge — no LLM in enforcement path.

**Visual:** Glassbox **Gateway enforce** node inspector — email MASK vs IBAN BLOCK side-by-side

**Bullets:**
- `disclosure_shown` on audit events (EU AI Act Art. 50 transparency)
- `pii_actions`: email MASK · IBAN BLOCK — regex policy, honest demo scope
- `routing_decision: LOCAL_QWEN_72B` for sensitive payment data
- Schema: `gateway-audit-event.schema.json`

**Do NOT claim:** Presidio, PII round-trip restore.

---

## Slide 8 — Wedge: TrendAI / Naaia quadrant + DE Betriebsrat

**Headline:** Bridge security enforcement and compliance workflow.

**Visual:** Quadrant chart from `06_competitor_inspiration_for_trustflow.md`

| Vendor | Pole |
|--------|------|
| **TrendAI** | High enforcement · low regulatory workflow |
| **Naaia** | High regulatory workflow · weak runtime enforcement |
| **TrustFlow** | Both — boardroom + gateway |

**Positioning line:**
> TrendAI secures AI like a firewall. Naaia documents AI like a GRC system. TrustFlow negotiates AI like a boardroom and enforces AI like a gateway.

**DE wedge:** §87 BetrVG co-determination — neither competitor emphasizes Works Council gate.

**LiteLLM footnote:** Dev proxy for model routing during build — not the product story.

---

## Slide 9 — CTA

**Headline:** Ship AI with signatures.

**Links (placeholders):**
- GitHub: `https://github.com/shirley-xue-2025/trust-flow` _(public before July 9)_
- Live demo: _TBD — Max ECS URL_
- Demo video: _TBD — 5 min max_
- Devpost: `https://qwencloud-hackathon.devpost.com`

**Stack:** Qwen-Max boardroom · Node/Fastify gateway · React UI · Alibaba Cloud ECS

---

## Track 3 checklist (deck)

- [x] Decomposition — slides 2, 4, round diagram
- [x] Negotiation — slides 4, 5, 6
- [x] Baseline — slide 5 (labeled illustrative where needed)

**Next:** Record video following [`../DEMO_SCRIPT.md`](../DEMO_SCRIPT.md) beats.
