# Demo playbook — naive judge path (5 min)

Plain-language tour for someone with **no repo context**. Scenario IDs (S01–S05) are test fixtures only — never say them aloud.

## Start

```bash
cd app && npm run dev:demo   # qwen-max + paced recorded demo (~1s/turn)
```

Open **http://localhost:5173/glassbox**

## Beat 1 — Transparent negotiation (2 min)

1. **Payment data — sovereign routing** loads automatically in the scenario dropdown.
2. Click **▶ Run boardroom**.
3. Point at the **specialist agents** debating — they react to each other, not isolated prompts.
4. Badge reads **Recorded demo · Payment data routing** (saved qwen-max transcript, no API key).
5. When complete: outcome **APPROVED** — compliance and IT negotiated local redaction before cloud completion.

**Say:** *"Stakeholder agents negotiate; only deterministic code compiles and enforces the result."*

## Beat 2 — Compiler + policy (30 sec)

1. Click **Compiler** chip in the enforcement strip.
2. Show signed hash and **rules.json** diff — "What the boardroom negotiated."

**Say:** *"Agents propose; the compiler floor-checks and signs. No LLM in enforcement."*

## Beat 3 — Gateway proof (1 min)

1. Click **Gateway** chip → open playground in side panel.
2. Send a prompt with an email → **MASK**.
3. Send IBAN-like text → **BLOCK**.

**Say:** *"Every inference goes through deterministic PII scan and routing — not the boardroom LLM."*

## Beat 4 — Employee product (1 min)

1. Click **← Product** or open **http://localhost:5173/employee**
2. Dashboard → **Claude Code — pending sign-off** → **Agent negotiation** tab.
3. Same boardroom trace, but where an employee lives day-to-day.

**Say:** *"Glassbox is the transparent engine; the employee portal is the real workflow."*

## Beat 5 — Denial + baseline (optional, 1 min)

1. Glassbox scenario dropdown → **Unsigned vendor DPA — denied**
2. Run boardroom → **DENIED** in round 1 (procurement veto).
3. Employee portal → **ChatGPT Enterprise — denied (unsigned DPA)** → advocate / appeal.

For measurable improvement vs one agent: [`baseline/S05_comparison.json`](baseline/S05_comparison.json)

**Say:** *"One generic compliance bot conditionally approved this; our boardroom denied it on the unsigned DPA."*

## Glossary cheat sheet (spoken)

| Don't say | Say instead |
|-----------|-------------|
| S04 / S05 | Payment routing demo / Unsigned DPA demo |
| Golden replay | Recorded demo (saved negotiation) |
| BR | Works council |
| Betriebsvereinbarung | Works council agreement |
| HITL | Human sign-off before gateway goes live |
| Layer B / A / C | Agent boardroom / Gateway enforcement / Human sign-off |

## Reset

Refresh the page or `POST /v1/demo/reseed` to restore employee demo requests.
