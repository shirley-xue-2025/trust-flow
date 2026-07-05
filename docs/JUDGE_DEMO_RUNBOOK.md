# Judge demo runbook — one page

**Owner:** Presenter (Shirley) · **Deploy:** Max (ECS)  
**Duration:** 5 min scripted · 30s sign-off UX target for HITL beat

---

## Prerequisites

```bash
cd app && npm run dev          # web :5173, backend :8080
curl -X POST http://localhost:8080/v1/demo/reseed
```

| Item | Required? | Notes |
|------|-----------|-------|
| Node 20+ | Yes | `app/package.json` engines |
| `DASHSCOPE_API_KEY` | Optional | Live SSE; without it use golden replay `S04`/`S05` |
| Browser | Chrome recommended | Two tabs: Employee + Governance |
| ECS live URL | Optional | Max redeploy — see **Max handoff** below |

---

## Scenario IDs

| Request ID | Golden | Initial status | Demo purpose |
|------------|--------|----------------|--------------|
| `demo-s04-pending-signoff` | S04 | Pending sign-off | Approve + gateway |
| `demo-s05-denied` | S05 | Denied | Advocate + appeal |
| `demo-s02-external` | S02 | Pending external | Betriebsrat gate |

---

## Step-by-step click path

### A — Problem frame (40s)

1. Open http://localhost:5173/glassbox
2. Tab **0 · Problem** — strategy explorer chart visible  
   `<!-- TODO: screenshot strategy_explorer_chart.png -->`

### B — Live boardroom S04 (55s)

1. Tab **1 · Request** → select scenario **S04** (or replay)
2. Tab **2 · Boardroom** — watch rounds 0–5 stream  
   `<!-- TODO: screenshot glassbox_boardroom_sse.png -->`
3. Optional: tab **3 · Policy** — show `policy_version_hash`

### C — Human sign-off (65s) — **30s UX target**

1. Tab: http://localhost:5173/employee/requests/demo-s04-pending-signoff
2. Confirm badge **Pending sign-off** · tab **Negotiation** shows transcript  
   `<!-- TODO: screenshot employee_negotiation_s04.png -->`
3. Tab: http://localhost:5173/governance/queues?queue=signoff&role=dpo
4. Click **Alex Weber** row → request detail
5. Header **Viewing as** → **DPO** → **Human sign-off** → rationale (≥20 chars) → **Sign off**
6. Header → **IT Security** → **Sign off**  
   `<!-- TODO: screenshot governance_signoff_dual.png -->`
7. Employee tab refresh → **Approved** → **Use Claude Code**

### D — S05 deny + appeal (55s)

1. http://localhost:5173/employee/requests/demo-s05-denied
2. **Your Advocate** — type *"Why was this denied?"*
3. **Appeal** → **Factual — new evidence changes substance** → submit statement
4. http://localhost:5173/governance/queues?queue=appeals&role=dpo
5. Open request → **Grant appeal**  
   `<!-- TODO: screenshot appeal_grant.png -->`

### E — Gateway PII (40s)

**Email MASK (glassbox):**

1. `/glassbox` → compile S04 if needed → tab **4 · Playground**
2. Button **Email (PII)** → **Send through gateway**
3. Show **What the model saw (masked)** with `[EMAIL_MASKED]`

**IBAN BLOCK (employee chat, after C.7):**

1. `/employee/tools/demo-s04-pending-signoff`
2. Send: `Refund to IBAN DE89370400440532013000`
3. Expect amber system message: **Personal data blocked at gateway**

| Test string | Expected |
|-------------|----------|
| `katrin.brenner@nordpay.example` | MASK → request allowed |
| `DE89370400440532013000` | BLOCK → `PII_BLOCK` |

### F — Audit + S02 BR (35s)

1. http://localhost:5173/governance/audit — filter mentally for `human_sign_off`, gateway events
2. Open `disclosure_shown: true` on any allowed inference event  
   `<!-- TODO: screenshot audit_disclosure.png -->`
3. http://localhost:5173/employee/requests/demo-s02-external — gate banner **Works council agreement (Betriebsvereinbarung) not signed**

---

## Governance role quick reference

| Header button | Persona shown | Sign-off for |
|---------------|---------------|--------------|
| DPO | Katrin Müller · DPO | `DPO / Legal` review |
| IT Security | CISO · NordPay AG | `IT / CISO` review |
| Procurement | Vendor & DPA risk | Only when procurement lane flagged |

S04 approve path: **DPO → IT Security** (procurement already cleared in transcript).

---

## Max handoff — deploy (TBD)

| Field | Value |
|-------|-------|
| ECS region | Singapore `ap-southeast-1` |
| Source repo | `shirley-xue-2025/trust-flow` branch `main` |
| Runbook | `app/deploy/ALICLOUD_DEPLOY.md` |
| Judge URL | _TBD — HTTP basic auth, shared OOB_ |
| Reseed on box | `curl -X POST https://<host>/v1/demo/reseed` |
| Deploy screenshot | `<!-- TODO: screenshot ecs_compose_ps.png -->` |

Shirley signals **demo-frozen** → Max pulls canonical `main` → `docker compose up -d --build`.

---

## If something breaks

| Symptom | Action |
|---------|--------|
| Empty queues | `POST /v1/demo/reseed` |
| SSE hang | Use replay S04 in glassbox Request tab |
| Sign off disabled | Rationale &lt; 20 characters |
| No "Use tool" | Both DPO + IT signed off |
| IBAN not blocked | Confirm request is **Approved** with active policy |

**Full script:** [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) · **Spoken lines:** [`hackathon/SPOKEN_LINES.md`](hackathon/SPOKEN_LINES.md)
