---
name: catalog-porter
description: "Analyze upstream GitHub repos containing agent skills, classify each skill (ported/adapted/synthesized/external/ignored), and port them to catalog/skills/ with proper frontmatter, NOTICE.md attribution, upstream-sources registration, and catalog README/AGENTS.md updates. Use when the user provides a GitHub repo URL to analyze and port skills from, or asks to 'port skills', 'analyze repo', 'add upstream source', or 'catalog porter'."
metadata:
  internal: true
---

# Catalog Porter

Port upstream agent skills from GitHub repos into the `catalog/skills/` directory with full metadata, attribution, and documentation updates.

## Architecture

```
Input:  GitHub repo URL containing agent skills
Output: catalog/skills/<name>/ entries + metadata updates + validation
```

| Rule | Value |
|------|-------|
| Skill body integrity | Ported = untouched body; Adapted = meaningful edits |
| Frontmatter | Always replaced with catalog schema |
| NOTICE.md | Required for every catalog skill |
| Directory structure | Flat in catalog/skills/ -- no domain nesting |
| Upstream tracking | All ported/adapted skills registered in upstream-sources.yaml |

---

## Phase 1: Analyze Upstream

Goal: understand the source repository structure and identify all skills.

### Steps

1. Accept the GitHub repo URL from the user.
2. Browse or clone the repo to a temp directory:
   ```bash
   git clone --depth 1 <url> /tmp/<repo-name>
   ```
3. Identify the skill discovery root -- where SKILL.md files live:
   ```bash
   find /tmp/<repo-name> -name "SKILL.md" -type f
   ```
4. List all skill directories found.
5. Check the repo's license:
   - Look for LICENSE, LICENSE.md, LICENSE.txt in repo root.
   - Check README.md for license mentions.
   - Check individual SKILL.md frontmatter for `license:` fields.
   - If no license file exists, note this -- use README/frontmatter declarations.
6. Check if this repo is already in `catalog/metadata/upstream-sources.yaml`.
   - If yes: identify which skills are already ported/adapted/ignored.
   - New skills = those not yet in any section (skills, adapted_skills, ignored).
7. For each skill directory, read the SKILL.md to understand what it does.

### Output

Present a discovery summary:

```
## Upstream Analysis: <org>/<repo>

License: <license-name> (source: LICENSE.md / README / frontmatter)
Discovery root: <path>/
Skills found: <N>

| # | Directory | Has SKILL.md | Status |
|---|-----------|:------------:|--------|
| 1 | skill-a   | Yes          | New    |
| 2 | skill-b   | Yes          | Already ported |
| 3 | skill-c   | Yes          | New    |
| 4 | skill-d   | No           | Skip (no SKILL.md) |
```

---

## Phase 2: Classify Each Skill

Goal: determine the provenance and viability of each new skill.

### Decision Matrix

For each NEW skill (not already in catalog), evaluate:

```
Is the skill tool-specific and not portable?
  (e.g., hardcoded /mnt/skills/ paths, proprietary endpoints, Claude-only APIs)
  Yes -> IGNORED (with reason)

Is the upstream license compatible with this project?
  Strong copyleft (GPL, AGPL, SSPL) -> IGNORED or EXTERNAL (cannot distribute under SUL 1.0)
  Proprietary / no-redistribute     -> IGNORED or EXTERNAL (list in README only)
  Weak copyleft (MPL-2.0, LGPL)     -> Portable, but skill retains upstream license
  Permissive (MIT, Apache 2.0, BSD) -> Portable under project default license
  See references/catalog-conventions.md > license for the full decision tree.

Will you modify the body content beyond frontmatter + NOTICE.md?
  No  -> PORTED
  Yes -> Are you combining content from multiple upstream sources?
    Yes -> SYNTHESIZED
    No  -> ADAPTED
```

For detailed classification criteria, see `docs/CLASSIFICATION.md`.

### Approval Gate

Present the classification table to the user BEFORE proceeding:

```
## Classification Plan

| Skill | Classification | Domain/Subdomain | Reason |
|-------|---------------|------------------|--------|
| skill-a | Ported | development/frontend | Body unchanged |
| skill-b | Adapted | devops/testing | Added test patterns |
| skill-c | Ignored | -- | Claude-specific paths |
| skill-d | External | -- | Proprietary license |

Proceed with porting [N] skills? (Y/N)
```

Wait for user approval. Adjust classifications if the user requests changes.

---

## Phase 3: Port to Catalog

Goal: create catalog entries for each approved skill.

Load `references/catalog-conventions.md` for the full frontmatter schema.
Load `references/notice-templates.md` for NOTICE.md templates.

### For Each Approved Skill

1. **Create directory**: `catalog/skills/<skill-name>/`
   - Use kebab-case for the directory name.
   - If renaming from upstream, note the mapping for upstream-sources.yaml.

2. **Copy skill files**:
   - For PORTED: copy ALL files preserving upstream directory structure.
     Do NOT rename directories (keep `rules/`, `AGENTS.md`, `README.md`, `metadata.json` as-is).
   - For ADAPTED: copy files, then make modifications. Document all changes.

3. **Replace SKILL.md frontmatter** with catalog schema:
   ```yaml
   ---
   name: <skill-name>
   description: "<description from upstream, refined if needed>"
   license: <see license rules in references/catalog-conventions.md>
   metadata:
     domain: <from taxonomy.yaml>
     subdomain: <from taxonomy.yaml, optional>
     tags: "<comma-separated>"
     frameworks: "<comma-separated, optional>"
     author: "<see author rules in references/catalog-conventions.md>"
     lastUpdated: "<Holocene Era YYYYY-MM-DD>"
     provenance: <ported|adapted|synthesized>
   ---
   ```
   - Domain/subdomain MUST exist in `catalog/metadata/taxonomy.yaml`. Read it to validate.
   - Author: use upstream author if body is unmodified (ported); use modifier if body was changed.
   - lastUpdated: convert upstream's last commit date to Holocene Era (Gregorian year + 10000).
   - License: default `Sustainable Use License 1.0` for permissive upstreams (MIT, Apache, BSD).
     Override only for weak-copyleft upstreams (MPL-2.0, LGPL) that require file-level license retention.
     See `references/catalog-conventions.md` > license for the full decision tree.

4. **Create NOTICE.md** using the appropriate template from `references/notice-templates.md`:
   - Ported: single source, minimal modifications (frontmatter + NOTICE.md only).
   - Adapted: single source, list all body modifications.
   - Synthesized: multiple sources, include all license texts.

5. **Verify directory contents**: ensure SKILL.md and NOTICE.md exist. Confirm no extraneous files were added.

---

## Phase 4: Register and Update Docs

Goal: update all tracking and documentation files.

Load `references/upstream-sources.md` for the YAML schema.
Load `references/readme-listing.md` for badge and table formats.

### 4a. Update upstream-sources.yaml

File: `catalog/metadata/upstream-sources.yaml`

- If this is a new upstream source, add a full source block:
  ```yaml
  sources:
    org/repo:
      ref: <default-branch>
      discover:
        root: <skill-discovery-root>/
        skill_file: SKILL.md
      skills:
        <catalog-name>: { upstream_dir: <upstream-dir> }
      adapted_skills:
        <catalog-name>: { upstream_dir: <upstream-dir> }
      ignored:
        - <dir>    # <reason>
  ```
- If the source already exists, add new entries to the appropriate section.
- Place ported skills in `skills:`, adapted in `adapted_skills:`, excluded in `ignored:`.
- When catalog name differs from upstream directory name, the mapping records both.

### 4b. Update catalog/AGENTS.md

File: `catalog/AGENTS.md` (compact skill list in the `CURRENT SKILLS` section)

- Format: `<skill-name> | <domain/subdomain> | <provenance> (<source-shortname>)`
- Insert in the correct domain group, maintaining alphabetical order within the group.
- Update the total skill count comment at the top of the list.

### 4c. Update catalog/README.md

File: `catalog/README.md` (human-readable tables with badges)

- Add row(s) to the appropriate domain/subdomain table section.
- Badge format: see `references/readme-listing.md` for exact markdown patterns.
- If a new subdomain section is needed, create it following existing header patterns.
- If this is a new upstream source, add an entry to the References table at the bottom.

---

## Phase 5: Validate

Goal: ensure all changes pass project validation.

### Validation Sequence

```bash
# 1. Rebuild catalog index
bun run build:index

# 2. Validate catalog (schema + taxonomy + frontmatter)
bun run validate

# 3. Type check
bun run typecheck

# 4. Run tests
bun test
```

### Common Fixes

| Issue | Fix |
|-------|-----|
| Test count assertion mismatch | Update expected count in `tests/unit/scanner.test.ts` and `tests/unit/index-builder.test.ts` |
| Unknown domain/subdomain | Add to `catalog/metadata/taxonomy.yaml` or fix the frontmatter |
| NOTICE.md missing | Create using templates in `references/notice-templates.md` |
| catalog-index.json stale | Rerun `bun run build:index` |

### Completion Checklist

- [ ] All `bun run validate` checks pass (N valid, 0 invalid)
- [ ] `bun run typecheck` is clean
- [ ] `bun test` passes (all tests, 0 failures)
- [ ] Every new skill has SKILL.md + NOTICE.md
- [ ] upstream-sources.yaml updated
- [ ] catalog/AGENTS.md compact list updated with correct count
- [ ] catalog/README.md tables updated with badges
- [ ] Ported skill bodies are untouched from upstream

---

## Anti-Patterns

| Violation | Severity |
|-----------|----------|
| Modifying ported skill body content unnecessarily | CRITICAL |
| Renaming upstream directories (rules/ -> references/) in ported skills | CRITICAL |
| Using freeform domain/subdomain not in taxonomy.yaml | CRITICAL |
| Missing NOTICE.md on any catalog skill | CRITICAL |
| Hand-editing catalog-index.json | HIGH |
| Nesting skills in domain subdirectories | HIGH |
| Omitting ignored skills from upstream-sources.yaml | HIGH |
| Using wrong provenance classification | HIGH |
| Forgetting to update test count assertions | MEDIUM |
| Not presenting classification table to user before porting | MEDIUM |

---

## Quick Start

When invoked with a GitHub URL:

1. **Analyze**: Clone/browse repo, find all SKILL.md files, check license
2. **Classify**: Build decision matrix for each skill, present to user for approval
3. **Port**: Copy files, replace frontmatter, create NOTICE.md for each approved skill
4. **Register**: Update upstream-sources.yaml, catalog/AGENTS.md, catalog/README.md
5. **Validate**: `bun run build:index` -> `bun run validate` -> `bun run typecheck` -> `bun test`

Clean up temp files when done:
```bash
rm -rf /tmp/<repo-name>
```
