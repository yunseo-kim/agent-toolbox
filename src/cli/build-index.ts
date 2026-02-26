#!/usr/bin/env bun

import { resolve } from "node:path";
import { buildCatalogIndex, writeCatalogIndex } from "../catalog/index-builder.js";
import { scanSkills } from "../catalog/scanner.js";

const COLOR_RESET = "\x1b[0m";
const COLOR_GREEN = "\x1b[32m";
const COLOR_RED = "\x1b[31m";

function green(text: string): string {
  return `${COLOR_GREEN}${text}${COLOR_RESET}`;
}

function red(text: string): string {
  return `${COLOR_RED}${text}${COLOR_RESET}`;
}

async function main(): Promise<void> {
  const rootDir = resolve(import.meta.dir, "../..");
  const catalogDir = resolve(rootDir, "catalog");
  const outputPath = resolve(catalogDir, "metadata/catalog-index.json");

  const scanResult = await scanSkills(catalogDir);

  if (scanResult.errors.length > 0) {
    for (const error of scanResult.errors) {
      console.error(`${red("✗")} ${error.path}: ${error.error}`);
    }

    process.exit(1);
  }

  const index = buildCatalogIndex(scanResult.skills);
  await writeCatalogIndex(index, outputPath);

  console.log(`${green("✓")} Generated catalog-index.json with ${index.items.length} items`);
}

main().catch((error) => {
  const reason = error instanceof Error ? error.message : String(error);
  console.error(`${red("✗")} ${reason}`);
  process.exit(1);
});
