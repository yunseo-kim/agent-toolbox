# CATALOG (DISTRIBUTABLE CONTENT)

Source-of-truth for all distributable skills, agents, commands, hooks, and MCP configs. Everything in `catalog/` ships to end users via generated target artifacts.

## STRUCTURE

```
catalog/
├── metadata/
│   ├── taxonomy.yaml         # Controlled vocabulary -- domains + subdomains
│   ├── presets.yaml           # Curated install bundles (cross-cutting)
│   └── catalog-index.json     # Auto-generated; do NOT hand-edit
├── skills/                    # Flat -- one dir per skill, taxonomy via frontmatter
├── agents/
├── commands/
├── hooks/
├── mcp/
└── lsp/
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

Compliant with the [Agent Skills specification](https://agentskills.io/specification.md).

```yaml
---
name: skill-name                        # required, kebab-case, max 64 chars
description: "What this skill does..."  # required, max 1024 chars
license: Sustainable Use License 1.0     # required, default unless NOTICE.md overrides
metadata:
  domain: devops                        # required, from taxonomy.yaml
  subdomain: ci-cd                      # optional, from taxonomy.yaml
  tags: "github, yaml, automation"      # optional, comma-separated, freeform kebab-case
  frameworks: "nextjs"                  # optional, comma-separated, freeform kebab-case
  author: "Yunseo Kim <dev@yunseo.kim>" # required, modifier or upstream author
  lastUpdated: "12026-02-25"            # required, Holocene Era YYYYY-MM-DD
  provenance: ported                    # required, ported | adapted | synthesized | original
---
```

`metadata.domain`, `metadata.author`, and `metadata.lastUpdated` are **required** for catalog items (unlike dev skills in `.agents/skills/`). All `metadata.domain` and `metadata.subdomain` values must exist in `metadata/taxonomy.yaml`.

**License field**: Default is `Sustainable Use License 1.0` (per root `LICENSE.md`). Only override when `NOTICE.md` explicitly specifies different license terms for that skill.

**Author/lastUpdated rules**: When body content (excluding frontmatter and NOTICE.md additions) was modified from upstream, set `metadata.author` to the modifier and `metadata.lastUpdated` to the last commit date in Holocene Era format (`YYYYY-MM-DD`, Gregorian year + 10000). When body content is unmodified from source, look up the upstream repository for the original author and last update date, converting the date to Holocene Era format.

**Provenance field**: Required for catalog items. Valid values: `ported` (copied with minimal changes), `adapted` (significant modifications), `synthesized` (combined from multiple sources), `original` (created in this project). Ported skills listed in `metadata/upstream-sources.yaml` `skills` section are eligible for automated upstream sync. Adapted skills listed in the `adapted_skills` section are monitored for upstream changes (advisory only, never auto-applied).
For detailed classification criteria distinguishing ported from adapted, see `../docs/CLASSIFICATION.md`.

## CURRENT SKILLS

| Skill | Domain | Subdomain | Provenance |
|-------|--------|-----------|------------|
| algorithmic-art | content-media | generative-art | Ported (anthropics/skills) |
| academic-researcher | research | citation-management | Ported (awesome-llm-apps) |
| ai-sdk | data-ai | -- | Ported (vercel/ai) |
| ai-elements | development | frontend | Adapted (vercel/ai-elements) |
| chat-sdk | development | backend | Adapted (vercel/chat) |
| canvas-design | content-media | generative-art | Ported (anthropics/skills) |
| ci-triage | devops | ci-cd | Adapted (vercel/next.js) |
| content-design | content-media | content-design | Adapted (n8n) |
| create-pr | devops | git | Adapted (n8n) |
| code-reviewer | devops | code-review | Ported (awesome-llm-apps) |
| content-creator | content-media | content-design | Ported (awesome-llm-apps) |
| doc-coauthoring | documentation | technical-docs | Ported (anthropics/skills) |
| docs-writer | documentation | technical-docs | Synthesized (next.js, angular, gemini-cli, awesome-llm-apps) |
| data-analyst | data-ai | -- | Ported (awesome-llm-apps) |
| debugger | devops | testing | Ported (awesome-llm-apps) |
| decision-helper | productivity | -- | Ported (awesome-llm-apps) |
| deep-research | research | -- | Ported (awesome-llm-apps) |
| frontend-design | development | frontend | Ported (anthropics/skills) |
| flags-sdk | development | frontend | Ported (vercel/flags) |
| editor | content-media | content-design | Ported (awesome-llm-apps) |
| email-drafter | business | communications | Ported (awesome-llm-apps) |
| fact-checker | research | -- | Ported (awesome-llm-apps) |
| fullstack-developer | development | full-stack | Ported (awesome-llm-apps) |
| internal-comms | business | communications | Ported (anthropics/skills) |
| issue-analysis | business | project-management | Adapted (n8n) |
| loom-transcript | productivity | -- | Ported (n8n) |
| mcp-builder | development | developer-tooling | Ported (anthropics/skills) |
| reproduce-bug | devops | testing | Adapted (n8n) |
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
| google-adk-guide | data-ai | -- | Adapted (awesome-llm-apps) |
| gifgrep | content-media | media-processing | Ported (openclaw/openclaw) |
| github-cli | devops | git | Ported (openclaw/openclaw) |
| goplaces | research | -- | Ported (openclaw/openclaw) |
| llm-memory-patterns | data-ai | -- | Adapted (awesome-llm-apps) |
| mcporter | development | developer-tooling | Ported (openclaw/openclaw) |
| meeting-notes | productivity | -- | Ported (awesome-llm-apps) |
| nano-banana-pro | content-media | generative-art | Ported (openclaw/openclaw) |
| nano-pdf | productivity | -- | Ported (openclaw/openclaw) |
| nextjs-cache-components | development | frontend | Adapted (vercel/next.js) |
| notion-api | productivity | -- | Ported (openclaw/openclaw) |
| obsidian-vault | productivity | -- | Ported (openclaw/openclaw) |
| openai-image-gen | content-media | generative-art | Ported (openclaw/openclaw) |
| openai-whisper-api | content-media | media-processing | Ported (openclaw/openclaw) |
| openai-whisper-local | content-media | media-processing | Ported (openclaw/openclaw) |
| openhue | productivity | -- | Ported (openclaw/openclaw) |
| oracle-cli | data-ai | -- | Ported (openclaw/openclaw) |
| openai-agents-guide | data-ai | -- | Adapted (awesome-llm-apps) |
| ordercli | productivity | -- | Ported (openclaw/openclaw) |
| project-planner | business | project-management | Ported (awesome-llm-apps) |
| python-expert | development | scripting | Ported (awesome-llm-apps) |
| sag-tts | content-media | media-processing | Ported (openclaw/openclaw) |
| rag-patterns | data-ai | -- | Synthesized (awesome-llm-apps, microsoft/graphrag, VectifyAI/PageIndex) |
| sherpa-onnx-tts | content-media | media-processing | Ported (openclaw/openclaw) |
| songsee | content-media | media-processing | Ported (openclaw/openclaw) |
| sonoscli | productivity | -- | Ported (openclaw/openclaw) |
| spotify-player | content-media | media-processing | Ported (openclaw/openclaw) |
| sprint-planner | business | project-management | Ported (awesome-llm-apps) |
| streamdown | development | frontend | Ported (vercel/streamdown) |
| strategy-advisor | business | business-apps | Ported (awesome-llm-apps) |
| summarize-cli | productivity | -- | Ported (openclaw/openclaw) |
| things-mac-cli | productivity | -- | Ported (openclaw/openclaw) |
| tmux-controller | development | developer-tooling | Ported (openclaw/openclaw) |
| trello-api | productivity | -- | Ported (openclaw/openclaw) |
| video-frames | content-media | media-processing | Ported (openclaw/openclaw) |
| visualization-expert | data-ai | -- | Ported (awesome-llm-apps) |
| weather-cli | research | -- | Ported (openclaw/openclaw) |
| frontend-code-review | devops | code-review | Adapted (langgenius/dify) |
| frontend-testing | devops | testing | Adapted (langgenius/dify) |
| react-refactoring | development | frontend | Adapted (langgenius/dify) |
| js-docs-fact-check | documentation | technical-docs | Adapted (leonardomso/33-js-concepts) |
| js-resource-curator | documentation | technical-docs | Adapted (leonardomso/33-js-concepts) |
| seo-review | documentation | technical-docs | Adapted (leonardomso/33-js-concepts) |

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
| Upstream sync config | `metadata/upstream-sources.yaml` |
| Upstream sync SHA cache | `../.github/upstream-sync/sha-cache.json` (auto-managed) |

## ANTI-PATTERNS

- Do not nest skills in domain subdirectories. Taxonomy is frontmatter-driven.
- Do not use freeform domain/subdomain values. Validate against `taxonomy.yaml`.
- Do not hand-edit `catalog-index.json`. It is auto-generated by `bun run build:index`.
- Do not define presets inside individual SKILL.md files. Presets live in `presets.yaml`.
- Do not omit NOTICE.md. Every catalog skill requires explicit attribution.
- Do not add auxiliary docs (README.md, CHANGELOG.md) inside skill directories.
