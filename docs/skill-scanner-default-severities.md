# Cisco Skill Scanner — Default Severity by Rule ID

> **Source**: [`cisco-ai-defense/skill-scanner`](https://github.com/cisco-ai-defense/skill-scanner) (v2.0.0, commit `67a29d9`)
>
> **Last updated**: 12026-03-04
>
> This document catalogs every `rule_id` emitted by the Cisco Skill Scanner and its **default severity** when no `severity_overrides` are applied (i.e., the `balanced` preset / `default_policy.yaml`).

---

## How Severity Is Determined

Severities come from **three distinct layers**, evaluated in this order:

1. **Hardcoded in source** — Python analyzers and YAML signature files define the baseline severity for each rule.
2. **YARA threat mapping** — YARA rule matches are mapped to a threat category via `ThreatMapping.YARA_THREATS` in `skill_scanner/threats/threats.py`, which assigns severity per threat type.
3. **Policy overrides** — The active scan policy can raise or lower any rule's severity. The default `balanced` preset ships with **no overrides** (`severity_overrides: []`).

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
| `BEHAVIOR_ENV_VAR_HARVESTING` | **MEDIUM** | Script iterates through environment variables (even without network) |
| `BEHAVIOR_SUSPICIOUS_URL` | **HIGH** | Script contains suspicious URL that may be used for data exfiltration |
| `BEHAVIOR_EVAL_SUBPROCESS` | **CRITICAL** | `eval`/`exec` combined with `subprocess` in same file |
| `BEHAVIOR_BASH_TAINT_FLOW` | **Varies** | Bash script taint flow from sensitive source to dangerous sink (see note) |
| `BEHAVIOR_CROSSFILE_*` | **Varies** | Cross-file correlation findings (dynamic `rule_id`, see note) |
| `BEHAVIOR_ALIGNMENT_*` | **Varies** | LLM-powered alignment verification mismatch (dynamic `rule_id`, see note) |
| `MDBLOCK_PYTHON_EVAL_EXEC` | **HIGH** | Python code block in markdown uses `eval`/`exec` |
| `MDBLOCK_PYTHON_SUBPROCESS` | **MEDIUM** | Python code block in markdown executes shell commands |
| `MDBLOCK_PYTHON_HTTP_POST` | **MEDIUM** | Python code block in markdown sends HTTP POST request |

> **`BEHAVIOR_BASH_TAINT_FLOW` severity logic**: Assigned dynamically based on taint type and sink:
> - **CRITICAL** — Credential/sensitive file data flows to network sink (`curl`, `wget`, `nc`)
> - **HIGH** — Network-sourced data flows to execution sink (remote code execution vector)
> - **MEDIUM** — Other tainted data flows to dangerous sinks
>
> **`BEHAVIOR_CROSSFILE_*` dynamic rule_ids**: Generated as `BEHAVIOR_CROSSFILE_{threat_type}` from cross-file correlation analysis. Examples: `BEHAVIOR_CROSSFILE_EXFILTRATION_CHAIN`, `BEHAVIOR_CROSSFILE_CREDENTIAL_NETWORK_SEPARATION`, `BEHAVIOR_CROSSFILE_ENV_VAR_EXFILTRATION`. Severity is CRITICAL/HIGH/MEDIUM depending on the correlation type.
>
> **`BEHAVIOR_ALIGNMENT_*` dynamic rule_ids**: Generated as `BEHAVIOR_ALIGNMENT_{threat_name}` from LLM-powered alignment verification (requires `--use-alignment`). Examples: `BEHAVIOR_ALIGNMENT_DATA_EXFILTRATION`, `BEHAVIOR_ALIGNMENT_COMMAND_INJECTION`, `BEHAVIOR_ALIGNMENT_HIDDEN_FUNCTIONALITY`. Severity is determined by the LLM's assessment.

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
| `ARCHIVE_ZIP_BOMB` | **CRITICAL** | Archive compression ratio exceeds threshold (zip bomb) |
| `ARCHIVE_PATH_TRAVERSAL` | **CRITICAL** | Archive entry contains path traversal (`..` or absolute path) |
| `ARCHIVE_SYMLINK` | **CRITICAL** | Archive contains symlink/hardlink entry (can escape extraction directory) |
| `OFFICE_VBA_MACRO` | **CRITICAL** | VBA macro detected in Office document (`.docx`/`.xlsx`/`.pptx`) |
| `OFFICE_EMBEDDED_OLE` | **HIGH** | Embedded OLE object in Office document (can contain executables) |

### 2.7 Cross-Skill Scanner (`cross_skill_scanner.py`)

| `rule_id` | Default Severity | Emitting Condition |
|---|---|---|
| `CROSS_SKILL_DATA_RELAY` | **HIGH** | Skills form a data relay chain (collector → exfiltrator) |
| `CROSS_SKILL_SHARED_URL` | **MEDIUM** | Multiple skills reference the same external domain |
| `CROSS_SKILL_COMPLEMENTARY_TRIGGERS` | **LOW** | Skills have complementary descriptions (collector + sender) |
| `CROSS_SKILL_SHARED_PATTERN` | **MEDIUM** | Multiple skills share suspicious code patterns (e.g., base64, eval, exec) |

### 2.8 Trigger Analyzer (`trigger_analyzer.py` / `trigger_checks.py`)

| `rule_id` | Default Severity | Emitting Condition |
|---|---|---|
| `TRIGGER_OVERLY_GENERIC` | **MEDIUM** | Description matches generic/broad activation patterns |
| `TRIGGER_DESCRIPTION_TOO_SHORT` | **LOW** | Description has fewer than 5 words |
| `TRIGGER_VAGUE_DESCRIPTION` | **LOW** | Description has >40% generic words and <2 specific technical indicators |
| `TRIGGER_KEYWORD_BAITING` | **MEDIUM** | Description contains suspiciously long keyword list (SEO-style baiting) |

### 2.9 Allowed-Tools Checks (`allowed_tools_checks.py`)

| `rule_id` | Default Severity | Emitting Condition |
|---|---|---|
| `ALLOWED_TOOLS_READ_VIOLATION` | **MEDIUM** | Code reads files but `Read` tool not in `allowed-tools` |
| `ALLOWED_TOOLS_WRITE_VIOLATION` | **MEDIUM** | Code writes files but `Write` tool not in `allowed-tools` |
| `ALLOWED_TOOLS_BASH_VIOLATION` | **HIGH** | Code executes bash/shell commands but `Bash` tool not in `allowed-tools` |
| `ALLOWED_TOOLS_GREP_VIOLATION` | **LOW** | Code uses regex search/grep patterns but `Grep` tool not in `allowed-tools` |
| `ALLOWED_TOOLS_GLOB_VIOLATION` | **LOW** | Code uses glob/file patterns but `Glob` tool not in `allowed-tools` |
| `ALLOWED_TOOLS_NETWORK_USAGE` | **MEDIUM** | Code makes network requests (not controlled by `allowed-tools`, but flagged for documentation) |

### 2.10 Asset File Checks (`asset_checks.py`)

| `rule_id` | Default Severity | Emitting Condition |
|---|---|---|
| `ASSET_PROMPT_INJECTION` | **HIGH / MEDIUM** | Prompt injection pattern in asset/template/reference file (HIGH for "ignore previous instructions"; MEDIUM for "you are now" role reassignment) |
| `ASSET_SUSPICIOUS_URL` | **MEDIUM** | Suspicious free-domain URL (`.tk`, `.ml`, `.ga`, `.cf`, `.gq`) in asset file |

### 2.11 External Tool Checks (`external_tool_checks.py`)

| `rule_id` | Default Severity | Emitting Condition |
|---|---|---|
| `PDF_STRUCTURAL_THREAT` | **Varies** | PDF contains suspicious structural elements detected by `pdfid` (see note) |
| `OFFICE_DOCUMENT_THREAT` | **Varies** | Office document contains suspicious indicators detected by `oletools` (see note) |

> **`PDF_STRUCTURAL_THREAT` severity logic**: Determined by the most dangerous PDF keyword found:
> - **CRITICAL** — `/JS`, `/JavaScript`, `/Launch` (embedded JavaScript or external app launch)
> - **HIGH** — `/OpenAction`, `/AA` (auto-execute actions)
> - **MEDIUM** — `/EmbeddedFile`, `/RichMedia`, `/XFA` (embedded content or forms with script capability)
> - **LOW** — `/AcroForm` (interactive form fields)
>
> **`OFFICE_DOCUMENT_THREAT` severity logic**: Determined by the indicator type:
> - **CRITICAL** — VBA macros or XLM/Excel4 macros detected
> - **HIGH** — Document is encrypted (resists analysis)
> - **MEDIUM** — Embedded Flash, OLE objects, or external relationships

### 2.12 File Inventory Checks (`file_inventory_checks.py`)

| `rule_id` | Default Severity | Emitting Condition |
|---|---|---|
| `ARCHIVE_CONTAINS_EXECUTABLE` | **HIGH** | Executable script (`.py`, `.sh`) extracted from archive — concealed code |

> Note: `EXCESSIVE_FILE_COUNT` and `OVERSIZED_FILE` are also emitted from this module but listed in §2.1 as they were originally part of `static.py`.

### 2.13 LLM Analyzer (`llm_analyzer.py`)

| `rule_id` | Default Severity | Emitting Condition |
|---|---|---|
| `LLM_CONTEXT_BUDGET_EXCEEDED` | **INFO** | File excluded from LLM analysis because it exceeds context budget |
| `LLM_PROMPT_INJECTION_DETECTED` | **HIGH** | Skill content contains delimiter injection attempt against the LLM prompt |
| `LLM_ANALYSIS_FAILED` | **INFO** | LLM API call failed (network error, auth failure, timeout) |
| `LLM_*` (dynamic) | **Varies** | LLM-classified threat findings (see note) |

> **Dynamic LLM rule_ids**: Generated as `LLM_{CATEGORY}` from AITech taxonomy classification. The `rule_id` is derived from the `ThreatCategory` enum value (uppercased). Examples:
> - `LLM_PROMPT_INJECTION` — AITech-1.1 (severity from `ThreatMapping.LLM_THREATS`)
> - `LLM_DATA_EXFILTRATION` — AITech-8.2
> - `LLM_COMMAND_INJECTION` — AITech-9.1
> - `LLM_UNAUTHORIZED_TOOL_USE` — AITech-12.1
> - `LLM_OBFUSCATION` — AITech-9.2
> - `LLM_POLICY_VIOLATION` — fallback for unclassified threats
>
> Severities come from `ThreatMapping.LLM_THREATS` (see §4). The `--consensus N` flag runs N independent LLM evaluations and keeps only findings with majority agreement.

### 2.14 Meta Analyzer (`meta_analyzer.py`)

| `rule_id` | Default Severity | Emitting Condition |
|---|---|---|
| `META_DETECTED` | **Varies** | New threat found by meta-analysis that all other analyzers missed |

> The meta analyzer (enabled via `--enable-meta`) is a second-pass LLM review of all findings from other analyzers. It validates/filters findings and can detect missed threats. `META_DETECTED` findings inherit severity from the LLM's assessment, mapped through `ThreatMapping` AITech codes. It also emits `LLM_CONTEXT_BUDGET_EXCEEDED` for files that exceed the meta-analysis budget.

### 2.15 VirusTotal Analyzer (`virustotal_analyzer.py`)

| `rule_id` | Default Severity | Emitting Condition |
|---|---|---|
| `VIRUSTOTAL_MALICIOUS_FILE` | **Varies** | Binary file flagged as malicious by VirusTotal engines |

> **`VIRUSTOTAL_MALICIOUS_FILE` severity logic**: Determined by the number of AV engines that flag the file:
> - **CRITICAL** — 5+ engines flag the file as malicious
> - **HIGH** — 2-4 engines flag the file
> - **MEDIUM** — 1 engine flags the file
>
> Enabled via `--use-virustotal` with `SKILL_SCANNER_VT_API_KEY`. Only scans binary file types (images, PDFs, archives, executables); excludes text/code files. Files validated as safe by VirusTotal suppress the `BINARY_FILE_DETECTED` finding for the same file.

### 2.16 AI Defense Analyzer (`aidefense_analyzer.py`)

| `rule_id` | Default Severity | Emitting Condition |
|---|---|---|
| `AIDEFENSE_BLOCKED` | **HIGH** | Cisco AI Defense API blocked the content |
| `AIDEFENSE_CODE_BLOCKED` | **HIGH** | Cisco AI Defense API blocked code content |
| `AIDEFENSE_RULE_*` (dynamic) | **Varies** | AI Defense rule-specific trigger (rule name in suffix) |
| `AIDEFENSE_CODE_RULE_*` (dynamic) | **Varies** | AI Defense code-specific rule trigger |
| `AIDEFENSE_VULN_*` (dynamic) | **Varies** | AI Defense vulnerability detection |

> The AI Defense analyzer integrates with Cisco's cloud-based AI Defense API. It is an optional enterprise feature and is not enabled by default. Dynamic rule_ids are constructed from the API's classification response.

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

## 6. YARA Threat Category Mapping Severities

When a YARA rule matches, the threat category name from the rule's metadata is looked up in `ThreatMapping.YARA_THREATS` to determine severity. Additional categories beyond the specific YARA rules listed in §3:

| Threat Category | Default Severity | Description |
|---|---|---|
| HARDCODED SECRETS | **CRITICAL** | Hardcoded credentials, API keys, or secrets in code |
| OBFUSCATION | **HIGH** | Deliberately obfuscated code to hide malicious intent |
| UNAUTHORIZED TOOL USE | **MEDIUM** | Using tools or capabilities beyond declared permissions |
| SOCIAL ENGINEERING | **MEDIUM** | Misleading descriptions or deceptive metadata |
| RESOURCE ABUSE | **MEDIUM** | Excessive resource consumption or denial of service |
| DATA EXFILTRATION | **CRITICAL** | Unauthorized exposure or exfiltration of sensitive information |
| SUPPLY CHAIN ATTACK | **HIGH** | Bytecode poisoning, archive payload delivery, or dependency replacement |

---

## Summary: Severity Distribution

| Severity | Count (approx.) | Examples |
|---|---|---|
| **CRITICAL** | ~25 | `COMMAND_INJECTION_EVAL`, `SECRET_AWS_KEY`, `BYTECODE_SOURCE_MISMATCH`, `BEHAVIOR_ENV_VAR_EXFILTRATION`, `ARCHIVE_ZIP_BOMB`, `ARCHIVE_PATH_TRAVERSAL`, `OFFICE_VBA_MACRO`, `BEHAVIOR_EVAL_SUBPROCESS` |
| **HIGH** | ~35 | `PROMPT_INJECTION_*`, `FIND_EXEC_PATTERN`, `YARA_autonomy_abuse_generic`, `BYTECODE_NO_SOURCE`, `ALLOWED_TOOLS_BASH_VIOLATION`, `ARCHIVE_CONTAINS_EXECUTABLE`, `OFFICE_EMBEDDED_OLE`, `ASSET_PROMPT_INJECTION`, `BEHAVIOR_SUSPICIOUS_URL` |
| **MEDIUM** | ~25 | `DATA_EXFIL_NETWORK_REQUESTS`, `ARCHIVE_FILE_DETECTED`, `GLOB_HIDDEN_FILE_TARGETING`, `UNANALYZABLE_BINARY`, `BEHAVIOR_ENV_VAR_HARVESTING`, `TRIGGER_KEYWORD_BAITING`, `ALLOWED_TOOLS_NETWORK_USAGE`, `ASSET_SUSPICIOUS_URL` |
| **LOW** | ~12 | `SOCIAL_ENG_VAGUE_DESCRIPTION`, `EXCESSIVE_FILE_COUNT`, `OVERSIZED_FILE`, `PYCACHE_FILES_DETECTED`, `TRIGGER_VAGUE_DESCRIPTION`, `ALLOWED_TOOLS_GREP_VIOLATION`, `ALLOWED_TOOLS_GLOB_VIOLATION` |
| **INFO** | ~5 | `MANIFEST_INVALID_NAME`, `MANIFEST_MISSING_LICENSE`, `BINARY_FILE_DETECTED`, `LLM_CONTEXT_BUDGET_EXCEEDED`, `LLM_ANALYSIS_FAILED` |

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
