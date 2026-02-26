import { z } from "zod";

export const ClaudeCodePluginManifest = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  skills: z.string().optional(),
  agents: z.string().optional(),
  commands: z.string().optional(),
  hooks: z.string().optional(),
});

export type ClaudeCodePluginManifest = z.infer<typeof ClaudeCodePluginManifest>;

export const ClaudeCodeHookEntry = z.object({
  type: z.enum(["command"]),
  command: z.string(),
});

export const ClaudeCodeHookMatcher = z.object({
  matcher: z.string(),
  hooks: z.array(ClaudeCodeHookEntry),
});

export const ClaudeCodeHooksConfig = z.object({
  hooks: z.record(z.string(), z.array(ClaudeCodeHookMatcher)),
});

export type ClaudeCodeHooksConfig = z.infer<typeof ClaudeCodeHooksConfig>;

export const OpenCodePluginConfig = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  instructions: z.array(z.string()).optional(),
});

export type OpenCodePluginConfig = z.infer<typeof OpenCodePluginConfig>;

export const CursorPluginManifest = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  skills: z.string().optional(),
  agents: z.string().optional(),
  commands: z.string().optional(),
  hooks: z.string().optional(),
});

export type CursorPluginManifest = z.infer<typeof CursorPluginManifest>;

export const CodexAgentConfig = z.object({
  display_name: z.string().optional(),
  icon: z.string().optional(),
  brand_color: z.string().optional(),
  policy: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
});

export type CodexAgentConfig = z.infer<typeof CodexAgentConfig>;

export const GeminiMcpServer = z.object({
  command: z.string(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
  cwd: z.string().optional(),
});

export const GeminiExtensionManifest = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  contextFileName: z.string().optional(),
  skills: z.string().optional(),
  commands: z.string().optional(),
  hooks: z.string().optional(),
  mcpServers: z.record(z.string(), GeminiMcpServer).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export type GeminiExtensionManifest = z.infer<typeof GeminiExtensionManifest>;
