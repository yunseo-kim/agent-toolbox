import { beforeAll, describe, expect, test } from "bun:test";
import { buildCatalogIndex } from "../../src/catalog/index-builder.js";
import { scanSkills } from "../../src/catalog/scanner.js";
import { CatalogIndex } from "../../src/schemas/catalog.js";
import type { ParsedSkill } from "../../src/schemas/catalog.js";
import { resolve } from "node:path";

const catalogDir = resolve(import.meta.dir, "../../catalog");

describe("index builder", () => {
  let skills: ParsedSkill[] = [];

  beforeAll(async () => {
    const result = await scanSkills(catalogDir);
    skills = result.skills;
  });

  test("builds index with 84 entries", () => {
    const index = buildCatalogIndex(skills);
    expect(index.items).toHaveLength(84);
  });

  test("index has version 1", () => {
    const index = buildCatalogIndex(skills);
    expect(index.version).toBe(1);
  });

  test("index has generatedAt as ISO date", () => {
    const index = buildCatalogIndex(skills);
    const parsedTime = Date.parse(index.generatedAt);
    expect(Number.isNaN(parsedTime)).toBe(false);
    expect(index.generatedAt).toContain("T");
  });

  test("all entries have type skill", () => {
    const index = buildCatalogIndex(skills);
    expect(index.items.every((item) => item.type === "skill")).toBe(true);
  });

  test("entries are sorted alphabetically by name", () => {
    const index = buildCatalogIndex(skills);
    const names = index.items.map((item) => item.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  test("each entry has required fields", () => {
    const index = buildCatalogIndex(skills);

    for (const item of index.items) {
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.domain.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(0);
      expect(item.path.length).toBeGreaterThan(0);
      expect(item.provenance.length).toBeGreaterThan(0);
      expect(item.author.length).toBeGreaterThan(0);
      expect(item.lastUpdated.length).toBeGreaterThan(0);
    }
  });

  test("index validates against CatalogIndex schema", () => {
    const index = buildCatalogIndex(skills);
    const parsed = CatalogIndex.parse(index);
    expect(parsed.items).toHaveLength(84);
  });
});
