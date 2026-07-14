# Boardroom protocol — agent negotiation spec

**Status:** v2 implemented (2026-07-14). Structured debate with rebuttal beats.

---

## Session states

```
OPEN → NEGOTIATING → { APPROVED | DENIED | PENDING_HUMAN | PENDING_EXTERNAL } → COMPILED
```

---

## Message envelope

Every agent turn is structured JSON (stored + displayed in UI):

```json
{
  "session_id": "uuid",
  "round": 2,
  "agent": "corporate_compliance",
  "beat": "lane",
  "addressing": "workflow_runner",
  "stance": "conditional_approve",
  "claims": [
    { "type": "regulatory", "ref": "Art.26(6)", "text": "Logs retained 6 months minimum." }
  ],
  "demands": [
    { "field": "audit.raw_prompt_logging", "value": false, "hard": true }
  ],
  "concessions": [
    { "field": "routing.sensitive", "value": "LOCAL_QWEN_72B" }
  ],
  "evidence_ids": ["R0008", "E003"],
  "natural_language": "Procurement, I hear the DPA gap — but we can route payment schemas locally while Legal finishes the vendor packet. I need fingerprint-only logs and no manager dashboards before we even pilot."
}
```

| Field | Compiler reads? | Purpose |
|-------|-----------------|---------|
| `demands`, `concessions` | **Yes** | Policy merge |
| `stance` | **Yes** (sign-offs) | Final position per agent |
| `natural_language` | No | UI transcript |
| `beat` | No | `opening` · `lane` · `rebuttal` · `final` |
| `addressing` | No | Who this turn responds to (UI threading) |

**Rule:** `natural_language` is for humans; **compiler reads `demands` + `concessions` only**.

---

## Debate flow (v2)

```
Round 0   Runner opening (business case)
Rounds 1–4  Lane specialists (one each; Works Council skipped if entity ≠ DE)
            ↳ optional rebuttal beat after each lane (Runner ↔ specialist)
Round 5   All agents — final position (Runner last)
```

**Turn budget:** max **15** envelopes per session. If the cap is hit before every agent gives a `final` beat → `PENDING_HUMAN`.

### Rebuttal triggers (deterministic — not LLM-decided)

After each **lane** turn, insert a rebuttal beat when any of:

1. `stance` is `reject` or `conditional_reject`
2. Any `hard: true` demand
3. Field conflict — same `demands[].field`, different `value` vs a prior agent

Rebuttal beat = **Runner responds**, then **lane specialist counters** (2 turns).

Agents may **pass** on lane review if no objection in their mandate.

---

## Round ↔ lane mapping

| Round | Lane agent | Focus |
|-------|------------|-------|
| 0 | Runner | Present use case packet |
| 1 | Procurement | Vendor/DPA/subprocessor |
| 2 | Compliance | GDPR + EU AI Act tier + audit fields |
| 3 | Works Council Liaison | BR annex + logging visibility (DE only) |
| 4 | IT Infra | Routing + budget (round 3 if no Works Council) |
| 5 | **All** | Final sign-off |

---

## Sign-off matrix

| Agent | Veto power? | Notes |
|-------|-------------|-------|
| Runner | No | Cannot override red lines |
| Compliance | **Yes** on prohibited / high-risk without oversight |
| Procurement | **Yes** if `vendor_dpa_status != signed` |
| Works Council Liaison | **Yes** if DE + `betriebsvereinbarung_status == pending` |
| IT Infra | Conditional | Can block route if budget/capacity impossible |

Deadlock / turn-budget exhaustion → `PENDING_HUMAN`.

**Compromise path:** Rebuttals may shift `stance` and `concessions` (e.g. Runner accepts LOCAL routing; Procurement holds DPA veto until signed). The compiler derives outcome from the **full transcript** — last stance per agent wins; all demands/concessions are merged.

---

## Policy proposal merge algorithm (deterministic)

Pseudocode for compiler — **not LLM**:

```
proposal = empty PolicyArtifact
for envelope in transcript (in order):
  apply concessions where stance in (approve, conditional_approve)
  collect hard demands
final_stance[agent] = last envelope per agent
if any hard demand conflicts with org.policy_floor: REJECT
if risk_tier == prohibited: REJECT
if gates.betriebsvereinbarung_status == pending and entity == DE: add deny_overrides BETRIEBSVEREINBARUNG_PENDING
if gates.vendor_dpa_status == pending: VENDOR_DPA_PENDING veto
emit proposal
```

---

## Agent system prompt anchors

Each permanent agent loads:

1. **Org policy floor** (red lines from admin config)
2. **Relevant regulatory summary** (R1/R2 one-pagers — not full EU text)
3. **Top 10 corpus excerpts** by tag (from `corpus.jsonl`)
4. **Persona card** (Compliance loads `dpo_fintech_de.md` constraints)

Runner loads only the request packet + approved tool list.

Live prompts vary by `beat` (`opening` / `lane` / `rebuttal` / `final`) and require 3–5 sentence `natural_language`.

---

## Eval scenarios

| Scenario ID | Expected outcome (baseline) | Validates |
|-------------|----------------------------|-----------|
| S01 | APPROVED — Copilot summarization, DE, BR signed | Happy path |
| S02 | PENDING_EXTERNAL — same but BR pending | R2 gate |
| S03 | DENIED — HR screening use case | Annex III |
| S04 | APPROVED — local route for payment data | IT + Compliance |
| S05 | DENIED — no DPA | Procurement veto |

After v2 live re-capture, outcomes may shift to `conditional_approve` / `PENDING_EXTERNAL` where negotiation finds a compromise — re-baseline intentionally.

Full dialogue reference: [`research/roleplay/scenario_001_payments_claude.md`](research/roleplay/scenario_001_payments_claude.md)

Implementation: `app/backend/src/boardroom/debate.ts`, `round.ts`
