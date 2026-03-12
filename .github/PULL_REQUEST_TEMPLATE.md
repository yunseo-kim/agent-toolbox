## Summary

<!-- Describe what this PR does and why. Include how to test the changes. -->

## Related Issues

<!-- Link issues using keywords to auto-close them when this PR is merged: -->
<!-- closes #123, fixes #456, resolves #789 -->

## Type of Change

<!-- Check the ONE that best applies: -->

- [ ] New catalog skill (`catalog/skills/`)
- [ ] Catalog skill update (existing skill in `catalog/skills/`)
- [ ] Toolchain / build system (`src/`, `templates/`)
- [ ] CI / workflow (`.github/workflows/`)
- [ ] Documentation
- [ ] Bug fix
- [ ] Other: <!-- describe -->

## Checklist

### General

- [ ] PR title follows [Conventional Commits](https://www.conventionalcommits.org/) format: `type(scope): Summary`
- [ ] Tests pass (`bun test`)
- [ ] Lint and format pass (`bun run lint && bun run format:check`)
- [ ] Type check passes (`bun run typecheck`)
- [ ] No secrets, credentials, or machine-local paths included

### Catalog Skills

<!-- Skip this section if your change does not touch catalog/skills/. -->

- [ ] `SKILL.md` has valid frontmatter (`name`, `description`, `license`, `metadata.domain`, `metadata.author`, `metadata.lastUpdated`, `metadata.provenance`)
- [ ] `metadata.domain` and `metadata.subdomain` values exist in `catalog/metadata/taxonomy.yaml`
- [ ] `NOTICE.md` is present with proper attribution
- [ ] Catalog index is up to date (`bun run build:index`)
- [ ] For ported skills: upstream directory structure and file names are preserved as-is

### CI / Workflows

<!-- Skip this section if your change does not touch .github/workflows/. -->

- [ ] All action `uses:` references are pinned to full commit SHAs (not mutable tags)
- [ ] Every job has `step-security/harden-runner` as its first step
- [ ] Write permissions are scoped at job level, not top level

### Breaking Changes

<!-- If this PR introduces breaking changes, describe them here. -->
<!-- Otherwise, delete this section. -->
