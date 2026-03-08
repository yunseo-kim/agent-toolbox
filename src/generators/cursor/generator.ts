import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { copyDirectoryRecursive } from "../copy-utils.js";
import type {
  GeneratorOptions,
  GeneratorResult,
  TargetGenerator,
} from "../types.js";

export class CursorGenerator implements TargetGenerator {
  readonly target = "cursor" as const;

  async generate(options: GeneratorOptions): Promise<GeneratorResult> {
    const { skills, outputDir, catalogDir, version } = options;
    const artifacts: string[] = [];
    const warnings: string[] = [];

    await rm(outputDir, { recursive: true, force: true });
    await mkdir(outputDir, { recursive: true });

    const pluginDir = join(outputDir, ".cursor-plugin");
    await mkdir(pluginDir, { recursive: true });

    const pluginManifest = {
      name: "agent-toolbox",
      version,
      description:
        "Cross-tool distribution system for agent skills, plugins, and MCP servers",
      skills: "./skills/",
      agents: "./agents/",
      commands: "./commands/",
      hooks: "./hooks/hooks.json",
    };

    await writeFile(
      join(pluginDir, "plugin.json"),
      `${JSON.stringify(pluginManifest, null, 2)}\n`,
      "utf8",
    );
    artifacts.push(".cursor-plugin/plugin.json");

    const skillsDir = join(outputDir, "skills");
    await mkdir(skillsDir, { recursive: true });

    for (const skill of skills) {
      const srcDir = join(catalogDir, "skills", skill.dirName);
      const destDir = join(skillsDir, skill.dirName);
      await copyDirectoryRecursive(srcDir, destDir);
      artifacts.push(`skills/${skill.dirName}/`);
    }

    const agentsDir = join(outputDir, "agents");
    await mkdir(agentsDir, { recursive: true });
    await writeFile(join(agentsDir, ".gitkeep"), "", "utf8");
    artifacts.push("agents/");

    const commandsDir = join(outputDir, "commands");
    await mkdir(commandsDir, { recursive: true });
    await writeFile(join(commandsDir, ".gitkeep"), "", "utf8");
    artifacts.push("commands/");

    const hooksDir = join(outputDir, "hooks");
    await mkdir(hooksDir, { recursive: true });
    await writeFile(
      join(hooksDir, "hooks.json"),
      `${JSON.stringify({ hooks: {} }, null, 2)}\n`,
      "utf8",
    );
    artifacts.push("hooks/hooks.json");

    return {
      target: "cursor",
      skillCount: skills.length,
      outputDir,
      artifacts,
      warnings,
    };
  }
}
