import { parse as parseYaml } from "yaml";

export interface ParsedFrontmatter {
  frontmatter: Record<string, unknown>;
  body: string;
}

const FRONTMATTER_REGEX = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

export function parseFrontmatter(content: string): ParsedFrontmatter {
  const normalized = content.startsWith("\uFEFF") ? content.slice(1) : content;
  const match = normalized.match(FRONTMATTER_REGEX);

  if (!match) {
    throw new Error(
      "Missing YAML frontmatter. Expected content to start with '---'.",
    );
  }

  const [, yamlBlock] = match;
  const body = normalized.slice(match[0].length);

  let parsed: unknown;

  try {
    parsed = parseYaml(yamlBlock);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Malformed YAML frontmatter: ${reason}`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Malformed YAML frontmatter: expected a key-value object.");
  }

  return {
    frontmatter: parsed as Record<string, unknown>,
    body,
  };
}
