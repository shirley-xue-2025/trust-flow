# Boardroom protocol — agent negotiation spec

**Status:** Pre-build. Defines message shapes and round structure for Layer B.

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
  "natural_language": "I can approve if prompts are fingerprint-only and sensitive traffic stays in EU."
}
```

**Rule:** `natural_language` is for UI; **compiler reads `demands` + `concessions` only**.

---

## Round order (default)

| Round | Active agents | Focus |
|-------|---------------|-------|
| 0 | Runner | Present use case packet |
| 1 | Procurement | Vendor/DPA/subprocessor |
| 2 | Compliance | GDPR + EU AI Act tier + audit fields |
| 3 | Works Council Liaison | BR annex + logging visibility (skip if `entity_country != DE`) |
| 4 | IT Infra | Routing + budget |
| 5 | All | Final sign-off or deadlock |

Agents may **pass** if no objection.

---

## Sign-off matrix

| Agent | Veto power? | Notes |
|-------|-------------|-------|
| Runner | No | Cannot override red lines |
| Compliance | **Yes** on prohibited / high-risk without oversight |
| Procurement | **Yes** if `vendor_dpa_status != signed` |
| Works Council Liaison | **Yes** if DE + `betriebsvereinbarung_status == pending` |
| IT Infra | Conditional | Can block route if budget/capacity impossible |

Deadlock after round 5 → `PENDING_HUMAN`.

---

## Policy proposal merge algorithm (deterministic)

Pseudocode for compiler — **not LLM**:

```
proposal = empty PolicyArtifact
for agent in signoffs_ordered:
  apply concessions where stance in (approve, conditional_approve)
  collect hard demands
if any hard demand conflicts with org.policy_floor: REJECT
if risk_tier == prohibited: REJECT
if gates.betriebsvereinbarung_status == pending and entity == DE: add deny_overrides BETRIEBSVEREINBARUNG_PENDING
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

---

## Eval scenarios (post-build)

| Scenario ID | Expected outcome | Validates |
|-------------|------------------|-----------|
| S01 | APPROVED — Copilot summarization, DE, BR signed | Happy path |
| S02 | PENDING_EXTERNAL — same but BR pending | R2 gate |
| S03 | DENIED — HR screening use case | Annex III |
| S04 | APPROVED — local route for payment data | IT + Compliance |
| S05 | DENIED — no DPA | Procurement veto |

Full dialogue: [`../research/roleplay/scenario_001_payments_claude.md`](../research/roleplay/scenario_001_payments_claude.md)
