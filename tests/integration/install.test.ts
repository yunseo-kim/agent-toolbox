import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { install } from "../../src/install/installer.js";
import { scanSkills } from "../../src/catalog/scanner.js";
import type { ParsedSkill } from "../../src/schemas/catalog.js";
import { resolve, join } from "node:path";
import { rm, stat, mkdir, symlink } from "node:fs/promises";

const rootDir = resolve(import.meta.dir, "../..");
const sourceCatalogDir = join(rootDir, "catalog");
const testRoot = join(rootDir, "dist", "test-output", "install");
const sandboxRoot = join(testRoot, "sandbox-root");

describe("install pipeline", () => {
  let allSkills: ParsedSkill[] = [];

  beforeAll(async () => {
    await rm(testRoot, { recursive: true, force: true });
    await mkdir(sandboxRoot, { recursive: true });

    await symlink(sourceCatalogDir, join(sandboxRoot, "catalog"), "dir");

    const packageJson = await Bun.file(join(rootDir, "package.json")).json() as { version: string };
    await Bun.write(
      join(sandboxRoot, "package.json"),
      JSON.stringify({ name: "install-test-sandbox", version: packageJson.version }, null, 2) + "\n",
    );

    const scanResult = await scanSkills(sourceCatalogDir);
    allSkills = scanResult.skills;
  });

  afterAll(async () => {
    await rm(testRoot, { recursive: true, force: true });
  });

  test("dry-run returns matched skills without generating", async () => {
    const result = await install(sandboxRoot, {
      target: "claude-code",
      domain: "devops",
      interactive: false,
      dryRun: true,
    });

    expect(result.dryRun).toBe(true);
    expect(result.generatorResult).toBeNull();
    expect(result.filterResult.matched.length).toBeGreaterThan(0);

    const outputPath = join(sandboxRoot, "dist", "targets", "claude-code");
    let missing = false;
    try {
      await stat(outputPath);
    } catch {
      missing = true;
    }
    expect(missing).toBe(true);
  });

  test("full install generates artifacts", async () => {
    const result = await install(sandboxRoot, {
      target: "opencode",
      skill: ["ai-sdk", "docs-writer"],
      interactive: false,
      dryRun: false,
    });

    expect(result.dryRun).toBe(false);
    expect(result.generatorResult).not.toBeNull();
    expect(result.generatorResult?.skillCount).toBe(2);

    const pluginPath = join(sandboxRoot, "dist", "targets", "opencode", "plugins", "awesome-agent-toolbox.js");
    const pluginStats = await stat(pluginPath);
    expect(pluginStats.isFile()).toBe(true);
  });

  test("domain filter produces correct count", async () => {
    const expected = allSkills.filter((skill) => skill.frontmatter.metadata.domain === "development").length;

    const result = await install(sandboxRoot, {
      target: "claude-code",
      domain: "development",
      interactive: false,
      dryRun: true,
    });

    expect(result.filterResult.matched).toHaveLength(expected);
  });

  test("multiple filters compose correctly", async () => {
    const expected = allSkills.filter(
      (skill) =>
        skill.frontmatter.metadata.domain === "development" &&
        skill.frontmatter.metadata.subdomain === "frontend",
    ).length;

    const result = await install(sandboxRoot, {
      target: "claude-code",
      domain: "development",
      subdomain: "frontend",
      interactive: false,
      dryRun: true,
    });

    expect(result.filterResult.matched).toHaveLength(expected);
  });

  test("invalid target throws error", async () => {
    let captured: unknown;

    try {
      await install(sandboxRoot, {
        target: "vscode" as never,
        interactive: false,
        dryRun: false,
      });
    } catch (error) {
      captured = error;
    }

    expect(captured).toBeInstanceOf(Error);
    expect((captured as Error).message).toContain("vscode");
  });
});
