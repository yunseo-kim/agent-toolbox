# Known Issues

Tracked issues discovered during codebase analysis. Each entry includes the problem, affected files, impact, and suggested resolution direction.

## 1. Install output path resolves to temp directory under npx/bunx

**Status**: Open
**Severity**: High
**Affected files**: `src/install/installer.ts:79`

**Problem**: The install command writes generated artifacts to `join(rootDir, "dist", "targets", target)`. When the CLI is invoked via `npx` or `bunx`, `rootDir` resolves to the temporary package installation location (e.g., `/Users/x/.npm/_npx/abc123/node_modules/agent-toolbox/`), not the user's project directory. Artifacts are written to a location the user cannot easily find or use.

**Impact**: End users running `npx agent-toolbox install --target claude-code` get artifacts in a disposable temp directory instead of their project.

**Suggested resolution**: Change the install output to use `process.cwd()` (user's current working directory) instead of `rootDir` for artifact output. The `rootDir` should only be used for locating the CLI's own resources (catalog, package.json version). Consider a `--output` flag for explicit control.

---

## 2. Windows `tar` command dependency in catalog provider

**Status**: Open
**Severity**: Medium
**Affected files**: `src/catalog/provider.ts:243`

**Problem**: The remote catalog download uses `execFile("tar", ...)` to extract the downloaded catalog tarball. The `tar` command may not be available on Windows systems without Git Bash, WSL, or similar Unix tooling.

**Impact**: First-time install from npm may fail on Windows systems that lack `tar` in PATH. Subsequent runs with cached catalog are unaffected.

**Suggested resolution**: Options include (a) using a Node.js tar library like `tar` (npm package) or `tar-stream`, (b) using Node.js built-in `zlib` + manual extraction, or (c) detecting the OS and providing a clear error message with install instructions for Windows users. Option (a) is recommended — `tar` (npm) is widely used and handles cross-platform extraction reliably.

---

## 3. ~~`npx agent-toolbox` fails — bin entry points to TypeScript file~~

**Status**: Resolved (fixed in `feat/dual-runtime-cli` branch)
**Severity**: ~~Critical~~
**Affected files**: `package.json:39`

**Problem**: The `bin` field in `package.json` pointed to `src/cli/main.ts`. Node.js cannot execute TypeScript files natively, so `npx agent-toolbox` failed with a syntax error. Only `bunx` worked because Bun handles TypeScript natively.

**Resolution**: The CLI is now compiled to JavaScript via `bun build --target node` and served through a launcher wrapper (`dist/cli/launcher.js`) that auto-detects the invoking runtime. `npx` runs on Node.js, `bunx` re-executes with Bun for native performance. The `bin` field now points to `dist/cli/launcher.js`.
