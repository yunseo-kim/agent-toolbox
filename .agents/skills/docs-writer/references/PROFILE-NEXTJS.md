# Profile: Next.js

Use this profile for Next.js docs repositories with MDX and app/pages routing docs.

## Workflow: analyze code changes

1. Inspect changed files and isolate documentation-relevant behavior changes.
2. Map changed source files to likely docs targets.
3. Prioritize API surface changes, behavior changes, and new configuration.

Common path mapping hints:

| Source path area | Likely docs area |
| --- | --- |
| `packages/next/src/client/components/` | `docs/01-app/03-api-reference/02-components/` |
| `packages/next/src/server/` | `docs/01-app/03-api-reference/04-functions/` |
| `packages/next/src/build/` | `docs/01-app/03-api-reference/05-config/` |
| `packages/next/src/lib/metadata/` | `docs/01-app/03-api-reference/03-file-conventions/01-metadata/` |

## Workflow: update existing docs

1. Read current page structure and frontmatter before editing.
2. Update changed behavior descriptions and examples.
3. Update props/options/reference tables where applicable.
4. Check whether content is shared between app/pages router documents.

Shared content rule:

- If a pages-router file uses `source:` frontmatter, edit the app-router source page.
- Keep `<AppOnly>` and `<PagesOnly>` blocks consistent with router-specific behavior.

## Workflow: scaffold new docs

- New component docs: `docs/01-app/03-api-reference/02-components/`
- New function docs: `docs/01-app/03-api-reference/04-functions/`
- New config option docs: `docs/01-app/03-api-reference/05-config/`
- New concept/guide docs: `docs/01-app/02-guides/`

Naming rules:

- Use kebab-case filenames.
- Use ordering prefix only where directory conventions require ordering.

## Conventions

### Frontmatter

Required fields:

- `title`
- `description`

Frequently used optional fields:

- `nav_title`
- `source`
- `related`
- `version`

### Code blocks

- Use `filename` on code examples.
- Use TS/JS `switcher` pairs when presenting both variants.
- Keep TypeScript first, JavaScript second.
- Use `highlight` only where line emphasis adds real value.

### MDX components

- Use `<AppOnly>` and `<PagesOnly>` for router-specific content.
- Keep blank lines inside those blocks for markdown parsing stability.
- Use callout/note formatting consistently.

### Writing style

- Keep intros short and task-oriented.
- Prefer minimal working example first, then deeper reference.
- Keep related links current when behavior changes.

## Practical Rules

- Start from changed source files, then map to docs targets
- Update shared content at the canonical source file when `source:` frontmatter is used
- Keep TS/JS switcher examples aligned
- Ensure frontmatter and related links remain valid

## Validation

- Run repository lint/format commands used by the Next.js docs repo
- Re-check cross-router content consistency
- Verify related links/frontmatter paths resolve
