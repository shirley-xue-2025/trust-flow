# Project structure — placement contract

Every new artifact must land in one of these buckets. If none fit, update this doc **before** creating a new top-level folder.

## Topology

```
trust-flow/                    ← this git repo (shared)
├── AGENTS.md
├── SESSION_LATEST.md
├── README.md
├── docs/
│   ├── PROJECT_STRUCTURE.md
│   ├── DEFINITIONS.md
│   ├── schemas/
│   └── research/
├── prototypes/
├── session_logs/
└── src/                       ← future application code
```

On Shirley's machine, the repo sits inside a **local-only** parent folder (`Trust Flow/`) that holds private `memory/` — that parent is **not** version-controlled and is **not** cloned by teammates.

## Rules

| You are creating… | Put it in… | Never put it in… |
|-------------------|------------|------------------|
| Regulatory / market research (shareable) | `docs/research/` | `src/`, `prototypes/` |
| Canonical term or schema | `docs/DEFINITIONS.md` or `docs/schemas/` | Inline in code only |
| Pitch / explorer HTML | `prototypes/` | `docs/` |
| Gateway or agent code | `src/` | `prototypes/` |
| Session handover (dated) | `session_logs/SESSION_*.md` | Root (except `SESSION_LATEST.md`) |
| Personal notes, SSH/git setup, private scratch | **Local workspace outside repo** | **This repo** |

## Do not commit

- API keys, `.env`, credentials (use `.env.example` as the committed template)
- Personal career / about-me material
- Per-developer git or SSH configuration
- Raw scraped data with PII (use `evidence/samples/` for redacted excerpts only)

## Naming

- Research files: `NN_topic_slug.md`
- Schemas: `kebab-case.schema.json`
- Session logs: `SESSION_HANDOVER_YYYY-MM-DD_topic.md`
