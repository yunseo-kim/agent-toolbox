---
name: frontend-code-review
description: >
  Review frontend code (React, TypeScript, CSS) for code quality, performance,
  and best practices. Supports pending-change reviews and focused file reviews
  with urgency-based findings and structured output templates.
license: Sustainable Use License 1.0

metadata:
  domain: devops
  subdomain: code-review
  tags: "frontend, react, typescript, code-quality, performance, tailwind"
  frameworks: "react, nextjs"
  author: "Yunseo Kim <dev@yunseo.kim>"
  lastUpdated: "12026-02-25"
  provenance: adapted
---

# Frontend Code Review

## Intent

Use this skill whenever you review frontend code (especially `.tsx`, `.ts`, or `.js` files). Support two review modes:

1. **Pending-change review** -- inspect staged/working-tree files slated for commit and flag checklist violations before submission.
2. **File-targeted review** -- review the specific file(s) named and report the relevant checklist findings.

Stick to the checklist below for every applicable file and mode.

## Checklist

See [references/code-quality.md](references/code-quality.md) and [references/performance.md](references/performance.md) for the living checklist split by category -- treat it as the canonical set of rules to follow.

Flag each rule violation with urgency metadata so reviewers can prioritize fixes.

## Review Process

1. Open the relevant component/module. Gather lines that relate to class names, hook usage, prop memoization, and styling.
2. For each rule in the checklist, note where the code deviates and capture a representative snippet.
3. Compose the review per the template below. Group violations first by **Urgent** flag, then by category order (Code Quality, Performance).

## Required Output

When invoked, the response must exactly follow one of the two templates:

### Template A (any findings)

```
# Code review
Found <N> urgent issues need to be fixed:

## 1 <brief description of bug>
FilePath: <path> line <line>
<relevant code snippet or pointer>


### Suggested fix
<brief description of suggested fix>

---
... (repeat for each urgent issue) ...

Found <M> suggestions for improvement:

## 1 <brief description of suggestion>
FilePath: <path> line <line>
<relevant code snippet or pointer>


### Suggested fix
<brief description of suggested fix>

---

... (repeat for each suggestion) ...
```

If there are no urgent issues, omit that section. If there are no suggestions, omit that section.

If the issue count exceeds 10, summarize as "10+ urgent issues" or "10+ suggestions" and output only the first 10.

Keep blank lines between sections for readability.

If there are issues requiring code changes, append a follow-up question asking whether to apply the suggested fixes. For example: "Would you like me to apply the suggested fixes?"

### Template B (no issues)

```
## Code review
No issues found.
```

## References

- `references/code-quality.md` - Code quality rules (classnames, Tailwind, styling conventions)
- `references/performance.md` - Performance rules (memoization, hook usage, render optimization)
