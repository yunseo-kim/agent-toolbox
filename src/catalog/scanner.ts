import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { parseFrontmatter } from "./frontmatter.js";
import {
  SkillFrontmatter,
  type ParsedSkill as ParsedSkillType,
} from "../schemas/catalog.js";

export interface ScanResult {
  skills: ParsedSkillType[];
  errors: ScanError[];
}

export interface ScanError {
  path: string;
  error: string;
}

export async function scanSkills(catalogDir: string): Promise<ScanResult> {
  const skills: ParsedSkillType[] = [];
  const errors: ScanError[] = [];
  const skillsRoot = join(catalogDir, "skills");

  let skillDirs: string[];

  try {
    const entries = await readdir(skillsRoot, { withFileTypes: true });
    skillDirs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      skills,
      errors: [
        {
          path: skillsRoot,
          error: `Failed to scan skills directory: ${reason}`,
        },
      ],
    };
  }

  for (const dirName of skillDirs) {
    const skillDir = join(skillsRoot, dirName);
    const skillPath = join(skillDir, "SKILL.md");

    try {
      const skillContent = await readFile(skillPath, "utf8");
      const { frontmatter, body } = parseFrontmatter(skillContent);
      const parsedFrontmatter = SkillFrontmatter.safeParse(frontmatter);

      if (!parsedFrontmatter.success) {
        for (const issue of parsedFrontmatter.error.issues) {
          const field =
            issue.path.length > 0 ? issue.path.join(".") : "frontmatter";
          errors.push({
            path: skillPath,
            error: `Frontmatter validation failed at '${field}': ${issue.message}`,
          });
        }

        continue;
      }

      const entryNames = await readdir(skillDir);
      const entrySet = new Set(entryNames);
      const hasNotice = entrySet.has("NOTICE.md");
      const hasReferences = entrySet.has("references");
      const hasScripts = entrySet.has("scripts");
      const hasAssets = entrySet.has("assets");
      const additionalEntries = entryNames
        .filter(
          (name) =>
            ![
              "SKILL.md",
              "NOTICE.md",
              "references",
              "scripts",
              "assets",
            ].includes(name),
        )
        .sort((a, b) => a.localeCompare(b));

      const parsedSkill: ParsedSkillType = {
        frontmatter: parsedFrontmatter.data,
        body,
        dirName,
        filePath: skillPath,
        hasNotice,
        hasReferences,
        hasScripts,
        hasAssets,
        additionalEntries,
      };

      skills.push(parsedSkill);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      errors.push({
        path: skillPath,
        error: reason,
      });
    }
  }

  return { skills, errors };
}
