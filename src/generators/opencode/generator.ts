import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { copyDirectoryRecursive } from "../copy-utils.js";
import type { GeneratorOptions, GeneratorResult, TargetGenerator } from "../types.js";

function generateOpenCodePlugin(version: string, skillList: string): string {
  return [
    `// awesome-agent-toolbox.js - OpenCode plugin bootstrap`,
    `// Injects skill catalog awareness into the system prompt`,
    ``,
    `import path from "path";`,
    `import { fileURLToPath } from "url";`,
    ``,
    `const __dirname = path.dirname(fileURLToPath(import.meta.url));`,
    ``,
    `const SKILL_CATALOG = ${JSON.stringify([
      "## Available Skills (awesome-agent-toolbox)",
      "",
      "You have access to skills from awesome-agent-toolbox. Each skill has a SKILL.md",
      "with instructions. Read the relevant SKILL.md when a user's request matches a skill's",
      "description.",
      "",
      "### Installed Skills:",
      skillList,
      "",
    ].join("\n"))};`,
    ``,
    `export const AwesomeAgentToolboxPlugin = async ({ directory }) => {`,
    `  return {`,
    `    "experimental.chat.system.transform": async (_input, output) => {`,
    `      (output.system ||= []).push(SKILL_CATALOG);`,
    `    },`,
    `  };`,
    `};`,
    ``,
  ].join("\n");
}

function generateInstallMd(): string {
  return [
    "# OpenCode Installation",
    "",
    "## Prerequisites",
    "- OpenCode installed (https://github.com/anomalyco/opencode)",
    "",
    "## Installation",
    "",
    "### 1. Link skills",
    "```bash",
    "# macOS/Linux",
    "mkdir -p ~/.config/opencode/skills",
    "ln -sf /path/to/dist/targets/opencode/skills ~/.config/opencode/skills/awesome-agent-toolbox",
    "",
    "# Windows (PowerShell as Admin)",
    'New-Item -ItemType Junction -Path "$env:APPDATA\\opencode\\skills\\awesome-agent-toolbox" -Target "\\path\\to\\dist\\targets\\opencode\\skills"',
    "```",
    "",
    "### 2. Install plugin",
    "```bash",
    "# macOS/Linux",
    "mkdir -p ~/.config/opencode/plugins",
    "ln -sf /path/to/dist/targets/opencode/plugins/awesome-agent-toolbox.js ~/.config/opencode/plugins/awesome-agent-toolbox.js",
    "",
    "# Windows (copy)",
    'copy "\\path\\to\\dist\\targets\\opencode\\plugins\\awesome-agent-toolbox.js" "%APPDATA%\\opencode\\plugins\\"',
    "```",
    "",
  ].join("\n");
}

export class OpenCodeGenerator implements TargetGenerator {
  readonly target = "opencode" as const;

  async generate(options: GeneratorOptions): Promise<GeneratorResult> {
    const { skills, outputDir, catalogDir, version } = options;
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

    const skillListLines = [...skills]
      .sort((a, b) => a.frontmatter.name.localeCompare(b.frontmatter.name))
      .map(
        (skill) =>
          `- **${skill.frontmatter.name}** (${skill.frontmatter.metadata.domain}): ${skill.frontmatter.description}`,
      )
      .join("\n");

    const pluginsDir = join(outputDir, "plugins");
    await mkdir(pluginsDir, { recursive: true });

    const pluginJs = generateOpenCodePlugin(version, skillListLines);
    await Bun.write(join(pluginsDir, "awesome-agent-toolbox.js"), pluginJs);
    artifacts.push("plugins/awesome-agent-toolbox.js");

    const installMd = generateInstallMd();
    await Bun.write(join(outputDir, "INSTALL.md"), installMd);
    artifacts.push("INSTALL.md");

    return {
      target: "opencode",
      skillCount: skills.length,
      outputDir,
      artifacts,
      warnings,
    };
  }
}
