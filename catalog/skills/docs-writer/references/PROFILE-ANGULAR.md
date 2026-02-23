# Profile: Angular

Use this profile for Angular documentation projects.

## Reusable writing guidance

Apply these rules broadly unless a repository defines stricter conventions:

- Keep tone helpful, professional, and audience-first.
- Use second person and active voice for instructional content.
- Prefer sentence-case headings and clear hierarchy.
- Use descriptive link text; avoid vague anchors.
- Define unfamiliar terms on first use.
- Keep terminology consistent.
- Use unambiguous dates.
- Ensure code samples are correct and runnable.

Reference order for tie-breaks:

1. Repository-local style/contribution guidance
2. Profile rules in this file
3. External style references when local rules are silent

## Angular-specific conventions

Use these only when documentation targets Angular behavior or APIs.

### Code examples

- Use Angular-focused examples for component, template, and dependency-injection patterns.
- If your docs renderer supports Angular-specific code fence labels, use them consistently.
- If not, use standard labels (`ts`, `html`, `bash`, `mermaid`) and keep context explicit.

### Framework-specific components and callouts

- Use custom documentation components only when your docs system defines them.
- Keep callout/admonition markers consistent with local conventions.
- Avoid introducing custom component syntax in repositories that do not support it.

## Practical rules

- Keep examples aligned with current Angular behavior and recommended patterns.
- Prefer small examples first, then advanced variations.
- Separate framework-specific instructions from toolchain-specific details.

## Validation

- Verify examples match current Angular behavior.
- Verify any framework-specific markup/components are supported by the target docs system.
- Verify markdown header hierarchy and callout consistency.
