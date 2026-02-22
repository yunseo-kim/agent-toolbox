# Profile: Next.js

Use this profile for Next.js docs repositories with MDX and app/pages routing docs.

## Source-to-Docs Mapping

Use `../../update-docs/references/CODE-TO-DOCS-MAPPING.md` as the primary map.

## Conventions

Use `../../update-docs/references/DOC-CONVENTIONS.md` as the primary conventions guide.

## Practical Rules

- Start from changed source files, then map to docs targets
- Update shared content at the canonical source file when `source:` frontmatter is used
- Keep TS/JS switcher examples aligned
- Ensure frontmatter and related links remain valid

## Validation

- Run repository lint/format commands used by the Next.js docs repo
- Re-check cross-router content consistency
