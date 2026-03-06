# Skill Scanner Integration Analysis

**Last Updated:** 12026-03-02
**Status:** Technical Reference

## Overview

This document summarizes an evidence-based analysis of integrating `cisco-ai-skill-scanner` with this repository's GitHub Actions workflow. It covers implementation behavior, VirusTotal public API risk, model selection for LLM/Meta analyzers, and practical full-scan cost/time estimates for the current repository scale.

Scope includes:

- Upstream implementation analysis: `cisco-ai-defense/skill-scanner`
- Local workflow analysis: `.github/workflows/skill-scanner.yml`
- Operational assumptions as of 12026-03 (provider docs and upstream defaults)

## Local Workflow Facts

Current workflow behavior is defined in `.github/workflows/skill-scanner.yml`.

- Two full-scan targets are used in scheduled/manual runs:
  - `catalog/skills`
  - `.agents/skills`
- Current skill counts used for estimation:
  - `catalog/skills`: 118
  - `.agents/skills`: 15
  - Total: 133 skills
- LLM and Meta are both enabled in scan command flags:
  - `--use-llm`
  - `--enable-meta`
- VirusTotal is enabled:
  - `--use-virustotal`
- Current model setting is pinned via env in workflow (OpenAI snapshot-style model name).

## Upstream Implementation Findings

### Request Construction and Provider Calls

The effective call chain is:

1. `LLMAnalyzer.analyze_async()`
2. `LLMRequestHandler.make_request()`
3. Provider call:
   - LiteLLM path: `litellm.acompletion(**request_params)`
   - Google SDK path: `client.models.generate_content(..., config=config_dict)`

Relevant upstream files:

- `skill_scanner/core/analyzers/llm_analyzer.py`
- `skill_scanner/core/analyzers/llm_request_handler.py`
- `skill_scanner/core/analyzers/llm_provider_config.py`
- `skill_scanner/core/analyzers/meta_analyzer.py`

### Reasoning Effort Parameter Handling

Current implementation does **not** pass `reasoning_effort` or equivalent reasoning-control parameters to model calls.

LLM request params currently include only:

- `model`
- `messages`
- `max_tokens`
- `temperature`
- `timeout`
- provider auth/base params (e.g. `api_key`, `api_base`, `api_version`, `aws_region_name`)
- structured output fields (`response_format` or SDK schema config)

No reasoning-specific control key is forwarded in default LLM or Meta paths.

### Meta Analyzer Behavior

Meta analyzer is a second-pass LLM stage over prior findings, with these practical runtime effects:

- One main Meta call per analyzed skill when enabled.
- Optional follow-up pass may run when first pass leaves findings unclassified.
- This can materially increase both latency and cost versus LLM-only mode.

## VirusTotal Public API Risk Assessment

### Official Public Limits

VirusTotal public API limits are documented as approximately:

- 4 requests/minute
- 500 requests/day

Reference:

- `https://docs.virustotal.com/reference/public-vs-premium-api`
- `https://docs.virustotal.com/docs/consumption-quotas-handled`

### Practical Impact for This Repository

Skill-scanner VT analysis is binary-focused. At analysis time, current skill trees include 2 binary candidates:

- `catalog/skills/theme-factory/theme-showcase.pdf`
- `catalog/skills/web-artifacts-builder/scripts/shadcn-components.tar.gz`

With current binary volume, quota exhaustion risk is low for occasional full scans. However, structural risk remains:

- If binary file count grows, 4/min can bottleneck quickly.
- Concurrent workflow activity can cause intermittent 429 responses.
- In practice, VT degradation can appear as reduced signal quality (missed checks) instead of hard workflow failure, depending on error handling path.

### Risk Summary

- Current state risk: low to medium
- Growth-state risk (more binaries/more triggers): medium to high
- Governance note: public API usage policy should be revalidated for production/commercial CI use cases

## Model Selection Guidance (LLM vs Meta)

### Decision Principle

Use different models for LLM and Meta when possible to reduce correlated blind spots, while preserving operational reliability.

### Recommended Operating Profiles

1. Stability/Reproducibility-first

- LLM: `gpt-5.2` snapshot pin (or fixed version alias policy)
- Meta: `gpt-4.1`
- Why: strong determinism and lower operational complexity with same provider

2. Accuracy-first (cross-provider)

- LLM: `gpt-5.2`
- Meta: `claude-opus-4-6`
- Why: stronger cross-model diversity for adjudication-style second pass

3. Cost/Throughput-first

- LLM: `gpt-5-mini`
- Meta: `gpt-4.1`
- Why: lower average cost with acceptable quality in broad CI gating contexts

### Important Caveats

- Do not assume Anthropic prompt-caching savings unless scanner call path explicitly configures provider caching controls in runtime requests.
- Snapshot pinning is not automatically bad; it improves reproducibility if lifecycle is managed.
- For mixed-provider configurations, account for added key management, quota management, and incident surface area.

## Estimated Full-Scan Cost (Current 133 Skills)

The estimates below are directional. They assume:

- LLM + Meta both enabled
- consensus runs = 1
- no systemic retry storm
- standard API pricing tiers

Estimated cost per full scan (split-model profile assumptions):

- Stability-first (`gpt-5.2` + `gpt-4.1`): about **5.79 to 11.86 USD** (central estimate **7.74 USD**)
- Accuracy-first (`gpt-5.2` + `claude-opus-4-6`): about **11.01 to 23.17 USD** (central estimate **14.84 USD**)
- Cost-first (`gpt-5-mini` + `gpt-4.1`): about **3.47 to 7.39 USD** (central estimate **4.71 USD**)

Notes:

- Meta follow-up behavior can increase totals beyond central values.
- Consensus mode (`--llm-consensus-runs > 1`) scales LLM cost roughly linearly with run count.
- These are model-topology-specific estimates. Do not compare directly with single-model runs.

### Empirical Cost Validation (Single-Model `gpt-5.2`, n=1)

Observed full-scan run (legacy single-model setup, LLM and Meta both `gpt-5.2`):

- Requests: **385**
- Input tokens: **2.673M**
- Billed cost: **9.81 USD**

Arithmetic check against official GPT-5.2 pricing (`1.75 USD/1M input`, `14 USD/1M output`):

- Input-only floor: `2.673 x 1.75 = 4.67775 USD`
- Implied output spend: `9.81 - 4.67775 = 5.13225 USD`
- Implied output tokens: `5.13225 / 14 x 1,000,000 = ~366,589 tokens`

Validation judgment:

- The observed **9.81 USD** is arithmetically consistent.
- It should be treated as an anchor point for **single-model gpt-5.2** profile only.
- It does not invalidate split-model estimates above, but it indicates real-world runs can sit near upper-mid cost bands when request count and output tokens are elevated.

## Estimated Full-Scan Duration (Current 133 Skills)

Wall-clock estimates combine:

- Upstream benchmark context (`evals/README.md`): static-only baseline ranges
- Model speed character from provider docs
- Sequential per-skill processing characteristics in scanner pipeline

Estimated duration per full scan (split-model profile assumptions):

- Cost-first (`gpt-5-mini` + `gpt-4.1`): about **14 to 24 min** (high-latency case up to **~42 min**)
- Stability-first (`gpt-5.2` + `gpt-4.1`): about **19 to 30 min** (high-latency case up to **~52 min**)
- Accuracy-first (`gpt-5.2` + `claude-opus-4-6`): about **27 to 45 min** (high-latency case up to **~81 min**)

Notes:

- These are CI planning ranges, not SLA guarantees.
- Retry/backoff and provider-side variance dominate tail latency.
- Catalog and dev scans run sequentially in this workflow, so total wall-clock is additive.

### Empirical Duration Validation (Single-Model `gpt-5.2`, n=1)

Observed full-scan run (legacy single-model setup):

- Catalog scan: **1h 2m 2s**
- Dev scan: **9m 50s**
- Total: **1h 11m 52s**

Validation judgment:

- This exceeds the split-model stability high-latency marker (`~52 min`), so it should be tracked as a separate **single-model gpt-5.2 tail-path observation**.
- With only one sample, this should not be used to narrow ranges; use it as an observed upper anchor until additional runs are collected.

## Recommended Policy for This Repository

1. Default profile for routine CI:

- Use stability-first profile (`gpt-5.2` + `gpt-4.1`)
- Keep VT enabled for now, but monitor binary growth and 429 frequency

2. Deep review profile (manual/scheduled):

- Use accuracy-first profile on selected branches or scheduled jobs
- Reserve for high-risk imports/ports or pre-release hardening

3. Budget control profile:

- Use cost-first profile for broad frequent scans
- Escalate only high-risk subsets to higher-cost profile

4. Implementation backlog item:

- If reasoning-level control is needed, extend `LLMAnalyzer`/`LLMRequestHandler` to explicitly pass provider-specific reasoning parameters.

## References

### Local

- `.github/workflows/skill-scanner.yml`

### Upstream Skill Scanner

- `https://github.com/cisco-ai-defense/skill-scanner`
- `https://raw.githubusercontent.com/cisco-ai-defense/skill-scanner/main/skill_scanner/core/analyzers/llm_analyzer.py`
- `https://raw.githubusercontent.com/cisco-ai-defense/skill-scanner/main/skill_scanner/core/analyzers/llm_request_handler.py`
- `https://raw.githubusercontent.com/cisco-ai-defense/skill-scanner/main/skill_scanner/core/analyzers/meta_analyzer.py`
- `https://raw.githubusercontent.com/cisco-ai-defense/skill-scanner/main/skill_scanner/core/analyzers/llm_provider_config.py`

### Provider / External

- VirusTotal API limits:
  - `https://docs.virustotal.com/reference/public-vs-premium-api`
  - `https://docs.virustotal.com/docs/consumption-quotas-handled`
- OpenAI model/pricing pages:
  - `https://developers.openai.com/api/docs/models/gpt-5.2`
  - `https://developers.openai.com/api/docs/models/gpt-5-mini`
  - `https://developers.openai.com/api/docs/models/gpt-4.1`
  - `https://developers.openai.com/api/docs/pricing`
- Anthropic model/pricing pages:
  - `https://docs.anthropic.com/en/docs/about-claude/models/overview`
  - `https://docs.anthropic.com/en/about-claude/pricing`
