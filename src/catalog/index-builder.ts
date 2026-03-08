import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { DELIMITERS, encode } from "@toon-format/toon";
import {
  SkillIndex,
  type SkillIndex as SkillIndexType,
  type ParsedSkill,
} from "../schemas/catalog.js";

export function buildSkillIndex(skills: ParsedSkill[]): SkillIndexType {
  const skillEntries = skills
    .map((skill) => ({
      name: skill.frontmatter.name,
      description: skill.frontmatter.description,
      domain: skill.frontmatter.metadata.domain,
      subdomain: skill.frontmatter.metadata.subdomain,
      provenance: skill.frontmatter.metadata.provenance,
      author: skill.frontmatter.metadata.author,
      lastUpdated: skill.frontmatter.metadata.lastUpdated,
      license: skill.frontmatter.license,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const tags: Record<string, string[]> = {};
  const frameworks: Record<string, string[]> = {};

  for (const skill of skills) {
    const skillTags = skill.frontmatter.metadata.tags;
    if (skillTags && skillTags.length > 0) {
      tags[skill.frontmatter.name] = skillTags;
    }
    const skillFrameworks = skill.frontmatter.metadata.frameworks;
    if (skillFrameworks && skillFrameworks.length > 0) {
      frameworks[skill.frontmatter.name] = skillFrameworks;
    }
  }

  return SkillIndex.parse({
    version: 2,
    generatedAt: new Date().toISOString(),
    skills: skillEntries,
    tags,
    frameworks,
  });
}

export async function writeSkillIndex(
  index: SkillIndexType,
  outputPath: string,
): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  const json = `${JSON.stringify(index, null, 2)}\n`;
  await writeFile(outputPath, json, "utf8");
}

export async function writeSkillIndexToon(
  index: SkillIndexType,
  outputPath: string,
): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  const toon = encode(index, { delimiter: DELIMITERS.tab });
  await writeFile(outputPath, toon, "utf8");
}
