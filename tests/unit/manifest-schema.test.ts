import { describe, expect, test } from "bun:test";
import {
  InstallManifest,
  InstallManifestFilters,
  InstallManifestSkill,
} from "../../src/schemas/manifest.js";

const validSkill: InstallManifestSkill = {
  name: "github-cli",
  domain: "devops",
  subdomain: "git",
  lastUpdated: "12026-02-18",
};

const validFilters: InstallManifestFilters = {
  domain: "devops",
  subdomain: "git",
};

const validManifest = {
  version: 1 as const,
  target: "claude-code" as const,
  installedAt: "2026-03-08T12:00:00.000Z",
  catalogSource: "local" as const,
  filters: validFilters,
  skills: [validSkill],
};

describe("InstallManifestSkill schema", () => {
  test("accepts valid skill with all fields", () => {
    const parsed = InstallManifestSkill.parse(validSkill);
    expect(parsed.name).toBe("github-cli");
    expect(parsed.domain).toBe("devops");
    expect(parsed.subdomain).toBe("git");
    expect(parsed.lastUpdated).toBe("12026-02-18");
  });

  test("accepts skill without optional subdomain", () => {
    const parsed = InstallManifestSkill.parse({
      name: "ai-sdk",
      domain: "data-ai",
      lastUpdated: "12026-02-25",
    });
    expect(parsed.subdomain).toBeUndefined();
  });

  test("rejects skill without name", () => {
    const result = InstallManifestSkill.safeParse({
      domain: "devops",
      lastUpdated: "12026-02-18",
    });
    expect(result.success).toBe(false);
  });

  test("rejects skill without domain", () => {
    const result = InstallManifestSkill.safeParse({
      name: "github-cli",
      lastUpdated: "12026-02-18",
    });
    expect(result.success).toBe(false);
  });
});

describe("InstallManifestFilters schema", () => {
  test("accepts empty filters", () => {
    const parsed = InstallManifestFilters.parse({});
    expect(parsed.domain).toBeUndefined();
    expect(parsed.skill).toBeUndefined();
  });

  test("accepts all filter fields", () => {
    const parsed = InstallManifestFilters.parse({
      domain: "devops",
      subdomain: "ci-cd",
      framework: "nextjs",
      tag: "github",
      preset: "devops-essentials",
      skill: ["create-pr", "docs-writer"],
    });
    expect(parsed.domain).toBe("devops");
    expect(parsed.skill).toEqual(["create-pr", "docs-writer"]);
  });
});

describe("InstallManifest schema", () => {
  test("accepts valid manifest", () => {
    const parsed = InstallManifest.parse(validManifest);
    expect(parsed.version).toBe(1);
    expect(parsed.target).toBe("claude-code");
    expect(parsed.catalogSource).toBe("local");
    expect(parsed.skills).toHaveLength(1);
    expect(parsed.skills[0].name).toBe("github-cli");
  });

  test("accepts manifest with remote catalogSource", () => {
    const parsed = InstallManifest.parse({
      ...validManifest,
      catalogSource: "remote",
    });
    expect(parsed.catalogSource).toBe("remote");
  });

  test("accepts manifest with empty skills", () => {
    const parsed = InstallManifest.parse({
      ...validManifest,
      skills: [],
    });
    expect(parsed.skills).toHaveLength(0);
  });

  test("accepts all valid targets", () => {
    for (const target of [
      "claude-code",
      "opencode",
      "cursor",
      "codex",
      "gemini",
    ] as const) {
      const parsed = InstallManifest.parse({
        ...validManifest,
        target,
      });
      expect(parsed.target).toBe(target);
    }
  });

  test("rejects invalid version", () => {
    const result = InstallManifest.safeParse({
      ...validManifest,
      version: 2,
    });
    expect(result.success).toBe(false);
  });

  test("rejects invalid target", () => {
    const result = InstallManifest.safeParse({
      ...validManifest,
      target: "vscode",
    });
    expect(result.success).toBe(false);
  });

  test("rejects invalid catalogSource", () => {
    const result = InstallManifest.safeParse({
      ...validManifest,
      catalogSource: "github",
    });
    expect(result.success).toBe(false);
  });

  test("rejects missing required fields", () => {
    const { version: _v, ...noVersion } = validManifest;
    expect(InstallManifest.safeParse(noVersion).success).toBe(false);

    const { target: _t, ...noTarget } = validManifest;
    expect(InstallManifest.safeParse(noTarget).success).toBe(false);

    const { installedAt: _i, ...noInstalled } = validManifest;
    expect(InstallManifest.safeParse(noInstalled).success).toBe(false);
  });
});
