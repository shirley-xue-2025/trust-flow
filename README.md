# TrustFlow

**Safe AI adoption for European enterprises** — when a team wants a new AI tool,
TrustFlow runs a structured negotiation between five stakeholder agents, compiles
their agreement into a signed machine-enforced policy, and keeps humans in control
of activation.

> **Why Germany first:** In Germany, labor law gives elected worker representatives
> (the **Works Council / Betriebsrat**) a legal veto over workplace AI tools —
> approval that takes weeks in the US can take months there. We built for the
> hardest market; everywhere else is a subset.

> Qwen Cloud Global AI Hackathon — **Track 3: Agent Society**.
> Built on Qwen Cloud (`qwen-max` via DashScope), deployed on Alibaba Cloud.

---

## Glossary (judge skim)

| Term | Plain English |
|------|----------------|
| **Betriebsrat** | Works Council — Germany's mandatory worker-representation body with legal veto power over workplace tools (§87 German labor law) |
| **Betriebsvereinbarung** | Formal works-council agreement on how a tool may be used; TrustFlow tracks signature status as a gate (the legal negotiation stays outside the software) |
| **DPA** | Vendor data-processing agreement |
| **HITL** | Human-in-the-loop sign-off before the gateway activates |
| **Art. 50** | EU AI Act transparency disclosure (shown to users interacting with AI) |

---

## The problem

European enterprises are stuck between two bad options: ban AI tools (and watch
shadow-AI spread anyway) or allow them and accept uncontrolled exposure to GDPR,
the EU AI Act, and **Betriebsvereinbarung** (works-council agreement) obligations.
The bottleneck isn't the model — it's **governance**: every new use case needs
sign-off from compliance, IT, procurement, and worker representatives, and that
negotiation is slow, ad-hoc, and unauditable.

TrustFlow turns that negotiation into software.

## The idea — a dual-layer architecture

This is the differentiator, and the whole design hangs off one boundary:

- **Layer C — Human sign-off** *(HITL)* — DPO and IT activate the compiled policy;
  no gateway enforcement until humans sign.

- **Layer B — Agent Boardroom** *(generative — the only LLM)* — five Qwen-powered
  agents with distinct mandates debate a request across multiple rounds, react to
  each other's arguments, raise conditions, and converge. They emit **structured
  proposals**, never executable rules.

- **Deterministic compiler** *(the gate — no LLM)* — pure code merges the agents'
  demands and concessions, **floor-checks** them (validates against the org's
  non-negotiable red lines), validates against a JSON schema, hashes the result,
  and signs it. Agents can *propose*; only deterministic code can *decide*.

- **Layer A — Edge Gateway** *(deterministic enforcement)* — pure code again:
  PII scanning, model routing, and audit logging on every inference. **No LLM sits
  in the enforcement path.**

> An LLM proposed the policy; deterministic code validated, signed, and enforces it.
> That contrast — creative negotiation up top, hard guarantees at the bottom — is the
> point of the project.

### The five agents

| Agent | Mandate |
|---|---|
| **Workflow Runner** | Advocates for the business use case; proposes alternatives |
| **Corporate Compliance** | GDPR / EU AI Act red lines; can conditionally reject |
| **IT / Infrastructure** | Routing, data residency, technical feasibility |
| **Procurement** | Vendor **DPA** (data-processing agreement) status, contractual exposure |
| **Works Council Liaison** | Worker representation, **Betriebsvereinbarung** (works-council agreement) status |

---

## Track 3 — Agent Society (criteria mapping)

| Track 3 criterion | TrustFlow implementation | Where to verify |
|---|---|---|
| **Task decomposition & role assignment** | Five specialist agents (Runner, Procurement, Compliance, Works Council, IT) negotiate over a fixed **six-round schedule** (round 0 advocate → rounds 1–4 lane responses → round 5 consensus). Each turn returns a schema-validated envelope (`stance`, `demands`, `concessions`). | [`docs/boardroom_protocol.md`](docs/boardroom_protocol.md) · `/glassbox` boardroom theater · golden transcripts `app/backend/test/golden/S04.json` |
| **Dialogue & disagreement** | Agents react to the shared transcript, not isolated prompts. **S04:** Compliance and IT negotiate sovereign routing (local redact → cloud complete) — a better outcome than the original request. **S05:** Procurement vetoes unsigned vendor **DPA** in round 1. | `/glassbox` (S04 auto-load) · [`docs/hackathon/baseline/S05_comparison.json`](docs/hackathon/baseline/S05_comparison.json) |
| **Execution conflicts & resolution** | Disagreement becomes deterministic outcomes: **DENIED**, **PENDING_EXTERNAL**, or **APPROVED** after compile. **S02:** works-council agreement pending (`BETRIEBSVEREINBARUNG_PENDING`). Employee **advocate + appeal** re-opens the boardroom; **HITL** parallel DPO + IT sign-off before activation. | `/employee/requests/demo-s05-denied` · `/employee/requests/demo-s02-external` · governance sign-off queues |
| **Measurable gain vs single-agent baseline** | Same request packet + same `qwen-max` model: one generic governance advisor → *conditional approve* (unsigned DPA never surfaced); five-agent boardroom → **DENIED · VENDOR_DPA_PENDING** in round 1. Live-captured 2026-07-05, committed, reproducible. | [`docs/hackathon/baseline/S05_comparison.json`](docs/hackathon/baseline/S05_comparison.json) · `cd app && npm run baseline:demo -- S05` |

---

## Quickstart (no API key needed)

The application code lives in [`app/`](app/). **Replay mode** runs the full pipeline —
boardroom → compiler → gateway — using **recorded live-qwen-max transcripts,
replayed deterministically** (no API key needed), so judges can see everything
working immediately.

```bash
cd app
npm install
npm run test     # scenario suite (S01–S05), no network / no key
npm run dev      # backend :8080 + web :5173
```

Open <http://localhost:5173/employee> for the **product** (employee + governance portals).

Open <http://localhost:5173/glassbox> for the **glassbox** — transparent judge view of
the negotiation engine: boardroom theater, pipeline strip, and click-to-inspect panels.
Scenario **S04** auto-loads; click **Gateway enforce** to try email MASK / IBAN BLOCK.

**Live Qwen negotiation** (optional, needs the hackathon voucher key): put
`DASHSCOPE_API_KEY=sk-...` in a git-ignored `app/.env`, then `npm run smoke` for a
one-shot live round-trip, or use **Use custom request** in the glassbox inspector.
Full instructions: [`app/README.md`](app/README.md).

### Demo scenarios (asserted by the test suite)

| Scenario | Outcome | What it shows |
|---|---|---|
| S01 | APPROVED | Copilot summarization, works-council agreement signed |
| S02 | PENDING_EXTERNAL | Blocked on unsigned **Betriebsvereinbarung** (works-council agreement) |
| S03 | DENIED | `HIGH_RISK_USE_DENIED` (EU AI Act Annex III) |
| S04 | APPROVED | Redacted on-prem (`LOCAL_QWEN_72B` safety gateway), completed on `CLOUD_QWEN_MAX` |
| S05 | DENIED | Unsigned vendor **DPA** (`VENDOR_DPA_PENDING`) |

---

## Deployment

TrustFlow is deployed on **Alibaba Cloud** (ECS) via Docker Compose — a multi-stage
backend image and an nginx reverse proxy with SSE pass-through and an optional shared
passcode gate. Step-by-step guide:
[`app/deploy/ALICLOUD_DEPLOY.md`](app/deploy/ALICLOUD_DEPLOY.md).

---

## Repository map

| Path | Purpose |
|------|---------|
| [`app/`](app/) | Application monorepo (shared types, Fastify backend, React/Vite web) |
| [`app/README.md`](app/README.md) | How to run, endpoints, live-Qwen setup |
| [`app/deploy/`](app/deploy/) | Docker, nginx, Alibaba Cloud deploy guide |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Product & system architecture |
| [`docs/hackathon/`](docs/hackathon/) | Submission pack — deck, screenshots, evidence chain |
| [`docs/boardroom_protocol.md`](docs/boardroom_protocol.md) | Agent negotiation protocol |
| [`docs/schemas/`](docs/schemas/) | JSON schemas (proposal envelope, policy artifact) |
| [`docs/fixtures/`](docs/fixtures/) | Org config seed + demo/eval data |
| [`docs/research/`](docs/research/) | Regulatory & market research, personas |
| [`prototypes/trustflow_strategy_explorer.html`](prototypes/trustflow_strategy_explorer.html) | Problem-framing pitch explorer |

---

## Hackathon compliance

- **Qwen Cloud API** — all agent reasoning runs on `qwen-max` via the DashScope
  OpenAI-compatible endpoint (live-verified).
- **Alibaba Cloud** — hosted on ECS via Docker Compose.
- **Track 3 — Agent Society** — see [criteria mapping](#track-3--agent-society-criteria-mapping) above.
