# Provenance Classification Guide

Every catalog skill requires a `metadata.provenance` field declaring how it relates to its upstream source. The four values -- **ported**, **adapted**, **synthesized**, and **original** -- determine whether the skill is eligible for automated upstream sync and how its attribution works. The most common ambiguity is between ported and adapted; the criteria below draw a clear line.

## Ported

- Body content is essentially unchanged from upstream
- Only frontmatter was added or modified
- NOTICE.md was added for attribution
- The upstream sync script can safely auto-update body content
- MUST be tracked in `upstream-sources.yaml`

## Adapted

- Body content has been meaningfully modified from upstream
- Restructured sections, added or removed content blocks
- Rewritten for different context or audience
- The upstream sync script should NOT auto-update — changes would overwrite local modifications
- SHOULD be tracked in `adapted_skills` section of `upstream-sources.yaml` for advisory monitoring
- Upstream changes are reported as advisories but never auto-applied

## Synthesized

- Created by combining content from multiple source directories
- Each source contributes meaningfully to the final content
- NOTICE.md MUST list all source projects with their respective licenses
- Not eligible for automated upstream sync

## Original

- Created from scratch within this project
- No upstream source to track
- Not eligible for automated upstream sync

## Decision Flowchart

Did you modify the body content beyond frontmatter and/or NOTICE.md?
No → **Ported**
Yes → Did you combine content from multiple source directories?
Yes → **Synthesized**
No → **Adapted**

## Sync Implications

| Provenance  | In upstream-sources.yaml?                 | Auto-sync safe? | Appears in sync report?                 |
| ----------- | ----------------------------------------- | --------------- | --------------------------------------- |
| Ported      | Yes — `skills` section (required)         | Yes             | Yes — changes auto-applied              |
| Adapted     | Yes — `adapted_skills` section (advisory) | No              | Yes — advisory only, never auto-applied |
| Synthesized | No                                        | No              | No                                      |
| Original    | No                                        | N/A             | No                                      |

> **Note:** Adapted skills in `adapted_skills` are monitored for upstream changes but the sync
> script will NEVER write upstream content to local files. When upstream changes are detected,
> the sync report includes a section-heading diff and a link to the upstream commit history
> so maintainers can manually review and integrate changes if desired.
