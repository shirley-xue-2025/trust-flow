# Project structure — placement contract

Every new artifact must land in one of these buckets. If none fit, update this doc **before** creating a new top-level folder.

## Topology

```
trust-flow/
├── AGENTS.md              # Working agreements (this repo)
├── SESSION_LATEST.md      # One-screen cold start
├── README.md
├── docs/
│   ├── PROJECT_STRUCTURE.md
│   ├── DEFINITIONS.md
│   ├── schemas/           # JSON Schema, policy examples
│   └── research/          # Evidence, regulatory translation, market notes
├── prototypes/            # Static HTML/CSS/JS — no build step
├── session_logs/          # Dated handovers (archive of SESSION_LATEST)
└── src/                   # Application code (future — gateway, agents)
```

## Rules

| You are creating… | Put it in… | Never put it in… |
|-------------------|------------|------------------|
| Regulatory / market research | `docs/research/` | `src/`, `prototypes/` |
| Canonical term or schema | `docs/DEFINITIONS.md` or `docs/schemas/` | Inline in code only |
| Pitch / explorer HTML | `prototypes/` | `docs/` |
| Gateway or agent code | `src/` | `prototypes/` |
| Session handover (dated) | `session_logs/SESSION_*.md` | Root (except `SESSION_LATEST.md` pointer) |
| Personal notes, career, about-me | Parent `~/Projects/Trust Flow/memory/` | **This repo** |

## Naming

- Research files: `NN_topic_slug.md` (ordered ledger)
- Schemas: `kebab-case.schema.json`
- Session logs: `SESSION_HANDOVER_YYYY-MM-DD_topic.md`

## Enforcement (future)

When `src/` exists, add a lightweight structure test (pattern from VoC `test_structure_contract.py`) that asserts no research files under `src/` and no code under `prototypes/`.
