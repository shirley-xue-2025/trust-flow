# Trust Flow — working agreements (shippable repo)

## Read order (new session)

1. `SESSION_LATEST.md` — what's in flight
2. `PROJECT_TRACKER.md` — who owns what, links to deliverables
3. `docs/research/RESEARCH_LEDGER.md` — open validation items
4. `docs/DEFINITIONS.md` — before naming concepts in code or docs

## Build discipline

- **Research before architecture.** Regulatory claims must cite primary sources (EU AI Act articles, BetrVG) or flagged as hypothesis.
- **Deterministic vs generative split.** Gateway enforcement = code; policy negotiation = agents. Never let the model be the only enforcement layer.
- **Prototype-first on data.** Scrape / classify / transform on 3–5 samples before batch runs (Reddit, G2, LinkedIn evidence).
- **No personal content in this repo.**

## Canonical paths

| Output type | Location |
|-------------|----------|
| Research notes & evidence | `docs/research/` |
| Definitions & schemas | `docs/DEFINITIONS.md`, `docs/schemas/` |
| Static prototypes | `prototypes/` |
| Application code | `app/` |
| Session handovers | `SESSION_LATEST.md`, `session_logs/` |

Full placement rules: `docs/PROJECT_STRUCTURE.md`.
