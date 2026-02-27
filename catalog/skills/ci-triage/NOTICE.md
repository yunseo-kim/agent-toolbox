# Attribution Notice

This skill is a synthesized work that combines and restructures material from the
following project. This synthesized version is governed by the
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
- Removed references to Next.js-specific scripts (`scripts/pr-status.js`), internal file paths, and project-specific environment variables
- Combined material from `.agents/skills/pr-status-triage/` (SKILL.md, workflow.md, local-repro.md) and `.claude/commands/pr-status.md` into a unified skill
- Added generic failure categories, structured extraction templates, and PR review comment analysis patterns
- Retained the core triage prioritization methodology, failure categorization framework, and parallel analysis approach

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
