#!/usr/bin/env bun

/**
 * Build the CLI for npm distribution.
 *
 * Uses `bun build` to compile src/cli/main.ts into a single ESM bundle
 * targeting Node.js, then copies the launcher wrapper alongside it.
 *
 * Output:
 *   dist/cli/main.js      — Compiled CLI (no shebang, imported by launcher)
 *   dist/cli/launcher.js   — Handwritten entry point with runtime auto-detection
 *
 * Usage:
 *   bun run build:cli
 */

import { execSync } from "node:child_process";
import { cpSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const outDir = resolve(rootDir, "dist/cli");

// Ensure output directory exists
mkdirSync(outDir, { recursive: true });

// Step 1: Compile main.ts → dist/cli/main.js
console.log("Compiling src/cli/main.ts → dist/cli/main.js ...");

execSync(
  [
    "bun build src/cli/main.ts",
    "--outdir dist/cli",
    "--target node",
    "--format esm",
    "--external yaml",
    "--external zod",
    "--external @toon-format/toon",
  ].join(" "),
  { cwd: rootDir, stdio: "inherit" },
);

// Step 2: Copy launcher wrapper
console.log("Copying launcher wrapper → dist/cli/launcher.js ...");

cpSync(resolve(rootDir, "src/cli/launcher.js"), resolve(outDir, "launcher.js"));

console.log("✓ CLI build complete: dist/cli/");
