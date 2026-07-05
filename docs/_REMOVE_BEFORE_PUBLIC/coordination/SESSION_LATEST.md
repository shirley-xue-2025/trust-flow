# Session Latest — pointer file (Ring 2)

**Repo copy removed 2026-07-06** — submission sweep. This is the local handover pointer.

---

## Current state — 2026-07-06 (night)

**Phase:** **Submission pack complete on `main`** — remaining: rehearse + record video (`npm run dev:demo`), Max ECS redeploy, repo public, Devpost. **Deadline: Jul 9, 2026 @ 5 PM EDT.**

**Tonight's repo sweep:** Internal docs moved to `memory/` — demo script, tracker, session logs, competitor research, `_REMOVE_BEFORE_PUBLIC/` contents. Public repo now reads as a finished hackathon submission.

**Git:** local `main` ahead of origin — sweep staged, commit when Shirley says.

### Where things moved

| Was in repo | Now in Ring 2 |
|-------------|---------------|
| `docs/DEMO_SCRIPT.md` | `memory/submission/DEMO_SCRIPT.md` |
| `docs/JUDGE_DEMO_RUNBOOK.md` | `memory/submission/JUDGE_DEMO_RUNBOOK.md` |
| `docs/hackathon/SPOKEN_LINES.md` | `memory/submission/SPOKEN_LINES.md` |
| `docs/hackathon/PITCH_DECK_OUTLINE.md` | `memory/submission/PITCH_DECK_OUTLINE.md` |
| `docs/DEPLOY_AND_REPO_COORDINATION.md` | `memory/submission/DEPLOY_AND_REPO_COORDINATION.md` |
| `PROJECT_TRACKER.md` | `memory/coordination/PROJECT_TRACKER.md` |
| `session_logs/` | `memory/session_logs/` |
| Competitor research R6 | `memory/research/competitors/` |
| Devpost draft, fake-door | `memory/REMOVE_BEFORE_PUBLIC/` |

### Still in repo (public submission)

- Pitch deck `docs/hackathon/TrustFlow_deck.pptx`
- Judge stills `docs/hackathon/screenshots/`
- `docs/hackathon/EVIDENCE_CHAIN.md`, baseline S05
- Full app + tests (34)

**Run:** `cd app && npm run dev:demo` · **Reset:** `curl -X POST http://localhost:8080/v1/demo/reseed`

**After recording:** paste transcript → `trust-flow/docs/hackathon/DEMO_VIDEO.md`

**Manifest:** `memory/REMOVE_BEFORE_PUBLIC/README.md`
