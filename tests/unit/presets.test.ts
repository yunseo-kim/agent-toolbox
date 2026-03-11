import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { loadPresets, resolvePreset } from "../../src/install/presets.js";
import type { PresetsConfig } from "../../src/schemas/presets.js";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const testDir = resolve(import.meta.dir, "../../dist/test-presets");
const presetsYamlPath = resolve(
  import.meta.dir,
  "../../catalog/metadata/presets.yaml",
);

describe("loadPresets", () => {
  beforeAll(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  test("loads real presets.yaml successfully", async () => {
    const config = await loadPresets(presetsYamlPath);
    expect(config).toBeDefined();
    expect(config.presets).toBeDefined();
    expect(Array.isArray(config.presets)).toBe(true);
  });

  test("returns PresetsConfig with presets array", async () => {
    const config = await loadPresets(presetsYamlPath);
    expect(config).toHaveProperty("presets");
    expect(Array.isArray(config.presets)).toBe(true);
  });

  test("throws error for nonexistent file", async () => {
    const nonexistentPath = resolve(testDir, "nonexistent.yaml");
    try {
      await loadPresets(nonexistentPath);
      expect.unreachable("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test("throws error on invalid YAML content", async () => {
    const invalidYamlPath = resolve(testDir, "invalid.yaml");
    await writeFile(invalidYamlPath, "{ invalid: yaml: content: [");

    try {
      await loadPresets(invalidYamlPath);
      expect.unreachable("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test("throws error on schema-invalid YAML (missing presets key)", async () => {
    const schemaInvalidPath = resolve(testDir, "schema-invalid.yaml");
    await writeFile(schemaInvalidPath, "domains:\n  - devops\n  - development");

    try {
      await loadPresets(schemaInvalidPath);
      expect.unreachable("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test("throws error on schema-invalid YAML (presets not array)", async () => {
    const schemaInvalidPath = resolve(testDir, "schema-invalid-2.yaml");
    await writeFile(schemaInvalidPath, "presets: not-an-array");

    try {
      await loadPresets(schemaInvalidPath);
      expect.unreachable("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test("throws error on schema-invalid YAML (preset missing required fields)", async () => {
    const schemaInvalidPath = resolve(testDir, "schema-invalid-3.yaml");
    await writeFile(
      schemaInvalidPath,
      "presets:\n  - name: test-preset\n    # missing description and items",
    );

    try {
      await loadPresets(schemaInvalidPath);
      expect.unreachable("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test("parses valid preset with all fields", async () => {
    const validPresetsPath = resolve(testDir, "valid-presets.yaml");
    await writeFile(
      validPresetsPath,
      `presets:
  - name: devops-essentials
    description: Core DevOps skills
    items:
      - github-actions-templates
      - gitlab-ci-patterns
  - name: frontend-stack
    description: Frontend development tools
    items:
      - react-best-practices
      - nextjs-cache-components`,
    );

    const config = await loadPresets(validPresetsPath);
    expect(config.presets).toHaveLength(2);
    expect(config.presets[0].name).toBe("devops-essentials");
    expect(config.presets[0].description).toBe("Core DevOps skills");
    expect(config.presets[0].items).toEqual([
      "github-actions-templates",
      "gitlab-ci-patterns",
    ]);
  });

  test("handles empty presets array", async () => {
    const emptyPresetsPath = resolve(testDir, "empty-presets.yaml");
    await writeFile(emptyPresetsPath, "presets: []");

    const config = await loadPresets(emptyPresetsPath);
    expect(config.presets).toHaveLength(0);
    expect(Array.isArray(config.presets)).toBe(true);
  });
});

describe("resolvePreset", () => {
  test("returns items array for existing preset", () => {
    const config: PresetsConfig = {
      presets: [
        {
          name: "devops-essentials",
          description: "Core DevOps skills",
          items: ["github-actions-templates", "gitlab-ci-patterns"],
        },
        {
          name: "frontend-stack",
          description: "Frontend development tools",
          items: ["react-best-practices", "nextjs-cache-components"],
        },
      ],
    };

    const result = resolvePreset(config, "devops-essentials");
    expect(result).toEqual(["github-actions-templates", "gitlab-ci-patterns"]);
  });

  test("returns null for nonexistent preset", () => {
    const config: PresetsConfig = {
      presets: [
        {
          name: "devops-essentials",
          description: "Core DevOps skills",
          items: ["github-actions-templates"],
        },
      ],
    };

    const result = resolvePreset(config, "nonexistent-preset");
    expect(result).toBeNull();
  });

  test("works with empty presets array", () => {
    const config: PresetsConfig = {
      presets: [],
    };

    const result = resolvePreset(config, "any-preset");
    expect(result).toBeNull();
  });

  test("returns correct items for preset with single item", () => {
    const config: PresetsConfig = {
      presets: [
        {
          name: "single-item",
          description: "Single item preset",
          items: ["git-master"],
        },
      ],
    };

    const result = resolvePreset(config, "single-item");
    expect(result).toEqual(["git-master"]);
  });

  test("returns correct items for preset with multiple items", () => {
    const config: PresetsConfig = {
      presets: [
        {
          name: "multi-item",
          description: "Multiple items preset",
          items: [
            "skill-one",
            "skill-two",
            "skill-three",
            "skill-four",
            "skill-five",
          ],
        },
      ],
    };

    const result = resolvePreset(config, "multi-item");
    expect(result).toEqual([
      "skill-one",
      "skill-two",
      "skill-three",
      "skill-four",
      "skill-five",
    ]);
  });

  test("is case-sensitive for preset names", () => {
    const config: PresetsConfig = {
      presets: [
        {
          name: "DevOps-Essentials",
          description: "Core DevOps skills",
          items: ["github-actions-templates"],
        },
      ],
    };

    const result1 = resolvePreset(config, "DevOps-Essentials");
    const result2 = resolvePreset(config, "devops-essentials");

    expect(result1).toEqual(["github-actions-templates"]);
    expect(result2).toBeNull();
  });

  test("returns first matching preset when duplicates exist", () => {
    const config: PresetsConfig = {
      presets: [
        {
          name: "duplicate",
          description: "First duplicate",
          items: ["first-item"],
        },
        {
          name: "duplicate",
          description: "Second duplicate",
          items: ["second-item"],
        },
      ],
    };

    const result = resolvePreset(config, "duplicate");
    expect(result).toEqual(["first-item"]);
  });

  test("handles preset with empty items array", () => {
    const config: PresetsConfig = {
      presets: [
        {
          name: "empty-items",
          description: "Preset with no items",
          items: [],
        },
      ],
    };

    const result = resolvePreset(config, "empty-items");
    expect(result).toEqual([]);
  });
});
