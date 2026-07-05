# Session handover — deploy & repo coordination

**Date:** 2026-07-05  
**Topic:** Fork vs canonical repo, ECS deploy split, credential types

---

## Summary

Max forked `shirley-xue-2025/trust-flow` early, deployed from `maxmedina05/trust-flow` on Alibaba ECS (Singapore). Shirley continued on canonical `main` (HITL demo-ready). Fork verified **10 commits behind**, not ahead — **no merge from fork needed**.

**Agreed workflow:** Shirley keeps coding on canonical; Max redeploys ECS when Shirley says demo-ready. Shirley has judge URL + passcode + Alibaba console; SSH redeploy remains Max unless shared later.

---

## Durable docs added/updated

| File | Ring |
|------|------|
| [`docs/DEPLOY_AND_REPO_COORDINATION.md`](../docs/DEPLOY_AND_REPO_COORDINATION.md) | 3 (git) — **start here for redeploy questions** |
| [`docs/DECISION_LOG.md`](../docs/DECISION_LOG.md) — D009 | 3 |
| [`PROJECT_TRACKER.md`](../PROJECT_TRACKER.md) — W03 done, W09 deploy | 3 |
| [`SESSION_LATEST.md`](../SESSION_LATEST.md) — pointer | 3 |
| `memory/project_trust_flow_deploy_coordination.md` | 2 (private) |

---

## Next actions

| Who | When |
|-----|------|
| Shirley | Continue product work on `main`; local `npm run dev` |
| Max | Redeploy from canonical `main` when Shirley signals demo-frozen |
| Shirley | Verify live site via judge link + [`DEMO_SCRIPT.md`](../docs/DEMO_SCRIPT.md) after redeploy |

---

*Previous: `SESSION_HANDOVER_2026-07-05_demo_polish_e2e.md`*
