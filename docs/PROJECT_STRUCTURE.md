# Project structure — placement contract

Every new artifact must land in one of these buckets. If none fit, update this doc **before** creating a new top-level folder.

## Topology

```
trust-flow/                    ← this git repo (shared / public submission)
├── AGENTS.md
├── README.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── PROJECT_STRUCTURE.md
│   ├── DEFINITIONS.md
│   ├── schemas/
│   ├── fixtures/
│   ├── plans/
│   ├── hackathon/             ← submission pack (deck, screenshots, evidence)
│   └── research/
├── prototypes/
└── app/                       ← application code (Node/TS monorepo)
    └── web/src/glassbox/      ← judge canvas (not employee product)
```

On Shirley's machine, the repo sits inside a **local-only** parent folder (`Trust Flow/`) that holds private `memory/` — session logs, demo scripts, deploy coordination, competitor desk research. That parent is **not** version-controlled.

## Rules

| You are creating… | Put it in… | Never put it in… |
|-------------------|------------|------------------|
| Regulatory / market research (shareable) | `docs/research/` | `app/`, `prototypes/` |
| Canonical term or schema | `docs/DEFINITIONS.md` or `docs/schemas/` | Inline in code only |
| Architecture | `docs/ARCHITECTURE.md` | `app/` |
| Demo fixtures & eval seeds | `docs/fixtures/` | `app/` without migration plan |
| Pitch / explorer HTML | `prototypes/` | `docs/` |
| Gateway or agent code | `app/` | `prototypes/` |
| Hackathon judge artifacts | `docs/hackathon/` | Root |
| Personal notes, SSH/git setup, demo scripts | **Local workspace `memory/`** | **This repo** |

## Do not commit

- API keys, `.env`, credentials (use `.env.example` as the committed template)
- Personal career / about-me material
- Per-developer git or SSH configuration
- Raw scraped data with PII (use `evidence/samples/` for redacted excerpts only)
- Internal session logs, work trackers, or pre-recording demo scripts

## Naming

- Research files: `NN_topic_slug.md`
- Schemas: `kebab-case.schema.json`
- Hackathon assets: under `docs/hackathon/`
