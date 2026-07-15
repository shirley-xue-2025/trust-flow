# TrustFlow

**Safe AI adoption for European enterprises** — when a team wants a new AI tool,
TrustFlow runs a structured negotiation between **stakeholder agents** (lanes match
the org’s approval process), compiles their agreement into a signed machine-enforced
policy, and keeps humans in control of activation. The hackathon demo uses a
five-lane German-fintech cast — not a fixed product headcount.

> **Why Germany first:** In Germany, labor law gives elected worker representatives
> (the **Works Council / Betriebsrat**) a legal veto over workplace AI tools —
> approval that takes weeks in the US can take months there. We built for the
> hardest market; everywhere else is a subset.

> Qwen Cloud Global AI Hackathon — **Track 3: Agent Society**.
> Built on Qwen Cloud (`qwen-max` via DashScope), deployed on Alibaba Cloud.

**Build story (Medium):** [Enterprise AI doesn’t fail on models. It fails on approvals.](https://medium.com/@xc.shirley/enterprise-ai-doesnt-fail-on-models-it-fails-on-approvals-59c1b0979fcc)

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

Two-slide public framing (demo opener): [`docs/hackathon/problem_frame.html`](docs/hackathon/problem_frame.html).

## The idea — negotiate, then enforce

This is the differentiator, and the whole design hangs off one boundary:

- **Human sign-off** — DPO and IT activate the compiled policy; no gateway
  enforcement until humans sign.

- **Agent boardroom** *(generative — the only LLM)* — Qwen-powered specialists
  with distinct mandates debate a request across multiple rounds, react to each
  other's arguments, raise conditions, and converge. They emit **structured
  proposals**, never executable rules. *(Demo cast below; agent count is config.)*

- **Deterministic compiler** *(no LLM)* — pure code merges the agents' demands and
  concessions, **floor-checks** them (validates against the org's non-negotiable
  red lines), validates against a JSON schema, hashes the result, and signs it.
  Agents can *propose*; only deterministic code can *decide*.

- **Edge gateway** *(deterministic enforcement)* — pure code again: PII scanning,
  model routing, and audit logging on every inference. **No LLM sits in the
  enforcement path.**

> An LLM proposed the policy; deterministic code validated, signed, and enforces it.
> That contrast — creative negotiation up top, hard guarantees at the bottom — is the
> point of the project.

### Demo cast — five lanes (German fintech)

Agent count and roles are **configurable** to the org. This demo models NordPay-style
gates with five specialists:
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
| **Task decomposition & role assignment** | Specialist agents with distinct mandates (demo cast: Runner, Procurement, Compliance, Works Council, IT) negotiate in structured debate (opening → lanes → rebuttals → all-agent finals; up to 15 turns). Each turn returns a schema-validated envelope (`stance`, `demands`, `concessions`). | [`docs/boardroom_protocol.md`](docs/boardroom_protocol.md) · `/glassbox` boardroom theater · recorded demos in `app/backend/test/golden/` |
| **Dialogue & disagreement** | Agents react to the shared transcript, not isolated prompts. **Payment data routing:** Compliance and IT negotiate sovereign routing (local redact → cloud complete). **Unsigned DPA:** Procurement vetoes in round 1. | `/glassbox` (payment routing demo auto-loads) · [`docs/hackathon/baseline/S05_comparison.json`](docs/hackathon/baseline/S05_comparison.json) |
| **Execution conflicts & resolution** | Disagreement becomes deterministic outcomes: **DENIED**, **PENDING_EXTERNAL**, or **APPROVED** after compile. **Works council gate:** agreement pending. Employee **advocate + appeal** re-opens the boardroom; parallel DPO + IT **human sign-off** before activation. | `/employee/requests/demo-s05-denied` · `/employee/requests/demo-s02-external` · governance sign-off queues |
| **Measurable gain vs single-agent baseline** | Same request packet + same `qwen-max` model: one generic governance advisor → *conditional approve* (unsigned DPA never surfaced); specialist boardroom → **DENIED · vendor DPA pending** in round 1. Live-captured 2026-07-05, committed, reproducible. | [`docs/hackathon/baseline/S05_comparison.json`](docs/hackathon/baseline/S05_comparison.json) · `cd app && npm run baseline:demo -- S05` |

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
The **payment data — sovereign routing** demo auto-loads; click **Run boardroom** then
**Gateway enforce** to try email MASK / IBAN BLOCK.

**Live Qwen negotiation** (optional, needs the hackathon voucher key): put
`DASHSCOPE_API_KEY=sk-...` in a git-ignored `app/.env`, then `npm run smoke` for a
one-shot live round-trip, or use **Use custom request** in the glassbox inspector.
Full instructions: [`app/README.md`](app/README.md).

### Demo scenarios (asserted by the test suite)

Internal IDs (S01–S05) are for tests only — the UI shows plain-English names.

| ID | Outcome | What it shows (judge-facing) |
|---|---|---|
| S01 | APPROVED | Copilot summarization — happy path, all gates signed |
| S02 | PENDING_EXTERNAL | Works council agreement not signed — blocked until formal agreement |
| S03 | DENIED | HR screening — high-risk use denied (EU AI Act Annex III) |
| S04 | APPROVED | Payment data — redacted on-prem, completed in cloud (sovereign routing) |
| S05 | DENIED | Unsigned vendor DPA — procurement veto |

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
| [`docs/hackathon/`](docs/hackathon/) | Submission pack — problem slides, screenshots, evidence chain |
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
- **Build write-up** — [Medium](https://medium.com/@xc.shirley/enterprise-ai-doesnt-fail-on-models-it-fails-on-approvals-59c1b0979fcc) (problem framing + measured baseline).
