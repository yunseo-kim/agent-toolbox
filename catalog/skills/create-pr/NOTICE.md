# Attribution Notice

This skill incorporates material derived from [n8n-io/n8n](https://github.com/n8n-io/n8n),
originally released under the [Sustainable Use License 1.0](https://github.com/n8n-io/n8n/blob/master/LICENSE.md).
This adapted version is governed by the [Sustainable Use License](../../LICENSE.md) at the
root of this repository. The upstream license terms are summarized below for attribution.

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

## Upstream License

The original work was released under the Sustainable Use License 1.0, which grants a
non-exclusive, royalty-free, worldwide license to use, copy, distribute, and prepare
derivative works of the software, subject to certain limitations including non-commercial
distribution and preservation of notices.

For the full upstream license text, see: https://github.com/n8n-io/n8n/blob/master/LICENSE.md
