import { z } from "zod";
import {
  SkillName,
  HoloceneDate,
  Provenance,
  CommaSeparatedList,
  AuthorField,
  LicenseField,
} from "./common.js";

export const SkillMetadata = z.object({
  domain: z.string(),
  subdomain: z.string().optional(),
  tags: CommaSeparatedList.optional(),
  frameworks: CommaSeparatedList.optional(),
  author: AuthorField,
  lastUpdated: HoloceneDate,
  provenance: Provenance,
});

export const SkillFrontmatter = z.object({
  name: SkillName,
  description: z.string().max(1024),
  license: LicenseField,
  metadata: SkillMetadata,
});

export type SkillFrontmatter = z.infer<typeof SkillFrontmatter>;

export const ParsedSkill = z.object({
  frontmatter: SkillFrontmatter,
  body: z.string(),
  dirName: z.string(),
  filePath: z.string(),
  hasNotice: z.boolean(),
  hasReferences: z.boolean(),
  hasScripts: z.boolean(),
  hasAssets: z.boolean(),
  additionalEntries: z.array(z.string()).default([]),
});

export type ParsedSkill = z.infer<typeof ParsedSkill>;

export const AgentMetadata = z.object({
  domain: z.string(),
  subdomain: z.string().optional(),
  tags: CommaSeparatedList.optional(),
  author: AuthorField,
  lastUpdated: HoloceneDate,
  provenance: Provenance,
});

export const AgentFrontmatter = z.object({
  name: SkillName,
  description: z.string().max(1024),
  license: LicenseField,
  metadata: AgentMetadata,
});

export type AgentFrontmatter = z.infer<typeof AgentFrontmatter>;

export const CommandMetadata = z.object({
  domain: z.string(),
  subdomain: z.string().optional(),
  tags: CommaSeparatedList.optional(),
  author: AuthorField,
  lastUpdated: HoloceneDate,
  provenance: Provenance,
});

export const CommandFrontmatter = z.object({
  name: SkillName,
  description: z.string().max(1024),
  license: LicenseField,
  trigger: z.string().regex(/^\/[a-z0-9-]+$/),
  metadata: CommandMetadata,
});

export type CommandFrontmatter = z.infer<typeof CommandFrontmatter>;

export const HookEvent = z.enum([
  "SessionStart",
  "SessionEnd",
  "BeforeTool",
  "AfterTool",
  "BeforeModel",
  "AfterModel",
  "Notification",
  "Stop",
  "SubagentStart",
  "SubagentEnd",
  "PreToolExecution",
]);

export const HookMetadata = z.object({
  domain: z.string(),
  subdomain: z.string().optional(),
  tags: CommaSeparatedList.optional(),
  author: AuthorField,
  lastUpdated: HoloceneDate,
  provenance: Provenance,
});

export const HookFrontmatter = z.object({
  name: SkillName,
  description: z.string().max(1024),
  license: LicenseField,
  events: z.array(HookEvent),
  type: z.enum(["command", "script", "module"]),
  metadata: HookMetadata,
});

export type HookFrontmatter = z.infer<typeof HookFrontmatter>;

export const McpTransport = z.enum(["stdio", "sse", "streamable-http"]);

export const McpMetadata = z.object({
  domain: z.string(),
  subdomain: z.string().optional(),
  tags: CommaSeparatedList.optional(),
  author: AuthorField,
  lastUpdated: HoloceneDate,
  provenance: Provenance,
});

export const McpServerFrontmatter = z.object({
  name: SkillName,
  description: z.string().max(1024),
  license: LicenseField,
  transport: McpTransport,
  command: z.string(),
  args: z.array(z.string()).default([]),
  env: z.record(z.string(), z.string()).optional(),
  metadata: McpMetadata,
});

export type McpServerFrontmatter = z.infer<typeof McpServerFrontmatter>;

export const CatalogItemType = z.enum(["skill", "agent", "command", "hook", "mcp"]);

export const CatalogIndexEntry = z.object({
  name: z.string(),
  type: CatalogItemType,
  description: z.string(),
  domain: z.string(),
  subdomain: z.string().optional(),
  tags: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  provenance: Provenance,
  author: z.string(),
  lastUpdated: z.string(),
  license: z.string(),
  path: z.string(),
});

export type CatalogIndexEntry = z.infer<typeof CatalogIndexEntry>;

export const CatalogIndex = z.object({
  version: z.literal(1),
  generatedAt: z.string(),
  items: z.array(CatalogIndexEntry),
});

export type CatalogIndex = z.infer<typeof CatalogIndex>;
