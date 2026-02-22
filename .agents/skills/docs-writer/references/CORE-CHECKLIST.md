# Core Checklist

Use this checklist with `docs-writer` across all repositories.

## Phase 1: Discover

- Classify doc type: tutorial, how-to, reference, explanation
- Inspect code diff/history relevant to the request
- Confirm audience and primary task to complete
- Identify affected behavior from code or requirements
- Find canonical docs location and avoid duplicate targets
- Choose profile: generic, nextjs, angular

## Phase 2: Plan

- List exact files to create or edit
- Define section-level edits before touching files
- Identify links, indexes, sidebars, and related pages to update
- Reference `references/TEMPLATES.md` for document structure and common patterns
- Decide validation commands (lint, link check, build, preview)
- For collaborative long-form drafting (RFC/spec/proposal), run co-authoring mode:
  context dump -> section iteration -> reader test

## Phase 3: Write

- Use active voice and second person when instructional
- Keep one idea per sentence where possible
- Prefer concrete examples over abstract description
- Preserve repository terminology and naming conventions
- Keep code and commands runnable
- Include expected output and common failure/edge cases when they help users debug

## Phase 4: Verify

- Re-check technical accuracy against code behavior
- Re-check style and profile constraints
- Validate links and references
- Run formatting/lint/build commands used by the repository
- Verify docs render correctly in preview/build output when available
- Confirm no stale statements, filler, or contradiction

## Anti-Patterns

- Writing docs after code merge as a separate follow-up
- Mixing tutorial/how-to/reference/explanation in one section
- Adding framework-specific rules without profile gating
- Duplicating content instead of linking canonical sources
- Shipping untested code snippets
- Referring readers to external skill files when local profile guidance exists
- Describing unreleased behavior as generally available without explicit status
- Ignoring shared templates and producing inconsistent document structures
