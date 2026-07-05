# Devpost submission — DRAFT

> **Status:** DRAFT — do not submit until Shirley reviews.  
> **Deploy fields:** Max owns ECS URL, basic-auth passcode, final demo video link.

---

## Project name

**TrustFlow**

---

## Elevator pitch

| Field | Limit | Draft |
|-------|-------|-------|
| Tagline | 60 chars | Multi-agent policy boardroom + deterministic AI gateway |
| Short description | 200 chars | TrustFlow compresses weeks of Legal/IT/Procurement/Works Council (Betriebsrat) negotiation into seconds of agent debate, compiles enforceable gateway rules, and keeps humans in control of activation. |

---

## About the project

### The problem

Enterprises want employees on AI tools; IT, Legal, DPO, and Germany's **Betriebsrat** (Works Council — elected worker representatives with legal veto over workplace tools under §87 German labor law) block or slow rollouts. Employees use shadow ChatGPT while approval email chains run for weeks. Policies exist as PDFs without deterministic enforcement at the inference edge.

> **Why Germany:** Approval that takes weeks in the US can take months in Germany because of works-council co-determination. We built for the hardest market; everywhere else is a subset.

### Our solution

**TrustFlow** is a three-layer system for Track 3 — Agent Society:

1. **Layer B — Agent Boardroom** (agents negotiate) — Five specialist agents (Workflow Runner, Procurement, Corporate Compliance, Works Council Liaison, IT Infrastructure) negotiate a structured Policy Proposal over six rounds using Qwen Cloud.
2. **Policy Compiler** — Deterministic merge of agent concessions into schema-validated `rules.json` with a `policy_version_hash` (floor-check = validate against org non-negotiable red lines).
3. **Layer A — Edge Gateway** (deterministic enforcement) — Pre-flight checks (tool approval, **Betriebsvereinbarung** works-council agreement status, PII scan, routing, budget) with deny reason codes and **Art. 50** (EU AI Act transparency) audit events.
4. **Layer C — Human-in-the-loop (HITL)** — DPO and IT parallel sign-off before the gateway activates.

### Demo highlights

- **S04 approve path:** Agents compromise on sovereign `LOCAL_QWEN_72B` routing → human sign-off → gateway activity audit (tool used in IDE, not in-portal chat).
- **Glassbox** (`/glassbox`) — transparent judge view of the negotiation engine: boardroom theater, live transcript on stage; click **Gateway enforce** to inspect the pipeline.
- **S05 deny path:** Procurement vetoes unsigned OpenAI **DPA** (vendor data-processing agreement) → employee advocate + factual appeal.
- **Gateway PII:** Email masked; IBAN hard-blocked at edge (regex demo — honest scope).
- **S02 external gate:** Works council agreement pending — product tracks status; legal process stays outside.

### Hybrid deployment story

- **Layer A (gateway):** Customer VPC — data stays in sovereign boundary.
- **Layer B (boardroom):** Qwen Cloud — hackathon-aligned agent negotiation.

### Differentiation

TrendAI secures like a firewall; Naaia documents like GRC. TrustFlow **negotiates** stakeholder policy and **enforces** it deterministically — with DE **§87 BetrVG** works-council gates neither competitor emphasizes.

---

## Built with

`Qwen Cloud` · `Qwen-Max` · `Node.js` · `Fastify` · `React` · `TypeScript` · `Vite` · `SQLite`/JSON stores · `Docker` · `Alibaba Cloud ECS` · `Playwright`

---

## AI tools used

| Tool | Role |
|------|------|
| **Qwen-Max** (DashScope) | Boardroom agent turns — hackathon requirement |
| **Cursor** | Development assistant |
| **Golden replay fixtures** | Recorded live-qwen-max transcripts, replayed deterministically (offline demo, no API key) |

---

## Hackathon track

**Track 3: Agent Society**

- Multi-agent coordination with distinct roles and veto matrix
- Structured disagreement resolution (S04 compromise, S05 veto, appeals, HITL)
- Measurable demo baseline vs single-agent (eval fixtures S04/S05 — see deck slide 5)

---

## Links

| Field | Value | Owner |
|-------|-------|-------|
| **GitHub repository** | `https://github.com/shirley-xue-2025/trust-flow` | Shirley — public before deadline |
| **Live demo URL** | _TBD — Max ECS_ | **Max — DEPLOY** |
| **Demo video** | _TBD — 5 min max_ | Shirley — record from `DEMO_SCRIPT.md` |
| **Presentation deck** | `docs/hackathon/PITCH_DECK_OUTLINE.md` → PPT export | Shirley |

---

## DEPLOY fields for Max (fill before submit)

```
LIVE_DEMO_URL=
BASIC_AUTH_USER=
BASIC_AUTH_PASS=          # share OOB only
ECS_REGION=ap-southeast-1
LAST_DEPLOY_COMMIT=
RESEED_CMD=curl -X POST https://<host>/v1/demo/reseed
```

---

## Submission checklist (July 9)

- [ ] Public GitHub repo with working code
- [ ] Demo video ≤ 5 minutes
- [ ] Presentation deck (PPT)
- [ ] Devpost description pasted from this draft
- [ ] Qwen Cloud API usage demonstrated
- [ ] Deployed on Alibaba Cloud infrastructure

**Not in this draft:** Final marketing polish, thumbnail, team bios.
