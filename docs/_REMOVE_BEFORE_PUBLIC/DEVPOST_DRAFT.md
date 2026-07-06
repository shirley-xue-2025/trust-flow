# Devpost submission — DRAFT

> **Status:** DRAFT — do not submit until Shirley reviews.  
> **Deploy fields:** Max owns ECS URL, basic-auth passcode, final demo video link.

---

## Project name

**TrustFlow**

---

## Elevator pitch (single field, 200 chars max)

> Five AI agents negotiate your AI-tool policy in seconds — including Germany's Works Council veto. A deterministic gateway enforces it; humans sign off before anything activates.

*(177 chars. Alternatives: "Five AI agents — Legal, IT, Procurement, Works Council, Runner — negotiate your AI policy in seconds. A deterministic gateway enforces it; humans sign off before activation." 173 · "Five AI agents negotiate your AI policy. Code enforces it." 58 if a short tagline is ever needed.)*

---

## About the project — paste into "Project Story" (Devpost template headings)

## Inspiration

Enterprises want employees on AI tools, but the approval path is broken. IT, Legal, DPO, and — in Germany — the **Betriebsrat** (Works Council: elected worker representatives with a legal veto over workplace tools under §87 German labor law) trade email attachments for weeks while employees quietly paste company data into private ChatGPT. We collected a 55-item practitioner-evidence corpus; the single largest pain cluster (21/55) was the approval process itself, not the models.

The trigger insight: approval that takes weeks in the US can take **months** in Germany because of works-council co-determination. So we built for the hardest market — everywhere else is a subset.

## What it does

**TrustFlow** turns multi-stakeholder AI-tool approval into a four-stage pipeline:

1. **Agent Boardroom (Layer B — agents negotiate)** — Five specialist agents (Workflow Runner, Procurement, Corporate Compliance, Works Council Liaison, IT Infrastructure) negotiate a structured Policy Proposal over six rounds on Qwen Cloud.
2. **Policy Compiler** — Deterministic merge of agent concessions into schema-validated `rules.json` with a signed `policy_version_hash`, floor-checked against the org's non-negotiable red lines.
3. **Human sign-off (Layer C — HITL)** — DPO and IT review in parallel; nothing activates without them.
4. **Edge Gateway (Layer A — deterministic enforcement)** — Pre-flight checks (tool approval, **Betriebsvereinbarung** works-council-agreement status, PII scan, routing, budget) with deny reason codes and **Art. 50** (EU AI Act transparency) audit events.

Demo highlights:

- **S04 approve path:** Agents compromise on redacting payment-schema traffic through the sovereign `LOCAL_QWEN_72B` safety gateway before it completes on `CLOUD_QWEN_MAX` → human sign-off → gateway activity audit (two chained audit events: redaction, then completion).
- **S05 deny path:** Procurement vetoes an unsigned OpenAI **DPA** (vendor data-processing agreement) → employee advocate + factual appeal.
- **Glassbox** (`/glassbox`) — transparent judge view: boardroom theater with live transcript; click **Gateway enforce** to test PII masking/blocking yourself.
- **Gateway PII:** email masked, IBAN hard-blocked at the edge (regex demo — honest scope).
- **S02 external gate:** works-council agreement pending — the product tracks the gate; the legal process stays outside the software.

## How we built it

- **Qwen-Max via DashScope** (OpenAI-compatible endpoint, `dashscope-intl`) drives every agent turn; each turn returns a structured envelope (stance, demands, concessions) that is **zod-schema-validated** before it enters the transcript — a malformed turn never reaches the compiler.
- **Deterministic compiler** merges validated concessions into `rules.json` and signs a `policy_version_hash`. The LLM proposes; it never enforces.
- **Golden capture CLI** (`npm run capture:golden`) records live qwen-max negotiations as replayable transcripts — the demo runs identically with or without an API key, and judges can diff live vs recorded.
- **Hybrid deployment:** the gateway (Layer A) runs in the customer VPC — data stays in the sovereign boundary; the boardroom (Layer B) runs on Qwen Cloud.
- **Quality gates:** 36 backend tests + 28 Playwright e2e across employee, governance, and glassbox surfaces.

## Challenges we ran into

- **Making agent output enforceable.** Free-text LLM debate is useless to a gateway. We forced every turn into a schema-validated envelope and moved all merging/signing into deterministic code — the hard line "agents propose, code enforces" is the architecture's answer to LLM unreliability.
- **Demo determinism vs. live LLMs.** Live negotiations word themselves differently every run. The golden-capture pipeline records real qwen-max runs and replays them deterministically, so the same system demos reliably offline and runs live with a key.
- **Policy versioning semantics.** A late bug taught us the gateway must enforce the *human-activated* policy version even after a newer draft is compiled — activation state has to survive recompiles. We fixed it with an active-version fallback and a regression test.
- **Modeling co-determination honestly.** The works-council agreement is a legal process, not an API. TrustFlow tracks and enforces its *status* as a gate (`BETRIEBSVEREINBARUNG_PENDING`) and leaves the negotiation itself where it belongs — outside the software.

## Accomplishments that we're proud of

- **A measured multi-agent win, not a claimed one:** the same S05 packet through one generic qwen-max agent → *conditional approve* (unsigned DPA never surfaced); through the five-agent boardroom → **DENIED · VENDOR_DPA_PENDING** in round 1. Live-captured, committed at `docs/hackathon/baseline/`, reproducible with `npm run baseline:demo -- S05`.
- A **complete HITL loop** — parallel DPO + IT sign-off, employee advocate, appeals that re-open the boardroom.
- **Works-council co-determination as a first-class agent lane** — a stakeholder no English-language tooling models.
- End-to-end honesty: every "illustrative" number labeled, PII scope stated, replay vs live visible in the UI.

## What we learned

- Specialist decomposition beats a monolith **on quality, not just speed** — the baseline showed the monolith misses lane-specific gates entirely.
- Regulation is a design constraint, not paperwork: modeling §87 BetrVG changed the round schedule, the deny codes, and the audit schema.
- Put the deterministic boundary as early as possible: schema-validate at the agent turn, sign at the compiler, and the rest of the system can trust its inputs.

## What's next for TrustFlow

- Pilot with a German mid-market fintech (design-partner conversations start from the DPO persona in our research corpus).
- Upgrade PII from regex demo to NER-grade detection in the gateway.
- Broader scenario coverage (HR, marketing content tools) and Betriebsvereinbarung workflow integrations.
- Harden the boardroom protocol: agent-count and round-count are config, so orgs can add lanes (e.g., InfoSec, external counsel).

*(Competitive framing if asked: TrendAI secures like a firewall; Naaia documents like GRC. TrustFlow negotiates stakeholder policy and enforces it deterministically — with the §87 BetrVG works-council gate neither competitor emphasizes.)*

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
- **Measured** single-agent baseline: one generic qwen-max agent conditionally approves S05 and never surfaces the unsigned vendor DPA; the 5-agent boardroom denies it in round 1 — live-captured, committed at `docs/hackathon/baseline/`, reproducible via `npm run baseline:demo -- S05`

---

## Links

| Field | Value | Owner |
|-------|-------|-------|
| **GitHub repository** | `https://github.com/shirley-xue-2025/trust-flow` | Shirley — public before deadline |
| **Live demo URL** | _TBD — Max ECS_ | **Max — DEPLOY** |
| **Demo video** | _TBD — 5 min max_ | Shirley — record from `DEMO_SCRIPT.md` |
| **Presentation deck** | `docs/hackathon/TrustFlow_deck.pptx` (source outline: `PITCH_DECK_OUTLINE.md`) | Shirley |

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
