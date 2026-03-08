import { existsSync } from "node:fs";
import { readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { removeSkillsFromManifest } from "../install/manifest.js";
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

function printRemoveHelp(): void {
  console.log(
    `
USAGE
  ${NAME} remove --target <tool> [options]

DESCRIPTION
  Remove installed skills from a target's generated output directory.
  Removed skills will be restored on the next 'install' run.

OPTIONS
  --target <tool>     Required. claude-code | opencode | cursor | codex | gemini
  --skill <name>      Skill(s) to remove (repeatable)
  --all               Remove all installed skills for target
  --dry-run           Preview without removing

EXAMPLES
  ${NAME} remove --target claude-code --skill git-master
  ${NAME} remove --target gemini --skill docs-writer --skill mcp-builder
  ${NAME} remove --target opencode --all
  ${NAME} remove --target cursor --all --dry-run
`.trimStart(),
  );
}

export async function runRemove(
  rootDir: string,
  argv: string[],
): Promise<void> {
  const args = parseArgs(argv);

  if (args.help === "true" || args.h === "true") {
    printRemoveHelp();
    process.exit(0);
  }

  if (!args.target || args.target === "true") {
    console.error(`${red("Error:")} --target is required.`);
    printRemoveHelp();
    process.exit(1);
  }

  const targetParse = TargetTool.safeParse(args.target);
  if (!targetParse.success) {
    console.error(
      `${red("Error:")} Invalid target: ${String(args.target)}. Valid: claude-code, opencode, cursor, codex, gemini`,
    );
    process.exit(1);
  }

  const removeAll = args.all === "true";
  const skillNames = Array.isArray(args.skill) ? args.skill : [];
  const dryRun = args["dry-run"] === "true";

  if (!removeAll && skillNames.length === 0) {
    console.error(
      `${red("Error:")} Specify --skill <name> or --all to remove skills.`,
    );
    process.exit(1);
  }

  const target = targetParse.data;
  const targetDir = join(rootDir, "dist", "targets", target);
  const skillsDir = join(targetDir, "skills");

  if (!existsSync(skillsDir)) {
    console.log(`No skills installed for ${bold(target)}. Nothing to remove.`);
    process.exit(0);
  }

  // Discover installed skills
  const entries = await readdir(skillsDir, { withFileTypes: true });
  const installedSkills = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  // Determine which to remove
  let toRemove: string[];
  if (removeAll) {
    toRemove = installedSkills;
  } else {
    // Validate requested skills exist
    const installed = new Set(installedSkills.map((n) => n.toLowerCase()));
    const notFound = skillNames.filter((n) => !installed.has(n.toLowerCase()));
    if (notFound.length > 0) {
      console.error(
        `${red("Error:")} Skills not found in ${target}: ${notFound.join(", ")}`,
      );
      console.error(
        `${dim("Installed:")} ${installedSkills.join(", ") || "(none)"}`,
      );
      process.exit(1);
    }
    toRemove = skillNames;
  }

  if (toRemove.length === 0) {
    console.log(`No skills to remove for ${bold(target)}.`);
    process.exit(0);
  }

  if (dryRun) {
    console.log(
      `\n${yellow("[DRY RUN]")} Would remove ${toRemove.length} skill(s) from ${cyan(target)}:`,
    );
    for (const name of toRemove) {
      console.log(`  - ${name}`);
    }
    return;
  }

  // Remove skill directories
  let removedCount = 0;
  for (const name of toRemove) {
    const skillDir = join(skillsDir, name);
    if (existsSync(skillDir)) {
      await rm(skillDir, { recursive: true, force: true });
      removedCount += 1;
    }
  }

  // Update manifest
  await removeSkillsFromManifest(targetDir, toRemove);

  console.log(
    `\n${green("✓")} Removed ${removedCount} skill(s) from ${cyan(target)}`,
  );
  for (const name of toRemove) {
    console.log(`  - ${name}`);
  }
  console.log(
    `\n${dim(`Note: Removed skills will be restored on next '${NAME} install --target ${target}'.`)}`,
  );
}

if (import.meta.main) {
  const rootDir = resolveRootDir(import.meta.dir);
  runRemove(rootDir, process.argv.slice(2)).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${red("Error:")} ${message}`);
    process.exit(1);
  });
}
