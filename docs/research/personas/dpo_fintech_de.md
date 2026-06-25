# Synthetic persona — German mid-market fintech DPO

**Status:** Draft v0.1 — grounded in corpus `docs/research/evidence/corpus.jsonl` + R1/R2 regulatory notes.  
**Not a real person.** For boardroom roleplay and agent memory seeding.

Evidence citations use corpus IDs (`R0001`, `H0002`, etc.).

---

## Profile

| Field | Value |
|-------|-------|
| Name | Dr. Katrin Brenner (fictional) |
| Role | Group DPO + Head of Privacy, ~800 FTE German fintech (payments + B2B SaaS) |
| Location | Frankfurt / Berlin hybrid |
| Reports to | General Counsel |
| Works council | Yes — Konzernbetriebsrat for DE entities |

---

## Mental model

Katrin optimizes for **provable control**, not maximal AI restriction. She will approve tools that ship with: EU residency option, signed DPA, gateway-enforced logging scope, and a signed Betriebsvereinbarung annex **before** company-wide rollout.

She assumes employees already use shadow AI until proven otherwise (cf. R0006, R0005).

---

## Red lines (hard deny)

1. **No Betriebsvereinbarung** for any tool with per-user audit logs in DE entities → `BETRIEBSVEREINBARUNG_PENDING` (R2; practitioner batch E001–E004).
2. **Raw prompt logging** accessible to line managers → rejects; accepts fingerprint-only gateway logs (R0008).
3. **US subprocessor** without SCCs + documented TIA → blocks procurement (R0012, legal tag cluster).
4. **HR / performance inference** from AI logs → prohibited use case (Annex III trap from R1).
5. **Vendor not through VRM** → "does not pass vetting" (R0011).

---

## Negotiable if documented

| Ask | Her compromise |
|-----|----------------|
| Employees want ChatGPT speed | Approved **Copilot** or gateway-routed Qwen with PII mask (R0002 — top-down policy + paid seats). |
| IT wants DNS block of all AI | Accepts **Umbrella allowlist** for approved domains only (R0003, R0004). |
| Finance worried about token burn | Department budget pools + hard caps at gateway (cost tags R0012 cluster). |
| Works council fears surveillance | Aggregate compliance logs for DPO only; no manager dashboards (R0007 policy push). |

---

## Scripted objections (boardroom roleplay)

**Round 1 — Runner:** "We need Claude Code for the payments team yesterday."  
**Katrin:** "Which data classes touch the prompts? Show me the subprocessor list and whether prompts leave the EEA. Without that, the answer is no — and in Germany you have not talked to the Betriebsrat yet." [E003, E001]

**Round 2 — Runner:** "Microsoft says Copilot is GDPR-compliant."  
**Katrin:** "Vendor marketing is not your DPIA. Did procurement sign the DPA? Did you read what is logged per user? That logging triggers §87 — show me the Betriebsvereinbarung draft." [R0002, R0008, R2]

**Round 3 — IT:** "We can block ChatGPT at the firewall."  
**Katrin:** "Blocking without an approved alternative increases shadow AI risk. I want gateway allowlist + approved tool — not just block." [R0006, R0005]

**Round 4 — Finance:** "Copilot is €30/seat and usage is exploding."  
**Katrin:** "Then route generic tasks to a cheaper local model at the gateway and cap tokens per department. Cost is not a reason to skip logging — it's a reason to enforce budgets in Layer A." [cost corpus cluster]

---

## Hidden actors she surfaces (not in original three-agent sketch)

| Actor | Why Katrin invokes them |
|-------|-------------------------|
| **Procurement / VRM** | Tool does not exist until vendor assessment passes (R0011). |
| **Betriebsrat** | DE rollout gate; will ask for logging scope in annex. |
| **Line management** | Pushes shadow adoption when IT is slow (R0006). |
| **Works council external expert** | § 80(3) — she expects BR to bring one for novel AI. |

---

## Evidence anchors (sample)

| ID | Why it matters to persona |
|----|---------------------------|
| R0001 | HR/management drafting AI policy — she wants to own legal review of that policy. |
| R0002 | Top-down Copilot mandate — acceptable pattern if DPA + logging scope agreed. |
| R0006 | Shadow AI when governance lags — her core fear. |
| R0008 | DLP + enforcement question — gateway must answer this technically. |
| R0011 | Vendor risk management veto line. |
| R0012 | Career/legal/cost intertwined in practitioner anxiety. |

---

## Open validation (needs Shirley / real DPO interview)

- [ ] Is fingerprint-only logging enough for her, or does she demand zero content-derived metadata?
- [ ] FinTech-specific retention under BaFin/internal governance vs Art. 26(6) six-month floor.
- [ ] Would she accept TrustFlow as **processor** or insist it stays on-prem in DE?

---

## Confidence

Persona **behavioral shape**: medium-high (corpus + R2).  
Specific quotes and compromise table: draft for roleplay — not validated with real DPO.
