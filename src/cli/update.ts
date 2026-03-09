import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkInstallStatus } from "../install/checker.js";
import { install } from "../install/installer.js";
import { MANIFEST_FILENAME, readManifest } from "../install/manifest.js";
import { TargetTool } from "../schemas/common.js";
import {
  bold,
  cyan,
  green,
  parseArgs,
  red,
  resolveRootDir,
  yellow,
} from "./utils.js";

const NAME = "agent-toolbox";

function printUpdateHelp(): void {
  console.log(
    `
USAGE
  ${NAME} update [options]

DESCRIPTION
  Update installed skills to the latest catalog versions.
  Re-installs using the original install filters from the manifest.
  Without --target, updates all targets that have an install manifest.

OPTIONS
  --target <tool>     Update specific target only
  --dry-run           Preview what would be updated
  --refresh           Force re-download catalog
  --offline           Use cached catalog only

EXAMPLES
  ${NAME} update
  ${NAME} update --target claude-code
  ${NAME} update --dry-run
  ${NAME} update --refresh
`.trimStart(),
  );
}

/**
 * Discover all targets that have an install manifest.
 */
async function discoverTargets(rootDir: string): Promise<string[]> {
  const targetsDir = join(rootDir, "dist", "targets");
  if (!existsSync(targetsDir)) {
    return [];
  }

  const entries = await readdir(targetsDir, { withFileTypes: true });
  const targets: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const manifestPath = join(targetsDir, entry.name, MANIFEST_FILENAME);
    if (existsSync(manifestPath)) {
      targets.push(entry.name);
    }
  }

  return targets;
}

export async function runUpdate(
  rootDir: string,
  argv: string[],
): Promise<void> {
  const args = parseArgs(argv);

  if (args.help === "true" || args.h === "true") {
    printUpdateHelp();
    process.exit(0);
  }

  const dryRun = args["dry-run"] === "true";
  const refresh = args.refresh === "true";
  const offline = args.offline === "true";

  // Determine targets to update
  let targets: string[];
  if (typeof args.target === "string" && args.target !== "true") {
    const targetParse = TargetTool.safeParse(args.target);
    if (!targetParse.success) {
      console.error(
        `${red("Error:")} Invalid target: ${args.target}. Valid: claude-code, opencode, cursor, codex, gemini`,
      );
      process.exit(1);
    }
    targets = [targetParse.data];
  } else {
    targets = await discoverTargets(rootDir);
    if (targets.length === 0) {
      console.log(
        `No install manifests found. Run '${NAME} install --target <tool>' first.`,
      );
      process.exit(0);
    }
  }

  for (const target of targets) {
    const targetDir = join(rootDir, "dist", "targets", target);
    const manifest = await readManifest(targetDir);

    if (!manifest) {
      console.error(
        `${yellow("Warning:")} No manifest for ${target}. Skipping.`,
      );
      continue;
    }

    // Check for changes
    let checkResult;
    try {
      checkResult = await checkInstallStatus(rootDir, target, {
        refresh,
        offline,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`${yellow("Warning:")} ${target}: ${message}`);
      continue;
    }

    const { summary } = checkResult;
    const hasChanges =
      summary.outdated > 0 ||
      summary.newInCatalog > 0 ||
      summary.removedFromCatalog > 0;

    if (!hasChanges) {
      console.log(
        `${green("✓")} ${bold(target)}: All ${summary.upToDate} skill(s) up to date.`,
      );
      continue;
    }

    // Report changes
    console.log(`\n${bold(target)}:`);
    if (summary.outdated > 0) {
      const names = checkResult.entries
        .filter((e) => e.status === "outdated")
        .map((e) => e.name);
      console.log(
        `  ${yellow("↑")} ${summary.outdated} outdated: ${names.join(", ")}`,
      );
    }
    if (summary.newInCatalog > 0) {
      const names = checkResult.entries
        .filter((e) => e.status === "new-in-catalog")
        .map((e) => e.name);
      console.log(
        `  ${cyan("+")} ${summary.newInCatalog} new: ${names.join(", ")}`,
      );
    }
    if (summary.removedFromCatalog > 0) {
      const names = checkResult.entries
        .filter((e) => e.status === "removed-from-catalog")
        .map((e) => e.name);
      console.log(
        `  ${red("-")} ${summary.removedFromCatalog} removed from catalog: ${names.join(", ")}`,
      );
    }

    if (dryRun) {
      console.log(
        `  ${yellow("[DRY RUN]")} Would re-install with original filters.`,
      );
      continue;
    }

    // Re-install with original filters + refresh
    const result = await install(rootDir, {
      target: manifest.target,
      domain: manifest.filters.domain,
      subdomain: manifest.filters.subdomain,
      framework: manifest.filters.framework,
      tag: manifest.filters.tag,
      skill: manifest.filters.skill,
      preset: manifest.filters.preset,
      dryRun: false,
      interactive: false,
      refresh: true,
      offline,
    });

    if (result.generatorResult) {
      console.log(
        `  ${green("✓")} Updated ${result.generatorResult.skillCount} skills for ${target}`,
      );
    }
  }
}

if (import.meta.main) {
  const rootDir = resolveRootDir(dirname(fileURLToPath(import.meta.url)));
  runUpdate(rootDir, process.argv.slice(2)).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${red("Error:")} ${message}`);
    process.exit(1);
  });
}
