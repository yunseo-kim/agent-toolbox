# TYPESCRIPT TOOLCHAIN

Bun-first TypeScript codebase powering catalog validation, target generation, and selective installation. All modules use Zod schemas for runtime validation and path aliases for clean imports.

## STRUCTURE

```
src/
├── cli/            # Command handlers (validate, build-index, build-target, install)
├── catalog/        # Skill scanning, frontmatter parsing, validation, index building
├── generators/     # Target-specific artifact emitters (5 targets)
│   ├── claude-code/
│   ├── opencode/
│   ├── cursor/
│   ├── codex/
│   └── gemini/
├── install/        # Selective install engine with AND-composed filters
├── mappers/        # Tool/event/model mapping layers (scaffolded)
├── schemas/        # Zod schemas — single source of type truth
└── index.ts        # Re-exports all modules
```

## MODULE RESPONSIBILITIES

| Module        | Entry      | Purpose                                                                                   |
| ------------- | ---------- | ----------------------------------------------------------------------------------------- |
| `cli/`        | `main.ts`  | Dispatches `validate`, `build`, `build-index`, `install` commands                         |
| `catalog/`    | `index.ts` | `scanSkills()` → `parseFrontmatter()` → `validateCatalog()` → `buildIndex()`              |
| `schemas/`    | `index.ts` | Zod schemas: `SkillFrontmatter`, `SkillIndex`, `InstallFilters`, `TargetTool`             |
| `generators/` | `index.ts` | Each target implements `TargetGenerator` interface with `generate()` method               |
| `install/`    | `index.ts` | `filterSkills()` applies AND-composed domain/subdomain/tag/framework/preset/skill filters |
| `mappers/`    | `index.ts` | Placeholder for tool-semantic mapping (not yet populated)                                 |

## KEY TYPES

```typescript
// src/schemas/common.ts
SkillName; // kebab-case regex, max 64 chars
HoloceneDate; // /^1\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/
Provenance; // "ported" | "adapted" | "synthesized" | "original"
TargetTool; // "claude-code" | "opencode" | "cursor" | "codex" | "gemini"
CommaSeparatedList; // transforms "a, b, c" → ["a", "b", "c"]

// src/schemas/catalog.ts
SkillFrontmatter; // { name, description, license, metadata: SkillMetadata }
ParsedSkill; // frontmatter + body + dirName + filePath + hasNotice/References/Scripts/Assets
SkillIndex; // { version: 2, generatedAt, skills: SkillIndexEntry[], tags: Record, frameworks: Record }

// src/generators/types.ts
GeneratorOptions; // { skills, outputDir, catalogDir, version }
GeneratorResult; // { target, skillCount, outputDir, artifacts, warnings }
TargetGenerator; // interface: { target, generate(options) }
```

## PATH ALIASES

Defined in `tsconfig.json`, used project-wide:

| Alias           | Maps to              |
| --------------- | -------------------- |
| `@/*`           | `./src/*`            |
| `@schemas/*`    | `./src/schemas/*`    |
| `@catalog/*`    | `./src/catalog/*`    |
| `@generators/*` | `./src/generators/*` |
| `@mappers/*`    | `./src/mappers/*`    |
| `@install/*`    | `./src/install/*`    |

## DATA FLOW

```
catalog/skills/*/SKILL.md
  → scanner.ts (reads dirs, parses YAML frontmatter)
  → SkillFrontmatter schema (Zod validation)
  → validator.ts (cross-references taxonomy.yaml)
  → index-builder.ts (aggregates to skill-index.json + skill-index.toon)
  → generators/*/generator.ts (copies skills + emits target config)
  → dist/targets/*/
```

## GENERATOR PATTERN

All 5 generators follow the same interface. To add a new target:

1. Create `src/generators/<target>/generator.ts` implementing `TargetGenerator`
2. Create `src/generators/<target>/index.ts` re-exporting the generator
3. Register in `src/generators/index.ts`
4. Add `<target>` to `TargetTool` enum in `src/schemas/common.ts`
5. Add build script in `package.json`

Each generator receives `GeneratorOptions` (parsed skills + output dir) and returns `GeneratorResult` (artifact list + warnings). Shared copy logic lives in `generators/copy-utils.ts`.

## WHERE TO LOOK

| Task                    | File                                             |
| ----------------------- | ------------------------------------------------ |
| Add CLI command         | `cli/main.ts` (routing) + new `cli/<command>.ts` |
| Add schema field        | `schemas/catalog.ts` or `schemas/common.ts`      |
| Fix frontmatter parsing | `catalog/frontmatter.ts`                         |
| Fix validation logic    | `catalog/validator.ts`                           |
| Add install filter      | `install/filter.ts`                              |
| Add generator target    | `generators/<target>/generator.ts`               |
| Change catalog scanning | `catalog/scanner.ts`                             |

## CONVENTIONS

- All imports use `.js` extension (Bun ESM convention).
- Schemas are the single source of type truth — types are inferred via `z.infer<>`.
- No linters/formatters configured — follow TypeScript strict mode and existing patterns.
- `index.ts` files in each module re-export public API only.
- Generator output goes to `dist/targets/<target>/` — never hand-edit.

## ANTI-PATTERNS

- Do not suppress type errors (`as any`, `@ts-ignore`).
- Do not hand-edit `skill-index.json` or `skill-index.toon` — they are generated by `build-index`.
- Do not import across modules without going through `index.ts` re-exports.
- Do not add runtime dependencies without justification (current: `yaml`, `zod`, `@toon-format/toon`).
