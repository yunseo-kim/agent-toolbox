# PROJECT KNOWLEDGE BASE

**Last Updated:** 12026-02-26
**Commit:** ce23691
**Branch:** main

## OVERVIEW

This repository started as a curated skills collection and is evolving into a cross-tool distribution project targeting **OpenCode, Claude Code, Gemini CLI, and Cursor**. The architecture direction remains: **neutral catalog as source-of-truth + generated tool targets + installer-driven deployment**.

## CURRENT STATE

- `.agents/skills/`, `.agent/skills/`, `.claude/skills/`, `.cursor/skills/`, `.windsurf/skills/` are **development tooling only** — skills used by contributors while working on this repo (e.g. `git-master`, `create-pr`, `skill-creator`, `mcp-builder`). They are **not** project content or distribution artifacts.
- Planned architecture directories (`src/`, `templates/`, `dist/`, `tests/`) are not yet materialized. The build toolchain (Bun-first TS) and CI/CD (GitHub Actions) are planned but not implemented.
- Catalog items use **domain/framework-based taxonomy** for selective installation. Taxonomy is defined in `catalog/metadata/taxonomy.yaml`; categories live in SKILL.md frontmatter (`domain`, `subdomain`, `tags`, `frameworks` fields).

## TARGETS

- **Primary target set**: `opencode`, `claude`, `gemini`, `cursor`
- **Planned/generated targets**: `dist/targets/opencode`, `dist/targets/claude`, `dist/targets/gemini`, `dist/targets/cursor`

## TARGET ARCHITECTURE (IN PROGRESS)

```
awesome-agent-toolbox/
├── catalog/                          # Neutral source-of-truth
│   ├── skills/                       # Flat — one dir per skill, taxonomy via frontmatter
│   ├── agents/
│   ├── commands/
│   ├── hooks/
│   ├── mcp/
│   ├── lsp/
│   └── metadata/                     # Taxonomy, presets, and generated index
│       ├── taxonomy.yaml             # Controlled vocabulary (domains + subdomains)
│       ├── presets.yaml              # Curated install bundles
│       └── catalog-index.json        # Auto-generated aggregated metadata
├── src/                              # Bun-first TS toolchain
│   ├── cli/                          # install/build/validate entrypoints
│   ├── generators/                   # emit_gemini / emit_opencode / emit_claude / emit_cursor
│   ├── mappers/                      # tool/event/model mapping layers
│   └── schemas/                      # catalog + generated artifact schemas
├── templates/                        # Target-specific render templates
├── dist/
│   ├── targets/                      # Runtime artifacts per tool
│   │   ├── opencode/
│   │   ├── claude/
│   │   ├── gemini/
│   │   └── cursor/
│   └── marketplace/                  # Catalog artifacts (Claude-specific)
│       └── claude/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── matrix/                       # Cross-target verification matrix
└── .agents/skills/                   # Dev tooling only (not project content)
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Skill authoring rules | `.agents/skills/skill-creator/SKILL.md` | Canonical current guidance |
| Skill scaffolding script | `.agents/skills/skill-creator/scripts/init_skill.py` | Current Python initializer |
| Skill packaging script | `.agents/skills/skill-creator/scripts/package_skill.py` | Current `.skill` packager |
| MCP builder guidance | `.agents/skills/mcp-builder/SKILL.md` | Canonical MCP extension guidance |
| Root architecture decisions | `AGENTS.md` | This file is authoritative |
| Dev tooling conventions | `.agents/skills/AGENTS.md` | Skill inventory, symlink structure, dev scripts |
| Catalog conventions | `catalog/AGENTS.md` | Distributable content rules, frontmatter, licensing |
| Active skill source tree | `.agents/skills/` | Dev tooling source; symlinked to `.agent/`, `.claude/`, `.cursor/`, `.windsurf/` |
| Catalog taxonomy | `catalog/metadata/taxonomy.yaml` | Controlled vocabulary for domains/subdomains |
| Install presets | `catalog/metadata/presets.yaml` | Curated skill bundles for common use cases |
| Catalog index | `catalog/metadata/catalog-index.json` | Auto-generated; do not hand-edit |

> **Note:** The `.agents/skills/` paths above are **development tools** for contributors, not project content.
> They will remain as dev tooling even after `catalog/` is populated with distributable content.

## DISTRIBUTION MODEL

- **Source-of-truth**: only `catalog/` (`.agents/skills/` is dev tooling, not content).
- **Generated artifacts**: only `dist/targets/*` and `dist/marketplace/*`; avoid manual edits.
- **Bun first**: build/test/release tooling uses Bun runtime and Bun scripts.
- **npm compatibility**: publish CLI binaries and package artifacts so users can install via `npm`/`npx` as fallback.
- **Install UX**: `install --target <tool> [--domain <domain>] [--subdomain <subdomain>] [--framework <fw>] [--preset <name>] [--skill <name>] [--tag <tag>] [--interactive] [--dry-run]`. Target selects the tool; domain/framework/preset/skill/tag filters select catalog items. Filters compose with AND. Default (no filters) installs all items.

## CATALOG TAXONOMY

### Taxonomy Model

Catalog items are categorized using metadata in SKILL.md frontmatter (under the `metadata` field per the [Agent Skills specification](https://agentskills.io/specification.md)), not directory structure. The `catalog/skills/` directory remains flat (one dir per skill).

- **Domain** (`metadata.domain`, required, controlled vocabulary): Primary grouping — `productivity`, `development`, `devops`, `documentation`, `databases`, `blockchain`, `data-ai`, `research`, `business`, `content-media`.
- **Subdomain** (`metadata.subdomain`, optional, controlled vocabulary): Secondary grouping within domain — `git`, `ci-cd`, `frontend`, `technical-docs`, `testing`, `security`, `education`, etc.
- **Tags** (`metadata.tags`, optional, freeform): Comma-separated searchable keywords for discovery — `github`, `yaml`, `react`, etc.
- **Frameworks** (`metadata.frameworks`, optional, freeform): Comma-separated framework/tool associations — `nextjs`, `angular`, `django`, etc.
- **Author** (`metadata.author`, required for catalog items): Attribution. Format: `"Name <email>"`. Use modifier's identity when body content was modified beyond frontmatter/NOTICE.md additions; use upstream author when body content is unmodified from source.
- **Last Updated** (`metadata.lastUpdated`, required for catalog items): Last modification date in Holocene Era format `YYYYY-MM-DD` (Gregorian year + 10000). Use last commit date when body content was modified; use upstream last update date when body content is unmodified.
- **Provenance** (`metadata.provenance`, required for catalog items): Origin classification. Controlled vocabulary: `ported` (copied with minimal changes), `adapted` (significant modifications), `synthesized` (combined from multiple sources), `original` (created in this project).
- **Provenance guide**: For detailed classification criteria and decision flowchart, see `docs/CLASSIFICATION.md`.

The controlled vocabulary is defined in `catalog/metadata/taxonomy.yaml`. Adding new domains or subdomains requires updating this file.

### SKILL.md Frontmatter Schema

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

### Install Presets

Presets are curated bundles of catalog items for common use cases, defined in `catalog/metadata/presets.yaml`. Each preset has a name, description, and list of item names. Presets are cross-cutting — they reference items from any domain.

### Selective Install Composition

| Flags | Behavior |
|-------|----------|
| `--target` only | All items (backward-compatible default) |
| `--target --domain D` | Items where `domain == D` |
| `--target --domain D --subdomain S` | Items where `domain == D && subdomain == S` |
| `--target --framework F` | Items where `F in frameworks` |
| `--target --preset P` | Items listed in preset P |
| `--target --skill N` | Specific item(s) by name |
| `--target --tag T` | Items where `T in tags` |
| Multiple filters | AND composition |

## TOOL ADAPTER RULES

- **Gemini CLI**: emit extension contract centered on `gemini-extension.json`, with optional `commands/*.toml`, `GEMINI.md`, `skills/`, `hooks/hooks.json`, `mcpServers`, and `settings` fields.
- **OpenCode**: emit `.opencode/` config/plugin artifacts; support runtime bootstrap injection for tool-mapping guidance when needed.
- **Claude Code**: emit `.claude`/plugin-compatible artifacts (skills/plugins) and optional marketplace catalog separately.
- **Cursor**: emit `.cursor`-compatible artifacts where parity exists; document non-parity (especially hooks/commands semantics).
- **OS-specific install branching**: installer must handle symlink/junction differences explicitly (Windows cmd/PowerShell/Git Bash vs POSIX).

## RUNTIME MAPPING POLICY

- Keep catalog content tool-neutral where possible.
- Map tool semantics at adapter/runtime layer, not by duplicating skill prose per target.
- Initial required mappings:
  - `TodoWrite` -> OpenCode planning equivalent
  - Claude-style subagent task dispatch -> OpenCode subagent invocation equivalent
  - Skill invocation wording -> each tool's native discovery/invocation system
  - Slash/custom commands -> Gemini CLI `commands/*.toml`, OpenCode command model, Claude/Cursor equivalents
  - Session context file -> Gemini `GEMINI.md`, Claude `AGENTS.md`, other target-specific context roots
  - Hook lifecycle semantics -> Gemini `hooks/hooks.json` and target-specific hook/event layers

## TEST MATRIX (REQUIRED)

- **Generator tests**: deterministic output snapshots for each target.
- **Schema tests**: validate emitted manifests/config files against target schemas.
- **Gemini schema tests**: validate `gemini-extension.json` (manifest shape, `mcpServers`, `settings`, `contextFileName`, command layout).
- **Installer tests**: OS-path and symlink/junction branch coverage.
- **Behavior tests**: smoke tests per target (load plugin, discover skills, invoke representative workflow).
- **Drift tests**: fail CI when generated outputs diverge from catalog unexpectedly.
- **Taxonomy tests**: validate all SKILL.md `metadata.domain`/`metadata.subdomain` values against `catalog/metadata/taxonomy.yaml`.
- **Preset tests**: validate all preset item references resolve to existing catalog items.
- **Index tests**: verify `catalog-index.json` is consistent with individual SKILL.md frontmatter.
- **Selective install tests**: verify filter composition (domain, subdomain, framework, tag, preset, skill) produces correct item sets.
- **Provenance tests**: validate all SKILL.md `metadata.provenance` values are valid (`ported`, `adapted`, `synthesized`, `original`) and consistent with `catalog/metadata/upstream-sources.yaml` mappings.
- **Upstream sync tests**: verify upstream-sources.yaml skill entries map to existing catalog skill directories.

## CONVENTIONS

- Skill names: lowercase kebab-case, concise, trigger-oriented.
- `SKILL.md` frontmatter: required `name` + `description` + `license`.
- Progressive disclosure: short core instructions in `SKILL.md`, deep detail in references.
- Keep files ASCII unless existing file requires Unicode.
- Keep generated artifacts clearly marked and reproducible.
- Catalog items require `metadata.domain`, `metadata.author`, and `metadata.lastUpdated` in frontmatter; `metadata.subdomain`, `metadata.tags`, `metadata.frameworks` are optional.
- `catalog/metadata/catalog-index.json` is auto-generated by `bun run build:index`; do not hand-edit.
- **Catalog curation scope**: Skills specialized for a specific language (e.g., JavaScript) or framework (e.g., React, Next.js) ARE considered universally useful for developers in that domain and belong in the catalog. When porting, retain technology-specific expertise, standard tooling references (MDN, official docs), and community best practices — these are the skill's core value. Only strip project-specific internal conventions (proprietary file paths, project-unique workflows, custom component libraries) that would not apply outside the original project.
- **License field**: Default is `Sustainable Use License 1.0` (per `LICENSE.md`). Only override when `NOTICE.md` explicitly specifies different license terms for that skill.
- **Author/lastUpdated rules**: When body content (excluding frontmatter and NOTICE.md additions) was modified from upstream, set `metadata.author` to the modifier and `metadata.lastUpdated` to the last commit date in Holocene Era format (YYYYY-MM-DD, Gregorian year + 10000). When body content is unmodified, look up the upstream repository for the original author and last update date, converting the date to Holocene Era format.
- **Provenance field**: Required for catalog items. Valid values: `ported`, `adapted`, `synthesized`, `original`. Ported skills listed in `catalog/metadata/upstream-sources.yaml` are eligible for automated upstream sync.
- `catalog/metadata/upstream-sources.yaml` maps ported skills to their upstream repos and paths. Used by the `upstream-sync` GitHub Action for body content sync and new-skill detection.

## README LISTING POLICY

README.md skill tables use the following column structure and provenance rules.

### Column Schema

| Column | Purpose |
|--------|---------|
| **Name** | Skill display name, linked to catalog entry (if hosted) or original source (if external-only) |
| **Source** | Original upstream repository or repositories the skill derives from |
| **Stars** | GitHub stars badge(s) for the source repository |
| **Upstream License** | Upstream license badge for the source, linked to license or notice file |
| **Description** | One-line summary of what the skill does |

### Provenance Types

Skills fall into four provenance categories. Each has distinct listing rules:

| Type | Definition | Name link | Source column | Stars | License |
|------|-----------|-----------|--------------|-------|---------|
| **External** | Listed in README only; not in `catalog/` | Links to original repo/skill path | Single `[org/repo](url)` | Stars badge of source repo | License badge of source repo |
| **Ported** | Copied to `catalog/` with minimal changes from one source | Links to `catalog/skills/<name>` | Single `[org/repo](url)` | Stars badge of source repo | License badge of source repo |
| **Adapted** | In `catalog/` with moderate edits from one source | Links to `catalog/skills/<name>` | Single `[org/repo](url)` | Stars badge of source repo | License badge of source repo |
| **Synthesized** | In `catalog/` as original work combining multiple sources | Links to `catalog/skills/<name>` | All sources inline: `[org1/repo1](url), [org2/repo2](url), ...` | `—` (dash) | Multi-license badge linking to `catalog/skills/<name>/NOTICE.md` |

### Editing Rules

- Every skill in `catalog/skills/` MUST have a NOTICE.md with attribution and modification notices.
- For synthesized skills, NOTICE.md MUST list all source projects with their respective license texts.
- Multi-license badges use the format: `MIT / Apache 2.0` (list unique licenses, separated by ` / `).
- When a synthesized skill replaces multiple individual external entries, remove the individual rows and add one synthesized row.
- Source column links point to the repository root (not the skill subdirectory) for badge compatibility.
- Keep Description concise — one sentence, no trailing period.

## ANTI-PATTERNS (THIS PROJECT)

- Do not hand-edit generated files in `dist/`.
- Do not duplicate full skill content per target unless strictly required.
- Do not claim feature parity without target-specific test evidence.
- Do not rely on one shell behavior for installer logic (must branch by OS/runtime).
- Do not store secrets or machine-local credentials in catalog/templates.
- Do not claim Gemini command/hook parity with Claude/OpenCode/Cursor without explicit adapter tests.
- Do not nest catalog items in domain subdirectories; taxonomy is metadata-driven, not directory-driven.
- Do not use freeform strings for `domain` or `subdomain`; always validate against `taxonomy.yaml`.
- Do not define presets inside individual SKILL.md files; presets are cross-cutting and live in `presets.yaml`.

## COMMANDS (CURRENT)

```bash
# Initialize a new skill
python3 .agents/skills/skill-creator/scripts/init_skill.py <skill-name> --path .agents/skills/ [--resources scripts,references,assets]

# Validate a skill
python3 .agents/skills/skill-creator/scripts/quick_validate.py <path/to/skill-folder>

# Package a skill for distribution
python3 .agents/skills/skill-creator/scripts/package_skill.py <path/to/skill-folder> [output-dir]
```

> These commands use dev-tooling scripts from `.agents/skills/`. Once `catalog/` exists, paths will shift to `catalog/` equivalents.

## COMMANDS (TARGET - BUN FIRST, PLANNED)

```bash
# Validate neutral catalog and schemas
bun run validate

# Build catalog index from all SKILL.md frontmatter
bun run build:index

# Generate tool artifacts
bun run build:gemini
bun run build:claude
bun run build:opencode
bun run build:cursor
bun run build:all

# Install to target environment (all items)
bun run install --target gemini
bun run install --target claude
bun run install --target opencode
bun run install --target cursor

# Install with selective filters
bun run install --target claude --domain devops
bun run install --target gemini --domain devops --subdomain ci-cd
bun run install --target opencode --framework nextjs
bun run install --target cursor --preset devops-essentials
bun run install --target claude --skill git-master --skill docs-writer
bun run install --target gemini --tag yaml

# Interactive mode
bun run install --target claude --interactive

# Dry run (preview without installing)
bun run install --target gemini --domain devops --dry-run

# npm fallback
npx awesome-agent-toolbox install --target gemini --domain devops
```

## NOTES

- Compatibility with non-Claude tools is prioritized over deep Claude-only marketplace optimization.
- Marketplace artifacts are Claude-specific catalog outputs; keep them separate from runtime target artifacts.
- Gemini CLI adapter should be extension-manifest-first (`gemini-extension.json`) and MCP-centric, with command/hook/context mapping handled at adapter layer.
- Architecture borrows operational strengths from reference projects (OS-aware install docs, mapping guidance, target test suites) without inheriting manual-drift weaknesses.
