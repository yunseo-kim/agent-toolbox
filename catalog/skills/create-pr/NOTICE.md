# License Notice

This skill is derived from [n8n-io/n8n](https://github.com/n8n-io/n8n), licensed under the
[Sustainable Use License 1.0](https://github.com/n8n-io/n8n/blob/master/LICENSE.md).

## Modifications

This file has been adapted from the original n8n `.claude/skills/create-pr/SKILL.md` for use
in the awesome-agent-toolbox catalog. Changes include:

- Added catalog frontmatter metadata (domain, subdomain, tags)
- Removed n8n-specific scopes (API, benchmark, core, editor, * Node) and replaced with
  generic scope guidance
- Removed n8n-specific PR body template (Linear ticket links, n8n-docs references,
  release/backport label) and replaced with universal PR body structure
- Removed n8n-specific `(no-changelog)` suffix convention
- Generalized validation regex to allow broader scope characters (e.g. `/`, `-`)
- Replaced n8n-specific examples with generic project examples
- Changed default branch reference from `master` to `main`
- Added PR template auto-detection step
- Added `revert` to the types table

## Original License Terms

The Sustainable Use License grants a non-exclusive, royalty-free, worldwide license to use, copy,
distribute, and prepare derivative works of the software, subject to these limitations:

- You may use or modify the software only for your own internal business purposes or for
  non-commercial or personal use.
- You may distribute the software or provide it to others only if you do so free of charge for
  non-commercial purposes.
- You may not alter, remove, or obscure any licensing, copyright, or other notices of the licensor.

For the full license text, see: https://github.com/n8n-io/n8n/blob/master/LICENSE.md
