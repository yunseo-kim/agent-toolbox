import { describe, expect, test } from "bun:test";
import { parseFrontmatter } from "../../src/catalog/frontmatter.js";

describe("parseFrontmatter", () => {
  test("parses standard frontmatter with delimiters", () => {
    const input = [
      "---",
      "name: test-skill",
      "description: Test skill",
      "license: Sustainable Use License 1.0",
      "metadata:",
      "  domain: development",
      "  author: Dev <dev@example.com>",
      "  lastUpdated: 12026-02-25",
      "  provenance: original",
      "---",
      "# Body",
    ].join("\n");

    const parsed = parseFrontmatter(input);
    expect(parsed.frontmatter.name).toBe("test-skill");
    expect(parsed.body).toBe("# Body");
  });

  test("parses multiline YAML with folded scalar", () => {
    const input = [
      "---",
      "name: test-skill",
      "description: >",
      "  This is line one",
      "  and line two",
      "license: Sustainable Use License 1.0",
      "metadata:",
      "  domain: development",
      "  author: Dev <dev@example.com>",
      "  lastUpdated: 12026-02-25",
      "  provenance: original",
      "---",
      "Body text",
    ].join("\n");

    const parsed = parseFrontmatter(input);
    const description = String(parsed.frontmatter.description);

    expect(description).toContain("This is line one");
    expect(description).toContain("and line two");
  });

  test("returns body text after frontmatter", () => {
    const input = [
      "---",
      "name: body-check",
      "description: Body parser test",
      "license: Sustainable Use License 1.0",
      "metadata:",
      "  domain: development",
      "  author: Dev <dev@example.com>",
      "  lastUpdated: 12026-02-25",
      "  provenance: original",
      "---",
      "# Header",
      "Paragraph.",
    ].join("\n");

    const parsed = parseFrontmatter(input);
    expect(parsed.body).toBe("# Header\nParagraph.");
  });

  test("throws on missing frontmatter", () => {
    expect(() => parseFrontmatter("# No frontmatter\ncontent")).toThrow(
      "Missing YAML frontmatter",
    );
  });

  test("throws on incomplete frontmatter with single delimiter", () => {
    const input = [
      "---",
      "name: incomplete",
      "description: Missing closing delimiter",
      "# body",
    ].join("\n");

    expect(() => parseFrontmatter(input)).toThrow("Missing YAML frontmatter");
  });

  test("handles empty body after frontmatter", () => {
    const input = [
      "---",
      "name: empty-body",
      "description: Empty body test",
      "license: Sustainable Use License 1.0",
      "metadata:",
      "  domain: development",
      "  author: Dev <dev@example.com>",
      "  lastUpdated: 12026-02-25",
      "  provenance: original",
      "---",
    ].join("\n");

    const parsed = parseFrontmatter(input);
    expect(parsed.body).toBe("");
  });

  test("handles blank YAML block between delimiters", () => {
    const input = ["---", "", "---", "Body"].join("\n");

    expect(() => parseFrontmatter(input)).toThrow("Malformed YAML frontmatter");
  });

  test("throws on invalid YAML syntax", () => {
    const input = [
      "---",
      "name: test-skill",
      "metadata:",
      "  domain: development",
      "  invalid: [unclosed bracket",
      "---",
      "Body",
    ].join("\n");

    expect(() => parseFrontmatter(input)).toThrow("Malformed YAML frontmatter");
  });

  test("throws when YAML parses to non-object", () => {
    const input = ["---", "- item1", "- item2", "---", "Body"].join("\n");

    expect(() => parseFrontmatter(input)).toThrow(
      "Malformed YAML frontmatter: expected a key-value object",
    );
  });

  test("handles BOM (Byte Order Mark) at start of content", () => {
    const input = [
      "\uFEFF---",
      "name: bom-test",
      "description: BOM test",
      "license: Sustainable Use License 1.0",
      "metadata:",
      "  domain: development",
      "  author: Dev <dev@example.com>",
      "  lastUpdated: 12026-02-25",
      "  provenance: original",
      "---",
      "Body",
    ].join("\n");

    const parsed = parseFrontmatter(input);
    expect(parsed.frontmatter.name).toBe("bom-test");
    expect(parsed.body).toBe("Body");
  });
});
