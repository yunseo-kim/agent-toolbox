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
import { green, red, resolveRootDir, yellow } from "./utils.js";

const ALL_TARGETS = [
  "claude-code",
  "opencode",
  "cursor",
  "codex",
  "gemini",
] as const;

function getGenerator(target: string): TargetGenerator {
  const generators: Record<string, TargetGenerator> = {
    "claude-code": new ClaudeCodeGenerator(),
    opencode: new OpenCodeGenerator(),
    cursor: new CursorGenerator(),
    codex: new CodexGenerator(),
    gemini: new GeminiGenerator(),
  };

  const generator = generators[target];
  if (!generator) {
    throw new Error(`Generator for '${target}' not yet implemented`);
  }

  return generator;
}

export async function runBuildTarget(
  rootDir: string,
  target: string,
): Promise<void> {
  const catalogDir = join(rootDir, "catalog");

  const targetParse = TargetTool.safeParse(target);
  if (!targetParse.success) {
    console.error(
      `Invalid target: ${target}. Valid targets: claude-code, opencode, cursor, codex, gemini`,
    );
    process.exit(1);
  }

  const generator = getGenerator(targetParse.data);

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

  const outputDir = join(rootDir, "dist", "targets", targetParse.data);
  console.log(`Generating ${targetParse.data} artifacts...`);

  const result = await generator.generate({
    skills,
    outputDir,
    catalogDir,
    version,
  });

  console.log(
    `${green("✓")} Generated ${result.skillCount} skills for ${result.target}`,
  );
  console.log(`  Output: ${result.outputDir}`);
  console.log(`  Artifacts: ${result.artifacts.length} items`);

  if (result.warnings.length > 0) {
    console.log("\nWarnings:");
    for (const warning of result.warnings) {
      console.log(`  ${yellow("!")} ${warning}`);
    }
  }
}

export async function runBuildAll(rootDir: string): Promise<void> {
  for (const target of ALL_TARGETS) {
    await runBuildTarget(rootDir, target);
    console.log("");
  }
}

if (import.meta.main) {
  const rootDir = resolveRootDir(import.meta.dir);

  const targetArg =
    process.argv.find((_, index) => process.argv[index - 1] === "--target") ??
    process.argv[process.argv.length - 1];

  if (!targetArg) {
    console.error(
      `Usage: bun run build-target.ts --target <claude-code|opencode|cursor|codex|gemini|all>`,
    );
    process.exit(1);
  }

  const run =
    targetArg === "all"
      ? runBuildAll(rootDir)
      : runBuildTarget(rootDir, targetArg);

  run.catch((error) => {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`${red("✗")} ${reason}`);
    process.exit(1);
  });
}
