# Session handover — live Qwen, baseline evidence, judge copy

**Date:** 2026-07-06 (late evening) · **Branch:** `main` @ `3ce0099` (synced with origin)

---

## Shipped this session

| Deliverable | Commit(s) | Verify |
|-------------|-----------|--------|
| Local DashScope env (`qwen-flash` dev / `qwen-max` demo) | `0f14150` | `curl localhost:8080/v1/health` → `live_qwen:true`, `qwen_model` |
| All S01–S05 goldens from **live qwen-max** + `capture:golden:demo` | `0f14150` | `cd app && npm test` → 34 pass |
| Glassbox custom request sends DPA + works-council status (live S04 path) | `0f14150` | `/glassbox` → Employee request → **Use custom request (live)** with payment + signed gates |
| S05 **single-agent vs boardroom** baseline artifact (Track 3 measurable improvement) | `492d0df` | `docs/hackathon/baseline/S05_comparison.json` |
| Judge readability audit (why-Germany, glosses, UI plain English) | `3ce0099` | README glossary; glassbox inputs show "Works council" not "BR" |

**Pushed:** all three commits to `shirley-xue-2025/trust-flow` `main`.

---

## How Shirley verifies (2 min)

1. `cd app && npm run dev:demo` → open http://localhost:5173/glassbox  
2. Scenario **Custom / none** → Employee request → payment checkbox + **DPA signed / Works council signed** → **Use custom request (live)** → boardroom runs (~30s), should trend **APPROVED** + `LOCAL_QWEN_72B` (not false DENIED).  
3. Scenario **S05** replay → **DENIED**, procurement veto visible.  
4. Optional CLI: `npm run baseline:demo -- S05` (needs `.env` key) — monolith `conditional_approve` vs boardroom `DENIED`.

---

## Still open (not this session)

| Item | Owner | Notes |
|------|-------|-------|
| ECS redeploy from canonical `main` | Max | W09 — live demo URL for Devpost |
| Demo video + deck export | Shirley | Jul 9 deadline |
| Repo public + Devpost submit | Shirley | Remove `_REMOVE_BEFORE_PUBLIC/` first |
| Muted-video pass on demo script | Shirley | Audit checklist |

---

## Next session goal

**Record demo video** following `docs/DEMO_SCRIPT.md` v2 — use `npm run dev:demo` (qwen-max) for live beats; S04/S05 replay for reliability. Slide 5 now has measured baseline quotes from `docs/hackathon/baseline/`.

---

## Cold start

1. `SESSION_LATEST.md`  
2. `PROJECT_TRACKER.md`  
3. `memory/setup-and-troubleshooting.md` (Qwen key in `trust-flow/.env`, gitignored)
