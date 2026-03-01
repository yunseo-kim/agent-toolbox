# Catalog Conventions Reference

Detailed rules for catalog skill frontmatter, licensing, authorship, and dates.

## Frontmatter Schema

```yaml
---
name: skill-name                        # required, kebab-case, max 64 chars
description: "What this skill does..."  # required, max 1024 chars
license: SUL-1.0                        # required, SPDX identifier, see License Rules below
metadata:
  domain: devops                        # required, from taxonomy.yaml
  subdomain: ci-cd                      # optional, from taxonomy.yaml
  tags: "github, yaml, automation"      # optional, comma-separated, freeform kebab-case
  frameworks: "nextjs"                  # optional, comma-separated, freeform kebab-case
  author: "Author Name <email>"         # required, see Author Rules below
  lastUpdated: "12026-02-25"            # required, Holocene Era, see Date Rules below
  provenance: ported                    # required, ported | adapted | synthesized | original
---
```

## Field Rules

### name

- Kebab-case, max 64 characters.
- Must match the directory name in `catalog/skills/`.
- When renaming from upstream, use the catalog name everywhere and map the upstream name in `upstream-sources.yaml`.

### description

- Max 1024 characters.
- Describe what the skill does and when to use it.
- Keep from upstream if adequate; refine for clarity if needed.

### license

The `license` field declares the license governing the catalog skill as distributed.

**Default**: `SUL-1.0` (the project-wide license per root `LICENSE.md`).

The project's LICENSE.md includes a carve-out: "Certain third-party components incorporated into the awesome-agent-toolbox Software may retain their original license terms where explicitly indicated by a NOTICE.md file accompanying that component." This carve-out is the mechanism for license overrides.

**Format**: Use [SPDX license identifiers](https://spdx.org/licenses/) when possible (e.g., `MIT`, `Apache-2.0`, `MPL-2.0`). For the project default, use `SUL-1.0`. For synthesized skills with multiple licenses, join identifiers with ` / ` (e.g., `MIT / MPL-2.0`).

#### Decision Tree

```
Is the upstream license permissive?
  (MIT, Apache 2.0, BSD 2/3-Clause, ISC, Unlicense, CC0, WTFPL)
  Yes -> Use default: `SUL-1.0`
         Permissive licenses allow derivative works under different licenses.
         Include attribution in NOTICE.md per upstream requirements.

  No  -> Is it a weak copyleft that permits file-level license isolation?
         (MPL-2.0, LGPL-2.1, LGPL-3.0, EPL-2.0 with secondary license)
         Yes -> OVERRIDE: set license field to the upstream license.
                The specific skill files derived from that source must
                retain the original license. NOTICE.md must state this.

         No  -> Is it a strong copyleft?
                (GPL-2.0, GPL-3.0, AGPL-3.0, SSPL, EUPL, OSL-3.0)
                Yes -> DO NOT PORT. Strong copyleft requires the entire
                       derivative work to adopt the same license, which
                       conflicts with the project-level SUL 1.0.
                       Mark as IGNORED or EXTERNAL only.

                No  -> Is redistribution prohibited?
                       (Proprietary, no-distribute, personal-use-only)
                       Yes -> DO NOT PORT. Mark as IGNORED or EXTERNAL.
                       No  -> Evaluate case-by-case. When in doubt,
                              ask the user before proceeding.
```

#### Summary Table

| Upstream License Type | Examples | license field | Action |
|----------------------|----------|---------------|--------|
| Permissive | MIT, Apache-2.0, BSD, ISC | `SUL-1.0` | Use default; attribution in NOTICE.md |
| Weak copyleft | MPL-2.0, LGPL | Override: e.g., `MPL-2.0` | Skill files retain upstream license |
| Strong copyleft | GPL, AGPL, SSPL | N/A | Do not port (IGNORED or EXTERNAL) |
| Proprietary / No-redistribute | Custom, no-distribute | N/A | Do not port (IGNORED or EXTERNAL) |
| Dual-licensed (permissive option) | MIT OR Apache 2.0 | `SUL-1.0` | Choose the permissive option; use default |
| Synthesized (all permissive) | MIT + Apache 2.0 | `SUL-1.0` | Use default; list all licenses in NOTICE.md |
| Synthesized (mixed with weak copyleft) | MIT + MPL-2.0 | `MIT / MPL-2.0` | Override with multi-license; NOTICE.md details which files |

### metadata.domain / metadata.subdomain

- MUST exist in `catalog/metadata/taxonomy.yaml`.
- Domain is required; subdomain is optional.
- Do not invent freeform values -- validate against taxonomy.yaml before using.

Current domains: `productivity`, `development`, `devops`, `documentation`, `databases`, `blockchain`, `data-ai`, `research`, `business`, `content-media`.

### metadata.tags

- Optional, comma-separated, freeform kebab-case.
- Used for filtering during install: `--tag <tag>`.
- Examples: `"react, nextjs, performance"`, `"github, yaml, automation"`.

### metadata.frameworks

- Optional, comma-separated, freeform kebab-case.
- Used for filtering during install: `--framework <fw>`.
- Examples: `"nextjs"`, `"react, react-native"`.

### metadata.author

**Ported (body unmodified)**:
- Look up the upstream repository for the original author.
- Use their name and email if available from git log or repo metadata.
- Format: `"Author Name <email>"` or `"Author Name"`.

**Adapted/Synthesized (body modified)**:
- Set to the person who made the modifications.
- This is typically `"Yunseo Kim <dev@yunseo.kim>"` for this project.

### metadata.lastUpdated

- Holocene Era format: `YYYYY-MM-DD` (Gregorian year + 10000).
- Example: Gregorian 2026-01-26 -> Holocene `12026-01-26`.

**Ported**: use the upstream's last commit date for that skill directory.
**Adapted/Synthesized**: use the date of catalog modification.

To find the upstream date:
```bash
git log -1 --format='%Y-%m-%d' -- <skill-path>
```
Then add 10000 to the year.

### metadata.provenance

| Value | Body modified? | Sources | Auto-sync eligible? |
|-------|:--------------:|:-------:|:-------------------:|
| `ported` | No | Single | Yes |
| `adapted` | Yes | Single | No (advisory only) |
| `synthesized` | Yes | Multiple | No |
| `original` | N/A | None | N/A |

See `docs/CLASSIFICATION.md` for the decision flowchart and edge cases.
