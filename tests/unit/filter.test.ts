import { beforeAll, describe, expect, test } from "bun:test";
import { filterSkills } from "../../src/install/filter.js";
import { scanSkills } from "../../src/catalog/scanner.js";
import type { ParsedSkill } from "../../src/schemas/catalog.js";
import { resolve } from "node:path";

const catalogDir = resolve(import.meta.dir, "../../catalog");

describe("filter composition", () => {
  let skills: ParsedSkill[] = [];

  beforeAll(async () => {
    const result = await scanSkills(catalogDir);
    skills = result.skills;
  });

  test("no filters returns all skills", () => {
    const result = filterSkills(skills, { target: "claude-code", interactive: false, dryRun: false });
    expect(result.total).toBe(skills.length);
    expect(result.matched).toHaveLength(skills.length);
    expect(result.appliedFilters).toEqual([]);
  });

  test("domain filter returns only matching skills", () => {
    const result = filterSkills(skills, {
      target: "claude-code",
      domain: "devops",
      interactive: false,
      dryRun: false,
    });
    expect(result.matched.length).toBeGreaterThan(0);
    expect(result.matched.every((skill) => skill.frontmatter.metadata.domain === "devops")).toBe(true);
  });

  test("subdomain filter works", () => {
    const result = filterSkills(skills, {
      target: "claude-code",
      domain: "development",
      subdomain: "frontend",
      interactive: false,
      dryRun: false,
    });

    expect(result.matched.length).toBeGreaterThan(0);
    expect(
      result.matched.every(
        (skill) =>
          skill.frontmatter.metadata.domain === "development" &&
          skill.frontmatter.metadata.subdomain === "frontend",
      ),
    ).toBe(true);
  });

  test("tag filter is case-insensitive", () => {
    const withTags = skills.find((skill) => (skill.frontmatter.metadata.tags ?? []).length > 0);
    expect(withTags).toBeDefined();

    const targetTag = withTags!.frontmatter.metadata.tags![0];
    const upperTag = targetTag.toUpperCase();
    const result = filterSkills(skills, {
      target: "claude-code",
      tag: upperTag,
      interactive: false,
      dryRun: false,
    });

    expect(result.matched.some((skill) => skill.frontmatter.name === withTags!.frontmatter.name)).toBe(true);
  });

  test("framework filter works", () => {
    const withFramework = skills.find((skill) => (skill.frontmatter.metadata.frameworks ?? []).length > 0);
    expect(withFramework).toBeDefined();

    const framework = withFramework!.frontmatter.metadata.frameworks![0];
    const result = filterSkills(skills, {
      target: "claude-code",
      framework,
      interactive: false,
      dryRun: false,
    });

    expect(result.matched.length).toBeGreaterThan(0);
    expect(
      result.matched.every((skill) =>
        (skill.frontmatter.metadata.frameworks ?? []).some(
          (entry) => entry.toLowerCase() === framework.toLowerCase(),
        ),
      ),
    ).toBe(true);
  });

  test("skill name filter matches exact names", () => {
    const result = filterSkills(skills, {
      target: "claude-code",
      skill: ["ai-sdk", "docs-writer"],
      interactive: false,
      dryRun: false,
    });

    const names = result.matched.map((skill) => skill.frontmatter.name).sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(["ai-sdk", "docs-writer"]);
  });

  test("multiple filters compose with AND", () => {
    const sample = skills[0];
    const result = filterSkills(skills, {
      target: "claude-code",
      domain: sample.frontmatter.metadata.domain,
      skill: [sample.frontmatter.name],
      interactive: false,
      dryRun: false,
    });

    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].frontmatter.name).toBe(sample.frontmatter.name);
  });

  test("empty result when no skills match", () => {
    const result = filterSkills(skills, {
      target: "claude-code",
      domain: "devops",
      skill: ["definitely-not-a-real-skill"],
      interactive: false,
      dryRun: false,
    });

    expect(result.matched).toHaveLength(0);
  });

  test("appliedFilters is populated correctly", () => {
    const result = filterSkills(skills, {
      target: "claude-code",
      domain: "devops",
      subdomain: "git",
      framework: "nextjs",
      tag: "github",
      skill: ["create-pr"],
      interactive: false,
      dryRun: false,
    });

    expect(result.appliedFilters).toEqual([
      "domain=devops",
      "subdomain=git",
      "framework=nextjs",
      "tag=github",
      "skill=create-pr",
    ]);
  });
});
