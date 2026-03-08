import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { checkInstallStatus } from "../install/checker.js";
import { MANIFEST_FILENAME } from "../install/manifest.js";
import { TargetTool } from "../schemas/common.js";
import {
  bold,
  cyan,
  dim,
  green,
  parseArgs,
  red,
  resolveRootDir,
  yellow,
} from "./utils.js";

const NAME = "agent-toolbox";

function printCheckHelp(): void {
  console.log(
    `
USAGE
  ${NAME} check [options]

DESCRIPTION
  Check if installed skills are outdated compared to the current catalog.
  Without --target, checks all targets that have an install manifest.

OPTIONS
  --target <tool>     Check specific target only
  --json              Output as JSON
  --refresh           Force re-download catalog for comparison
  --offline           Use cached catalog only

EXAMPLES
  ${NAME} check
  ${NAME} check --target claude-code
  ${NAME} check --refresh
  ${NAME} check --json
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

export async function runCheck(rootDir: string, argv: string[]): Promise<void> {
  const args = parseArgs(argv);

  if (args.help === "true" || args.h === "true") {
    printCheckHelp();
    process.exit(0);
  }

  const refresh = args.refresh === "true";
  const offline = args.offline === "true";
  const jsonMode = args.json === "true";

  // Determine targets to check
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

  const allResults = [];
  let hasOutdated = false;

  for (const target of targets) {
    try {
      const result = await checkInstallStatus(rootDir, target, {
        refresh,
        offline,
      });
      allResults.push(result);

      if (result.summary.outdated > 0 || result.summary.newInCatalog > 0) {
        hasOutdated = true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!jsonMode) {
        console.error(`${yellow("Warning:")} ${target}: ${message}`);
      }
    }
  }

  if (jsonMode) {
    console.log(JSON.stringify(allResults, null, 2));
    process.exit(hasOutdated ? 1 : 0);
  }

  // Formatted output
  for (const result of allResults) {
    const { summary } = result;

    console.log(
      `\n${bold(result.target)} ${dim(`(installed: ${result.installedAt})`)}`,
    );

    if (summary.upToDate > 0) {
      console.log(`  ${green("✓")} ${summary.upToDate} skill(s) up to date`);
    }
    if (summary.outdated > 0) {
      const outdatedNames = result.entries
        .filter((e) => e.status === "outdated")
        .map((e) => e.name);
      console.log(
        `  ${yellow("↑")} ${summary.outdated} skill(s) outdated: ${outdatedNames.join(", ")}`,
      );
    }
    if (summary.newInCatalog > 0) {
      const newNames = result.entries
        .filter((e) => e.status === "new-in-catalog")
        .map((e) => e.name);
      console.log(
        `  ${cyan("+")} ${summary.newInCatalog} new skill(s) available: ${newNames.join(", ")}`,
      );
    }
    if (summary.removedFromCatalog > 0) {
      const removedNames = result.entries
        .filter((e) => e.status === "removed-from-catalog")
        .map((e) => e.name);
      console.log(
        `  ${red("-")} ${summary.removedFromCatalog} skill(s) removed from catalog: ${removedNames.join(", ")}`,
      );
    }
  }

  if (hasOutdated) {
    const targetHint = targets.length === 1 ? ` --target ${targets[0]}` : "";
    console.log(`\nRun '${NAME} update${targetHint}' to update.`);
  } else if (allResults.length > 0) {
    console.log(`\n${green("✓")} All installed skills are up to date.`);
  }

  process.exit(hasOutdated ? 1 : 0);
}

if (import.meta.main) {
  const rootDir = resolveRootDir(import.meta.dir);
  runCheck(rootDir, process.argv.slice(2)).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${red("Error:")} ${message}`);
    process.exit(1);
  });
}
