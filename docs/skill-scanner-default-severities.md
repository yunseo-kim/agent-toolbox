# Cisco Skill Scanner — Default Severity by Rule ID

> **Source**: [`cisco-ai-defense/skill-scanner`](https://github.com/cisco-ai-defense/skill-scanner) (v2.0.0, commit `67a29d9`)
>
> **Last analyzed**: 12026-03-04
>
> This document catalogs every `rule_id` emitted by the Cisco Skill Scanner and its **default severity** when no `severity_overrides` are applied (i.e., the `balanced` preset / `default_policy.yaml`).

---

## How Default Severity Is Determined

Severities come from **three distinct layers**, evaluated in this order:

1. **Hardcoded in source** — Python analyzers and YAML signature files define the baseline severity for each rule.
2. **YARA threat mapping** — YARA rule matches are mapped to a threat category via `ThreatMapping.YARA_THREATS` in `skill_scanner/threats/threats.py`, which assigns severity per threat type.
3. **Policy overrides** — The active scan policy (`severity_overrides` in `default_policy.yaml`) can raise or lower any rule's severity. The default `balanced` preset ships with **no overrides** (`severity_overrides: []`).

The tables below reflect the **baseline severity before any policy override** — i.e., what you get out of the box with the `balanced` preset and no custom policy.

### Severity Levels

| Level | Meaning |
|---|---|
| **CRITICAL** | Immediate, exploitable threat (code execution, credential leak, data exfiltration) |
| **HIGH** | Likely malicious or dangerous pattern requiring remediation |
| **MEDIUM** | Suspicious pattern requiring review; context-dependent risk |
| **LOW** | Informational concern or minor policy deviation |
| **INFO** | Metadata-only; no direct security impact |

---

## 1. Signature Rules (YAML)

Defined in `skill_scanner/data/packs/core/signatures/*.yaml`. Each rule has an explicit `severity` field.

### 1.1 Command & Code Injection

| `rule_id` | Default Severity | Description |
|---|---|---|
| `COMMAND_INJECTION_EVAL` | **CRITICAL** | `eval()` / `exec()` / `compile()` — arbitrary code execution |
| `COMMAND_INJECTION_OS_SYSTEM` | **CRITICAL** | `os.system()` / `subprocess` with string formatting (injection risk) |
| `COMMAND_INJECTION_SHELL_TRUE` | **HIGH** | `subprocess` with `shell=True` or `os.system()` |
| `COMMAND_INJECTION_USER_INPUT` | **HIGH** | `eval` with positional arguments (shell command injection in bash) |
| `PATH_TRAVERSAL_OPEN` | **CRITICAL** | User-controlled file path in `open()` — path traversal |
| `SQL_INJECTION_STRING_FORMAT` | **CRITICAL** | SQL with f-string variables — SQL injection risk |
| `SVG_EMBEDDED_SCRIPT` | **CRITICAL** | SVG contains `<script>`, event handlers, or `javascript:` URIs |
| `PDF_EMBEDDED_JAVASCRIPT` | **CRITICAL** | PDF contains embedded JavaScript or auto-action triggers |
| `GLOB_HIDDEN_FILE_TARGETING` | **MEDIUM** | Glob/find patterns targeting hidden (dot) files |
| `FIND_EXEC_PATTERN` | **HIGH** | `find -exec` with non-safe commands |
| `COMMAND_INJECTION_JS_CHILD_PROCESS` | **CRITICAL** | Node.js `child_process` module usage |
| `COMMAND_INJECTION_JS_FUNCTION_CONSTRUCTOR` | **CRITICAL** | `new Function()` or string-based `setTimeout`/`setInterval` |

### 1.2 Data Exfiltration

| `rule_id` | Default Severity | Description |
|---|---|---|
| `DATA_EXFIL_NETWORK_REQUESTS` | **MEDIUM** | Outbound HTTP request primitives (`requests.get`, `httpx`, etc.) |
| `DATA_EXFIL_HTTP_POST` | **CRITICAL** | HTTP POST to suspicious endpoints or with sensitive data payloads |
| `DATA_EXFIL_SOCKET_CONNECT` | **CRITICAL** | Direct socket connection to external server |
| `DATA_EXFIL_SENSITIVE_FILES` | **HIGH** | Opening sensitive system/credential files (`/etc/passwd`, `.ssh/`, `.env`) |
| `DATA_EXFIL_BASE64_AND_NETWORK` | **HIGH** | Base64 encoding combined with network operations |
| `DATA_EXFIL_JS_NETWORK` | **MEDIUM** | JS/TS outbound network primitives (`fetch`, `axios`, `XMLHttpRequest`) |
| `DATA_EXFIL_JS_FS_ACCESS` | **HIGH** | Node.js filesystem read/write operations |

### 1.3 Hardcoded Secrets

| `rule_id` | Default Severity | Description |
|---|---|---|
| `SECRET_AWS_KEY` | **CRITICAL** | AWS access key pattern (`AKIA...`) |
| `SECRET_STRIPE_KEY` | **CRITICAL** | Stripe API key (`sk_live_...` / `pk_test_...`) |
| `SECRET_GOOGLE_API` | **CRITICAL** | Google API key (`AIza...`) |
| `SECRET_GITHUB_TOKEN` | **CRITICAL** | GitHub token (`ghp_...`, `gho_...`, etc.) |
| `SECRET_JWT_TOKEN` | **HIGH** | JWT token (`eyJ...`) |
| `SECRET_PRIVATE_KEY` | **CRITICAL** | PEM private key block (`-----BEGIN ... PRIVATE KEY-----`) |
| `SECRET_PASSWORD_VAR` | **MEDIUM** | Hardcoded password/API key/secret in variable assignment |
| `SECRET_CONNECTION_STRING` | **HIGH** | Database connection string with embedded credentials |

### 1.4 Obfuscation

| `rule_id` | Default Severity | Description |
|---|---|---|
| `OBFUSCATION_BASE64_LARGE` | **MEDIUM** | Base64 decode + execute chain |
| `OBFUSCATION_HEX_BLOB` | **MEDIUM** | Large hex-encoded blob (20+ byte sequences) |
| `OBFUSCATION_XOR_ENCODING` | **MEDIUM** | XOR in decode/execute context |
| `OBFUSCATION_BINARY_FILE` | **CRITICAL** | Binary executable included in skill package |

### 1.5 Prompt Injection

| `rule_id` | Default Severity | Description |
|---|---|---|
| `PROMPT_INJECTION_IGNORE_INSTRUCTIONS` | **HIGH** | "Ignore all previous instructions" patterns |
| `PROMPT_INJECTION_UNRESTRICTED_MODE` | **HIGH** | "Enter unrestricted/debug/developer mode" patterns |
| `PROMPT_INJECTION_BYPASS_POLICY` | **HIGH** | "Bypass content/safety policy" patterns |
| `PROMPT_INJECTION_REVEAL_SYSTEM` | **MEDIUM** | "Reveal your system prompt" patterns |
| `PROMPT_INJECTION_CONCEALMENT` | **HIGH** | "Do not tell the user" / hide actions patterns |

### 1.6 Resource Abuse

| `rule_id` | Default Severity | Description |
|---|---|---|
| `RESOURCE_ABUSE_INFINITE_LOOP` | **HIGH** | `while True` without clear exit condition |
| `RESOURCE_ABUSE_FORK_BOMB` | **CRITICAL** | Fork bomb pattern detected |
| `RESOURCE_ABUSE_LARGE_ALLOCATION` | **HIGH** | Very large memory allocation (10M+ elements) |

### 1.7 Social Engineering

| `rule_id` | Default Severity | Description |
|---|---|---|
| `SOCIAL_ENG_VAGUE_DESCRIPTION` | **LOW** | Skill description too vague or too short |
| `SOCIAL_ENG_ANTHROPIC_IMPERSONATION` | **MEDIUM** | Skill name/description may impersonate Anthropic/Claude |

### 1.8 Supply Chain

| `rule_id` | Default Severity | Description |
|---|---|---|
| `HIDDEN_FILE_WITH_CODE` | **HIGH** | Hidden dotfile containing executable code (`.py`, `.sh`, `.js`, etc.) |

### 1.9 Unauthorized Tool Use

| `rule_id` | Default Severity | Description |
|---|---|---|
| `TOOL_ABUSE_SYSTEM_PACKAGE_INSTALL` | **MEDIUM** | System package install with `sudo` |
| `TOOL_ABUSE_UNTRUSTED_PACKAGE_SOURCE` | **HIGH** | Package install from untrusted URL/VCS source |
| `TOOL_ABUSE_SYSTEM_MODIFICATION` | **CRITICAL** | `chmod 777`, `chown root`, `sudo systemctl`, `/etc/passwd` modification |

---

## 2. Programmatic Rules (Python Analyzers)

These rule_ids are emitted directly by Python analyzer code, not from YAML signature files.

### 2.1 Static Analyzer (`static.py`)

| `rule_id` | Default Severity | Emitting Condition |
|---|---|---|
| `MANIFEST_INVALID_NAME` | **INFO** | Skill name violates `[a-z0-9-]` pattern or exceeds max length |
| `MANIFEST_DESCRIPTION_TOO_LONG` | **LOW** | Description exceeds `max_description_length` (default 1024 chars) |
| `MANIFEST_MISSING_LICENSE` | **INFO** | No `license` field in SKILL.md frontmatter |
| `SOCIAL_ENG_MISLEADING_DESC` | **MEDIUM** | Description does not match actual skill behavior |
| `TOOL_ABUSE_UNDECLARED_NETWORK` | **MEDIUM** | Code uses network libraries without declaring network capability |
| `FILE_MAGIC_MISMATCH` | **CRITICAL / HIGH / MEDIUM** | File extension doesn't match actual content type (severity varies by risk) |
| `ARCHIVE_FILE_DETECTED` | **MEDIUM** | Archive file (`.zip`, `.tar.gz`, etc.) found in skill package |
| `BINARY_FILE_DETECTED` | **INFO** | Unknown binary file in skill package |
| `PYCACHE_FILES_DETECTED` | **LOW** | `__pycache__` directory with `.pyc` files |
| `HIDDEN_EXECUTABLE_SCRIPT` | **HIGH** | Hidden dotfile with code extension (`.py`, `.sh`, `.js`, etc.) |
| `HIDDEN_DATA_FILE` | **LOW** | Hidden dotfile (non-code) not in benign allowlist |
| `HIDDEN_DATA_DIR` | **LOW** | Hidden directory not in benign allowlist |
| `LAZY_LOAD_DEEP_NESTING` | **MEDIUM** | File references nested deeper than `max_reference_depth` |
| `EXCESSIVE_FILE_COUNT` | **LOW** | Skill contains more files than `max_file_count` |
| `OVERSIZED_FILE` | **LOW** | File exceeds `max_file_size_bytes` |
| `HOMOGLYPH_ATTACK` | **HIGH** | Mixed-script Unicode confusable characters in code |
| `DANGEROUS_CLEANUP` | **MEDIUM** | `rm -r` / `rm -rf` targeting paths not in `safe_rm_targets` |

### 2.2 Scanner Engine (`scanner.py`)

| `rule_id` | Default Severity | Emitting Condition |
|---|---|---|
| `UNANALYZABLE_BINARY` | **MEDIUM** | Binary file cannot be inspected by any analyzer |
| `LOW_ANALYZABILITY` | **HIGH** | Analyzability score below `analyzability_medium_risk` threshold (critically low) |
| `LOW_ANALYZABILITY` | **MEDIUM** | Analyzability score between medium and low thresholds (moderate) |
| `TRIGGER_OVERLAP_RISK` | **MEDIUM** | Two skills have >70% Jaccard-similar descriptions |
| `TRIGGER_OVERLAP_WARNING` | **LOW** | Two skills have 50-70% similar descriptions |

### 2.3 Bytecode Analyzer (`bytecode_analyzer.py`)

| `rule_id` | Default Severity | Emitting Condition |
|---|---|---|
| `BYTECODE_NO_SOURCE` | **HIGH** | `.pyc` file without matching `.py` source |
| `BYTECODE_SOURCE_MISMATCH` | **CRITICAL** | `.pyc` bytecode does not match `.py` source — possible poisoning |

### 2.4 Behavioral Analyzer (`behavioral_analyzer.py`)

| `rule_id` | Default Severity | Emitting Condition |
|---|---|---|
| `BEHAVIOR_ENV_VAR_EXFILTRATION` | **CRITICAL** | Script accesses env vars AND makes network calls |
| `BEHAVIOR_CREDENTIAL_FILE_ACCESS` | **HIGH** | Script accesses credential files |

### 2.5 Pipeline Analyzer (`pipeline_analyzer.py`)

| `rule_id` | Default Severity | Emitting Condition |
|---|---|---|
| `PIPELINE_TAINT_FLOW` | **Varies** | Dangerous data flow in command pipeline (see note below) |

> **`PIPELINE_TAINT_FLOW` severity logic**: The pipeline analyzer assigns severity dynamically based on the taint chain:
> - **CRITICAL** — Sensitive data (credentials, env vars) flows to a network sink or execution sink
> - **HIGH** — Code execution via piped commands (`curl | bash`)
> - **MEDIUM** — Suspicious data flow patterns (e.g., file read piped to unknown commands)
> - **LOW** — Known installer domain (`curl https://sh.rustup.rs | sh`) or demoted documentation context

### 2.6 Content Extractor (`content_extractor.py`)

| `rule_id` | Default Severity | Emitting Condition |
|---|---|---|
| `ARCHIVE_EXTRACTION_FAILED` | **MEDIUM** | Archive could not be extracted for analysis |
| `ARCHIVE_NESTED_TOO_DEEP` | **HIGH** | Archive nesting exceeds max depth (possible zip bomb) |

### 2.7 Cross-Skill Scanner (`cross_skill_scanner.py`)

| `rule_id` | Default Severity | Emitting Condition |
|---|---|---|
| `CROSS_SKILL_DATA_RELAY` | **HIGH** | Skills form a data relay chain (collector → exfiltrator) |
| `CROSS_SKILL_SHARED_URL` | **MEDIUM** | Multiple skills reference the same external domain |

### 2.8 Trigger Analyzer (`trigger_analyzer.py`)

| `rule_id` | Default Severity | Emitting Condition |
|---|---|---|
| `TRIGGER_OVERLY_GENERIC` | **MEDIUM** | Description matches generic/broad activation patterns |
| `TRIGGER_DESCRIPTION_TOO_SHORT` | **LOW** | Description has fewer than 5 words |

### 2.9 Allowed-Tools Checks (`allowed_tools_checks.py`)

| `rule_id` | Default Severity | Emitting Condition |
|---|---|---|
| `ALLOWED_TOOLS_READ_VIOLATION` | **MEDIUM** | Code reads files but `Read` tool not in `allowed-tools` |
| `ALLOWED_TOOLS_WRITE_VIOLATION` | **MEDIUM** | Code writes files but `Write` tool not in `allowed-tools` |

### 2.10 LLM Analyzer (`llm_analyzer.py`)

| `rule_id` | Default Severity | Emitting Condition |
|---|---|---|
| `LLM_CONTEXT_BUDGET_EXCEEDED` | **INFO** | File excluded from LLM analysis because it exceeds context budget |
| `LLM_PROMPT_INJECTION_DETECTED` | **HIGH** | LLM semantic analysis detected prompt injection |

> LLM-generated findings (from `--use-llm`) may emit additional dynamic `rule_id` values (e.g., `LLM_COMMAND_INJECTION`, `LLM_DATA_EXFILTRATION`) based on the LLM's threat classification. Their severity comes from `ThreatMapping.LLM_THREATS`.

---

## 3. YARA Rules

Defined in `skill_scanner/data/packs/core/yara/*.yara`. When a YARA rule matches, the `rule_id` becomes `YARA_<rule_name>`, and the severity is determined by mapping the rule's threat category through `ThreatMapping.YARA_THREATS` in `threats.py`.

| `rule_id` | Default Severity | Threat Category | Description |
|---|---|---|---|
| `YARA_code_execution_generic` | **LOW** | Code Execution | Generic code execution primitives (eval, exec, system calls) |
| `YARA_command_injection_generic` | **CRITICAL** | Command Injection | Shell injection patterns, command chaining |
| `YARA_coercive_injection_generic` | **HIGH** | Prompt Injection | Coercive override of agent behavior / instructions |
| `YARA_prompt_injection_generic` | **HIGH** | Prompt Injection | Direct prompt injection patterns |
| `YARA_prompt_injection_unicode_steganography` | **HIGH** | Prompt Injection | Hidden Unicode zero-width characters for steganographic injection |
| `YARA_indirect_prompt_injection_generic` | **HIGH** | Transitive Trust Abuse | Indirect prompt injection via external content |
| `YARA_script_injection_generic` | **HIGH** | Injection Attack | Script injection patterns (XSS-style) |
| `YARA_sql_injection_generic` | **HIGH** | Injection Attack | SQL injection patterns |
| `YARA_credential_harvesting_generic` | **HIGH** | Credential Harvesting | Credential theft / harvesting patterns |
| `YARA_system_manipulation_generic` | **MEDIUM** | System Manipulation | System file/config modification patterns |
| `YARA_capability_inflation_generic` | **MEDIUM** | Skill Discovery Abuse | Keyword baiting, over-broad descriptions |
| `YARA_autonomy_abuse_generic` | **HIGH** | Autonomy Abuse | Unbounded retries, ignore errors, skip confirmation |
| `YARA_tool_chaining_abuse_generic` | **HIGH** | Tool Chaining Abuse | Read→send, collect→upload multi-step exfiltration |
| `YARA_embedded_binary_detection` | **HIGH** | Obfuscation | Embedded binary data in text files |

---

## 4. LLM Threat Mapping Severities

When the LLM analyzer (`--use-llm`) classifies a threat, the severity comes from `ThreatMapping.LLM_THREATS`:

| Threat Name | Default Severity | Description |
|---|---|---|
| PROMPT INJECTION | **HIGH** | Direct instruction override in prompts |
| DATA EXFILTRATION | **HIGH** | Unauthorized data exposure via agent tooling |
| TOOL POISONING | **HIGH** | Corrupting/tampering with tool behavior |
| TOOL SHADOWING | **HIGH** | Disguising malicious tools as legitimate ones |
| COMMAND INJECTION | **CRITICAL** | Injecting malicious command payloads |

## 5. Behavioral Threat Mapping Severities

When the behavioral analyzer classifies a threat, the severity comes from `ThreatMapping.BEHAVIORAL_THREATS`:

| Threat Name | Default Severity | Description |
|---|---|---|
| PROMPT INJECTION | **HIGH** | Malicious manipulation of tool metadata |
| RESOURCE EXHAUSTION | **MEDIUM** | System overload via repeated invocations |

---

## Summary: Severity Distribution

| Severity | Count (approx.) | Examples |
|---|---|---|
| **CRITICAL** | ~20 | `COMMAND_INJECTION_EVAL`, `SECRET_AWS_KEY`, `BYTECODE_SOURCE_MISMATCH`, `BEHAVIOR_ENV_VAR_EXFILTRATION` |
| **HIGH** | ~30 | `PROMPT_INJECTION_*`, `FIND_EXEC_PATTERN`, `YARA_autonomy_abuse_generic`, `BYTECODE_NO_SOURCE` |
| **MEDIUM** | ~20 | `DATA_EXFIL_NETWORK_REQUESTS`, `ARCHIVE_FILE_DETECTED`, `GLOB_HIDDEN_FILE_TARGETING`, `UNANALYZABLE_BINARY` |
| **LOW** | ~10 | `SOCIAL_ENG_VAGUE_DESCRIPTION`, `EXCESSIVE_FILE_COUNT`, `OVERSIZED_FILE`, `PYCACHE_FILES_DETECTED` |
| **INFO** | ~4 | `MANIFEST_INVALID_NAME`, `MANIFEST_MISSING_LICENSE`, `BINARY_FILE_DETECTED`, `LLM_CONTEXT_BUDGET_EXCEEDED` |

---

## Overriding Default Severities

To change the severity for any rule, add a `severity_overrides` entry in your policy YAML:

```yaml
severity_overrides:
  - rule_id: BINARY_FILE_DETECTED
    severity: MEDIUM
    reason: "Our policy treats unknown binaries as medium risk"

  - rule_id: ARCHIVE_FILE_DETECTED
    severity: LOW
    reason: "Archives are expected in our skill packages"
```

To completely suppress a rule:

```yaml
disabled_rules:
  - LAZY_LOAD_DEEP_NESTING
  - MANIFEST_INVALID_NAME
```

See the [Scan Policy Guide](https://github.com/cisco-ai-defense/skill-scanner/blob/main/docs/user-guide/custom-policy-configuration.md) for full details.

---

## Preset-Specific Overrides

The built-in presets apply these overrides **on top of** the baseline severities documented above:

### `strict` preset

| `rule_id` | Overridden To | Reason |
|---|---|---|
| `BINARY_FILE_DETECTED` | **MEDIUM** | Strict orgs flag all unknown binaries |
| `HIDDEN_DATA_FILE` | **MEDIUM** | Strict orgs flag all hidden files |
| `PYCACHE_FILES_DETECTED` | **MEDIUM** | Strict orgs flag bytecode cache |

### `permissive` preset

| `rule_id` | Overridden To | Reason |
|---|---|---|
| `ARCHIVE_FILE_DETECTED` | **LOW** | Archives expected in trusted environments |
| `TOOL_ABUSE_SYSTEM_PACKAGE_INSTALL` | **LOW** | Package installs common in internal tooling |
| `DATA_EXFIL_JS_FS_ACCESS` | **MEDIUM** | FS access common in trusted Node.js skills |

The `permissive` preset also **disables** 8 rules entirely: `LAZY_LOAD_DEEP_NESTING`, `MANIFEST_INVALID_NAME`, `capability_inflation_generic`, `indirect_prompt_injection_generic`, `GLOB_HIDDEN_FILE_TARGETING`, `HOMOGLYPH_ATTACK`, `YARA_embedded_binary_detection`, `DATA_EXFIL_JS_NETWORK`.
