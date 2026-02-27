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

> **Note:** Ported skills retain their upstream directory names (e.g., `rules/` instead of `references/`) and upstream files (e.g., `AGENTS.md`). Do not rename or remove them to match catalog conventions.

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

> Human-readable skill tables with badges live in [`catalog/README.md`](README.md).
> This section uses a compact format optimized for agent parsing.

```
# Format: skill-name | domain/subdomain | provenance (source)
# 118 skills across 10 domains

# productivity
apple-notes | productivity | ported (openclaw/openclaw)
apple-reminders | productivity | adapted (openclaw/openclaw)
bear-notes | productivity | ported (openclaw/openclaw)
blogwatcher | productivity | ported (openclaw/openclaw)
blucli | productivity | ported (openclaw/openclaw)
decision-helper | productivity | ported (awesome-llm-apps)
eightctl | productivity | ported (openclaw/openclaw)
loom-transcript | productivity | ported (n8n)
meeting-notes | productivity | ported (awesome-llm-apps)
nano-pdf | productivity | ported (openclaw/openclaw)
notion-api | productivity | ported (openclaw/openclaw)
obsidian-vault | productivity | ported (openclaw/openclaw)
openhue | productivity | ported (openclaw/openclaw)
ordercli | productivity | ported (openclaw/openclaw)
sonoscli | productivity | ported (openclaw/openclaw)
summarize-cli | productivity | ported (openclaw/openclaw)
things-mac-cli | productivity | adapted (openclaw/openclaw)
trello-api | productivity | adapted (openclaw/openclaw)

# development
ai-elements | development/frontend | ported (vercel/ai-elements)
chat-sdk | development/backend | adapted (vercel/chat)
composition-patterns | development/frontend | ported (vercel-labs/agent-skills)
flags-sdk | development/frontend | ported (vercel/flags)
frontend-design | development/frontend | adapted (anthropics/skills)
fullstack-developer | development/full-stack | ported (awesome-llm-apps)
mcp-builder | development/developer-tooling | ported (anthropics/skills)
mcporter | development/developer-tooling | ported (openclaw/openclaw)
nextjs-cache-components | development/frontend | adapted (vercel/next.js)
python-expert | development/scripting | ported (awesome-llm-apps)
react-best-practices | development/frontend | ported (vercel-labs/agent-skills)
react-refactoring | development/frontend | adapted (langgenius/dify)
skill-creator | development/developer-tooling | adapted (anthropics/skills)
streamdown | development/frontend | ported (vercel/streamdown)
tmux-controller | development/developer-tooling | adapted (openclaw/openclaw)
ux-designer | development/frontend | ported (awesome-llm-apps)
web-artifacts-builder | development/frontend | adapted (anthropics/skills)
web-design-guidelines | development/frontend | ported (vercel-labs/agent-skills)
react-native-skills | development/mobile | ported (vercel-labs/agent-skills)

# devops
ci-triage | devops/ci-cd | synthesized (vercel/next.js)
code-reviewer | devops/code-review | ported (awesome-llm-apps)
create-pr | devops/git | adapted (n8n)
debugger | devops/testing | ported (awesome-llm-apps)
frontend-code-review | devops/code-review | adapted (langgenius/dify)
frontend-testing | devops/testing | adapted (langgenius/dify)
github-cli | devops/git | adapted (openclaw/openclaw)
reproduce-bug | devops/testing | adapted (n8n)
webapp-testing | devops/testing | ported (anthropics/skills)

# documentation
doc-coauthoring | documentation/technical-docs | adapted (anthropics/skills)
docs-writer | documentation/technical-docs | synthesized (next.js, angular, gemini-cli, awesome-llm-apps)
js-docs-fact-check | documentation/technical-docs | adapted (leonardomso/33-js-concepts)
js-resource-curator | documentation/technical-docs | adapted (leonardomso/33-js-concepts)
seo-review | documentation/technical-docs | adapted (leonardomso/33-js-concepts)

# data-ai
ai-sdk | data-ai | ported (vercel/ai)
data-analyst | data-ai | ported (awesome-llm-apps)
gemini-cli | data-ai | ported (openclaw/openclaw)
google-adk-guide | data-ai | synthesized (awesome-llm-apps)
llm-memory-patterns | data-ai | synthesized (awesome-llm-apps)
openai-agents-guide | data-ai | synthesized (awesome-llm-apps)
oracle-cli | data-ai | ported (openclaw/openclaw)
rag-patterns | data-ai | synthesized (awesome-llm-apps, microsoft/graphrag, VectifyAI/PageIndex)
torch-export | data-ai | adapted (pytorch/executorch)
visualization-expert | data-ai | ported (awesome-llm-apps)

# research
academic-researcher | research/citation-management | ported (awesome-llm-apps)
deep-research | research | ported (awesome-llm-apps)
fact-checker | research | ported (awesome-llm-apps)
goplaces | research | ported (openclaw/openclaw)
weather-cli | research | ported (openclaw/openclaw)

# business
email-drafter | business/communications | ported (awesome-llm-apps)
internal-comms | business/communications | ported (anthropics/skills)
issue-analysis | business/project-management | adapted (n8n)
project-planner | business/project-management | ported (awesome-llm-apps)
sprint-planner | business/project-management | ported (awesome-llm-apps)
strategy-advisor | business/business-apps | ported (awesome-llm-apps)
ab-test-setup | business/sales-marketing | ported (coreyhaines31/marketingskills)
ad-creative | business/sales-marketing | ported (coreyhaines31/marketingskills)
ai-seo | business/sales-marketing | ported (coreyhaines31/marketingskills)
analytics-tracking | business/sales-marketing | ported (coreyhaines31/marketingskills)
churn-prevention | business/sales-marketing | ported (coreyhaines31/marketingskills)
cold-email | business/sales-marketing | ported (coreyhaines31/marketingskills)
competitor-alternatives | business/sales-marketing | ported (coreyhaines31/marketingskills)
content-strategy | business/sales-marketing | ported (coreyhaines31/marketingskills)
copy-editing | business/sales-marketing | ported (coreyhaines31/marketingskills)
copywriting | business/sales-marketing | ported (coreyhaines31/marketingskills)
email-sequence | business/sales-marketing | ported (coreyhaines31/marketingskills)
form-cro | business/sales-marketing | ported (coreyhaines31/marketingskills)
free-tool-strategy | business/sales-marketing | ported (coreyhaines31/marketingskills)
launch-strategy | business/sales-marketing | ported (coreyhaines31/marketingskills)
marketing-ideas | business/sales-marketing | ported (coreyhaines31/marketingskills)
marketing-psychology | business/sales-marketing | ported (coreyhaines31/marketingskills)
onboarding-cro | business/sales-marketing | ported (coreyhaines31/marketingskills)
page-cro | business/sales-marketing | ported (coreyhaines31/marketingskills)
paid-ads | business/sales-marketing | ported (coreyhaines31/marketingskills)
paywall-upgrade-cro | business/sales-marketing | ported (coreyhaines31/marketingskills)
popup-cro | business/sales-marketing | ported (coreyhaines31/marketingskills)
pricing-strategy | business/sales-marketing | ported (coreyhaines31/marketingskills)
product-marketing-context | business/sales-marketing | ported (coreyhaines31/marketingskills)
programmatic-seo | business/sales-marketing | ported (coreyhaines31/marketingskills)
referral-program | business/sales-marketing | ported (coreyhaines31/marketingskills)
schema-markup | business/sales-marketing | ported (coreyhaines31/marketingskills)
seo-audit | business/sales-marketing | ported (coreyhaines31/marketingskills)
signup-flow-cro | business/sales-marketing | ported (coreyhaines31/marketingskills)
social-content | business/sales-marketing | ported (coreyhaines31/marketingskills)

# content-media
algorithmic-art | content-media/generative-art | adapted (anthropics/skills)
canvas-design | content-media/generative-art | adapted (anthropics/skills)
content-creator | content-media/content-design | ported (awesome-llm-apps)
content-design | content-media/content-design | adapted (n8n)
editor | content-media/content-design | ported (awesome-llm-apps)
gifgrep | content-media/media-processing | ported (openclaw/openclaw)
nano-banana-pro | content-media/generative-art | adapted (openclaw/openclaw)
openai-image-gen | content-media/generative-art | ported (openclaw/openclaw)
openai-whisper-api | content-media/media-processing | adapted (openclaw/openclaw)
openai-whisper-local | content-media/media-processing | ported (openclaw/openclaw)
sag-tts | content-media/media-processing | ported (openclaw/openclaw)
sherpa-onnx-tts | content-media/media-processing | adapted (openclaw/openclaw)
slack-gif-creator | content-media/media-processing | ported (anthropics/skills)
songsee | content-media/media-processing | ported (openclaw/openclaw)
spotify-player | content-media/media-processing | ported (openclaw/openclaw)
theme-factory | content-media/content-design | ported (anthropics/skills)
video-frames | content-media/media-processing | adapted (openclaw/openclaw)
```

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
| README listing rules | `README.md` (catalog) or root `AGENTS.md` > README LISTING POLICY |
| Upstream sync config | `metadata/upstream-sources.yaml` |
| Upstream sync SHA cache | `../.github/upstream-sync/sha-cache.json` (auto-managed) |

## ANTI-PATTERNS

- Do not nest skills in domain subdirectories. Taxonomy is frontmatter-driven.
- Do not use freeform domain/subdomain values. Validate against `taxonomy.yaml`.
- Do not hand-edit `catalog-index.json`. It is auto-generated by `bun run build:index`.
- Do not define presets inside individual SKILL.md files. Presets live in `presets.yaml`.
- Do not omit NOTICE.md. Every catalog skill requires explicit attribution.
- Do not add auxiliary docs (README.md, CHANGELOG.md) inside skill directories — except when retaining upstream files in ported skills.
- Do not modify ported skill body content unnecessarily. Renaming directories (e.g., `rules/` → `references/`), removing upstream files (e.g., `AGENTS.md`), or restructuring for catalog cosmetic conventions forfeits automated upstream sync eligibility and increases maintenance burden. Only modify body content when functionally required (e.g., stripping project-specific conventions). Frontmatter and NOTICE.md changes do not affect ported status.
