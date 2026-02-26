import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { ClaudeCodeGenerator } from "../../src/generators/claude-code/generator.js";
import { OpenCodeGenerator } from "../../src/generators/opencode/generator.js";
import { scanSkills } from "../../src/catalog/scanner.js";
import type { ParsedSkill } from "../../src/schemas/catalog.js";
import { resolve, join } from "node:path";
import { rm, readdir, stat } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const rootDir = resolve(import.meta.dir, "../..");
const catalogDir = join(rootDir, "catalog");
const testOutputBase = join(rootDir, "dist", "test-output", "generators");

describe("target generators", () => {
  let skills: ParsedSkill[] = [];
  const version = "0.0.0-test";
  const claudeOutputDir = join(testOutputBase, "claude-code-full");
  const openCodeOutputDir = join(testOutputBase, "opencode-full");
  const claudeSubsetOutputDir = join(testOutputBase, "claude-code-subset");

  beforeAll(async () => {
    await rm(testOutputBase, { recursive: true, force: true });

    const scanResult = await scanSkills(catalogDir);
    skills = scanResult.skills;
  });

  afterAll(async () => {
    await rm(testOutputBase, { recursive: true, force: true });
  });

  test("Claude Code generator creates expected artifacts", async () => {
    const generator = new ClaudeCodeGenerator();
    const result = await generator.generate({
      skills,
      outputDir: claudeOutputDir,
      catalogDir,
      version,
    });

    expect(result.skillCount).toBe(skills.length);

    const pluginPath = join(claudeOutputDir, ".claude-plugin", "plugin.json");
    const pluginStats = await stat(pluginPath);
    expect(pluginStats.isFile()).toBe(true);

    const skillsDirEntries = await readdir(join(claudeOutputDir, "skills"), {
      withFileTypes: true,
    });
    expect(skillsDirEntries.filter((entry) => entry.isDirectory())).toHaveLength(skills.length);

    const agentsStats = await stat(join(claudeOutputDir, "agents"));
    const commandsStats = await stat(join(claudeOutputDir, "commands"));
    const hooksStats = await stat(join(claudeOutputDir, "hooks"));
    expect(agentsStats.isDirectory()).toBe(true);
    expect(commandsStats.isDirectory()).toBe(true);
    expect(hooksStats.isDirectory()).toBe(true);

    const hooksJson = await Bun.file(join(claudeOutputDir, "hooks", "hooks.json")).text();
    expect(() => JSON.parse(hooksJson)).not.toThrow();
  });

  test("OpenCode generator creates expected artifacts", async () => {
    const generator = new OpenCodeGenerator();
    const result = await generator.generate({
      skills,
      outputDir: openCodeOutputDir,
      catalogDir,
      version,
    });

    expect(result.skillCount).toBe(skills.length);

    const pluginPath = join(openCodeOutputDir, "plugins", "awesome-agent-toolbox.js");
    const pluginStats = await stat(pluginPath);
    expect(pluginStats.isFile()).toBe(true);

    const installMdStats = await stat(join(openCodeOutputDir, "INSTALL.md"));
    expect(installMdStats.isFile()).toBe(true);

    const skillsDirEntries = await readdir(join(openCodeOutputDir, "skills"), {
      withFileTypes: true,
    });
    expect(skillsDirEntries.filter((entry) => entry.isDirectory())).toHaveLength(skills.length);

    const pluginFileUrl = pathToFileURL(pluginPath).href;
    const pluginModule = await import(pluginFileUrl);
    expect(pluginModule).toBeDefined();
  });

  test("selective generation works with subset of skills", async () => {
    const subset = skills.slice(0, 3);
    const generator = new ClaudeCodeGenerator();
    const result = await generator.generate({
      skills: subset,
      outputDir: claudeSubsetOutputDir,
      catalogDir,
      version,
    });

    expect(result.skillCount).toBe(3);

    const skillsDirEntries = await readdir(join(claudeSubsetOutputDir, "skills"), {
      withFileTypes: true,
    });
    expect(skillsDirEntries.filter((entry) => entry.isDirectory())).toHaveLength(3);
  });
});
