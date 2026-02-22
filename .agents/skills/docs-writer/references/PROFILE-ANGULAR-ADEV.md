# Profile: Angular adev

Use this profile for Angular documentation under `adev/src/content`.

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

Use these only when documentation targets Angular adev content.

### Code block languages

- `angular-ts` for Angular TypeScript with inline templates
- `angular-html` for Angular templates
- `ts`, `html`, `bash`, `mermaid` for generic equivalents

### Code block attributes

- `header`, `linenums`, `highlight`, `hideCopy`, `prefer`, `avoid`
- Use attributes only when they improve comprehension

### Custom components

- `<docs-code>` and `<docs-code-multifile>` for advanced examples
- `<docs-card>`, `<docs-callout>`, `<docs-pill>`, `<docs-step>`, `<docs-tab>`, `<docs-video>`
- Ensure required container/parent components are present

### Alerts/admonitions

Supported markers include `NOTE:`, `TIP:`, `IMPORTANT:`, `CRITICAL:` and similar structured callouts.

## Practical Rules

- Use Angular-specific code fence identifiers when required (`angular-ts`, `angular-html`)
- Use adev custom components only where repository conventions expect them
- Preserve alert/admonition semantics and formatting
- Keep examples aligned with current Angular behavior

## Validation

- Verify examples match Angular behavior and compile expectations
- Verify custom component usage matches adev docs conventions
- Verify markdown header hierarchy and callout consistency
