import { beforeAll, describe, expect, test } from "bun:test";
import {
  buildSkillIndex,
  writeSkillIndex,
  writeSkillIndexToon,
} from "../../src/catalog/index-builder.js";
import { scanSkills } from "../../src/catalog/scanner.js";
import { SkillIndex } from "../../src/schemas/catalog.js";
import type { ParsedSkill } from "../../src/schemas/catalog.js";
import { resolve } from "node:path";
import { DELIMITERS, encode, decode } from "@toon-format/toon";
import { tmpdir } from "node:os";
import { join } from "node:path";

const catalogDir = resolve(import.meta.dir, "../../catalog");

describe("index builder", () => {
  let skills: ParsedSkill[] = [];

  beforeAll(async () => {
    const result = await scanSkills(catalogDir);
    skills = result.skills;
  });

  test("builds index with 117 skills", () => {
    const index = buildSkillIndex(skills);
    expect(index.skills).toHaveLength(117);
  });

  test("index has version 2", () => {
    const index = buildSkillIndex(skills);
    expect(index.version).toBe(2);
  });

  test("index has generatedAt as ISO date", () => {
    const index = buildSkillIndex(skills);
    const parsedTime = Date.parse(index.generatedAt);
    expect(Number.isNaN(parsedTime)).toBe(false);
    expect(index.generatedAt).toContain("T");
  });

  test("skill entries do not have type or path fields", () => {
    const index = buildSkillIndex(skills);
    for (const skill of index.skills) {
      expect(skill).not.toHaveProperty("type");
      expect(skill).not.toHaveProperty("path");
    }
  });

  test("skill entries do not have inline tags or frameworks", () => {
    const index = buildSkillIndex(skills);
    for (const skill of index.skills) {
      expect(skill).not.toHaveProperty("tags");
      expect(skill).not.toHaveProperty("frameworks");
    }
  });

  test("tags lookup contains entries for skills with tags", () => {
    const index = buildSkillIndex(skills);
    expect(Object.keys(index.tags).length).toBeGreaterThan(0);
    for (const [name, tags] of Object.entries(index.tags)) {
      expect(tags.length).toBeGreaterThan(0);
      expect(index.skills.some((s) => s.name === name)).toBe(true);
    }
  });

  test("frameworks lookup contains entries for skills with frameworks", () => {
    const index = buildSkillIndex(skills);
    for (const [name, frameworks] of Object.entries(index.frameworks)) {
      expect(frameworks.length).toBeGreaterThan(0);
      expect(index.skills.some((s) => s.name === name)).toBe(true);
    }
  });

  test("entries are sorted alphabetically by name", () => {
    const index = buildSkillIndex(skills);
    const names = index.skills.map((s) => s.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  test("each entry has required fields", () => {
    const index = buildSkillIndex(skills);

    for (const skill of index.skills) {
      expect(skill.name.length).toBeGreaterThan(0);
      expect(skill.domain.length).toBeGreaterThan(0);
      expect(skill.description.length).toBeGreaterThan(0);
      expect(skill.provenance.length).toBeGreaterThan(0);
      expect(skill.author.length).toBeGreaterThan(0);
      expect(skill.lastUpdated.length).toBeGreaterThan(0);
    }
  });

  test("index validates against SkillIndex schema", () => {
    const index = buildSkillIndex(skills);
    const parsed = SkillIndex.parse(index);
    expect(parsed.skills).toHaveLength(117);
  });

  describe("TOON index generation", () => {
    test("TOON encode with tab delimiter produces valid output", () => {
      const index = buildSkillIndex(skills);
      const toon = encode(index, { delimiter: DELIMITERS.tab });
      expect(toon.length).toBeGreaterThan(0);
      expect(toon).toContain("version: 2");
      expect(toon).toContain("skills[");
    });

    test("TOON roundtrip preserves all skills", () => {
      const index = buildSkillIndex(skills);
      const toon = encode(index, { delimiter: DELIMITERS.tab });
      const decoded = decode(toon) as typeof index;
      expect(decoded.version).toBe(2);
      expect(decoded.skills).toHaveLength(117);
    });

    test("TOON roundtrip preserves skill fields", () => {
      const index = buildSkillIndex(skills);
      const toon = encode(index, { delimiter: DELIMITERS.tab });
      const decoded = decode(toon) as typeof index;
      const first = decoded.skills[0];
      const original = index.skills[0];
      expect(first.name).toBe(original.name);
      expect(first.domain).toBe(original.domain);
      expect(first.provenance).toBe(original.provenance);
      expect(first.author).toBe(original.author);
    });

    test("TOON roundtrip preserves tags lookup", () => {
      const index = buildSkillIndex(skills);
      const toon = encode(index, { delimiter: DELIMITERS.tab });
      const decoded = decode(toon) as typeof index;
      expect(decoded.tags).toEqual(index.tags);
    });

    test("TOON roundtrip preserves frameworks lookup", () => {
      const index = buildSkillIndex(skills);
      const toon = encode(index, { delimiter: DELIMITERS.tab });
      const decoded = decode(toon) as typeof index;
      expect(decoded.frameworks).toEqual(index.frameworks);
    });

    test("writeSkillIndexToon creates file", async () => {
      const index = buildSkillIndex(skills);
      const outPath = join(tmpdir(), `skill-index-test-${Date.now()}.toon`);
      await writeSkillIndexToon(index, outPath);
      const content = await Bun.file(outPath).text();
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain("version: 2");
      // cleanup
      await Bun.write(outPath, "");
    });
  });

  describe("writeSkillIndex", () => {
    test("writes JSON index to file", async () => {
      const index = buildSkillIndex(skills);
      const outPath = join(
        tmpdir(),
        `skill-index-test-json-${Date.now()}.json`,
      );
      await writeSkillIndex(index, outPath);
      const content = await Bun.file(outPath).text();
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain('"version": 2');
      expect(content).toContain('"skills"');
      // cleanup
      await Bun.write(outPath, "");
    });

    test("creates parent directories if they do not exist", async () => {
      const index = buildSkillIndex(skills);
      const outPath = join(
        tmpdir(),
        `nested-${Date.now()}`,
        "subdir",
        "skill-index.json",
      );
      await writeSkillIndex(index, outPath);
      const content = await Bun.file(outPath).text();
      expect(content.length).toBeGreaterThan(0);
      // cleanup
      await Bun.write(outPath, "");
    });

    test("JSON output is valid and parseable", async () => {
      const index = buildSkillIndex(skills);
      const outPath = join(
        tmpdir(),
        `skill-index-parse-test-${Date.now()}.json`,
      );
      await writeSkillIndex(index, outPath);
      const content = await Bun.file(outPath).text();
      const parsed = JSON.parse(content) as {
        version: number;
        skills: unknown[];
      };
      expect(parsed.version).toBe(2);
      expect(Array.isArray(parsed.skills)).toBe(true);
      expect(parsed.skills.length).toBeGreaterThan(0);
      // cleanup
      await Bun.write(outPath, "");
    });
  });
});
