# Security Policy

The agent-toolbox maintainers take security seriously. This document covers how to report vulnerabilities, what is in scope, and how the project's supply chain integrity works.

## Supported Versions

Semantic versioning applies only to the CLI/toolchain (`src/`). Catalog content (skills, hooks, MCP servers) is unversioned and updated on a rolling basis.

| Component       | Version               | Supported                   |
| --------------- | --------------------- | --------------------------- |
| CLI/toolchain   | 0.1.x (latest)        | Yes                         |
| CLI/toolchain   | < 0.1.x               | No                          |
| Catalog content | Rolling (unversioned) | Current HEAD on `main` only |

Pre-1.0 releases receive no backports. Only the latest published version is supported. After 1.0, this policy will be revised to cover maintenance windows for prior minor releases.

For details on the versioning model, see [docs/release.md](docs/release.md).

## Scope

This project distributes code from upstream sources alongside its own toolchain. The security scope is split accordingly.

### In Scope

- **Toolchain vulnerabilities** — Bugs in the CLI, generators, install engine, or schemas (`src/`) that could lead to code execution, path traversal, privilege escalation, or data loss.
- **Catalog content security** — Malicious or vulnerable content in distributed skills, hooks, or MCP servers (`catalog/`), including prompt injection, data exfiltration, credential theft, or embedded malware.
- **Supply chain compromise** — Tampering with the upstream sync pipeline, build artifacts (`dist/`), or the npm package that could introduce malicious content.

### Out of Scope

- Vulnerabilities in upstream repositories that we do not distribute (report these to the upstream project directly).
- Issues in user-modified local copies of catalog content.
- Feature requests, general bugs, or non-security functional issues (use [GitHub Issues](https://github.com/yunseo-kim/agent-toolbox/issues)).
- Security of the AI tools themselves (Claude Code, Gemini CLI, Cursor, etc.).

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Report vulnerabilities privately using one of the following channels:

1. **GitHub Security Advisories (preferred)** — Use the ["Report a Vulnerability"](https://github.com/yunseo-kim/agent-toolbox/security/advisories/new) tab to submit a private report.
2. **Email (fallback)** — Send a report to [oss-security@yunseo.kim](mailto:oss-security@yunseo.kim) if you cannot use GitHub Security Advisories.

### What to Include

- Description of the vulnerability and its potential impact.
- Steps to reproduce, including affected versions or catalog items.
- Proof of concept, if available.
- Whether the issue is in the toolchain (`src/`), catalog content (`catalog/`), or the upstream sync pipeline.

### Response Timeline

| Step                              | Timeline                                      |
| --------------------------------- | --------------------------------------------- |
| Acknowledgment of report          | 3 business days                               |
| Triage and severity assessment    | 7 business days                               |
| Fix for critical or high severity | 14 days                                       |
| Fix for medium or low severity    | 30 days                                       |
| Public disclosure                 | After fix is released, or 90 days from report |

These timelines are best-effort commitments. Complex issues may take longer, but we will keep you informed of progress.

## Catalog Content Security

Because this project distributes third-party code, catalog content requires distinct handling.

**Reporting malicious or vulnerable catalog content** — Use the same private reporting channels described above. Include the skill name, provenance type, and upstream source if known.

**How catalog issues are handled:**

1. The affected item is removed or patched in `catalog/` immediately.
2. If the item is ported or adapted from an upstream source, we notify the upstream maintainers.
3. A security advisory is published if the issue affects users who installed the content.
4. For ported skills, the upstream sync is paused for that item until the upstream fix is confirmed.

**Upstream vulnerability propagation** — If a vulnerability is discovered in an upstream repository that we port from, the affected catalog item is pinned, patched, or removed until the upstream fix is available and verified.

## Supply Chain Integrity

### Provenance Tracking

Every catalog item declares a provenance type that determines how it relates to its source:

| Provenance  | Definition                          | Sync model                                    |
| ----------- | ----------------------------------- | --------------------------------------------- |
| Ported      | Body unchanged from upstream        | Automated sync with per-file verification     |
| Adapted     | Meaningfully modified from upstream | Advisory monitoring only (never auto-applied) |
| Synthesized | Combined from multiple sources      | No sync; all sources attributed in NOTICE.md  |
| Original    | Created in this project             | No upstream dependency                        |

All catalog items require a `NOTICE.md` with attribution. For the full classification criteria, see [docs/classification.md](docs/classification.md).

### Automated Upstream Sync

The daily upstream sync workflow includes the following safety mechanisms:

- **Tree SHA verification** — Unchanged directories are short-circuited without fetching content.
- **Per-file change classification** — Each file is classified as safe (auto-apply) or review-needed (requires manual approval).
- **Local-only file exclusion** — Files like `NOTICE.md` are never overwritten by upstream content.
- **SHA-256 caching** — Prevents re-processing of identical upstream state.
- **Adapted skills are never auto-modified** — Upstream changes are reported as advisories only.
- **All sync PRs pass the full CI gate** before merging.

### Automated Security Scanning

All catalog skills and development tooling skills are scanned automatically using [Cisco Skill Scanner](https://github.com/cisco-ai-defense/skill-scanner), an open-source multi-engine security scanner purpose-built for AI agent skills.

**CI/CD integration** — A GitHub Actions workflow (`.github/workflows/skill-scanner.yml`) runs on every push to `main` and every pull request that modifies files under `catalog/skills/` or `.agents/skills/`. Push and PR triggers run incremental scans (only changed skills). Results are uploaded as SARIF to GitHub Code Scanning, providing inline annotations on pull requests.

**Pre-commit hook** — A `.pre-commit-config.yaml` provides the same scanning locally before every commit, catching issues before they reach CI.

**Policy** — Both CI and pre-commit use a [custom strict-based policy](docs/skill-scanner-policy.md) (`skill-scanner-policy.yaml`), which starts from the scanner's **strict** preset and selectively relaxes presentation thresholds and allowlists to fit a multi-skill catalog — without disabling any detection rules or suppressing findings. The `--lenient` flag is used alongside the custom policy to tolerate metadata quirks in ported skills without relaxing security analysis. For the full field-by-field preset comparison, see [`docs/skill-scanner-policy.md`](docs/skill-scanner-policy.md).

**Enabled analyzers:**

| Analyzer   | Detection Method                               | Requires API Key                  |
| ---------- | ---------------------------------------------- | --------------------------------- |
| Static     | YAML + YARA pattern matching                   | No                                |
| Bytecode   | Python .pyc integrity verification             | No                                |
| Pipeline   | Shell command taint analysis                   | No                                |
| Behavioral | AST dataflow source-to-sink analysis           | No                                |
| LLM        | Semantic analysis via OpenAI gpt-4o            | Yes (`SKILL_SCANNER_LLM_API_KEY`) |
| Meta       | False positive filtering + finding correlation | Yes (`SKILL_SCANNER_LLM_API_KEY`) |
| Trigger    | Description specificity checks                 | No                                |
| VirusTotal | Hash-based binary malware scanning             | Yes (`VIRUSTOTAL_API_KEY`)        |

The workflow fails if any findings at or above **HIGH** severity are detected, blocking the pull request from merging.

**Threat coverage** includes: prompt injection (direct and indirect), data exfiltration, credential theft, command injection, code execution, Unicode steganography, homoglyph attacks, tool poisoning, and capability inflation — mapped to Cisco's [AITech threat taxonomy](https://github.com/cisco-ai-defense/skill-scanner/blob/main/docs/architecture/threat-taxonomy.md).

**Monthly full scan** -- A scheduled workflow runs on the 1st of each month, scanning all catalog and dev tooling skills with verbose output. Results are archived as detailed markdown reports in [`docs/security-reports/`](docs/security-reports/). Full scans can also be triggered manually from the Actions tab with the `archive` option.

### Release Integrity

- **GPG-signed tags** — All release tags are GPG-signed annotated tags.
- **GPG-signed commits** — All commits on `main` must be GPG-signed (enforced by repository rulesets).
- **npm provenance** — Packages are published with `--provenance` for verifiable build attestation.
- **Linear history** — Squash-merge-only policy prevents history rewriting; force-push to `main` is blocked.
- **CI gate** — Five required status checks (typecheck, catalog validation, test suite, drift detection, skill security scan) must pass before any merge to `main`.

### Runtime Catalog Fetching

The CLI fetches catalog content from GitHub at runtime (not bundled in the npm package). Fetches use ETag-based conditional requests with a jsDelivr CDN fallback pinned to specific SHAs, not branch references.

## Disclosure Policy

We follow coordinated disclosure:

1. The reporter submits a private vulnerability report.
2. We acknowledge, triage, and work on a fix privately.
3. Once a fix is released, we publish a GitHub Security Advisory with full details.
4. The reporter is credited in the advisory unless they request anonymity.
5. If no fix is released within 90 days, the reporter may disclose publicly.

We will not take legal action against researchers who report vulnerabilities in good faith and follow this policy.
