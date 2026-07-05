# Pitch deck outline — Track 3 Agent Society

**Format:** ~9 slides · export to PPT from this outline or build HTML later  
**Diagram assets:** [`diagrams/architecture.png`](diagrams/architecture.png) · [`diagrams/round_schedule.png`](diagrams/round_schedule.png)

---

## Slide 1 — Problem: approval deadlock + shadow AI

**Headline:** Enterprise AI fails on approvals, not models.

**Why Germany (say early):** In Germany, labor law gives elected worker representatives (the **Works Council / Betriebsrat**) a legal veto over workplace AI tools — approval that takes weeks in the US takes months there. We built for the hardest market; everywhere else is a subset.

**Visual:** Strategy explorer screenshot (`prototypes/trustflow_strategy_explorer.html` — separate from glassbox pipeline)

**Bullets:**
- Weeks of Legal / IT / Procurement / **Betriebsrat** (Works Council) email before one tool goes live
- Shadow AI fills the gap (21/55 corpus items: `approval_process`)
- Policy PDFs nobody enforces at the gateway

**Speaker note:** Anti-Jira — we're not another ticket queue.

---

## Slide 2 — Track 3 fit: decompose · negotiate · measure

**Headline:** Built for Agent Society judging criteria.

| Criterion | TrustFlow proof |
|-----------|-----------------|
| **Task decomposition** | 5 agents × 6 rounds — Runner, Procurement, Compliance, Works Council, IT |
| **Disagreement resolution** | S04 compromise (sovereign route) · S05 procurement veto · appeal + **HITL** (human-in-the-loop) |
| **Efficiency baseline** | Recorded replay **seconds** vs weeks **(illustrative)** · single-agent misses **DPA** / works-council gates |

**Visual:** [`diagrams/round_schedule.png`](diagrams/round_schedule.png)

---

## Slide 3 — Architecture: three layers

**Headline:** Generative negotiation → deterministic enforcement.

**Visual:** [`diagrams/architecture.png`](diagrams/architecture.png) — from `ARCHITECTURE.md` §2 mermaid

**Bullets (story order — humans → agents → compiler → edge):**
- **Layer C — Human sign-off (HITL)** — DPO + IT activate; no gateway until signed
- **Layer B — Agent boardroom (Qwen Cloud)** → structured Policy Proposal
- **Compiler** — schema-validated `rules.json` + `policy_version_hash` (floor-check vs org red lines)
- **Layer A — Edge gateway** in customer VPC — PII, routing, deny codes, audit

**Hybrid deploy callout:** Layer A on-prem/VPC · Layer B on Qwen Cloud (hackathon sponsor alignment)

---

## Slide 4 — Agent society: S04 negotiation trace

**Headline:** Watch stakeholders negotiate in seconds.

**Visual:** `<!-- TODO: screenshot employee_negotiation_s04.png -->` — transcript with stance chips

**Callouts on slide:**
- Round 2: Compliance **Conditional** — `LOCAL_QWEN_72B` for payment schemas
- Round 3: Works Council — **Betriebsvereinbarung** (works-council agreement) signed for pilot
- Round 4: IT — budget cap + sovereign route

**Speaker note:** Boardroom UI is the money shot for judges.

---

## Slide 5 — Single-agent vs multi-agent baseline

**Headline:** More agents ≠ slower — better gates.

**Evidence (captured 2026-07-05, live `qwen-max`):** [`baseline/S05_single_agent_vs_boardroom.md`](baseline/S05_single_agent_vs_boardroom.md)

| Dimension | Single generic agent (1 call) | TrustFlow multi-agent (S05 golden) |
|-----------|------------------------------|-------------------------------------|
| **Wall-clock (demo)** | 1 API call (~11s live) | 6 rounds, **seconds** with recorded replay **(illustrative vs weeks)** |
| **S05 — unsigned OpenAI DPA** | **`conditional_approve`** — audit fields only; **no vendor gate** | **`DENIED`** · vendor **DPA** pending |
| **Procurement lane** | Absent (monolith prompt) | **R1 `conditional_reject`** — *"blocking until the DPA… is signed"* |
| **S04 quality** | Risk: approves without sovereign route / audit fields | Compromise: `LOCAL_QWEN_72B`, fingerprint logs, financial retention |
| **Works council / §87** | Often omitted in English tooling | Works Council Liaison lane + unsigned **Betriebsvereinbarung** gate |
| **Enforcement** | Policy text only | Compiled hash enforced at gateway |

**On-slide quotes (S05):**

| Monolith | Boardroom |
|----------|-----------|
| *"Conditionally approve the use of ChatGPT Enterprise for summarization…"* | *"I am blocking this request until the DPA with the vendor is signed."* |

**Footnote:** Time compression "weeks → seconds" = **illustrative** (strategy explorer 98% is projection, not measured SLA). S05 comparison is **measured** on 2026-07-05 — see JSON in `docs/hackathon/baseline/`.

---

## Slide 6 — HITL (human-in-the-loop): one-click activation on policy diff

**Headline:** Agents recommend; humans activate.

**Visual:** Governance **Human sign-off** panel — DPO + IT parallel reviews

**Bullets:**
- Status **Pending sign-off** — no gateway until humans sign
- Rationale ≥20 chars → audit trail `human_sign_off`
- **30-second sign-off UX target** (demo rehearsal)

---

## Slide 7 — Gateway + audit: sovereign route & Art. 50 (EU AI Act transparency)

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

**DE wedge:** **§87 BetrVG** — works-council co-determination on workplace AI; neither competitor emphasizes this gate.

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
