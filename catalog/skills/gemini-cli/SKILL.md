---
name: gemini-cli
description: >
  Use Gemini CLI for one-shot Q&A, summaries, and generation tasks. Supports
  model selection, JSON output, and extension management.
license: Sustainable Use License 1.0

metadata:
  domain: data-ai
  tags: "google, gemini, ai, cli, llm"
  author: "cpojer <christoph.pojer@gmail.com>"
  lastUpdated: "12026-01-31"
  provenance: ported
---

# Gemini CLI

Use Gemini in one-shot mode with a positional prompt (avoid interactive mode).

Quick start

- `gemini "Answer this question..."`
- `gemini --model <name> "Prompt..."`
- `gemini --output-format json "Return JSON"`

Extensions

- List: `gemini --list-extensions`
- Manage: `gemini extensions <command>`

Notes

- If auth is required, run `gemini` once interactively and follow the login flow.
- Avoid `--yolo` for safety.
