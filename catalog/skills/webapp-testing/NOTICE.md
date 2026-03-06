# Attribution Notice

This skill incorporates material derived from [anthropics/skills](https://github.com/anthropics/skills),
originally released under the [Apache License, Version 2.0](https://github.com/anthropics/skills/blob/main/LICENSE).
This adapted version is governed by the [Sustainable Use License](../../LICENSE.md) at the
root of this repository. The upstream copyright notice and license text are reproduced below
to satisfy the attribution requirements of the original Apache 2.0 license.

## Modifications

This file has been adapted from the original `skills/webapp-testing/SKILL.md` for use
in the awesome-agent-toolbox catalog. Changes include:

- Added catalog frontmatter metadata (domain, subdomain, tags, frameworks)
- Removed Anthropic-specific license frontmatter field
- Generalized Anthropic-specific references to be tool-agnostic
- Added explicit compatibility and allowed-tools metadata for clearer tool-scope boundaries
- Hardened `scripts/with_server.py` command validation and redirected server output streams to avoid pipe-buffer deadlocks
- Updated examples to use configurable output paths via `WEBAPP_TESTING_OUTPUT_DIR` instead of fixed `/tmp` or `/mnt/user-data/outputs` paths
- Refined guidance text to prioritize `--help` usage without instructing agents to avoid source review

## Upstream Copyright and License

Copyright 2025 Anthropic, PBC

The original work was released under the Apache License, Version 2.0.
A copy of the original license is available at:

    http://www.apache.org/licenses/LICENSE-2.0
