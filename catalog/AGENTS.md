# CATALOG (DISTRIBUTABLE CONTENT)

Source-of-truth for all distributable skills, agents, commands, hooks, and MCP configs. Everything in `catalog/` ships to end users via generated target artifacts.

## STRUCTURE

```
catalog/
├── metadata/
│   ├── taxonomy.yaml         # Controlled vocabulary -- domains + subdomains
│   ├── presets.yaml           # Curated install bundles (cross-cutting)
│   └── catalog-index.json     # Auto-generated; do NOT hand-edit
└── skills/                    # Flat -- one dir per skill, taxonomy via frontmatter
    ├── algorithmic-art/
    │   └── templates/
    ├── apple-notes/
    ├── apple-reminders/
    ├── bear-notes/
    ├── blogwatcher/
    ├── blucli/
    ├── canvas-design/
    │   └── canvas-fonts/
    ├── content-design/
    ├── create-pr/
    ├── doc-coauthoring/
    ├── docs-writer/
    │   └── references/
    ├── eightctl/
    ├── frontend-design/
    ├── gemini-cli/
    ├── gifgrep/
    ├── github-cli/
    ├── goplaces/
    ├── internal-comms/
    │   └── examples/
    ├── issue-analysis/
    ├── loom-transcript/
    ├── mcp-builder/
    │   ├── reference/
    │   └── scripts/
    ├── mcporter/
    ├── nano-banana-pro/
    ├── nano-pdf/
    ├── notion-api/
    ├── obsidian-vault/
    ├── openai-image-gen/
    ├── openai-whisper-api/
    ├── openai-whisper-local/
    ├── openhue/
    ├── oracle-cli/
    ├── ordercli/
    ├── reproduce-bug/
    ├── sag-tts/
    ├── sherpa-onnx-tts/
    ├── skill-creator/
    │   ├── references/
    │   └── scripts/
    ├── slack-gif-creator/
    │   └── core/
    ├── songsee/
    ├── sonoscli/
    ├── spotify-player/
    ├── summarize-cli/
    ├── theme-factory/
    │   └── themes/
    ├── things-mac-cli/
    ├── tmux-controller/
    ├── trello-api/
    ├── video-frames/
    ├── weather-cli/
    ├── web-artifacts-builder/
    │   └── scripts/
    └── webapp-testing/
        ├── examples/
        └── scripts/
```

`skills/` is **flat**. No nesting by domain. Classification is metadata-driven via SKILL.md frontmatter.

## SKILL STRUCTURE

Each skill directory contains:

```
skill-name/
├── SKILL.md          # Required: frontmatter + instructions
├── NOTICE.md         # Required: attribution and modification notices
├── references/       # Optional: docs loaded on-demand
├── scripts/          # Optional: executable code
└── assets/           # Optional: templates, images for output
```

## FRONTMATTER SCHEMA (CATALOG)

```yaml
---
name: skill-name                        # required, kebab-case, max 64 chars
description: "What this skill does..."  # required, max 1024 chars
domain: devops                          # required, from taxonomy.yaml
subdomain: ci-cd                        # optional, from taxonomy.yaml
tags: [github, yaml, automation]        # optional, freeform kebab-case
frameworks: [nextjs]                    # optional, freeform kebab-case
---
```

`domain` is **required** for catalog items (unlike dev skills in `.agents/skills/`). All `domain` and `subdomain` values must exist in `metadata/taxonomy.yaml`.

## CURRENT SKILLS

| Skill | Domain | Subdomain | Provenance |
|-------|--------|-----------|------------|
| algorithmic-art | content-media | generative-art | Ported (anthropics/skills) |
| canvas-design | content-media | generative-art | Ported (anthropics/skills) |
| content-design | content-media | content-design | Ported (n8n) |
| create-pr | devops | git | Ported (n8n) |
| doc-coauthoring | documentation | technical-docs | Ported (anthropics/skills) |
| docs-writer | documentation | technical-docs | Synthesized (next.js, angular, gemini-cli, awesome-llm-apps) |
| frontend-design | development | frontend | Ported (anthropics/skills) |
| internal-comms | business | communications | Ported (anthropics/skills) |
| issue-analysis | business | project-management | Ported (n8n) |
| loom-transcript | productivity | -- | Ported (n8n) |
| mcp-builder | development | developer-tooling | Ported (anthropics/skills) |
| reproduce-bug | devops | testing | Ported (n8n) |
| skill-creator | development | developer-tooling | Ported (anthropics/skills) |
| slack-gif-creator | content-media | media-processing | Ported (anthropics/skills) |
| theme-factory | content-media | content-design | Ported (anthropics/skills) |
| web-artifacts-builder | development | frontend | Ported (anthropics/skills) |
| webapp-testing | devops | testing | Ported (anthropics/skills) |
| apple-notes | productivity | -- | Ported (openclaw/openclaw) |
| apple-reminders | productivity | -- | Ported (openclaw/openclaw) |
| bear-notes | productivity | -- | Ported (openclaw/openclaw) |
| blogwatcher | productivity | -- | Ported (openclaw/openclaw) |
| blucli | productivity | -- | Ported (openclaw/openclaw) |
| eightctl | productivity | -- | Ported (openclaw/openclaw) |
| gemini-cli | data-ai | -- | Ported (openclaw/openclaw) |
| gifgrep | content-media | media-processing | Ported (openclaw/openclaw) |
| github-cli | devops | git | Ported (openclaw/openclaw) |
| goplaces | research | -- | Ported (openclaw/openclaw) |
| mcporter | development | developer-tooling | Ported (openclaw/openclaw) |
| nano-banana-pro | content-media | generative-art | Ported (openclaw/openclaw) |
| nano-pdf | productivity | -- | Ported (openclaw/openclaw) |
| notion-api | productivity | -- | Ported (openclaw/openclaw) |
| obsidian-vault | productivity | -- | Ported (openclaw/openclaw) |
| openai-image-gen | content-media | generative-art | Ported (openclaw/openclaw) |
| openai-whisper-api | content-media | media-processing | Ported (openclaw/openclaw) |
| openai-whisper-local | content-media | media-processing | Ported (openclaw/openclaw) |
| openhue | productivity | -- | Ported (openclaw/openclaw) |
| oracle-cli | data-ai | -- | Ported (openclaw/openclaw) |
| ordercli | productivity | -- | Ported (openclaw/openclaw) |
| sag-tts | content-media | media-processing | Ported (openclaw/openclaw) |
| sherpa-onnx-tts | content-media | media-processing | Ported (openclaw/openclaw) |
| songsee | content-media | media-processing | Ported (openclaw/openclaw) |
| sonoscli | productivity | -- | Ported (openclaw/openclaw) |
| spotify-player | content-media | media-processing | Ported (openclaw/openclaw) |
| summarize-cli | productivity | -- | Ported (openclaw/openclaw) |
| things-mac-cli | productivity | -- | Ported (openclaw/openclaw) |
| tmux-controller | development | developer-tooling | Ported (openclaw/openclaw) |
| trello-api | productivity | -- | Ported (openclaw/openclaw) |
| video-frames | content-media | media-processing | Ported (openclaw/openclaw) |
| weather-cli | research | -- | Ported (openclaw/openclaw) |

## LICENSING RULES

- Every skill MUST have `NOTICE.md` with attribution and modification notices.
- **Ported/Adapted**: NOTICE.md references the original source license.
- **Synthesized**: NOTICE.md MUST list all source projects with their respective license texts.
- Multi-license badge format: `MIT / Apache 2.0` (unique licenses, ` / ` separator).

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add/validate domain/subdomain | `metadata/taxonomy.yaml` |
| Define install bundles | `metadata/presets.yaml` |
| Check generated index | `metadata/catalog-index.json` (auto-generated) |
| Skill authoring conventions | `../.agents/skills/skill-creator/SKILL.md` |
| README listing rules | Root `AGENTS.md` > README LISTING POLICY |

## ANTI-PATTERNS

- Do not nest skills in domain subdirectories. Taxonomy is frontmatter-driven.
- Do not use freeform domain/subdomain values. Validate against `taxonomy.yaml`.
- Do not hand-edit `catalog-index.json`. It is auto-generated by `bun run build:index`.
- Do not define presets inside individual SKILL.md files. Presets live in `presets.yaml`.
- Do not omit NOTICE.md. Every catalog skill requires explicit attribution.
- Do not add auxiliary docs (README.md, CHANGELOG.md) inside skill directories.
