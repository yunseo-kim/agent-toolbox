#!/usr/bin/env bun

import { resolve } from "node:path";
import { install } from "../install/installer.js";
import { TargetTool } from "../schemas/common.js";
import { green, red, resolveRootDir, yellow } from "./utils.js";

export function parseArgs(argv: string[]): Record<string, string | string[]> {
  const args: Record<string, string | string[]> = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const nextToken = argv[i + 1];
    const value = nextToken && !nextToken.startsWith("--") ? nextToken : "true";

    if (key === "skill") {
      if (!Array.isArray(args[key])) {
        args[key] = args[key] ? [args[key] as string] : [];
      }
      if (value !== "true") {
        (args[key] as string[]).push(value);
      }
    } else {
      args[key] = value;
    }

    if (value !== "true") {
      i += 1;
    }
  }

  return args;
}

export async function runInstall(rootDir: string, argv: string[]): Promise<void> {
  const args = parseArgs(argv);

  if (!args.target || args.target === "true") {
    console.error("Usage: agent-toolbox install --target <tool> [options]");
    console.error("");
    console.error("Options:");
    console.error("  --target <tool>       Required. claude-code, opencode, cursor, codex, gemini");
    console.error("  --domain <domain>     Filter by domain");
    console.error("  --subdomain <sub>     Filter by subdomain");
    console.error("  --framework <fw>      Filter by framework");
    console.error("  --tag <tag>           Filter by tag");
    console.error("  --preset <name>       Install preset bundle");
    console.error("  --skill <name>        Install specific skill(s) (repeatable)");
    console.error("  --dry-run             Preview without installing");
    console.error("  --interactive         Interactive selection (future)");
    console.error("  --refresh             Force re-download catalog from remote");
    console.error("  --offline             Use cached catalog only, no network");
    process.exit(1);
  }

  const targetParse = TargetTool.safeParse(args.target);
  if (!targetParse.success) {
    console.error(`Invalid target: ${args.target}. Valid: claude-code, opencode, cursor, codex, gemini`);
    process.exit(1);
  }

  const filters = {
    target: targetParse.data,
    domain: typeof args.domain === "string" && args.domain !== "true" ? args.domain : undefined,
    subdomain: typeof args.subdomain === "string" && args.subdomain !== "true" ? args.subdomain : undefined,
    framework: typeof args.framework === "string" && args.framework !== "true" ? args.framework : undefined,
    tag: typeof args.tag === "string" && args.tag !== "true" ? args.tag : undefined,
    preset: typeof args.preset === "string" && args.preset !== "true" ? args.preset : undefined,
    skill: Array.isArray(args.skill) ? args.skill : undefined,
    dryRun: args["dry-run"] === "true",
    interactive: args.interactive === "true",
    refresh: args.refresh === "true",
    offline: args.offline === "true",
  } as const;

  const result = await install(rootDir, {
    target: filters.target,
    domain: filters.domain,
    subdomain: filters.subdomain,
    framework: filters.framework,
    tag: filters.tag,
    preset: filters.preset,
    skill: filters.skill,
    dryRun: filters.dryRun as boolean,
    interactive: filters.interactive as boolean,
    refresh: filters.refresh as boolean,
    offline: filters.offline as boolean,
  });

  if (result.filterResult.appliedFilters.length > 0) {
    console.log(`Filters: ${result.filterResult.appliedFilters.join(", ")}`);
  }
  console.log(`Matched: ${result.filterResult.matched.length}/${result.filterResult.total} skills`);

  if (result.dryRun) {
    console.log(`\n${yellow("[DRY RUN]")} Would install these skills:`);
    for (const skill of result.filterResult.matched) {
      console.log(`  - ${skill.frontmatter.name} (${skill.frontmatter.metadata.domain})`);
    }
  } else if (result.generatorResult) {
    console.log(`\n${green("✓")} Installed ${result.generatorResult.skillCount} skills for ${result.generatorResult.target}`);
    console.log(`  Output: ${result.generatorResult.outputDir}`);
  }
}

if (import.meta.main) {
  const rootDir = resolveRootDir(import.meta.dir);
  runInstall(rootDir, process.argv.slice(2)).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${red("Error:")} ${message}`);
    process.exit(1);
  });
}
