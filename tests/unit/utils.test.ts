import { describe, expect, test } from "bun:test";
import {
  parseArgs,
  formatTable,
  green,
  red,
  bold,
  dim,
  cyan,
} from "../../src/cli/utils.js";

describe("parseArgs", () => {
  test("parses simple key-value pairs", () => {
    const result = parseArgs(["--target", "claude-code", "--domain", "devops"]);
    expect(result.target).toBe("claude-code");
    expect(result.domain).toBe("devops");
  });

  test("handles boolean flags (no value)", () => {
    const result = parseArgs(["--dry-run", "--offline"]);
    expect(result["dry-run"]).toBe("true");
    expect(result.offline).toBe("true");
  });

  test("handles boolean flag followed by another flag", () => {
    const result = parseArgs(["--dry-run", "--target", "gemini"]);
    expect(result["dry-run"]).toBe("true");
    expect(result.target).toBe("gemini");
  });

  test("accumulates --skill into array", () => {
    const result = parseArgs([
      "--skill",
      "ai-sdk",
      "--skill",
      "docs-writer",
      "--skill",
      "create-pr",
    ]);
    expect(result.skill).toEqual(["ai-sdk", "docs-writer", "create-pr"]);
  });

  test("single --skill is an array", () => {
    const result = parseArgs(["--skill", "ai-sdk"]);
    expect(Array.isArray(result.skill)).toBe(true);
    expect(result.skill).toEqual(["ai-sdk"]);
  });

  test("--skill without value creates empty array", () => {
    const result = parseArgs(["--skill"]);
    expect(Array.isArray(result.skill)).toBe(true);
    expect(result.skill).toEqual([]);
  });

  test("ignores non-flag arguments", () => {
    const result = parseArgs(["find", "react", "--domain", "development"]);
    expect(result.domain).toBe("development");
    expect(result.find).toBeUndefined();
  });

  test("returns empty object for empty argv", () => {
    const result = parseArgs([]);
    expect(result).toEqual({});
  });

  test("handles mixed flags and values", () => {
    const result = parseArgs([
      "--target",
      "opencode",
      "--dry-run",
      "--domain",
      "devops",
      "--refresh",
    ]);
    expect(result.target).toBe("opencode");
    expect(result["dry-run"]).toBe("true");
    expect(result.domain).toBe("devops");
    expect(result.refresh).toBe("true");
  });
});

describe("formatTable", () => {
  test("formats a basic table with headers and rows", () => {
    const result = formatTable(
      ["Name", "Domain"],
      [
        ["ai-sdk", "data-ai"],
        ["create-pr", "devops"],
      ],
    );
    const lines = result.split("\n");
    expect(lines).toHaveLength(4); // header + separator + 2 data rows
  });

  test("handles empty rows", () => {
    const result = formatTable(["Name", "Domain"], []);
    const lines = result.split("\n");
    expect(lines).toHaveLength(2); // header + separator only
  });

  test("truncates long cells with maxColWidth", () => {
    const longText = "a".repeat(100);
    const result = formatTable(["Name"], [[longText]], { maxColWidth: 20 });
    // The truncated text should end with "..."
    const dataLine = result.split("\n")[2];
    expect(dataLine).toContain("...");
  });

  test("respects custom padding", () => {
    const result = formatTable(["A", "B"], [["x", "y"]], { padding: 4 });
    // With padding=4, columns should be separated by 4 spaces
    const dataLine = result.split("\n")[2];
    expect(dataLine).toContain("    ");
  });

  test("handles ANSI-colored content in width calculation", () => {
    const result = formatTable(
      ["Name", "Status"],
      [
        [green("ok"), "active"],
        ["test", red("fail")],
      ],
    );
    // Should not crash and should produce aligned output
    const lines = result.split("\n");
    expect(lines).toHaveLength(4);
  });

  test("single column table works", () => {
    const result = formatTable(["Name"], [["alpha"], ["beta"], ["gamma"]]);
    const lines = result.split("\n");
    expect(lines).toHaveLength(5); // header + separator + 3 rows
  });
});

describe("ANSI color functions", () => {
  test("green wraps text with ANSI codes", () => {
    const result = green("ok");
    expect(result).toContain("ok");
    expect(result).toContain("\x1b[32m");
    expect(result).toContain("\x1b[0m");
  });

  test("red wraps text with ANSI codes", () => {
    const result = red("error");
    expect(result).toContain("error");
    expect(result).toContain("\x1b[31m");
  });

  test("bold wraps text with ANSI codes", () => {
    const result = bold("title");
    expect(result).toContain("title");
    expect(result).toContain("\x1b[1m");
  });

  test("dim wraps text with ANSI codes", () => {
    const result = dim("note");
    expect(result).toContain("note");
    expect(result).toContain("\x1b[2m");
  });

  test("cyan wraps text with ANSI codes", () => {
    const result = cyan("info");
    expect(result).toContain("info");
    expect(result).toContain("\x1b[36m");
  });
});
