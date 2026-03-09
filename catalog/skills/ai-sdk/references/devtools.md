---
title: AI SDK DevTools
description: Debug AI SDK calls by inspecting captured runs and steps.
---

# AI SDK DevTools

## Why Use DevTools

DevTools captures all AI SDK calls (`generateText`, `streamText`, `ToolLoopAgent`) to a local JSON file. This lets you inspect LLM requests, responses, tool calls, and multi-step interactions without manually logging.

## Setup

Requires AI SDK 6. Install `@ai-sdk/devtools` using your project's package manager.

Wrap your model with the middleware:

```ts
import { wrapLanguageModel, gateway } from 'ai';
import { devToolsMiddleware } from '@ai-sdk/devtools';

const model = wrapLanguageModel({
  model: gateway('anthropic/claude-sonnet-4.5'),
  middleware: devToolsMiddleware(),
});
```

## Viewing Captured Data

All runs and steps are saved to:

```
.devtools/generations.json
```

Read this file directly to inspect captured data:

```bash
cat .devtools/generations.json | jq
```

Or launch the web UI (prefer a locally installed dependency over ad-hoc latest fetches):

```bash
npx @ai-sdk/devtools
# Open http://localhost:4983
```

If you must use `npx`, pin an explicit package version instead of relying on latest resolution.

## Security and Privacy Notes

DevTools logs can contain sensitive content (user prompts, model responses, tool inputs/outputs, and snippets of application data).

- Use DevTools only in local development, not production systems.
- Never commit `.devtools/generations.json` to version control.
- Restrict local file permissions when handling sensitive projects (for example, `chmod 600 .devtools/generations.json`).
- Redact secrets before sharing logs, screenshots, or copied traces.
- Delete captured logs after debugging is complete.

## Data Structure

- **Run**: A complete multi-step interaction grouped by initial prompt
- **Step**: A single LLM call within a run (includes input, output, tool calls, token usage)
