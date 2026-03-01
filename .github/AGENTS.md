# CI/CD AND AUTOMATION

GitHub Actions workflows for validation, testing, building, drift detection, security scanning, and automated upstream sync.

## STRUCTURE

```
.github/
├── workflows/
│   ├── ci.yml                  # Main CI pipeline (push/PR to main)
│   ├── release.yml             # Tag-triggered npm publish pipeline
│   ├── skill-scanner.yml       # Skill security scanning (push/PR + manual dispatch)
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

**Release is initiated locally** in two phases: `bun run release` creates a release PR (version bump + changelog + commit on a release branch). After the PR is merged, `bun run tag --push` creates a GPG-signed tag on main HEAD and pushes it, which triggers this workflow.

**Changelog scope**: Only CLI/toolchain commits appear. Catalog-scoped commits (`catalog`, `sync` scopes) are filtered out by `cliff.toml` configuration.

**Required secrets**: `NPM_TOKEN` -- npm access token with publish permission.

## SKILL SECURITY SCAN (`skill-scanner.yml`)

Triggers: push to `main` or pull requests touching `catalog/skills/**` or `.agents/skills/**`, plus manual `workflow_dispatch`.

Uses [cisco-ai-defense/skill-scanner](https://github.com/cisco-ai-defense/skill-scanner) with **all analyzers enabled** and **strict** policy preset.

### Scan Modes

| Trigger | Mode | Behavior |
|---------|------|----------|
| `workflow_dispatch` (manual) | **Full scan** | Runs `scan-all` on both `catalog/skills` and `.agents/skills` with `--recursive --check-overlap` |
| `push` / `pull_request` (auto) | **Incremental scan** | Detects changed skill directories via `git diff`, runs individual `scan` per changed skill, merges SARIF outputs |

Incremental scans skip `--recursive` and `--check-overlap` (single-skill scans don't need them). Edge cases (force push, initial push, invalid base SHA) fall back to full scan automatically.

### Manual Dispatch Options

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `verbose` | boolean | `false` | Enable verbose output: adds `--verbose` flag (policy fingerprints, co-occurrence metadata, meta-analyzer false positives in SARIF) and `--format summary` (human-readable summary printed to Actions log) |

```
checkout → setup python → install skill-scanner → detect changed skills (push/PR only) → scan catalog skills → scan dev tooling skills → upload SARIF → check results
```

### Analyzers Enabled

| Analyzer | Flag | Detection Method | Requires API Key |
|----------|------|------------------|-----------------|
| **Static** | *(default)* | YAML + YARA pattern matching | No |
| **Bytecode** | *(default)* | Python .pyc integrity verification | No |
| **Pipeline** | *(default)* | Shell command taint analysis | No |
| **Behavioral** | `--use-behavioral` | AST dataflow source→sink analysis | No |
| **LLM** | `--use-llm` | Semantic analysis via OpenAI gpt-4o | `SKILL_SCANNER_LLM_API_KEY` |
| **Meta** | `--enable-meta` | False positive filtering + correlation | `SKILL_SCANNER_LLM_API_KEY` |
| **Trigger** | `--use-trigger` | Vague description specificity checks | No |
| **VirusTotal** | `--use-virustotal` | Hash-based binary malware scanning | `VIRUSTOTAL_API_KEY` |
| **AI Defense** | *(disabled)* | Cisco cloud-based AI analysis | `AI_DEFENSE_API_KEY` |

### Scan Targets

| Target | Path | SARIF Category |
|--------|------|----------------|
| Catalog skills | `catalog/skills` | `skill-scanner-catalog` |
| Dev tooling skills | `.agents/skills` | `skill-scanner-dev` |

Both scans use `--lenient` to tolerate metadata quirks in ported skills while applying strict security analysis. Findings appear as inline annotations on PRs via GitHub Code Scanning (SARIF upload).

### Incremental Scan Details

On push/PR triggers, the workflow:
1. Computes `git diff` between the base SHA and HEAD to identify changed files under `catalog/skills/` and `.agents/skills/`
2. Extracts unique skill directory names from the changed file paths
3. Runs `skill-scanner scan <skill-dir>` individually for each changed skill
4. Merges individual SARIF outputs into a single file per target using `jq`
5. Uploads the merged SARIF to GitHub Code Scanning

If no skill files changed (e.g., only workflow file changed), the scan steps are skipped entirely.

### Required Secrets

| Secret | Maps to env var | Required for |
|--------|----------------|--------------|
| `SKILL_SCANNER_LLM_API_KEY` | `SKILL_SCANNER_LLM_API_KEY` | LLM analyzer, Meta analyzer |
| `VIRUSTOTAL_API_KEY` | `VIRUSTOTAL_API_KEY` | VirusTotal binary scanner |

### Pre-commit Hook

The project also includes a `.pre-commit-config.yaml` for local skill scanning before every commit. Install with:

```bash
pip install pre-commit
pre-commit install
```

The pre-commit hook uses the same analyzers and strict policy. Requires the same API keys set as local environment variables.

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
| Fix skill security scan | `.github/workflows/skill-scanner.yml` — check scan output |
| Run full verbose scan manually | Actions tab → Skill Security Scan → Run workflow → check `verbose` |
| Configure scan policy | Edit `--policy` flag in `skill-scanner.yml` or `.pre-commit-config.yaml` |
| Configure pre-commit hook | `.pre-commit-config.yaml` — adjust args or rev |
| Configure upstream sync | `catalog/metadata/upstream-sources.yaml` |
| Debug sync script | `.github/upstream-sync/sync.py` |
| Reset sync cache | Delete `.github/upstream-sync/sha-cache.json` and re-run with `--init` |
| Create a release | Run `bun run release` (creates PR), merge, then `bun run tag --push` |
| Debug release workflow | `.github/workflows/release.yml` |
| Configure changelog scope | `cliff.toml` -- commit_parsers with skip rules |
| Configure version bump | `bump.config.ts` -- bumpp + git-cliff integration |

## ANTI-PATTERNS

- Do not hand-edit `sha-cache.json` — it is auto-managed by `sync.py`.
- Do not skip the drift-check job — it catches stale generated indexes.
- Do not run upstream sync without `--dry-run` first when debugging.
- Do not add secrets or tokens to workflow files — use GitHub repository secrets.
- Do not disable analyzers in the skill-scanner workflow without security review.
- Do not skip the skill security scan — it catches prompt injection, data exfiltration, and malicious code in skills.
- Do not commit API keys or tokens in `.pre-commit-config.yaml` — set them as environment variables.
