import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { scanSkills } from "../catalog/scanner.js";
import { resolveCatalogDir } from "../catalog/provider.js";
import { ClaudeCodeGenerator } from "../generators/claude-code/generator.js";
import { CodexGenerator } from "../generators/codex/generator.js";
import { CursorGenerator } from "../generators/cursor/generator.js";
import { GeminiGenerator } from "../generators/gemini/generator.js";
import { OpenCodeGenerator } from "../generators/opencode/generator.js";
import type { GeneratorResult, TargetGenerator } from "../generators/types.js";
import {
  InstallFilters,
  type InstallFiltersInput,
} from "../schemas/install.js";
import { filterSkills, type FilterResult } from "./filter.js";
import { writeManifest } from "./manifest.js";
import { loadPresets, resolvePreset } from "./presets.js";

export interface InstallResult {
  filterResult: FilterResult;
  generatorResult: GeneratorResult | null;
  dryRun: boolean;
}

const generatorMap: Record<string, () => TargetGenerator> = {
  "claude-code": () => new ClaudeCodeGenerator(),
  opencode: () => new OpenCodeGenerator(),
  cursor: () => new CursorGenerator(),
  codex: () => new CodexGenerator(),
  gemini: () => new GeminiGenerator(),
};

export async function install(
  rootDir: string,
  rawFilters: InstallFiltersInput,
): Promise<InstallResult> {
  const filters = InstallFilters.parse(rawFilters);
  const catalogResolveOptions = {
    rootDir,
    remote: undefined,
    refresh: filters.refresh,
    offline: filters.offline,
  };
  const catalogDir = await resolveCatalogDir(catalogResolveOptions);
  const isRemoteCatalog = !catalogDir.startsWith(rootDir);
  const presetsPath = join(catalogDir, "metadata", "presets.yaml");

  const { skills, errors } = await scanSkills(catalogDir);
  if (errors.length > 0) {
    console.error(`Scan errors: ${errors.length}`);
    for (const err of errors) {
      console.error(`  ${err.path}: ${err.error}`);
    }
  }

  const resolvedFilters: InstallFilters = { ...filters };
  if (filters.preset) {
    const presets = await loadPresets(presetsPath);
    const presetSkills = resolvePreset(presets, filters.preset);
    if (!presetSkills) {
      throw new Error(`Preset '${filters.preset}' not found in presets.yaml`);
    }
    resolvedFilters.skill = [...(resolvedFilters.skill ?? []), ...presetSkills];
  }

  const filterResult = filterSkills(skills, resolvedFilters);

  if (filters.dryRun) {
    return { filterResult, generatorResult: null, dryRun: true };
  }

  const createGenerator = generatorMap[filters.target];
  if (!createGenerator) {
    throw new Error(
      `Generator for '${filters.target}' not yet implemented. Available: ${Object.keys(generatorMap).join(", ")}`,
    );
  }

  const generator = createGenerator();
  const outputDir = join(rootDir, "dist", "targets", filters.target);
  const pkg = JSON.parse(
    await readFile(join(rootDir, "package.json"), "utf8"),
  ) as {
    version: string;
  };

  const generatorResult = await generator.generate({
    skills: filterResult.matched,
    outputDir,
    catalogDir,
    version: pkg.version,
  });

  // Write install manifest for check/update/remove commands
  await writeManifest(outputDir, {
    version: 1 as const,
    target: filters.target,
    installedAt: new Date().toISOString(),
    catalogSource: isRemoteCatalog ? "remote" : "local",
    filters: {
      domain: filters.domain,
      subdomain: filters.subdomain,
      framework: filters.framework,
      tag: filters.tag,
      preset: filters.preset,
      skill: filters.skill,
    },
    skills: filterResult.matched.map((s) => ({
      name: s.frontmatter.name,
      domain: s.frontmatter.metadata.domain,
      subdomain: s.frontmatter.metadata.subdomain,
      lastUpdated: s.frontmatter.metadata.lastUpdated,
    })),
  });

  return { filterResult, generatorResult, dryRun: false };
}
