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

1. Open http://localhost:5173/strategy_explorer.html (or glassbox legend → **Problem framing (pitch) ↗**)
2. Strategy explorer chart visible  
   `![Strategy explorer](hackathon/screenshots/10_strategy_explorer.png)`

### B — Live boardroom S04 (55s)

1. Toolbar **Scenario** → **S04** (auto-selected on load) → **▶ Run**
2. Watch **Agent boardroom** node summary (`N rounds · APPROVED`)
3. Click **Agent boardroom** — inspector shows rounds 0–5 stream  
   `![Glassbox boardroom S04](hackathon/screenshots/01_glassbox_boardroom_s04.png)`
4. Optional: **Policy compiler** / **Compiled policy** nodes — show `policy_version_hash`

### C — Human sign-off (65s) — **30s UX target**

1. Tab: http://localhost:5173/employee/requests/demo-s04-pending-signoff
2. Confirm badge **Pending sign-off** · **Agent negotiation** tab shows transcript  
   `![Employee negotiation S04](hackathon/screenshots/02_employee_negotiation_s04.png)`
3. Tab: http://localhost:5173/governance/queues?queue=signoff&role=dpo
4. Click **Alex Weber** row → request detail
5. Header **Viewing as** → **DPO** → **Human sign-off** → rationale (≥20 chars) → **Sign off**
6. Header → **IT Security** → **Sign off**  
   `![Dual sign-off approved](hackathon/screenshots/04_governance_signoff_approved.png) (pending state: [03](hackathon/screenshots/03_governance_signoff_pending.png))`
7. Employee tab refresh → **Approved** → **View gateway activity** (not in-app chat)

### D — S05 deny + appeal (55s)

1. http://localhost:5173/employee/requests/demo-s05-denied
2. **Your Advocate** — type *"Why was this denied?"*
3. **Appeal** → **Factual — new evidence changes substance** → submit statement
4. http://localhost:5173/governance/queues?queue=appeals&role=dpo
5. Open request → **Grant appeal**  
   `<!-- TODO: screenshot appeal_grant.png -->`

### E — Gateway PII (40s)

**Email MASK (glassbox):**

1. `/glassbox` → **Gateway enforce** node (S04 compiled)
2. Button **Email (masked)** → **Send through gateway**
3. Show **What the model saw (masked)** with `[EMAIL_MASKED]`

**IBAN BLOCK (glassbox):**

1. Same inspector → **IBAN (may block)** → **Send through gateway**
2. Expect **Personal data blocked at gateway**

**Employee audit (optional):**

1. `/employee/requests/demo-s04-pending-signoff?tab=activity` — gateway activity list after sign-off

| Test string | Expected |
|-------------|----------|
| `katrin.brenner@nordpay.example` | MASK → request allowed |
| `DE89370400440532013000` | BLOCK → `PII_BLOCK` |

### F — Audit + S02 BR (35s)

1. http://localhost:5173/governance/audit — filter mentally for `human_sign_off`, gateway events
2. Open `disclosure_shown: true` on any allowed inference event  
   `![Governance audit](hackathon/screenshots/07_governance_audit.png)`
3. http://localhost:5173/employee/requests/demo-s02-external — gate banner **Works council agreement (Betriebsvereinbarung) not signed**
4. Optional: `/glassbox` → **Audit trail** node

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
| SSE hang | Glassbox **Scenario** → **S04** replay |
| Sign off disabled | Rationale &lt; 20 characters |
| No gateway activity | Both DPO + IT signed off → **Gateway activity** tab |
| IBAN not blocked | Use glassbox **Gateway enforce** with IBAN sample |
| BR stuck at 80% on S04 | Policy resolved by hash — reseed if confused with S02 |

**Full script:** [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) · **Spoken lines:** [`hackathon/SPOKEN_LINES.md`](hackathon/SPOKEN_LINES.md)
