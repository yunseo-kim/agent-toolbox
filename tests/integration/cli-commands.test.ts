import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, readdir, rm, stat, symlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { checkInstallStatus } from "../../src/install/checker.js";
import { install } from "../../src/install/installer.js";
import { readManifest, writeManifest } from "../../src/install/manifest.js";

const rootDir = resolve(import.meta.dir, "../..");
const sourceCatalogDir = join(rootDir, "catalog");
const testRoot = join(rootDir, "dist", "test-output", "cli-commands");

async function createSandbox(name: string): Promise<string> {
  const sandboxRoot = join(testRoot, name);
  await rm(sandboxRoot, { recursive: true, force: true });
  await mkdir(sandboxRoot, { recursive: true });

  await symlink(sourceCatalogDir, join(sandboxRoot, "catalog"), "dir");

  const packageJson = (await Bun.file(
    join(rootDir, "package.json"),
  ).json()) as {
    version: string;
  };

  await Bun.write(
    join(sandboxRoot, "package.json"),
    JSON.stringify(
      { name: "cli-commands-test-sandbox", version: packageJson.version },
      null,
      2,
    ) + "\n",
  );

  return sandboxRoot;
}

describe("cli commands integration", () => {
  beforeAll(async () => {
    await rm(testRoot, { recursive: true, force: true });
    await mkdir(testRoot, { recursive: true });
  });

  afterAll(async () => {
    await rm(testRoot, { recursive: true, force: true });
  });

  test("install writes manifest", async () => {
    const sandboxRoot = await createSandbox("install-writes-manifest");

    await install(sandboxRoot, {
      target: "opencode",
      skill: ["docs-writer"],
      interactive: false,
      dryRun: false,
    });

    const targetDir = join(sandboxRoot, "dist", "targets", "opencode");
    const manifestPath = join(targetDir, ".install-manifest.json");
    expect(existsSync(manifestPath)).toBe(true);

    const outputEntries = await readdir(targetDir);
    expect(outputEntries.length).toBeGreaterThan(0);

    const manifest = await readManifest(targetDir);
    expect(manifest).not.toBeNull();
    expect(manifest?.target).toBe("opencode");
    expect(manifest?.skills).toHaveLength(1);
  });

  test("check detects up-to-date after fresh install", async () => {
    const sandboxRoot = await createSandbox("check-up-to-date");

    await install(sandboxRoot, {
      target: "opencode",
      skill: ["docs-writer"],
      interactive: false,
      dryRun: false,
    });

    const result = await checkInstallStatus(sandboxRoot, "opencode");
    expect(result.summary.outdated).toBe(0);
    expect(result.summary.upToDate).toBeGreaterThan(0);
  });

  test("check detects outdated skill", async () => {
    const sandboxRoot = await createSandbox("check-outdated");

    await install(sandboxRoot, {
      target: "opencode",
      skill: ["docs-writer"],
      interactive: false,
      dryRun: false,
    });

    const targetDir = join(sandboxRoot, "dist", "targets", "opencode");
    const manifest = await readManifest(targetDir);
    expect(manifest).not.toBeNull();

    if (!manifest) {
      throw new Error("Expected manifest to exist after install");
    }

    const outdatedManifest = {
      ...manifest,
      skills: manifest.skills.map((skill, index) =>
        index === 0 ? { ...skill, lastUpdated: "12020-01-01" } : skill,
      ),
    };
    await writeManifest(targetDir, outdatedManifest);

    const result = await checkInstallStatus(sandboxRoot, "opencode");
    expect(result.summary.outdated).toBeGreaterThan(0);
  });

  test("check detects new-in-catalog", async () => {
    const sandboxRoot = await createSandbox("check-new-in-catalog");

    await install(sandboxRoot, {
      target: "opencode",
      skill: ["docs-writer"],
      interactive: false,
      dryRun: false,
    });

    const targetDir = join(sandboxRoot, "dist", "targets", "opencode");
    const targetStats = await stat(targetDir);
    expect(targetStats.isDirectory()).toBe(true);

    const manifest = await readManifest(targetDir);
    expect(manifest).not.toBeNull();

    if (!manifest) {
      throw new Error("Expected manifest to exist after install");
    }

    await writeManifest(targetDir, {
      ...manifest,
      filters: { domain: "development" },
    });

    const result = await checkInstallStatus(sandboxRoot, "opencode");
    expect(result.summary.newInCatalog).toBeGreaterThan(0);
  });

  test("check throws when no manifest", async () => {
    const sandboxRoot = await createSandbox("check-no-manifest");

    expect(checkInstallStatus(sandboxRoot, "cursor")).rejects.toThrow(
      "No install manifest found",
    );
  });
});
