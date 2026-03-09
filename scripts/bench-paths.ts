#!/usr/bin/env bun

/**
 * Execution path benchmark for dual-runtime launcher.
 *
 * Measures cold (first-run) and warm (steady-state) execution times
 * for the three launcher paths documented in docs/dual-runtime.md:
 *
 *   Path 1: node dist/cli/launcher.js            → Node.js in-process
 *   Path 2: node dist/cli/launcher.js + bunx env  → Node.js → Bun re-exec
 *   Path 3: bun dist/cli/launcher.js             → Bun in-process
 *
 * Path 2 is simulated by injecting npm_config_user_agent="bun/..." into the
 * environment, which triggers the launcher's re-exec branch (isBunx=true,
 * globalThis.Bun=undefined).
 *
 * Cold measurement: Each path is run --cold-trials times before any warmup.
 * Without --purge, only the first trial is truly cold (OS page cache, dyld
 * shared cache are unpopulated). Subsequent trials show the cache warming
 * curve. With --purge (macOS only, requires sudo), the OS unified buffer
 * cache is purged before each trial, making every trial independently cold.
 *
 * Usage:
 *   bun run scripts/bench-paths.ts
 *   bun run scripts/bench-paths.ts --iterations 30 --warmup 5
 *   bun run scripts/bench-paths.ts --cold-trials 5 --purge
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const launcher = resolve(rootDir, "dist/cli/launcher.js");

const argv = process.argv.slice(2);

function numFlag(name: string, fallback: number): number {
  const idx = argv.indexOf(name);
  return idx >= 0 ? parseInt(argv[idx + 1], 10) : fallback;
}

const ITERATIONS = numFlag("--iterations", 20);
const WARMUP = numFlag("--warmup", 3);
const COLD_TRIALS = numFlag("--cold-trials", 3);
const PURGE = argv.includes("--purge");

// ---------------------------------------------------------------------------
// Prerequisites
// ---------------------------------------------------------------------------

function check(label: string, ok: boolean, hint: string): void {
  if (!ok) {
    console.error(`Error: ${label} — ${hint}`);
    process.exit(1);
  }
}

check("launcher", existsSync(launcher), "Run 'bun run build:cli' first.");
check(
  "node",
  spawnSync("node", ["--version"], { stdio: "pipe" }).status === 0,
  "node not found in PATH.",
);
check(
  "bun",
  spawnSync("bun", ["--version"], { stdio: "pipe" }).status === 0,
  "bun not found in PATH.",
);

if (PURGE) {
  if (process.platform !== "darwin") {
    console.error(
      "Error: --purge is only supported on macOS (uses `sudo purge`).",
    );
    process.exit(1);
  }
  const probe = spawnSync("sudo", ["-n", "purge"], { stdio: "pipe" });
  if (probe.status !== 0) {
    console.error(
      "Error: --purge requires passwordless sudo. Run `sudo -v` first to cache credentials.",
    );
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PathSpec {
  label: string;
  short: string;
  cmd: string;
  args: string[];
  env?: Record<string, string>;
}

interface WarmStats {
  min: number;
  median: number;
  mean: number;
  max: number;
  stddev: number;
}

interface BenchResult {
  spec: PathSpec;
  command: string;
  cold: number[]; // individual cold trial times (ms), index 0 = first run
  warm: WarmStats; // aggregated warm statistics
}

// ---------------------------------------------------------------------------
// Path definitions
// ---------------------------------------------------------------------------

function paths(cliArgs: string[]): PathSpec[] {
  return [
    {
      label: "Path 1 — npx (Node.js in-process)",
      short: "Path 1",
      cmd: "node",
      args: [launcher, ...cliArgs],
    },
    {
      label: "Path 2 — bunx (Node.js → Bun re-exec)",
      short: "Path 2",
      cmd: "node",
      args: [launcher, ...cliArgs],
      env: { npm_config_user_agent: "bun/1.3.5 npm/? node/v24.0.1 linux x64" },
    },
    {
      label: "Path 3 — bunx --bun (Bun in-process)",
      short: "Path 3",
      cmd: "bun",
      args: [launcher, ...cliArgs],
    },
  ];
}

// ---------------------------------------------------------------------------
// Cache purge
// ---------------------------------------------------------------------------

function purgeCache(): void {
  spawnSync("sudo", ["-n", "purge"], { stdio: "pipe" });
}

// ---------------------------------------------------------------------------
// Benchmark runner
// ---------------------------------------------------------------------------

function bench(spec: PathSpec, command: string): BenchResult {
  const env = { ...process.env, ...spec.env };
  const opts = { stdio: "pipe" as const, env, cwd: rootDir };

  // --- Cold phase: measure before any warmup ---
  const cold: number[] = [];
  for (let i = 0; i < COLD_TRIALS; i++) {
    if (PURGE) purgeCache();

    const start = performance.now();
    const r = spawnSync(spec.cmd, spec.args, opts);
    cold.push(performance.now() - start);

    if (r.status !== 0 && i === 0) {
      const err = r.stderr?.toString().trim().slice(0, 200);
      console.error(`  ⚠ ${spec.short} exited ${r.status}: ${err}`);
    }
  }

  // --- Warmup (discard) ---
  for (let i = 0; i < WARMUP; i++) {
    spawnSync(spec.cmd, spec.args, opts);
  }

  // --- Warm phase: timed iterations ---
  const times: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    spawnSync(spec.cmd, spec.args, opts);
    times.push(performance.now() - start);
  }

  times.sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  const mean = sum / times.length;
  const variance =
    times.reduce((acc, t) => acc + (t - mean) ** 2, 0) / times.length;

  return {
    spec,
    command,
    cold,
    warm: {
      min: times[0],
      median: times[Math.floor(times.length / 2)],
      mean,
      max: times[times.length - 1],
      stddev: Math.sqrt(variance),
    },
  };
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function fmt(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function pad(s: string, n: number): string {
  return s.padEnd(n);
}

// ---------------------------------------------------------------------------
// Output: Cold table
// ---------------------------------------------------------------------------

function printColdTable(results: BenchResult[]): void {
  const n = results[0].cold.length;

  if (PURGE) {
    // Purge mode: all trials are independent — show aggregate stats
    console.log(`\n#### Cold (purged, ${n} trials)\n`);
    console.log(
      "| Path   | Median     | Mean ± StdDev         | Min        | Max        |",
    );
    console.log(
      "| ------ | ---------- | --------------------- | ---------- | ---------- |",
    );

    for (const r of results) {
      const sorted = [...r.cold].sort((a, b) => a - b);
      const sum = sorted.reduce((a, b) => a + b, 0);
      const mean = sum / sorted.length;
      const variance =
        sorted.reduce((acc, t) => acc + (t - mean) ** 2, 0) / sorted.length;
      const stddev = Math.sqrt(variance);
      const median = sorted[Math.floor(sorted.length / 2)];

      const med = pad(fmt(median), 10);
      const ms = pad(`${fmt(mean)} ± ${fmt(stddev)}`, 21);
      const mn = pad(fmt(sorted[0]), 10);
      const mx = pad(fmt(sorted[sorted.length - 1]), 10);
      console.log(
        `| ${pad(r.spec.short, 6)} | ${med} | ${ms} | ${mn} | ${mx} |`,
      );
    }
  } else {
    // No purge: show individual trial columns — T1 is true cold, T2+ warm progressively
    const headers = Array.from(
      { length: n },
      (_, i) => `T${i + 1}${i === 0 ? " (cold)" : ""}`,
    );
    const colW = 12;

    console.log(`\n#### Cold (${n} trials, no purge)\n`);

    // Header row
    const hdrCells = headers.map((h) => pad(h, colW)).join(" | ");
    console.log(`| Path   | ${hdrCells} |`);

    // Separator row
    const sepCells = headers.map(() => "-".repeat(colW)).join(" | ");
    console.log(`| ------ | ${sepCells} |`);

    // Data rows
    for (const r of results) {
      const cells = r.cold.map((t) => pad(fmt(t), colW)).join(" | ");
      console.log(`| ${pad(r.spec.short, 6)} | ${cells} |`);
    }

    console.log(
      "\n_T1 = true first-run (caches cold). " +
        "T2+ benefit from OS page cache and dyld shared cache._",
    );
    console.log(
      "_Use `--purge` for independent cold trials (macOS only, requires `sudo`)._",
    );
  }
}

// ---------------------------------------------------------------------------
// Output: Warm table
// ---------------------------------------------------------------------------

function printWarmTable(results: BenchResult[]): void {
  console.log(`\n#### Warm (${ITERATIONS} iterations, ${WARMUP} warmup)\n`);
  console.log(
    "| Path   | Median     | Mean ± StdDev         | Min        | Max        |",
  );
  console.log(
    "| ------ | ---------- | --------------------- | ---------- | ---------- |",
  );

  for (const r of results) {
    const w = r.warm;
    const med = pad(fmt(w.median), 10);
    const ms = pad(`${fmt(w.mean)} ± ${fmt(w.stddev)}`, 21);
    const mn = pad(fmt(w.min), 10);
    const mx = pad(fmt(w.max), 10);
    console.log(`| ${pad(r.spec.short, 6)} | ${med} | ${ms} | ${mn} | ${mx} |`);
  }

  // Relative comparison against Path 1
  const base = results[0].warm.median;
  console.log(`\n_Relative to Path 1 (warm median):_`);
  for (const r of results) {
    const ratio = r.warm.median / base;
    const diff = r.warm.median - base;
    const sign = diff >= 0 ? "+" : "";
    console.log(
      `  ${r.spec.short}: **${ratio.toFixed(2)}x** (${sign}${fmt(diff)})`,
    );
  }
}

// ---------------------------------------------------------------------------
// Output: Cold vs Warm comparison
// ---------------------------------------------------------------------------

function printComparison(results: BenchResult[]): void {
  // Use T1 (true first-run) for cold, median for warm
  console.log("\n#### Cold → Warm\n");
  console.log("| Path   | Cold (T1)  | Warm (med) | Δ          | Ratio |");
  console.log("| ------ | ---------- | ---------- | ---------- | ----- |");

  for (const r of results) {
    const coldT1 = r.cold[0];
    const warmMed = r.warm.median;
    const delta = coldT1 - warmMed;
    const ratio = coldT1 / warmMed;
    console.log(
      `| ${pad(r.spec.short, 6)} | ${pad(fmt(coldT1), 10)} | ${pad(fmt(warmMed), 10)} | ${pad(`${delta >= 0 ? "+" : ""}${fmt(delta)}`, 10)} | ${ratio.toFixed(2)}x |`,
    );
  }
}

// ---------------------------------------------------------------------------
// Output: Full section for one command
// ---------------------------------------------------------------------------

function printSection(results: BenchResult[], heading: string): void {
  console.log(`\n### ${heading}`);
  printColdTable(results);
  printWarmTable(results);
  printComparison(results);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const nodeVer = spawnSync("node", ["--version"], { stdio: "pipe" })
  .stdout.toString()
  .trim();
const bunVer = spawnSync("bun", ["--version"], { stdio: "pipe" })
  .stdout.toString()
  .trim();

console.log("## Execution Path Benchmark — Dual-Runtime Launcher");
console.log(
  `\nEnvironment: Bun ${bunVer}, Node.js ${nodeVer}, ${process.platform} ${process.arch}`,
);
console.log(
  `Cold trials: ${COLD_TRIALS}${PURGE ? " (purged)" : ""}, ` +
    `Warm iterations: ${ITERATIONS}, Warmup: ${WARMUP}`,
);

// --- Benchmark: --version (minimal workload) ---
process.stdout.write("\nRunning --version benchmark...");
const vResults = paths(["--version"]).map((p) => {
  process.stdout.write(` [${p.short}]`);
  return bench(p, "--version");
});
console.log(" done.");
printSection(vResults, "`--version` (startup overhead only)");

// --- Benchmark: validate (real workload) ---
process.stdout.write("\nRunning validate benchmark...");
const valResults = paths(["validate"]).map((p) => {
  process.stdout.write(` [${p.short}]`);
  return bench(p, "validate");
});
console.log(" done.");
printSection(valResults, "`validate` (118 skills — real workload)");

// --- Footer ---
console.log("\n---");
console.log(
  "Path 1: `npx` → Node.js runs launcher.js → imports main.js in-process",
);
console.log(
  "Path 2: `bunx` → Node.js runs launcher.js → spawnSync('bun', [main.js]) re-exec",
);
console.log(
  "Path 3: `bunx --bun` → Bun runs launcher.js → imports main.js in-process",
);
