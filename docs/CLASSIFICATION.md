# Provenance Classification Guide

Every catalog skill requires a `metadata.provenance` field declaring how it relates to its upstream source. The four values -- **ported**, **adapted**, **synthesized**, and **original** -- determine whether the skill is eligible for automated upstream sync and how its attribution works. The most common ambiguity is between ported and adapted; the criteria below draw a clear line.

## Ported

- Body content is essentially unchanged from upstream
- Only frontmatter was added or modified
- NOTICE.md was added for attribution
- Minor formatting adjustments (whitespace, line breaks) are acceptable
- The upstream sync script can safely auto-update body content
- MUST be tracked in `upstream-sources.yaml`

## Adapted

- Body content has been meaningfully modified from upstream
- Restructured sections, added or removed content blocks
- Combined with content from other sources (if only one primary source)
- Rewritten for different context or audience
- The upstream sync script should NOT auto-update — changes would overwrite local modifications
- Must NOT be tracked in `upstream-sources.yaml`

## Synthesized

- Created by combining content from multiple upstream sources
- Each source contributes meaningfully to the final content
- NOTICE.md MUST list all source projects with their respective licenses
- Not eligible for automated upstream sync

## Original

- Created from scratch within this project
- No upstream source to track
- Not eligible for automated upstream sync

## Decision Flowchart

Did you modify the body content beyond frontmatter, NOTICE.md, and minor formatting?
  No  → **Ported**
  Yes → Did you combine content from multiple upstream sources?
    Yes → **Synthesized**
    No  → **Adapted**

## Edge Cases

| Scenario | Classification | Reasoning |
|----------|---------------|-----------|
| Removing project-specific paths/conventions while keeping structure | Ported | Minimal change for portability |
| Adding a new section or reference not in upstream | Adapted | Structural modification |
| Reordering existing sections | Adapted | Meaningful restructure |
| Fixing typos or broken links | Ported | Formatting-level adjustment |
| Merging two upstream skills into one | Synthesized | Multiple sources combined |
| Adding inline code examples not in upstream | Adapted | Content addition |

## Sync Implications

| Provenance | In upstream-sources.yaml? | Auto-sync safe? | Appears in sync report? |
|------------|---------------------------|-----------------|------------------------|
| Ported     | Yes (required)            | Yes             | Yes                    |
| Adapted    | No                        | No              | No                     |
| Synthesized| No                        | No              | No                     |
| Original   | No                        | N/A             | No                     |
