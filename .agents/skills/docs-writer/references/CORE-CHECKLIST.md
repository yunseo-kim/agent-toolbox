# Core Checklist

Use this checklist with `docs-writer` across all repositories.

## Phase 1: Discover

- Classify doc type: tutorial, how-to, reference, explanation
- Confirm audience and primary task to complete
- Identify affected behavior from code or requirements
- Find canonical docs location and avoid duplicate targets
- Choose profile: generic, nextjs, angular-adev

## Phase 2: Plan

- List exact files to create or edit
- Define section-level edits before touching files
- Identify links, indexes, sidebars, and related pages to update
- Decide validation commands (lint, link check, build, preview)
- For collaborative long-form drafting (RFC/spec/proposal), run co-authoring mode:
  context dump -> section iteration -> reader test

## Phase 3: Write

- Use active voice and second person when instructional
- Keep one idea per sentence where possible
- Prefer concrete examples over abstract description
- Preserve repository terminology and naming conventions
- Keep code and commands runnable

## Phase 4: Verify

- Re-check technical accuracy against code behavior
- Re-check style and profile constraints
- Validate links and references
- Run formatting/lint/build commands used by the repository
- Confirm no stale statements, filler, or contradiction

## Anti-Patterns

- Writing docs after code merge as a separate follow-up
- Mixing tutorial/how-to/reference/explanation in one section
- Adding framework-specific rules without profile gating
- Duplicating content instead of linking canonical sources
- Shipping untested code snippets
- Referring readers to external skill files when local profile guidance exists
