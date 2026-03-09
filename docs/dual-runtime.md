# Dual-Runtime Architecture

**Last Updated:** 12026-03-10
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

### Execution Path Performance

Cold-start and warm (steady-state) benchmarks measuring the wall-clock time of each launcher path. Cold measurements use `sudo purge` (macOS) to flush the unified buffer cache between every trial, ensuring each starts with no page cache or dyld shared cache hits.

**Environment:** Bun 1.3.5, Node.js v24.0.1, macOS arm64
**Methodology:** 100 cold trials (purged), 100 warm iterations (3 warmup), median reported
**Benchmark script:** [`scripts/bench-paths.ts`](../scripts/bench-paths.ts)

#### `--version` (startup overhead only)

| Path                  | Cold (median) | Warm (median) | Cold / Warm |
| --------------------- | ------------- | ------------- | ----------- |
| Path 1 (`npx`)        | 640.7 ms      | 92.4 ms       | 6.93x       |
| Path 2 (`bunx`)       | 650.9 ms      | 92.4 ms       | 7.04x       |
| Path 3 (`bunx --bun`) | 260.1 ms      | 52.6 ms       | 4.95x       |

<details>
<summary>Full statistics</summary>

**Cold start (100 trials, purged):**

| Path   | Median   | Mean ± StdDev       | Min      | Max      |
| ------ | -------- | ------------------- | -------- | -------- |
| Path 1 | 640.7 ms | 734.9 ms ± 277.7 ms | 524.3 ms | 2.04 s   |
| Path 2 | 650.9 ms | 676.7 ms ± 174.5 ms | 482.6 ms | 1.94 s   |
| Path 3 | 260.1 ms | 273.4 ms ± 81.2 ms  | 199.7 ms | 877.2 ms |

**Warm (100 iterations, 3 warmup):**

| Path   | Median  | Mean ± StdDev    | Min     | Max      |
| ------ | ------- | ---------------- | ------- | -------- |
| Path 1 | 92.4 ms | 94.0 ms ± 8.5 ms | 82.6 ms | 159.9 ms |
| Path 2 | 92.4 ms | 92.2 ms ± 2.0 ms | 83.9 ms | 96.1 ms  |
| Path 3 | 52.6 ms | 52.1 ms ± 3.3 ms | 46.9 ms | 77.0 ms  |

</details>

#### `validate` (118 skills — real workload)

| Path                  | Cold (median) | Warm (median) | Cold / Warm |
| --------------------- | ------------- | ------------- | ----------- |
| Path 1 (`npx`)        | 749.7 ms      | 152.7 ms      | 4.91x       |
| Path 2 (`bunx`)       | 763.1 ms      | 150.5 ms      | 5.07x       |
| Path 3 (`bunx --bun`) | 360.3 ms      | 108.9 ms      | 3.31x       |

<details>
<summary>Full statistics</summary>

**Cold start (100 trials, purged):**

| Path   | Median   | Mean ± StdDev       | Min      | Max    |
| ------ | -------- | ------------------- | -------- | ------ |
| Path 1 | 749.7 ms | 750.8 ms ± 65.8 ms  | 571.0 ms | 1.06 s |
| Path 2 | 763.1 ms | 781.6 ms ± 85.1 ms  | 632.5 ms | 1.16 s |
| Path 3 | 360.3 ms | 392.8 ms ± 108.9 ms | 316.2 ms | 1.08 s |

**Warm (100 iterations, 3 warmup):**

| Path   | Median   | Mean ± StdDev     | Min      | Max      |
| ------ | -------- | ----------------- | -------- | -------- |
| Path 1 | 152.7 ms | 154.1 ms ± 8.2 ms | 143.9 ms | 201.3 ms |
| Path 2 | 150.5 ms | 151.3 ms ± 4.3 ms | 143.4 ms | 166.2 ms |
| Path 3 | 108.9 ms | 109.2 ms ± 1.1 ms | 107.3 ms | 112.7 ms |

</details>

#### Observations

- **Cold-start penalty is substantial.** The first invocation after a cache flush costs 4–7× more than a warm run, dominated by runtime binary loading and dyld shared library resolution — not application code.
- **Path 2's re-exec overhead is invisible in warm state.** Despite spawning two processes (Node.js → Bun), Path 2's warm median matches Path 1's. The Node.js bootloader exits immediately after `spawnSync`, and Bun's fast startup absorbs the overhead.
- **Path 3 is consistently fastest** across both cold and warm conditions. With a single Bun process, it eliminates Node.js startup entirely, achieving ~0.57x warm and ~0.41x cold relative to Paths 1–2.
- **Cold variance is high** (stddev 65–278 ms), reflecting macOS disk I/O jitter and dyld cache rebuild variability. Warm variance is low (stddev 1–9 ms), confirming steady-state reproducibility.

### Path 2 Optimization Analysis

The benchmarks above reveal that Path 2's re-exec provides **zero net benefit** for typical CLI operations. Node.js startup (~40 ms) + Bun startup (~25 ms) + process spawn overhead cancels out Bun's faster execution, leaving Path 2 at exactly Path 1 performance. A natural question is whether Path 2 can be improved to approach Path 3.

#### What If the Shebang Were `#!/usr/bin/env bun`?

Changing the launcher shebang from `#!/usr/bin/env node` to `#!/usr/bin/env bun` would make Path 2 match Path 3 — but at the cost of breaking Path 1 entirely:

```
npx agent-toolbox            (shebang = #!/usr/bin/env bun)
 |  npm resolves bin -> dist/cli/launcher.js
 |  OS reads shebang -> #!/usr/bin/env bun
 v
env looks up "bun" in $PATH
 |
 ├─ bun installed   -> Bun runs launcher.js in-process (fast, like Path 3) ✓
 └─ bun NOT installed -> "env: bun: No such file or directory"             ✗
```

```
bunx agent-toolbox           (shebang = #!/usr/bin/env bun)
 |  Bun package manager resolves bin -> dist/cli/launcher.js
 |  OS reads shebang -> #!/usr/bin/env bun -> spawns Bun
 v
Bun executes launcher.js     <- single Bun process
 |  globalThis.Bun = defined  -> else branch
 v
await import("./main.js")    -> in-process under Bun (= Path 3 performance) ✓
```

|                           | `#!/usr/bin/env node` (current)                   | `#!/usr/bin/env bun`         |
| ------------------------- | ------------------------------------------------- | ---------------------------- |
| **Path 1** (`npx`)        | ✓ Node.js in-process                              | ✗ Fails if bun not installed |
| **Path 2** (`bunx`)       | ≈ Path 1 (re-exec overhead cancels Bun advantage) | ✓ = Path 3 performance       |
| **Path 3** (`bunx --bun`) | ✓ Bun in-process                                  | ✓ Unchanged                  |

On Windows, npm's [`cmd-shim`](https://github.com/npm/cmd-shim) parses the shebang to generate `.cmd` wrappers. A `#!/usr/bin/env bun` shebang produces `@bun "%~dp0\...\launcher.js" %*` — which also fails when bun is not in PATH. There is no silent fallback to Node.js on any platform.

**The fundamental constraint:** a shebang can specify exactly one interpreter. There is no mechanism in npm or Bun's package manager to conditionally select a runtime based on availability. Making Path 2 fast necessarily breaks Path 1 for npm-only users.

#### Alternatives Evaluated

| Alternative                                                      | Mechanism                                                         | Verdict                                                                                                                                                                                                    |
| ---------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Shell polyglot launcher** (`#!/usr/bin/env sh`)                | Shell script checks for `bun`, falls back to `node`               | Windows `cmd-shim` expects the shebang interpreter to exist; `sh` may be absent. Cross-platform fragile. **Rejected.**                                                                                     |
| **`bunfig.toml` `[run] bun = true`**                             | Bun config to make `bunx` behave like `bunx --bun` by default     | Only affects `bun run`, not `bunx` for remote packages. User-side setting, not package-controlled. [Known inconsistency](https://github.com/oven-sh/bun/issues/18813). **Not viable.**                     |
| **Separate bin entries** (`agent-toolbox` + `agent-toolbox-bun`) | Two entry points with different shebangs                          | Namespace pollution, confusing UX. **Rejected.**                                                                                                                                                           |
| **`bun build --compile`** standalone binary                      | Platform-specific compiled executable, near-zero startup          | Requires per-platform binaries (darwin-arm64, linux-x64, etc.), dramatically increases package size and release complexity. **Disproportionate for current scale.**                                        |
| **`npm postinstall`** shebang rewrite                            | Detect available runtime at install time, rewrite shebang         | Security concern (postinstall scripts are an attack vector), fragile across package managers. **Rejected.**                                                                                                |
| **Remove re-exec entirely**                                      | Always run in-process under whatever runtime invoked the launcher | Loses Bun's execution advantage for heavy workloads (commands where Bun saves >42 ms net). The re-exec break-even point is ~300 ms Node.js execution time. **Premature — kept for future heavy commands.** |

#### Current Strategy

Given the structural constraint, the adopted strategy is:

1. **Keep `#!/usr/bin/env node`** for maximum npm compatibility.
2. **Keep the re-exec** for potential benefit on heavy-workload commands that exceed the ~42 ms break-even threshold.
3. **Recommend `bunx --bun`** as the documented fast path for Bun users (1.76× warm, 2.5× cold improvement over Paths 1–2).
4. **Declare `"engines": { "bun": ">=1.0" }`** in `package.json` — a zero-cost, forward-compatible annotation. [Bun Issue #9346](https://github.com/oven-sh/bun/issues/9346) (authored by Bun's creator) proposes using this field to make `bunx` automatically bypass the shebang and run under Bun, which would make Path 2 match Path 3 performance without any launcher code changes.

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

| Category        | Bun API                             | Node.js Replacement                       | Call Sites |
| --------------- | ----------------------------------- | ----------------------------------------- | ---------- |
| File read       | `Bun.file(path).text()` / `.json()` | `readFile(path, "utf8")` + `JSON.parse()` | 7          |
| File write      | `Bun.write(path, data)`             | `writeFile(path, data, "utf8")`           | 20         |
| Process spawn   | `Bun.spawn([...])`                  | `promisify(execFile)(...)`                | 1          |
| Path resolution | `import.meta.dir`                   | `dirname(fileURLToPath(import.meta.url))` | 10         |

The source TypeScript files (`src/`) continue to use `#!/usr/bin/env node` shebangs rather than `#!/usr/bin/env bun`. This ensures they can be executed directly by Node.js when compiled, while Bun handles them natively via its Node.js compatibility layer.

Development scripts (`scripts/`) retain `#!/usr/bin/env bun` shebangs since they are not compiled or distributed.

### Performance Impact

A natural concern is whether using Node.js compatibility APIs instead of Bun-native APIs sacrifices performance when the CLI runs under Bun. Micro-benchmarks and real-world measurements show the impact is **negligible to zero**.

#### Micro-Benchmarks (Bun 1.3.5, macOS arm64, 1000 iterations, median of 3 trials)

**File read** (`Bun.file().text()` vs `readFile()`):

| File Size | Bun Native | Node.js Compat | Ratio                 |
| --------- | ---------- | -------------- | --------------------- |
| 1 KB      | 57.3 ms    | 36.1 ms        | 0.63x (compat faster) |
| 10 KB     | 42.0 ms    | 43.4 ms        | 1.03x                 |
| 100 KB    | 49.9 ms    | 50.9 ms        | 1.02x                 |

**File write** (`Bun.write()` vs `writeFile()`):

| File Size | Bun Native | Node.js Compat | Ratio |
| --------- | ---------- | -------------- | ----- |
| 1 KB      | 272.8 ms   | 300.0 ms       | 1.10x |
| 10 KB     | 296.0 ms   | 311.0 ms       | 1.05x |
| 100 KB    | 302.3 ms   | 308.5 ms       | 1.02x |

**Process spawn** (`Bun.spawnSync()` vs `spawnSync()`, 100 iterations):

| API               | Total    | Per Call |
| ----------------- | -------- | -------- |
| `Bun.spawnSync()` | 302.9 ms | 3.03 ms  |
| `spawnSync()`     | 299.4 ms | 2.99 ms  |

**Path resolution** (`import.meta.dir` vs `dirname(fileURLToPath(import.meta.url))`): Pure in-memory string operations with no measurable difference.

#### Real-World CLI Timing

| Command                 | Bun (Node.js APIs) | Node.js | Difference |
| ----------------------- | ------------------ | ------- | ---------- |
| `--version`             | ~65 ms             | ~62 ms  | Negligible |
| `validate` (118 skills) | ~188 ms            | ~155 ms | ~33 ms     |

#### Why There Is No Penalty

Bun implements `node:fs/promises` using the same optimized I/O engine (macOS kqueue / Linux io_uring) that powers its native `Bun.file()` and `Bun.write()` APIs. When code calls `readFile()` under Bun, it internally follows the same fast path as `Bun.file().text()`. The Node.js compatibility layer is not a separate, slower implementation — it is a thin API surface over the same core.

#### Alternatives Considered

| Alternative                             | Description                                       | Verdict                                                             |
| --------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------- |
| Runtime conditional branching           | `globalThis.Bun ? Bun.file() : readFile()`        | Adds complexity for ~0% gain. **Rejected.**                         |
| Dual build targets                      | Separate `--target bun` / `--target node` bundles | Doubles build pipeline and maintenance. **Rejected.**               |
| package.json `"bun"` export condition   | Runtime-specific entry points                     | Not applicable to CLI `bin` packages (single entry point). **N/A.** |
| **Current approach** (Node.js API only) | Single codebase, both runtimes                    | No measurable performance cost, minimal maintenance. **Adopted.**   |

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
- **Do not change the launcher shebang to `#!/usr/bin/env bun`.** This breaks `npx` for all users without Bun installed — on both POSIX (`env: bun: No such file or directory`) and Windows (npm's `cmd-shim` generates a wrapper that calls `bun.exe`). See [Path 2 Optimization Analysis](#path-2-optimization-analysis) for the full tradeoff evaluation.
