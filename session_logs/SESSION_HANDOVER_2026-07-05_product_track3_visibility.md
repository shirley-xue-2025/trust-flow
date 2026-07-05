# Session handover — Track 3 product visibility (2026-07-05)

**Goal:** Hackathon-winning product visibility for Agent Society + HITL demo (code + UX only).

**Win narrative (unchanged):** Problem → Agent Society (glassbox SSE) → HITL sign-off → Gateway → Audit

---

## Shipped (P0)

| ID | What | Key files |
|----|------|-----------|
| A1 | Negotiation tab default when transcript exists | `RequestDetail.tsx`, `requestDetailTabs.ts` — waits for `hydrated` before picking tab; denied flows stay on Overview |
| A2 | Agent Society labeling | `StakeholderSummaryCard`, `BoardroomTranscript`, `RequestDetail`, `RequestOversight` |
| A3 | Demo tour (3 steps) on employee Dashboard | `Dashboard.tsx` — links S04, sign-off queue, `/glassbox` |
| A4 | Architecture strip | `ArchitectureStrip.tsx` — employee + governance layouts |
| A5 | PII demo honesty | `ToolChat.tsx`, `Playground.tsx` — email MASK primary, IBAN hard-block secondary, `Sent to model (redacted)` hint |
| A6 | Art. 50 audit fields | `AuditTrustList.tsx` — `disclosure_shown`, `risk_tier` on gateway events |

---

## Verification

```bash
cd app && npm run test        # 31 passed
cd app && npm run test:e2e    # 28 passed
```

Manual checklist:
- `POST /v1/demo/reseed` → open `/employee/requests/demo-s04-pending-signoff` → **Agent negotiation** tab active, Round 1 visible
- `/glassbox` → replay S04 SSE still works
- Approved tool chat → email starter → allowed + redacted hint
- Gateway inference → audit row shows `disclosure_shown: true` for limited-risk policies

---

## Deferred (P1)

| ID | Task | Notes |
|----|------|-------|
| A7 | Policy diff highlight in PolicyTrustCard | Port from glassbox `PolicyPanel.tsx` |
| A8 | Glassbox → employee deep link after compile | `DemoApp.tsx` |
| A9 | Human review mirrors agent lane | `HumanReviewPanel` |
| A10 | Strategy explorer 3→5 agents copy | `prototypes/` + `public/strategy_explorer.html` |

---

## Verbatim copy for Track B (deck / Devpost / script)

Use these strings as-is where product labels appear:

- **Architecture strip:** `Agents propose → Compiler signs → Humans approve → Gateway enforces`
- **Card title:** `Agent negotiation trace`
- **Agent subtitle:** `5 Qwen agents — Compliance, Procurement, IT, Works Council, Runner`
- **Tab label:** `Agent negotiation`
- **Demo tour title:** `Hackathon demo tour`
- **Demo tour subtitle:** `Problem → Agent Society → HITL sign-off → Gateway → Audit`
- **Tour steps:** (1) Watch agents negotiate (2) Human sign-off (3) Governed gateway
- **PII honesty:** `Per-entity policy at the edge — emails masked so work continues; IBANs may block on payment routes`
- **Redaction hint:** `Sent to model (redacted)`
- **Audit fields:** `disclosure_shown`, `risk_tier` (Art. 50 visibility)

**Do not claim:** Presidio, mask-and-restore round-trip.

---

## Git

Uncommitted on `main` (clean before session). **Not committed** — Shirley to commit when ready.

---

## Next session

1. Track B copy from table above
2. P1 polish if time before demo freeze
3. Max ECS redeploy when Shirley says demo-frozen (`docs/DEPLOY_AND_REPO_COORDINATION.md`)
