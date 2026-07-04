# Demo script — HITL product (5 min)

**Run:** `cd app && npm run dev` → http://localhost:5173  
**Reset data:** `curl -X POST http://localhost:8080/v1/demo/reseed`

---

## Cast

| Role | Surface | Persona |
|------|---------|---------|
| Employee | `/employee` | Alex Weber |
| DPO / IT | `/governance` | Katrin Müller (use role tabs) |
| Engineer | `/glassbox` | Optional — live SSE + compiler |

---

## Beat 1 — Problem (0:00–0:45)

Open strategy explorer or glassbox. Frame: weeks of Legal/Procurement/BR deadlock vs minutes of stakeholder review.

---

## Beat 2 — Approve path with human gate (0:45–2:15)

1. **Employee** → Dashboard → **demo-s04-pending-signoff** (Claude Code)
2. Show **Stakeholder review** tab — non-empty transcript, stance chips
3. Status: **Pending sign-off** — no “Use tool” yet
4. **Governance** → Queues → Sign-off → open same request
5. **DPO** tab → Sign off (rationale ≥ 20 chars)
6. Switch role to **IT** → Sign off
7. **Employee** refresh → **Approved** → **Use tool** → gateway chat (clean prompt allowed; IBAN → PII_BLOCK)

**Line:** *Agents recommended approval in seconds; humans activated the policy.*

---

## Beat 3 — Deny + Advocate + appeal (2:15–3:45)

1. **Employee** → **demo-s05-denied** (ChatGPT Enterprise)
2. **Your Advocate** explains deny (deterministic; ask “why” / “alternatives”)
3. **Appeal** → type **Factual** → submit statement
4. **Governance** → Queues → Appeals → **Grant appeal**
5. Boardroom re-runs → **Pending sign-off** again → human reviews → activate

**Line:** *New evidence re-opened stakeholder review; humans still own the outcome.*

---

## Beat 4 — Procedural / external (optional, 3:45–4:15)

1. **demo-s02-external** — BR pending
2. Or: employee **Propose alternative** on S05 → Copilot linked child request

---

## Beat 5 — Audit + close (4:15–5:00)

1. **Governance** → Audit log — `human_sign_off`, `appeal_decision`, gateway events
2. **Glassbox** footnote: production requires human sign-off
3. Close: *Agents compress negotiation; humans keep control; gateway enforces deterministically.*

---

## Recovery

| Issue | Fix |
|-------|-----|
| Empty requests | `POST /v1/demo/reseed` |
| Empty negotiation after restart | Transcript persisted on request (`transcript_snapshot`) |
| No API key | Golden replay scenarios (S01–S05) — no live LLM needed |

---

## Pre-seeded request IDs

| ID | Scenario | End state |
|----|----------|-----------|
| `demo-s04-pending-signoff` | S04 | Pending human sign-off |
| `demo-s05-denied` | S05 | Denied — employee action required |
| `demo-s02-external` | S02 | Pending external (BR) |
