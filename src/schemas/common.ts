import { z } from "zod";

export const SkillName = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(64);

export const HoloceneDate = z.string().regex(/^1\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/);

export const Provenance = z.enum(["ported", "adapted", "synthesized", "original"]);

export const CommaSeparatedList = z.string().transform((s) =>
  s.split(",").map((t) => t.trim()).filter(Boolean)
);

export const AuthorField = z.string().min(1);

export const LicenseField = z.string().default("Sustainable Use License 1.0");

export const TargetTool = z.enum(["claude-code", "opencode", "cursor", "codex", "gemini"]);
export type TargetTool = z.infer<typeof TargetTool>;
