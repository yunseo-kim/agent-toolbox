import { beforeAll, describe, expect, test } from "bun:test";
import { buildCatalogIndex, writeCatalogIndexToon } from "../../src/catalog/index-builder.js";
import { scanSkills } from "../../src/catalog/scanner.js";
import { CatalogIndex } from "../../src/schemas/catalog.js";
import type { ParsedSkill } from "../../src/schemas/catalog.js";
import { resolve } from "node:path";
import { encode, decode } from "@toon-format/toon";
import { tmpdir } from "node:os";
import { join } from "node:path";

const catalogDir = resolve(import.meta.dir, "../../catalog");

describe("index builder", () => {
  let skills: ParsedSkill[] = [];

  beforeAll(async () => {
    const result = await scanSkills(catalogDir);
    skills = result.skills;
  });

  test("builds index with 118 entries", () => {
    const index = buildCatalogIndex(skills);
    expect(index.items).toHaveLength(118);
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
    expect(parsed.items).toHaveLength(118);
  });

describe("TOON index generation", () => {
  let skills: ParsedSkill[] = [];

  beforeAll(async () => {
    const result = await scanSkills(catalogDir);
    skills = result.skills;
  });

  test("TOON encode produces valid output", () => {
    const index = buildCatalogIndex(skills);
    const toon = encode(index);
    expect(toon.length).toBeGreaterThan(0);
    expect(toon).toContain("version: 1");
    expect(toon).toContain("items[");
  });

  test("TOON roundtrip preserves all items", () => {
    const index = buildCatalogIndex(skills);
    const toon = encode(index);
    const decoded = decode(toon) as typeof index;
    expect(decoded.version).toBe(1);
    expect(decoded.items).toHaveLength(118);
  });

  test("TOON roundtrip preserves item fields", () => {
    const index = buildCatalogIndex(skills);
    const toon = encode(index);
    const decoded = decode(toon) as typeof index;
    const first = decoded.items[0];
    const original = index.items[0];
    expect(first.name).toBe(original.name);
    expect(first.type).toBe(original.type);
    expect(first.domain).toBe(original.domain);
    expect(first.provenance).toBe(original.provenance);
    expect(first.author).toBe(original.author);
    expect(first.path).toBe(original.path);
  });

  test("writeCatalogIndexToon creates file", async () => {
    const index = buildCatalogIndex(skills);
    const outPath = join(tmpdir(), `catalog-index-test-${Date.now()}.toon`);
    await writeCatalogIndexToon(index, outPath);
    const content = await Bun.file(outPath).text();
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain("version: 1");
    // cleanup
    await Bun.write(outPath, "");
  });
});
});
