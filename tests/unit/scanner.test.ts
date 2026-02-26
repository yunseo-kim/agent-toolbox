import { beforeAll, describe, expect, test } from "bun:test";
import { scanSkills } from "../../src/catalog/scanner.js";
import type { ParsedSkill } from "../../src/schemas/catalog.js";
import { resolve } from "node:path";

const catalogDir = resolve(import.meta.dir, "../../catalog");

describe("catalog scanner", () => {
  let skills: ParsedSkill[] = [];
  let errors: { path: string; error: string }[] = [];

  beforeAll(async () => {
    const result = await scanSkills(catalogDir);
    skills = result.skills;
    errors = result.errors;
  });

  test("scans and finds 118 skills", () => {
    expect(skills).toHaveLength(118);
  });

  test("returns 0 scan errors", () => {
    expect(errors).toHaveLength(0);
  });

  test("every parsed skill has required frontmatter fields", () => {
    for (const skill of skills) {
      expect(skill.frontmatter.name.length).toBeGreaterThan(0);
      expect(skill.frontmatter.description.length).toBeGreaterThan(0);
      expect(skill.frontmatter.license.length).toBeGreaterThan(0);
      expect(skill.frontmatter.metadata.domain.length).toBeGreaterThan(0);
    }
  });

  test("every skill has a non-empty markdown body", () => {
    for (const skill of skills) {
      expect(skill.body.trim().length).toBeGreaterThan(0);
    }
  });

  test("known skills exist", () => {
    const names = new Set(skills.map((skill) => skill.frontmatter.name));
    expect(names.has("ai-sdk")).toBe(true);
    expect(names.has("docs-writer")).toBe(true);
    expect(names.has("rag-patterns")).toBe(true);
  });

  test("each skill dirName matches frontmatter.name", () => {
    for (const skill of skills) {
      expect(skill.dirName).toBe(skill.frontmatter.name);
    }
  });
});
