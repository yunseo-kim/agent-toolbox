# CI/CD AND AUTOMATION

GitHub Actions workflows for validation, testing, building, drift detection, and automated upstream sync.

## STRUCTURE

```
.github/
├── workflows/
│   ├── ci.yml                  # Main CI pipeline (push/PR to main)
│   └── upstream-sync.yml       # Weekly upstream skill sync
└── upstream-sync/
    ├── sync.py                 # Python 3.10+ stdlib-only sync script (~1200 lines)
    └── sha-cache.json          # Auto-managed SHA256 cache (prevents re-flagging)
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
| **drift-check** | Rebuild index → compare (excluding `generatedAt` timestamp) | `catalog-index.json` is out of date |

**Drift detection**: Strips volatile `generatedAt` timestamp from both committed and rebuilt `catalog-index.json`, then diffs content. Fails if any structural difference found. Fix: `bun run build:index && git add catalog/metadata/catalog-index.json`.

## UPSTREAM SYNC (`upstream-sync.yml`)

Scheduled: **Monday 06:00 UTC** + manual dispatch.

**Manual dispatch options:**
- `repo_filter`: Sync specific upstream repo only
- `dry_run`: Preview changes without creating PRs/issues
- `init`: Initialize cache for first run

### Sync Script (`sync.py`)

Python 3.10+ stdlib-only (no pip dependencies). Uses `gh` CLI for GitHub API.

**Behavior by provenance:**

| Provenance | In `upstream-sources.yaml` | Action |
|------------|---------------------------|--------|
| **Ported** | `skills` section | Auto-detect changes → create PR with updated body (preserves local frontmatter) |
| **Adapted** | `adapted_skills` section | Advisory only → report section-heading diffs in consolidated issue |
| **Synthesized/Original** | Not tracked | Ignored |

**Safety mechanisms:**
- SHA256 cache (`.github/upstream-sync/sha-cache.json`) prevents re-flagging identical upstream state
- Ported skills with local body modifications are flagged as "review needed" instead of auto-applied
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

## ANTI-PATTERNS

- Do not hand-edit `sha-cache.json` — it is auto-managed by `sync.py`.
- Do not skip the drift-check job — it catches stale generated indexes.
- Do not run upstream sync without `--dry-run` first when debugging.
- Do not add secrets or tokens to workflow files — use GitHub repository secrets.
