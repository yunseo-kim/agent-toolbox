import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import {
  loadTaxonomy,
  validateDomain,
  validateSubdomain,
  getValidDomains,
  getValidSubdomains,
} from "../../src/catalog/taxonomy.js";
import { resolve, join } from "node:path";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";

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

describe("taxonomy error handling", () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = join(tmpdir(), `taxonomy-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterAll(async () => {
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch {
      // Cleanup best effort
    }
  });

  test("loadTaxonomy throws on file not found", async () => {
    const nonexistentPath = join(tempDir, "nonexistent.yaml");
    try {
      await loadTaxonomy(nonexistentPath);
      throw new Error("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain(
        "Failed to read taxonomy file",
      );
    }
  });

  test("loadTaxonomy throws on malformed YAML", async () => {
    const malformedPath = join(tempDir, `malformed-${Date.now()}.yaml`);
    await writeFile(malformedPath, "{: broken");
    try {
      await loadTaxonomy(malformedPath);
      throw new Error("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Malformed taxonomy YAML");
    }
  });

  test("loadTaxonomy throws on invalid schema", async () => {
    const invalidPath = join(tempDir, `invalid-${Date.now()}.yaml`);
    await writeFile(invalidPath, "foo: bar\n");
    try {
      await loadTaxonomy(invalidPath);
      throw new Error("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Invalid taxonomy schema");
    }
  });

  test("validateSubdomain returns false for nonexistent domain", async () => {
    const taxonomy = await loadTaxonomy(taxonomyPath);
    const result = validateSubdomain(
      taxonomy,
      "nonexistent-domain",
      "some-sub",
    );
    expect(result).toBe(false);
  });

  test("getValidSubdomains returns empty array for nonexistent domain", async () => {
    const taxonomy = await loadTaxonomy(taxonomyPath);
    const result = getValidSubdomains(taxonomy, "nonexistent-domain");
    expect(result).toEqual([]);
  });
});
