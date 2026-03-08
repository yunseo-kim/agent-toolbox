#!/usr/bin/env bun

import { basename, dirname, resolve } from "node:path";
import { scanSkills } from "../catalog/scanner.js";
import { validateCatalog } from "../catalog/validator.js";
import { green, red, resolveRootDir, yellow } from "./utils.js";

function skillKeyFromPath(path: string): string {
  if (path.endsWith("SKILL.md")) {
    return basename(dirname(path));
  }

  return basename(path);
}

export async function runValidate(rootDir: string): Promise<void> {
  const catalogDir = resolve(rootDir, "catalog");
  const taxonomyPath = resolve(catalogDir, "metadata/taxonomy.yaml");

  console.log("Validating catalog...\n");

  const result = await validateCatalog(catalogDir, taxonomyPath);
  const scan = await scanSkills(catalogDir);
  const invalidMessages = new Map<string, string>();

  for (const error of result.errors) {
    const key = skillKeyFromPath(error.path);

    if (!invalidMessages.has(key)) {
      invalidMessages.set(key, error.message);
    }
  }

  const parsedSkillNames = new Set(scan.skills.map((skill) => skill.dirName));

  for (const skill of [...scan.skills].sort((a, b) =>
    a.frontmatter.name.localeCompare(b.frontmatter.name),
  )) {
    const failure = invalidMessages.get(skill.dirName);

    if (failure) {
      console.log(`${red("✗")} ${skill.frontmatter.name}: ${failure}`);
    } else {
      console.log(
        `${green("✓")} ${skill.frontmatter.name} (${skill.frontmatter.metadata.domain})`,
      );
    }
  }

  for (const [skillName, message] of [...invalidMessages.entries()].sort(
    ([a], [b]) => a.localeCompare(b),
  )) {
    if (!parsedSkillNames.has(skillName)) {
      console.log(`${red("✗")} ${skillName}: ${message}`);
    }
  }

  if (result.warnings.length > 0) {
    console.log("\nWarnings:");

    for (const warning of result.warnings) {
      const fieldSuffix = warning.field ? ` (${warning.field})` : "";
      console.log(
        `  ${yellow("!")} ${skillKeyFromPath(warning.path)}${fieldSuffix}: ${warning.message}`,
      );
    }
  }

  console.log("\nResults:");
  console.log(`  Total: ${result.stats.totalSkills}`);
  console.log(`  Valid: ${result.stats.validSkills}`);
  console.log(`  Invalid: ${result.stats.invalidSkills}`);
  console.log("\n  Domains:");

  for (const [domain, count] of Object.entries(result.stats.domains).sort(
    ([a], [b]) => a.localeCompare(b),
  )) {
    console.log(`    ${domain}: ${count}`);
  }

  process.exit(result.valid ? 0 : 1);
}

if (import.meta.main) {
  const rootDir = resolveRootDir(import.meta.dir);
  runValidate(rootDir).catch((error) => {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`${red("✗")} ${reason}`);
    process.exit(1);
  });
}
