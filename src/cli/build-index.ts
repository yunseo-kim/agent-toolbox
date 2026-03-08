#!/usr/bin/env bun

import { resolve } from "node:path";
import {
  buildSkillIndex,
  writeSkillIndex,
  writeSkillIndexToon,
} from "../catalog/index-builder.js";
import { scanSkills } from "../catalog/scanner.js";
import { green, red, resolveRootDir } from "./utils.js";

export async function runBuildIndex(rootDir: string): Promise<void> {
  const catalogDir = resolve(rootDir, "catalog");
  const outputPath = resolve(catalogDir, "metadata/skill-index.json");
  const toonOutputPath = resolve(catalogDir, "metadata/skill-index.toon");

  const scanResult = await scanSkills(catalogDir);

  if (scanResult.errors.length > 0) {
    for (const error of scanResult.errors) {
      console.error(`${red("✗")} ${error.path}: ${error.error}`);
    }

    process.exit(1);
  }

  const index = buildSkillIndex(scanResult.skills);
  await writeSkillIndex(index, outputPath);
  await writeSkillIndexToon(index, toonOutputPath);

  console.log(
    `${green("✓")} Generated skill-index.json with ${index.skills.length} skills`,
  );
  console.log(
    `${green("✓")} Generated skill-index.toon with ${index.skills.length} skills`,
  );
}

if (import.meta.main) {
  const rootDir = resolveRootDir(import.meta.dir);
  runBuildIndex(rootDir).catch((error) => {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`${red("✗")} ${reason}`);
    process.exit(1);
  });
}
