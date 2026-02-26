#!/usr/bin/env bun

import { join, resolve } from "node:path";
import { scanSkills } from "../catalog/scanner.js";
import { ClaudeCodeGenerator } from "../generators/claude-code/generator.js";
import { CodexGenerator } from "../generators/codex/generator.js";
import { CursorGenerator } from "../generators/cursor/generator.js";
import { GeminiGenerator } from "../generators/gemini/generator.js";
import { OpenCodeGenerator } from "../generators/opencode/generator.js";
import type { TargetGenerator } from "../generators/types.js";
import { TargetTool } from "../schemas/common.js";

const rootDir = resolve(import.meta.dir, "../..");
const catalogDir = join(rootDir, "catalog");

const targetArg =
  process.argv.find((_, index) => process.argv[index - 1] === "--target") ??
  process.argv[process.argv.length - 1];

if (!targetArg) {
  console.error("Usage: bun run build-target.ts --target <claude-code|opencode|cursor|codex|gemini>");
  process.exit(1);
}

const targetParse = TargetTool.safeParse(targetArg);
if (!targetParse.success) {
  console.error(`Invalid target: ${targetArg}. Valid targets: claude-code, opencode, cursor, codex, gemini`);
  process.exit(1);
}

const target = targetParse.data;

const generators: Partial<Record<string, TargetGenerator>> = {
  "claude-code": new ClaudeCodeGenerator(),
  opencode: new OpenCodeGenerator(),
  cursor: new CursorGenerator(),
  codex: new CodexGenerator(),
  gemini: new GeminiGenerator(),
};

const generator = generators[target];
if (!generator) {
  console.error(`Generator for '${target}' not yet implemented`);
  process.exit(1);
}

console.log("Scanning catalog...");
const { skills, errors } = await scanSkills(catalogDir);

if (errors.length > 0) {
  console.error(`Found ${errors.length} scan errors:`);
  for (const err of errors) {
    console.error(`  ${err.path}: ${err.error}`);
  }
}

if (skills.length === 0) {
  console.error("No skills found in catalog");
  process.exit(1);
}

const pkg = await Bun.file(join(rootDir, "package.json")).json();
const version: string = pkg.version;

const outputDir = join(rootDir, "dist", "targets", target);
console.log(`Generating ${target} artifacts...`);

const result = await generator.generate({
  skills,
  outputDir,
  catalogDir,
  version,
});

console.log(`\x1b[32m✓\x1b[0m Generated ${result.skillCount} skills for ${result.target}`);
console.log(`  Output: ${result.outputDir}`);
console.log(`  Artifacts: ${result.artifacts.length} items`);

if (result.warnings.length > 0) {
  console.log("\nWarnings:");
  for (const warning of result.warnings) {
    console.log(`  \x1b[33m!\x1b[0m ${warning}`);
  }
}
