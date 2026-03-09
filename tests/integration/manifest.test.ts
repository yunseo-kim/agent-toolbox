import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { join, resolve } from "node:path";
import { mkdir, rm } from "node:fs/promises";
import {
  MANIFEST_FILENAME,
  readManifest,
  removeSkillsFromManifest,
  writeManifest,
} from "../../src/install/manifest.js";
import type { InstallManifest } from "../../src/schemas/manifest.js";

const rootDir = resolve(import.meta.dir, "../..");
const testRoot = join(rootDir, "dist", "test-output", "manifest");

const validManifest: InstallManifest = {
  version: 1,
  target: "claude-code",
  installedAt: "2026-03-08T12:00:00.000Z",
  catalogSource: "local",
  filters: { domain: "devops" },
  skills: [
    {
      name: "git-master",
      domain: "devops",
      subdomain: "git",
      lastUpdated: "12026-02-18",
    },
    {
      name: "docs-writer",
      domain: "development",
      lastUpdated: "12026-02-25",
    },
    {
      name: "create-pr",
      domain: "devops",
      subdomain: "git",
      lastUpdated: "12026-03-01",
    },
  ],
};

async function freshDir(name: string): Promise<string> {
  const dir = join(testRoot, name);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  return dir;
}

describe("manifest integration", () => {
  beforeAll(async () => {
    await rm(testRoot, { recursive: true, force: true });
    await mkdir(testRoot, { recursive: true });
  });

  afterAll(async () => {
    await rm(testRoot, { recursive: true, force: true });
  });

  test("writeManifest and readManifest roundtrip", async () => {
    const targetDir = await freshDir("roundtrip");

    await writeManifest(targetDir, validManifest);
    const result = await readManifest(targetDir);

    expect(result).toEqual(validManifest);
  });

  test("readManifest returns null for nonexistent file", async () => {
    const targetDir = await freshDir("missing");

    const result = await readManifest(targetDir);

    expect(result).toBeNull();
  });

  test("readManifest returns null for invalid JSON", async () => {
    const targetDir = await freshDir("invalid-json");
    await Bun.write(join(targetDir, MANIFEST_FILENAME), "not-json");

    const result = await readManifest(targetDir);

    expect(result).toBeNull();
  });

  test("readManifest returns null for schema-invalid JSON", async () => {
    const targetDir = await freshDir("invalid-schema");
    await Bun.write(join(targetDir, MANIFEST_FILENAME), '{"foo":"bar"}\n');

    const result = await readManifest(targetDir);

    expect(result).toBeNull();
  });

  test("removeSkillsFromManifest removes specified skills", async () => {
    const targetDir = await freshDir("remove");
    await writeManifest(targetDir, validManifest);

    const updated = await removeSkillsFromManifest(targetDir, ["docs-writer"]);

    expect(updated).not.toBeNull();
    expect(updated?.skills).toHaveLength(2);
    expect(updated?.skills.map((skill) => skill.name)).not.toContain(
      "docs-writer",
    );
  });

  test("removeSkillsFromManifest is case-insensitive", async () => {
    const targetDir = await freshDir("case-insensitive");
    const caseManifest: InstallManifest = {
      ...validManifest,
      skills: [
        {
          name: "Git-Master",
          domain: "devops",
          subdomain: "git",
          lastUpdated: "12026-02-18",
        },
        ...validManifest.skills.slice(1),
      ],
    };
    await writeManifest(targetDir, caseManifest);

    const updated = await removeSkillsFromManifest(targetDir, ["git-master"]);

    expect(updated).not.toBeNull();
    expect(updated?.skills.map((skill) => skill.name)).not.toContain(
      "Git-Master",
    );
  });

  test("removeSkillsFromManifest returns null when no manifest", async () => {
    const targetDir = await freshDir("no-manifest");

    const updated = await removeSkillsFromManifest(targetDir, ["git-master"]);

    expect(updated).toBeNull();
  });

  test("writeManifest creates parent directories", async () => {
    const nestedTargetDir = join(testRoot, "nested", "a", "b", "c", "target");
    await rm(join(testRoot, "nested"), { recursive: true, force: true });

    await writeManifest(nestedTargetDir, validManifest);
    const result = await readManifest(nestedTargetDir);

    expect(result).toEqual(validManifest);
  });
});
