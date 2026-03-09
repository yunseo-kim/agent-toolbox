# Dual-Runtime Architecture

**Last Updated:** 12026-03-09
**Status:** Canonical Reference
**Introduced In:** [feat(cli): add dual-runtime build pipeline for npx and bunx support (#22)](https://github.com/yunseo-kim/agent-toolbox/commit/7214d8914e998abad4ba254ccc982f0669d87829)

## Overview

The agent-toolbox CLI supports two JavaScript runtimes: **Node.js** (via `npx`) and **Bun** (via `bunx`). This is achieved through a two-file launcher architecture that auto-detects the invoking package manager and routes execution to the appropriate runtime. Users do not need to know which runtime is running — the launcher handles it transparently.

## Build Pipeline

The CLI build step (`bun run build:cli`) produces two files in `dist/cli/`:

```
src/cli/main.ts      ──bun build --target node──>  dist/cli/main.js      (compiled ESM bundle)
src/cli/launcher.js  ──cpSync──────────────────>  dist/cli/launcher.js  (handwritten wrapper)
```

| File                   | Role                     | Shebang               | Notes                                                                                                                                          |
| ---------------------- | ------------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `dist/cli/launcher.js` | npm `bin` entry point    | `#!/usr/bin/env node` | Handwritten JS, not compiled. Runtime auto-detection logic lives here.                                                                         |
| `dist/cli/main.js`     | Compiled CLI application | `#!/usr/bin/env node` | Compiled from TypeScript via `bun build --target node --format esm`. Shebang is preserved by Bun's bundler (entry-point hashbang passthrough). |

The `package.json` `bin` field points to `dist/cli/launcher.js`:

```json
{
  "bin": {
    "agent-toolbox": "dist/cli/launcher.js"
  }
}
```

## Runtime Detection Logic

The launcher (`src/cli/launcher.js`) uses two signals to determine the execution path:

```js
const isBunx = (process.env.npm_config_user_agent || "").includes("bun/");

if (typeof globalThis.Bun === "undefined" && isBunx) {
  // Re-exec under Bun
  spawnSync("bun", [main, ...process.argv.slice(2)], { stdio: "inherit" });
  process.exit(status ?? 0);
} else {
  // Run in-process
  await import("./main.js");
}
```

| Signal                  | What It Detects                                                |
| ----------------------- | -------------------------------------------------------------- |
| `globalThis.Bun`        | Whether the **current process** is running on the Bun runtime  |
| `npm_config_user_agent` | Which **package manager** invoked the process (npm, bun, etc.) |

The combination of these two signals distinguishes three distinct execution paths.

## Execution Paths

### Path 1: `npx agent-toolbox`

```
npx agent-toolbox
 |  npm resolves bin -> dist/cli/launcher.js
 |  OS reads shebang -> #!/usr/bin/env node
 v
Node.js executes launcher.js
 |  npm_config_user_agent = "npm/..."  -> isBunx = false
 |  globalThis.Bun = undefined
 |  Condition: false && false = false   -> else branch
 v
await import("./main.js")              -> CLI runs in-process under Node.js
```

**Result:** Single Node.js process. No re-execution overhead.

### Path 2: `bunx agent-toolbox` (Both Bun & Node.js Are Installed)

```
bunx agent-toolbox
 |  Bun package manager resolves bin -> dist/cli/launcher.js
 |  Bun respects shebang -> #!/usr/bin/env node -> spawns Node.js
 v
Node.js executes launcher.js            <- Node.js process (PID 1)
 |  npm_config_user_agent = "bun/..."  -> isBunx = true
 |  globalThis.Bun = undefined         -> not Bun runtime
 |  Condition: true && true = true     -> re-exec branch
 v
spawnSync("bun", ["main.js", ...])
 v
Bun executes main.js                    <- Bun process (PID 2)
 |  CLI runs under Bun with native performance
 v
Exit status propagated back to Node.js -> process.exit(status)
```

**Result:** Node.js acts as a bootloader, then hands off to a Bun child process. The exit code is propagated via `spawnSync`.

### Path 3: `bunx --bun agent-toolbox`

```
bunx --bun agent-toolbox
 |  --bun flag tells Bun to ignore the shebang
 |  Bun executes launcher.js directly
 v
Bun executes launcher.js
 |  npm_config_user_agent = "bun/..."  -> isBunx = true
 |  globalThis.Bun = defined           -> already in Bun
 |  Condition: false && true = false   -> else branch
 v
await import("./main.js")              -> CLI runs in-process under Bun
```

**Result:** Single Bun process. No re-execution overhead. This is the most efficient path.

### Path 4: `bunx agent-toolbox` (Node.js Not Installed)

When the user's environment has Bun but **not** Node.js, the flow changes:

```
bunx agent-toolbox
 |  Bun package manager resolves bin -> dist/cli/launcher.js
 |  Shebang says #!/usr/bin/env node, but node is not in PATH
 |  Bun falls back to running the script with Bun itself
 v
Bun executes launcher.js                <- Bun process (single)
 |  npm_config_user_agent = "bun/..."  -> isBunx = true
 |  globalThis.Bun = defined           -> already in Bun
 |  Condition: false && true = false   -> else branch
 v
await import("./main.js")              -> CLI runs in-process under Bun
```

**Result:** Bun's package manager cannot find the `node` interpreter specified in the shebang, so it falls back to executing the script under Bun directly. Since `globalThis.Bun` is defined, the launcher takes the in-process path — identical to Path 3. The re-exec branch is never entered.

This means the CLI works correctly in Bun-only environments **without any additional code or flags**. The existing detection logic handles it as an implicit graceful degradation.

> **Note:** The `npm_config_user_agent` string in this scenario still reports a node version (e.g., `bun/1.x npm/? node/v24.x`). This is Bun's internal compatibility metadata and does not indicate that Node.js is actually present on the system.

### Summary Table

| Command                    | Node.js Required | Launcher Runtime | `globalThis.Bun` | `isBunx` | Branch              | CLI Runtime | Process Count |
| -------------------------- | ---------------- | ---------------- | ---------------- | -------- | ------------------- | ----------- | ------------- |
| `npx agent-toolbox`        | **Yes**          | Node.js          | `undefined`      | `false`  | `else` (in-process) | **Node.js** | 1             |
| `bunx agent-toolbox`       | Yes (available)  | Node.js          | `undefined`      | `true`   | re-exec             | **Bun**     | 2             |
| `bunx --bun agent-toolbox` | No               | Bun              | `defined`        | `true`   | `else` (in-process) | **Bun**     | 1             |
| `bunx agent-toolbox`       | No (absent)      | Bun (fallback)   | `defined`        | `true`   | `else` (in-process) | **Bun**     | 1             |

## Shebang Semantics

Understanding how shebangs interact with different invocation methods is essential for reasoning about this architecture.

### Bun's Two Modes

The `bun` binary operates in two distinct modes with different shebang handling:

| Mode                | Invocation                            | Shebang Behavior                                                                                                                     |
| ------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **JS Runtime**      | `bun file.js`, `bun run file.js`      | Shebang is treated as a [TC39 hashbang comment](https://tc39.es/proposal-hashbang/). File is loaded and interpreted by Bun directly. |
| **Package Manager** | `bun run <script-name>`, `bunx <bin>` | Bun spawns a new subprocess. The OS `exec` syscall reads the shebang and invokes the specified interpreter.                          |

This distinction is critical: when the launcher calls `spawnSync("bun", [main])`, Bun acts as a **JS runtime** loading `main.js` as a file argument — not as a package manager executing a binary. Therefore, the `#!/usr/bin/env node` shebang in `main.js` is **ignored** (treated as a hashbang comment), and the file runs under Bun.

### Why the Re-exec Does Not Loop

A natural concern: if `main.js` has `#!/usr/bin/env node` and Bun respects shebangs, wouldn't `spawnSync("bun", [main])` delegate back to Node.js, creating an infinite chain?

No. Bun only respects shebangs in **package manager mode** (resolving bins from `node_modules/.bin/`). When invoked as `bun file.js`, Bun is a JS runtime that loads the file directly — the OS `exec` syscall is never involved, so the shebang is never interpreted as a process directive.

```
spawnSync("bun", [main.js])
           |
           v
     OS executes the "bun" binary with "main.js" as an argument.
     Bun reads main.js as JavaScript source.
     The #! line is a hashbang comment (TC39 spec), not an OS exec directive.
     -> Runs under Bun. No delegation to Node.
```

### Shebang in Compiled Output

`bun build --target node` preserves the entry-point file's shebang in the compiled output. This is intentional behavior in Bun's bundler ([source: `postProcessJSChunk.zig`](https://github.com/oven-sh/bun/blob/main/src/bundler/linker_context/postProcessJSChunk.zig)). The preserved shebang serves a purpose: if a user runs `./dist/cli/main.js` directly (without an explicit runtime), the OS will use Node.js, which is the correct fallback for the `--target node` compiled output.

## Node.js API Compatibility

All Bun-specific APIs were replaced with portable Node.js equivalents to ensure the compiled bundle runs correctly on both runtimes:

| Bun API                      | Node.js Replacement                       |
| ---------------------------- | ----------------------------------------- |
| `Bun.file()` / `Bun.write()` | `fs/promises` (`readFile`, `writeFile`)   |
| `Bun.spawn()`                | `child_process` (`execSync`, `spawnSync`) |
| `Bun.resolveSync()`          | `path.resolve()`                          |
| `Bun.env`                    | `process.env`                             |

The source TypeScript files (`src/`) continue to use `#!/usr/bin/env node` shebangs rather than `#!/usr/bin/env bun`. This ensures they can be executed directly by Node.js when compiled, while Bun handles them natively via its Node.js compatibility layer.

Development scripts (`scripts/`) retain `#!/usr/bin/env bun` shebangs since they are not compiled or distributed.

## CI Verification

The CI pipeline verifies both runtime paths in the `build-cli` job:

```yaml
- name: Smoke test (Node.js)
  run: node dist/cli/launcher.js --help

- name: Smoke test (Bun)
  run: bun dist/cli/main.js --help
```

This ensures the compiled CLI functions correctly under both runtimes on every push.

## Anti-Patterns

- **Do not use Bun-specific APIs in `src/`.** All source files must use portable Node.js APIs to maintain dual-runtime compatibility.
- **Do not remove the shebang from `src/cli/main.ts`.** Bun's bundler preserves it in the compiled output, where it serves as the fallback interpreter for direct execution.
- **Do not change `launcher.js` to a TypeScript file.** It must remain plain JavaScript that runs on any Node.js >= 18 without transpilation.
- **Do not add a `--bun` flag to the launcher re-exec path.** The re-exec uses `bun file.js` (runtime mode), not `bunx` (package manager mode), so shebangs are already ignored.
