import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { encode } from "@toon-format/toon";
import { CatalogIndex, type CatalogIndex as CatalogIndexType, type ParsedSkill } from "../schemas/catalog.js";

export function buildCatalogIndex(skills: ParsedSkill[]): CatalogIndexType {
  const items = skills
    .map((skill) => ({
      name: skill.frontmatter.name,
      type: "skill" as const,
      description: skill.frontmatter.description,
      domain: skill.frontmatter.metadata.domain,
      subdomain: skill.frontmatter.metadata.subdomain,
      tags: skill.frontmatter.metadata.tags ?? [],
      frameworks: skill.frontmatter.metadata.frameworks ?? [],
      provenance: skill.frontmatter.metadata.provenance,
      author: skill.frontmatter.metadata.author,
      lastUpdated: skill.frontmatter.metadata.lastUpdated,
      license: skill.frontmatter.license,
      path: `skills/${skill.dirName}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return CatalogIndex.parse({
    version: 1,
    generatedAt: new Date().toISOString(),
    items,
  });
}

export async function writeCatalogIndex(index: CatalogIndexType, outputPath: string): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  const json = `${JSON.stringify(index, null, 2)}\n`;
  await Bun.write(outputPath, json);
}

export async function writeCatalogIndexToon(index: CatalogIndexType, outputPath: string): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  const toon = encode(index);
  await Bun.write(outputPath, toon);
}
