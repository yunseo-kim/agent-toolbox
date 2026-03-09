# DEV TOOLING SKILLS

**This directory is development tooling for contributors, NOT distributable project content.**

Skills here help contributors work on this repo. Distributable skills live in `catalog/skills/`.

## SYMLINK STRUCTURE

`.agents/skills/` is the single source. Other tool directories are symlinks:

```
.agents/skills/  (source)
  -> .agent/skills/
  -> .claude/skills/
  -> .cursor/skills/
  -> .windsurf/skills/
```

Adding/removing a skill in `.agents/skills/` requires updating all symlinked directories.

## SKILL INVENTORY

| Skill | Type | Has Scripts | Has References | Purpose |
|-------|------|:-----------:|:--------------:|---------|
| **skill-creator** | Meta | init_skill.py, package_skill.py, quick_validate.py | output-patterns.md, workflows.md | Skill authoring guide + scaffolding tools |
| **mcp-builder** | Meta | connections.py, evaluation.py | mcp_best_practices.md, node/python_mcp_server.md | MCP server development guide |
| **git-master** | Workflow | -- | -- | Atomic commits, rebase, history search |
| **docs-writer** | Workflow | -- | CORE-CHECKLIST.md, PROFILE-*.md, TEMPLATES.md | Profile-based documentation workflow |
| **create-pr** | Workflow | -- | -- | Conventional Commits PR creation |
| **github-triage** | Workflow | gh_fetch.py | -- | GitHub issue/PR triage |
| **catalog-porter** | Workflow | -- | catalog-conventions.md, notice-templates.md, upstream-sources.md, readme-listing.md | Upstream skill analysis, classification, and porting |
| **docs-changelog** | Workflow | -- | highlights_examples.md, index/latest/preview_template.md | Changelog generation |
| **doc-coauthoring** | Workflow | -- | -- | Collaborative drafting |
| **dependency-upgrade** | Reference | -- | -- | Dependency management patterns |
| **github-actions-templates** | Reference | -- | -- | GitHub Actions patterns |
| **gitlab-ci-patterns** | Reference | -- | -- | GitLab CI/CD patterns |
| **javascript-testing-patterns** | Reference | -- | -- | JS/TS testing patterns |
| **secrets-management** | Reference | -- | -- | Secrets handling patterns |

## DEV FRONTMATTER SCHEMA

Dev skills use a simpler frontmatter than catalog skills (no `domain`/`subdomain`/`tags`/`frameworks`):

```yaml
---
name: skill-name              # required, kebab-case, max 64 chars
description: "..."            # required, max 1024 chars
license: "See LICENSE.txt"    # optional
---
```

## COMMANDS

```bash
# Scaffold new skill
python3 .agents/skills/skill-creator/scripts/init_skill.py <name> --path .agents/skills/ [--resources scripts,references,assets]

# Validate skill structure
python3 .agents/skills/skill-creator/scripts/quick_validate.py <path/to/skill>

# Package skill as .skill file
python3 .agents/skills/skill-creator/scripts/package_skill.py <path/to/skill> [output-dir]
```

## ANTI-PATTERNS

- Do not add catalog-specific frontmatter fields (`domain`, `subdomain`, `tags`, `frameworks`) to dev skills.
- Do not create README.md, CHANGELOG.md, or auxiliary docs inside skills -- only SKILL.md + resources.
- Do not duplicate skill content here and in `catalog/skills/`. Catalog is the distributable copy.
- Do not break symlinks. After adding/removing a skill, verify all 4 symlinked directories match.
