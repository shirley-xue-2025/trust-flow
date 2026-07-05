# Demo script v2 — winning cut (5 min max)

**Track:** Qwen Cloud Hackathon · Track 3 — Agent Society  
**Run:** `cd app && npm run dev` → http://localhost:5173  
**Reset:** `curl -X POST http://localhost:8080/v1/demo/reseed`  
**Live URL (when deployed):** _TBD — Max ECS redeploy from canonical `main`_

**Video arc:** Problem → Glassbox canvas S04 SSE → HITL sign-off → S05 deny/appeal → Gateway PII → Audit + S02 BR → close

---

## Cast & surfaces

| Role | URL | Persona |
|------|-----|---------|
| Narrator / judge view | `/glassbox` | Technical — boardroom theater + detail panel |
| Employee | `/employee` | Alex Weber |
| DPO / IT | `/governance` | Katrin Müller — use header **Viewing as** role tabs |
| Strategy problem frame | `/strategy_explorer.html` (link from glassbox legend — not a pipeline node) | Pitch only |

---

## UI label contract (must match Track A)

| Context | Exact string in UI |
|---------|-------------------|
| Employee status | `Stakeholder review`, `Pending sign-off`, `Approved` |
| Employee request tabs | `Overview`, `Agent negotiation`, `Policy`, `Gateway activity` |
| Governance request tab | `Agent negotiation trace` |
| Governance sign-off card | `Human sign-off` → button `Sign off` |
| Governance roles (header) | `All roles`, `DPO`, `Procurement`, `IT Security` |
| Sign-off roles in list | `DPO / Legal`, `IT / CISO` |
| Employee advocate | `Your Advocate` |
| Employee appeal | `Appeal` → type `Factual — new evidence changes substance` |
| Governance appeal action | `Grant appeal` |
| Deny message (S05) | Procurement veto copy — not PII block |
| Gateway deny (IBAN) | `Personal data blocked at gateway` (`PII_BLOCK`) |
| Post-approval CTA | `View gateway activity` + link to glassbox Playground — **no in-app tool chat** |
| Architecture strip | `Agents propose → Compiler signs → Humans approve → Gateway enforces` |
| Glassbox pipeline stages | `Employee request` · `Org gates read` · **Agent boardroom (stage)** · `Policy compiler` · `Compiled policy` · `Gateway enforce` · `Audit trail` · `Result` |
| Glassbox legend | Blue = Connected systems inform · Green = AI reasons & proposes · Purple = Mechanics validate & execute |

---

## Beat 0 — Cold open / problem (0:00–0:40)

| | |
|---|---|
| **Path** | http://localhost:5173/strategy_explorer.html (or **Problem framing (pitch) ↗** in glassbox legend) |
| **Show** | Inspector: strategy explorer iframe — approval deadlock chart, shadow-AI friction |
| **Spoken** | *"Enterprise AI doesn't fail on models — it fails on approvals. IT tickets and email chains take weeks; employees route around policy with shadow ChatGPT. We're not building another Jira queue or ServiceNow form — TrustFlow compresses multi-stakeholder negotiation into a compiled gateway policy."* |
| **Track 3 — decomposition** | Problem sets up **five specialist lanes** (Runner, Procurement, Compliance, Works Council, IT) vs one generic approver. |
| **Track 3 — negotiation** | — (setup beat) |
| **Track 3 — baseline** | Strategy explorer **98%** tile = **illustrative projection** — say *"weeks to seconds in stakeholder review, not a measured production SLA."* |

**Recovery:** If iframe blank → open http://localhost:5173/strategy_explorer.html directly.

---

## Beat 1 — Live agent society: S04 boardroom (0:40–1:35)

| | |
|---|---|
| **Path** | `/glassbox` — toolbar **Scenario** → **S04** (auto-loads on first visit) → **▶ Run** — watch transcript on stage |
| **Show** | Live rounds 0–5 in the boardroom theater; roster stance chips update. Click **Employee request** or enforcement chips for the detail panel. |
| **Spoken** | *"Watch five agents decompose one employee request into lanes — procurement checks DPA, compliance sets audit red lines, works council clears §87 Betriebsrat, IT assigns sovereign routing. This is Qwen Cloud boardroom on Layer B; enforcement stays deterministic on Layer A in the customer VPC."* |
| **Track 3 — decomposition** | Round schedule: R0 Runner → R1 Procurement → R2 Compliance → R3 Works Council → R4 IT → R5 consensus. |
| **Track 3 — negotiation** | Compliance **conditional_approve** vs IT **concessions** on `routing.sensitive` — compromise, not instant agreement. |
| **Track 3 — baseline** | Golden replay completes in **seconds**; email approval chain = **weeks** (journey map — illustrative). |

**Fallback:** If `DASHSCOPE_API_KEY` missing → Scenario **S04** uses canned golden transcript (no live LLM).

**Recovery:** Empty boardroom → reseed; persisted `transcript_snapshot` on employee request survives restart.

---

## Beat 2 — HITL sign-off → employee activation (1:35–2:40)

| | |
|---|---|
| **URLs** | `/employee/requests/demo-s04-pending-signoff` → `/governance/queues?queue=signoff&role=dpo` |
| **Clicks** | 1. Employee → **Agent negotiation** tab — full transcript, status **Pending sign-off** — no gateway activity yet 2. Governance → open **Alex Weber** / Claude Code row 3. Header **DPO** → **Human sign-off** → rationale ≥20 chars → **Sign off** 4. Header **IT Security** → **Sign off** 5. Employee refresh → **Approved** → **View gateway activity** (IDE copy: use Claude Code outside this portal) |
| **Spoken** | *"Agents recommended approval in seconds; humans still own activation — one-click sign-off on the policy diff, not a ticket workflow. DPO and IT parallel review before the gateway goes live."* |
| **Track 3 — decomposition** | Agents author; **DPO + IT** roles activate (Layer C HITL). |
| **Track 3 — negotiation** | Human can **Reject** — demo approve path only. |
| **Track 3 — baseline** | **30-second sign-off UX target** (two clicks + rationale) vs multi-week approval meetings. |

**UI strings:** `Waiting for human sign-off`, `Stakeholders recommended approval. DPO and IT must sign off before you can use this tool.`

**Post-sign-off:** Compliance **100%** when S04 policy hash is used (BR signed in packet; no `BETRIEBSVEREINBARUNG_PENDING` on that hash). Gateway activity tab shows seeded email MASK event.

---

## Beat 3 — Deny, advocate, appeal (2:40–3:35)

| | |
|---|---|
| **URL** | `/employee/requests/demo-s05-denied` |
| **Clicks** | 1. Status denied — **Your Advocate** → ask *"why was this denied?"* 2. **Appeal** → **Factual — new evidence changes substance** → submit 3. `/governance/queues?queue=appeals&role=dpo` → open request → **Grant appeal** 4. Boardroom re-runs → back to **Pending sign-off** |
| **Spoken** | *"Disagreement doesn't vanish — procurement vetoes unsigned OpenAI DPA. New evidence reopens stakeholder review; humans still own the outcome. A single generic 'compliance agent' would miss the vendor gate."* |
| **Track 3 — decomposition** | S05 golden: Procurement round 1 + 5 **reject** — lane-specific veto. |
| **Track 3 — negotiation** | **Reject** stance holds until external gate clears; appeal = structured disagreement resolution. |
| **Track 3 — baseline** | Multi-agent S05 → **DENIED** (correct); single-agent baseline → risk of false approve without DPA lane (see deck slide 5). |

**Optional 10s:** **Propose alternative** → Copilot child request (`parent=demo-s05-denied`).

---

## Beat 4 — Gateway PII (honest) (3:35–4:15)

| | |
|---|---|
| **Path A (email MASK)** | `/glassbox` → click **Gateway enforce** chip → detail panel **Email (masked)** → **Send through gateway** → raw vs **What the model saw (masked)** with `[EMAIL_MASKED]` |
| **Path B (IBAN BLOCK)** | Same — **IBAN (may block)** sample → **Personal data blocked at gateway** |
| **Path C (employee audit)** | `/employee/requests/demo-s04-pending-signoff?tab=activity` after sign-off — gateway activity list (no in-app chat) |
| **Spoken** | *"Layer A is regex policy — email is masked and the request can continue; IBAN is hard-blocked at the edge. We do not round-trip restore PII; the audit log records fingerprints and `pii_actions`, not raw prompts. Deterministic code — not LLM guesswork."* |
| **Track 3 — decomposition** | Gateway = separate deterministic layer from boardroom agents. |
| **Track 3 — negotiation** | — |
| **Track 3 — baseline** | Pre-flight scan adds **&lt;10ms** (demo); no cloud exfil on BLOCK path. |

**Do NOT say:** Presidio, NER production stack, or "PII restored after masking."

**Test strings:**

| Entity | String | Policy action | Outcome |
|--------|--------|---------------|---------|
| Email | `katrin.brenner@nordpay.example` | MASK | Allowed with `[EMAIL_MASKED]` |
| IBAN | `DE89370400440532013000` | BLOCK | Denied `PII_BLOCK` |

---

## Beat 5 — Audit, sovereign route, S02 BR wedge (4:15–4:50)

| | |
|---|---|
| **URLs** | `/governance/audit` · `/employee/requests/demo-s02-external` (quick) · `/glassbox` → **Audit trail** node |
| **Show** | Audit events: `human_sign_off`, `appeal_decision`, gateway `disclosure_shown: true` (Art. 50) · S02 gate: **Works council agreement (Betriebsvereinbarung) not signed** |
| **Spoken** | *"Every inference emits schema-valid audit — policy hash, routing, `disclosure_shown` for EU AI Act transparency. TrendAI secures like a firewall; Naaia documents like GRC — TrustFlow negotiates like a boardroom and enforces like a gateway, with Betriebsrat §87 co-determination neither competitor emphasizes. Hybrid deploy: Layer A gateway in your VPC, Layer B boardroom on Qwen Cloud."* |
| **Track 3 — decomposition** | Audit ties agent output → compiler hash → gateway enforcement. |
| **Track 3 — negotiation** | S02 = **PENDING_EXTERNAL** — disagreement escalates outside software (BR process). |
| **Track 3 — baseline** | Evidence chain: 55 corpus items, 21 tagged `approval_process` (see `docs/hackathon/EVIDENCE_CHAIN.md`). |

**LiteLLM one-liner (if asked):** *"LiteLLM is a dev proxy for model routing during build — production enforcement stays in Layer A gateway code."*

---

## Beat 6 — Close (4:50–5:00)

| | |
|---|---|
| **Spoken** | *"Agents compress negotiation; humans keep control; the gateway enforces deterministically. Repo and live demo on Devpost — questions?"* |
| **CTA** | GitHub + ECS URL placeholders (Max) |

---

## Recovery table

| Issue | Fix |
|-------|-----|
| Empty employee requests | `curl -X POST http://localhost:8080/v1/demo/reseed` |
| Boardroom SSE fails | Glassbox toolbar **Scenario** → **S04** / **S05** replay |
| No `DASHSCOPE_API_KEY` | Golden replay only — still demo-complete |
| Stuck pending sign-off | Reseed; sign DPO then IT (both required for S04) |
| No gateway activity | Both human reviews approved → status **Approved** → **Gateway activity** tab |
| Gateway node empty | Run boardroom first (**Agent boardroom** → **Result** shows APPROVED) |
| BR pending at 80% after S04 approve | UI uses `policy_version_hash` — reseed if stale; S04 hash has BR signed |
| Wrong tab label | Employee = **Agent negotiation**; Governance = **Agent negotiation trace** |

---

## Pre-seeded request IDs

| ID | Scenario | End state | Primary beat |
|----|----------|-----------|--------------|
| `demo-s04-pending-signoff` | S04 | Pending sign-off → approve path | Beats 2, 4 |
| `demo-s05-denied` | S05 | Denied — appeal demo | Beat 3 |
| `demo-s02-external` | S02 | Pending external (BR) | Beat 5 |

---

## Track 3 checklist (this script)

- [x] **Decomposition** — Beats 1, 2, 3 (rounds + lanes + HITL roles)
- [x] **Disagreement resolution** — Beat 1 compromise (S04), Beat 3 veto + appeal (S05), Beat 5 external (S02)
- [x] **Measurable baseline** — Beats 0, 1, 2, 3, 4 (time + quality; illustrative labels where noted)

**Related:** [`docs/JUDGE_DEMO_RUNBOOK.md`](JUDGE_DEMO_RUNBOOK.md) · [`docs/hackathon/SPOKEN_LINES.md`](hackathon/SPOKEN_LINES.md) · [`docs/hackathon/PITCH_DECK_OUTLINE.md`](hackathon/PITCH_DECK_OUTLINE.md)
