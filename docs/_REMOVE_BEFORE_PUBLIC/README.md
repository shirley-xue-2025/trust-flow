# ⚠️ REMOVE BEFORE PUBLIC

**Delete this entire folder** before changing the GitHub repo to **public**.

These files are useful during the private hackathon sprint but are **not** intended for open-source release:

| File | Reason |
|------|--------|
| `DEVPOST_DRAFT.md` | Pre-submit draft; finalize on Devpost directly |
| `BUILD_AND_DEMO_PLAN.md` | Internal build timeline / teammate pacing |
| `trustflow_context.md` | Early project context; superseded by `README.md` + `ARCHITECTURE.md` |
| `fake_door_copy.md` | Post-hackathon PMF / fake-door ad copy |

**Shirley-only blockers** live in Ring 2: `memory/BLOCKED_ON_SHIRLEY.md` (never in repo).

**Full manifest:** `memory/REMOVE_BEFORE_PUBLIC/README.md` in the local workspace (not cloned with repo).

```bash
rm -rf docs/_REMOVE_BEFORE_PUBLIC
```

Then fix links in `README.md` and `SESSION_LATEST.md` if they still point here.
