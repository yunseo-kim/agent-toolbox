#!/usr/bin/env bun

import { resolve } from "node:path";
import { runBuildAll, runBuildTarget } from "./build-target.js";
import { runBuildIndex } from "./build-index.js";
import { runInstall } from "./install.js";
import { runValidate } from "./validate.js";
import { red } from "./utils.js";

const NAME = "agent-toolbox";

async function getVersion(rootDir: string): Promise<string> {
  try {
    const pkg = await Bun.file(resolve(rootDir, "package.json")).json();
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function printHelp(): void {
  console.log(`
${NAME} — Cross-tool distribution system for agent skills

USAGE
  ${NAME} <command> [options]

COMMANDS
  install       Install skills to a target tool
  build         Build target artifacts
  build-index   Generate skill-index.json and skill-index.toon
  validate      Validate catalog against taxonomy

OPTIONS
  --help, -h    Show help
  --version, -v Show version

BUILD OPTIONS
  --target <tool>   claude-code | opencode | cursor | codex | gemini | all

INSTALL OPTIONS
  --target <tool>   Required. claude-code | opencode | cursor | codex | gemini
  --domain <d>      Filter by domain
  --subdomain <s>   Filter by subdomain
  --framework <fw>  Filter by framework
  --tag <tag>       Filter by tag
  --preset <name>   Install preset bundle
  --skill <name>    Specific skill(s), repeatable
  --dry-run         Preview without installing
  --interactive     Interactive selection (future)
  --refresh           Force re-download catalog from remote
  --offline           Use cached catalog only, no network

EXAMPLES
  ${NAME} install --target opencode --domain devops
  ${NAME} install --target claude-code --dry-run
  ${NAME} build --target all
  ${NAME} build --target opencode
  ${NAME} validate
  ${NAME} build-index
`.trimStart());
}

function printBuildHelp(): void {
  console.log(`
USAGE
  ${NAME} build --target <tool>

TARGETS
  claude-code   Generate Claude Code plugin artifacts
  opencode      Generate OpenCode plugin + skills
  cursor        Generate Cursor plugin artifacts
  codex         Generate Codex skill directories
  gemini        Generate Gemini CLI extension
  all           Build all targets sequentially

EXAMPLES
  ${NAME} build --target opencode
  ${NAME} build --target all
`.trimStart());
}

async function main(): Promise<void> {
  const rootDir = resolve(import.meta.dir, "../..");
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    printHelp();
    process.exit(0);
  }

  if (command === "--version" || command === "-v") {
    const version = await getVersion(rootDir);
    console.log(version);
    process.exit(0);
  }

  switch (command) {
    case "validate":
      await runValidate(rootDir);
      break;

    case "build-index":
      await runBuildIndex(rootDir);
      break;

    case "build": {
      const subArgs = args.slice(1);

      // Support: build index (alias for build-index)
      if (subArgs[0] === "index") {
        await runBuildIndex(rootDir);
        break;
      }

      // Support: build --help
      if (subArgs[0] === "--help" || subArgs[0] === "-h") {
        printBuildHelp();
        process.exit(0);
      }

      // Parse --target flag
      const targetIdx = subArgs.indexOf("--target");
      const target = targetIdx >= 0 ? subArgs[targetIdx + 1] : undefined;

      if (!target) {
        printBuildHelp();
        process.exit(1);
      }

      if (target === "all") {
        await runBuildAll(rootDir);
      } else {
        await runBuildTarget(rootDir, target);
      }
      break;
    }

    case "install":
      await runInstall(rootDir, args.slice(1));
      break;

    default:
      console.error(`${red("Error:")} Unknown command '${command}'`);
      console.error(`Run '${NAME} --help' for available commands.`);
      process.exit(1);
  }
}

main().catch((error) => {
  const reason = error instanceof Error ? error.message : String(error);
  console.error(`${red("Error:")} ${reason}`);
  process.exit(1);
});
