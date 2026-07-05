# Session handover — Glassbox boardroom theater (2026-07-05)

## What changed

Replaced the zoom/pan **node canvas** (`glassbox-canvas-app`, SVG edges, Fit/zoom toolbar) with a **boardroom-first shell**:

| Component | Role |
|-----------|------|
| `GlassBoxCanvas.tsx` | Orchestrator — toolbar, pipeline, main grid, optional detail panel |
| `PipelineStrip.tsx` | Trust pipeline: Inputs → Agent boardroom → Compiler → Humans → Gateway |
| `BoardroomTheater.tsx` | Hero stage — title, roster, full-height transcript |
| `BoardroomStageTranscript.tsx` | Live negotiation turns (`variant: theater`) |
| `EnforcementBar.tsx` | Enforcement chips + input context bar |
| `boardroomRoster.ts` | Agent order + stance helpers |
| `processGraph.ts` | **`nodeSummary()` + `resultGrounding()` only** (canvas geometry removed) |
| `NodeInspector.tsx` | Detail panel content; `boardroom` case returns `null` (transcript is on stage) |

**Layout:** `glassbox-shell` grid — theater left, **in-layout detail panel** right (not `position: fixed`). Technical panels (compiler, policy, gateway, audit) wrap in dark `.glassbox` inside `glassbox-panel__body--tech`.

**Product portals:** `StakeholderSummaryCard`, `ArchitectureStrip` — boardroom as hero; negotiation tab first on employee/governance request detail.

**Removed:** `BoardroomNodeFace.tsx`, ~850 lines of `.glassbox-canvas-app` CSS, unused `NodeInspector` props (`boardroomError`, `onRunBoardroom`).

## Verify

```bash
cd app && npm run test && npm run test:e2e && npm run build --workspace web
npm run dev
```

- `/glassbox` — S04 auto-loads; **Run** → rounds 0–5 on stage; click **Employee request** → light panel on right (no clip at ~1400px)
- `/employee/requests/demo-s04-pending-signoff` — Agent negotiation tab + hero card + glassbox link

## Docs updated

`SESSION_LATEST.md`, `ARCHITECTURE.md` §6, `DEMO_SCRIPT.md`, `app/README.md`, `PROJECT_TRACKER.md`, `.cursor/skills/trust-flow-session/SKILL.md`.

## Deferred (unchanged)

- Policy diff in `PolicyTrustCard`
- Glassbox → employee deep link
- Strategy explorer 3→5 agents copy

## Locked demo facts

- PII: email **MASK**, IBAN **BLOCK** — no Presidio, no mask-and-restore
- Employee audit: **Gateway activity** tab (not in-app tool chat)
