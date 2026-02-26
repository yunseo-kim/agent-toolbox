import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { copyDirectoryRecursive } from "../copy-utils.js";
import type { GeneratorOptions, GeneratorResult, TargetGenerator } from "../types.js";

export class ClaudeCodeGenerator implements TargetGenerator {
  readonly target = "claude-code" as const;

  async generate(options: GeneratorOptions): Promise<GeneratorResult> {
    const { skills, outputDir, catalogDir, version } = options;
    const artifacts: string[] = [];
    const warnings: string[] = [];

    await rm(outputDir, { recursive: true, force: true });
    await mkdir(outputDir, { recursive: true });

    const pluginDir = join(outputDir, ".claude-plugin");
    await mkdir(pluginDir, { recursive: true });

    const pluginManifest = {
      name: "awesome-agent-toolbox",
      version,
      description: "Cross-tool distribution system for agent skills, plugins, and MCP servers",
    };
    await Bun.write(join(pluginDir, "plugin.json"), JSON.stringify(pluginManifest, null, 2) + "\n");
    artifacts.push(".claude-plugin/plugin.json");

    const skillsDir = join(outputDir, "skills");
    await mkdir(skillsDir, { recursive: true });

    for (const skill of skills) {
      const srcDir = join(catalogDir, "skills", skill.dirName);
      const destDir = join(skillsDir, skill.dirName);
      await copyDirectoryRecursive(srcDir, destDir);
      artifacts.push(`skills/${skill.dirName}/`);
    }

    await mkdir(join(outputDir, "agents"), { recursive: true });
    await Bun.write(join(outputDir, "agents", ".gitkeep"), "");
    artifacts.push("agents/");

    await mkdir(join(outputDir, "commands"), { recursive: true });
    await Bun.write(join(outputDir, "commands", ".gitkeep"), "");
    artifacts.push("commands/");

    const hooksDir = join(outputDir, "hooks");
    await mkdir(hooksDir, { recursive: true });
    await Bun.write(join(hooksDir, "hooks.json"), JSON.stringify({ hooks: {} }, null, 2) + "\n");
    artifacts.push("hooks/hooks.json");

    return {
      target: "claude-code",
      skillCount: skills.length,
      outputDir,
      artifacts,
      warnings,
    };
  }
}
