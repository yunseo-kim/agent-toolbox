# Shared Tools Architecture

**Last Updated:** 12026-03-10
**Status:** Design — Phase 1 in progress

## Problem

Skills ported from the same upstream repository often share identical files. For example, six skills from `coreyhaines31/marketingskills` share CLI scripts and integration docs across `ad-creative`, `ai-seo`, `analytics-tracking`, `email-sequence`, `paid-ads`, and `referral-program`. In the upstream repo, these files live in a centralized `tools/` directory; during porting, each skill received its own copy.

This duplication creates concrete maintenance problems:

- **Patch propagation**: A security fix to `ga4.js` required updating 3 identical copies plus verifying byte-equality. A broader vulnerability fix touched 29 files across 6 skills.
- **Drift risk**: Independent edits to copies can silently diverge. Two copies of `meta-ads.js` were patched with different sanitization approaches before being discovered and unified.
- **Scale**: As more skills are ported from repos with shared tooling, the duplication multiplies.

### Scope of Current Duplication

Verified by MD5 across the six `marketingskills`-derived skills:

| Shared File       | Skills                               | Type            |
| ----------------- | ------------------------------------ | --------------- |
| `ga4.js`          | paid-ads, analytics-tracking, ai-seo | CLI script      |
| `ga4.md`          | paid-ads, analytics-tracking, ai-seo | Integration doc |
| `google-ads.js`   | paid-ads, ad-creative                | CLI script      |
| `google-ads.md`   | paid-ads, ad-creative                | Integration doc |
| `linkedin-ads.js` | paid-ads, ad-creative                | CLI script      |
| `linkedin-ads.md` | paid-ads, ad-creative                | Integration doc |
| `meta-ads.md`     | paid-ads, ad-creative                | Integration doc |
| `segment.js`      | paid-ads, analytics-tracking         | CLI script      |
| `segment.md`      | paid-ads, analytics-tracking         | Integration doc |
| `tiktok-ads.js`   | paid-ads, ad-creative                | CLI script      |
| `tiktok-ads.md`   | paid-ads, ad-creative                | Integration doc |

Additionally, `meta-ads.js` exists in both `paid-ads` and `ad-creative` with diverged implementations (different helper functions in `ad-creative`).

Per-skill files (not shared): `REGISTRY.md` (scoped tool subset per skill), `clis/README.md` (per-skill CLI listing), and all `references/*.md` domain content.

**Total: 22 byte-identical duplicate files, 11 of which are executable code (JS).**

## Design

### Directory Model: `catalog/tools/`

Shared tools live in `catalog/tools/<bundle-name>/` as a peer to `catalog/skills/`, `catalog/agents/`, etc. Each bundle groups tools by their upstream origin.

```
catalog/
├── tools/
│   └── marketing-tools/              # from coreyhaines31/marketingskills
│       ├── NOTICE.md                 # attribution
│       ├── clis/
│       │   ├── ga4.js
│       │   ├── google-ads.js
│       │   ├── linkedin-ads.js
│       │   ├── meta-ads.js
│       │   ├── segment.js
│       │   └── tiktok-ads.js
│       └── integrations/
│           ├── ga4.md
│           ├── google-ads.md
│           ├── linkedin-ads.md
│           ├── meta-ads.md
│           ├── segment.md
│           └── tiktok-ads.md
├── skills/
│   ├── paid-ads/
│   │   ├── SKILL.md
│   │   ├── NOTICE.md
│   │   └── references/
│   │       ├── ad-copy-templates.md          # skill-specific content
│   │       └── tools/
│   │           ├── REGISTRY.md               # skill-specific (scoped tool subset)
│   │           ├── clis/
│   │           │   ├── README.md             # skill-specific
│   │           │   ├── ga4.js                # symlink → catalog/tools/marketing-tools/clis/ga4.js
│   │           │   ├── google-ads.js         # symlink
│   │           │   └── ...
│   │           └── integrations/
│   │               ├── ga4.md                # symlink → catalog/tools/marketing-tools/integrations/ga4.md
│   │               └── ...
│   └── ...
```

### Why `catalog/tools/` (not `catalog/shared/`)

- Matches the existing catalog taxonomy: `skills/`, `agents/`, `commands/`, `hooks/`, `mcp/`, `lsp/` are all peer categories. `tools/` extends this naturally.
- Maps directly to the upstream structure: `coreyhaines31/marketingskills` has a shared `tools/` directory that all skills reference.
- Semantically clear: the contents are reusable tools, not an ambiguous "shared" bucket.
- Extensible: future upstreams with the same pattern get their own bundle under `catalog/tools/`.

### Symlink Strategy

Skills reference shared files via relative symlinks. From a skill's perspective, the file tree looks identical to the current structure — `references/tools/clis/ga4.js` still exists at the expected relative path. But instead of a copied file, it's a symlink to the canonical copy in `catalog/tools/`.

```
catalog/skills/paid-ads/references/tools/clis/ga4.js
  → ../../../../../tools/marketing-tools/clis/ga4.js
```

Benefits:

- **Zero SKILL.md changes**: Relative paths in SKILL.md (`references/tools/clis/ga4.js`) continue to work. No instruction text needs updating.
- **Single source of truth**: Editing `catalog/tools/marketing-tools/clis/ga4.js` updates all consumers instantly.
- **Explicit dependency**: `ls -la` in any skill immediately reveals which files are shared vs. local.
- **Git tracks symlinks**: Symlinks are stored in git as text pointers. No special git configuration needed on POSIX systems.

### Diverged Files: Skill-Local Overrides

When a skill needs a variant of a shared tool (e.g., `ad-creative/meta-ads.js` with extra `safeStringify()` helper), the skill keeps a real file instead of a symlink. The presence of a real file at the expected path is the override — no manifest or configuration needed.

Convention: if `catalog/skills/<skill>/references/tools/clis/<file>` is a regular file (not a symlink), it takes precedence. If it's a symlink, the canonical copy from `catalog/tools/` is used. The build pipeline copies whichever it finds.

### Cross-Platform: Windows Considerations

Git on Windows can represent symlinks as text files containing the target path. This works transparently when:

- Git is configured with `core.symlinks=true` (default on Git for Windows with developer mode)
- The build pipeline resolves symlinks during copy (see Build Pipeline section)

The build pipeline always resolves symlinks to real files in `dist/`, so end users never encounter symlinks regardless of platform.

## Distribution Model

Two distribution channels, both consuming the same build output:

### Channel 1: Self-Installer (`bun run install:target`)

```
bun run install:target -- --target claude-code --skill paid-ads
  → resolveCatalogDir()              # downloads catalog/ tarball (includes tools/)
  → generator reads catalog/skills/paid-ads/
  → copyDirectoryRecursive() follows symlinks → copies real files
  → dist/targets/claude-code/skills/paid-ads/ is self-contained
  → installs to user's project
```

No user-facing change. Skills arrive fully resolved with all tool files present.

### Channel 2: Claude Code Plugin Marketplace

Claude Code's plugin model requires self-contained plugin directories (no external file references). Symlinks are followed during plugin installation, but `git-subdir` sparse checkouts would not include symlink targets outside the checked-out path.

Solution: CI publishes a **distribution branch** (`dist/claude-code`) with pre-built, fully-resolved plugin directories.

```
main (source)                        dist/claude-code (built artifacts)
┌──────────────┐                     ┌──────────────────────────┐
│ catalog/     │                     │ .claude-plugin/          │
│   tools/     │   ── CI build ──→   │   marketplace.json       │
│   skills/    │                     │ plugins/                 │
│ src/         │                     │   paid-ads/              │
└──────────────┘                     │     .claude-plugin/      │
                                     │       plugin.json        │
                                     │     skills/paid-ads/     │
                                     │       SKILL.md           │
                                     │       references/tools/  │
                                     │         clis/ga4.js      │  ← real file
                                     │   ad-creative/           │
                                     │   ...                    │
                                     └──────────────────────────┘
```

Users add the marketplace:

```
/plugin marketplace add yunseo-kim/agent-toolbox --ref dist/claude-code
```

Each plugin in `marketplace.json` uses relative paths to `./plugins/<skill-name>`. Since the distribution branch contains fully resolved files, no symlinks or external dependencies exist.

## Build Pipeline Changes

### Phase 1: Symlink Resolution in `copy-utils.ts`

The `copyDirectoryRecursive` function in `src/generators/copy-utils.ts` must follow symlinks when copying from `catalog/skills/` to `dist/targets/`. Node.js `fs.cpSync` with `{ dereference: true }` handles this. Bun's equivalent should be verified.

### Phase 2: Tool Dependency Declaration (future)

Skills may optionally declare tool bundle dependencies in SKILL.md frontmatter:

```yaml
---
name: paid-ads
tools: [marketing-tools]
---
```

The generator would read this declaration and copy files from `catalog/tools/marketing-tools/` into the skill's `references/tools/` during build, even if symlinks are missing. This provides a safety net and enables skills that don't use symlinks at all.

### Phase 3: Marketplace Generator (future)

A new generator (`src/generators/marketplace/`) produces:

- Per-skill plugin directories with `.claude-plugin/plugin.json`
- A root `marketplace.json` listing all plugins
- CI workflow to publish the `dist/claude-code` branch on each release

## Phased Implementation

### Phase 1 — Symlink Deduplication (current)

- Create `catalog/tools/marketing-tools/` with canonical copies
- Replace duplicate files in 6 skills with relative symlinks
- Verify `copyDirectoryRecursive` follows symlinks (add `dereference: true` if needed)
- Validate: build succeeds, tests pass, dist/ output contains real files

**Outcome**: Single source of truth for shared tools. Security patches require editing 1 file instead of N.

### Phase 2 — Build Pipeline Enhancement

- Add optional `tools:` field to SKILL.md frontmatter schema
- Generator resolves tool dependencies at build time (copies from `catalog/tools/` → skill `references/tools/`)
- Add drift detection: CI validates that symlink targets in `catalog/tools/` exist and match expected bundle
- Add tests for symlink resolution across generators

**Outcome**: Declarative tool dependencies. Skills can opt in without manual symlink creation.

### Phase 3 — Marketplace Distribution

- Create `src/generators/marketplace/generator.ts`
- Generate per-skill `plugin.json` manifests with proper versioning
- Generate root `marketplace.json` catalog
- CI workflow: build → publish to `dist/claude-code` orphan branch
- Register marketplace with Claude Code's plugin discovery

**Outcome**: Skills discoverable and installable via Claude Code's native plugin marketplace.

## Alternatives Considered

### A. Copy + Sync Script

Keep N copies, run a sync script to propagate changes. Lower risk but O(N) copies persist in the repo. Chosen as a fallback if symlinks prove problematic.

### B. Runtime Fetch

Skills instruct agents to `curl`/`gh` tools from the remote repo at runtime. Rejected: agent reliability issues, offline breakage, unverified remote code execution, bypasses security scanning pipeline.

### C. Shared Tools as Separate Catalog Entry

Tools become an installable catalog item. Skills declare a dependency. Rejected for now: requires dependency resolution in the installer, more complex than symlinks for the same benefit.

### D. npm Per-Plugin Distribution

Package each skill as a separate npm package. Viable for marketplace but complex packaging overhead. May be revisited if marketplace adoption requires it.

## Conventions

- Shared tool bundles live in `catalog/tools/<bundle-name>/`.
- Bundle names are kebab-case, derived from upstream repo context (e.g., `marketing-tools` from `coreyhaines31/marketingskills`).
- Each bundle has a `NOTICE.md` for attribution.
- Symlinks use relative paths from the skill's file location to `catalog/tools/`.
- A real file at an expected symlink path is a skill-local override — no additional configuration needed.
- `REGISTRY.md` and `clis/README.md` are always skill-specific (not shared) because they list the skill's tool subset.
- Only files that are byte-identical across 2+ skills belong in `catalog/tools/`. Skill-specific content stays in the skill directory.

## References

- [Upstream structure](https://github.com/coreyhaines31/marketingskills): centralized `tools/` directory shared by 32 skills
- [Claude Code Plugin Marketplace](https://code.claude.com/docs/en/plugin-marketplaces.md): plugin caching, symlink behavior, `git-subdir` source type
- [Provenance Classification](classification.md): ported vs. adapted criteria affecting upstream sync eligibility
- [Upstream Sources Config](../catalog/metadata/upstream-sources.yaml): maps skills to upstream repos
