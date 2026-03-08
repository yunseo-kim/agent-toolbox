import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { stringify as stringifyYaml } from "yaml";
import { copyDirectoryRecursive } from "../copy-utils.js";
import type {
  GeneratorOptions,
  GeneratorResult,
  TargetGenerator,
} from "../types.js";

function generateInstallMd(): string {
  return [
    "# Codex Installation",
    "",
    "## Prerequisites",
    "- Codex CLI installed (OpenAI)",
    "",
    "## Installation",
    "",
    "### macOS/Linux",
    "```bash",
    "# Symlink skills directory",
    "ln -sf /path/to/dist/targets/codex/skills ~/.agents/skills",
    "```",
    "",
    "### Windows",
    "```cmd",
    ":: Use junctions (no Developer Mode required)",
    'mklink /J "%USERPROFILE%\\.agents\\skills" "\\path\\to\\dist\\targets\\codex\\skills"',
    "```",
    "",
  ].join("\n");
}

export class CodexGenerator implements TargetGenerator {
  readonly target = "codex" as const;

  async generate(options: GeneratorOptions): Promise<GeneratorResult> {
    const { skills, outputDir, catalogDir } = options;
    const artifacts: string[] = [];
    const warnings: string[] = [];

    await rm(outputDir, { recursive: true, force: true });
    await mkdir(outputDir, { recursive: true });

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
    const openAiMetadata = {
      display_name: "Awesome Agent Toolbox",
      icon: "toolbox",
      brand_color: "#2563eb",
      policy:
        "You have access to skills from the agent-toolbox catalog. Read the relevant SKILL.md when a user's request matches a skill's description.",
    };

    await Bun.write(
      join(agentsDir, "openai.yaml"),
      stringifyYaml(openAiMetadata),
    );
    artifacts.push("agents/openai.yaml");

    await Bun.write(join(outputDir, "INSTALL.md"), generateInstallMd());
    artifacts.push("INSTALL.md");

    return {
      target: "codex",
      skillCount: skills.length,
      outputDir,
      artifacts,
      warnings,
    };
  }
}
