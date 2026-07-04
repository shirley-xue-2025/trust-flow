# Session handover — 2026-07-04

**Focus:** Product unification fixes, design-review remediation, HITL + negotiation transparency PRD.

---

## What shipped (local, uncommitted)

### Design-review fixes (accessibility + blockers)

- **B1 CSS leak fixed:** `styles.css` scoped to `.glassbox` only; removed global import from `main.tsx`; imported in `DemoApp.tsx`.
- **B2 Governance mobile nav:** bottom nav + `pb-24` on mobile.
- **Should-fixes:** green approve badges, `DENY_LABELS` in ToolChat, org-wide audit empty message, mobile nav labels (Home/New/Requests), ProductRoleSwitcher with "Viewing as", `text-foreground` on headings.
- **Build verified:** `npm run build` passes.

### Product unification (prior in session, still uncommitted)

- Routes: `/employee/*`, `/governance/*`, `/glassbox/*` (demo demoted).
- Governance console: dashboard, request oversight, audit.
- Shared trust components: `BoardroomTranscript`, `ComplianceScoreCard`, `PolicyTrustCard`, `AuditTrustList`.
- Employee `RequestDetail`: tabs (Overview, Negotiation, Policy, My usage).
- Backend: `GET /v1/governance/overview`, `GET /v1/governance/requests/:id`, `GET /v1/boardroom/:id`.
- Backend boot fix: `isMain` check for paths with spaces (`Trust Flow`).

### PRD (committed-worthy doc only)

**[`docs/plans/prd_human_in_the_loop_and_negotiation_transparency.md`](../docs/plans/prd_human_in_the_loop_and_negotiation_transparency.md)** — v0.2, decisions locked.

| Decision | Choice |
|----------|--------|
| Queue UX | Unified list + role filter tabs (All · DPO · Procurement · IT · Appeals · External) |
| Human sign-off | Multi-role parallel reviews (Layer C mirrors agent boardroom) |
| Agent approve | Draft policy → humans sign off → gateway active |
| Agent deny | Advocate (live Qwen + fallback) + accept / appeal / propose alternative |
| Appeal routing | Type-dependent: procedural → human reviews; factual/scope → re-open boardroom |
| External gates | BR/DPA blocks activation |
| Terminology | "Stakeholder review" (employee); "Agent Society" (glassbox only) |

Mock appeal scenarios: Appeal A (procedural/S02), B (factual/S05), C (alternative scope/S03), D (wrong-tool guardrail).

---

## Git state

- **Branch:** `main` @ `9305fc5` (synced with origin).
- **Uncommitted:** ~10 modified files + new `governance/`, `components/trust/`, PRD. **No commit this session** (user did not request).

---

## Next session — recommended start

1. `git status` — decide whether to commit product-unification + PRD as one or split PRs.
2. Read **PRD v0.2** → write technical spec (state model, API contracts, audit schema extensions).
3. Build order:
   - Epic A: seed demo transcripts (S04/S02) + promote negotiation UI
   - Epic B: draft policy + multi-role sign-off queues + gateway activation gate
   - Epic C/D: live Advocate + employee resolution paths + appeal types
   - Epic E: governance queue polish (tabs C)

**Cold-start prompt:**

> Spec from `docs/plans/prd_human_in_the_loop_and_negotiation_transparency.md` v0.2 — start with state model + governance queue APIs.

---

## Deferred (explicit)

- Deployment / July 9 submission prep (user deferred earlier).
- Commit + push uncommitted work.
- Glassbox scenario scripted tour.

---

## Dev environment

- Canonical path: `~/shirley/Trust Flow/trust-flow/`
- `cd app && npm run dev` → web `:5173`, backend `:8080`
