<div align="center">

# awesome-agent-toolbox

[![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

<a href="https://www.buymeacoffee.com/yunseokim" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

[![CI](https://github.com/yunseo-kim/awesome-agent-toolbox/actions/workflows/ci.yml/badge.svg)](https://github.com/yunseo-kim/awesome-agent-toolbox/actions/workflows/ci.yml)
[![CodeQL](https://github.com/yunseo-kim/awesome-agent-toolbox/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/yunseo-kim/awesome-agent-toolbox/actions/workflows/github-code-scanning/codeql)
[![Skill Security Scan](https://github.com/yunseo-kim/awesome-agent-toolbox/actions/workflows/skill-scanner.yml/badge.svg)](https://github.com/yunseo-kim/awesome-agent-toolbox/actions/workflows/skill-scanner.yml)

A trusted, curated cross-tool registry for agent components, with end-to-end provenance and automated security vetting of skills, MCP servers, and hooks — targeting **Claude Code, OpenCode, Codex, Antigravity, Gemini CLI, Cursor, and Windsurf**.

</div>

## Motivation

AI coding assistants are powerful, but their skills are fragmented across tools and ecosystems. Standards like [Agent Skills](https://agentskills.io) define a common skill format, but don't guarantee that the content itself is tool-neutral. Each tool still integrates skills, hooks, and MCP servers in subtly different ways — so a skill written for Claude Code doesn't work well in Gemini CLI, and a Cursor plugin can't be installed in Codex.

Fragmentation is only half the problem. Agent skills are a new software supply chain — and they're already under attack. Snyk's [ToxicSkills report](https://github.com/snyk/agent-scan/blob/main/.github/reports/skills-report.pdf) found that **13.4% of ~4,000 scanned skills contained critical security issues** — prompt injection, data exfiltration, and embedded malware — with 76 confirmed malicious payloads. [1Password](https://1password.com/blog/from-magic-to-malware-how-openclaws-agent-skills-become-an-attack-surface) and [Cisco](https://blogs.cisco.com/ai/personal-ai-agents-like-openclaw-are-a-security-nightmare) have independently documented live attacks where the top-downloaded skill on a major registry turned out to be an infostealer, and coordinated campaigns weaponized skills for silent credential theft. In an ecosystem where a SKILL.md file is effectively an installer, distributing unvetted skills means distributing unvetted code.

**awesome-agent-toolbox** solves both problems by maintaining a **single neutral catalog** of skills with [end-to-end provenance tracking](catalog/README.md) and [automated security vetting](#security), then generating tool-specific artifacts for each target. Write once, install everywhere — safely.

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
│       ├── skill-index.json          # Auto-generated aggregated skill metadata
│       └── skill-index.toon          # Auto-generated TOON format for LLM consumption
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

## Browse the Catalog

**[View all skills by domain →](catalog/README.md)**

The catalog currently contains **118 skills** across 10 domains, curated from leading open-source projects and adapted for cross-tool compatibility.

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

## Supported Targets

| Target | Artifact Format | Status |
|--------|----------------|--------|
| **Claude Code** | `.claude/` skills + plugins | Implemented |
| **OpenCode** | `skills/` with SKILL.md | Implemented |
| **Gemini CLI** | `gemini-extension.json` + skills | Implemented |
| **Cursor** | `.cursor/` compatible artifacts | Implemented |
| **Codex** | Agent skill directories | Implemented |

## Security

Every skill in the catalog is automatically scanned for security threats using [Cisco Skill Scanner](https://github.com/cisco-ai-defense/skill-scanner) with a **strict** policy preset. The scanner runs on every push and pull request that touches skill files, combining eight detection engines:

- **Static analysis** — YAML + YARA pattern matching, bytecode verification, shell pipeline taint analysis
- **Behavioral analysis** — AST-based dataflow tracking from sources to sinks across multiple files
- **LLM semantic analysis** — OpenAI gpt-5.2 evaluates code intent against Cisco's AITech threat taxonomy
- **Meta-analysis** — Second-pass false positive filtering with cross-finding correlation
- **VirusTotal** — Hash-based binary malware scanning

Results are uploaded as SARIF to GitHub Code Scanning, so findings appear as inline PR annotations. A pre-commit hook provides the same scanning locally before every commit. Monthly full-scan reports are archived in [`docs/security-reports/`](docs/security-reports/). For full details, see [`SECURITY.md`](SECURITY.md).

To report a security vulnerability, use [GitHub Security Advisories](https://github.com/yunseo-kim/awesome-agent-toolbox/security/advisories/new) or email [oss-security@yunseo.kim](mailto:oss-security@yunseo.kim).

## Contributing

See [`catalog/README.md`](catalog/README.md) for the skill taxonomy and listing conventions. Skills are authored as SKILL.md files with frontmatter metadata — no directory nesting required.

### Suggest a Skill, Hook, or MCP

Want to see a specific upstream project, skill, hook, or MCP server added to the catalog? [Open an issue](https://github.com/yunseo-kim/awesome-agent-toolbox/issues/new) with a link and a brief description of why it would be a good fit.

A few guidelines:

- **Quality over quantity.** Whether you wrote it yourself or discovered it elsewhere, every suggestion should be something a third party would independently recognize as high-quality and genuinely useful.
- **Self-authored work is welcome**, but held to the same bar — community traction, solid documentation, and a clear use case go a long way.
- **Final decisions rest with the maintainers.** I review every suggestion for quality, security, and catalog fit before inclusion.

## License

[Sustainable Use License 1.0](LICENSE.md)
