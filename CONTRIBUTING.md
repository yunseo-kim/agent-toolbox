# Contributing to agent-toolbox

Thank you for your interest in contributing to agent-toolbox. This document covers how to set up a local development environment, submit changes, and contribute new catalog skills.

## Table of Contents

- [Getting Started](#getting-started)
- [Ways to Contribute](#ways-to-contribute)
- [Development Workflow](#development-workflow)
- [Adding Catalog Skills](#adding-catalog-skills)
- [Code Quality](#code-quality)
- [Pull Request Process](#pull-request-process)
- [Guidelines](#guidelines)
- [Security](#security)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- [Node.js](https://nodejs.org/) >= 18 (for npm compatibility)
- [Git](https://git-scm.com/)
- [Lefthook](https://github.com/evilmartians/lefthook) (installed automatically via `bun install`)

Optional (for full security scanning):

- [Cisco Skill Scanner](https://github.com/cisco-ai-defense/skill-scanner): `pip install cisco-ai-skill-scanner`
- `SKILL_SCANNER_LLM_API_KEY` — OpenAI API key for LLM + Meta analyzers
- `VIRUSTOTAL_API_KEY` — VirusTotal API key for binary scanning

### Local Setup

```bash
# Clone the repository
git clone https://github.com/yunseo-kim/agent-toolbox.git
cd agent-toolbox

# Install dependencies (also installs Lefthook git hooks)
bun install
```

### Development Commands

```bash
# Validate catalog and schemas
bun run validate

# Build catalog index
bun run build:index

# Build artifacts for all targets
bun run build:all

# Run all tests
bun test

# Run specific test suites
bun run test:unit
bun run test:integration

# Type checking
bun run typecheck

# Lint and format
bun run lint          # Check for lint errors
bun run lint:fix      # Auto-fix lint errors
bun run format        # Auto-format all files
bun run format:check  # Check formatting without modifying
```

## Ways to Contribute

### Bug Reports

[Open a GitHub issue](https://github.com/yunseo-kim/agent-toolbox/issues/new) with:

- Steps to reproduce the issue
- Expected vs. actual behavior
- Environment details (OS, Bun version, target tool)

### Feature Requests

[Open a GitHub issue](https://github.com/yunseo-kim/agent-toolbox/issues/new) describing:

- The use case and motivation
- Expected behavior
- Any relevant context or alternatives considered

### Suggest a Skill, Hook, or MCP

[Open a GitHub issue](https://github.com/yunseo-kim/agent-toolbox/issues/new) with:

- Upstream project link
- Short description
- Rationale for inclusion

### Code Contributions

For non-trivial changes, open an issue first to discuss your approach before investing time in a PR.

## Development Workflow

### Branching

Create a branch from `main` with a descriptive name:

```bash
git checkout -b type/description
```

Common prefixes: `feat/`, `fix/`, `docs/`, `chore/`, `ci/`, `refactor/`, `test/`.

### Commits

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description
```

**Types**: `feat`, `fix`, `docs`, `chore`, `ci`, `refactor`, `test`, `build`, `perf`
**Scopes**: `catalog`, `cli`, `generator`, `install`, `scanner`, `readme`, `github`, etc.

Examples:

```
feat(generator): add Gemini CLI skill adapter
fix(install): handle symlink creation on Windows
docs(readme): update security section
chore(catalog): sync ported skill from upstream
```

### Testing

Run the full test suite before submitting a PR:

```bash
bun test              # All tests
bun run typecheck     # TypeScript type checking
bun run lint          # ESLint
bun run format:check  # Prettier
```

CI runs all of these automatically on every PR.

## Adding Catalog Skills

Skills live in `catalog/skills/` as flat directories (no domain nesting). Taxonomy is metadata-driven via SKILL.md frontmatter.

See [`catalog/README.md`](catalog/README.md) for the full taxonomy and listing conventions.

### SKILL.md Frontmatter

Every skill requires a `SKILL.md` with valid frontmatter:

```yaml
---
name: skill-name # required, kebab-case, max 64 chars
description: "What this skill does..." # required, max 1024 chars
license: Sustainable Use License 1.0 # required
metadata:
  domain: devops # required, from taxonomy.yaml
  subdomain: ci-cd # optional, from taxonomy.yaml
  tags: "github, yaml, automation" # optional, comma-separated
  frameworks: "nextjs" # optional, comma-separated
  author: "Name <email>" # required
  lastUpdated: "12026-03-11" # required, Holocene Era YYYYY-MM-DD
  provenance: original # required: ported | adapted | synthesized | original
---
```

- `domain` and `subdomain` values must exist in [`catalog/metadata/taxonomy.yaml`](catalog/metadata/taxonomy.yaml)
- Ported skills must preserve the upstream directory structure as-is
- Every catalog skill requires a `NOTICE.md` with proper attribution

### Security Requirements

All catalog skills are scanned by [Cisco Skill Scanner](https://github.com/cisco-ai-defense/skill-scanner) on every PR. Skills containing security issues will not be merged.

The pre-commit hook runs the scanner locally on changes to `catalog/skills/` or `.agents/skills/`:

```bash
# Run manually
skill-scanner scan catalog/skills/<skill-name>
```

### After Adding a Skill

Rebuild the catalog index and verify:

```bash
bun run build:index
bun run validate
bun test
```

## Code Quality

### Linting and Formatting

- **ESLint** — TypeScript linting with `typescript-eslint` recommended + stylistic rules
- **Prettier** — Code formatting with default settings

### Git Hooks (Lefthook)

Lefthook runs automatically on every commit and push:

| Hook         | Checks                                                     |
| ------------ | ---------------------------------------------------------- |
| `pre-commit` | Prettier formatting, ESLint, Skill Scanner (if applicable) |
| `pre-push`   | TypeScript type checking, full test suite                  |

Git hooks are installed automatically via `bun install`. To run manually:

```bash
bunx lefthook run pre-commit
bunx lefthook run pre-push
```

### TypeScript

- Strict mode is enabled
- Do not use `as any`, `@ts-ignore`, or `@ts-expect-error`

### CI Workflows

When adding or modifying GitHub Actions workflows:

- **Pin all actions to commit SHAs** — Use the full 40-character hash, not a mutable tag. Add a `# vX.Y.Z` comment for readability (e.g., `uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2`).
- **Add harden-runner as the first step in every job** — Use `step-security/harden-runner` with `egress-policy: audit`.
- **Scope permissions to job level** — Prefer job-level `permissions` blocks over top-level to enforce least privilege.

For details on these policies, see [`SECURITY.md`](SECURITY.md#workflow-hardening).

## Pull Request Process

### Before Submitting

- [ ] PR title follows [Conventional Commits](https://www.conventionalcommits.org/) format: `type(scope): description`
- [ ] Tests pass (`bun test`)
- [ ] Lint and format pass (`bun run lint && bun run format:check`)
- [ ] Type check passes (`bun run typecheck`)
- [ ] No secrets, credentials, or machine-local paths included

For CI workflow PRs, also verify:

- [ ] All action `uses:` references are pinned to full commit SHAs
- [ ] Every job has `step-security/harden-runner` as its first step
- [ ] Write permissions are scoped at job level, not top level

For catalog skill PRs, also verify:

- [ ] SKILL.md has valid frontmatter
- [ ] `metadata.domain`/`metadata.subdomain` values exist in `taxonomy.yaml`
- [ ] `NOTICE.md` is present with proper attribution
- [ ] Catalog index is up to date (`bun run build:index`)
- [ ] For ported skills: upstream directory structure and file names are preserved as-is

See the full [PR template](.github/PULL_REQUEST_TEMPLATE.md) for the complete checklist.

### Review Process

- A maintainer will review your PR and may request changes
- PRs should focus on a single concern — avoid mixing unrelated changes
- Respond to review feedback promptly
- Once approved, the maintainer will merge the PR

## Guidelines

- **Quality over quantity.** Whether you wrote it yourself or discovered it elsewhere, every contribution should be something a third party would independently recognize as high-quality and genuinely useful.
- **Self-authored work is welcome**, but held to the same bar — community traction, solid documentation, and a clear use case go a long way.
- **Final decisions rest with the maintainers.** All contributions are reviewed for quality, security, and catalog fit before inclusion.

## Security

> [!IMPORTANT]
> Do not report security vulnerabilities through public GitHub issues.

To report a vulnerability:

- [GitHub Security Advisories](https://github.com/yunseo-kim/agent-toolbox/security/advisories/new)
- Email [oss-security@yunseo.kim](mailto:oss-security@yunseo.kim)

For full details, see [`SECURITY.md`](SECURITY.md).
