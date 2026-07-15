# Hackathon submission pack

Judge-facing artifacts for **Qwen Cloud Global AI Hackathon — Track 3: Agent Society**.

| Asset | Purpose |
|-------|---------|
| [`problem_frame.html`](problem_frame.html) | **Problem statement** (2 slides) — demo opener + public framing |
| [`screenshots/`](screenshots/) | Judge stills (refresh: `cd app && node capture-stills.mjs`) |
| [`thumbnail_devpost.png`](thumbnail_devpost.png) | Devpost cover image |
| [`diagrams/`](diagrams/) | Architecture + round-schedule PNGs |
| [`DEMO_PLAYBOOK.md`](DEMO_PLAYBOOK.md) | 5-minute naive-judge tour (plain language, no scenario IDs) |
| [`EVIDENCE_CHAIN.md`](EVIDENCE_CHAIN.md) | Grounded claims — corpus, audit fields, single-agent baseline |
| [`baseline/`](baseline/) | Single-agent vs boardroom comparison (JSON + still PNG) |

**Problem slides:** open [`problem_frame.html`](problem_frame.html) in a browser, or with the app running → `http://localhost:5173/problem_frame.html` (`→` / Space next · `←` back · `F` fullscreen). Then cut to `/glassbox`.

**Live demo:** `cd app && npm run dev:demo` → `/glassbox` (recorded demo mode, no API key). See playbook.
