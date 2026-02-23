---
name: create-pr
description: >
  Create GitHub pull requests with Conventional Commits-formatted titles and
  structured PR bodies. Use when creating PRs, submitting changes for review,
  or when the user says /pr or asks to create a pull request.
domain: devops
subdomain: git
tags: [github, pull-request, conventional-commits, gh-cli]
---

# Create Pull Request

Create GitHub PRs with Conventional Commits-formatted titles and structured bodies.

## PR Title Format

```
<type>(<scope>): <summary>
```

### Types (required)

| Type       | Description                         | Changelog |
|------------|-------------------------------------|-----------|
| `feat`     | New feature                         | Yes       |
| `fix`      | Bug fix                             | Yes       |
| `perf`     | Performance improvement             | Yes       |
| `test`     | Adding/correcting tests             | No        |
| `docs`     | Documentation only                  | No        |
| `refactor` | Code change (no bug fix or feature) | No        |
| `build`    | Build system or dependencies        | No        |
| `ci`       | CI configuration                    | No        |
| `chore`    | Routine tasks, maintenance          | No        |
| `revert`   | Revert a previous commit            | No        |

### Scopes (optional but recommended)

Scope identifies the area of the codebase affected. Choose a scope that is
meaningful to your project. Common patterns:

- **Package/module name**: `api`, `cli`, `core`, `auth`, `db`
- **Layer**: `frontend`, `backend`, `infra`
- **Feature area**: `billing`, `search`, `notifications`

Check your project for existing scope conventions (look at recent PR titles or
commit history with `git log --oneline -20`). Follow what the team already uses.

### Summary Rules

- Use imperative present tense: "Add" not "Added"
- Capitalize first letter
- No period at the end
- No ticket IDs in the title (reference tickets in the PR body instead)

### Breaking Changes

Add an exclamation mark before the colon to indicate a breaking change:

```
feat(api)!: Remove deprecated v1 endpoints
```

## Steps

1. **Check current state**:
   ```bash
   git status
   git diff --stat
   git log origin/main..HEAD --oneline
   ```

2. **Analyze changes** to determine:
   - Type: What kind of change is this?
   - Scope: Which package/area is affected?
   - Summary: What does the change do?

3. **Push branch if needed**:
   ```bash
   git push -u origin HEAD
   ```

4. **Detect PR template**: Check if the project has a PR template:
   ```bash
   # Check common template locations
   for f in .github/pull_request_template.md .github/PULL_REQUEST_TEMPLATE.md docs/pull_request_template.md; do
     [ -f "$f" ] && echo "Found: $f" && break
   done
   ```

5. **Create PR** using gh CLI. If a PR template exists, use it. Otherwise use the default structure:
   ```bash
   gh pr create --draft --title "<type>(<scope>): <summary>" --body "$(cat <<'EOF'
   ## Summary

   <Describe what the PR does and how to test. Screenshots/videos recommended for UI changes.>

   ## Related Issues

   <!-- Use "closes #<number>", "fixes #<number>", or "resolves #<number>" to auto-close -->

   ## Checklist

   - [ ] PR title follows Conventional Commits format
   - [ ] Tests included
   - [ ] Documentation updated (if applicable)
   EOF
   )"
   ```

## PR Body Guidelines

### Summary Section
- Describe what the PR does and why
- Explain how to test the changes
- Include screenshots/videos for UI changes

### Related Issues Section
- Link to issue tracker tickets (GitHub Issues, Linear, Jira, etc.)
- Use GitHub keywords to auto-close issues:
  - `closes #123` / `fixes #123` / `resolves #123`

### Checklist
Adapt to your project's standards. Common items:
- PR title follows conventions
- Tests included (bugs need regression tests, features need coverage)
- Documentation updated or follow-up ticket created
- Breaking changes documented in the PR body

## Examples

### New feature with scope
```
feat(auth): Add OAuth2 PKCE flow support
```

### Bug fix in a specific module
```
fix(parser): Resolve infinite loop on malformed input
```

### Performance improvement
```
perf(db): Add index for frequently queried columns
```

### Breaking change
```
feat(api)!: Remove deprecated v1 endpoints
```

### No scope (affects multiple areas)
```
chore: Update dependencies to latest versions
```

### Documentation only
```
docs: Add migration guide for v3
```

## Validation

A well-formed Conventional Commits PR title matches this pattern:
```
^(feat|fix|perf|test|docs|refactor|build|ci|chore|revert)(\([a-zA-Z0-9 /-]+\))?!?: [A-Z].+[^.]$
```

Key validation rules:
- Type must be one of the allowed types
- Scope is optional but must be in parentheses if present
- Exclamation mark for breaking changes goes before the colon
- Summary must start with a capital letter
- Summary must not end with a period
