# Profile: Next.js

Use this profile for Next.js docs repositories with MDX and app/pages routing docs.

## Workflow: analyze code changes

1. Inspect changed files and isolate documentation-relevant behavior changes.
2. Map changed source files to likely docs targets.
3. Prioritize API surface changes, behavior changes, and new configuration.

Common mapping hints:

| Source area | Likely docs area |
| --- | --- |
| Routing, layouts, rendering | Routing/layout guides and API reference |
| Server logic, request handling, caching | Server features and runtime behavior docs |
| Build/configuration changes | Configuration and deployment docs |
| Metadata/SEO behavior | Metadata and SEO guides/reference |

## Workflow: update existing docs

1. Read current page structure and frontmatter before editing.
2. Update changed behavior descriptions and examples.
3. Update props/options/reference tables where applicable.
4. Check whether content is shared between app/pages router documents.

Shared content rule:

- If your docs system supports shared-source pages, edit the canonical source first.
- Keep any app-router/pages-router variant content consistent with current behavior.

## Workflow: scaffold new docs

- New component docs: component/API reference section
- New function docs: function/hook API reference section
- New config option docs: configuration reference section
- New concept/guide docs: guides/tutorials section

Naming rules:

- Use kebab-case filenames.
- Use ordering prefix only where directory conventions require ordering.

## Conventions

### Frontmatter

Required fields:

- `title`
- `description`

Frequently used optional fields:

- `nav_title` (if your docs system supports it)
- `source` (if your docs system supports shared-source content)
- `related`
- `version`

### Code blocks

- Use `filename` on code examples.
- Use TS/JS paired examples when your docs system supports variant switchers.
- Keep TypeScript first, JavaScript second.
- Use `highlight` only where line emphasis adds real value.

### MDX and conditional content

- If your docs system supports conditional blocks for router variants, use them consistently.
- Keep markdown structure stable inside conditional blocks.
- Use callout/note formatting consistently.

### Writing style

- Keep intros short and task-oriented.
- Prefer minimal working example first, then deeper reference.
- Keep related links current when behavior changes.

## Practical Rules

- Start from changed source files, then map to docs targets
- Update shared content at the canonical source file when `source:` frontmatter is used
- Keep TS/JS paired examples aligned
- Ensure frontmatter and related links remain valid

## Validation

- Run repository lint/format commands used by your docs repo
- Re-check cross-router content consistency
- Verify related links/frontmatter paths resolve
