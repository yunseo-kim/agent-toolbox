# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-19
**Commit:** 9eb7f3e
**Branch:** main

## OVERVIEW

This repository started as a curated skills collection and is evolving into a cross-tool distribution project targeting **OpenCode, Claude Code, Gemini CLI, and Cursor**. The architecture direction remains: **neutral catalog as source-of-truth + generated tool targets + installer-driven deployment**.

## CURRENT STATE

- No distributable project content exists yet. The planned `catalog/` directory (neutral source-of-truth for skills, agents, commands, hooks, etc.) has not been created.
- `.agents/skills/`, `.agent/skills/`, `.claude/skills/`, `.cursor/skills/`, `.windsurf/skills/` are **development tooling only** — skills used by contributors while working on this repo (e.g. `git-master`, `create-pr`, `skill-creator`, `mcp-builder`). They are **not** project content or distribution artifacts.
- Planned architecture directories (`catalog/`, `src/`, `templates/`, `dist/`, `tests/`) are not yet materialized in this branch.

## TARGETS

- **Primary target set**: `opencode`, `claude`, `gemini`, `cursor`
- **Planned/generated targets**: `dist/targets/opencode`, `dist/targets/claude`, `dist/targets/gemini`, `dist/targets/cursor`

## TARGET ARCHITECTURE (IN PROGRESS)

```
awesome-agent-toolbox/
├── catalog/                          # Neutral source-of-truth
│   ├── skills/
│   ├── agents/
│   ├── commands/
│   ├── hooks/
│   ├── mcp/
│   ├── lsp/
│   └── metadata/
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
| Active skill source tree | `.agents/skills/` | Dev tooling source; symlinked to `.agent/`, `.claude/`, `.cursor/`, `.windsurf/` |

> **Note:** The `.agents/skills/` paths above are **development tools** for contributors, not project content.
> They will remain as dev tooling even after `catalog/` is populated with distributable content.

## DISTRIBUTION MODEL

- **Source-of-truth**: only `catalog/` (not yet created; `.agents/skills/` is dev tooling, not content).
- **Generated artifacts**: only `dist/targets/*` and `dist/marketplace/*`; avoid manual edits.
- **Bun first**: build/test/release tooling uses Bun runtime and Bun scripts.
- **npm compatibility**: publish CLI binaries and package artifacts so users can install via `npm`/`npx` as fallback.
- **Install UX (target)**: single entrypoint with `install --target <gemini|opencode|claude|cursor>`.

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

## CONVENTIONS

- Skill names: lowercase kebab-case, concise, trigger-oriented.
- `SKILL.md` frontmatter: required `name` + `description`.
- Progressive disclosure: short core instructions in `SKILL.md`, deep detail in references.
- Keep files ASCII unless existing file requires Unicode.
- Keep generated artifacts clearly marked and reproducible.

## ANTI-PATTERNS (THIS PROJECT)

- Do not hand-edit generated files in `dist/`.
- Do not duplicate full skill content per target unless strictly required.
- Do not claim feature parity without target-specific test evidence.
- Do not rely on one shell behavior for installer logic (must branch by OS/runtime).
- Do not store secrets or machine-local credentials in catalog/templates.
- Do not claim Gemini command/hook parity with Claude/OpenCode/Cursor without explicit adapter tests.

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

# Generate tool artifacts
bun run build:gemini
bun run build:claude
bun run build:opencode
bun run build:cursor
bun run build:all

# Install to target environment
bun run install --target gemini
bun run install --target claude
bun run install --target opencode
bun run install --target cursor

# npm fallback
npx awesome-agent-toolbox install --target gemini
```

## NOTES

- Compatibility with non-Claude tools is prioritized over deep Claude-only marketplace optimization.
- Marketplace artifacts are Claude-specific catalog outputs; keep them separate from runtime target artifacts.
- Gemini CLI adapter should be extension-manifest-first (`gemini-extension.json`) and MCP-centric, with command/hook/context mapping handled at adapter layer.
- Architecture borrows operational strengths from reference projects (OS-aware install docs, mapping guidance, target test suites) without inheriting manual-drift weaknesses.
