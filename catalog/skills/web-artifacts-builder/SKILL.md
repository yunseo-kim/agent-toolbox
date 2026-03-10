---
name: web-artifacts-builder
description: "Build multi-component HTML artifacts using React, Tailwind CSS, and shadcn/ui. Use for complex interactive artifacts requiring state management, routing, or component libraries, not for simple single-file HTML/JSX artifacts."
license: SUL-1.0
compatibility: "Requires Node.js 18+, pnpm, and network access to fetch npm packages and shadcn/ui components from upstream."
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
metadata:
  domain: development
  subdomain: frontend
  tags: "react, tailwind, shadcn, artifacts, html-bundling"
  frameworks: "react, tailwind, shadcn-ui"
  author: "Yunseo Kim <dev@yunseo.kim>"
  lastUpdated: "12026-03-11"
  provenance: adapted
---

# Web Artifacts Builder

To build powerful frontend interactive artifacts, follow these steps:
1. Initialize the frontend repo using `scripts/init-artifact.sh`
2. Develop your artifact by editing the generated code
3. Bundle all code into a single HTML file using `scripts/bundle-artifact.sh`
4. Display artifact to user
5. (Optional) Test the artifact

**Stack**: React 19 + TypeScript 5.9 + Vite 7/6 (Node-aware) + Parcel 2.16 + Tailwind CSS 4 + shadcn/ui CLI

Use this skill for complex, multi-component artifacts. For simple single-file HTML/JSX artifacts, use a lighter workflow.

## Design & Style Guidelines

VERY IMPORTANT: To avoid what is often referred to as "AI slop", avoid using excessive centered layouts, purple gradients, uniform rounded corners, and Inter font.

## Quick Start

### Step 1: Initialize Project

Run the initialization script to create a new React project:
```bash
bash scripts/init-artifact.sh <project-name>
cd <project-name>
```

This creates a fully configured project with:
- ✅ React + TypeScript (via Vite)
- ✅ Tailwind CSS 4.2.1 via `@tailwindcss/vite`
- ✅ Path aliases (`@/`) configured
- ✅ 40+ shadcn/ui components installed from upstream CLI (no vendored tarball)
- ✅ React 19.2.4 and TypeScript 5.9.3 pinned
- ✅ Parcel configured for bundling (via `.parcelrc`)
- ✅ Node-aware Vite pinning (`7.3.1` latest, `6.4.1` fallback)

### Step 2: Develop Your Artifact

To build the artifact, edit the generated files. See **Common Development Tasks** below for guidance.

### Step 3: Bundle to Single HTML File

To bundle the React app into a single HTML artifact:
```bash
bash scripts/bundle-artifact.sh
```

This creates `bundle.html` - a self-contained artifact with all JavaScript, CSS, and dependencies inlined. This file can be directly shared in conversations as an artifact.

**Requirements**: Your project must have an `index.html` in the root directory.

**What the script does**:
- Installs bundling dependencies (`parcel`, `@parcel/config-default`, `web-resource-inliner`)
- Creates `.parcelrc` config
- Builds with Parcel (no source maps)
- Inlines all assets into single HTML using `web-resource-inliner`

### Step 4: Share Artifact with User

Finally, share the bundled HTML file in conversation with the user so they can view it as an artifact.

### Step 5: Testing/Visualizing the Artifact (Optional)

Note: This is a completely optional step. Only perform if necessary or requested.

To test/visualize the artifact, use available tools (including other Skills or built-in tools like Playwright or Puppeteer). In general, avoid testing the artifact upfront as it adds latency between the request and when the finished artifact can be seen. Test later, after presenting the artifact, if requested or if issues arise.

## Reference

- **shadcn/ui components**: https://ui.shadcn.com/docs/components
- **shadcn/ui Vite install**: https://ui.shadcn.com/docs/installation/vite
- **shadcn/ui CLI**: https://ui.shadcn.com/docs/cli
