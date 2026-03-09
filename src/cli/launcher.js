#!/usr/bin/env node

/**
 * Launcher wrapper for dual-runtime support.
 *
 * This is the `bin` entry point for the npm package. It auto-detects
 * the invoking package manager and routes to the appropriate runtime:
 *
 *   npx agent-toolbox     → Node.js (runs main.js directly)
 *   bunx agent-toolbox    → Node.js detects bunx → re-execs with Bun
 *   bunx --bun agent-toolbox → Bun directly (shebang bypassed)
 *
 * This file is plain JavaScript (not compiled) — it must run on any
 * Node.js >= 18 without transpilation.
 */

const isBunx = (process.env.npm_config_user_agent || "").includes("bun/");

if (typeof globalThis.Bun === "undefined" && isBunx) {
  // bunx invoked us but the #!/usr/bin/env node shebang forced Node.js.
  // Re-execute the compiled main.js under Bun for native performance.
  const { spawnSync } = await import("node:child_process");
  const { fileURLToPath } = await import("node:url");
  const main = fileURLToPath(new URL("./main.js", import.meta.url));
  const { status } = spawnSync("bun", [main, ...process.argv.slice(2)], {
    stdio: "inherit",
  });
  process.exit(status ?? 0);
} else {
  // Node.js (npx) or Bun (bunx --bun) — run main.js in-process.
  await import("./main.js");
}
