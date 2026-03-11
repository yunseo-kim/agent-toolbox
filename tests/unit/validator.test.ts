import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { scanSkills } from "../../src/catalog/scanner.js";
import { validateCatalog } from "../../src/catalog/validator.js";

const projectRoot = resolve(import.meta.dir, "../..");
const realCatalogDir = resolve(projectRoot, "catalog");
const taxonomyPath = resolve(projectRoot, "catalog/metadata/taxonomy.yaml");
const tempRootBase = resolve(projectRoot, "tests/.tmp");

const createdTempRoots: string[] = [];

interface SkillFixtureOptions {
  dirName?: string;
  name?: string;
  description?: string;
  license?: string;
  metadata?: {
    domain?: string;
    subdomain?: string;
    tags?: string;
    frameworks?: string;
    author?: string;
    lastUpdated?: string;
    provenance?: string;
  };
  includeNotice?: boolean;
}

const baseSkill: Required<SkillFixtureOptions> = {
  dirName: "test-skill",
  name: "test-skill",
  description: "Test description",
  license: "Sustainable Use License 1.0",
  metadata: {
    domain: "devops",
    subdomain: "ci-cd",
    tags: "test",
    frameworks: "bun",
    author: "Test Author",
    lastUpdated: "12026-03-09",
    provenance: "original",
  },
  includeNotice: true,
};

beforeAll(async () => {
  await mkdir(tempRootBase, { recursive: true });
});

afterAll(async () => {
  await Promise.all(
    createdTempRoots.map(async (tempRoot) => {
      await rm(tempRoot, { recursive: true, force: true });
    }),
  );
});

function buildSkillMarkdown(skill: SkillFixtureOptions): string {
  const mergedMetadata = {
    ...baseSkill.metadata,
    ...skill.metadata,
  };

  const merged = {
    ...baseSkill,
    ...skill,
    metadata: mergedMetadata,
  };

  const lines = ["---"];

  if (merged.name !== undefined) {
    lines.push(`name: ${merged.name}`);
  }
  if (merged.description !== undefined) {
    lines.push(`description: ${JSON.stringify(merged.description)}`);
  }
  if (merged.license !== undefined) {
    lines.push(`license: ${JSON.stringify(merged.license)}`);
  }

  lines.push("metadata:");

  if (merged.metadata.domain !== undefined) {
    lines.push(`  domain: ${JSON.stringify(merged.metadata.domain)}`);
  }
  if (merged.metadata.subdomain !== undefined) {
    lines.push(`  subdomain: ${JSON.stringify(merged.metadata.subdomain)}`);
  }
  if (merged.metadata.tags !== undefined) {
    lines.push(`  tags: ${JSON.stringify(merged.metadata.tags)}`);
  }
  if (merged.metadata.frameworks !== undefined) {
    lines.push(`  frameworks: ${JSON.stringify(merged.metadata.frameworks)}`);
  }
  if (merged.metadata.author !== undefined) {
    lines.push(`  author: ${JSON.stringify(merged.metadata.author)}`);
  }
  if (merged.metadata.lastUpdated !== undefined) {
    lines.push(`  lastUpdated: ${JSON.stringify(merged.metadata.lastUpdated)}`);
  }
  if (merged.metadata.provenance !== undefined) {
    lines.push(`  provenance: ${JSON.stringify(merged.metadata.provenance)}`);
  }

  lines.push("---", "Fixture body content");
  return lines.join("\n");
}

async function createFixtureCatalog(
  skills: SkillFixtureOptions[],
): Promise<string> {
  const tempRoot = await mkdtemp(join(tempRootBase, "validator-"));
  createdTempRoots.push(tempRoot);

  const catalogDir = join(tempRoot, "catalog");
  const skillsRoot = join(catalogDir, "skills");
  await mkdir(skillsRoot, { recursive: true });

  await Promise.all(
    skills.map(async (skill) => {
      const merged = {
        ...baseSkill,
        ...skill,
        metadata: {
          ...baseSkill.metadata,
          ...skill.metadata,
        },
      };

      const skillDir = join(skillsRoot, merged.dirName);
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, "SKILL.md"),
        buildSkillMarkdown(skill),
        "utf8",
      );

      if (merged.includeNotice) {
        await writeFile(join(skillDir, "NOTICE.md"), "Fixture notice", "utf8");
      }
    }),
  );

  return catalogDir;
}

function messages(errors: { message: string }[]): string[] {
  return errors.map((entry) => entry.message);
}

describe("catalog validator", () => {
  test("validateCatalog() validates real catalog with zero errors and accurate stats", async () => {
    const validation = await validateCatalog(realCatalogDir, taxonomyPath);
    const scanResult = await scanSkills(realCatalogDir);
    const skillEntries = await readdir(join(realCatalogDir, "skills"), {
      withFileTypes: true,
    });

    const expectedTotalSkills = skillEntries.filter((entry) =>
      entry.isDirectory(),
    ).length;
    const expectedDomains: Record<string, number> = {};

    for (const skill of scanResult.skills) {
      const domain = skill.frontmatter.metadata.domain;
      expectedDomains[domain] = (expectedDomains[domain] ?? 0) + 1;
    }

    const sortedExpectedDomains = Object.fromEntries(
      Object.entries(expectedDomains).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    );

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
    expect(validation.stats.totalSkills).toBe(expectedTotalSkills);
    expect(validation.stats.invalidSkills).toBe(0);
    expect(validation.stats.validSkills).toBe(expectedTotalSkills);
    expect(validation.stats.domains).toEqual(sortedExpectedDomains);
  });

  test("reports missing or empty required fields", async () => {
    const catalogDir = await createFixtureCatalog([
      {
        dirName: "missing-name",
        name: "",
      },
      {
        dirName: "missing-description",
        description: "",
      },
      {
        dirName: "missing-license",
        license: "",
      },
      {
        dirName: "missing-domain",
        metadata: { domain: "" },
      },
      {
        dirName: "missing-author",
        metadata: { author: "" },
      },
      {
        dirName: "missing-last-updated",
        metadata: { lastUpdated: "" },
      },
      {
        dirName: "missing-provenance",
        metadata: { provenance: "" },
      },
    ]);

    const validation = await validateCatalog(catalogDir, taxonomyPath);
    const allMessages = messages(validation.errors);

    expect(allMessages.some((message) => message.includes("name"))).toBe(true);
    expect(allMessages.some((message) => message.includes("description"))).toBe(
      true,
    );
    expect(allMessages.some((message) => message.includes("license"))).toBe(
      true,
    );
    expect(
      allMessages.some((message) => message.includes("metadata.domain")),
    ).toBe(true);
    expect(
      allMessages.some((message) => message.includes("metadata.author")),
    ).toBe(true);
    expect(
      allMessages.some((message) => message.includes("metadata.lastUpdated")),
    ).toBe(true);
    expect(
      allMessages.some((message) => message.includes("metadata.provenance")),
    ).toBe(true);
  });

  test("reports invalid domain", async () => {
    const catalogDir = await createFixtureCatalog([
      {
        metadata: { domain: "not-a-real-domain" },
      },
    ]);

    const validation = await validateCatalog(catalogDir, taxonomyPath);
    expect(messages(validation.errors)).toContain(
      "Invalid domain 'not-a-real-domain'",
    );
  });

  test("reports invalid subdomain for valid domain", async () => {
    const catalogDir = await createFixtureCatalog([
      {
        metadata: {
          domain: "devops",
          subdomain: "frontend",
        },
      },
    ]);

    const validation = await validateCatalog(catalogDir, taxonomyPath);
    expect(messages(validation.errors)).toContain(
      "Invalid subdomain 'frontend' for domain 'devops'",
    );
  });

  test("warns when subdomain is missing", async () => {
    const catalogDir = await createFixtureCatalog([
      {
        metadata: { subdomain: undefined },
      },
    ]);

    const validation = await validateCatalog(catalogDir, taxonomyPath);
    expect(
      validation.warnings.some(
        (warning) => warning.field === "metadata.subdomain",
      ),
    ).toBe(true);
  });

  test("reports invalid provenance", async () => {
    const catalogDir = await createFixtureCatalog([
      {
        metadata: { provenance: "not-valid" },
      },
    ]);

    const validation = await validateCatalog(catalogDir, taxonomyPath);
    expect(
      messages(validation.errors).some((message) =>
        message.includes("metadata.provenance"),
      ),
    ).toBe(true);
  });

  test("reports missing NOTICE.md", async () => {
    const catalogDir = await createFixtureCatalog([
      {
        includeNotice: false,
      },
    ]);

    const validation = await validateCatalog(catalogDir, taxonomyPath);
    expect(messages(validation.errors)).toContain(
      "Missing required file: NOTICE.md",
    );
  });

  test("reports directory name mismatch with frontmatter name", async () => {
    const catalogDir = await createFixtureCatalog([
      {
        dirName: "directory-name",
        name: "different-name",
      },
    ]);

    const validation = await validateCatalog(catalogDir, taxonomyPath);
    expect(
      messages(validation.errors).some((message) =>
        message.includes("does not match name 'different-name'"),
      ),
    ).toBe(true);
  });

  test("reports invalid Holocene date", async () => {
    const catalogDir = await createFixtureCatalog([
      {
        metadata: { lastUpdated: "2026-03-09" },
      },
    ]);

    const validation = await validateCatalog(catalogDir, taxonomyPath);
    expect(
      messages(validation.errors).some((message) =>
        message.includes("metadata.lastUpdated"),
      ),
    ).toBe(true);
  });

  test("reports description longer than 1024 characters", async () => {
    const catalogDir = await createFixtureCatalog([
      {
        description: "x".repeat(1025),
      },
    ]);

    const validation = await validateCatalog(catalogDir, taxonomyPath);
    expect(
      messages(validation.errors).some(
        (message) =>
          message.includes("description") || message.includes("1024"),
      ),
    ).toBe(true);
  });

  test("warns when description is empty", async () => {
    const catalogDir = await createFixtureCatalog([
      {
        description: "",
      },
    ]);

    const validation = await validateCatalog(catalogDir, taxonomyPath);
    expect(
      validation.warnings.some(
        (warning) => warning.message === "Description is empty",
      ),
    ).toBe(true);
  });

  test("warns when tags and frameworks are missing", async () => {
    const catalogDir = await createFixtureCatalog([
      {
        metadata: {
          tags: undefined,
          frameworks: undefined,
        },
      },
    ]);

    const validation = await validateCatalog(catalogDir, taxonomyPath);
    expect(
      validation.warnings.some((warning) => warning.field === "metadata.tags"),
    ).toBe(true);
    expect(
      validation.warnings.some(
        (warning) => warning.field === "metadata.frameworks",
      ),
    ).toBe(true);
  });

  test("propagates scan errors to validation results", async () => {
    const catalogDir = await createFixtureCatalog([
      {}, // one valid skill
    ]);

    // Add a skill with broken YAML that the scanner can't parse
    const brokenDir = join(catalogDir, "skills", "broken-yaml");
    await mkdir(brokenDir, { recursive: true });
    await writeFile(
      join(brokenDir, "SKILL.md"),
      "---\n{{{invalid yaml\n---\nBody",
      "utf8",
    );

    const validation = await validateCatalog(catalogDir, taxonomyPath);

    // Should have errors propagated from the scanner for the broken YAML skill
    expect(
      validation.errors.some((error) => error.path.includes("broken-yaml")),
    ).toBe(true);
  });
});
