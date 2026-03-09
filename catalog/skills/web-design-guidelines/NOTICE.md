# Attribution Notice

This skill incorporates material derived from two sources:

1. **Skill structure**: [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) (`skills/web-design-guidelines/`)
2. **Guidelines content**: [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines) (`command.md` at commit `3f6b1449dee158479deb8019f6372ff85e663406`)

Both are originally released under the [MIT License](https://github.com/vercel-labs/agent-skills).
This adapted version is governed by the [Sustainable Use License](../../LICENSE.md).

## Modifications

This skill was originally ported from `skills/web-design-guidelines/` in the
vercel-labs/agent-skills repository. It has been adapted for the
awesome-agent-toolbox catalog with the following changes:

- Replaced upstream SKILL.md frontmatter with catalog-compatible schema (added `metadata.domain`, `metadata.subdomain`, `metadata.tags`, `metadata.provenance`, `metadata.lastUpdated`)
- Removed upstream-specific frontmatter fields (`metadata.argument-hint`)
- **Removed runtime fetch of external guidelines** — the skill previously fetched rules from `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md` at runtime via WebFetch. This was replaced with a locally bundled copy at `references/command.md` to eliminate the indirect prompt injection risk from fetching untrusted remote content (see security report finding LLM_PROMPT_INJECTION HIGH)
- Changed provenance from `ported` to `adapted` to reflect body content modifications

## Upstream License

MIT License

Copyright (c) Vercel, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

For the full upstream license text, see:
https://github.com/vercel-labs/agent-skills
