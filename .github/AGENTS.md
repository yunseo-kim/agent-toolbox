# CI/CD AND AUTOMATION

GitHub Actions workflows for validation, testing, building, drift detection, and automated upstream sync.

## STRUCTURE

```
.github/
├── workflows/
│   ├── ci.yml                  # Main CI pipeline (push/PR to main)
│   ├── release.yml             # Tag-triggered npm publish pipeline
│   └── upstream-sync.yml       # Daily upstream skill sync
└── upstream-sync/
    ├── sync.py                 # Python 3.10+ stdlib-only full-directory sync script (~1200 lines)
    └── sha-cache.json          # Auto-managed cache v3 (SHA256 + tree SHAs + file hashes)
```

## CI PIPELINE (`ci.yml`)

Triggers: push to `main`, pull requests to `main`.

```
validate ──→ test ──→ build
    │
    └──→ drift-check
```

| Job | Steps | Fails When |
|-----|-------|------------|
| **validate** | `bun run typecheck` → `bun run validate` | Type errors; invalid frontmatter; domain/subdomain not in taxonomy |
| **test** | `bun test` (all unit + integration) | Any test assertion fails |
| **build** | `bun run build:index` → `bun run build:all` → verify 5 target dirs | Missing target directories; build errors |
| **drift-check** | Rebuild index → compare (excluding `generatedAt` timestamp) | `skill-index.json` is out of date |

**Drift detection**: Strips volatile `generatedAt` timestamp from both committed and rebuilt `skill-index.json`, then diffs content. Fails if any structural difference found. Fix: `bun run build:index && git add catalog/metadata/skill-index.json`.

## RELEASE PIPELINE (`release.yml`)

Triggers: push of tags matching `v[0-9]+.*`.

```
tag push (v*) --> validate --> test --> build --> release notes --> GitHub Release --> npm publish
```

| Step | Command | Fails When |
|------|---------|------------|
| **typecheck** | `bun run typecheck` | Type errors |
| **validate** | `bun run validate` | Invalid frontmatter or taxonomy |
| **test** | `bun test` | Any test assertion fails |
| **build** | `bun run build:index` + `bun run build:all` | Missing targets or build errors |
| **release notes** | `orhun/git-cliff-action@v4` | git-cliff config error |
| **GitHub Release** | `softprops/action-gh-release@v2` | Permission error |
| **npm publish** | `bunx npm publish --provenance --access public` | Missing NPM_TOKEN or publish conflict |

**Release is initiated locally** via `bun run release` (bumpp) which bumps version, generates CHANGELOG.md, commits, tags, and pushes. The tag push triggers this workflow.

**Changelog scope**: Only CLI/toolchain commits appear. Catalog-scoped commits (`catalog`, `sync` scopes) are filtered out by `cliff.toml` configuration.

**Required secrets**: `NPM_TOKEN` -- npm access token with publish permission.
## UPSTREAM SYNC (`upstream-sync.yml`)

Scheduled: **Daily 06:00 UTC** + manual dispatch.

**Manual dispatch options:**
- `repo_filter`: Sync specific upstream repo only
- `dry_run`: Preview changes without creating PRs/issues
- `init`: Initialize cache for first run

### Sync Script (`sync.py`)

Python 3.10+ stdlib-only (no pip dependencies). Uses `gh` CLI for GitHub API.

**Full-directory sync for ported skills:**
- Syncs all files in skill directory (not just SKILL.md body)
- Tree SHA1 optimization: short-circuits unchanged directories without fetching content
- Per-file safe/review classification: detects local modifications per file
- LOCAL_ONLY_FILES exclusion: NOTICE.md never synced from upstream
- Binary file handling: separate fetch path, no text corruption
- Cache v3 schema: tracks `file_hashes` and `tree_shas` for efficient change detection
- File-level reporting in PRs and issues

**Behavior by provenance:**

| Provenance | In `upstream-sources.yaml` | Action |
|------------|---------------------------|--------|
| **Ported** | `skills` section | Auto-detect changes to SKILL.md body AND all files in skill directory → create PR with updates (preserves local frontmatter, preserves NOTICE.md). Per-file safe/review classification |
| **Adapted** | `adapted_skills` section | Advisory only → report section-heading diffs in consolidated issue |
| **Synthesized/Original** | Not tracked | Ignored |

**Safety mechanisms:**
- Tree SHA1 short-circuit: skips unchanged files without fetching content
- Per-file classification: local modifications detected per file
- LOCAL_ONLY_FILES exclusion: NOTICE.md never synced from upstream
- Binary file handling: separate fetch path prevents text corruption
- SHA256 cache (`.github/upstream-sync/sha-cache.json`) prevents re-flagging identical upstream state
- Ported skills with local file modifications are flagged as "review needed" instead of auto-applied
- Adapted skills are NEVER auto-modified — advisory diffs only
- New upstream skills are detected and reported with links

## WHERE TO LOOK

| Task | File |
|------|------|
| Fix CI failure | `.github/workflows/ci.yml` — check which job failed |
| Fix drift detection | Rebuild index: `bun run build:index` and commit |
| Configure upstream sync | `catalog/metadata/upstream-sources.yaml` |
| Debug sync script | `.github/upstream-sync/sync.py` |
| Reset sync cache | Delete `.github/upstream-sync/sha-cache.json` and re-run with `--init` |
| Create a release | Run `bun run release` locally -- bumpp handles version, changelog, tag, push |
| Debug release workflow | `.github/workflows/release.yml` |
| Configure changelog scope | `cliff.toml` -- commit_parsers with skip rules |
| Configure version bump | `bump.config.ts` -- bumpp + git-cliff integration |

## ANTI-PATTERNS

- Do not hand-edit `sha-cache.json` — it is auto-managed by `sync.py`.
- Do not skip the drift-check job — it catches stale generated indexes.
- Do not run upstream sync without `--dry-run` first when debugging.
- Do not add secrets or tokens to workflow files — use GitHub repository secrets.
