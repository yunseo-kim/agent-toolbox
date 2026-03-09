---
name: web-design-guidelines
description: >
  Review UI code for Web Interface Guidelines compliance. Audits code against
  100+ rules covering accessibility, performance, UX, forms, animation,
  typography, images, navigation, dark mode, touch interactions, and i18n.
  Use when asked to review UI, check accessibility, audit design, or review UX.
license: Sustainable Use License 1.0

metadata:
  domain: development
  subdomain: frontend
  tags: "accessibility, ux, web-design, audit, a11y, performance, dark-mode, i18n"
  author: "Yunseo Kim <dev@yunseo.kim>"
  lastUpdated: "12026-03-03"
  provenance: adapted
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

## How It Works

1. Read the guidelines from `references/command.md`
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in the guidelines
4. Output findings in the terse `file:line` format

## Guidelines

The complete ruleset is bundled in `references/command.md`. Read it before each review to apply all rules and use the output format specified therein.

## Usage

When a user provides a file or pattern argument:
1. Read guidelines from `references/command.md`
2. Read the specified files
3. Apply all rules from the guidelines
4. Output findings using the format specified in the guidelines

If no files specified, ask the user which files to review.

## References

- `references/command.md` — Complete Web Interface Guidelines ruleset with 100+ rules covering accessibility, focus states, forms, animation, typography, content handling, images, performance, navigation, touch interactions, safe areas, dark mode, i18n, hydration safety, hover states, content & copy, and anti-patterns. Includes output format specification.
