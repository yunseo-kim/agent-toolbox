import { describe, expect, test } from "bun:test";
import {
  loadTaxonomy,
  validateDomain,
  validateSubdomain,
  getValidDomains,
  getValidSubdomains,
} from "../../src/catalog/taxonomy.js";
import { resolve } from "node:path";

const taxonomyPath = resolve(
  import.meta.dir,
  "../../catalog/metadata/taxonomy.yaml",
);

describe("taxonomy loading and validation", () => {
  test("loads real taxonomy.yaml successfully", async () => {
    const taxonomy = await loadTaxonomy(taxonomyPath);
    expect(taxonomy).toBeDefined();
    expect(taxonomy.domains).toBeDefined();
  });

  test("contains 10 domains", async () => {
    const taxonomy = await loadTaxonomy(taxonomyPath);
    expect(Object.keys(taxonomy.domains)).toHaveLength(10);
  });

  test("validateDomain returns true for known domains", async () => {
    const taxonomy = await loadTaxonomy(taxonomyPath);
    expect(validateDomain(taxonomy, "development")).toBe(true);
    expect(validateDomain(taxonomy, "devops")).toBe(true);
    expect(validateDomain(taxonomy, "productivity")).toBe(true);
  });

  test("validateDomain returns false for unknown domains", async () => {
    const taxonomy = await loadTaxonomy(taxonomyPath);
    expect(validateDomain(taxonomy, "invalid-domain")).toBe(false);
    expect(validateDomain(taxonomy, "")).toBe(false);
  });

  test("validateSubdomain returns true for valid pair", async () => {
    const taxonomy = await loadTaxonomy(taxonomyPath);
    expect(validateSubdomain(taxonomy, "development", "frontend")).toBe(true);
  });

  test("validateSubdomain returns false for invalid pair", async () => {
    const taxonomy = await loadTaxonomy(taxonomyPath);
    expect(validateSubdomain(taxonomy, "development", "nonexistent")).toBe(
      false,
    );
  });

  test("getValidDomains returns all 10 domains", async () => {
    const taxonomy = await loadTaxonomy(taxonomyPath);
    expect(getValidDomains(taxonomy)).toEqual([
      "blockchain",
      "business",
      "content-media",
      "data-ai",
      "databases",
      "development",
      "devops",
      "documentation",
      "productivity",
      "research",
    ]);
  });

  test("getValidSubdomains returns devops subdomains", async () => {
    const taxonomy = await loadTaxonomy(taxonomyPath);
    expect(getValidSubdomains(taxonomy, "devops")).toEqual([
      "ci-cd",
      "cloud",
      "code-review",
      "containers",
      "git",
      "monitoring",
      "security",
      "testing",
    ]);
  });
});
