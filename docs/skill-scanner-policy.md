# awesome-agent-toolbox Skill Scanner Policy

The custom policy has been deployed as `skill-scanner-policy.yaml` at repo root (commit `fb485fc`). CI workflow (`.github/workflows/skill-scanner.yml`) and pre-commit hook (`.skill_scannerrc`) reference this file.

## Preset Comparison

The scanner ships three built-in presets ([`skill_scanner/data/`](https://github.com/cisco-ai-defense/skill-scanner/tree/main/skill_scanner/data)):

| Preset | `preset_base` | Philosophy |
|--------|--------------|------------|
| **permissive** | `permissive` | Minimise false positives. Broad allowlists, aggressive suppression. For trusted/internal skills and dev-time scanning. |
| **default** | `balanced` | Balanced trade-off between detection coverage and false-positive rate. |
| **strict** | `strict` | Maximum security posture. Narrow allowlists, fewer suppressions. For untrusted/external skills and compliance. |

Our custom policy declares `preset_base: strict` and then selectively relaxes specific knobs to fit a curated multi-skill catalog without sacrificing core threat detection. The table below shows every field where our policy diverges from the strict preset, with the default and permissive values for context.

## Field-by-Field Divergence from Strict Preset

### Hidden Files

| Field | Strict | Default | Ours | Rationale |
|-------|--------|---------|------|-----------|
| `benign_dotfiles` | 6 entries (git + editorconfig + dockerignore only) | 40+ entries (standard toolchain) | **40+ entries (= default)** | Catalog skills routinely include linter/formatter/version-manager configs. Flagging every `.eslintrc` or `.prettierrc` as suspicious creates triage noise with no security value. |
| `benign_dotdirs` | 3 entries (`.github`, `.circleci`, `.gitlab`) | 20+ entries | **20+ entries (= default)** | Same reasoning. `.vscode`, `.cursor`, `.claude`, `.storybook`, etc. are standard in skill directories. |

### Pipeline Taint Analysis

| Field | Strict | Default | Ours | Rationale |
|-------|--------|---------|------|-----------|
| `known_installer_domains` | `[]` (all curl\|sh flagged) | 17 domains | **17 domains (= default)** | Catalog skills reference Rust, Python, Node, Docker installers. Flagging `sh.rustup.rs` as a supply-chain attack in a torch-export skill is noise. Known-good installer domains are demoted to LOW, not suppressed. |
| `benign_pipe_targets` | 2 patterns (`ps\|grep`, `grep\|grep -v`) | 7 patterns | **8 patterns (= default + 1 custom)** | Added Trello API `curl -s \| jq` pattern for `trello-api` skill (Pattern 13). All benign patterns are read-only text-processing pipes with no write/execute sink. |
| `demote_in_docs` | `false` | `true` | **`true` (= default)** | Pipeline findings in `references/`, `docs/`, `examples/` directories are almost always instructional. Demoting (not suppressing) preserves visibility. |
| `demote_instructional` | `false` | `true` | **`true` (= default)** | Same rationale. SKILL.md code blocks are teaching examples, not runtime scripts. |
| `check_known_installers` | `false` | `true` | **`true` (= default)** | Required for `known_installer_domains` to take effect. |
| `dedupe_equivalent_pipelines` | `false` | `true` | **`true` (= default)** | Without deduplication, the same `curl \| jq` pipe extracted by two regex paths generates two identical findings. Pure noise. |
| `compound_fetch_*` filters | All `false` | All `true` | **Not set (inherit strict = `false`)** | Compound fetch+execute detection remains at maximum sensitivity. No FP suppression for download-then-run patterns. |

### Rule Scoping

| Field | Strict | Default | Ours | Rationale |
|-------|--------|---------|------|-----------|
| `skillmd_and_scripts_only` | `[]` (coercive/autonomy rules fire on ALL files) | 2 rules (`coercive_injection_generic`, `autonomy_abuse_generic`) | **1 rule (`coercive_injection_generic`)** | Partial relaxation: `coercive_injection_generic` fires only on SKILL.md and scripts (per default). `autonomy_abuse_generic` fires on all files (per strict). This catches autonomy-abuse in referenced docs while limiting coercive-injection FPs in API reference prose. |
| `skip_in_docs` | 7 rules (3 YARA generics + 4 JS/TS rules) | 14 rules (adds `command_injection_generic`, `credential_harvesting_generic`, `GLOB_HIDDEN_FILE_TARGETING`, etc.) | **7 rules (= strict)** | We keep strict's narrower skip list. Rules like `PROMPT_INJECTION_IGNORE_INSTRUCTIONS` and `credential_harvesting_generic` are security-critical and should fire even in documentation directories. |
| `doc_path_indicators` | 2 (`references`, `docs`) | 11 (adds `examples`, `tutorials`, `guides`, `rules`, `indexes`, `demos`, `fixtures`, `patterns`, `test`) | **10 (strict + 8 custom)** | Extended to cover catalog directory conventions (`rules`, `patterns`, `templates`, `test`, `examples`, `tutorials`, `guides`). Does not include `indexes`, `demos`, `fixtures` from default (not used in catalog). |
| `doc_filename_patterns` | 1 narrow pattern (`tutorial\|guide\|howto`) | 1 broader pattern (adds `security[_-]patterns`, `examples?`, `samples?`, etc.) | **2 patterns** (default's broad pattern + custom `.template.ts(x)$` pattern) | The `.template.` pattern addresses Pattern 12: `utilityFunction(` in `*.template.ts` files triggering `COMMAND_INJECTION_JS_FUNCTION_CONSTRUCTOR`. |
| `dedupe_reference_aliases` | `false` | `true` | **`true` (= default)** | Alias deduplication eliminates noise from symlinked/aliased references without affecting detection. |
| `dedupe_duplicate_findings` | `false` | `true` | **`true` (= default)** | Without deduplication, overlapping static scan passes emit identical findings. |
| `asset_prompt_injection_skip_in_docs` | `false` | `true` | **`true` (= default)** | ASSET_PROMPT_INJECTION in `references/` directories is almost always false (e.g., `prompt-input.md` in `ai-elements`). |

### Credentials

| Field | Strict | Default | Ours | Rationale |
|-------|--------|---------|------|-----------|
| `known_test_values` | `[]` (no suppression) | 7 values (Stripe test keys, JWT.io, placeholder passwords) | **7 values (= default)** | Catalog skills use Stripe `sk_test_*` keys and `jwt.io` example tokens in documentation. Flagging these as leaked credentials is pure noise. |
| `placeholder_markers` | `[]` (no suppression) | 12 markers (`your-`, `example`, `changeme`, etc.) | **12 markers (= default)** | Same reasoning — `your-api-key` in documentation is not a credential leak. |

### System Cleanup

| Field | Strict | Default | Ours | Rationale |
|-------|--------|---------|------|-----------|
| `safe_rm_targets` | 4 (`dist`, `build`, `tmp`, `temp`) | 14 (adds `node_modules`, `.next`, `.cache`, etc.) | **7 (strict + 3)** | Added `.tmp`, `.temp`, `.cache` to strict's base set. Does not add `node_modules`, `.next`, etc. from default — those should still be flagged as potentially suspicious cleanup targets in skill scripts. |

### File Classification

| Field | Strict | Default | Ours | Rationale |
|-------|--------|---------|------|-----------|
| `skip_inert_extensions` | `false` (scan images for embedded content) | `true` | **`false` (= strict)** | Images and fonts are still scanned for steganography and embedded payloads. Security over speed. |
| `allow_script_shebang_text_extensions` | `false` | `true` | **`true` (= default)** | Catalog Python/shell scripts with shebangs (e.g., `#!/usr/bin/env python3` in `.py` files) are normal. Strict's `false` produces a FILE_MAGIC_MISMATCH for every script with a shebang. |

### File Limits

| Field | Strict | Default | Permissive | Ours | Rationale |
|-------|--------|---------|------------|------|-----------|
| `max_file_count` | 50 | 100 | 500 | **100 (= default)** | Several catalog skills (marketing skills with bundled `references/tools/`) exceed 50 files. |
| `max_file_size_bytes` | 2 MB | 5 MB | 20 MB | **5 MB (= default)** | `ai-elements` contains TSX files with inline base64 images up to ~280K. 2 MB limit would flag normal assets. |
| `max_reference_depth` | 3 | 5 | 10 | **5 (= default)** | Marketing skills with nested `references/tools/integrations/` need 4+ levels. |
| `min_description_length` | 30 | 20 | 10 | **30 (= strict)** | Require meaningful descriptions. |
| `max_yara_scan_file_size_bytes` | 20 MB | 50 MB | 100 MB | **100 MB (= permissive)** | Ensures large referenced files are not silently skipped by YARA. |
| `max_loader_file_size_bytes` | 5 MB | 10 MB | 20 MB | **20 MB (= permissive)** | Same reasoning. Content above this limit is silently excluded from LLM analysis. |

### Analysis Thresholds

| Field | Strict | Default | Ours | Rationale |
|-------|--------|---------|------|-----------|
| `zerowidth_threshold_with_decode` | 20 | 50 | **20 (= strict)** | Flag steganography at strict's lower threshold. |
| `zerowidth_threshold_alone` | 100 | 200 | **100 (= strict)** | Same. |
| `analyzability_low_risk` | 95 | 90 | **90 (= default)** | Strict's 95% is impractical — any skill with one large reference file or inline image drops below 95. |
| `analyzability_medium_risk` | 80 | 70 | **65 (below default)** | Lowered from 70 to accommodate marketing skills with bundled tool assets. Skills below 65% are still flagged HIGH. |
| `min_dangerous_lines` | 3 | 5 | **3 (= strict)** | Flag homoglyph attacks at strict's lower threshold. |
| `min_confidence_pct` | 60 | 80 | **80 (= default)** | Strict's 60% produces too many FILE_MAGIC_MISMATCH FPs (SKILL.md YAML frontmatter -> YAML fingerprint). Default's 80% filters these while still catching genuine mismatches. |
| `cyrillic_cjk_min_chars` | 5 | 10 | **5 (= strict)** | Flag Unicode steganography at strict's lower threshold. |
| `homoglyph_filter_math_context` | `false` | `true` | **`true` (= default)** | Suppress homoglyph FPs in mathematical/scientific contexts. Strict's `false` flags Greek letters in formulas. |
| `max_regex_pattern_length` | 500 | 1000 | **500 (= strict)** | Stricter ReDoS protection. |

### Sensitive Files

| Field | Strict | Default | Ours | Rationale |
|-------|--------|---------|------|-----------|
| `patterns` | 5 expanded patterns (includes `sudoers`, `.kube`, `.jks`, `KUBECONFIG`) | 5 narrower patterns | **5 expanded (= strict)** | Full strict-grade sensitive-file detection. |

### Command Safety

| Field | Strict | Default | Ours | Rationale |
|-------|--------|---------|------|-----------|
| `dangerous_commands` | Promotes `ssh`, `scp`, `rsync`, `sftp`, `docker`, `podman`, `kubectl` from risky to dangerous | In risky tier | **Promoted (= strict)** | Any skill that invokes Docker, SSH, or kubectl deserves dangerous-tier scrutiny. |
| `dangerous_arg_patterns` | 11 patterns (default 8 + pip URL install, npm run, npx) | 8 patterns | **11 patterns (= strict)** | Supply-chain risk from `pip install https://...` and `npx` arbitrary execution warrants strict detection. |

### LLM Analysis

| Field | Strict | Default | Permissive | Ours | Rationale |
|-------|--------|---------|------------|------|-----------|
| `max_instruction_body_chars` | 15K | 20K | 50K | **50K (= permissive)** | `marketing-psychology` SKILL.md is 21K; strict/default would skip it entirely. |
| `max_code_file_chars` | 10K | 15K | 30K | **30K (= permissive)** | `prompt-input-cursor.tsx` in `ai-elements` is 15.5K; needs headroom. |
| `max_referenced_file_chars` | 8K | 10K | 20K | **48K (beyond all presets)** | `torch-export` guide is 27K; `node_mcp_server.md` is 28K. Without this, these files are silently excluded from LLM analysis — the most security-critical analyzer. |
| `max_total_prompt_chars` | 80K | 100K | 200K | **400K (beyond all presets)** | Skills with many references (marketing skills with 15+ bundled tool docs) need the budget. Targeting ~25% of `gpt-5.2`'s 400K-token context window. |

### Severity Overrides

> For baseline severities before policy overrides, see [`skill-scanner-default-severities.md`](skill-scanner-default-severities.md).

| Override | Strict | Default | Ours | Rationale |
|----------|--------|---------|------|-----------|
| `BINARY_FILE_DETECTED` -> MEDIUM | Yes | — | **Yes (= strict)** | Unknown binaries flagged at MEDIUM. |
| `HIDDEN_DATA_FILE` -> MEDIUM | Yes | — | **Yes (= strict)** | Unknown hidden files flagged at MEDIUM. |
| `PYCACHE_FILES_DETECTED` -> MEDIUM | Yes | — | **Yes (= strict)** | Bytecode distribution flagged at MEDIUM. |
| `CROSS_SKILL_DATA_RELAY` -> MEDIUM | — | — | **Yes (custom)** | In a curated catalog, cross-skill composability is expected. Demoted from HIGH to MEDIUM to remove false fail-fast behavior while retaining visibility. |

### Disabled Rules

| Preset | Disabled rules |
|--------|----------------|
| **Strict** | None |
| **Default** | None |
| **Permissive** | 8 rules (`LAZY_LOAD_DEEP_NESTING`, `MANIFEST_INVALID_NAME`, `capability_inflation_generic`, `indirect_prompt_injection_generic`, `GLOB_HIDDEN_FILE_TARGETING`, `HOMOGLYPH_ATTACK`, `embedded_shebang_in_binary`, `DATA_EXFIL_JS_NETWORK`) |
| **Ours** | **None (= strict/default)** |

## Policy Stance Summary

Our policy is **strict-base with surgical relaxations** in areas where the strict preset produces catalog-incompatible noise. The relaxation strategy follows a clear principle: **relax presentation thresholds and allowlists, never relax detection rules or disable findings.**

**Kept at strict tier** (maximum detection sensitivity):
- Command safety (ssh/docker/kubectl in dangerous tier, strict arg patterns)
- Sensitive file detection (expanded patterns including `.kube`, `.jks`, `KUBECONFIG`)
- Steganography detection (low zero-width thresholds, low Cyrillic/CJK min, strict regex limits)
- File classification (scan inert extensions for embedded content)
- Compound fetch+execute detection (no FP suppression filters)
- Rule scoping `skip_in_docs` (strict's narrow 7-rule list, not default's broad 14-rule list)
- No disabled rules, no global severity demotions

**Relaxed to default tier** (catalog-practical noise reduction):
- Hidden-file allowlists (standard toolchain dotfiles are benign)
- Pipeline taint (known installer domains demoted, benign text-processing pipes deduplicated)
- Finding deduplication (eliminate exact duplicates from overlapping scan passes)
- Credential test-value suppression (Stripe test keys, `jwt.io` tokens)
- File limits (skills with bundled references exceed strict's 50-file/2MB/3-depth limits)
- Analyzability thresholds (strict's 95/80 is impractical for skills with large references)

**Relaxed to permissive tier** (coverage over performance):
- LLM analysis instruction/code budgets (50K instruction body / 30K code file) — marketing skills and large TSX components exceed default limits
- YARA/loader file size limits (100 MB / 20 MB) — ensures large legitimate files are scanned, not silently excluded

**Relaxed beyond all presets** (catalog-specific requirements):
- LLM analysis referenced-file / total budgets (48K referenced-file / 400K total) — ensures the most security-critical analyzer is never silently skipped
- `analyzability_medium_risk` at 65 (below default's 70) — accommodates marketing skills with bundled tool assets without masking genuinely opaque skills

**Net effect**: the policy eliminates ~250+ false-positive findings from cross-skill noise, documentation-context YARA hits, and known-test-value credential flags, while keeping all genuine threat detection at strict-or-higher sensitivity. No security rule is disabled or globally suppressed.