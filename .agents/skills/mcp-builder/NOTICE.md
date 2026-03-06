# Attribution Notice

This skill incorporates material derived from [anthropics/skills](https://github.com/anthropics/skills),
originally released under the [Apache License, Version 2.0](https://github.com/anthropics/skills/blob/main/LICENSE).
This adapted version is governed by the [Sustainable Use License](../../LICENSE.md) at the
root of this repository. The upstream copyright notice and license text are reproduced below
to satisfy the attribution requirements of the original Apache 2.0 license.

## Modifications

This skill has been adapted from the original `skills/mcp-builder/` materials for use
in the awesome-agent-toolbox catalog. Changes include:

- Updated SKILL.md frontmatter for catalog distribution (`license: SUL-1.0`, added `allowed-tools`, updated author/lastUpdated metadata, and set provenance to `adapted`)
- Added security guidance in SKILL.md for external content handling and generated-code safeguards
- Hardened stdio transport inputs in `scripts/connections.py` with command allowlisting, shell metacharacter blocking, argument constraints, and environment-variable key restrictions
- Strengthened `scripts/evaluation.py` input parsing to fail closed for malformed headers/environment variables and reject invalid env keys/control characters
- Updated `scripts/evaluation.py` default model from `claude-3-7-sonnet-20250219` to `claude-sonnet-4-6` (including CLI help/examples)

## Upstream Copyright and License

Copyright 2025 Anthropic, PBC

The original work was released under the Apache License, Version 2.0.
A copy of the original license is available at:

    http://www.apache.org/licenses/LICENSE-2.0
