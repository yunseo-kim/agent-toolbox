#!/usr/bin/env bun

import { resolve } from "node:path";
import { buildCatalogIndex, writeCatalogIndex } from "../catalog/index-builder.js";
import { scanSkills } from "../catalog/scanner.js";
import { green, red, resolveRootDir } from "./utils.js";

export async function runBuildIndex(rootDir: string): Promise<void> {
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

if (import.meta.main) {
  const rootDir = resolveRootDir(import.meta.dir);
  runBuildIndex(rootDir).catch((error) => {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`${red("✗")} ${reason}`);
    process.exit(1);
  });
}
