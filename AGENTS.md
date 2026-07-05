# Trust Flow — working agreements (shippable repo)

## Read order (new session)

1. `README.md` — quickstart + repo map
2. `docs/ARCHITECTURE.md` — system design
3. `docs/research/RESEARCH_LEDGER.md` — validated research
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
| Hackathon submission pack | `docs/hackathon/` |

Full placement rules: `docs/PROJECT_STRUCTURE.md`.
