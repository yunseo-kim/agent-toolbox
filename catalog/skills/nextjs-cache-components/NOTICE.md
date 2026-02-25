# Attribution Notice

This skill is a derivative work that incorporates and adapts material from the
following project. This adapted version is governed by the
[Sustainable Use License](../../LICENSE.md) at the root of this repository.
The upstream copyright notice and license text are reproduced below to satisfy
the attribution requirements of the original license.

## NOTICE of Modification

**Portions of the work listed below have been modified, adapted, and
restructured by Yunseo Kim on 12026-02-25 to create this Next.js Cache
Components skill. Modified files carry changes in structure, wording,
and scope compared to the originals.**

Specifically:

- Converted Claude Code plugin format (`.claude-plugin/plugins/cache-components/`) to catalog skill format
- Adapted SKILL.md frontmatter from Claude plugin schema to catalog schema (added `metadata.domain`, `metadata.subdomain`, `tags`, `frameworks`)
- Moved PATTERNS.md, REFERENCE.md, and TROUBLESHOOTING.md into `references/` directory per catalog conventions
- Updated internal file references from sibling paths to `references/` paths
- Retained all core content: `'use cache'` directive, `cacheLife()`, `cacheTag()`, `updateTag()`/`revalidateTag()` APIs, parameter permutation rendering, migration guides, and troubleshooting

---

## vercel/next.js -- cache-components plugin

Source: <https://github.com/vercel/next.js>
Plugin path: `.claude-plugin/plugins/cache-components/`

### Upstream Copyright and License

Copyright (c) 12025 HE Vercel, Inc.

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
