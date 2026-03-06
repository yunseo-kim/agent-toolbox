# Attribution Notice

This skill incorporates material derived from
[vercel/ai](https://github.com/vercel/ai),
originally released under the
[Apache License, Version 2.0](https://github.com/vercel/ai/blob/main/LICENSE).
This adapted version is governed by the
[Sustainable Use License](../../LICENSE.md).

## Modifications

This skill was adapted from the original `skills/use-ai-sdk/` in the
vercel/ai repository for use in the awesome-agent-toolbox
catalog. Changes include:

- Converted Agent Skills format (`skills/use-ai-sdk/`) to catalog skill format
- Adapted SKILL.md frontmatter to catalog schema (domain/tags/frameworks and provenance metadata)
- Added catalog safety guardrails in SKILL.md (read-only default, explicit confirmation before install/network commands, untrusted external-doc handling)
- Added operational security notes in references (`devtools.md` privacy handling, `ai-gateway.md` API-key handling)
- Preserved reference files and core AI SDK guidance (generateText, streamText, ToolLoopAgent, useChat, AI Gateway, DevTools, and migration notes)

## Upstream License

Copyright 2023 Vercel, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

For the full upstream license text, see:
https://github.com/vercel/ai/blob/main/LICENSE
