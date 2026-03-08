import { beforeAll, describe, expect, test } from "bun:test";
import { searchSkills } from "../../src/catalog/search.js";
import { scanSkills } from "../../src/catalog/scanner.js";
import type { ParsedSkill } from "../../src/schemas/catalog.js";
import { resolve } from "node:path";

const catalogDir = resolve(import.meta.dir, "../../catalog");

describe("searchSkills", () => {
  let skills: ParsedSkill[] = [];

  beforeAll(async () => {
    const result = await scanSkills(catalogDir);
    skills = result.skills;
  });

  test("empty query returns all skills with score 0", () => {
    const results = searchSkills(skills, "");
    expect(results).toHaveLength(skills.length);
    expect(results.every((r) => r.score === 0)).toBe(true);
  });

  test("whitespace-only query returns all skills with score 0", () => {
    const results = searchSkills(skills, "   ");
    expect(results).toHaveLength(skills.length);
  });

  test("exact name match scores highest", () => {
    const results = searchSkills(skills, "github-cli");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].skill.frontmatter.name).toBe("github-cli");
    expect(results[0].score).toBeGreaterThanOrEqual(100);
    expect(results[0].matchedFields).toContain("name");
  });

  test("partial name match scores below exact", () => {
    const results = searchSkills(skills, "github");
    expect(results.length).toBeGreaterThan(0);

    const githubCli = results.find(
      (r) => r.skill.frontmatter.name === "github-cli",
    );
    expect(githubCli).toBeDefined();
    expect(githubCli!.score).toBeGreaterThanOrEqual(50);
  });

  test("search is case-insensitive", () => {
    const lower = searchSkills(skills, "react");
    const upper = searchSkills(skills, "REACT");
    const mixed = searchSkills(skills, "React");

    expect(lower.length).toBe(upper.length);
    expect(lower.length).toBe(mixed.length);

    const lowerNames = lower.map((r) => r.skill.frontmatter.name).sort();
    const upperNames = upper.map((r) => r.skill.frontmatter.name).sort();
    expect(lowerNames).toEqual(upperNames);
  });

  test("domain match returns results with domain field", () => {
    const results = searchSkills(skills, "devops");
    expect(results.length).toBeGreaterThan(0);

    const domainMatches = results.filter((r) =>
      r.matchedFields.includes("domain"),
    );
    expect(domainMatches.length).toBeGreaterThan(0);
  });

  test("results are sorted by score descending", () => {
    const results = searchSkills(skills, "react");
    for (let i = 1; i < results.length; i += 1) {
      expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score);
    }
  });

  test("no match returns empty array", () => {
    const results = searchSkills(skills, "xyznonexistent123456");
    expect(results).toHaveLength(0);
  });

  test("description-only match has lowest score", () => {
    // Find a skill where a word appears in description but not name/domain/tags
    const results = searchSkills(skills, "performance");
    if (results.length > 0) {
      const descOnly = results.filter(
        (r) =>
          r.matchedFields.length === 1 && r.matchedFields[0] === "description",
      );
      for (const result of descOnly) {
        expect(result.score).toBe(10);
      }
    }
  });

  test("multiple field matches accumulate score", () => {
    // A term that matches both name and description should score higher
    // than one that only matches description
    const results = searchSkills(skills, "code");
    if (results.length >= 2) {
      const multiField = results.filter((r) => r.matchedFields.length > 1);
      const singleField = results.filter((r) => r.matchedFields.length === 1);

      if (multiField.length > 0 && singleField.length > 0) {
        expect(multiField[0].score).toBeGreaterThan(
          singleField[singleField.length - 1].score,
        );
      }
    }
  });
});
