// Inspired by vercel-labs/skills CLI (MIT license).
// Implementation is original, adapted for agent-toolbox's catalog-based architecture.

import { join } from "node:path";
import { resolveCatalogDir } from "../catalog/provider.js";
import { scanSkills } from "../catalog/scanner.js";
import type { ParsedSkill } from "../schemas/catalog.js";
import type { TargetTool } from "../schemas/common.js";
import { filterSkills } from "./filter.js";
import { readManifest } from "./manifest.js";

export interface CheckResultEntry {
  name: string;
  status: "up-to-date" | "outdated" | "removed-from-catalog" | "new-in-catalog";
  installedDate?: string;
  catalogDate?: string;
}

export interface CheckSummary {
  upToDate: number;
  outdated: number;
  removedFromCatalog: number;
  newInCatalog: number;
}

export interface CheckResult {
  target: TargetTool;
  installedAt: string;
  entries: CheckResultEntry[];
  summary: CheckSummary;
}

export interface CheckOptions {
  refresh?: boolean;
  offline?: boolean;
}

/**
 * Check if installed skills are up-to-date compared to the current catalog.
 * Compares manifest's `lastUpdated` timestamps against the catalog.
 */
export async function checkInstallStatus(
  rootDir: string,
  target: string,
  options: CheckOptions = {},
): Promise<CheckResult> {
  const targetDir = join(rootDir, "dist", "targets", target);
  const manifest = await readManifest(targetDir);

  if (!manifest) {
    throw new Error(
      `No install manifest found for '${target}'. Run 'agent-toolbox install --target ${target}' first.`,
    );
  }

  // Resolve and scan current catalog
  const catalogDir = await resolveCatalogDir({
    rootDir,
    refresh: options.refresh,
    offline: options.offline,
  });
  const { skills: catalogSkills } = await scanSkills(catalogDir);

  // Re-apply original filters to get "what would be installed now"
  const currentMatch = filterSkills(catalogSkills, {
    target: manifest.target,
    domain: manifest.filters.domain,
    subdomain: manifest.filters.subdomain,
    framework: manifest.filters.framework,
    tag: manifest.filters.tag,
    skill: manifest.filters.skill,
  });

  // Build lookup map for catalog skills
  const catalogMap = new Map<string, ParsedSkill>();
  for (const skill of currentMatch.matched) {
    catalogMap.set(skill.frontmatter.name.toLowerCase(), skill);
  }

  // Build lookup map for installed skills
  const installedMap = new Map<string, (typeof manifest.skills)[number]>();
  for (const skill of manifest.skills) {
    installedMap.set(skill.name.toLowerCase(), skill);
  }

  const entries: CheckResultEntry[] = [];
  const summary: CheckSummary = {
    upToDate: 0,
    outdated: 0,
    removedFromCatalog: 0,
    newInCatalog: 0,
  };

  // Check installed skills against catalog
  for (const installed of manifest.skills) {
    const catalogSkill = catalogMap.get(installed.name.toLowerCase());

    if (!catalogSkill) {
      entries.push({
        name: installed.name,
        status: "removed-from-catalog",
        installedDate: installed.lastUpdated,
      });
      summary.removedFromCatalog += 1;
    } else if (
      catalogSkill.frontmatter.metadata.lastUpdated !== installed.lastUpdated
    ) {
      entries.push({
        name: installed.name,
        status: "outdated",
        installedDate: installed.lastUpdated,
        catalogDate: catalogSkill.frontmatter.metadata.lastUpdated,
      });
      summary.outdated += 1;
    } else {
      entries.push({
        name: installed.name,
        status: "up-to-date",
        installedDate: installed.lastUpdated,
        catalogDate: catalogSkill.frontmatter.metadata.lastUpdated,
      });
      summary.upToDate += 1;
    }
  }

  // Check for new skills in catalog not in manifest
  for (const [name, catalogSkill] of catalogMap) {
    if (!installedMap.has(name)) {
      entries.push({
        name: catalogSkill.frontmatter.name,
        status: "new-in-catalog",
        catalogDate: catalogSkill.frontmatter.metadata.lastUpdated,
      });
      summary.newInCatalog += 1;
    }
  }

  // Sort: outdated first, then new, then removed, then up-to-date
  const statusOrder: Record<string, number> = {
    outdated: 0,
    "new-in-catalog": 1,
    "removed-from-catalog": 2,
    "up-to-date": 3,
  };
  entries.sort(
    (a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99),
  );

  return {
    target: manifest.target,
    installedAt: manifest.installedAt,
    entries,
    summary,
  };
}
