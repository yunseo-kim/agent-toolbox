# Bug: `temperature` Parameter Causes `UnsupportedParamsError` on GPT-5 Models

**Upstream:** [cisco-ai-defense/skill-scanner](https://github.com/cisco-ai-defense/skill-scanner)
**Version:** 2.0.1 (commit [`67a29d9`](https://github.com/cisco-ai-defense/skill-scanner/commit/67a29d9e1a54cef87d0dc77a889ec13ac1357f23))
**Date:** 12026-03-07
**Status:** Fixed upstream — merged in [2.0.2](https://github.com/cisco-ai-defense/skill-scanner/releases/tag/2.0.2)
**Upstream PR:** [cisco-ai-defense/skill-scanner#56](https://github.com/cisco-ai-defense/skill-scanner/pull/56) — `feat: add GPT-5 model support via drop_params=True`

---

## Summary

The scanner unconditionally passes `temperature` to `litellm.acompletion()` in all LLM request paths. GPT-5 series models do not support `temperature` (only `temperature=1` is allowed), causing every LLM analysis call to fail with `litellm.UnsupportedParamsError`. This silently degrades the scan — the LLM analyzer and meta-analyzer produce zero findings, and the scan completes with reduced coverage.

## Symptom

```
LLM analysis failed for create-pr: litellm.UnsupportedParamsError: gpt-5 models
(including gpt-5-codex) don't support temperature=0.0. Only temperature=1 is
supported. For gpt-5.1, temperature is supported when reasoning_effort='none'
(or not specified, as it defaults to 'none'). To drop unsupported params set
`litellm.drop_params = True`
```

Every skill triggers this error. The scan completes but with **no LLM-based findings** — the most security-critical analyzer is effectively disabled.

## Root Cause

`temperature` is unconditionally included in `request_params` for every `acompletion()` call. LiteLLM validates model-specific parameter support and raises `UnsupportedParamsError` for models that do not accept the parameter. GPT-5 series models (gpt-5, gpt-5-codex, gpt-5.1 with default reasoning_effort, gpt-5.2, gpt-5.4, etc.) do not support `temperature!=1`.

### Affected Call Site 1: `LLMRequestHandler._make_litellm_request()`

[`llm_request_handler.py#L210-L217`](https://github.com/cisco-ai-defense/skill-scanner/blob/67a29d9e1a54cef87d0dc77a889ec13ac1357f23/skill_scanner/core/analyzers/llm_request_handler.py#L210-L217):

```python
request_params = {
    "model": self.provider_config.model,
    "messages": messages,
    "max_tokens": self.max_tokens,
    "temperature": self.temperature,    # <-- always passed (default 0.0)
    "timeout": self.timeout,
    **self.provider_config.get_request_params(),
}
# ...
response = await acompletion(**request_params)
```

This is the primary LLM path used by both `LLMAnalyzer` and `MetaAnalyzer`. The default temperature is `0.0` for `LLMAnalyzer` and `0.1` for `MetaAnalyzer` — both incompatible with GPT-5.

### Affected Call Site 2: `AlignmentLLMClient._make_llm_request()`

[`alignment_llm_client.py#L178-L186`](https://github.com/cisco-ai-defense/skill-scanner/blob/67a29d9e1a54cef87d0dc77a889ec13ac1357f23/skill_scanner/core/analyzers/behavioral/alignment/alignment_llm_client.py#L178-L186):

```python
request_params = {
    "model": self._model,
    "messages": [...],
    "max_tokens": self._max_tokens,
    "temperature": self._temperature,   # <-- always passed (default 0.1)
    "timeout": self._timeout,
}
# ...
response = await acompletion(**request_params)
```

This is the behavioral alignment verification path.

### Affected Call Site 3: `LLMRequestHandler._make_google_sdk_request()`

[`llm_request_handler.py#L274-L277`](https://github.com/cisco-ai-defense/skill-scanner/blob/67a29d9e1a54cef87d0dc77a889ec13ac1357f23/skill_scanner/core/analyzers/llm_request_handler.py#L274-L277):

```python
config_dict: dict[str, Any] = {
    "max_output_tokens": self.max_tokens,
    "temperature": self.temperature,     # <-- always passed
}
```

This is the Google GenAI SDK path. Not affected by GPT-5 specifically (different provider), but has the same unconditional inclusion pattern and could break with future Google models that restrict temperature.

### Default Temperature Values Across Components

| Component | Default | Source |
|-----------|---------|--------|
| `LLMAnalyzer` | `0.0` | [`llm_analyzer.py#L120`](https://github.com/cisco-ai-defense/skill-scanner/blob/67a29d9e1a54cef87d0dc77a889ec13ac1357f23/skill_scanner/core/analyzers/llm_analyzer.py#L120) |
| `MetaAnalyzer` | `0.1` | [`meta_analyzer.py#L244`](https://github.com/cisco-ai-defense/skill-scanner/blob/67a29d9e1a54cef87d0dc77a889ec13ac1357f23/skill_scanner/core/analyzers/meta_analyzer.py#L244) |
| `AlignmentLLMClient` | `0.1` | [`alignment_llm_client.py#L63`](https://github.com/cisco-ai-defense/skill-scanner/blob/67a29d9e1a54cef87d0dc77a889ec13ac1357f23/skill_scanner/core/analyzers/behavioral/alignment/alignment_llm_client.py#L63) |
| `AlignmentOrchestrator` | `0.1` | [`alignment_orchestrator.py#L57`](https://github.com/cisco-ai-defense/skill-scanner/blob/67a29d9e1a54cef87d0dc77a889ec13ac1357f23/skill_scanner/core/analyzers/behavioral/alignment/alignment_orchestrator.py#L57) |
| `ScannerDefaults` | `0.0` | [`constants.py#L52`](https://github.com/cisco-ai-defense/skill-scanner/blob/67a29d9e1a54cef87d0dc77a889ec13ac1357f23/skill_scanner/config/constants.py#L52) |
| `Config` | `0.0` | [`config.py#L42`](https://github.com/cisco-ai-defense/skill-scanner/blob/67a29d9e1a54cef87d0dc77a889ec13ac1357f23/skill_scanner/config/config.py#L42) |

All values are incompatible with GPT-5 (`temperature=1` is the only accepted value).

## Fix

### Recommended: Pass `drop_params=True` to `acompletion()`

LiteLLM natively supports `drop_params` as a per-request parameter. When set, it silently drops any parameters the target model does not support, rather than raising `UnsupportedParamsError`. This is the approach LiteLLM itself recommends in the error message.

**`llm_request_handler.py`** — `_make_litellm_request()`:

```diff
-               response = await acompletion(**request_params)
+               response = await acompletion(**request_params, drop_params=True)
```

**`alignment_llm_client.py`** — `_make_llm_request()`:

```diff
-           response = await acompletion(**request_params)
+           response = await acompletion(**request_params, drop_params=True)
```

This is a two-line fix that:
- Resolves GPT-5 `temperature` incompatibility immediately
- Future-proofs against any other model-specific parameter restrictions (e.g., a future model dropping `max_tokens` support)
- Requires no model-name detection logic
- Follows LiteLLM's own recommended resolution path

### Alternative: Conditional Parameter Exclusion

If `drop_params=True` is considered too broad, temperature can be conditionally excluded:

```diff
  request_params = {
      "model": self.provider_config.model,
      "messages": messages,
      "max_tokens": self.max_tokens,
-     "temperature": self.temperature,
      "timeout": self.timeout,
      **self.provider_config.get_request_params(),
  }
+ if self.temperature is not None:
+     request_params["temperature"] = self.temperature
```

Combined with changing the default from `0.0` to `None` in `LLMAnalyzer`, `MetaAnalyzer`, and `AlignmentLLMClient`. This approach is more surgical but requires changes across more files and does not protect against future parameter restrictions.

### Not Recommended: Model-Name Detection

Hardcoding `if "gpt-5" in model` checks is fragile, requires ongoing maintenance for new model releases, and does not cover edge cases (fine-tuned models, Azure deployments with custom names, etc.).

## Test Cases

```python
@pytest.mark.asyncio
async def test_drop_params_prevents_unsupported_params_error(self):
    """acompletion must be called with drop_params=True to handle model restrictions."""
    from unittest.mock import AsyncMock, patch

    handler = LLMRequestHandler(
        provider_config=_mock_provider_config(model="gpt-5.4-2026-03-05"),
        temperature=0.0,
    )

    with patch("skill_scanner.core.analyzers.llm_request_handler.acompletion", new_callable=AsyncMock) as mock:
        mock.return_value = _mock_response('{"findings": []}')
        await handler.make_request([{"role": "user", "content": "test"}])

        mock.assert_called_once()
        call_kwargs = mock.call_args
        assert call_kwargs.kwargs.get("drop_params") is True or \
               call_kwargs[1].get("drop_params") is True, \
               "acompletion must be called with drop_params=True"
```

```python
@pytest.mark.asyncio
async def test_alignment_client_drop_params(self):
    """AlignmentLLMClient must pass drop_params=True to acompletion."""
    from unittest.mock import AsyncMock, patch

    client = AlignmentLLMClient(
        model="gpt-5.4-2026-03-05",
        api_key="test-key",
        temperature=0.1,
    )

    with patch(
        "skill_scanner.core.analyzers.behavioral.alignment.alignment_llm_client.acompletion",
        new_callable=AsyncMock,
    ) as mock:
        mock.return_value = _mock_response('{"alignment": "verified"}')
        await client._make_llm_request("test prompt")

        call_kwargs = mock.call_args
        assert call_kwargs.kwargs.get("drop_params") is True or \
               call_kwargs[1].get("drop_params") is True, \
               "acompletion must be called with drop_params=True"
```

## Impact on This Repository

- **CI:** The workflow sets `SKILL_SCANNER_LLM_MODEL: gpt-5.4-2026-03-05` ([`skill-scanner.yml#L100`](../../.github/workflows/skill-scanner.yml#L100)). Every skill triggers the error — the LLM analyzer and meta-analyzer produce zero findings across the entire scan.
- **Security coverage:** Without LLM analysis, the scanner operates with static + behavioral analysis only. Semantic threat detection (the strongest analyzer for detecting prompt injection, social engineering, and novel attack patterns) is completely disabled.
- **Silent degradation:** The scanner logs the error but continues with `continue-on-error: true`. The scan appears to succeed but with significantly reduced coverage. No explicit signal in the workflow output indicates that the most important analyzer was non-functional.

## Resolution

PR [#56](https://github.com/cisco-ai-defense/skill-scanner/pull/56) was reviewed, approved, and merged by [@vineethsai7](https://github.com/vineethsai7) on 12026-03-09 (merge commit [`1116d5f`](https://github.com/cisco-ai-defense/skill-scanner/commit/1116d5f4642ebe5af64656db25ee5c0143ab8c08)). The fix is included in [skill-scanner 2.0.2](https://github.com/cisco-ai-defense/skill-scanner/releases/tag/2.0.2).

- **CI:** Updating `skill-scanner` to `>=2.0.2` restores full LLM-based analysis (semantic threat detection, meta-analysis) for GPT-5 model configurations.
- **Security coverage:** The LLM analyzer and meta-analyzer now produce findings as expected — the scanner's strongest detection engines are no longer silently disabled.
- **Silent degradation:** No longer an issue — `drop_params=True` prevents `UnsupportedParamsError` from suppressing analysis without visible signal.
