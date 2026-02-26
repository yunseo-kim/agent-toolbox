<div align="center">

# awesome-agent-toolbox

[![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

A cross-tool distribution system for agent skills, plugins, and MCP servers — targeting **Claude Code, OpenCode, Gemini CLI, Cursor, and Codex**.

</div>

## Why

AI coding assistants are powerful, but their skills are fragmented across tools and ecosystems. A skill written for Claude Code doesn't work in Gemini CLI. A Cursor plugin can't be installed in Codex.

**awesome-agent-toolbox** solves this by maintaining a **single neutral catalog** of skills, then generating tool-specific artifacts for each target. Write once, install everywhere.

## Architecture

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
│       ├── upstream-sources.yaml     # Ported/adapted skill upstream mappings
│       └── catalog-index.json        # Auto-generated aggregated metadata
├── src/                              # Bun-first TS toolchain
│   ├── catalog/                      # Skill scanning, validation, index building
│   ├── cli/                          # install/build/validate entrypoints
│   ├── generators/                   # claude-code / opencode / cursor / codex / gemini
│   ├── install/                      # Selective install engine + filter composition
│   ├── mappers/                      # Tool/event/model mapping layers
│   └── schemas/                      # Zod schemas for catalog + targets + install
├── templates/                        # Target-specific render templates
├── dist/
│   ├── targets/                      # Runtime artifacts per tool
│   │   ├── claude-code/
│   │   ├── opencode/
│   │   ├── cursor/
│   │   ├── codex/
│   │   └── gemini/
│   └── marketplace/                  # Catalog artifacts (Claude-specific)
└── tests/
    ├── unit/                         # Schema, taxonomy, frontmatter, scanner, filter
    ├── integration/                  # Generator and install pipeline tests
    └── matrix/                       # Cross-target verification
```

### How It Works

1. **Catalog** — Skills live in `catalog/skills/` as tool-neutral SKILL.md files with frontmatter metadata (domain, tags, frameworks, provenance).
2. **Generators** — Target-specific generators in `src/generators/` transform catalog content into each tool's native format.
3. **Install** — The install engine applies filters (domain, subdomain, framework, tag, preset, skill name) and deploys to the target environment.

## Getting Started

### Install Skills

```bash
# Install all skills for a target
bunx awesome-agent-toolbox install --target claude-code

# Filter by domain
bunx awesome-agent-toolbox install --target gemini --domain devops

# Filter by subdomain
bunx awesome-agent-toolbox install --target gemini --domain devops --subdomain ci-cd

# Use a curated preset
bunx awesome-agent-toolbox install --target cursor --preset devops-essentials

# Install specific skills
bunx awesome-agent-toolbox install --target claude-code --skill git-master --skill docs-writer

# Filter by framework or tag
bunx awesome-agent-toolbox install --target codex --framework nextjs
bunx awesome-agent-toolbox install --target gemini --tag yaml

# Preview what would be installed
bunx awesome-agent-toolbox install --target gemini --domain devops --dry-run
```

> **npm users:** Replace `bunx` with `npx`.

All filters compose with AND logic. Default (no filters) installs everything.

### Build & Validate

```bash
bun run validate           # Validate catalog and schemas
bun run build:index        # Rebuild catalog index from SKILL.md frontmatter
bun run build:all          # Generate artifacts for all targets
bun run typecheck          # TypeScript type checking
bun test                   # Run all tests
```

## Browse the Catalog

**[View all skills by domain →](catalog/README.md)**

The catalog currently contains **114 skills** across 10 domains, curated from leading open-source projects and adapted for cross-tool compatibility.

## Supported Targets

| Target | Artifact Format | Status |
|--------|----------------|--------|
| **Claude Code** | `.claude/` skills + plugins | Implemented |
| **OpenCode** | `skills/` with SKILL.md | Implemented |
| **Gemini CLI** | `gemini-extension.json` + skills | Implemented |
| **Cursor** | `.cursor/` compatible artifacts | Implemented |
| **Codex** | Agent skill directories | Implemented |

## Contributing

See [`catalog/README.md`](catalog/README.md) for the skill taxonomy and listing conventions. Skills are authored as SKILL.md files with frontmatter metadata — no directory nesting required.

## License

[Sustainable Use License 1.0](LICENSE.md)
