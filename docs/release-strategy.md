# Release Strategy

**Last Updated:** 12026-03-01
**Status:** Canonical Reference

## Overview

The awesome-agent-toolbox project uses a split-lifecycle distribution model that separates the versioned installer (CLI/TUI) from the unversioned content (the skill catalog). The CLI/TUI acts as a runtime engine that fetches and processes neutral catalog definitions into tool-specific artifacts. This architecture ensures the core logic remains stable while the catalog evolves continuously. For a deep dive into the directory structure and toolchain, see AGENTS.md.

## Branch Model

We follow trunk-based development to maintain a high-velocity, low-friction workflow.

- **Primary Branch:** main is the only branch authorized for releases and is the source of truth.
- **Feature Branches:** Use feat/description, fix/description, or chore/description prefixes.
- **Merge Strategy:** Squash merge only. This keeps the main history linear and clean for automated changelog generation.
- **Naming Conventions:** Kebab-case for all branch names (e.g., feat/github-actions-adapter).
- **License Note:** Content in branches other than main is not licensed under the Sustainable Use License 1.0.

## Versioning Rules

Semantic Versioning (Semver) applies EXCLUSIVELY to the CLI/TUI tool and its core toolchain (src/). The catalog content does not trigger tool version bumps.

| Change Type | Bump (0.x) | Bump (post-1.0) | Example |
|-------------|------------|-----------------|---------|
| Breaking CLI change | MINOR | MAJOR | feat(cli)!: rename --target to --tool |
| New CLI command/option | MINOR | MINOR | feat(cli): add --format json |
| New target generator | MINOR | MINOR | feat(generators): add windsurf |
| TUI implementation | MINOR | MINOR | feat(tui): interactive browser |
| CLI bug fix | PATCH | PATCH | fix(install): filter AND composition |
| Generator output fix | PATCH | PATCH | fix(generators): gemini schema |
| New skill in catalog | None | None | Content, not tool |
| Skill update (sync) | None | None | Content, not tool |
| Taxonomy expansion | None | None | Content metadata |
| CI/CD changes | None | None | Infrastructure |
| Documentation changes | None | None | Not shipped |

## Release Workflow

Releases use a two-phase PR-based process, compatible with branch protection rules.

1. **Phase 1 — Version bump PR:** Run `bun run release` to create a release branch with the version bump, changelog update, and a PR to main. CI must pass before merge.
2. **Phase 2 — Tag + publish:** After the PR is merged, run `git checkout main && git pull && bun run tag --push` to create a GPG-signed annotated tag on the merged HEAD. The tag push triggers the `release.yml` GitHub Actions workflow.
3. **Build:** CI validates the catalog, runs all tests, and builds the TypeScript source.
4. **Publish:** The workflow publishes the package to the npm registry under the awesome-agent-toolbox name.
5. **Release Notes:** GitHub release notes are generated automatically from the squash-merged commit history.

## Catalog Lifecycle

The catalog updates independently of the tool version. Users receive the latest skills without needing to update the awesome-agent-toolbox package.

### Freshness Model

The installer follows a tiered fetching strategy to balance speed and reliability:

- **Primary:** raw.githubusercontent.com using ETag conditional requests (304 Not Modified).
- **Fallback 1:** GitHub API (api.github.com) with raw media type for authenticated requests or rate-limit bypass.
- **Fallback 2:** jsDelivr CDN with SHA-pinned URLs (never @branch) for high availability.
- **Cache:** ~/.cache/awesome-agent-toolbox/catalog/ stores fetched content, tracked by cache-meta.json.
- **Flags:**
  - --refresh: Force a re-fetch, ignoring ETag/cache.
  - --offline: Use cached content only; fail if cache is missing.

## Upstream Sync

Automated upstream synchronization keeps the catalog current with its sources.

- **PR Generation:** A scheduled workflow checks upstream-sources.yaml and creates PRs for ported skills.
- **Auto-merge:** PRs that only modify files in catalog/ and pass all CI checks (validation and schema tests) are eligible for automated merging.
- **Manual Review:** Any sync PR that touches src/ or requires manual conflict resolution must be reviewed by a human.

## Branch Protection

The main branch is protected by two GitHub Repository Rulesets with strict enforcement. No bypass actors are configured — all rules apply to everyone, including repository admins.

### CI Gate (`main-ci-gate`)

All changes to main must go through a pull request:

- **Pull Request Required:** Direct pushes to main are blocked. Every change must be submitted as a PR.
- **Required Approvals:** 0 — no review approvals are required (solo maintainer workflow).
- **Required Status Checks:** All four CI jobs must pass before merge:
  - `Validate Catalog` — typecheck + catalog validation
  - `Test Suite` — all unit and integration tests
  - `Build All Targets` — catalog index + all target generators
  - `Catalog Index Drift Detection` — index freshness verification
- **Strict Up-to-Date:** Not required — PRs can merge without rebasing on latest main.

### Safety Invariants (`main-safety`)

These rules are absolute and cannot be bypassed:

- **Force Push:** Blocked — main's history cannot be rewritten.
- **Deletion:** Blocked — main cannot be deleted.
- **Linear History:** Required — enforces squash merge workflow.
- **Signed Commits:** Required — all commits on main must be GPG-signed.

### Upstream Sync PRs

Automated upstream sync PRs created by `github-actions[bot]` are subject to the same CI gate. They must pass all four status checks before merging. Sync PRs are merged manually after CI passes.

### Scaling to Team Development

When the project grows beyond solo maintainer:

1. Add `required_approving_review_count: 1` to the `main-ci-gate` ruleset.
2. Optionally add repository admin as a bypass actor in `main-ci-gate` for emergency fixes.
3. Enable auto-merge for upstream-sync PRs to reduce maintenance burden.
4. Consider enabling strict up-to-date policy to prevent merge conflicts.

## 1.0 Graduation Criteria

Before the project declares version 1.0.0, the following must be met:

- [ ] Stable CLI interface with no breaking changes for 3 consecutive months.
- [ ] TUI implementation for interactive skill discovery and installation.
- [ ] Support for all primary targets (Claude, OpenCode, Gemini, Cursor, Codex).
- [ ] Documented adapter API for adding new tool targets.
- [ ] 90% test coverage for the installation and generation engine.

## Changelog Scope

The CHANGELOG.md file only tracks changes to the CLI/TUI and toolchain.

- **Tooling:** We use git-cliff with scope-based filtering.
- **Exclusions:** Catalog-only commits (e.g., feat(catalog): add git-master skill) are excluded from the main changelog to prevent noise.
- **Format:** Based on Keep a Changelog.

## npm Package Scope

The published npm package is optimized for runtime execution.

- **Included:** src/, LICENSE.md, README.md, CHANGELOG.md.
- **Excluded:** catalog/ (fetched at runtime), tests/, .github/, development scripts.

## Migration Phases

1. **Phase 1 (Release Infra):** Finalize GHA workflows and automated versioning.
2. **Phase 2 (First Publish):** Release v0.2.0 as the first stable npm version.
3. **Phase 3 (Runtime Fetch):** Transition installer to fetch catalog from GitHub instead of local files.
4. **Phase 4 (Maturation):** Focus on TUI development and 1.0 graduation criteria.

## Project Analogies

The relationship between the tool and content is similar to common package managers:

| Analogy | Versioned Tool | Unversioned Content |
|---------|----------------|---------------------|
| Homebrew | brew CLI | homebrew-core formulae |
| apt | apt binary | package repos |
| npm CLI | npm package | npm registry |
| **awesome-agent-toolbox** | CLI/TUI installer | catalog/ on GitHub |

## Anti-Patterns

- **Versioning Catalog Changes:** Do not bump the npm package version for new skills or skill updates.
- **Manual dist/ Edits:** Never modify files in dist/ manually; they are generated artifacts.
- **Hard-coding Paths:** Avoid absolute paths in the catalog; use relative references within the skill directory.
- **Ignoring ETag:** Do not skip ETag validation when fetching the catalog, as it causes unnecessary bandwidth usage.
- **Mixing Tool and Catalog in PRs:** Avoid PRs that combine CLI logic changes with catalog content updates.
