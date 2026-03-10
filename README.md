<div align="center">

# agent-toolbox

[![SUL-1.0 license](https://img.shields.io/badge/license-SUL%201.0-97ca00)](LICENSE.md)
[![Release model](https://img.shields.io/badge/release_model-SemVer%20CLI%20%2B%20Rolling%20Catalog-0097a7)](./docs/release.md)
[![GitHub issues](https://img.shields.io/badge/issue_tracking-GitHub-blue.svg)](https://github.com/snu-hanaro/static-fire-toolkit/issues)
[![Cisco AI Defense](https://img.shields.io/badge/Secured%20by-Cisco%20AI%20Defense-049fd9?logo=cisco&logoColor=white)](https://github.com/cisco-ai-defense)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/yunseo-kim/agent-toolbox)

[![CI](https://github.com/yunseo-kim/agent-toolbox/actions/workflows/ci.yml/badge.svg)](https://github.com/yunseo-kim/agent-toolbox/actions/workflows/ci.yml)
[![CodeQL](https://github.com/yunseo-kim/agent-toolbox/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/yunseo-kim/agent-toolbox/actions/workflows/github-code-scanning/codeql)
[![Skill Security Scan](https://github.com/yunseo-kim/agent-toolbox/actions/workflows/skill-scanner.yml/badge.svg)](https://github.com/yunseo-kim/agent-toolbox/actions/workflows/skill-scanner.yml)

Secure infrastructure for the **AI agent skill ecosystem**.

A curated, security-vetted registry of agent skills that works across  
**Claude Code, Codex, Gemini CLI, Cursor, OpenCode, and more.**

[![Sponsor](https://img.shields.io/badge/Sponsor-yunseo--kim-EA4AAA?style=for-the-badge&logo=github-sponsors&logoColor=white)](https://github.com/sponsors/yunseo-kim)

<a href="https://www.buymeacoffee.com/yunseokim" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

</div>

## What is agent-toolbox?

AI coding assistants increasingly rely on **agent skills, plugins, hooks, and MCP servers**.

But the ecosystem has two major problems:

1. **Fragmentation** — standards like [Agent Skills](https://agentskills.io) define a common format, but don't guarantee that the content itself is tool-neutral
2. **Security risks** — agent skills form a new software supply chain

Recent research highlights the scale of the issue:

- [Snyk found **13.4% of ~4,000 scanned agent skills contained critical security issues**](<(https://github.com/snyk/agent-scan/blob/main/.github/reports/skills-report.pdf)>)
  - documented attacks include prompt injection, credential theft, and malware distribution
- [1Password **discovered the top-downloaded skill on ClawHub was a multi-stage infostealer**](https://1password.com/blog/from-magic-to-malware-how-openclaws-agent-skills-become-an-attack-surface) — the "Twitter" skill embedded a fake "required dependency" that led users through a 5-stage delivery chain ending in a macOS binary with Gatekeeper bypass; [VirusTotal confirmed](https://www.virustotal.com/gui/file/30f97ae88f8861eeadeb54854d47078724e52e2ef36dd847180663b7f5763168) the binary as infostealing malware targeting browser sessions, credentials, developer tokens, and SSH keys
  - **staged delivery**: fake prerequisite → staging page → obfuscated command → second-stage script → binary execution with quarantine removal
  - **coordinated campaign**: [subsequent reporting](https://cyberinsider.com/341-openclaw-skills-distribute-macos-malware-via-clickfix-instructions/) revealed hundreds of skills distributing macOS malware via ClickFix-style instructions — not an isolated upload
- [Cisco's AI Threat Research team **proved the #1 most-downloaded skill on OpenClaw's registry was functional malware**](https://blogs.cisco.com/ai/personal-ai-agents-like-openclaw-are-a-security-nightmare) — their [Skill Scanner](https://github.com/cisco-ai-defense/skill-scanner) found **9 security findings (2 critical, 5 high severity)** in the "What Would Elon Do?" skill:
  - **silent data exfiltration**: the skill executed `curl` commands sending user data to an attacker-controlled server without any user notification
  - **prompt injection**: forced the AI assistant to bypass its own safety guidelines and execute commands without user consent
  - **command injection**: embedded bash commands executed through the skill's workflow
  - **tool poisoning**: malicious payloads concealed within the skill file itself
  - the malicious skill's popularity had been artificially inflated to rank #1 — demonstrating that **bad actors can manufacture trust in unvetted registries**

In many ecosystems, a `SKILL.md` file is effectively **an installer for arbitrary logic**.

**agent-toolbox treats agent skills as a new software supply chain.**

It provides a **curated, security-scanned catalog of agent components**,  
with cross-tool compatibility and automated provenance tracking.

## What You Get

agent-toolbox provides:

- **110+ curated agent skills** across multiple domains
- **cross-tool compatibility** for major AI coding assistants
- **automated security scanning**
- **provenance tracking** for upstream sources
- **flexible installation filters**
- **tool-specific artifact generation**

Think of it as:

> **Homebrew + Sigstore + npm audit for AI agent skills**

## Use Cases

agent-toolbox can be used to:

- install curated agent skills for **Claude Code, Codex, Cursor, or Gemini CLI**
- share a **standardized skill catalog across teams**
- **audit third-party skills** before installing them
- maintain **secure agent tooling infrastructure**
- experiment with **cross-tool agent ecosystems**

## Getting Started

### Install Skills

```bash
# Install all skills for a target
bunx agent-toolbox install --target claude-code

# Filter by domain
bunx agent-toolbox install --target gemini --domain devops

# Filter by subdomain
bunx agent-toolbox install --target gemini --domain devops --subdomain ci-cd

# Use a curated preset
bunx agent-toolbox install --target cursor --preset devops-essentials

# Install specific skills
bunx agent-toolbox install --target claude-code --skill git-master --skill docs-writer

# Filter by framework or tag
bunx agent-toolbox install --target codex --framework nextjs
bunx agent-toolbox install --target gemini --tag yaml

# Preview what would be installed
bunx agent-toolbox install --target gemini --domain devops --dry-run
```

> [!TIP]
> **npm users:** Replace `bunx` with `npx`.

> [!NOTE]
> All filters compose with AND logic. Default (no filters) installs everything.

## Browse the Catalog

The catalog currently contains **110+ skills across 10 domains**.

Browse by domain:  
**[View the full catalog →](catalog/README.md)**

Skills are curated from leading open-source projects and adapted  
for **cross-tool compatibility**.

## Supported Targets

| Target          | Artifact Format                  | Status      |
| --------------- | -------------------------------- | ----------- |
| **Claude Code** | `.claude/` skills + plugins      | Implemented |
| **OpenCode**    | `skills/` with SKILL.md          | Implemented |
| **Gemini CLI**  | `gemini-extension.json` + skills | Implemented |
| **Cursor**      | `.cursor/` compatible artifacts  | Implemented |
| **Codex**       | Agent skill directories          | Implemented |

## Architecture

```
agent-toolbox/
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

### Workflow

1. **Catalog** — neutral SKILL.md definitions with frontmatter metadata (`domain`, `tags`, `frameworks`, `author`, `lastUpdated`, `provenance`).
2. **Generators** — transform catalog into tool-specific artifacts
3. **Install engine** — deploy skills with flexible filtering

## Security

Every skill in the catalog is automatically scanned using [**Cisco Skill Scanner**](https://github.com/cisco-ai-defense/skill-scanner) with a [custom strict-based policy](docs/skill-scanner-policy.md).

The security pipeline combines multiple detection engines:

- **Static analysis** — YAML + YARA pattern matching, bytecode verification, shell pipeline taint analysis
- **Behavioral analysis** — AST-based dataflow tracking from sources to sinks across multiple files
- **LLM semantic analysis** — OpenAI gpt-5.4 evaluates code intent against Cisco's AITech threat taxonomy
- **Meta-analysis** — Second-pass false positive filtering with cross-finding correlation
- **VirusTotal** — Hash-based binary malware scanning

Security findings are published through **GitHub Code Scanning**.

Monthly full-scan reports are archived in [docs/security-reports/](docs/security-reports/).

For full details, see [SECURITY.md](SECURITY.md).

> [!IMPORTANT]
> To report vulnerabilities:
>
> - [GitHub Security Advisories](https://github.com/yunseo-kim/agent-toolbox/security/advisories/new)
> - email [oss-security@yunseo.kim](mailto:oss-security@yunseo.kim).

## Support

> [!NOTE]
> If you find **agent-toolbox** useful, consider supporting the project.
>
> Maintaining agent-toolbox requires ongoing work including catalog review, security analysis, and cross-tool compatibility maintenance.
>
> Parts of the security pipeline currently rely on personally funded infrastructure, including:
>
> - **OpenAI API** usage for LLM-based security analysis
> - Rate-limited **VirusTotal public API** for malware detection
>
> Support helps sustain these security capabilities and expand the scanning infrastructure.

### Individual Support

**GitHub Sponsors:**  
[![Sponsor](https://img.shields.io/badge/Sponsor-yunseo--kim-EA4AAA?style=for-the-badge&logo=github-sponsors&logoColor=white)](https://github.com/sponsors/yunseo-kim)

**Buy Me a Coffee:**  
<a href="https://www.buymeacoffee.com/yunseokim" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

### Corporate Sponsorship

Organizations building or relying on AI coding assistants such as Claude Code, Codex, Cursor, or Gemini CLI may consider sponsoring the project.

Corporate sponsorship helps sustain:

- security scanning infrastructure
- catalog curation and review
- cross-tool compatibility maintenance
- long-term ecosystem development

> [!TIP]
> Corporate sponsors may be listed in the README.

## Sponsors

<!-- corporate sponsor logos will appear here -->

## Contributing

Contributions are welcome. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines on setting up a development environment, submitting changes, and adding catalog skills.

## License

**agent-toolbox** is released under the [Sustainable Use License 1.0](LICENSE.md).

> [!NOTE]
> The project is free to use for individuals, research, and open-source development. The Sustainable Use License is designed to enable broad community use while supporting the long-term sustainability of the project and its maintenance.

### Commercial Licensing

**agent-toolbox** aims to serve as secure infrastructure for the emerging AI agent skill ecosystem.

Organizations integrating or distributing **agent-toolbox** as part of a commercial AI product or hosted platform may require a **commercial license**.

Examples include:

- bundling agent-toolbox within an AI coding assistant
- integrating the catalog into a proprietary developer tool
- operating a hosted service built on agent-toolbox infrastructure

Commercial licenses provide:

- rights for commercial distribution
- proprietary product integration
- optional ecosystem partnership recognition

If your organization is interested in integrating **agent-toolbox** into a commercial product or platform, please reach out to **contact@yunseo.kim**.
