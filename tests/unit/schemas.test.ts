import { describe, expect, test } from "bun:test";
import {
  SkillName,
  HoloceneDate,
  Provenance,
  CommaSeparatedList,
  TargetTool,
} from "../../src/schemas/common.js";
import {
  SkillFrontmatter,
  CatalogItemType,
} from "../../src/schemas/catalog.js";
import { TaxonomySchema } from "../../src/schemas/taxonomy.js";
import { InstallFilters } from "../../src/schemas/install.js";

describe("common schemas", () => {
  test("SkillName accepts valid names", () => {
    expect(SkillName.parse("ai-sdk")).toBe("ai-sdk");
    expect(SkillName.parse("my-skill-123")).toBe("my-skill-123");
  });

  test("SkillName rejects invalid names", () => {
    expect(SkillName.safeParse("AI-SDK").success).toBe(false);
    expect(SkillName.safeParse("skill name").success).toBe(false);
    expect(SkillName.safeParse("a".repeat(65)).success).toBe(false);
    expect(SkillName.safeParse("").success).toBe(false);
  });

  test("HoloceneDate accepts valid date", () => {
    expect(HoloceneDate.parse("12026-02-25")).toBe("12026-02-25");
  });

  test("HoloceneDate rejects invalid dates", () => {
    expect(HoloceneDate.safeParse("2026-02-25").success).toBe(false);
    expect(HoloceneDate.safeParse("12026-13-01").success).toBe(false);
    expect(HoloceneDate.safeParse("invalid").success).toBe(false);
  });

  test("Provenance accepts all valid values", () => {
    expect(Provenance.parse("ported")).toBe("ported");
    expect(Provenance.parse("adapted")).toBe("adapted");
    expect(Provenance.parse("synthesized")).toBe("synthesized");
    expect(Provenance.parse("original")).toBe("original");
  });

  test("Provenance rejects invalid value", () => {
    expect(Provenance.safeParse("custom").success).toBe(false);
  });

  test("CommaSeparatedList transforms and trims", () => {
    expect(CommaSeparatedList.parse("a, b, c")).toEqual(["a", "b", "c"]);
    expect(CommaSeparatedList.parse("single")).toEqual(["single"]);
    expect(CommaSeparatedList.parse(" a ,  b  ,c ")).toEqual(["a", "b", "c"]);
  });

  test("TargetTool accepts all 5 targets", () => {
    expect(TargetTool.parse("claude-code")).toBe("claude-code");
    expect(TargetTool.parse("opencode")).toBe("opencode");
    expect(TargetTool.parse("cursor")).toBe("cursor");
    expect(TargetTool.parse("codex")).toBe("codex");
    expect(TargetTool.parse("gemini")).toBe("gemini");
  });

  test("TargetTool rejects invalid target", () => {
    expect(TargetTool.safeParse("vscode").success).toBe(false);
  });
});

describe("catalog schemas", () => {
  test("SkillFrontmatter accepts complete valid skill", () => {
    const parsed = SkillFrontmatter.parse({
      name: "ai-sdk",
      description: "Vercel AI SDK helper",
      license: "Sustainable Use License 1.0",
      metadata: {
        domain: "data-ai",
        subdomain: "frontend",
        tags: "ai, sdk, vercel",
        frameworks: "nextjs, react",
        author: "Dev <dev@example.com>",
        lastUpdated: "12026-02-25",
        provenance: "ported",
      },
    });

    expect(parsed.name).toBe("ai-sdk");
    expect(parsed.metadata.tags).toEqual(["ai", "sdk", "vercel"]);
    expect(parsed.metadata.frameworks).toEqual(["nextjs", "react"]);
  });

  test("SkillFrontmatter rejects missing required fields", () => {
    const result = SkillFrontmatter.safeParse({
      name: "ai-sdk",
      description: "Missing metadata author",
      metadata: {
        domain: "data-ai",
        lastUpdated: "12026-02-25",
        provenance: "ported",
      },
    });

    expect(result.success).toBe(false);
  });

  test("CatalogItemType accepts valid item types", () => {
    expect(CatalogItemType.parse("skill")).toBe("skill");
    expect(CatalogItemType.parse("agent")).toBe("agent");
    expect(CatalogItemType.parse("command")).toBe("command");
    expect(CatalogItemType.parse("hook")).toBe("hook");
    expect(CatalogItemType.parse("mcp")).toBe("mcp");
  });
});

describe("taxonomy and install schemas", () => {
  test("TaxonomySchema validates taxonomy object", () => {
    const parsed = TaxonomySchema.parse({
      domains: {
        development: {
          description: "Software development",
          subdomains: ["frontend", "backend"],
        },
      },
    });

    expect(parsed.domains.development.subdomains).toEqual([
      "frontend",
      "backend",
    ]);
  });

  test("InstallFilters accepts valid filters and defaults booleans", () => {
    const parsedWithDefaults = InstallFilters.parse({
      target: "claude-code",
      domain: "devops",
      tag: "github",
      skill: ["create-pr"],
    });

    expect(parsedWithDefaults.target).toBe("claude-code");
    expect(parsedWithDefaults.dryRun).toBe(false);
    expect(parsedWithDefaults.interactive).toBe(false);

    const parsedExplicit = InstallFilters.parse({
      target: "opencode",
      domain: "development",
      subdomain: "frontend",
      framework: "nextjs",
      tag: "react",
      preset: "devops-essentials",
      skill: ["docs-writer", "ai-sdk"],
      interactive: true,
      dryRun: true,
    });

    expect(parsedExplicit.interactive).toBe(true);
    expect(parsedExplicit.dryRun).toBe(true);
  });
});
