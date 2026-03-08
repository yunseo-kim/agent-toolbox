# TEST SUITE

Bun-native test framework (`bun:test`). No external test libraries. Preload config in `bunfig.toml` → `tests/setup.ts`.

## STRUCTURE

```
tests/
├── setup.ts            # Preloaded before all tests (bunfig.toml)
├── unit/               # Schema, taxonomy, frontmatter, scanner, filter tests
│   ├── schemas.test.ts
│   ├── taxonomy.test.ts
│   ├── frontmatter.test.ts
│   ├── scanner.test.ts
│   ├── index-builder.test.ts
│   └── filter.test.ts
├── integration/        # End-to-end pipeline tests
│   ├── generators.test.ts
│   └── install.test.ts
└── matrix/             # Cross-target verification (planned)
```

## COMMANDS

```bash
bun test                    # All tests
bun test tests/unit/        # Unit only
bun test tests/integration/ # Integration only
bun test tests/matrix/      # Matrix only (when populated)
bun run typecheck           # TypeScript checking (not test, but CI gate)
```

## TEST COVERAGE MAP

| Test File               | Module Under Test              | Key Assertions                                                                                                  |
| ----------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `schemas.test.ts`       | `src/schemas/*`                | Zod schema validation: valid/invalid inputs for SkillName, HoloceneDate, Provenance, TargetTool, InstallFilters |
| `taxonomy.test.ts`      | `src/catalog/taxonomy.ts`      | Domain/subdomain loading from YAML, controlled vocabulary enforcement                                           |
| `frontmatter.test.ts`   | `src/catalog/frontmatter.ts`   | YAML frontmatter parsing, edge cases (empty body, missing frontmatter, malformed YAML)                          |
| `scanner.test.ts`       | `src/catalog/scanner.ts`       | Catalog skill scanning, directory traversal, ParsedSkill construction                                           |
| `index-builder.test.ts` | `src/catalog/index-builder.ts` | SkillIndex generation, entry aggregation, TOON roundtrip with tab delimiter                                     |
| `filter.test.ts`        | `src/install/filter.ts`        | AND-composed filter logic: domain, subdomain, tag, framework, preset, skill name                                |
| `generators.test.ts`    | `src/generators/*/`            | Target artifact creation, directory structure, file presence per target                                         |
| `install.test.ts`       | `src/install/`                 | Full install pipeline: dry-run, filter application, error handling                                              |

## CONVENTIONS

- Integration tests use `dist/test-output/` as sandbox — cleaned before/after each test.
- Unit tests mock filesystem via in-memory fixtures, not real catalog reads.
- Test file names mirror the module they test: `scanner.test.ts` → `src/catalog/scanner.ts`.
- All assertions use Bun's built-in `expect()` — no chai, jest, or vitest.
- Preload setup (`setup.ts`) runs before every test file — use for global config only.

## ADDING TESTS

1. **Unit test**: Create `tests/unit/<module>.test.ts`, import from `@<alias>/*`
2. **Integration test**: Create `tests/integration/<feature>.test.ts`, use `dist/test-output/` for artifacts
3. **Matrix test**: Create `tests/matrix/<target>.test.ts` for cross-target verification

## ANTI-PATTERNS

- Do not read the real `catalog/` directory in unit tests — use fixtures.
- Do not leave test artifacts in `dist/targets/` — always use `dist/test-output/`.
- Do not delete failing tests to make CI pass.
- Do not skip tests without a tracking issue.
