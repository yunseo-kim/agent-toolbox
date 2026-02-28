# NOTICE.md Templates

Every catalog skill requires a NOTICE.md file. Use the appropriate template based on provenance.

## Relationship Between NOTICE.md and the license Field

NOTICE.md carries attribution and upstream license text. The SKILL.md `license` field declares the governing license for the catalog skill itself. These are related but distinct:

- **Permissive upstreams** (MIT, Apache 2.0, BSD): The skill's `license` field uses the project default (`Sustainable Use License 1.0`). NOTICE.md carries the upstream attribution and license text to satisfy upstream requirements.
- **Weak-copyleft upstreams** (MPL-2.0, LGPL): The skill's `license` field MUST be set to the upstream license (override). NOTICE.md explains that the skill files retain the upstream license per the project's LICENSE.md carve-out.
- **Strong copyleft / proprietary**: Do not port. See `references/catalog-conventions.md` > license.

---

## Pattern A -- Ported (Single Source, Minimal Changes)

Use when body content is copied as-is or with minor generalization. Only frontmatter was replaced and NOTICE.md was added.

Section order: `# Attribution Notice` > `## Modifications` > `## Upstream License`

```markdown
# Attribution Notice

This skill incorporates material derived from
[<org>/<repo>](https://github.com/<org>/<repo>),
originally released under the
[<License Name>](https://github.com/<org>/<repo>/blob/<branch>/LICENSE).
This adapted version is governed by the
[Sustainable Use License](../../LICENSE.md).

## Modifications

This file has been adapted from the original `<path/in/upstream>`
in the <org>/<repo> repository for use in the awesome-agent-toolbox
catalog. Changes include:

- Added catalog frontmatter metadata (domain, subdomain, tags)
- <specific change 1>
- <specific change N>

## Upstream Copyright and License

<License Name>

Copyright (c) <year or "contributors"> <Owner>

<Full license text>

For the full upstream license text, see:
https://github.com/<org>/<repo>/blob/<branch>/LICENSE
```

### Example: MIT (openclaw)

```markdown
# Attribution Notice

This skill incorporates material derived from
[openclaw/openclaw](https://github.com/openclaw/openclaw),
originally released under the
[MIT License](https://github.com/openclaw/openclaw/blob/main/LICENSE).
This adapted version is governed by the
[Sustainable Use License](../../LICENSE.md).

## Modifications

This file has been adapted from the original `skills/apple-notes/SKILL.md`
in the openclaw/openclaw repository for use in the awesome-agent-toolbox
catalog. Changes include:

- Added catalog frontmatter metadata (domain, subdomain, tags)
- Removed platform-specific metadata and install configuration
- Generalized platform-specific references to be tool-agnostic
- Adapted descriptions and instructions for generic AI assistant use

## Upstream License

MIT License

Copyright (c) openclaw contributors

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
https://github.com/openclaw/openclaw/blob/main/LICENSE
```

### Example: Apache 2.0 (anthropics)

Apache 2.0 skills use a shorter license section (copyright + link, no full text reproduction).

```markdown
## Upstream Copyright and License

Copyright 2025 Anthropic, PBC

Licensed under the Apache License, Version 2.0.
A copy of the original license is available at:

    https://www.apache.org/licenses/LICENSE-2.0

For the full upstream license text, see:
https://github.com/anthropics/skills/blob/main/LICENSE
```

---

## Pattern B -- Adapted (Single Source)

Use when body content was meaningfully modified from a single upstream source — structure, wording, or scope changes beyond frontmatter replacement.

Section order: `# Attribution Notice` > `## NOTICE of Modification` > `---` > `## <source> -- <skill> skill` > `### Upstream Copyright and License`

```markdown
# Attribution Notice

This skill is a derivative work that incorporates and adapts material from the
following project. This adapted version is governed by the
[Sustainable Use License](../../LICENSE.md) at the root of this repository.
The upstream copyright notice and license text are reproduced below to satisfy
the attribution requirements of the original license.

## Modifications

**Portions of the work listed below have been modified, adapted, and
restructured by <Author Name> on <Holocene date> to create this <skill type>
skill. Modified files carry changes in structure, wording,
and scope compared to the originals.**

Specifically:

- <specific change 1>
- <specific change N>

---

## <org>/<repo> -- <skill-name> skill [& <command-name> command]

Source: <https://github.com/<org>/<repo>>

### Upstream Copyright and License

<Copyright line>

<Full license text>
```

### Example: Adapted from vercel/next.js (MIT)

```markdown
# Attribution Notice

This skill is a derivative work that incorporates and adapts material from the
following project. This adapted version is governed by the
[Sustainable Use License](../../LICENSE.md) at the root of this repository.
The upstream copyright notice and license text are reproduced below to satisfy
the attribution requirements of the original license.

## NOTICE of Modification

**Portions of the work listed below have been modified, adapted, and
restructured by Yunseo Kim on 12026-02-25 to create this CI triage
skill. Modified files carry changes in structure, wording,
and scope compared to the originals.**

Specifically:

- Generalized Next.js-specific CI triage methodology into a framework-agnostic skill
- Removed references to Next.js-specific scripts, internal file paths, and environment variables
- Combined material from multiple source files into a unified skill
- Added generic failure categories and structured extraction templates
- Retained the core triage prioritization methodology and parallel analysis approach

---

## vercel/next.js -- pr-status-triage skill & pr-status command

Source: <https://github.com/vercel/next.js>

### Upstream Copyright and License

Copyright (c) 2025 Vercel, Inc.

The original work was released under the MIT License (MIT). The following
permission notice is reproduced to satisfy the MIT License's requirements:

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
```

---

## Pattern C -- Synthesized (Multiple Sources)

Use when content was created by combining material from multiple upstream sources.

Section order: `# Attribution Notice` > `## NOTICE of Modification` > `---` > numbered `## N. <source> -- <skill(s)>` sections each with `### Upstream Copyright and License`

Key differences from Pattern B: plural language ("projects", "notices", "licenses"), prose modification paragraph (not bullets), numbered source sections separated by `---`.

```markdown
# Attribution Notice

This skill is a derivative work that incorporates and adapts material from the
following projects. This adapted version is governed by the
[Sustainable Use License](../../LICENSE.md) at the root of this repository.
The upstream copyright notices and license texts are reproduced below to satisfy
the attribution requirements of the respective original licenses.

## Modifications

**<Prose paragraph describing: what the source material consisted of, who
synthesized it, when (Holocene date), into what form, and what was extracted
vs. removed. Use flowing prose -- not a bullet list.>**

---

## 1. <org1>/<repo1> -- <skill-name(s)>

Source: <https://github.com/<org1>/<repo1>>

### Upstream Copyright and License

<Copyright line>

<Full license text or summary with link>

---

## 2. <org2>/<repo2> -- <skill-name(s)>

Source: <https://github.com/<org2>/<repo2>>

### Upstream Copyright and License

<Copyright line>

<Full license text or summary with link>
```

### Example: Synthesized from 4 sources (MIT + Apache 2.0)

See `catalog/skills/docs-writer/NOTICE.md` for a complete real-world example. The modification paragraph reads:

> **Portions of the works listed below have been modified, adapted, and
> restructured by Yunseo Kim on 12026-02-22 to create this unified
> documentation skill. Modified files carry changes in structure, wording,
> and scope compared to the originals.**

Each source gets a numbered section (`## 1. vercel/next.js -- update-docs skill`, etc.) with its own `### Upstream Copyright and License` block. MIT sources reproduce the full license text; Apache 2.0 sources include the copyright line and a link to the full license.

---

## Pattern Selection Guide

| Provenance | Modification Level | Pattern |
|------------|-------------------|---------|
| Ported | Any (frontmatter + NOTICE, body preserved or lightly edited) | Pattern A |
| Adapted | Any (single source, significant body modifications) | Pattern B |
| Synthesized | Any (multiple sources) | Pattern C |

### Quick Reference: Pattern Differences

| Aspect | Pattern A | Pattern B | Pattern C |
|--------|-----------|-----------|-----------|
| Opening | "incorporates material derived from" | "derivative work that incorporates and adapts" | same as B, but "projects" (plural) |
| Modifications header | `## Modifications` | `## NOTICE of Modification` | `## NOTICE of Modification` |
| Modifications format | "Changes include:" + bullets | Bold paragraph (with author/date) + `Specifically:` + bullets | Bold prose paragraph (no bullets) |
| Source section | None (info in opening paragraph) | `## <org>/<repo> -- <skill> skill` | Numbered: `## N. <org>/<repo> -- <skill(s)>` |
| License heading | `## Upstream License` | `### Upstream Copyright and License` | `### Upstream Copyright and License` |
| Horizontal rules | None | Before source section | Between all source sections |

---

## License Text Inclusion Rules

**MIT License**: Always reproduce the full text (~170 words) including the copyright line.

**Apache 2.0**: Include the copyright line, state "released under the Apache License, Version 2.0", and provide a link to the full text at `https://www.apache.org/licenses/LICENSE-2.0`. Full text reproduction is optional due to length.

**BSD 3-Clause**: Reproduce the full text (~200 words) including the copyright line.

**SUL 1.0**: Describe in prose and link to upstream LICENSE.md. Full reproduction is not needed since it matches the project license.

### License Text Sources

When creating NOTICE.md, obtain the actual license text from:
1. The LICENSE/LICENSE.md file in the upstream repo root.
2. If no LICENSE file exists, check individual skill LICENSE.txt files.
3. If license is only stated in README.md or frontmatter, note the declaration and use the standard license text for that type.

---

## Weak-Copyleft Override Template

Use when the upstream license is a weak copyleft (MPL-2.0, LGPL) that requires derived files to retain the original license. The SKILL.md `license` field must be set to the upstream license instead of the project default.

Apply as a modification to Pattern A or Pattern B: replace the governance statement in the opening paragraph and add a `## License` section before modifications.

```markdown
# Attribution Notice

This skill [incorporates material derived from / is a derivative work that
incorporates and adapts material from]
[<org>/<repo>](https://github.com/<org>/<repo>),
originally released under the
[<License Name>](https://github.com/<org>/<repo>/blob/<branch>/LICENSE).

## License

This skill retains its original <License Name> license. Per the project's
[LICENSE.md](../../LICENSE.md): "Certain third-party components incorporated
into the awesome-agent-toolbox Software may retain their original license terms
where explicitly indicated by a NOTICE.md file accompanying that component."

The SKILL.md `license` field for this skill is set to `<License Name>` (not the
project-wide Sustainable Use License 1.0) because <License Name> requires
derivative files to retain the original license terms.

## Modifications

<Follow Pattern A or Pattern B format as appropriate>

## Upstream [License / Copyright and License]

<Follow Pattern A or Pattern B format as appropriate>
```

Note: No weak-copyleft skills exist in the catalog yet. All current upstream licenses are permissive (MIT, Apache 2.0, BSD) or SUL 1.0. This template is provided for future use.
