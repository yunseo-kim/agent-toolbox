# Attribution Notice

This skill incorporates material derived from [n8n-io/n8n](https://github.com/n8n-io/n8n),
originally released under the [Sustainable Use License 1.0](https://github.com/n8n-io/n8n/blob/master/LICENSE.md).
This adapted version is governed by the [Sustainable Use License](../../LICENSE.md) at the
root of this repository. The upstream license terms are summarized below for attribution.

## Modifications

This file has been adapted from the original n8n `.claude/skills/linear-issue/SKILL.md` for use
in the awesome-agent-toolbox catalog. Changes include:

- Added catalog frontmatter metadata (domain, subdomain, tags)
- Removed Linear MCP-specific tool names and API calls
- Removed n8n-specific node identification logic (node type IDs, popularity scores)
- Removed n8n-specific MCP compatibility requirements
- Generalized from Linear-only to any issue tracker (Linear, Jira, GitHub Issues, etc.)
- Renamed from "linear-issue" to "issue-analysis" to reflect universal applicability
- Added security hardening guidance for external media and linked document analysis
- Added explicit compatibility and allowed-tools metadata for clearer tool-scope boundaries
- Replaced fixed-path image download example with bounded-download and unique temp-file guidance
- Added untrusted-content handling, external-action confirmation gate, and sensitive-data redaction guidance

## Upstream License

The original work was released under the Sustainable Use License 1.0, which grants a
non-exclusive, royalty-free, worldwide license to use, copy, distribute, and prepare
derivative works of the software, subject to certain limitations including non-commercial
distribution and preservation of notices.

For the full upstream license text, see: https://github.com/n8n-io/n8n/blob/master/LICENSE.md
