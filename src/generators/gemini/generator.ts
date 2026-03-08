import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import type { ParsedSkill } from "../../schemas/catalog.js";
import { copyDirectoryRecursive } from "../copy-utils.js";
import type {
  GeneratorOptions,
  GeneratorResult,
  TargetGenerator,
} from "../types.js";

const GEMINI_HOOK_EVENTS = [
  "SessionStart",
  "SessionEnd",
  "BeforeTool",
  "AfterTool",
  "BeforeModel",
  "AfterModel",
  "Notification",
  "Stop",
  "SubagentStart",
  "SubagentEnd",
  "PreToolExecution",
] as const;

function groupSkillsByDomain(
  skills: ParsedSkill[],
): Map<string, ParsedSkill[]> {
  const byDomain = new Map<string, ParsedSkill[]>();

  for (const skill of skills) {
    const domain = skill.frontmatter.metadata.domain;
    const existing = byDomain.get(domain);

    if (existing) {
      existing.push(skill);
    } else {
      byDomain.set(domain, [skill]);
    }
  }

  return byDomain;
}

function generateGeminiContext(skills: ParsedSkill[]): string {
  const byDomain = groupSkillsByDomain(skills);
  const sortedDomains = [...byDomain.keys()].sort((a, b) => a.localeCompare(b));

  const lines: string[] = [
    "# agent-toolbox Skills",
    "",
    "You have access to the following skills. Read the relevant SKILL.md when a user's request matches.",
    "",
    "## Skills by Domain",
    "",
  ];

  for (const domain of sortedDomains) {
    const domainSkills = byDomain.get(domain) ?? [];
    const sortedSkills = [...domainSkills].sort((a, b) =>
      a.frontmatter.name.localeCompare(b.frontmatter.name),
    );

    lines.push(`### ${domain} (${sortedSkills.length} skills)`);

    for (const skill of sortedSkills) {
      const description = skill.frontmatter.description
        .replace(/\s+/g, " ")
        .trim();
      lines.push(`- ${skill.frontmatter.name}: ${description}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

function generateHooksConfig(): Record<string, Record<string, []>> {
  const hooks: Record<string, []> = {};

  for (const event of GEMINI_HOOK_EVENTS) {
    hooks[event] = [];
  }

  return { hooks };
}

export class GeminiGenerator implements TargetGenerator {
  readonly target = "gemini" as const;

  async generate(options: GeneratorOptions): Promise<GeneratorResult> {
    const { skills, outputDir, catalogDir, version } = options;
    const artifacts: string[] = [];
    const warnings: string[] = [];

    await rm(outputDir, { recursive: true, force: true });
    await mkdir(outputDir, { recursive: true });

    const extensionManifest = {
      name: "agent-toolbox",
      version,
      description:
        "Cross-tool distribution system for agent skills, plugins, and MCP servers",
      contextFileName: "GEMINI.md",
      skills: "./skills/",
      commands: "./commands/",
      hooks: "./hooks/hooks.json",
    };

    await Bun.write(
      join(outputDir, "gemini-extension.json"),
      `${JSON.stringify(extensionManifest, null, 2)}\n`,
    );
    artifacts.push("gemini-extension.json");

    const skillsDir = join(outputDir, "skills");
    await mkdir(skillsDir, { recursive: true });

    for (const skill of skills) {
      const srcDir = join(catalogDir, "skills", skill.dirName);
      const destDir = join(skillsDir, skill.dirName);
      await copyDirectoryRecursive(srcDir, destDir);
      artifacts.push(`skills/${skill.dirName}/`);
    }

    const commandsDir = join(outputDir, "commands");
    await mkdir(commandsDir, { recursive: true });
    await Bun.write(join(commandsDir, ".gitkeep"), "");
    artifacts.push("commands/");

    const hooksDir = join(outputDir, "hooks");
    await mkdir(hooksDir, { recursive: true });
    await Bun.write(
      join(hooksDir, "hooks.json"),
      `${JSON.stringify(generateHooksConfig(), null, 2)}\n`,
    );
    artifacts.push("hooks/hooks.json");

    await Bun.write(
      join(outputDir, "GEMINI.md"),
      `${generateGeminiContext(skills)}\n`,
    );
    artifacts.push("GEMINI.md");

    return {
      target: "gemini",
      skillCount: skills.length,
      outputDir,
      artifacts,
      warnings,
    };
  }
}
