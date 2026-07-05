# Session handover — 2026-07-05 — Presentation track (hackathon artifacts)

## Delivered (Track B — no product code)

| ID | Artifact | Path |
|----|----------|------|
| B1 | Demo script v2 (winning cut) | [`docs/DEMO_SCRIPT.md`](../docs/DEMO_SCRIPT.md) |
| B2 | Judge one-page runbook | [`docs/JUDGE_DEMO_RUNBOOK.md`](../docs/JUDGE_DEMO_RUNBOOK.md) |
| B3 | Pitch deck outline (9 slides) | [`docs/hackathon/PITCH_DECK_OUTLINE.md`](../docs/hackathon/PITCH_DECK_OUTLINE.md) |
| B4 | Architecture PNG export | [`docs/hackathon/diagrams/architecture.png`](../docs/hackathon/diagrams/architecture.png) |
| B4b | Round schedule PNG (optional) | [`docs/hackathon/diagrams/round_schedule.png`](../docs/hackathon/diagrams/round_schedule.png) |
| B5 | Devpost DRAFT | [`docs/hackathon/DEVPOST_DRAFT.md`](../docs/hackathon/DEVPOST_DRAFT.md) |
| B6 | Spoken lines cheat sheet | [`docs/hackathon/SPOKEN_LINES.md`](../docs/hackathon/SPOKEN_LINES.md) |
| B7 | Evidence chain one-pager | [`docs/hackathon/EVIDENCE_CHAIN.md`](../docs/hackathon/EVIDENCE_CHAIN.md) |

## Decisions honored in docs

- Video arc: Problem → Glassbox S04 SSE → HITL → S05 appeal → PII → Audit + S02 BR
- No Presidio / PII round-trip restore claims
- PII honest: email **MASK**, IBAN **BLOCK**
- Hybrid deploy: Layer A VPC + Layer B Qwen Cloud
- Competitors: TrendAI / Naaia / TrustFlow; LiteLLM = dev proxy one-liner
- 98% / weeks→seconds labeled **illustrative**

## Track 3 checklist — covered in B1 + B3 + B6

- [x] Task decomposition (lanes/rounds)
- [x] Disagreement resolution (S04 compromise, S05 veto, appeal, S02 external)
- [x] Measurable vs single-agent baseline (deck slide 5 — not fake 98% without label)

## UI label contract (Track A)

Documented in `DEMO_SCRIPT.md` — Employee **Negotiation** vs Governance **Boardroom**; exact sign-off strings.

## Not done (out of scope)

- Product code changes
- Devpost final submit / repo public / video recording
- Screenshot placeholders (marked TODO in runbook + deck)
- ECS URL / deploy screenshot (Max — DEPLOY fields in DEVPOST_DRAFT)

## Next session

1. Rehearse 5 min against `DEMO_SCRIPT.md` (phone viewport optional)
2. Capture screenshots for runbook TODOs
3. Export deck outline → PPT
4. Record video when demo-frozen; ask Max for ECS redeploy
5. Finalize Devpost from DRAFT after Shirley review

## Git

**Not committed** — Shirley did not request commit this session.
