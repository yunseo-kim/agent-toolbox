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
  author: "Thomas Mustier"
  lastUpdated: "12026-01-16"
  provenance: ported
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

## How It Works

1. Fetch the latest guidelines from the source URL below
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in the fetched guidelines
4. Output findings in the terse `file:line` format

## Guidelines Source

Fetch fresh guidelines before each review:

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Use WebFetch to retrieve the latest rules. The fetched content contains all the rules and output format instructions.

## Usage

When a user provides a file or pattern argument:
1. Fetch guidelines from the source URL above
2. Read the specified files
3. Apply all rules from the fetched guidelines
4. Output findings using the format specified in the guidelines

If no files specified, ask the user which files to review.
