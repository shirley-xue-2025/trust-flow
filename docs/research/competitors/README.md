# Competitor visual reference (R6)

Curated screenshots extracted from **public** marketing sites, product pages, and partner blogs (2026-06-30). No vendor demo access.

**Important:** Naaia does not publish full product console screenshots — UI below is reconstructed from **Lottie marketing animations** on [naaia.ai](https://naaia.ai/en/). TrendAI images are from [trendaisecurity.com](https://www.trendaisecurity.com/) (Sanity CDN) and [AWS Marketplace blog](https://aws.amazon.com/blogs/awsmarketplace/detecting-misconfigurations-and-mitigating-ai-risks-to-secure-amazon-bedrock-with-trendai-vision-one/).

---

## TrendAI — what the UI tells us

| File | Source | UX / feature takeaway |
|------|--------|----------------------|
| [`trendai/01-ai-guard-dashboard-blocked-content.png`](trendai/01-ai-guard-dashboard-blocked-content.png) | trendaisecurity.com | **Employee AI usage dashboard:** attack objectives (prompt leakage, sensitive disclosure), blocked content donut (73% prompt attacks), severity breakdown, 30-day event timeline |
| [`trendai/02-ai-guard-policy-events.png`](trendai/02-ai-guard-policy-events.png) | trendaisecurity.com | **AI Guard policy panel:** Moderate security level; toggles for harmful content / sensitive info / prompt attack; 722 blocks in 7 days |
| [`trendai/03-ai-security-blueprint.png`](trendai/03-ai-security-blueprint.png) | trendaisecurity.com | **AI Security Blueprint (preview):** 12 AI services, 45 users; lifecycle sections (Develop → Deploy) with deep links to repo/CI/CD/container inventory |
| [`trendai/04-ai-spm-bedrock-guardrail-failure.png`](trendai/04-ai-spm-bedrock-guardrail-failure.png) | AWS blog | **AI-SPM finding card:** Bedrock guardrail missing PII filter — FAIL with ARN, region, “Resolve” / “Suppress” actions |
| [`trendai/05-ai-spm-bedrock-rules-table.png`](trendai/05-ai-spm-bedrock-rules-table.png) | AWS blog | **Rule catalog table:** Bedrock-001…007, risk level, categories — compliance-as-checklist for cloud AI infra |
| [`trendai/06-xdr-bedrock-guardrail-deletion-alert.png`](trendai/06-xdr-bedrock-guardrail-deletion-alert.png) | AWS blog | **XDR Workbench alert:** “Guardrail deletion detected” mapped to MITRE + AML.T0015; entity graph (IAM user → CLI → IP) |
| [`trendai/07-workbench-incident-graph.png`](trendai/07-workbench-incident-graph.png) | AWS blog | General SOC workbench — insight narrative + attack graph (context for platform scope) |

### TrendAI UX patterns for TrustFlow

1. **Three-block taxonomy** on AI Guard: Harmful content · Sensitive information · Prompt attack → map to gateway rule groups.
2. **Monitor vs enforce** implied by “Manage usage” + block counts without user-facing explanation text.
3. **AI Security Blueprint** = executive landing: counts first (services, users, repos), drill-down second.
4. **Cloud AI-SPM** = PASS/FAIL cards with one-click remediation links — good model for **tool registry health** widget.
5. **Dark SOC aesthetic** — CISO buyer; not employee-friendly.

---

## Naaia — what the UI tells us

| File | Source | UX / feature takeaway |
|------|--------|----------------------|
| [`naaia/01-action-plan-card-impact-assessment.png`](naaia/01-action-plan-card-impact-assessment.png) | naaia.ai Lottie (Streamline compliance) | **Action card:** title, date, assignee avatars, EU flag + “AI Act”, linked “10 obligations” + “1 impact analysis matrix” |
| [`naaia/02-compliance-task-done-badge.png`](naaia/02-compliance-task-done-badge.png) | naaia.ai Lottie (Compliance evidence) | **Task row:** obligation text + green **Done** pill + “AI Act — Applicable on 20 products” |
| [`naaia/03-registry-eu-ai-act-progress-70pct.png`](naaia/03-registry-eu-ai-act-progress-70pct.png) | naaia.ai Lottie (Centralized registry) | **Registry row:** EU flag, Provider / High risk AI product labels, **70%** progress bar |
| [`naaia/04-risk-detected-badge.png`](naaia/04-risk-detected-badge.png) | naaia.ai Lottie (Risk assessment hero) | Status chip: red dot + “Risk detected” |

### Naaia UX patterns for TrustFlow

1. **Card-based compliance tasks** with date, owners, and deep links to obligations/matrices — mirror in boardroom output.
2. **Progress % per regulation** on each AI asset (not just global score).
3. **Done badge + product count** (“Applicable on N products”) — satisfies auditor “show your work”.
4. **Light mode, rounded cards, EU flag iconography** — DPO/legal buyer tone vs TrendAI dark SOC.
5. **No runtime block message** in any public visual — confirms documentation-first positioning.

---

## Side-by-side contrast

| Dimension | TrendAI | Naaia |
|-----------|---------|-------|
| Visual tone | Dark SOC / security ops | Light GRC / project management |
| Primary metric | Blocks, attacks, risk events | % compliance, obligations, Done |
| User avatar | Security analyst | Compliance owner + assignees |
| AI Act surfacing | Via cloud Bedrock rules | EU flag + Provider + High-risk label |
| Action model | Configure / Resolve / Suppress | Open obligations / impact matrix |

---

## Raw assets

Full-resolution downloads, Lottie JSON sources, and unused extractions live in [`raw/`](raw/) for re-processing. Prefer **curated** paths above in docs and demos.

---

*Analysis:* [`../04_competitor_trendai.md`](../04_competitor_trendai.md) · [`../05_competitor_naaia.md`](../05_competitor_naaia.md) · [`../06_competitor_inspiration_for_trustflow.md`](../06_competitor_inspiration_for_trustflow.md)
