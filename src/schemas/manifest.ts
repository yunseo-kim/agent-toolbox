// Inspired by vercel-labs/skills CLI (MIT license).
// Implementation is original, adapted for agent-toolbox's catalog-based architecture.

import { z } from "zod";
import { TargetTool } from "./common.js";

export const InstallManifestSkill = z.object({
  name: z.string(),
  domain: z.string(),
  subdomain: z.string().optional(),
  lastUpdated: z.string(),
});
export type InstallManifestSkill = z.infer<typeof InstallManifestSkill>;

export const InstallManifestFilters = z.object({
  domain: z.string().optional(),
  subdomain: z.string().optional(),
  framework: z.string().optional(),
  tag: z.string().optional(),
  preset: z.string().optional(),
  skill: z.array(z.string()).optional(),
});
export type InstallManifestFilters = z.infer<typeof InstallManifestFilters>;

export const InstallManifest = z.object({
  version: z.literal(1),
  target: TargetTool,
  installedAt: z.string(),
  catalogSource: z.enum(["local", "remote"]),
  filters: InstallManifestFilters,
  skills: z.array(InstallManifestSkill),
});
export type InstallManifest = z.infer<typeof InstallManifest>;
