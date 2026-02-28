# upstream-sources.yaml Reference

Schema and rules for registering upstream repos in `catalog/metadata/upstream-sources.yaml`.

## Schema

```yaml
sources:
  <org>/<repo>:                          # GitHub org/repo identifier
    ref: <branch>                         # Default branch to track (main, master, etc.)
    discover:
      root: <path>/                       # Directory prefix where skills live in upstream
      skill_file: SKILL.md               # Always SKILL.md
    skills:                               # Ported skills (eligible for auto-sync)
      <catalog-name>: { upstream_dir: <upstream-dir-name> }
    adapted_skills:                       # Adapted skills (advisory monitoring only)
      <catalog-name>: { upstream_dir: <upstream-dir-name> }
    ignored:                              # Skills deliberately NOT ported
      - <dir-name>    # <reason>
```

## Section Rules

### `skills:` (Ported)

- Body content is essentially unchanged from upstream.
- Eligible for automated body sync by the upstream-sync GitHub Action.
- When the upstream updates, the sync script overwrites the body content automatically.
- Changes limited to frontmatter and NOTICE.md do not affect ported status.

### `adapted_skills:` (Adapted)

- Body content was meaningfully modified.
- Monitored for upstream changes but NEVER auto-updated.
- Sync reports include section-heading diffs and links to upstream commits.
- Maintainers manually review and integrate changes if desired.

Supports two path formats:
- `upstream_dir: <dir>` -- standard path under `discover.root + dir + skill_file`
- `upstream_path: <full-path>` -- explicit full path from repo root for non-standard locations

### `ignored:` (Excluded)

- Upstream skill directories deliberately NOT ported.
- Listed to suppress "new skill detected" alerts in sync reports.
- Always include a comment explaining why (e.g., `# Proprietary license`, `# Claude-specific`).

## Naming Rules

- `catalog-name` is the directory name in `catalog/skills/`.
- `upstream_dir` is the directory name in the upstream repo under `discover.root`.
- When these differ (skill was renamed during porting), the mapping records both.
- Example: `issue-analysis: { upstream_dir: linear-issue }  # renamed`

## New Source Block

When adding a completely new upstream repository:

1. Determine the default branch: `git ls-remote --symref <url> HEAD`
2. Find where skills live: look for SKILL.md files in the repo.
3. Add the full source block with all sections.
4. List ALL skills found -- ported in `skills:`, adapted in `adapted_skills:`, excluded in `ignored:`.

## Adding to Existing Source

When an existing source has new skills:

1. Check which skills are already registered (in any section).
2. Add new entries to the appropriate section.
3. Keep entries alphabetically sorted within each section.

## Example

```yaml
  vercel-labs/agent-skills:
    ref: main
    discover:
      root: skills/
      skill_file: SKILL.md
    skills:
      composition-patterns:    { upstream_dir: composition-patterns }
      react-best-practices:    { upstream_dir: react-best-practices }
      react-native-skills:     { upstream_dir: react-native-skills }
      web-design-guidelines:   { upstream_dir: web-design-guidelines }
    ignored:
      - vercel-deploy-claimable    # Claude-specific deployment tool
```
