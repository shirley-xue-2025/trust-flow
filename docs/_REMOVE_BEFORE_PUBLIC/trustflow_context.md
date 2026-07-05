# TrustFlow — Project Context & Decisions

## What We're Building

TrustFlow is an AI Trust Layer for enterprises. It sits between employees and Qwen Cloud, enforcing compliance policies automatically so companies can adopt AI without Legal, IT, or Finance blocking access.

Submitted to: **Qwen Cloud Global AI Hackathon — Track 3: Agent Society**
Submission deadline: **July 9, 2026**
Winners announced: **August 7, 2026**

---

## The Problem

Enterprises want to use AI (like Qwen) but Legal blocks it due to GDPR, the EU AI Act, and cost concerns. Employees bypass this by using personal ChatGPT accounts and pasting in confidential data — this is called **Shadow AI**. It creates massive legal liability.

TrustFlow solves this by making the compliant path so easy and frictionless that employees have no reason to use Shadow AI. It does not intercept traffic at the network level (that requires enterprise network infrastructure like Netskope/Zscaler, which is out of scope). Instead, it offers a better alternative.

---

## Architecture

### Two Layers

**Layer A — Execution Layer (Gateway)**
- Runs on Alibaba Cloud (Node.js server)
- Reads a local `rules.json` config file on every request
- Masks PII (names, IBANs, tax IDs) using regex before forwarding to Qwen
- Enforces hard rules: budget caps, blocked models, region restrictions
- Returns HTTP 403 if a rule is violated
- Fully deterministic, no AI involved — satisfies compliance auditors
- Generates an audit log

**Layer B — Decision Layer (Agent Boardroom)**
- Three Qwen-powered agents negotiate policy in real time
- They ingest an employee's workflow request, debate constraints, reach consensus
- Output: a validated `rules.json` file that the Gateway picks up immediately
- Replaces weeks of manual compliance email threads with milliseconds of agent negotiation

### The Three Agents

1. **Workflow Runner Agent** (ephemeral, created per request)
   - Represents the employee/business team
   - Presents the workflow requirement to the other agents
   - Negotiates safe parameters

2. **Corporate Compliance Agent** (permanent)
   - Represents Legal / DPO
   - Enforces GDPR, EU AI Act, data privacy boundaries

3. **IT & Infrastructure Agent** (permanent)
   - Represents IT Operations / Finance
   - Enforces budget caps, token limits, regional hosting requirements

### Example rules.json

```json
{
  "mask_pii": true,
  "token_limit": 200000,
  "region": "EU",
  "allowed_models": ["qwen-max"],
  "blocked_models": ["qwen-turbo"]
}
```

The Gateway reads this file on every incoming request. The Boardroom rewrites it after each negotiation. No router config, no network drivers — just a file the app watches.

---

## Scope Matrix

### MUST BUILD (Real Code)

- Multi-agent negotiation loop using Qwen API
- Live consensus that writes `rules.json`
- React dashboard with two views (Employee + Admin)
- PII masking using regex, real-time in the UI
- Audit log display

### MOCK / STORYTELLING ONLY

- Low-level HTTP/TCP network proxy
- Enterprise SSO and billing integration
- Industrial NLP masking models (we use regex)
- Production infrastructure deployment

---

## The Demo Flow

### Scene 1 — Employee Sends a Request
Employee types into TrustFlow chat:
> "Analyze this customer list: John Smith, IBAN DE89370400440532013000, churned Q1"

Gateway masks it before sending to Qwen:
> "Analyze this customer list: [PERSON], IBAN [REDACTED], churned Q1"

Response comes back and is decoded for the employee seamlessly.

### Scene 2 — Agent Boardroom Negotiates
Three agents have a live conversation:
- **Workflow Agent:** "Marketing needs churn analysis on customer PII using Qwen-Max."
- **Compliance Agent:** "Not acceptable. Raw PII cannot leave EU. Masking required."
- **IT Agent:** "Agreed on masking. Cap at 200k tokens/month. EU endpoint only."
- **Workflow Agent:** "Confirmed. Proposing: EU endpoint + PII masking + 200k token cap."
- **Consensus:** "All agents agreed. Writing rules.json to gateway now."

Then `rules.json` is generated live on screen.

### Scene 3 — The Two Screens
- **Employee View:** Chat interface, PII masked visually in real time, seamless experience
- **Admin Boardroom View:** Live negotiation stream, agent messages, conflicts, consensus, audit log

---

## Tech Stack (Proposed)

- **Backend:** Node.js on Alibaba Cloud (Elastic Compute Service or similar)
- **Agent Orchestration:** Qwen API (qwen-max) with multi-turn structured prompts
- **Frontend:** React + TypeScript
- **Config:** `rules.json` file written by agents, read by gateway
- **PII Masking:** Regex (EU IBANs, names, tax IDs, emails)
- **Deployment:** Alibaba Cloud (required by hackathon rules)

---

## Team

- **Max** — Developer (React/TypeScript frontend + Node.js backend + Claude Code)
- **Friend** — Product (pitch deck, demo script, Devpost write-up, 5-minute video)

---

## Key Decisions Made

1. **No network-level proxy.** Alibaba Cloud cannot intercept traffic between an employee's laptop and chatgpt.com. The Shadow AI angle is the problem statement, not something TrustFlow technically intercepts. TrustFlow wins by being the better alternative.

2. **rules.json is the core artifact.** It's a simple config file on the server. The agent boardroom writes it. The gateway reads it. No infrastructure changes needed.

3. **Browser extension is a possible future "edge" add-on** but not in scope for the hackathon.

4. **Mock the network proxy.** The frontend will simulate data flow visually. We won't write low-level network drivers.

5. **Agent conflict is the demo.** The agents must visibly disagree and negotiate. A fast consensus with no tension is boring. The Compliance Agent should push back hard.

6. **Alibaba Cloud is required.** The gateway and agent boardroom must be deployed there per hackathon rules.

---

## What to Build First

1. Agent negotiation loop (Python or Node.js script, calls Qwen API, outputs `rules.json`)
2. Gateway server (Node.js, reads `rules.json`, masks PII, proxies to Qwen)
3. React dashboard (Employee chat view + Admin boardroom view)
4. Wire everything together
5. Demo polish

