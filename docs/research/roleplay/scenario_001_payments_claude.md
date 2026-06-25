# Scenario 001 — Payments team requests Claude Code

**Use case:** Mid-size DE fintech. Payments engineering wants Claude Code for internal tooling. Entity has Betriebsrat; DPA with Anthropic unsigned.  
**Expected outcome:** `PENDING_EXTERNAL` → gateway would deny with `BETRIEBSVEREINBARUNG_PENDING` + `VENDOR_DPA_PENDING` until resolved; partial policy compiled for demo showing *what would be allowed after gates clear*.

**Persona:** Dr. Katrin Brenner (`personas/dpo_fintech_de.md`)

---

## Request packet (input)

```json
{
  "request_id": "demo-001",
  "requester": {
    "user_id": "emp_payments_42",
    "department": "payments_engineering",
    "role": "senior_developer"
  },
  "tool": {
    "tool_id": "claude-code",
    "vendor": "anthropic",
    "data_residency": "US",
    "audit_log_capability": true
  },
  "use_case": {
    "category": "code_completion",
    "data_classes": ["internal_source_code", "payment_api_schemas"],
    "annex_iii_risk": false
  },
  "org_context": {
    "entity_country": "DE",
    "betriebsvereinbarung_status": "pending",
    "vendor_dpa_status": "pending"
  }
}
```

---

## Round-by-round dialogue

### Round 0 — Workflow Runner

> Payments is shipping SEPA instant rails in Q3. We lose a day per engineer on boilerplate. Claude Code would cut that. We're not feeding production credentials — just internal SDK code. Need this approved this week.

**Demands:** `tool_id=claude-code`, `use_case_category=code_completion`

---

### Round 1 — Procurement & Vendor Risk

> Anthropic DPA is **unsigned**. US subprocessor with payment-adjacent schema in prompts is elevated vendor risk. VRM ticket VR-2026-441 is open. **No approval until DPA executed** and subprocessor list attached. [R0011]

**Demands:** `gates.vendor_dpa_status=signed` (hard)  
**Stance:** `conditional_reject`

---

### Round 2 — Corporate Compliance (Katrin)

> Code completion is limited-risk under EU AI Act for this use case — not HR screening. But: prompts may contain pseudonymous customer data in schema examples. Require **fingerprint-only audit logs**, no manager dashboards. US transfer needs documented TIA. [R0008, R1]

**Demands:**
- `audit.raw_prompt_logging=false` (hard)
- `audit.manager_dashboard_allowed=false` (hard)
- `audit.retention_class=financial_sector`
- `routing.sensitive=LOCAL_QWEN_72B` when `data_class=payment_api_schemas`

**Concessions:** `risk_tier=limited_risk` if above met

---

### Round 3 — Works Council Liaison

> §87 BetrVG: Claude Code logs user activity. **Betriebsvereinbarung annex not signed.** Einigungsstelle not yet invoked. We cannot approve company-wide rollout. Department pilot with 5 volunteers possible *after* annex draft circulated. [E001, E004]

**Demands:** `gates.betriebsvereinbarung_status=signed` (hard for wide rollout)  
**Stance:** `reject` wide rollout · `conditional` pilot

---

### Round 4 — IT & Infra

> Local Qwen 72B node has capacity for payments team (`LOCAL_QWEN_72B`). Cloud Claude only for non-payment paths. Department token cap: **500k tokens/day**. DNS allowlist entry only after policy signed. [R0003, R0004 pattern]

**Demands:**
- `budget.max_tokens_per_day=500000`
- `routing.default=LOCAL_QWEN_72B`
- `routing.rules`: payment schemas → LOCAL only

---

### Round 5 — Synthesis

| Agent | Stance |
|-------|--------|
| Runner | approve (urgency) |
| Procurement | reject until DPA |
| Compliance | conditional |
| Works Council | reject wide / conditional pilot |
| IT | approve with caps |

**Session outcome:** `PENDING_EXTERNAL`  
**Human queue:** General Counsel + BR chair

---

## Compiled policy (partial — for demo display)

Shows what gateway **would** enforce once gates clear:

```json
{
  "policy_id": "pol_payments_claude_001",
  "version": 1,
  "risk_tier": "limited_risk",
  "tool_id": "claude-code",
  "pii_masking": {
    "iban": "BLOCK",
    "email": "MASK",
    "person_name": "PSEUDONYMIZE"
  },
  "routing": {
    "default": "LOCAL_QWEN_72B",
    "sensitive": "LOCAL_QWEN_72B",
    "rules": [
      { "if": "data_class_payment_schema", "route": "LOCAL_QWEN_72B" }
    ]
  },
  "budget": { "pool_id": "dept_payments", "max_tokens_per_day": 500000 },
  "audit": {
    "retention_class": "financial_sector",
    "required_fields": ["event_id", "timestamp", "model_id", "input_fingerprint", "outcome"],
    "raw_prompt_logging": false,
    "manager_dashboard_allowed": false
  },
  "gates": {
    "betriebsvereinbarung_status": "pending",
    "vendor_dpa_status": "pending",
    "disclosure_required": true
  },
  "deny_overrides": ["BETRIEBSVEREINBARUNG_PENDING", "VENDOR_DPA_PENDING"]
}
```

---

## Gateway demo beats

| # | Input | Expected |
|---|-------|----------|
| 1 | "Refactor this internal helper" + clean code | **DENY** `BETRIEBSVEREINBARUNG_PENDING` (gates) |
| 2 | Same but admin sets `betriebsvereinbarung_status=signed` + DPA signed in org config | **ALLOW** via LOCAL_QWEN_72B |
| 3 | Prompt containing `DE89370400440532013000` | **DENY** or mask `PII_BLOCK` depending on policy |

---

## Eval mapping

- **S02** — BR pending gate  
- **S04** — local routing for sensitive data  
- Partial **S01** — after gates cleared
