import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { ClaudeCodeGenerator } from "../../src/generators/claude-code/generator.js";
import { CodexGenerator } from "../../src/generators/codex/generator.js";
import { CursorGenerator } from "../../src/generators/cursor/generator.js";
import { GeminiGenerator } from "../../src/generators/gemini/generator.js";
import { OpenCodeGenerator } from "../../src/generators/opencode/generator.js";
import { scanSkills } from "../../src/catalog/scanner.js";
import type { ParsedSkill } from "../../src/schemas/catalog.js";
import { resolve, join } from "node:path";
import { rm, readdir, stat } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";

const rootDir = resolve(import.meta.dir, "../..");
const catalogDir = join(rootDir, "catalog");
const testOutputBase = join(rootDir, "dist", "test-output", "generators");

describe("target generators", () => {
  let skills: ParsedSkill[] = [];
  const version = "0.0.0-test";
  const claudeOutputDir = join(testOutputBase, "claude-code-full");
  const codexOutputDir = join(testOutputBase, "codex-full");
  const cursorOutputDir = join(testOutputBase, "cursor-full");
  const geminiOutputDir = join(testOutputBase, "gemini-full");
  const openCodeOutputDir = join(testOutputBase, "opencode-full");
  const claudeSubsetOutputDir = join(testOutputBase, "claude-code-subset");

  beforeAll(async () => {
    await rm(testOutputBase, { recursive: true, force: true });

    const scanResult = await scanSkills(catalogDir);
    skills = scanResult.skills;
  });

  afterAll(async () => {
    await rm(codexOutputDir, { recursive: true, force: true });
    await rm(cursorOutputDir, { recursive: true, force: true });
    await rm(geminiOutputDir, { recursive: true, force: true });
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
    expect(
      skillsDirEntries.filter((entry) => entry.isDirectory()),
    ).toHaveLength(skills.length);

    const agentsStats = await stat(join(claudeOutputDir, "agents"));
    const commandsStats = await stat(join(claudeOutputDir, "commands"));
    const hooksStats = await stat(join(claudeOutputDir, "hooks"));
    expect(agentsStats.isDirectory()).toBe(true);
    expect(commandsStats.isDirectory()).toBe(true);
    expect(hooksStats.isDirectory()).toBe(true);

    const hooksJson = await Bun.file(
      join(claudeOutputDir, "hooks", "hooks.json"),
    ).text();
    expect(() => JSON.parse(hooksJson) as unknown).not.toThrow();
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

    const pluginPath = join(openCodeOutputDir, "plugins", "agent-toolbox.js");
    const pluginStats = await stat(pluginPath);
    expect(pluginStats.isFile()).toBe(true);

    const installMdStats = await stat(join(openCodeOutputDir, "INSTALL.md"));
    expect(installMdStats.isFile()).toBe(true);

    const skillsDirEntries = await readdir(join(openCodeOutputDir, "skills"), {
      withFileTypes: true,
    });
    expect(
      skillsDirEntries.filter((entry) => entry.isDirectory()),
    ).toHaveLength(skills.length);

    const pluginFileUrl = pathToFileURL(pluginPath).href;
    const pluginModule: unknown = await import(pluginFileUrl);
    expect(pluginModule).toBeDefined();
  });

  test("Codex generator creates expected artifacts", async () => {
    const generator = new CodexGenerator();
    const result = await generator.generate({
      skills,
      outputDir: codexOutputDir,
      catalogDir,
      version,
    });

    expect(result.skillCount).toBe(skills.length);

    const openAiYamlPath = join(codexOutputDir, "agents", "openai.yaml");
    const openAiYamlStats = await stat(openAiYamlPath);
    expect(openAiYamlStats.isFile()).toBe(true);

    const openAiYaml = await Bun.file(openAiYamlPath).text();
    expect(() => parseYaml(openAiYaml) as unknown).not.toThrow();

    const skillsDirEntries = await readdir(join(codexOutputDir, "skills"), {
      withFileTypes: true,
    });
    expect(
      skillsDirEntries.filter((entry) => entry.isDirectory()),
    ).toHaveLength(skills.length);

    const agentsStats = await stat(join(codexOutputDir, "agents"));
    expect(agentsStats.isDirectory()).toBe(true);

    const installMdStats = await stat(join(codexOutputDir, "INSTALL.md"));
    expect(installMdStats.isFile()).toBe(true);
  });

  test("Cursor generator creates expected artifacts", async () => {
    const generator = new CursorGenerator();
    const result = await generator.generate({
      skills,
      outputDir: cursorOutputDir,
      catalogDir,
      version,
    });

    expect(result.skillCount).toBe(skills.length);

    const pluginPath = join(cursorOutputDir, ".cursor-plugin", "plugin.json");
    const pluginStats = await stat(pluginPath);
    expect(pluginStats.isFile()).toBe(true);

    const pluginJson = await Bun.file(pluginPath).text();
    expect(() => JSON.parse(pluginJson) as unknown).not.toThrow();

    const skillsDirEntries = await readdir(join(cursorOutputDir, "skills"), {
      withFileTypes: true,
    });
    expect(
      skillsDirEntries.filter((entry) => entry.isDirectory()),
    ).toHaveLength(skills.length);

    const agentsStats = await stat(join(cursorOutputDir, "agents"));
    const commandsStats = await stat(join(cursorOutputDir, "commands"));
    const hooksStats = await stat(join(cursorOutputDir, "hooks"));
    expect(agentsStats.isDirectory()).toBe(true);
    expect(commandsStats.isDirectory()).toBe(true);
    expect(hooksStats.isDirectory()).toBe(true);

    const hooksJson = await Bun.file(
      join(cursorOutputDir, "hooks", "hooks.json"),
    ).text();
    expect(() => JSON.parse(hooksJson) as unknown).not.toThrow();
  });

  test("Gemini generator creates expected artifacts", async () => {
    const generator = new GeminiGenerator();
    const result = await generator.generate({
      skills,
      outputDir: geminiOutputDir,
      catalogDir,
      version,
    });

    expect(result.skillCount).toBe(skills.length);

    const extensionPath = join(geminiOutputDir, "gemini-extension.json");
    const extensionStats = await stat(extensionPath);
    expect(extensionStats.isFile()).toBe(true);

    const extensionJson = await Bun.file(extensionPath).text();
    expect(() => JSON.parse(extensionJson) as unknown).not.toThrow();

    const skillsDirEntries = await readdir(join(geminiOutputDir, "skills"), {
      withFileTypes: true,
    });
    expect(
      skillsDirEntries.filter((entry) => entry.isDirectory()),
    ).toHaveLength(skills.length);

    const commandsStats = await stat(join(geminiOutputDir, "commands"));
    const hooksStats = await stat(join(geminiOutputDir, "hooks"));
    expect(commandsStats.isDirectory()).toBe(true);
    expect(hooksStats.isDirectory()).toBe(true);

    const hooksJson = await Bun.file(
      join(geminiOutputDir, "hooks", "hooks.json"),
    ).text();
    expect(() => JSON.parse(hooksJson) as unknown).not.toThrow();

    const geminiMdStats = await stat(join(geminiOutputDir, "GEMINI.md"));
    expect(geminiMdStats.isFile()).toBe(true);
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

    const skillsDirEntries = await readdir(
      join(claudeSubsetOutputDir, "skills"),
      {
        withFileTypes: true,
      },
    );
    expect(
      skillsDirEntries.filter((entry) => entry.isDirectory()),
    ).toHaveLength(3);
  });
});
