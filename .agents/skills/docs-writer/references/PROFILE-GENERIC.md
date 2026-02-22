# Profile: Generic

Use this profile unless repository-specific rules require another profile.

## Scope

- README and onboarding docs
- API and CLI reference docs
- How-to and troubleshooting docs
- Architecture, design notes, and release notes

## Writing Rules

- Keep tone direct, professional, and practical
- Write for a global audience; avoid idioms and culturally specific phrasing
- Use second person (`you`) for instructions
- Prefer active voice and present tense
- Put conditions before instructions when possible
- Use sentence-case headings
- Use numbered lists for procedures, bullets for non-sequential lists
- Keep list items parallel in grammar and structure
- Use descriptive link text
- Use serial commas
- Define unfamiliar terms on first use
- Keep terminology consistent across files
- Keep one idea per sentence when possible
- Distinguish requirements from recommendations clearly (`must` vs `recommend`)
- Prefer short examples with expected result
- Use meaningful example names instead of placeholders like `foo` or `bar`
- Avoid pre-announcing unreleased features without explicit status labels

## Formatting and readability

- Add a short overview paragraph after major headings before dense lists
- Use code font for commands, files, identifiers, and config keys
- Use bold for UI elements
- Use unambiguous date formats (for example `2026-02-22` or `January 22, 2026`)
- Provide alt text for images and keep media filenames lowercase-kebab-case

## Structure defaults

- Start with purpose and expected outcome (BLUF)
- Move from quick path to deeper detail (progressive disclosure)
- For step-by-step docs, start each step with an imperative verb
- Explicitly mark optional steps
- End with related links or next steps when useful

## User-first planning prompts

- Lead with the user goal before implementation detail
- Answer "why this matters" before "how it works"
- Anticipate common questions and likely failure points

## Common document templates

- README template: value proposition -> install -> quick start -> usage -> troubleshooting -> contributing
- API reference template: summary -> parameters/options -> return/output -> examples -> errors
- Tutorial template: prerequisites -> step-by-step tasks -> validation checks -> next steps

## Source priority

1. Repository-specific style guidance (`CONTRIBUTING.md`, docs conventions)
2. Project-local profile rules in this skill
3. External style guides only when local guidance is silent

## Validation Defaults

- Markdown lint if available
- Link check if available
- Build docs site if available
- Verify snippets and commands are technically valid
