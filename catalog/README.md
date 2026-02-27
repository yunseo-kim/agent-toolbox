# Skill Catalog

[![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

A curated collection of agent skills, plugins, and MCP servers — organized by domain.

> **Note:** The "Upstream License" column shows the original license of the source
> project each skill was derived from. Catalog skills may be modified from their
> originals and are governed by the project's [Sustainable Use License](../LICENSE.md).
> See each skill's `NOTICE.md` for specific attribution and modification details.

## Taxonomy

Catalog items are classified using metadata in SKILL.md frontmatter — not directory structure. The `catalog/skills/` directory remains **flat** (one directory per skill).

| Field | Required | Values |
|-------|:--------:|--------|
| **Domain** | Yes | Controlled vocabulary from [`taxonomy.yaml`](metadata/taxonomy.yaml) |
| **Subdomain** | No | Controlled vocabulary from [`taxonomy.yaml`](metadata/taxonomy.yaml) |
| **Tags** | No | Freeform comma-separated keywords |
| **Frameworks** | No | Freeform comma-separated framework associations |
| **Provenance** | Yes | `ported` · `adapted` · `synthesized` · `original` |

### Domains

| Domain | Description |
|--------|-------------|
| `productivity` | Domain-agnostic workflow automation, task management, and general productivity tools |
| `development` | Software development tools, patterns, and frameworks |
| `devops` | Infrastructure, deployment, operations, testing, security, and code quality |
| `documentation` | Technical documentation, API references, knowledge bases, and developer-facing docs |
| `databases` | Database management, querying, and optimization |
| `blockchain` | Blockchain, smart contracts, and Web3 development |
| `data-ai` | General-purpose data engineering, machine learning, and AI tooling |
| `research` | Academic research, scientific workflows, literature review, and domain-specific analysis |
| `business` | Domain-specific business operations, marketing, finance, and commerce |
| `content-media` | Non-technical content creation, education, media processing, and publishing |

### Provenance Types

| Type | Definition |
|------|------------|
| **External** | Listed in catalog only for reference; not in `catalog/skills/`. Links to original repo |
| **Ported** | Copied to `catalog/skills/` with minimal changes from one source |
| **Adapted** | In `catalog/skills/` with significant modifications from one source |
| **Synthesized** | In `catalog/skills/` as original work combining multiple sources |

For detailed classification criteria, see [`docs/CLASSIFICATION.md`](../docs/CLASSIFICATION.md).

### Selective Install

Skills can be filtered during installation using domain, subdomain, framework, tag, preset, or individual skill name. All filters compose with AND logic.

```bash
# Install all skills for a target
bunx awesome-agent-toolbox install --target claude-code

# Filter by domain
bunx awesome-agent-toolbox install --target gemini --domain devops

# Filter by domain + subdomain
bunx awesome-agent-toolbox install --target gemini --domain devops --subdomain ci-cd

# Filter by preset bundle
bunx awesome-agent-toolbox install --target cursor --preset devops-essentials

# Install specific skills
bunx awesome-agent-toolbox install --target claude-code --skill git-master --skill docs-writer

# Dry run
bunx awesome-agent-toolbox install --target gemini --domain devops --dry-run
```

> **npm users:** Replace `bunx` with `npx`.

---

## Skills

### Productivity, Automation & Administration

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| [docx](https://github.com/anthropics/skills/tree/main/skills/docx) | [anthropics/skills](https://github.com/anthropics/skills) | ![](https://img.shields.io/github/stars/anthropics/skills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](https://github.com/anthropics/skills/blob/main/skills/docx/LICENSE.txt) | External | Create, edit, and analyze Word documents with tracked changes, comments, and formatting |
| [pdf](https://github.com/anthropics/skills/tree/main/skills/pdf) | [anthropics/skills](https://github.com/anthropics/skills) | ![](https://img.shields.io/github/stars/anthropics/skills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](https://github.com/anthropics/skills/blob/main/skills/pdf/LICENSE.txt) | External | Read, create, merge, split, rotate, watermark, fill forms, and OCR PDF files |
| [loom-transcript](skills/loom-transcript) | [n8n-io/n8n](https://github.com/n8n-io/n8n) | ![](https://img.shields.io/github/stars/n8n-io/n8n?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-SUL%201.0-97ca00?style=flat-square)](https://github.com/n8n-io/n8n/blob/master/LICENSE.md) | Ported | Fetch and display the full transcript from a Loom video URL using Loom's public GraphQL API |
| [apple-notes](skills/apple-notes) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | Manage Apple Notes via the memo CLI on macOS — create, view, edit, delete, search, move, and export notes |
| [apple-reminders](skills/apple-reminders) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Adapted | Manage Apple Reminders via remindctl CLI with support for lists, date filters, and JSON output |
| [bear-notes](skills/bear-notes) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | Create, search, and manage Bear notes via the grizzly CLI on macOS |
| [blogwatcher](skills/blogwatcher) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | Monitor blogs and RSS/Atom feeds for updates, track new articles, and manage subscriptions |
| [blucli](skills/blucli) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | Control Bluesound/NAD players via the BluOS CLI — discovery, playback, grouping, and volume management |
| [eightctl](skills/eightctl) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | Control Eight Sleep pods via CLI — check status, set temperature, manage alarms, and configure sleep schedules |
| [nano-pdf](skills/nano-pdf) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | Lightweight PDF processing from the command line for extraction, conversion, and manipulation |
| [notion-api](skills/notion-api) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | Interact with the Notion API for creating and managing pages, databases, and blocks |
| [obsidian-vault](skills/obsidian-vault) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | Work with Obsidian vaults and automate via obsidian-cli — search, create, move, rename, and manage notes |
| [openhue](skills/openhue) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | Control Philips Hue lights and scenes via the OpenHue CLI — brightness, colors, and scene activation |
| [ordercli](skills/ordercli) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | Check past food delivery orders and track active order status via the ordercli CLI |
| [sonoscli](skills/sonoscli) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | Control Sonos speakers from the terminal — discover, play, pause, adjust volume, and manage groups |
| [summarize-cli](skills/summarize-cli) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | Summarize or extract text and transcripts from URLs, podcasts, and local files |
| [things-mac-cli](skills/things-mac-cli) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Adapted | Manage Things 3 via the things CLI on macOS — add, update, search, and list todos and projects |
| [trello-api](skills/trello-api) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Adapted | Manage Trello boards, lists, and cards via the Trello REST API |
| [meeting-notes](skills/meeting-notes) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | ![](https://img.shields.io/github/stars/Shubhamsaboo/awesome-llm-apps?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/Shubhamsaboo/awesome-llm-apps/blob/main/LICENSE) | Ported | Structured meeting summaries with action items, decisions, key discussion points, and follow-up tracking |
| [decision-helper](skills/decision-helper) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | ![](https://img.shields.io/github/stars/Shubhamsaboo/awesome-llm-apps?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/Shubhamsaboo/awesome-llm-apps/blob/main/LICENSE) | Ported | Structured decision-making frameworks for evaluating options, weighing trade-offs, and making informed choices |

### Development

#### Frontend

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| [ai-elements](skills/ai-elements) | [vercel/ai-elements](https://github.com/vercel/ai-elements) | ![](https://img.shields.io/github/stars/vercel/ai-elements?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/vercel/ai-elements/blob/main/LICENSE) | Ported | AI chat interface component library built on shadcn/ui with 47+ composable components for conversations, messages, prompts, and tool displays |
| [composition-patterns](skills/composition-patterns) | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | ![](https://img.shields.io/github/stars/vercel-labs/agent-skills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/vercel-labs/agent-skills) | Ported | React composition patterns for compound components, state lifting, context interfaces, and React 19 APIs |
| [flags-sdk](skills/flags-sdk) | [vercel/flags](https://github.com/vercel/flags) | ![](https://img.shields.io/github/stars/vercel/flags?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/vercel/flags/blob/main/LICENSE.md) | Ported | Implement feature flags and A/B tests with the Flags SDK covering flag declaration, precompute patterns, and 13+ provider adapters for Next.js and SvelteKit |
| [frontend-design](skills/frontend-design) | [anthropics/skills](https://github.com/anthropics/skills) | ![](https://img.shields.io/github/stars/anthropics/skills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/anthropics/skills/blob/main/LICENSE) | Adapted | Create distinctive, production-grade frontend interfaces with high design quality |
| [nextjs-cache-components](skills/nextjs-cache-components) | [vercel/next.js](https://github.com/vercel/next.js) | ![](https://img.shields.io/github/stars/vercel/next.js?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/vercel/next.js/blob/canary/license.md) | Adapted | Expert guidance for Next.js Cache Components and Partial Prerendering with 'use cache', cacheLife(), cacheTag(), and cache invalidation patterns |
| [react-best-practices](skills/react-best-practices) | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | ![](https://img.shields.io/github/stars/vercel-labs/agent-skills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/vercel-labs/agent-skills) | Ported | React and Next.js performance optimization with 57 rules across 8 categories from Vercel Engineering |
| [react-refactoring](skills/react-refactoring) | [langgenius/dify](https://github.com/langgenius/dify) | ![](https://img.shields.io/github/stars/langgenius/dify?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0%20(modified)-97ca00?style=flat-square)](https://github.com/langgenius/dify/blob/main/LICENSE) | Adapted | Refactor complex React components with patterns for hook extraction, component splitting, and complexity reduction |
| [streamdown](skills/streamdown) | [vercel/streamdown](https://github.com/vercel/streamdown) | ![](https://img.shields.io/github/stars/vercel/streamdown?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/vercel/streamdown/blob/main/LICENSE) | Ported | Streaming-optimized React Markdown renderer with syntax highlighting, Mermaid diagrams, math, and AI streaming support |
| [ux-designer](skills/ux-designer) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | ![](https://img.shields.io/github/stars/Shubhamsaboo/awesome-llm-apps?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/Shubhamsaboo/awesome-llm-apps/blob/main/LICENSE) | Ported | Expert UX design assistance for user research, wireframing, prototyping, and design strategy |
| [web-artifacts-builder](skills/web-artifacts-builder) | [anthropics/skills](https://github.com/anthropics/skills) | ![](https://img.shields.io/github/stars/anthropics/skills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/anthropics/skills/blob/main/LICENSE) | Adapted | Build multi-component HTML artifacts using React, Tailwind CSS, and shadcn/ui |
| [web-design-guidelines](skills/web-design-guidelines) | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | ![](https://img.shields.io/github/stars/vercel-labs/agent-skills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/vercel-labs/agent-skills) | Ported | Review UI code for Web Interface Guidelines compliance across 100+ accessibility, performance, and UX rules |

#### Backend

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| [chat-sdk](skills/chat-sdk) | [vercel/chat](https://github.com/vercel/chat) | ![](https://img.shields.io/github/stars/vercel/chat?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/vercel/chat/blob/main/LICENSE) | Adapted | Unified TypeScript SDK for building chat bots across Slack, Teams, Google Chat, Discord, GitHub, and Linear |

#### Full Stack

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| [fullstack-developer](skills/fullstack-developer) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | ![](https://img.shields.io/github/stars/Shubhamsaboo/awesome-llm-apps?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/Shubhamsaboo/awesome-llm-apps/blob/main/LICENSE) | Ported | Modern web development expertise covering React, Node.js, TypeScript, databases, and full-stack architecture patterns |

#### Game Development

#### Developer Tooling

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| [mcp-builder](skills/mcp-builder) | [anthropics/skills](https://github.com/anthropics/skills) | ![](https://img.shields.io/github/stars/anthropics/skills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/anthropics/skills/blob/main/LICENSE) | Ported | Guide for creating high-quality MCP servers that enable LLMs to interact with external services |
| [skill-creator](skills/skill-creator) | [anthropics/skills](https://github.com/anthropics/skills) | ![](https://img.shields.io/github/stars/anthropics/skills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/anthropics/skills/blob/main/LICENSE) | Adapted | Guide for creating effective skills that extend AI assistant capabilities |
| [mcporter](skills/mcporter) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | List, configure, authenticate, and call MCP servers and tools directly via the mcporter CLI |
| [tmux-controller](skills/tmux-controller) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Adapted | Remote-control tmux sessions by sending keystrokes and scraping pane output |

#### Scripting

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| [python-expert](skills/python-expert) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | ![](https://img.shields.io/github/stars/Shubhamsaboo/awesome-llm-apps?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/Shubhamsaboo/awesome-llm-apps/blob/main/LICENSE) | Ported | Senior Python developer expertise for writing clean, efficient, and well-documented code with type hints |

#### Mobile

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| [react-native-skills](skills/react-native-skills) | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | ![](https://img.shields.io/github/stars/vercel-labs/agent-skills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/vercel-labs/agent-skills) | Ported | React Native and Expo best practices with 35+ rules for list performance, animations, navigation, and UI patterns |

#### Package & Distribution

#### Low-Level Development

### DevOps

#### Git Workflows

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| [create-pr](skills/create-pr) | [n8n-io/n8n](https://github.com/n8n-io/n8n) | ![](https://img.shields.io/github/stars/n8n-io/n8n?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-SUL%201.0-97ca00?style=flat-square)](https://github.com/n8n-io/n8n/blob/master/LICENSE.md) | Adapted | Create GitHub PRs with Conventional Commits-formatted titles and structured bodies |
| [github-cli](skills/github-cli) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Adapted | GitHub operations via the gh CLI — manage issues, PRs, CI runs, and API queries |

#### CI/CD

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| [ci-triage](skills/ci-triage) | [vercel/next.js](https://github.com/vercel/next.js) | — | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](skills/ci-triage/NOTICE.md) | Synthesized | Triage CI failures and PR review comments with structured prioritization, failure categorization, and parallel log analysis |

#### Cloud

#### Containers

#### Monitoring

#### Code Review

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| [code-reviewer](skills/code-reviewer) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | ![](https://img.shields.io/github/stars/Shubhamsaboo/awesome-llm-apps?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/Shubhamsaboo/awesome-llm-apps/blob/main/LICENSE) | Ported | Thorough code review with focus on security vulnerabilities, performance issues, and best practices |
| [frontend-code-review](skills/frontend-code-review) | [langgenius/dify](https://github.com/langgenius/dify) | ![](https://img.shields.io/github/stars/langgenius/dify?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0%20(modified)-97ca00?style=flat-square)](https://github.com/langgenius/dify/blob/main/LICENSE) | Adapted | Review frontend code for quality, performance, and best practices with urgency-based structured output |

#### Testing

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| [webapp-testing](skills/webapp-testing) | [anthropics/skills](https://github.com/anthropics/skills) | ![](https://img.shields.io/github/stars/anthropics/skills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/anthropics/skills/blob/main/LICENSE) | Ported | Test local web applications using Playwright with server lifecycle management and browser automation |
| [reproduce-bug](skills/reproduce-bug) | [n8n-io/n8n](https://github.com/n8n-io/n8n) | ![](https://img.shields.io/github/stars/n8n-io/n8n?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-SUL%201.0-97ca00?style=flat-square)](https://github.com/n8n-io/n8n/blob/master/LICENSE.md) | Adapted | Systematically reproduce a bug from a ticket with a failing regression test using hypothesis-driven methodology |
| [debugger](skills/debugger) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | ![](https://img.shields.io/github/stars/Shubhamsaboo/awesome-llm-apps?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/Shubhamsaboo/awesome-llm-apps/blob/main/LICENSE) | Ported | Systematic debugging and root cause analysis using binary search, bisect, and structured hypothesis testing |
| [frontend-testing](skills/frontend-testing) | [langgenius/dify](https://github.com/langgenius/dify) | ![](https://img.shields.io/github/stars/langgenius/dify?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0%20(modified)-97ca00?style=flat-square)](https://github.com/langgenius/dify/blob/main/LICENSE) | Adapted | Comprehensive Vitest and React Testing Library guide with templates, mocking patterns, and incremental workflow |

#### Security

### Documentation

#### Knowledge Base

#### Technical Docs

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| [doc-coauthoring](skills/doc-coauthoring) | [anthropics/skills](https://github.com/anthropics/skills) | ![](https://img.shields.io/github/stars/anthropics/skills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](skills/doc-coauthoring/NOTICE.md) | Adapted | Guide users through a structured workflow for co-authoring documentation, proposals, and specs |
| [docs-writer](skills/docs-writer) | [vercel/next.js](https://github.com/vercel/next.js), [angular/angular](https://github.com/angular/angular), [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli), [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | — | [![](https://img.shields.io/badge/license-MIT%20%2F%20Apache%202.0-97ca00?style=flat-square)](skills/docs-writer/NOTICE.md) | Synthesized | Unified documentation workflow with profile-based rules for generic, Next.js, and Angular docs |
| [docs-changelog](https://github.com/google-gemini/gemini-cli/tree/main/.gemini/skills/docs-changelog) | [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli) | ![](https://img.shields.io/github/stars/google-gemini/gemini-cli?style=flat-square&logo=github) | ![](https://img.shields.io/github/license/google-gemini/gemini-cli?style=flat-square) | External | |
| [microsoft-docs](https://github.com/microsoft/ai-agents-for-beginners/tree/main/.agents/skills/microsoft-docs) | [microsoft/ai-agents-for-beginners](https://github.com/microsoft/ai-agents-for-beginners) | ![](https://img.shields.io/github/stars/microsoft/ai-agents-for-beginners?style=flat-square&logo=github) | ![](https://img.shields.io/github/license/microsoft/ai-agents-for-beginners?style=flat-square) | External | |
| [context7-docs-lookup](https://github.com/upstash/context7/tree/master/plugins/cursor/context7/skills/context7-docs-lookup) | [upstash/context7](https://github.com/upstash/context7) | ![](https://img.shields.io/github/stars/upstash/context7?style=flat-square&logo=github) | ![](https://img.shields.io/github/license/upstash/context7?style=flat-square) | External | |
| [js-docs-fact-check](skills/js-docs-fact-check) | [leonardomso/33-js-concepts](https://github.com/leonardomso/33-js-concepts) | ![](https://img.shields.io/github/stars/leonardomso/33-js-concepts?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/leonardomso/33-js-concepts/blob/master/LICENSE) | Adapted | Verify technical accuracy of JavaScript documentation by checking code examples, MDN/spec compliance, and common misconceptions |
| [js-resource-curator](skills/js-resource-curator) | [leonardomso/33-js-concepts](https://github.com/leonardomso/33-js-concepts) | ![](https://img.shields.io/github/stars/leonardomso/33-js-concepts?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/leonardomso/33-js-concepts/blob/master/LICENSE) | Adapted | Find, evaluate, and maintain quality external resources for JavaScript documentation with trusted source lists and link auditing |
| [seo-review](skills/seo-review) | [leonardomso/33-js-concepts](https://github.com/leonardomso/33-js-concepts) | ![](https://img.shields.io/github/stars/leonardomso/33-js-concepts?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/leonardomso/33-js-concepts/blob/master/LICENSE) | Adapted | Perform SEO audits on documentation pages with scoring, checklists, and optimization recommendations |

### Databases

### Blockchain

### Data & AI

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| [gemini-cli](skills/gemini-cli) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | Use Gemini CLI for one-shot Q&A, summaries, and generation tasks with model selection and JSON output |
| [oracle-cli](skills/oracle-cli) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | Bundle prompts and files into one-shot AI consultations via the oracle CLI with multiple model providers |
| [data-analyst](skills/data-analyst) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | ![](https://img.shields.io/github/stars/Shubhamsaboo/awesome-llm-apps?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/Shubhamsaboo/awesome-llm-apps/blob/main/LICENSE) | Ported | SQL, pandas, and statistical analysis expertise for data exploration, cleaning, and insight generation |
| [visualization-expert](skills/visualization-expert) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | ![](https://img.shields.io/github/stars/Shubhamsaboo/awesome-llm-apps?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/Shubhamsaboo/awesome-llm-apps/blob/main/LICENSE) | Ported | Chart selection and data visualization guidance for effective data communication |
| [rag-patterns](skills/rag-patterns) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps), [microsoft/graphrag](https://github.com/microsoft/graphrag), [VectifyAI/PageIndex](https://github.com/VectifyAI/PageIndex) | — | [![](https://img.shields.io/badge/license-Apache%202.0%20%2F%20MIT-97ca00?style=flat-square)](skills/rag-patterns/NOTICE.md) | Synthesized | Implementation patterns for Retrieval-Augmented Generation covering basic chains, corrective RAG, hybrid search, knowledge graphs, reasoning-based vectorless RAG, and more |
| [llm-memory-patterns](skills/llm-memory-patterns) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | — | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](skills/llm-memory-patterns/NOTICE.md) | Synthesized | Implementation patterns for LLM memory systems from conversation buffers to agentic memory |
| [google-adk-guide](skills/google-adk-guide) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | — | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](skills/google-adk-guide/NOTICE.md) | Synthesized | Guide to building AI agents with Google Agent Development Kit covering tools, memory, and multi-agent orchestration |
| [openai-agents-guide](skills/openai-agents-guide) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | — | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](skills/openai-agents-guide/NOTICE.md) | Synthesized | Guide to building AI agents with OpenAI Agents SDK covering tools, guardrails, handoffs, and multi-agent orchestration |
| [ai-sdk](skills/ai-sdk) | [vercel/ai](https://github.com/vercel/ai) | ![](https://img.shields.io/github/stars/vercel/ai?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/vercel/ai/blob/main/LICENSE) | Ported | Answer questions about the Vercel AI SDK and help build AI-powered features with generateText, streamText, agents, and useChat |
| [torch-export](skills/torch-export) | [pytorch/executorch](https://github.com/pytorch/executorch) | ![](https://img.shields.io/github/stars/pytorch/executorch?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-BSD%203--Clause-97ca00?style=flat-square)](https://github.com/pytorch/executorch/blob/main/LICENSE) | Adapted | Expert guide to `torch.export` covering dynamic shapes, symbolic tracing, control flow, debugging, and making untraceable code traceable |

### Research

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| [goplaces](skills/goplaces) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | Query Google Places API (New) via the goplaces CLI — text search, place details, and reviews |
| [weather-cli](skills/weather-cli) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | Get current weather conditions and forecasts for any location via wttr.in with no API key needed |
| [deep-research](skills/deep-research) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | ![](https://img.shields.io/github/stars/Shubhamsaboo/awesome-llm-apps?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/Shubhamsaboo/awesome-llm-apps/blob/main/LICENSE) | Ported | Comprehensive research that synthesizes information from multiple sources with proper citations |
| [fact-checker](skills/fact-checker) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | ![](https://img.shields.io/github/stars/Shubhamsaboo/awesome-llm-apps?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/Shubhamsaboo/awesome-llm-apps/blob/main/LICENSE) | Ported | Systematic fact verification and misinformation identification with confidence ratings and source evaluation |

#### Citation Management

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| [academic-researcher](skills/academic-researcher) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | ![](https://img.shields.io/github/stars/Shubhamsaboo/awesome-llm-apps?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/Shubhamsaboo/awesome-llm-apps/blob/main/LICENSE) | Ported | Academic research for literature reviews, paper analysis, scholarly writing, and citation formatting |

#### Bioinformatics

#### Computational Chemistry

#### Astronomy & Physics

### Business

#### Communications

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| [internal-comms](skills/internal-comms) | [anthropics/skills](https://github.com/anthropics/skills) | ![](https://img.shields.io/github/stars/anthropics/skills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/anthropics/skills/blob/main/LICENSE) | Ported | Write internal communications including status reports, newsletters, 3P updates, FAQs, and incident reports |
| [email-drafter](skills/email-drafter) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | ![](https://img.shields.io/github/stars/Shubhamsaboo/awesome-llm-apps?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/Shubhamsaboo/awesome-llm-apps/blob/main/LICENSE) | Ported | Professional email composition for business communication including meeting requests and follow-ups |

#### Sales & Marketing

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| [ab-test-setup](skills/ab-test-setup) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Plan, design, and implement A/B tests and experiments with proper sample sizing and statistical significance |
| [ad-creative](skills/ad-creative) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Generate, iterate, and scale ad creative for Google, Meta, LinkedIn, and TikTok with platform-specific specs |
| [ai-seo](skills/ai-seo) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Optimize content for AI search engines and get cited by LLMs using AEO, GEO, and LLMO strategies |
| [analytics-tracking](skills/analytics-tracking) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Set up, improve, or audit analytics tracking with GA4, GTM, event naming conventions, and conversion measurement |
| [churn-prevention](skills/churn-prevention) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Reduce churn with cancellation flows, save offers, dunning sequences, and failed payment recovery |
| [cold-email](skills/cold-email) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Write B2B cold emails and follow-up sequences with personalization, subject lines, and multi-touch frameworks |
| [competitor-alternatives](skills/competitor-alternatives) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Create competitor comparison and alternative pages for SEO and sales enablement |
| [content-strategy](skills/content-strategy) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Plan content strategy with topic clusters, pillar pages, and distribution plans |
| [copy-editing](skills/copy-editing) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Edit, review, and improve existing marketing copy for clarity, conciseness, and plain English readability |
| [copywriting](skills/copywriting) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Write, rewrite, or improve marketing copy for homepages, landing pages, pricing pages, and product pages |
| [email-sequence](skills/email-sequence) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Create or optimize email sequences, drip campaigns, and automated lifecycle email flows |
| [form-cro](skills/form-cro) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Optimize lead capture, contact, and survey forms for higher completion rates |
| [free-tool-strategy](skills/free-tool-strategy) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Plan, evaluate, or build free tools for lead generation, SEO value, and brand awareness |
| [launch-strategy](skills/launch-strategy) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Plan product launches, feature announcements, and release strategies with momentum tactics |
| [marketing-ideas](skills/marketing-ideas) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Generate marketing ideas and strategies for SaaS products across 140+ proven tactics |
| [marketing-psychology](skills/marketing-psychology) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Apply psychological principles, mental models, and behavioral science to marketing |
| [onboarding-cro](skills/onboarding-cro) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Optimize post-signup onboarding, user activation, and time-to-value for better retention |
| [page-cro](skills/page-cro) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Optimize conversions on any marketing page including homepage, landing pages, and pricing pages |
| [paid-ads](skills/paid-ads) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Plan and optimize paid ad campaigns on Google Ads, Meta, LinkedIn, Twitter/X, and TikTok |
| [paywall-upgrade-cro](skills/paywall-upgrade-cro) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Create or optimize in-app paywalls, upgrade screens, upsell modals, and feature gates |
| [popup-cro](skills/popup-cro) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Create or optimize popups, modals, overlays, and slide-ins for conversion |
| [pricing-strategy](skills/pricing-strategy) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Make pricing decisions, design packaging and tiers, and develop monetization strategy |
| [product-marketing-context](skills/product-marketing-context) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Create and maintain a product marketing context document with positioning and messaging that other skills reference |
| [programmatic-seo](skills/programmatic-seo) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Create SEO-driven pages at scale using templates and data with programmatic page generation |
| [referral-program](skills/referral-program) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Create, optimize, or analyze referral programs, affiliate programs, and word-of-mouth strategies |
| [schema-markup](skills/schema-markup) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Add, fix, or optimize schema markup and structured data with JSON-LD for rich search results |
| [seo-audit](skills/seo-audit) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Audit, review, and diagnose SEO issues covering technical SEO, on-page optimization, and content quality |
| [signup-flow-cro](skills/signup-flow-cro) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Optimize signup, registration, and trial activation flows for higher conversion rates |
| [social-content](skills/social-content) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE) | Ported | Create, schedule, and optimize social media content for LinkedIn, Twitter/X, and Instagram |

#### Project Management

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| [issue-analysis](skills/issue-analysis) | [n8n-io/n8n](https://github.com/n8n-io/n8n) | ![](https://img.shields.io/github/stars/n8n-io/n8n?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-SUL%201.0-97ca00?style=flat-square)](https://github.com/n8n-io/n8n/blob/master/LICENSE.md) | Adapted | Fetch and analyze issues from any tracker with media gathering, context collection, and effort estimation |
| [project-planner](skills/project-planner) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | ![](https://img.shields.io/github/stars/Shubhamsaboo/awesome-llm-apps?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/Shubhamsaboo/awesome-llm-apps/blob/main/LICENSE) | Ported | Breaks down complex projects into actionable tasks with timelines, dependencies, and milestones |
| [sprint-planner](skills/sprint-planner) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | ![](https://img.shields.io/github/stars/Shubhamsaboo/awesome-llm-apps?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/Shubhamsaboo/awesome-llm-apps/blob/main/LICENSE) | Ported | Agile sprint planning with story estimation, capacity planning, velocity tracking, and sprint goals |

#### Finance & Investment

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| [xlsx](https://github.com/anthropics/skills/tree/main/skills/xlsx) | [anthropics/skills](https://github.com/anthropics/skills) | ![](https://img.shields.io/github/stars/anthropics/skills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](https://github.com/anthropics/skills/blob/main/skills/xlsx/LICENSE.txt) | External | Create, edit, and analyze Excel spreadsheets with formulas, formatting, and financial models |

#### Legal

#### Enterprise Business Solutions

#### Payment

#### E-commerce

#### Business Apps

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| [strategy-advisor](skills/strategy-advisor) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | ![](https://img.shields.io/github/stars/Shubhamsaboo/awesome-llm-apps?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/Shubhamsaboo/awesome-llm-apps/blob/main/LICENSE) | Ported | High-level strategic thinking and business decision guidance for planning and competitive analysis |

### Content & Media

#### Education

#### Generative Art

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| [algorithmic-art](skills/algorithmic-art) | [anthropics/skills](https://github.com/anthropics/skills) | ![](https://img.shields.io/github/stars/anthropics/skills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/anthropics/skills/blob/main/LICENSE) | Adapted | Create algorithmic art using p5.js with seeded randomness and interactive parameter exploration |
| [canvas-design](skills/canvas-design) | [anthropics/skills](https://github.com/anthropics/skills) | ![](https://img.shields.io/github/stars/anthropics/skills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/anthropics/skills/blob/main/LICENSE) | Adapted | Create beautiful visual art in .png and .pdf documents using design philosophy |
| [nano-banana-pro](skills/nano-banana-pro) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Adapted | Generate images using the Banana.dev inference API with configurable prompts |
| [openai-image-gen](skills/openai-image-gen) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | Batch-generate images via OpenAI Images API using GPT Image models or DALL-E |

#### Content Design

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| [theme-factory](skills/theme-factory) | [anthropics/skills](https://github.com/anthropics/skills) | ![](https://img.shields.io/github/stars/anthropics/skills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/anthropics/skills/blob/main/LICENSE) | Ported | Style artifacts with 10 pre-set themes or generate custom themes with colors and fonts |
| [pptx](https://github.com/anthropics/skills/tree/main/skills/pptx) | [anthropics/skills](https://github.com/anthropics/skills) | ![](https://img.shields.io/github/stars/anthropics/skills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](https://github.com/anthropics/skills/blob/main/skills/pptx/LICENSE.txt) | External | Create, edit, and analyze PowerPoint presentations with professional design patterns |
| [content-design](skills/content-design) | [n8n-io/n8n](https://github.com/n8n-io/n8n) | ![](https://img.shields.io/github/stars/n8n-io/n8n?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-SUL%201.0-97ca00?style=flat-square)](https://github.com/n8n-io/n8n/blob/master/LICENSE.md) | Adapted | Product content designer for UI copy -- writing, reviewing, and auditing user-facing text |
| [content-creator](skills/content-creator) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | ![](https://img.shields.io/github/stars/Shubhamsaboo/awesome-llm-apps?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/Shubhamsaboo/awesome-llm-apps/blob/main/LICENSE) | Ported | Creates engaging content for blogs, social media, and marketing materials with audience focus |
| [editor](skills/editor) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | ![](https://img.shields.io/github/stars/Shubhamsaboo/awesome-llm-apps?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/Shubhamsaboo/awesome-llm-apps/blob/main/LICENSE) | Ported | Professional editing and proofreading for clarity, grammar, style, and readability improvements |

#### Media

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| [slack-gif-creator](skills/slack-gif-creator) | [anthropics/skills](https://github.com/anthropics/skills) | ![](https://img.shields.io/github/stars/anthropics/skills?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-Apache%202.0-97ca00?style=flat-square)](https://github.com/anthropics/skills/blob/main/LICENSE) | Ported | Create animated GIFs optimized for Slack with validation tools and animation utilities |
| [gifgrep](skills/gifgrep) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | Search GIF providers (Tenor/Giphy) with CLI/TUI, download results, and extract stills |
| [openai-whisper-api](skills/openai-whisper-api) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Adapted | Transcribe audio files via OpenAI Audio Transcriptions API (Whisper) with language detection |
| [openai-whisper-local](skills/openai-whisper-local) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | Local speech-to-text transcription with the Whisper CLI — fully offline, no API key required |
| [sag-tts](skills/sag-tts) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | ElevenLabs text-to-speech with mac-style say UX via the sag CLI |
| [sherpa-onnx-tts](skills/sherpa-onnx-tts) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Adapted | Local text-to-speech via sherpa-onnx — fully offline with multiple voice models |
| [songsee](skills/songsee) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | Generate spectrograms and feature-panel visualizations from audio files |
| [spotify-player](skills/spotify-player) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | Terminal Spotify playback and search via spogo or spotify_player CLI |
| [video-frames](skills/video-frames) | [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-MIT-97ca00?style=flat-square)](https://github.com/openclaw/openclaw/blob/main/LICENSE) | Ported | Extract frames or short clips from videos using ffmpeg |

## References

| Source | Stars | Description |
|:-------|:-----:|:------------|
| [anthropics/skills](https://github.com/anthropics/skills) | ![](https://img.shields.io/github/stars/anthropics/skills?style=flat-square&logo=github) | Dynamic instruction folders that teach Claude specialized tasks like doc creation and data analysis |
| [anthropics/claude-code-action](https://github.com/anthropics/claude-code-action) | ![](https://img.shields.io/github/stars/anthropics/claude-code-action?style=flat-square&logo=github) | GitHub Action for PR reviews, code changes, and issue triage via @claude mentions |
| [anthropics/claude-code-security-review](https://github.com/anthropics/claude-code-security-review) | ![](https://img.shields.io/github/stars/anthropics/claude-code-security-review?style=flat-square&logo=github) | GitHub Action that detects security vulnerabilities in PR diffs using semantic analysis |
| [anthropics/claude-agent-sdk-python](https://github.com/anthropics/claude-agent-sdk-python) | ![](https://img.shields.io/github/stars/anthropics/claude-agent-sdk-python?style=flat-square&logo=github) | Python SDK to build autonomous agents with file editing, command execution, and tool use |
| [anthropics/claude-agent-sdk-typescript](https://github.com/anthropics/claude-agent-sdk-typescript) | ![](https://img.shields.io/github/stars/anthropics/claude-agent-sdk-typescript?style=flat-square&logo=github) | TypeScript SDK to build autonomous agents with Claude Code's agentic capabilities |
| [anthropics/anthropic-sdk-python](https://github.com/anthropics/anthropic-sdk-python) | ![](https://img.shields.io/github/stars/anthropics/anthropic-sdk-python?style=flat-square&logo=github) | Typed Python client for the Claude REST API with sync and async support |
| [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | ![](https://img.shields.io/github/stars/anthropics/claude-plugins-official?style=flat-square&logo=github) | Official Anthropic-managed directory of Claude Code Plugins |
| [anthropics/claude-cookbooks](https://github.com/anthropics/claude-cookbooks) | ![](https://img.shields.io/github/stars/anthropics/claude-cookbooks?style=flat-square&logo=github) | Copy-paste notebooks for RAG, tool use, vision, classification, and Claude integrations |
| [openclaw/openclaw](https://github.com/openclaw/openclaw) | ![](https://img.shields.io/github/stars/openclaw/openclaw?style=flat-square&logo=github) | AI coding assistant with 50+ CLI skills for productivity, media, smart home, and development |
| [leonardomso/33-js-concepts](https://github.com/leonardomso/33-js-concepts) | ![](https://img.shields.io/github/stars/leonardomso/33-js-concepts?style=flat-square&logo=github) | Curated list of 33 JavaScript concepts with documentation skills for SEO, fact-checking, and resource curation |
| [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | ![](https://img.shields.io/github/stars/coreyhaines31/marketingskills?style=flat-square&logo=github) | Marketing skills for AI agents covering CRO, copywriting, SEO, analytics, and growth engineering |
| [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | ![](https://img.shields.io/github/stars/Shubhamsaboo/awesome-llm-apps?style=flat-square&logo=github) | Collection of awesome LLM apps with RAG, AI agents, and memory tutorials using OpenAI, Anthropic, and Gemini |
| [langgenius/dify](https://github.com/langgenius/dify) | ![](https://img.shields.io/github/stars/langgenius/dify?style=flat-square&logo=github) | Open-source LLM app development platform with frontend skills for React refactoring, code review, and testing |
| [pytorch/executorch](https://github.com/pytorch/executorch) | ![](https://img.shields.io/github/stars/pytorch/executorch?style=flat-square&logo=github) | On-device AI framework with expert-level torch.export guide for model tracing, dynamic shapes, and deployment |
| [vercel/ai](https://github.com/vercel/ai) | ![](https://img.shields.io/github/stars/vercel/ai?style=flat-square&logo=github) | AI SDK for building AI-powered applications with TypeScript, React hooks, streaming, and multi-provider support |
| [vercel/streamdown](https://github.com/vercel/streamdown) | ![](https://img.shields.io/github/stars/vercel/streamdown?style=flat-square&logo=github) | Streaming-optimized React Markdown renderer designed for AI-powered streaming with syntax highlighting, Mermaid diagrams, and math |
| [vercel/chat](https://github.com/vercel/chat) | ![](https://img.shields.io/github/stars/vercel/chat?style=flat-square&logo=github) | Unified TypeScript SDK for building chat bots across Slack, Microsoft Teams, Google Chat, Discord, and more |
| [vercel/flags](https://github.com/vercel/flags) | ![](https://img.shields.io/github/stars/vercel/flags?style=flat-square&logo=github) | Feature flags and A/B testing toolkit for Next.js and SvelteKit with 13+ provider adapters |
| [vercel/ai-elements](https://github.com/vercel/ai-elements) | ![](https://img.shields.io/github/stars/vercel/ai-elements?style=flat-square&logo=github) | AI chat interface component library and custom registry built on shadcn/ui for AI-native applications |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | ![](https://img.shields.io/github/stars/vercel-labs/agent-skills?style=flat-square&logo=github) | Vercel's official collection of agent skills for React, Next.js, React Native performance optimization and web design guidelines |
