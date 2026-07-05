# Session handover — 2026-07-05 — Win strategy & doc audit

**Goal:** Document hackathon win strategy in Ring 2; classify repo docs for public release; move sensitive files.

---

## Delivered

| Item | Location |
|------|----------|
| Win strategy master | `memory/HACKATHON_WIN_STRATEGY.md` (local only) |
| Public-repo manifest | `memory/REMOVE_BEFORE_PUBLIC/README.md` |
| Shirley blockers (full) | `memory/BLOCKED_ON_SHIRLEY.md` |
| Private session log | `memory/session_logs/SESSION_2026-07-05_hackathon_win_strategy_and_doc_audit.md` |
| Repo: delete-before-public folder | `docs/_REMOVE_BEFORE_PUBLIC/` |
| Repo: blockers stub | `docs/BLOCKED_ON_SHIRLEY.md` (pointer to Ring 2) |

## Moved into `docs/_REMOVE_BEFORE_PUBLIC/`

- `DEVPOST_DRAFT.md` (from `docs/hackathon/`)
- `BUILD_AND_DEMO_PLAN.md` (from `docs/plans/`)
- `trustflow_context.md` (from `docs/`)
- `fake_door_copy.md` (from `docs/research/pmf/`)

**Before making repo public:** `rm -rf docs/_REMOVE_BEFORE_PUBLIC` and update links.

## Still public / Max-facing

- `docs/DEMO_SCRIPT.md`, `docs/JUDGE_DEMO_RUNBOOK.md`
- `docs/DEPLOY_AND_REPO_COORDINATION.md`, `app/deploy/ALICLOUD_DEPLOY.md`
- `docs/hackathon/PITCH_DECK_OUTLINE.md`, `SPOKEN_LINES.md`, `EVIDENCE_CHAIN.md`, `diagrams/`

## Product + presentation state (same day)

Track A + B completed earlier — see:

- `session_logs/SESSION_HANDOVER_2026-07-05_product_track3_visibility.md`
- `session_logs/SESSION_HANDOVER_2026-07-05_presentation_track.md`

## Next

1. Rehearse demo → video → public repo → Devpost (draft in `_REMOVE_BEFORE_PUBLIC/`)
2. Max: ECS redeploy + deploy screenshot

## Git

**Not committed** — Shirley did not request commit.
