import { beforeAll, describe, expect, test, afterAll } from "bun:test";
import { scanSkills } from "../../src/catalog/scanner.js";
import type { ParsedSkill } from "../../src/schemas/catalog.js";
import { resolve } from "node:path";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";

const catalogDir = resolve(import.meta.dir, "../../catalog");

describe("catalog scanner", () => {
  let skills: ParsedSkill[] = [];
  let errors: { path: string; error: string }[] = [];

  beforeAll(async () => {
    const result = await scanSkills(catalogDir);
    skills = result.skills;
    errors = result.errors;
  });

  test("scans and finds 117 skills", () => {
    expect(skills).toHaveLength(117);
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

describe("catalog scanner - error handling", () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = resolve(tmpdir(), `scanner-test-${Date.now()}`);
  });

  afterAll(async () => {
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  test("returns error when skills directory does not exist", async () => {
    const nonexistentDir = resolve(tempDir, "nonexistent");
    const result = await scanSkills(nonexistentDir);

    expect(result.skills).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain("Failed to scan skills directory");
  });

  test("returns error for skill with invalid frontmatter", async () => {
    const testDir = resolve(tempDir, "test-invalid-frontmatter");
    const skillsDir = resolve(testDir, "skills");
    const skillDir = resolve(skillsDir, "invalid-skill");

    await mkdir(skillDir, { recursive: true });
    await writeFile(
      resolve(skillDir, "SKILL.md"),
      `---
name: invalid-skill
description: "Test skill"
# Missing required 'license' field
metadata:
  domain: devops
---
# Body content`,
    );

    const result = await scanSkills(testDir);

    expect(result.skills).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].error).toContain("Frontmatter validation failed");
    expect(result.errors[0].path).toContain("SKILL.md");
  });

  test("returns error when SKILL.md file does not exist", async () => {
    const testDir = resolve(tempDir, "test-missing-skill-md");
    const skillsDir = resolve(testDir, "skills");
    const skillDir = resolve(skillsDir, "no-skill-file");

    await mkdir(skillDir, { recursive: true });
    // Intentionally do not create SKILL.md

    const result = await scanSkills(testDir);

    expect(result.skills).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain("ENOENT");
  });

  test("handles mixed valid and invalid skills", async () => {
    const testDir = resolve(tempDir, "test-mixed");
    const skillsDir = resolve(testDir, "skills");

    // Create valid skill
    const validDir = resolve(skillsDir, "valid-skill");
    await mkdir(validDir, { recursive: true });
    await writeFile(
      resolve(validDir, "SKILL.md"),
      `---
name: valid-skill
description: "A valid test skill"
license: SUL-1.0
metadata:
  domain: devops
  author: "Test Author"
  lastUpdated: "12026-03-12"
  provenance: original
---
# Valid Body`,
    );

    // Create invalid skill (missing provenance)
    const invalidDir = resolve(skillsDir, "invalid-skill");
    await mkdir(invalidDir, { recursive: true });
    await writeFile(
      resolve(invalidDir, "SKILL.md"),
      `---
name: invalid-skill
description: "Invalid test skill"
license: SUL-1.0
  metadata:
  domain: devops
  author: "Test Author"
  lastUpdated: "12026-03-12"
---
# Invalid Body`,
    );

    const result = await scanSkills(testDir);

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].frontmatter.name).toBe("valid-skill");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toMatch(
      /Frontmatter validation failed|Malformed YAML/,
    );
  });
});
