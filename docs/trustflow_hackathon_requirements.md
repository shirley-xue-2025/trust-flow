# Qwen Cloud Global AI Hackathon — Constraints & Requirements

Source: https://www.qwencloud.com/challenge/hackathon

---

## Event Overview

- **Name:** Qwen Cloud Global AI Hackathon (1st edition)
- **Track:** Track 3 — Agent Society
- **Prize Pool:** $70,000+ total
- **Track Winner Prize:** $10,000 ($7,000 cash + $3,000 cloud voucher)
- **Honorable Mention:** $1,000 ($500 cash + $500 cloud voucher), 10 projects across all tracks

---

## Key Dates

| Date | Event |
|------|-------|
| May 26, 2026 | Official launch, registration opens, voucher distribution begins |
| May 26 – July 8 | Build period with weekly mentor office hours |
| **July 9, 2026** | **Submission deadline — code freeze, demo videos due** |
| July 10 – 30 | Judging period, shortlisting, panel judging, finalist demos |
| August 7, 2026 | Winners announced |

---

## Eligibility & Team Rules

- Open to global developers
- Teams of 1–5 members allowed
- Can register solo and form a team later
- Check Devpost for full eligibility details

---

## Technical Requirements (Hard Rules)

1. **Must use Qwen Cloud API** — free $40 voucher provided per participant
2. **Must be deployed on Alibaba Cloud infrastructure** — this is mandatory
3. Open-source libraries and frameworks are allowed as building blocks
4. Direct copying of open-source projects is prohibited

---

## Submission Requirements

Submit via Devpost before July 9. Must include all four of:

1. **Demo video** — maximum 5 minutes
2. **GitHub repository** — public, with working code
3. **Presentation deck** (PPT) — architecture and project description
4. **Project description** — written on Devpost

---

## Judging Criteria

| Weight | Category | What Judges Look For |
|--------|----------|----------------------|
| 30% | Innovation & AI Creativity | Sophisticated use of Qwen Cloud APIs (custom skills, MCP integrations), algorithm/engineering innovation, novel solutions |
| 30% | Technical Depth & Engineering | Architecture quality (modularity, scalability, error handling), clean code, non-trivial logic, advanced patterns |
| 25% | Problem Value & Impact | Solves a real business or technical pain point, scalability potential, productization or open-source community potential |
| 15% | Presentation & Documentation | Clear demo video that visualizes key logic, architecture docs describing the project |

---

## Intellectual Property

- Teams retain full ownership of their projects and IP
- By submitting, you grant Qwen Cloud and Alibaba a license to showcase your project publicly

---

## How to Register & Claim Voucher

1. Register on Devpost: https://qwencloud-hackathon.devpost.com
2. Claim free $40 Qwen Cloud voucher at: https://www.qwencloud.com/challenge/hackathon/voucher-application (use same email as Devpost registration)
3. Get API keys at: https://home.qwencloud.com/api-keys

---

## Track 3 — Agent Society (Our Track)

Build a network of collaborative AI agents that work together to solve complex tasks. The emphasis is on:
- Multi-agent coordination and communication
- Agents with distinct roles and responsibilities
- Emergent behavior from agent collaboration
- Real-world applicability of the agent network

---

## What This Means for TrustFlow

### Must do
- Use `qwen-max` or another Qwen Cloud model for all agent calls
- Deploy the gateway and agent boardroom on Alibaba Cloud (ECS or similar)
- Ship a working GitHub repo by July 9
- Record a 5-minute demo video showing the agent negotiation and the two dashboard views
- Write architecture documentation

### Watch out for
- **Alibaba Cloud deployment is not optional.** Cannot use AWS, Render, or any other cloud provider for the main hosted components.
- **Demo video is 5 minutes max.** Every second counts. Script it tightly.
- **Technical depth is 30% of the score.** The agent loop must have real, non-trivial logic — not just three API calls that agree immediately.
- **Innovation is also 30%.** The MCP integration angle or custom Qwen skills could boost this score if time allows.

### Scoring strategy
- Win on Technical Depth: make the agent negotiation genuinely complex with structured debate turns, conflict resolution logic, and schema-validated JSON output
- Win on Innovation: the dual-layer architecture (deterministic gateway + agentic policy) is the differentiator — make sure the demo makes this contrast obvious
- Win on Presentation: the Boardroom UI is the money shot — polish it

---

## Support & Community

- Discord: https://discord.gg/cDEHSV4Qqj
- Weekly mentor office hours during build period
- GitHub: https://github.com/QwenCloud

